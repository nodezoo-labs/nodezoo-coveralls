'use strict'

const Request = require('request')
const GitUrlParse = require('parse-github-url')

let opts = {
}

module.exports = function (options) {
  const seneca = this

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
    // $lab:coverage:off$
    if (err) {
      context.log.debug(`Cannot load from cache module ${msg.name}, try now to get it remotely`)
    }
    // $lab:coverage:on$

    if (cached && !msg.update) {
      return done(null, {ok: true, data: cached.data$(cached)})
    }

    Request.get({url: registry, gzip: true}, (err, res, body) => {
      if (err) {
        return done(null, {ok: false, err: err})
      }

      let data = null

      try {
        data = JSON.parse(body)
      }
      catch (e) {
        return done(null, {ok: false, err: e})
      }

      const distTags = data['dist-tags'] || {}
      const latest = ((data.versions || {})[distTags.latest]) || {}
      const repository = latest.repository || {}
      const url = repository.url || ''

      const gitInfo = GitUrlParse(url)
      if (!gitInfo) {
        return done(null, {ok: false, err: 'Cannot parse url'})
      }
      gitInfo.cached = cached

      queryCoveralls(gitInfo, done)
    })
  })
}

function queryCoveralls (gitInfo, done) {
  const cache = opts.cache
  const gitUrl = gitInfo.host.slice(0, gitInfo.host.indexOf('.'))
  const registry = opts.url + gitUrl + '/' + gitInfo.repo

  Request.get({url: registry + '.json', gzip: true}, (err, res, body) => {
    if (err) {
      return done(null, {ok: false, err: err})
    }
    if (res && res.statusCode && res.statusCode !== 200) {
      return done(null, {ok: false, err: 'Coverall request not successful'})
    }

    let coverallsData = null

    try {
      coverallsData = JSON.parse(body)
    }
    catch (e) {
      return done(null, {ok: false, err: e})
    }
    const data = {
      name: gitInfo.name,
      url: registry,
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
  const seneca = this
  const payload = {name: msg.name}

  seneca.act(`role:coveralls,cmd:get,update:${msg.update || false}`, payload, (err, res) => {
    if (err) {
      return done(null, {ok: false, err: err})
    }

    if (res && res.ok) {
      payload.data = res.data
      seneca.act('role:info,res:part,part:coveralls', payload)
    }

    done(null, res)
  })
}
