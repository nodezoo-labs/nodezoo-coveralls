'use strict'

var Request = require('request')
var GitUrlParse = require("git-url-parse")

var opts = {
}

module.exports = function (options) {
  var seneca = this

  opts = seneca.util.deepextend(opts, options)
  opts.cache = seneca.make$('coveralls_cache')
  // opts.cache.load$()

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

      console.log('####url: ', url)
      var gitInfo = GitUrlParse(url)
      gitInfo.cached = cached
      console.log('####gitInfo ', gitInfo)
      // if (gitInfo) {
      //   return done(null, {ok: false, err: 'Cannot parse url'})
      // }

      queryCoveralls(gitInfo, done)
    })
  })
}

function queryCoveralls (gitInfo, done) {
  var cache = opts.cache
  var gitUrl = gitInfo.source.slice(0, gitInfo.source.indexOf('.'))
  console.log('gitUrl ', gitUrl)
  var registry = opts.url + gitUrl + '/' + gitInfo.full_name + '.json'

  console.log('coveralls registry: ', registry)

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
    console.log('coveralls data: ', coverallsData)
    var data = {
      name: gitInfo.name,
      coverageChange: data.coverageChange,
      coveragePercent: data.coveragePercent,
      badgeUrl: data.badge_url,
      cached: Date.now()
    }

    console.log('coveralls answer: ', data)

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
