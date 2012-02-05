/*
  graph dracula

  graph layout and svg rendering for the browser

  pure javascript and svg

  @author johann philipp strathausen <strathausen@gmail.com>

  @license MIT license (that means it's okay for commercial use)

  @contributors TODO (see previous release)
*/
var Graph;

Graph = (function() {

  function Graph(element) {
    var _ref;
    this.element = element;
    if (typeof this.element === 'string') this.element = $(this.element);
    _ref = this.element, this.height = _ref.height, this.width = _ref.width;
    this.edges = {};
    this.nodes = {};
  }

  Graph.prototype.addNode = function(id, data) {
    if (data == null) data = {};
    switch (typeof id) {
      case 'object':
        data = id;
        break;
      case 'string':
        if (data.id == null) data.id = id;
    }
    return this.nodes[n.id] = new Graph.Node(data);
  };

  Graph.prototype.addEdge = function(src, dest, data) {
    switch (arguments.length) {
      case 1:
        data = src;
        break;
      case 2:
        data = {
          src: src,
          dest: dest
        };
        break;
      case 3:
        if (data.src == null) data.src = src;
        if (data.dest == null) data.dest = dest;
    }
    src = this.nodes[src] || this.addNode(src);
    dest = this.nodes[dest] || this.addNode(dest);
    return this.edges[e.id] = new Graph.Edge(data);
  };

  return Graph;

})();

Graph.Node = (function() {

  function Node(_arg) {
    var data, id, style;
    id = _arg.id, data = _arg.data, style = _arg.style;
  }

  return Node;

})();

Graph.Edge = (function() {

  function Edge(_arg) {
    var data, dest, src, style;
    src = _arg.src, dest = _arg.dest, data = _arg.data, style = _arg.style;
  }

  return Edge;

})();

Graph.Renderer = (function() {

  function Renderer() {}

  return Renderer;

})();

/*
  renders graphs as draggable beauty via raphael svg
*/

Graph.Renderer.Raphael = (function() {

  function Raphael(graph, options) {
    this.graph = graph;
    this.options = options;
  }

  return Raphael;

})();

/*
  here be graph layouters
  arguments: graph, options
  iterating over graph.nodes
  transforming x and y properties into layoutX and layoutY
*/

Graph.Layout = (function() {

  function Layout() {}

  return Layout;

})();

/*
  spring layout
  options:
    iterations : Number
    gravity    : Number
    attraction : Number
    ratio      : Number (height : width, e.g. 2 : 3 = 1.67)
*/

Graph.Layout.Spring = (function() {

  function Spring(graph, options) {
    var gravity, i, iterations, ratio, repulsion, _i, _len;
    this.graph = graph;
    this.options = options;
    repulsion = options.repulsion, gravity = options.gravity, iterations = options.iterations, ratio = options.ratio;
    if (ratio == null) ratio = this.graph.height / this.graph.width;
    this.setup(ratio);
    for (_i = 0, _len = iterations.length; _i < _len; _i++) {
      i = iterations[_i];
      this.attract(gravity, ratio);
      this.repulse(repulsion, ratio);
    }
  }

  Spring.prototype.setup = function(ratio) {
    var n, _i, _len, _ref;
    _ref = this.grap.nodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      n = _ref[_i];
      n.layoutX = Math.random();
      n.layoutY = Math.random();
    }
    return;
  };

  Spring.prototype.attract = function(gravity, ratio) {
    var e, _i, _len, _ref;
    _ref = this.graph.edges;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      e = _ref[_i];
      e;
    }
    return;
  };

  Spring.prototype.repulse = function(repulsion, ratio) {
    var n, _i, _len, _ref;
    _ref = this.grap.nodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      n = _ref[_i];
      n;
    }
    return;
  };

  return Spring;

})();
