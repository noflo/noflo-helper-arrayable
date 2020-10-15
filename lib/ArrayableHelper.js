const noflo = require('noflo');

// Generates an unique ID
// (http://coffeescriptcookbook.com/chapters/strings/generating-a-unique-id)
const uniqueId = function uniqueId(length = 8) {
  let id = '';
  while (id.length < length) { id += Math.random().toString(36).substr(2); }
  return id.substr(0, length);
};

module.exports = function ArrayableHelper(component, type, ports, options = {}) {
  const c = component;
  c.inPorts = new noflo.InPorts(ports);
  c.outPorts = new noflo.OutPorts();
  c.outPorts.add(type,
    { datatype: 'object' });
  c.props = {};
  c.tearDown = (callback) => {
    c.props = {};
    return callback();
  };

  c.forwardBrackets = {};

  const prepareProps = () => {
    const props = { type };
    props.id = uniqueId();
    // Copy defaults
    const names = Object.keys(ports || {});
    names.forEach((name) => {
      const port = ports[name];
      if (port.addressable === true) {
        // Set up empty array
        props[name] = [];
        return;
      }
      if ((port.value != null) || (port.required !== false)) {
        props[name] = port.value;
      }
    });
    return props;
  };

  const defaultCompute = (props) => {
    let out = {};
    Object.keys(props).forEach((name) => {
      // Flatten array port if needed
      const prop = props[name];
      if ((c.inPorts[name] != null) && c.inPorts[name].options.addressable) {
        out[name] = c.expandToArray(prop);
      } else {
        out[name] = prop;
      }
    });
    // Flatten output if needed
    out = c.expandToArray(out);
    return out;
  };
  const compute = options.compute || component.compute || defaultCompute;

  const setProperty = (props, name, data, output) => {
    const p = props;
    p[name] = data;
    const result = compute.bind(component)(p);
    if (!result) { return; }
    output.send(result);
  };

  const setPropertyIndexed = (props, name, data, i, output) => {
    const p = props;
    p[name][i] = data;
    const result = compute.bind(component)(p);
    if (!result) { return; }
    output.send(result);
  };

  // If any property of object is array, expand to a collection and fill rest
  const defaultExpandToArray = (props) => {
    let length = 0;
    let keys = Object.keys(props);
    for (let i = 0; i < keys.length; i += 1) {
      const name = keys[i];
      const prop = props[name];
      // Short circuit with empty prop
      if (prop == null) { return null; }
      // See if any prop is an array
      if (Array.isArray(prop)) {
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
      for (let i = 0, end = length, asc = end >= 0;
        asc ? i < end : i > end;
        asc ? i += 1 : i -= 1) {
        let obj;
        if (props instanceof Array) {
          obj = [];
        } else {
          obj = {};
          obj.type = props.type;
          obj.id = props.id;
        }
        keys = Object.keys(props);
        keys.forEach((name) => {
          const prop = props[name];
          // for own name, prop of props
          if (Array.isArray(prop)) {
            obj[name] = (prop[i] != null) ? prop[i] : prop[i % prop.length];
          } else {
            obj[name] = prop;
          }
        });
        arr.push(obj);
      }
      return arr;
    }
    return null;
  };
  c.expandToArray = options.expandToArray || defaultExpandToArray;

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
        indexesWithData.forEach((idx) => {
          data = input.getData([name, idx]);
          setPropertyIndexed(props, name, data, idx, output);
        });
        return;
      }
      if (!input.hasData(name)) { return; }
      data = input.getData(name);
      setProperty(props, name, data, output);
    });
    output.done();
  });
};
