'use strict'

const Seneca = require('seneca')
const Entities = require('seneca-entity')
const Mesh = require('seneca-mesh')
const Coveralls = require('../lib/coveralls')
const RedisStore = require('seneca-redis-store')

const envs = process.env
const opts = {
  seneca: {
    tag: envs.COVERALLS_TAG || 'nodezoo-coveralls',
    log: 'none'
  },
  coveralls: {
    registry: envs.NPM_REGISTRY || 'http://registry.npmjs.org/',
    url: envs.COVERALLS_REGISTRY || 'https://coveralls.io/'
  },
  mesh: {
    auto: true,
    host: envs.COVERALLS_HOST || '127.0.0.1',
    bases: [envs.BASE_HOST || '127.0.0.1:39999'],
    listen: [
      {pin: 'role:coveralls,cmd:get', model: 'consume', host: envs.COVERALLS_HOST || '127.0.0.1'},
      {pin: 'role:info,req:part', model: 'observe', host: envs.COVERALLS_HOST || '127.0.0.1'}
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

const Service = Seneca(opts.seneca)

Service.use(Entities)

if (envs.COVERALLS_ISOLATED) {
  Service.listen(opts.isolated)
}
else {
  Service.use(Mesh, opts.mesh)
  Service.use(RedisStore, opts.redis)
}

Service.use(Coveralls, opts.coveralls)
