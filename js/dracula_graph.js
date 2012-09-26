/*
 *  Dracula Graph Layout and Drawing Framework 0.0.3alpha
 *  (c) 2010 Philipp Strathausen <strathausen@gmail.com>, http://strathausen.eu
 *  Contributions by Jake Stothard <stothardj@gmail.com>.
 *
 *  based on the Graph JavaScript framework, version 0.0.1
 *  (c) 2006 Aslak Hellesoy <aslak.hellesoy@gmail.com>
 *  (c) 2006 Dave Hoover <dave.hoover@gmail.com>
 *
 *  Ported from Graph::Layouter::Spring in
 *    http://search.cpan.org/~pasky/Graph-Layderer-0.02/
 *  The algorithm is based on a spring-style layouter of a Java-based social
 *  network tracker PieSpy written by Paul Mutton <paul@jibble.org>.
 *
 *  This code is freely distributable under the MIT license. Commercial use is
 *  hereby granted without any cost or restriction.
 *
 *  Links:
 *
 *  Graph Dracula JavaScript Framework:
 *      http://graphdracula.net
 *
 /*--------------------------------------------------------------------------*/

/*
 * Edge Factory
 */
var AbstractEdge = function() {
}
AbstractEdge.prototype = {
    hide: function() {
        this.connection.fg.hide();
        this.connection.bg && this.bg.connection.hide();
    }
};
var EdgeFactory = function() {
    this.template = new AbstractEdge();
    this.template.style = new Object();
    this.template.style.directed = false;
    this.template.weight = 1;
};
EdgeFactory.prototype = {
    build: function(source, target) {
        var e = jQuery.extend(true, {}, this.template);
        e.source = source;
        e.target = target;
        return e;
    }
};


/*
 * Queue class. A bit faster than shift:ing an array. From http://code.stephenmorley.org/javascript/queues/ (CC0 licence, i.e. public domain)
 */
function Queue(){var _1=[];var _2=0;
this.getLength=function(){return (_1.length-_2);};
this.isEmpty=function(){return (_1.length==0);};
this.enqueue=function(_3){_1.push(_3);};
this.dequeue=function(){if(_1.length==0){return undefined;}var _4=_1[_2];if(++_2*2>=_1.length){_1=_1.slice(_2);_2=0;}return _4;};
this.peek=function(){return (_1.length>0?_1[_2]:undefined);};
};

/*
 * Graph
 */
var Graph = function() {
    this.nodes = {};
    this.edges = [];
    this.snapshots = []; // previous graph states TODO to be implemented
    this.edgeFactory = new EdgeFactory();
};
Graph.prototype = {
    /*
     * add a node
     * @id          the node's ID (string or number)
     * @content     (optional, dictionary) can contain any information that is
     *              being interpreted by the layout algorithm or the graph
     *              representation
     */
    addNode: function(id, content) {
        /* testing if node is already existing in the graph */
        if(this.nodes[id] == undefined) {
            this.nodes[id] = new Graph.Node(id, content);
        }
        return this.nodes[id];
    },

    addEdge: function(source, target, style) {
        var s = this.addNode(source);
        var t = this.addNode(target);
        var edge = this.edgeFactory.build(s, t);
        jQuery.extend(true, edge.style, style);
        s.edges.push(edge);
        this.edges.push(edge);
        // NOTE: Even directed edges are added to both nodes.
        t.edges.push(edge);
    },

    /* TODO to be implemented
     * Preserve a copy of the graph state (nodes, positions, ...)
     * @comment     a comment describing the state
     */
    snapShot: function(comment) {
        /* FIXME
        var graph = new Graph();
        graph.nodes = jQuery.extend(true, {}, this.nodes);
        graph.edges = jQuery.extend(true, {}, this.edges);
        this.snapshots.push({comment: comment, graph: graph});
        */
    },
    removeNode: function(id) {
        delete this.nodes[id];
        for(var i = 0; i < this.edges.length; i++) {
            if (this.edges[i].source.id == id || this.edges[i].target.id == id) {
                this.edges.splice(i, 1);
                i--;
            }
        }
    }
};

/*
 * Node
 */
