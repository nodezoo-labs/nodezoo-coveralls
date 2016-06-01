'use strict'

var Seneca = require('seneca')
var Entities = require('seneca-entity')
var Mesh = require('seneca-mesh')
var Coveralls = require('../lib/coveralls')
var RedisStore = require('seneca-redis-store')

var envs = process.env
var opts = {
  seneca: {
    tag: envs.COVERALLS_TAG || 'nodezoo-coveralls'
  },
  coveralls: {
    token: envs.COVERALLS_TOKEN || 'NO_TOKEN',
    registry: envs.COVERALLS_REGISTRY || 'https://coveralls.com/'
  },
  mesh: {
    auto: true,
    listen: [
      {pin: 'role:coveralls,cmd:get', model: 'consume'},
      {pin: 'role:info,req:part', model: 'observe'}
    ]
  },
  isolated: {
    host: envs.COVERALLS_HOST || 'localhost',
    port: envs.COVERALLS_PORT || '8054'
  },
  redis: {
    host: envs.COVERALLS_REDIS_HOST || 'localhost',
    port: envs.COVERALLS_REDIS_PORT || '6379'
  }
}

var Service = Seneca(opts.seneca)

Service.use(Entities)

if (envs.COVERALLS_ISOLATED) {
  Service.listen(opts.isolated)
}
else {
  Service.use(Mesh, opts.mesh)
  Service.use(RedisStore, opts.redis)
}

Service.use(Coveralls, opts.coveralls)
