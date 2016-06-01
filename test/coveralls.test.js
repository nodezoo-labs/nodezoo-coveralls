'use strict'

var Code = require('code')
var Lab = require('lab')
var Seneca = require('seneca')
var _ = require('lodash')

var lab = exports.lab = Lab.script()
var describe = lab.describe
var suite = lab.suite
var before = lab.before
var it = lab.it
var expect = Code.expect

function createInstance () {
  return Seneca({log: 'silent'})
    .use('entity')
    .use('../lib/coveralls')
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
