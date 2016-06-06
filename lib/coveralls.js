'use strict'

var Request = require('request')
var GitUrlParse = require('parse-github-url')

var opts = {
}

module.exports = function (options) {
  var seneca = this

  opts = seneca.util.deepextend(opts, options)
  opts.cache = seneca.make$('coveralls_cache')
  opts.cache.load$()

  seneca.add('role:coveralls,cmd:get', cmdGet)
  seneca.add('role:info,req:part', aliasGet)

  return {
    name: 'nodezoo-coveralls'
  }
}

function cmdGet (msg, done) {
  let cache = opts.cache
  let registry = opts.registry + msg.name
  let context = this

  cache.load$(msg.name, (err, cached) => {
    if (err) {
      context.log.debug(`Cannot load from cache module ${msg.name}, try now to get it remotely`)
    }

    if (cached && !msg.update) {
      return done(null, {ok: true, data: cached.data$(cached)})
    }

    Request.get({url: registry, gzip: true}, (err, res, body) => {
      if (err) {
        return done(null, {ok: false, err: err})
      }

      var data = null

      try {
        data = JSON.parse(body)
      }
      catch (e) {
        return done(null, {ok: false, err: e})
      }

      var distTags = data['dist-tags'] || {}
      var latest = ((data.versions || {})[distTags.latest]) || {}
      var repository = latest.repository || {}
      var url = repository.url || ''

      var gitInfo = GitUrlParse(url)
      if (!gitInfo) {
        return done(null, {ok: false, err: 'Cannot parse url'})
      }
      gitInfo.cached = cached

      queryCoveralls(gitInfo, done)
    })
  })
}

function queryCoveralls (gitInfo, done) {
  var cache = opts.cache
  var gitUrl = gitInfo.host.slice(0, gitInfo.host.indexOf('.'))
  var registry = opts.url + gitUrl + '/' + gitInfo.repo + '.json'

  Request.get({url: registry, gzip: true}, (err, res, body) => {
    if (err) {
      return done(null, {ok: false, err: err})
    }

    var coverallsData = null

    try {
      coverallsData = JSON.parse(body)
    }
    catch (e) {
      return done(null, {ok: false, err: e})
    }
    var data = {
      name: gitInfo.name,
      coverageChange: coverallsData.coverage_change,
      coveredPercent: coverallsData.covered_percent,
      badgeUrl: coverallsData.badge_url,
      cached: Date.now()
    }

    function complete (err, entity) {
      if (err) {
        return done(null, {ok: false, err: err})
      }
      else {
        return done(null, {ok: true, data: entity && entity.data$(entity)})
      }
    }

    if (gitInfo.cached) {
      gitInfo.cached.data$(data).save$(complete)
    }
    else {
      data.id$ = gitInfo.name
      cache.make$(data).save$(complete)
    }
  })
}

function aliasGet (msg, done) {
  var seneca = this
  var payload = {name: msg.name}

  seneca.act('role:coveralls,cmd:get', payload, (err, res) => {
    if (err) {
      return done(null, {ok: false, err: err})
    }

    if (res && res.ok) {
      payload.data = res.data
      seneca.act('role:info,res:part,part:coveralls', payload)
    }
    done(null, {ok: true})
  })
}
