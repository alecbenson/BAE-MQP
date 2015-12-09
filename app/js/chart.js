function D3Graph(width, height, el) {

  this._edges = [];
  this._vertices = [];
  this._orphanEdges = [];
  this._width = width;
  this._height = height;
  this._fullGraph = {
    "vertices": [],
    "edges": []
  };
  this._root = undefined;
  this._adj_level = 1;

  this._svg = d3.select(el).append("svg")
    .attr("width", width)
    .attr("height", height);

  this._text = this._svg.append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .text(this.graphText())
    .attr("font-size", "30px")
    .attr("text-anchor", "middle")
    .attr("fill", "white");

  this._control = this._svg.append("g");
  this._container = this.svg.append("g");
  this._vertice_el = this._container.selectAll(".node");
  this._edge_el = this._container.selectAll(".link");

  //Initialize empty selectors
  this._edge_line = this._container.selectAll();
  this._edge_text = this._container.selectAll();
  this._node_circle = this.container.selectAll();
  this._node_name = this._container.selectAll();

  this._rect = this.container.append("rect")
    .attr("width", width * 10)
    .attr("height", height * 10)
    .attr("transform", "translate(" + width * -5 + "," + height * -5 + ")")
    .style("fill", "none");

  this._force = d3.layout.force()
    .nodes(this.vertices)
    .links(this.edges)
    .charge(-500)
    .linkDistance(function(d) {
      var w = Math.abs(parseFloat(d.weight));
      return 150 + (w * 2);
    })
    .size([width, height]);

  this._drag = this._force.drag()
    .on("dragstart", this.dragstart)
    .on("drag", this.dragged)
    .on("dragend", this.dragend);

  zoom.on("zoom", zoomed.bind(this));
  this._svg.call(zoom);
  this._force.on("tick", this._tick.bind(this));
  this._force.start();
  this._slider = this.renderSlider(0, 5, "chart-slider");
}

Object.defineProperties(D3Graph.prototype, {
  //List of edges currently being shown in the graph
  'edges': {
    get: function() {
      return this._edges;
    },
    set: function(edges) {
      this._edges = edges;
    }
  },
  //List of vertices currently being shown in the graph
  'vertices': {
    get: function() {
      return this._vertices;
    },
    set: function(vertices) {
      this._vertices = vertices;
    }
  },
  //Selector for edges being shown in the graph
  'edge_el': {
    get: function() {
      return this._edge_el;
    },
    set: function(edge_el) {
      this._edge_el = edge_el;
    }
  },
  'edge_line': {
    get: function() {
      return this._edge_line;
    },
    set: function(edge_line) {
      this._edge_line = edge_line;
    }
  },
  'edge_text': {
    get: function() {
      return this._edge_text;
    },
    set: function(edge_text) {
      this._edge_text = edge_text;
    }
  },
  //Selector for vertices being shown in the graph
  'vertice_el': {
    get: function() {
      return this._vertice_el;
    },
    set: function(vertice_el) {
      this._vertice_el = vertice_el;
    }
  },
  'node_circle': {
    get: function() {
      return this._node_circle;
    },
    set: function(node_circle) {
      this._node_circle = node_circle;
    }
  },
  'node_name': {
    get: function() {
      return this._node_name;
    },
    set: function(node_name) {
      this._node_name = node_name;
    }
  },
  //List of edges that are loaded, but cannot be displayed because
  //They referenced an unresolved vertice
  'orphanEdges': {
    get: function() {
      return this._orphanEdges;
    },
    set: function(orphanEdges) {
      thi._orphanEdges = orphanEdges;
    }
  },
  //The vertice at the center of the graph -- the track being selected
  'root': {
    get: function() {
      return this._root;
    },
    set: function(root) {
      this._root = root;
    }
  },
  //How many levels of adjacency to display in the graph
  'adj_level': {
    get: function() {
      return this._adj_level;
    },
    set: function(adj_level) {
      this._adj_level = adj_level;
    }
  },
  //Width in pixels of the graph
  'width': {
    get: function() {
      return this._width;
    },
    set: function(width) {
      this._width = width;
    }
  },
  //Height in pixels of the graph
  'height': {
    get: function() {
      return this._height;
    },
    set: function(height) {
      this._height = height;
    }
  },
  //The base svg chart element
  'svg': {
    get: function() {
      return this._svg;
    },
    set: function(svg) {
      this._svg = svg;
    }
  },
  //The svg group containing the slider
  'control': {
    get: function() {
      return this._control;
    }
  },
  //The svg group containing the graph elements
  'container': {
    get: function() {
      return this._container;
    },
    set: function(container) {
      this._container = container;
    }
  },
  //D3 force object
  'force': {
    get: function() {
      return this._force;
    },
    set: function(force) {
      this._force = force;
    }
  },
  //D3 drag object
  'drag': {
    get: function() {
      return this._drag;
    },
    set: function(drag) {
      this._drag = drag;
    }
  },
  //SVG text that is displayed on the chart
  'text': {
    get: function() {
      return this._text;
    },
    set: function(text) {
      this._text = text;
    }
  },
  //The svg rectangle within the graph that makes zooming and panning possible
  'rect': {
    get: function() {
      return this._rect;
    },
    set: function(rect) {
      this._rect = rect;
    }
  },
  //The list of all (not loaded) edges and vertices in the graph
  'fullGraph': {
    get: function() {
      return this._fullGraph;
    },
    set: function(fullGraph) {
      this._fullGraph = fullGraph;
    }
  }
});