Graph.Node = function(id, node){
    node = node || {};
    node.id = id;
    node.edges = [];
    node.hide = function() {
        this.hidden = true;
        this.shape && this.shape.hide(); /* FIXME this is representation specific code and should be elsewhere */
        for(i in this.edges)
            (this.edges[i].source.id == id || this.edges[i].target == id) && this.edges[i].hide && this.edges[i].hide();
    };
    node.show = function() {
        this.hidden = false;
        this.shape && this.shape.show();
        for(i in this.edges)
            (this.edges[i].source.id == id || this.edges[i].target == id) && this.edges[i].show && this.edges[i].show();
    };
    return node;
};
Graph.Node.prototype = {
};

/*
 * Renderer base class
 */
Graph.Renderer = {};

/*
 * Renderer implementation using RaphaelJS
 */
Graph.Renderer.Raphael = function(element, graph, width, height) {
    this.width = width || 400;
    this.height = height || 400;
    var selfRef = this;
    this.r = Raphael(element, this.width, this.height);
    this.radius = 40; /* max dimension of a node */
    this.graph = graph;
    this.mouse_in = false;

    /* TODO default node rendering function */
    if(!this.graph.render) {
        this.graph.render = function() {
            return;
        }
    }

    /*
     * Dragging
     */
    this.isDrag = false;
    this.dragger = function (e) {
        this.dx = e.clientX;
        this.dy = e.clientY;
        selfRef.isDrag = this;
        this.set && this.set.animate({"fill-opacity": .1}, 200);
        e.preventDefault && e.preventDefault();
    };

    var d = document.getElementById(element);
    d.onmousemove = function (e) {
        e = e || window.event;
        if (selfRef.isDrag) {
            var bBox = selfRef.isDrag.set.getBBox();
            // TODO round the coordinates here (eg. for proper image representation)
            var newX = e.clientX - selfRef.isDrag.dx + (bBox.x + bBox.width / 2);
            var newY = e.clientY - selfRef.isDrag.dy + (bBox.y + bBox.height / 2);
            /* prevent shapes from being dragged out of the canvas */
            var clientX = e.clientX - (newX < 20 ? newX - 20 : newX > selfRef.width - 20 ? newX - selfRef.width + 20 : 0);
            var clientY = e.clientY - (newY < 20 ? newY - 20 : newY > selfRef.height - 20 ? newY - selfRef.height + 20 : 0);
            selfRef.isDrag.set.translate(clientX - Math.round(selfRef.isDrag.dx), clientY - Math.round(selfRef.isDrag.dy));
            //            console.log(clientX - Math.round(selfRef.isDrag.dx), clientY - Math.round(selfRef.isDrag.dy));
            for (var i in selfRef.graph.edges) {
                selfRef.graph.edges[i] &&
                selfRef.graph.edges[i].connection && selfRef.graph.edges[i].connection.draw();
            }
            //selfRef.r.safari();
            selfRef.isDrag.dx = clientX;
            selfRef.isDrag.dy = clientY;
        }
    };
    d.onmouseup = function () {
        selfRef.isDrag && selfRef.isDrag.set.animate({"fill-opacity": .6}, 500);
        selfRef.isDrag = false;
    };
    this.draw();
};


/* Moved this default node renderer function out of the main prototype code
 * so it can be override by default */
Graph.Renderer.defaultRenderFunc = function(r, node) {
    /* the default node drawing */
    var color = Raphael.getColor();
    var ellipse = r.ellipse(0, 0, 30, 20).attr({fill: color, stroke: color, "stroke-width": 2});
    /* set DOM node ID */
    ellipse.node.id = node.label || node.id;
    shape = r.set().
        push(ellipse).
        push(r.text(0, 30, node.label || node.id));
    return shape;
}


