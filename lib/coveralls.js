'use strict'

var Request = require('request')

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
  let registry = opts.coveralls.registry + msg.name
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

      // var data = null

      try {
        data = JSON.parse(body)
      }
      catch (e) {
        return done(null, {ok: false, err: e})
      }

      // ...
    })
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
