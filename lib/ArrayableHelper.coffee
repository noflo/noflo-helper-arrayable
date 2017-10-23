noflo = require 'noflo'

# Generates an unique ID 
# (http://coffeescriptcookbook.com/chapters/strings/generating-a-unique-id)
uniqueId = (length=8) ->
  id = ""
  id += Math.random().toString(36).substr(2) while id.length < length
  id.substr 0, length

module.exports = ArrayableHelper = (component, type, ports, options={}) ->
  c = component
  c.inPorts = new noflo.InPorts ports
  c.outPorts = new noflo.OutPorts()
  c.outPorts.add type,
    datatype: 'object'
  c.props = {}
  c.tearDown = (callback) ->
    props = {}
    do callback

  c.forwardBrackets = {}

  prepareProps = ->
    props = {type}
    props.id = uniqueId()
    # Copy defaults
    for own name, port of ports
      if port.addressable is true
        # Set up empty array
        props[name] = []
        continue
      if port.value? or port.required isnt false
        props[name] = port.value
    return props

  setProperty = (props, name, data, output) -> # this is bound, so use -> not =>
    props[name] = data
    result = compute.bind(component) props
    return unless result
    output.send result

  setPropertyIndexed = (props, name, data, i, output) ->
    props[name][i] = data
    result = compute.bind(component) props
    return unless result
    output.send result

  compute = options.compute || component.compute || (props) ->
    out = {}
    for own name, prop of props
      # Flatten array port if needed
      if c.inPorts[name]? and c.inPorts[name].options.addressable
        out[name] = expandToArray prop
      else
        out[name] = prop
    # Flatten output if needed
    out = expandToArray out
    return out

  # If any property of object is array, expand to a collection and fill rest
  expandToArray = options.expandToArray || (props) ->
    length = 0
    keys = Object.keys(props)
    for name in keys
      prop = props[name]
      # Short circuit with empty prop
      return null unless prop? 
      # See if any prop is an array
      if prop instanceof Array
        # Short circuit with empty array
        return null unless prop.length > 0
        if length < prop.length
          length = prop.length
    if length is 0
      # No arrays, return props as given
      return props
    if length > 0
      # At least one prop is an array, so we need to output an array
      arr = []
      for i in [0...length]
        if props instanceof Array
          obj = []
        else
          obj = {}
          obj.type = props.type
          obj.id = props.id
        keys = Object.keys(props)
        for name in keys
          prop = props[name]
        # for own name, prop of props
          if prop instanceof Array
            obj[name] = if prop[i]? then prop[i] else prop[i%prop.length]
          else
            obj[name] = prop
        arr.push obj
      return arr

  c.expandToArray = expandToArray

  c.process (input, output) ->
    unless c.props[input.scope]
      c.props[input.scope] = prepareProps()
    props = c.props[input.scope]

    Object.keys(ports).forEach (name) ->
      port = ports[name]
      if port.addressable is true
        # Handle data
        indexesWithData = input.attached(name).filter (idx) ->
          input.hasData [name, idx]
        return unless indexesWithData.length
        for idx in indexesWithData
          data = input.getData [name, idx]
          setPropertyIndexed props, name, data, idx, output
        return
      return unless input.hasData name
      data = input.getData name
      setProperty props, name, data, output
      return
    output.done()
    return
