chai = require 'chai'

ArrayableHelper = require '../lib/ArrayableHelper'
MakePoint = require './fixtures/MakePoint'
noflo = require 'noflo'

describe 'ArrayableHelper noflo helper', ->
  it 'should be a function', ->
    chai.expect(ArrayableHelper).to.be.a.function
  describe 'With a NoFlo component', ->
    c = null
    it 'should be instantiable', (done) ->
      c = MakePoint.getComponent()
      chai.expect(c).to.be.an 'object'
      done()
    it 'should have produced expected inports', (done) ->
      chai.expect(c.inPorts.ports).to.have.keys ['x', 'y']
      done()
    it 'should have produced expected outports', (done) ->
      chai.expect(c.outPorts.ports).to.have.keys ['point']
      done()
    describe 'running the component', ->
      x = null
      y = null
      point = null
      beforeEach ->
        x = noflo.internalSocket.createSocket()
        y = noflo.internalSocket.createSocket()
        point = noflo.internalSocket.createSocket()
        c.inPorts.x.attach x
        c.inPorts.y.attach y
        c.outPorts.point.attach point
      afterEach ->
        c.inPorts.x.detach x
        c.inPorts.y.detach y
        c.outPorts.point.detach point
      it 'should produce expected output', (done) ->
        point.on 'ip', (ip) ->
          chai.expect(ip.type).to.equal 'data'
          data = ip.data
          chai.expect(data.x).to.equal 5
          chai.expect(data.y).to.equal 10
          done()
        x.send 5
        y.send 10