Graph.Renderer.Raphael.prototype = {
    translate: function(point) {
        return [
            (point[0] - this.graph.layoutMinX) * this.factorX + this.radius,
            (point[1] - this.graph.layoutMinY) * this.factorY + this.radius
        ];
    },

    rotate: function(point, length, angle) {
        var dx = length * Math.cos(angle);
        var dy = length * Math.sin(angle);
        return [point[0]+dx, point[1]+dy];
    },

    draw: function() {
        this.factorX = (this.width - 2 * this.radius) / (this.graph.layoutMaxX - this.graph.layoutMinX);
        this.factorY = (this.height - 2 * this.radius) / (this.graph.layoutMaxY - this.graph.layoutMinY);
        for (i in this.graph.nodes) {
            this.drawNode(this.graph.nodes[i]);
        }
        for (var i = 0; i < this.graph.edges.length; i++) {
            this.drawEdge(this.graph.edges[i]);
        }
    },

    drawNode: function(node) {
        var point = this.translate([node.layoutPosX, node.layoutPosY]);
        node.point = point;

        /* if node has already been drawn, move the nodes */
        if(node.shape) {
            var oBBox = node.shape.getBBox();
            var opoint = { x: oBBox.x + oBBox.width / 2, y: oBBox.y + oBBox.height / 2};
            node.shape.translate(Math.round(point[0] - opoint.x), Math.round(point[1] - opoint.y));
            this.r.safari();
            return node;
        }/* else, draw new nodes */

        var shape;

        /* if a node renderer function is provided by the user, then use it
           or the default render function instead */
        if(!node.render) {
            node.render = Graph.Renderer.defaultRenderFunc;
        }
        /* or check for an ajax representation of the nodes */
        if(node.shapes) {
            // TODO ajax representation evaluation
        }

        shape = node.render(this.r, node).hide();

        shape.attr({"fill-opacity": .6});
        /* re-reference to the node an element belongs to, needed for dragging all elements of a node */
        shape.items.forEach(function(item){ item.set = shape; item.node.style.cursor = "move"; });
        shape.mousedown(this.dragger);

        var box = shape.getBBox();
        shape.translate(Math.round(point[0]-(box.x+box.width/2)),Math.round(point[1]-(box.y+box.height/2)))
        //console.log(box,point);
        node.hidden || shape.show();
        node.shape = shape;
    },
    drawEdge: function(edge) {
        /* if this edge already exists the other way around and is undirected */
        if(edge.backedge)
            return;
        if(edge.source.hidden || edge.target.hidden) {
            edge.connection && edge.connection.fg.hide();
            edge.connection.bg && edge.connection.bg.hide();
            return;
        }
        /* if edge already has been drawn, only refresh the edge */
        if(!edge.connection) {
            edge.style && edge.style.callback && edge.style.callback(edge); // TODO move this somewhere else
            edge.connection = this.r.connection(edge.source.shape, edge.target.shape, edge.style);
            return;
        }
        //FIXME showing doesn't work well
        edge.connection.fg.show();
        edge.connection.bg && edge.connection.bg.show();
        edge.connection.draw();
    }
};
Graph.Layout = {};
// Helper fundtion to calculate bounds
Graph.Layout.layoutCalcBounds = function(graph) {
        var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;

        for (i in graph.nodes) {
            var x = graph.nodes[i].layoutPosX;
            var y = graph.nodes[i].layoutPosY;

            if(x > maxx) maxx = x;
            if(x < minx) minx = x;
            if(y > maxy) maxy = y;
            if(y < miny) miny = y;
        }

        graph.layoutMinX = minx;
        graph.layoutMaxX = maxx;
        graph.layoutMinY = miny;
        graph.layoutMaxY = maxy;
    };

