/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS203: Remove `|| {}` from converted for-own loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ArrayableHelper;
const noflo = require('noflo');

// Generates an unique ID
// (http://coffeescriptcookbook.com/chapters/strings/generating-a-unique-id)
const uniqueId = function (length) {
  if (length == null) { length = 8; }
  let id = '';
  while (id.length < length) { id += Math.random().toString(36).substr(2); }
  return id.substr(0, length);
};

module.exports = (ArrayableHelper = function (component, type, ports, options) {
  if (options == null) { options = {}; }
  const c = component;
  c.inPorts = new noflo.InPorts(ports);
  c.outPorts = new noflo.OutPorts();
  c.outPorts.add(type,
    { datatype: 'object' });
  c.props = {};
  c.tearDown = function (callback) {
    const props = {};
    return callback();
  };

  c.forwardBrackets = {};

  const prepareProps = function () {
    const props = { type };
    props.id = uniqueId();
    // Copy defaults
    for (const name of Object.keys(ports || {})) {
      const port = ports[name];
      if (port.addressable === true) {
        // Set up empty array
        props[name] = [];
        continue;
      }
      if ((port.value != null) || (port.required !== false)) {
        props[name] = port.value;
      }
    }
    return props;
  };

  const setProperty = function (props, name, data, output) { // this is bound, so use -> not =>
    props[name] = data;
    const result = compute.bind(component)(props);
    if (!result) { return; }
    return output.send(result);
  };

  const setPropertyIndexed = function (props, name, data, i, output) {
    props[name][i] = data;
    const result = compute.bind(component)(props);
    if (!result) { return; }
    return output.send(result);
  };

  var compute = options.compute || component.compute || function (props) {
    let out = {};
    for (const name of Object.keys(props || {})) {
      // Flatten array port if needed
      const prop = props[name];
      if ((c.inPorts[name] != null) && c.inPorts[name].options.addressable) {
        out[name] = expandToArray(prop);
      } else {
        out[name] = prop;
      }
    }
    // Flatten output if needed
    out = expandToArray(out);
    return out;
  };

  // If any property of object is array, expand to a collection and fill rest
  var expandToArray = options.expandToArray || function (props) {
    let name; let
      prop;
    let length = 0;
    let keys = Object.keys(props);
    for (name of Array.from(keys)) {
      prop = props[name];
      // Short circuit with empty prop
      if (prop == null) { return null; }
      // See if any prop is an array
      if (prop instanceof Array) {
        // Short circuit with empty array
        if (!(prop.length > 0)) { return null; }
        if (length < prop.length) {
          ({
            length,
          } = prop);
        }
      }
    }
    if (length === 0) {
      // No arrays, return props as given
      return props;
    }
    if (length > 0) {
      // At least one prop is an array, so we need to output an array
      const arr = [];
      for (let i = 0, end = length, asc = end >= 0; asc ? i < end : i > end; asc ? i++ : i--) {
        var obj;
        if (props instanceof Array) {
          obj = [];
        } else {
          obj = {};
          obj.type = props.type;
          obj.id = props.id;
        }
        keys = Object.keys(props);
        for (name of Array.from(keys)) {
          prop = props[name];
          // for own name, prop of props
          if (prop instanceof Array) {
            obj[name] = (prop[i] != null) ? prop[i] : prop[i % prop.length];
          } else {
            obj[name] = prop;
          }
        }
        arr.push(obj);
      }
      return arr;
    }
  };

  c.expandToArray = expandToArray;

  return c.process((input, output) => {
    if (!c.props[input.scope]) {
      c.props[input.scope] = prepareProps();
    }
    const props = c.props[input.scope];

    Object.keys(ports).forEach((name) => {
      let data;
      const port = ports[name];
      if (port.addressable === true) {
        // Handle data
        const indexesWithData = input.attached(name).filter((idx) => input.hasData([name, idx]));
        if (!indexesWithData.length) { return; }
        for (const idx of Array.from(indexesWithData)) {
          data = input.getData([name, idx]);
          setPropertyIndexed(props, name, data, idx, output);
        }
        return;
      }
      if (!input.hasData(name)) { return; }
      data = input.getData(name);
      setProperty(props, name, data, output);
    });
    output.done();
  });
});
