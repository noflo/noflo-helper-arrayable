/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const noflo = require('noflo');
const ArrayableHelper = require('../../lib/ArrayableHelper');

class MakePoint extends noflo.Component {
  static initClass() {
    this.prototype.description = 'Creates a point or points';
    this.prototype.icon = 'crosshairs';
  }

  constructor() {
    super();
    const ports = {
      x: {
        datatype: 'number',
        required: true,
      },
      y: {
        datatype: 'number',
        required: true,
      },
    };

    ArrayableHelper(this, 'point', ports);
  }
}
MakePoint.initClass();

exports.getComponent = () => new MakePoint();