Graph.Layout.Spring = function(graph) {
    this.graph = graph;
    this.iterations = 500;
    this.maxRepulsiveForceDistance = 6;
    this.k = 2;
    this.c = 0.01;
    this.maxVertexMovement = 0.5;
    this.layout();
};
Graph.Layout.Spring.prototype = {
    layout: function() {
        this.layoutPrepare();
        for (var i = 0; i < this.iterations; i++) {
            this.layoutIteration();
        }
        this.layoutCalcBounds();
    },

    layoutPrepare: function() {
        for (i in this.graph.nodes) {
            var node = this.graph.nodes[i];
            node.layoutPosX = 0;
            node.layoutPosY = 0;
            node.layoutForceX = 0;
            node.layoutForceY = 0;
        }

    },

    layoutCalcBounds: function() {
        var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;

        for (i in this.graph.nodes) {
            var x = this.graph.nodes[i].layoutPosX;
            var y = this.graph.nodes[i].layoutPosY;

            if(x > maxx) maxx = x;
            if(x < minx) minx = x;
            if(y > maxy) maxy = y;
            if(y < miny) miny = y;
        }

        this.graph.layoutMinX = minx;
        this.graph.layoutMaxX = maxx;
        this.graph.layoutMinY = miny;
        this.graph.layoutMaxY = maxy;
    },

    layoutIteration: function() {
        // Forces on nodes due to node-node repulsions

        var prev = new Array();
        for(var c in this.graph.nodes) {
            var node1 = this.graph.nodes[c];
            for (var d in prev) {
                var node2 = this.graph.nodes[prev[d]];
                this.layoutRepulsive(node1, node2);

            }
            prev.push(c);
        }

        // Forces on nodes due to edge attractions
        for (var i = 0; i < this.graph.edges.length; i++) {
            var edge = this.graph.edges[i];
            this.layoutAttractive(edge);
        }

        // Move by the given force
        for (i in this.graph.nodes) {
            var node = this.graph.nodes[i];
            var xmove = this.c * node.layoutForceX;
            var ymove = this.c * node.layoutForceY;

            var max = this.maxVertexMovement;
            if(xmove > max) xmove = max;
            if(xmove < -max) xmove = -max;
            if(ymove > max) ymove = max;
            if(ymove < -max) ymove = -max;

            node.layoutPosX += xmove;
            node.layoutPosY += ymove;
            node.layoutForceX = 0;
            node.layoutForceY = 0;
        }
    },

    layoutRepulsive: function(node1, node2) {
        if (typeof node1 == 'undefined' || typeof node2 == 'undefined')
            return;
        var dx = node2.layoutPosX - node1.layoutPosX;
        var dy = node2.layoutPosY - node1.layoutPosY;
        var d2 = dx * dx + dy * dy;
        if(d2 < 0.01) {
            dx = 0.1 * Math.random() + 0.1;
            dy = 0.1 * Math.random() + 0.1;
            var d2 = dx * dx + dy * dy;
        }
        var d = Math.sqrt(d2);
        if(d < this.maxRepulsiveForceDistance) {
            var repulsiveForce = this.k * this.k / d;
            node2.layoutForceX += repulsiveForce * dx / d;
            node2.layoutForceY += repulsiveForce * dy / d;
            node1.layoutForceX -= repulsiveForce * dx / d;
            node1.layoutForceY -= repulsiveForce * dy / d;
        }
    },

    layoutAttractive: function(edge) {
        var node1 = edge.source;
        var node2 = edge.target;

        var dx = node2.layoutPosX - node1.layoutPosX;
        var dy = node2.layoutPosY - node1.layoutPosY;
        var d2 = dx * dx + dy * dy;
        if(d2 < 0.01) {
            dx = 0.1 * Math.random() + 0.1;
            dy = 0.1 * Math.random() + 0.1;
            var d2 = dx * dx + dy * dy;
        }
        var d = Math.sqrt(d2);
        if(d > this.maxRepulsiveForceDistance) {
            d = this.maxRepulsiveForceDistance;
            d2 = d * d;
        }
        var attractiveForce = (d2 - this.k * this.k) / this.k;
        if(edge.attraction == undefined) edge.attraction = 1;
        attractiveForce *= Math.log(edge.attraction) * 0.5 + 1;

        node2.layoutForceX -= attractiveForce * dx / d;
        node2.layoutForceY -= attractiveForce * dy / d;
        node1.layoutForceX += attractiveForce * dx / d;
        node1.layoutForceY += attractiveForce * dy / d;
    }
};

// A Tree layout, best used for directed trees.
// Loops and multiple roots are handled, I haven't tried any graphs with edges going from and to the same node, nor multigraphs or pseudographs.
// Parameters:
//  graph: the graph to work on
//  direction: up,down,left,right - the direction of the graph. down is default.
Graph.Layout.Tree = function(graph, direction) {
    this.graph = graph;
	this.direction = direction;
	this.revertedEdges = [];
    this.layout();
}

