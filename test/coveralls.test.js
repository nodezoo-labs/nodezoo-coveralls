'use strict'

const Code = require('code')
const Lab = require('lab')
const Seneca = require('seneca')
var _ = require('lodash')

const Proxyquire = require('proxyquire')
const NpmSenecaFakeData = require('./npm-data')
const CoverallsSenecaFakeData = require('./coveralls-data')
const InvalidPluginName = 'qwerty_qwerty'

const lab = exports.lab = Lab.script()
const describe = lab.describe
const before = lab.before
const it = lab.it
const expect = Code.expect

const NpmRegistry = 'http://registry.npmjs.org/'

var RequestMap = []

const RequestProxy = {
  request: {
    get: (opts, done) => {
      const request = _.find(RequestMap, o => opts.url.includes(o.urlMatch))
      if (request) {
        done(request.err, request.response, request.body)
      }
      else {
        done(new Error('invalid request error'), null, null)
      }
    }
  }
}

const Coveralls = Proxyquire('..', RequestProxy)

function createInstance () {
  return Seneca({log: 'silent'})
    .use('entity')
    .use(Coveralls, {
      registry: NpmRegistry,
      url: 'https://coveralls.io/'
    })
}

process.setMaxListeners(12)

const si = createInstance()

describe('nodezoo-coveralls suite tests ', function () {
  const DefaultRequestMap = [
    {
      urlMatch: NpmRegistry + 'seneca',
      err: null,
      response: {},
      body: JSON.stringify(NpmSenecaFakeData)
    },
    {
      urlMatch: 'coveralls.io',
      err: null,
      response: {},
      body: JSON.stringify(CoverallsSenecaFakeData)
    }
  ]

  before({}, function (done) {
    si.ready(function (err) {
      if (err) {
        return process.exit(!console.error(err))
      }
      done()
    })
  })

  describe('Valid "role:coveralls,cmd:get" calls', () => {
    it('test non cached valid response', function (done) {
      const payload = { 'name': 'seneca' }
      RequestMap = DefaultRequestMap.slice()
      si.act('role:coveralls,cmd:get', payload, function (err, reply) {
        expect(err).to.not.exist()
        expect(reply.ok).to.be.true()
        expect(reply.data.name).to.equal(payload.name)
        expect(reply.data.coveredPercent).to.be.a.number()
        expect(reply.data.coverageChange).to.be.a.number()
        expect(reply.data.badgeUrl).to.exist()
        expect(reply.data.cached).to.exist()

        done(err)
      })
    })

    it('test cached valid response', function (done) {
      const payload = { 'name': 'seneca' }
      RequestMap = DefaultRequestMap.slice()

      si.act('role:coveralls,cmd:get', payload, function (err, reply) {
        expect(err).to.not.exist()

        const cachedOne = reply.cached

        si.act('role:coveralls,cmd:get', payload, (err, reply) => {
          expect(err).to.not.exist()

          const cachedTwo = reply.cached

          expect(cachedOne).to.equal(cachedTwo)
          done()
        })
      })
    })

    it('test non-cached valid reponse - update flag', (done) => {
      const payload = {name: 'seneca'}
      RequestMap = DefaultRequestMap.slice()

      si.act('role:coveralls,cmd:get', payload, (err, reply) => {
        expect(err).to.not.exist()

        const cachedOne = reply.data.cached
        payload.update = true

        si.act('role:coveralls,cmd:get', payload, (err, reply) => {
          expect(err).to.not.exist()

          const cachedTwo = reply.data.cached

          expect(cachedOne).to.be.below(cachedTwo)

          done()
        })
      })
    })
  })

  describe('An invalid "role:coveralls,cmd:get" call', () => {
    it('has an error and no data', (done) => {
      const seneca = createInstance()
      const payload = {name: InvalidPluginName}
      const invalidPluginMap = {
        urlMatch: InvalidPluginName,
        err: null,
        response: {},
        body: '{}'
      }

      seneca.ready(function () {
        RequestMap = _.concat(DefaultRequestMap, invalidPluginMap)
        seneca.act('role:coveralls,cmd:get', payload, (err, reply) => {
          expect(err).to.not.exist()
          expect(reply.ok).to.be.false()
          expect(reply.err).to.exist()

          done()
        })
      })
    })
  })

  describe('Valid "role:info,req:part" calls', () => {
    it('has no error and has data', (done) => {
      const seneca = createInstance()
      const payload = {name: 'seneca'}

      seneca.ready(function () {
        RequestMap = DefaultRequestMap.slice()
        seneca.act('role:info,req:part', payload, (err, reply) => {
          expect(err).to.not.exist()
          expect(reply.ok).to.be.true()

          done()
        })
      })
    })

    it('responds via "role:info,res:part"', (done) => {
      const seneca = createInstance()
      const payload = {name: 'seneca'}

      seneca.ready(function () {
        RequestMap = DefaultRequestMap.slice()
        seneca.add('role:info,res:part', (msg, cb) => {
          expect(msg).to.exist()

          cb()
          done()
        })

        seneca.act('role:info,req:part', payload, (err, reply) => {
          expect(err).to.not.exist()
          expect(reply).to.exist()
          expect(reply.ok).to.be.true()
        })
      })
    })
  })
})