//Loads a JSON file containing node and edge information
// into the graph. After, the list of orphan edges is checked so that
// if it contains any edges that can now be resolved, the orphan edges
//can be loaded into the graph
D3Graph.prototype.loadGraphFile = function(filePath) {
  var outerScope = this;
  var newEdge = {},
    newVert = {};
  var vertList = this.fullGraph.vertices;
  var edgeList = this.fullGraph.edges;
  var d = $.Deferred();

  d3.json(filePath, function(error, graph) {
    if (error) {
      throw error;
    }
    for (var i = 0; i < graph.vertices.length; i++) {
      outerScope.addVertice(graph.vertices[i], vertList);
    }
    for (var j = 0; j < graph.edges.length; j++) {
      outerScope.addEdge(graph.edges[j], edgeList, vertList);
    }
    outerScope.addOrphanEdges();
    outerScope._start();
    d.resolve();
  });
  return d;
};

D3Graph.prototype.addVertice = function(json, list) {
  if (list === undefined) {
    list = this.vertices;
  }
  if (this.findVertice(json.id, this.fullGraph.vertices) !== undefined) {
    return;
  }
  if (this.findVertice(json.id, this.vertices) !== undefined) {
    return;
  }
  var newVert = {
    "id": json.id
  };
  list.push(newVert);
  this._start();
  return newVert;
};

D3Graph.prototype.removeVertice = function(vertice, edgeList, vertList) {
  if (edgeList === undefined) {
    edgeList = this.edges;
  }
  if (vertList === undefined) {
    vertList = this.vertices;
  }
  for (var i = 0; i < edgeList.length; i++) {
    if ((edgeList[i].source.id == vertice.id) || (edgeList[i].target.id == vertice.id)) {
      edgeList.splice(i, 1);
    }
  }
  vertList.splice(vertList.indexOf(vertice), 1);
};

D3Graph.prototype.clearGraph = function() {
  this.edges.splice(0, this.edges.length);
  this.vertices.splice(0, this.vertices.length);
  graph._start();
};

D3Graph.prototype.addOrphanEdges = function() {
  var vertList = this.fullGraph.vertices;
  var edgeList = this.fullGraph.edges;
  //Store length here so that if an edge gets re-added to the
  //List of orphan edges, the method does not attempt to re-add the edge.
  var length = this.orphanEdges.length;
  for (var i = 0; i < this.orphanEdges.length; i++) {
    this.addEdge(this.orphanEdges.shift(), edgeList, vertList);
  }
};

