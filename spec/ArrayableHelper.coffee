chai = require 'chai'

ArrayableHelper = require '../lib/ArrayableHelper'
# noflo = require 'noflo'

describe 'ArrayableHelper noflo helper', ->
  it 'should be a function', ->
    chai.expect(ArrayableHelper).to.be.a.function

    