Graph.Layout.Tree.prototype = {
	layout: function() {
		var roots = [];
		// Set all positions to 0 and find roots (i.e. nodes noone else is pointing to)
		for (i in this.graph.nodes) {
			var node = this.graph.nodes[i];
			node.layoutPosX = 0;
			node.layoutPosY = 0;
			var isroot = true;
			for(var e in node.edges){
				var edge = node.edges[e];
				if(edge.source.id != node.id) {
					isroot = false;
					break;
				}
			}
			if(isroot)
				roots.push(node);
		}
		
		// Make sure all nodes are reachable from the roots. If not we have a graph without a natural root. Choose an arbitrary one (the first node we find).
		// TODO: This won't work :( We need to find a node that spans as many as possible
		var hasUnreachedNodes = true;
		while(hasUnreachedNodes){
			hasUnreachedNodes = false;
			// Traverse the tree(s) from the roots and mark all as visited
			for(var r in roots)
				this.markTraversed(roots[r]);
			// Check if we have unvisted nodes
			for (i in this.graph.nodes) {
				var node = this.graph.nodes[i];
				// The first unvisited node is set as a root. We don't break the loop since we need to clear the flag on all nodes
				if(!hasUnreachedNodes && !node.visitedFromRoots){ 
					roots.push(node);
					hasUnreachedNodes = true;
				}
				node.visitedFromRoots = false; // Clear the flag for next round
			}
		}
		
		// Get rid of loops by reverting edges. We'll restore those later
		for(var r in roots)
			this.revertLoops(roots[r]);
		// Calcualte the depth (=level) of each node by a depth-first walk from the roots
		for(var r in roots)
			this.calcChildren(roots[r]);
		
		// Create a lookup for each level with all nodes in that level
		var levels = [];
		for (i in this.graph.nodes) {
			var node = this.graph.nodes[i];
			var level = node.layoutPosY;
			if(!levels[level]) levels[level] = [];
			levels[level].push(node);
		}
		
		//Start by a simple "put next to each other" layout
		// TODO: minimise crossings 
		// possibly add fake nodes á la Coffman–Graham
		for(var l in levels) {
			var count = 0;
			for(var n in levels[l]) {
				levels[l][n].layoutPosX = count++;
			}
		}
		
		// Restore reverted edges
		for(var r in this.revertedEdges){
			var edge = this.revertedEdges[r];
			var temp = edge.target;
			edge.target = edge.source;
			edge.source = temp;
		}
		
		// Rotate if user didn't want the default top-to-bottom layout
		if(this.direction) this.rotate(this.direction);
		
		Graph.Layout.layoutCalcBounds(this.graph);},
	
	markTraversed: function(node) {	
		node.visitedFromRoots = true;
		for(var i in node.edges){
			var edge = node.edges[i];
			if(edge.source.id == node.id && edge.target.id != node.id){ // This points to a child
				// Only traverse grandchildren if the child hasn't already been visited
				if(!node.visitedFromRoots) 
					this.markTraversed(edge.target);
			}
		}
	},
	
	// Sets the weight (y-pos) to 1 + the highest node that points to me
	// returns true if this node was modified, false otherwise
	setWeight: function(node) {
		var maxY = 0;
		// Get the highest y-pos from all nodes that point to me
		for(var i in node.edges){
			var edge = node.edges[i];
			if(edge.source.id != node.Id && edge.source.layoutPosY > maxY)
				maxY = edge.source.layoutPosY;
		}
		if(node.layoutPosY != maxY + 1) {
			node.layoutPosY = maxY + 1;
			return true;
		}
		return false;
	},
	
	calcChildren: function(node) {	
		for(var i in node.edges){
			var edge = node.edges[i];
			if(edge.source.id == node.id && edge.target.id != node.id){ // This points to a child
				// Only calculate grandchildren if the child was changed, otherwise it's children doesn't need to be changed
				if(this.setWeight(edge.target)) 
					this.calcChildren(edge.target);
			}
		}
	},
	
	revertLoops: function(node, visited) {	
		if(!visited) visited = [];
		visited.push(node.id);
		for(var i in node.edges){
			var edge = node.edges[i];
			if(edge.source.id == node.id && edge.target.id != node.id){ // This points to a child
				if(visited.indexOf(edge.target.id) != -1){
					// Argh! A loop detected! Revert it and store it so we can restore it later
					this.revertedEdges.push(edge);
					var temp = edge.target;
					edge.target = edge.source;
					edge.source = temp;
					continue;
				}
				// We slice (=clone) the array so each depth-first fork gets it's own array
				// (tecnically this is not neccessary for the first fork, only the subsequent ones, but that would require some extra logic since any clone would have to be done before the first fork was traveresed)
				this.revertLoops(edge.target, visited.slice(0));
			}
		}
	},
	
	// Rotate the graph if the user wants to have left-to-right or something instead of default top-to-bottom
	rotate: function(direction) {		
		for (i in this.graph.nodes) {
            var node = this.graph.nodes[i];
			switch(direction){
			case 'up':
				node.layoutPosY = -node.layoutPosY;
				break;
			case 'right':
				var temp = node.layoutPosX;
				node.layoutPosX = node.layoutPosY;
				node.layoutPosY = temp;
				break;
			case 'left':
				var temp = node.layoutPosX;
				node.layoutPosX = -node.layoutPosY;
				node.layoutPosY = temp;
				break;
			}
		}
	}
};