D3Graph.prototype.addEdge = function(json, edgeList, vertList) {
  if (edgeList === undefined) {
    edgeList = this.edges;
  }
  if (vertList === undefined) {
    vertList = this.vertices;
  }
  var s = this.findVertice(json.source, vertList);
  var t = this.findVertice(json.target, vertList);
  //This edge cannot be resolved, put it into a temporary list
  //And try to re-add it when another file is loaded.
  if (s === undefined || t === undefined) {
    this.orphanEdges.push(json);
    return;
  }
  var w = json.weight;
  var newEdge = {
    "source": s,
    "target": t,
    "weight": w
  };
  edgeList.push(newEdge);
  return newEdge;
};

D3Graph.prototype.findVertice = function(id, list) {
  if (list === undefined) {
    list = this.vertices;
  }
  for (var i = 0; i < list.length; i++) {
    var things = list[i].id.split('')
    if (list[i].id == id) {
      return list[i];
    }
  }
};

D3Graph.prototype._start = function() {
  var outerScope = this;
  this.edge_el = this.edge_el.data(this.force.links(), function(d) {
    return d.source.id + "-" + d.target.id;
  });
  this.edge_line = this.edge_el.enter().insert("g")
    .attr("class", "link")
    .insert("line")
    .attr("class", "link-line");
  this.edge_text = this.edge_el.insert("text")
    .attr("class", "link-label")
    .text(function(d) {
      return parseFloat(d.weight);
    })
    .attr("fill", "white");
  this.edge_el.exit().remove();

  this.vertice_el = this.vertice_el.data(this.force.nodes(), function(d) {
    return d.id;
  });
  this.node_circle = this.vertice_el.enter().insert("g")
    .attr("class", function(d) {
      return "node " + d.id;
    })
    .insert("circle")
    .attr("class", function(d) {
      return "node-circle " + d.id;
    })
    .attr("r", function(d) {
      if (d.id === outerScope.root.id) {
        return 20;
      }
      return 12;
    })
    .attr("fill", function(d) {
      return outerScope.getTrackColor(d.id);
    })
    .on("click", this._click)
    .call(this.drag);
  this.node_name = this.vertice_el.insert("text")
    .attr("class", "node-label")
    .text(function(d) {
      return d.id;
    })
    .attr("fill", function(d) {
      return outerScope.getTrackColor(d.id);
    });
  this.vertice_el.exit().remove();
  this.force.start();
};

D3Graph.prototype._tick = function() {
  var outerScope = this;
  this.edge_line.attr("x1", function(d) {
      return d.source.x;
    })
    .attr("y1", function(d) {
      return d.source.y;
    })
    .attr("x2", function(d) {
      return d.target.x;
    })
    .attr("y2", function(d) {
      return d.target.y;
    });

  this.edge_text.attr("x", function(d) {
      return (d.source.x + d.target.x) / 2;
    })
    .attr("y", function(d) {
      return (d.source.y + d.target.y) / 2;
    });

  this.node_circle.attr("cx", function(d) {
      return d.x;
    })
    .attr("cy", function(d) {
      return d.y;
    });
  this.node_name.attr("x", function(d) {
      return d.x + 20;
    })
    .attr("y", function(d) {
      return d.y + 20;
    });
  this.text.text(this.graphText());
};

D3Graph.prototype.graphText = function() {
  if (this.fullGraph.vertices.length === 0) {
    if (this.fullGraph.edges.length === 0) {
      return "No graph data has been loaded";
    }
  } else if (this.vertices.length === 0) {
    if (this.edges.length === 0) {
      return "Click on a track to see graph data";
    }
  } else {
    return "";
  }
};

D3Graph.prototype.getTrackColor = function(track_id) {
  var track = collectionSet.findTrackByID(track_id);
  if (track === undefined) {
    return "#ffffff";
  }
  return DataSource.trackColor(track.platform + track.sensorType);
};

