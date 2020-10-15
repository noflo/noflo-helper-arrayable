/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const chai = require('chai');

const noflo = require('noflo');
const ArrayableHelper = require('../lib/ArrayableHelper');
const MakePoint = require('./fixtures/MakePoint');

describe('ArrayableHelper noflo helper', () => {
  it('should be a function', () => chai.expect(ArrayableHelper).to.be.a('function'));
  return describe('With a NoFlo component', () => {
    let c = null;
    it('should be instantiable', (done) => {
      c = MakePoint.getComponent();
      chai.expect(c).to.be.an('object');
      return done();
    });
    it('should have produced expected inports', (done) => {
      chai.expect(c.inPorts.ports).to.have.keys(['x', 'y']);
      return done();
    });
    it('should have produced expected outports', (done) => {
      chai.expect(c.outPorts.ports).to.have.keys(['point']);
      return done();
    });
    return describe('running the component', () => {
      let x = null;
      let y = null;
      let point = null;
      beforeEach(() => {
        x = noflo.internalSocket.createSocket();
        y = noflo.internalSocket.createSocket();
        point = noflo.internalSocket.createSocket();
        c.inPorts.x.attach(x);
        c.inPorts.y.attach(y);
        return c.outPorts.point.attach(point);
      });
      afterEach(() => {
        c.inPorts.x.detach(x);
        c.inPorts.y.detach(y);
        return c.outPorts.point.detach(point);
      });
      return it('should produce expected output', (done) => {
        point.on('ip', (ip) => {
          chai.expect(ip.type).to.equal('data');
          const {
            data,
          } = ip;
          chai.expect(data.x).to.equal(5);
          chai.expect(data.y).to.equal(10);
          return done();
        });
        x.send(5);
        return y.send(10);
      });
    });
  });
});