Graph.Layout.Ordered = function(graph, order) {
    this.graph = graph;
    this.order = order;
    this.layout();
};
Graph.Layout.Ordered.prototype = {
    layout: function() {
        this.layoutPrepare();
        this.layoutCalcBounds();
    },

    layoutPrepare: function(order) {
        for (i in this.graph.nodes) {
            var node = this.graph.nodes[i];
            node.layoutPosX = 0;
            node.layoutPosY = 0;
        }
            var counter = 0;
            for (i in this.order) {
                var node = this.order[i];
                node.layoutPosX = counter;
                node.layoutPosY = Math.random();
                counter++;
            }
    },

    layoutCalcBounds: function() {
        var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;

        for (i in this.graph.nodes) {
            var x = this.graph.nodes[i].layoutPosX;
            var y = this.graph.nodes[i].layoutPosY;

            if(x > maxx) maxx = x;
            if(x < minx) minx = x;
            if(y > maxy) maxy = y;
            if(y < miny) miny = y;
        }

        this.graph.layoutMinX = minx;
        this.graph.layoutMaxX = maxx;

        this.graph.layoutMinY = miny;
        this.graph.layoutMaxY = maxy;
    }
};


Graph.Layout.OrderedTree = function(graph, order) {
    this.graph = graph;
    this.order = order;
    this.layout();
};

/*
 * OrderedTree is like Ordered but assumes there is one root
 * This way we can give non random positions to nodes on the Y-axis
 * it assumes the ordered nodes are of a perfect binary tree
 */
Graph.Layout.OrderedTree.prototype = {
    layout: function() {
        this.layoutPrepare();
        this.layoutCalcBounds();
    },
    
    layoutPrepare: function(order) {
        for (i in this.graph.nodes) {
            var node = this.graph.nodes[i];
            node.layoutPosX = 0;
            node.layoutPosY = 0;
        }
        //to reverse the order of rendering, we need to find out the
        //absolute number of levels we have. simple log math applies.
        var numNodes = this.order.length;
        var totalLevels = Math.floor(Math.log(numNodes) / Math.log(2));
        
        var counter = 1;
        for (i in this.order) {
            var node = this.order[i];
            //rank aka x coordinate 
            var rank = Math.floor(Math.log(counter) / Math.log(2));
            //file relative to top
            var file = counter - Math.pow(rank, 2);
            
            log('Node ' + node.id + '  #' + counter + ' is at rank ' + rank + ' file ' + file);
            node.layoutPosX = totalLevels - rank;
            node.layoutPosY = file;
            counter++;
        }
    },
    
    layoutCalcBounds: function() {
        var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;

        for (i in this.graph.nodes) {
            var x = this.graph.nodes[i].layoutPosX;
            var y = this.graph.nodes[i].layoutPosY;
            
            if(x > maxx) maxx = x;
            if(x < minx) minx = x;
            if(y > maxy) maxy = y;
            if(y < miny) miny = y;
        }

        this.graph.layoutMinX = minx;
        this.graph.layoutMaxX = maxx;

        this.graph.layoutMinY = miny;
        this.graph.layoutMaxY = maxy;
    }
};


