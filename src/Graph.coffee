###
  graph dracula

  graph layout and svg rendering for the browser

  pure javascript and svg

  @author johann philipp strathausen <strathausen@gmail.com>

  @license MIT license (that means it's okay for commercial use)

  @contributors TODO (see previous release)
###

class Graph
  constructor: (@element) ->
    if typeof @element == 'string'
      @element = $ @element
    { @height, @width } = @element
    @edges = {}
    @nodes = {}

  addNode: (id, data={}) ->
    switch typeof id
      when 'object' then data = id
      when 'string' then data.id ?= id
    @nodes[n.id] = new Graph.Node data

  addEdge: (src, dest, data) ->
    switch arguments.length
      when 1 then data = src
      when 2 then data = { src, dest }
      when 3
        data.src ?= src
        data.dest ?= dest
    src  = @nodes[src]  or @addNode src
    dest = @nodes[dest] or @addNode dest
    @edges[e.id] = new Graph.Edge data

class Graph.Node
  constructor: ({ id, data, style }) ->

class Graph.Edge
  constructor: ({ src, dest, data, style }) ->

# here be graph renderers
class Graph.Renderer

###
  renders graphs as draggable beauty via raphael svg
###
class Graph.Renderer.Raphael
  constructor: (@graph, @options) ->

###
  here be graph layouters
  arguments: graph, options
  iterating over graph.nodes
  transforming x and y properties into layoutX and layoutY
###
class Graph.Layout

###
  spring layout
  options:
    iterations : Number
    gravity    : Number
    attraction : Number
    ratio      : Number (height : width, e.g. 2 : 3 = 1.67)
###
class Graph.Layout.Spring
  constructor: (@graph, @options) ->
    { repulsion, gravity, iterations, ratio } = options
    ratio ?= @graph.height / @graph.width
    @setup ratio
    for i in iterations
      @attract gravity, ratio
      @repulse repulsion, ratio

  setup: (ratio) ->
    for n in @grap.nodes
      # TODO consider ratio
      n.layoutX = Math.random()
      n.layoutY = Math.random()
    undefined

  attract: (gravity, ratio) ->
    # iterate over edges, attract the two nodes (if different)
    for e in @graph.edges
      e
    undefined

  repulse: (repulsion, ratio) ->
    # iterate over node pairs and repulse the two
    for n in @grap.nodes
      n
    undefined