D3Graph.prototype.displayAdjacencies = function(track_id) {
  var graphVerts = this.fullGraph.vertices;
  var graphEdges = this.fullGraph.edges;
  var root = this.findVertice(track_id, graphVerts);
  if (root === undefined) {
    return;
  }
  console.log("HI");
  this.root = root;
  var adj = this.getAdjacencies(root, this.adj_level, graphEdges);
  this.clearGraph();
  this.vertices.push.apply(this.vertices, adj.vertices);
  this.edges.push.apply(this.edges, adj.edges);
  this._start();
};

D3Graph.prototype.getAdjacencies = function(root, level, edgeList, vis) {
  var res;
  var adj = {
    "vertices": [root],
    "edges": []
  };
  if (vis === undefined) {
    vis = [];
  }
  if (edgeList === undefined) {
    edgeList = this.edges;
  }
  vis.push(root);

  if (!level) {
    return adj;
  }
  for (var i = 0; i < edgeList.length; i++) {
    var edge = edgeList[i];
    if (edge.source == root && vis.indexOf(edge) == -1) {
      vis.push(edge);
      if (vis.indexOf(edge.target) == -1) {
        res = this.getAdjacencies(edge.target, level - 1, edgeList, vis);
        adj.vertices.push.apply(adj.vertices, res.vertices);
        adj.edges.push.apply(adj.edges, res.edges);
      }
      adj.edges.push(edge);
    } else if (edge.target == root && vis.indexOf(edge) == -1) {
      vis.push(edge);
      if (vis.indexOf(edge.source) == -1) {
        res = this.getAdjacencies(edge.source, level - 1, edgeList, vis);
        adj.vertices.push.apply(adj.vertices, res.vertices);
        adj.edges.push.apply(adj.edges, res.edges);
      }
      adj.edges.push(edge);
    }
  }
  return adj;
};

D3Graph.prototype.renderSlider = function(min, max, el) {
  //Append the template to the div
  var outerScope = this;
  var fo = this.control.append("svg:foreignObject")
    .attr('height', this.height)
    .attr('width', 150);
  var div = fo.append('xhtml:div')
    .attr('id', el);

  var slider = document.getElementById(el);
  noUiSlider.create(slider, {
    start: 1,
    step: 1,
    orientation: "vertical",
    direction: 'rtl',
    connect: "lower",
    tooltips: true,
    range: {
      'min': [min],
      'max': [max]
    },
    format: wNumb({
      decimals: 0,
    }),
  });
  slider.noUiSlider.on('slide', function() {
    var vals = slider.noUiSlider.get();
    var level = parseInt(vals[0]);
    outerScope.adj_level = level;
    if (outerScope.root !== undefined) {
      outerScope.displayAdjacencies(outerScope.root.id, level);
    }
  });
};

D3Graph.prototype.dragstart = function(d) {
  d3.event.sourceEvent.stopPropagation();
  d3.select(this).classed("dragging", true);
};

D3Graph.prototype.dragged = function(d) {
  d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
};

D3Graph.prototype.dragend = function(d) {
  d3.select(this).classed("dragging", false);
};

D3Graph.prototype.unloadGraphEntities = function(data) {
  for (var i = 0; i < data.vertices.length; i++) {
    var vert = data.vertices[i];
    this.removeVertice(vert, this.edges, this.vertices);
    this.removeVertice(vert, this.fullGraph.edges, this.fullGraph.vertices);
  }
  this._start();
};

function zoomed() {
  graph.container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

var zoom = d3.behavior.zoom()
  .scaleExtent([0.1, 10]);

D3Graph.prototype._click = function(d) {
  var track = collectionSet.findTrackByID(d.id);
  if (track === undefined) {
    return;
  }
  var trackNode = track.trackNode;
  var entities = track.entities.values;
  var currentTime = viewer.clock.currentTime;

  if (trackNode.isAvailable(currentTime)) {
    var currentPos = trackNode.position.getValue(currentTime);
    if (currentPos === undefined) {
      return;
    }
    var boundingSphere = new Cesium.BoundingSphere(currentPos, 5000);
    viewer.selectedEntity = trackNode;
    viewer.trackedEntity = trackNode;
    viewer.camera.flyToBoundingSphere(boundingSphere);
  } else {
    viewer.flyTo(entities);
  }
};