Graph.Layout.TournamentTree = function(graph, order) {
    this.graph = graph;
    this.order = order;
    this.layout();
};

/*
 * TournamentTree looks more like a binary tree
 */
Graph.Layout.TournamentTree.prototype = {
    layout: function() {
        this.layoutPrepare();
        this.layoutCalcBounds();
    },
    
    layoutPrepare: function(order) {
        for (i in this.graph.nodes) {
            var node = this.graph.nodes[i];
            node.layoutPosX = 0;
            node.layoutPosY = 0;
        }
        //to reverse the order of rendering, we need to find out the
        //absolute number of levels we have. simple log math applies.
        var numNodes = this.order.length;
        var totalLevels = Math.floor(Math.log(numNodes) / Math.log(2));
        
        var counter = 1;
        for (i in this.order) {
            var node = this.order[i];
            var depth = Math.floor(Math.log(counter) / Math.log(2));
            var xpos = counter - Math.pow(depth, 2);
            var offset = Math.pow(2, totalLevels - depth);
            var final_x = offset + (counter - Math.pow(2,depth)) * Math.pow(2,(totalLevels - depth)+1);
            
            log('Node ' + node.id + '  #' + counter + ' is at depth ' + depth + ' offset ' + offset + ' final_x ' + final_x);
            node.layoutPosX = final_x;
            node.layoutPosY = depth;
            counter++;
        }
    },
    
    layoutCalcBounds: function() {
        var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;

        for (i in this.graph.nodes) {
            var x = this.graph.nodes[i].layoutPosX;
            var y = this.graph.nodes[i].layoutPosY;
            
            if(x > maxx) maxx = x;
            if(x < minx) minx = x;
            if(y > maxy) maxy = y;
            if(y < miny) miny = y;
        }

        this.graph.layoutMinX = minx;
        this.graph.layoutMaxX = maxx;

        this.graph.layoutMinY = miny;
        this.graph.layoutMaxY = maxy;
    }
};

// Sugiyama layout, a layered layout for directed trees, preferable with no or few loops
// Pretty much a ripoff from this: https://code.google.com/p/modsl/source/browse/trunk/modsl-core/src/main/java/org/modsl/core/agt/layout/sugiyama/SugiyamaLayoutVisitor.java
// Parameters:
//  graph: the graph to work on
//  direction: up,down,left,right - the direction of the graph. down is default.
Graph.Layout.Sugiyama = function(graph, direction) {
    this.graph = graph;
	this.direction = direction;
	this.revertedEdges = [];
	this.nodecount = 0;
	for(var node in this.graph.nodes)
		this.nodecount++;
		
    this.layout();
}

