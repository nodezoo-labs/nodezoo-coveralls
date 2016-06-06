'use strict'

var Code = require('code')
var Lab = require('lab')
var Seneca = require('seneca')

var lab = exports.lab = Lab.script()
var describe = lab.describe
var suite = lab.suite
var before = lab.before
var it = lab.it
var expect = Code.expect

function createInstance () {
  return Seneca({log: 'silent'})
    .use('entity')
    .use('../lib/coveralls', {
      registry: 'http://registry.npmjs.org/',
      url: 'https://coveralls.io/'
    })
}

process.setMaxListeners(12)

var si = createInstance()

suite('nodezoo-coveralls suite tests ', function () {
  before({}, function (done) {
    si.ready(function (err) {
      if (err) {
        return process.exit(!console.error(err))
      }
      done()
    })
  })
})

describe('Valid "role:coveralls,cmd:get" calls', () => {
  it('test non cached valid response', function (done) {
    var payload = { 'name': 'seneca' }
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
    var payload = { 'name': 'seneca' }
    si.act('role:coveralls,cmd:get', payload, function (err, reply) {
      expect(err).to.not.exist()

      var cachedOne = reply.cached

      si.act('role:coveralls,cmd:get', payload, (err, reply) => {
        expect(err).to.not.exist()

        var cachedTwo = reply.cached

        expect(cachedOne).to.equal(cachedTwo)
        done()
      })
    })
  })

  it('test non-cached valid reponse - update flag', (done) => {
    var payload = {name: 'seneca'}

    si.act('role:coveralls,cmd:get', payload, (err, reply) => {
      expect(err).to.not.exist()

      var cachedOne = reply.data.cached
      payload.update = true

      si.act('role:coveralls,cmd:get', payload, (err, reply) => {
        expect(err).to.not.exist()

        var cachedTwo = reply.data.cached

        expect(cachedOne).to.be.below(cachedTwo)

        done()
      })
    })
  })
})

describe('An invalid "role:github,cmd:get" call', () => {
  it('has an error and no data', (done) => {
    var seneca = createInstance()
    var payload = {name: 'qwerty_qwerty'}

    seneca.ready(function () {
      seneca.act('role:coveralls,cmd:get', payload, (err, reply) => {
        expect(err).to.not.exist()
        expect(reply.ok).to.be.false()
        expect(reply.err).to.exist()

        done()
      })
    })
  })
})

describe('A valid "role:info,req:part" call', () => {
  it('has no error and has data', (done) => {
    var seneca = createInstance()
    var payload = {name: 'seneca'}

    seneca.ready(function () {
      seneca.act('role:info,req:part', payload, (err, reply) => {
        expect(err).to.not.exist()
        expect(reply.ok).to.be.true()

        done()
      })
    })
  })

  it('responds via "role:info,res:part"', (done) => {
    var seneca = createInstance()
    var payload = {name: 'seneca'}

    seneca.ready(function () {
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