Graph.Layout.Sugiyama.prototype = {
	layout: function() {
		this.calculateNodeDegrees();
        this.removeCycles();
        this.splitIntoLayers();
        // this.insertDummies();
        // this.stack.initIndexes();
        // this.stack.reduceCrossings();
        // this.undoRemoveCycles();
        // this.stack.layerHeights();
        // this.stack.xPos();
		
		this.restoreRevertedEdges();
		Graph.Layout.layoutCalcBounds(this.graph);
	},
	
	calculateNodeDegrees: function()
	{
		//for (i = this.graph.nodes.length; i--;) {
		for (i in this.graph.nodes) {
			var node = this.graph.nodes[i];
			node.inDegree = 0;
			node.outDegree = 0;
			for (e = node.edges.length; e--;) {
			//for(var e in node.edges){
				var edge = node.edges[e];
				if(edge.target.id == node.id && edge.source.id != node.id)
					node.inDegree++;
				else if(edge.source.id == node.id && edge.target.id != node.id)
					node.outDegree++;
			}			
			node.inMinusOutDegree = node.inDegree*2 - node.outDegree;
		}
	},
	
	removeCycles: function()
	{
		var nodeList = [];
		for(var node in this.graph.nodes)
			nodeList.push(this.graph.nodes[node]);
			
		var sortedNodes = nodeList.sort(function(a,b){ return a.inMinusOutDegree - b.inMinusOutDegree; });
		var removed = [];
		var length = sortedNodes.length;
		for(var i = 0; i < length; i++) {
			var node = sortedNodes[i];
			var inEdges = [];
			var outEdges = []
			for (e = node.edges.length; e--;) {
				var edge = node.edges[e];
				if(edge.target.id == node.id && edge.source.id != node.id)
					inEdges.push(edge);
				else if(edge.source.id == node.id && edge.target.id != node.id)
					outEdges.push(edge);
			}
			for(n = inEdges.length; n--;) {
				var inEdge = inEdges[n];
				if(removed.indexOf(inEdge) == -1) {
					// Revert edge
					// inEdge.source.inMinusOutDegree += 3; // Correct the inMinusOutDegree value
					this.revertedEdges.push(inEdge);
					var temp = inEdge.target;
					inEdge.target = inEdge.source;
					inEdge.source = temp;
					removed.push(inEdge);
				}
			}
			for(n = outEdges.length; n--;){
				var outEdge = outEdges[n];
				if(removed.indexOf(outEdge) == -1)
					removed.push(outEdge);
			}
			// Idea - update the node.inMinusOutDegree of the other end of a reverted edge, then resort the remaining nodes.
			// That way we minimise the number of unneccessary reverts (?)
		}
	},
	
	splitIntoLayers: function()
	{
		var sorted = this.topologicalSort();
		//TODO
	},
	
	topologicalSort: function()
	{
		var roots = this.getRootsQueue();
		var sortedResult = [];
		var removed = [];
		
		while(!roots.isEmpty()){
			var node = roots.dequeue();
			sortedResult.push(node);
			for(e = node.edges.length;e--;){
				var edge = node.edges[e];
				if(edge.source.id == node.id && edge.target.id != node.id){ // Out-edge
					removed.push(edge);
					var allEdgesRemoved = true;
					// Check if the targets has any mode "in" edges left
					for(e2 = edge.target.edges.length; e2--;) {
						var edge2 = edge.target.edges[e2];
						// In-edge that hasn't been removed
						if(edge2.target.id == edge.target.id && edge2.source.id != edge2.target.id && removed.indexOf(edge2) == -1)
							allEdgesRemoved = false;
					}
					if(allEdgesRemoved)
						roots.enqueue(edge.target);
				}
			}
		}
		
		// Sanety check, don't know if necessary
		if(sortedResult.length != this.nodecount)
			throw "Topological sort failed";
		
		return sortedResult;
	},
	
	getRootsQueue: function()
	{
		var roots = new Queue();
		for (i in this.graph.nodes) {
			var node = this.graph.nodes[i];
			var isroot = true;
			for(var e in node.edges){
				var edge = node.edges[e];
				if(edge.source.id != node.id) {
					isroot = false;
					break;
				}
			}
			if(isroot)
				roots.enqueue(node);
		}
		return roots;
	},
	
	restoreRevertedEdges: function(node){
		for(i = this.revertedEdges.length; i--;){
			var edge = this.revertedEdges[i];
			var temp = edge.target;
			edge.target = edge.source;
			edge.source = temp;
		}
	}
}

/*
 * usefull JavaScript extensions,
 */

function log(a) {console.log&&console.log(a);}

/*
 * Raphael Tooltip Plugin
 * - attaches an element as a tooltip to another element
 *
 * Usage example, adding a rectangle as a tooltip to a circle:
 *
 *      paper.circle(100,100,10).tooltip(paper.rect(0,0,20,30));
 *
 * If you want to use more shapes, you'll have to put them into a set.
 *
 */
Raphael.el.tooltip = function (tp) {
    this.tp = tp;
    this.tp.o = {x: 0, y: 0};
    this.tp.hide();
    this.hover(
        function(event){
            this.mousemove(function(event){
                this.tp.translate(event.clientX -
                                  this.tp.o.x,event.clientY - this.tp.o.y);
                this.tp.o = {x: event.clientX, y: event.clientY};
            });
            this.tp.show().toFront();
        },
        function(event){
            this.tp.hide();
            this.unmousemove();
        });
    return this;
};

/* For IE */
if (!Array.prototype.forEach)
{
  Array.prototype.forEach = function(fun /*, thisp*/)
  {
    var len = this.length;
    if (typeof fun != "function")
      throw new TypeError();

    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
        fun.call(thisp, this[i], i, this);
    }
  };
}
