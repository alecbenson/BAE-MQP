function D3Graph(width, height, el) {

  this._edges = [];
  this._vertices = [];
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

  this._control = this._svg.append("g");

  this._text = this._svg.append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .text(this.graphText())
    .attr("font-size", "30px")
    .attr("text-anchor", "middle")
    .attr("fill", "white");

  this._container = this.svg.append("g");
  this._vertice_el = this._container.selectAll(".node");
  this._edge_el = this._container.selectAll(".link");

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
      var w = Math.max(0, (1.0 - d.weight));
      return 5 + (w * 100);
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
  'edges': {
    get: function() {
      return this._edges;
    },
    set: function(edges) {
      this._edges = edges;
    }
  },
  'vertices': {
    get: function() {
      return this._vertices;
    },
    set: function(vertices) {
      this._vertices = vertices;
    }
  },
  'edge_el': {
    get: function() {
      return this._edge_el;
    },
    set: function(edge_el) {
      this._edge_el = edge_el;
    }
  },
  'vertice_el': {
    get: function() {
      return this._vertice_el;
    },
    set: function(vertice_el) {
      this._vertice_el = vertice_el;
    }
  },
  'root': {
    get: function() {
      return this._root;
    },
    set: function(root) {
      this._root = root;
    }
  },
  'adj_level': {
    get: function() {
      return this._adj_level;
    },
    set: function(adj_level) {
      this._adj_level = adj_level;
    }
  },
  'width': {
    get: function() {
      return this._width;
    },
    set: function(width) {
      this._width = width;
    }
  },
  'height': {
    get: function() {
      return this._height;
    },
    set: function(height) {
      this._height = height;
    }
  },
  'svg': {
    get: function() {
      return this._svg;
    },
    set: function(svg) {
      this._svg = svg;
    }
  },
  'control': {
    get: function() {
      return this._control;
    }
  },
  'container': {
    get: function() {
      return this._container;
    },
    set: function(container) {
      this._container = container;
    }
  },
  'force': {
    get: function() {
      return this._force;
    },
    set: function(force) {
      this._force = force;
    }
  },
  'drag': {
    get: function() {
      return this._drag;
    },
    set: function(drag) {
      this._drag = drag;
    }
  },
  'text': {
    get: function() {
      return this._text;
    },
    set: function(text) {
      this._text = text;
    }
  },
  'rect': {
    get: function() {
      return this._rect;
    },
    set: function(rect) {
      this._rect = rect;
    }
  },
  'fullGraph': {
    get: function() {
      return this._fullGraph;
    },
    set: function(fullGraph) {
      this._fullGraph = fullGraph;
    }
  }
});

D3Graph.prototype.loadGraphFile = function(filePath) {
  var outerScope = this;
  var newEdge = {},
    newVert = {};
  var vertList = this.fullGraph.vertices;
  var edgeList = this.fullGraph.edges;

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
    outerScope._start();
  });
};

D3Graph.prototype.addVertice = function(json, list) {
  if (list === undefined) {
    list = this.vertices;
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

D3Graph.prototype.addEdge = function(json, edgeList, vertList) {
  if (edgeList === undefined) {
    edgeList = this.edges;
  }
  if (vertList === undefined) {
    vertList = this.vertices;
  }
  var s = this.findVertice(json.source, vertList);
  var t = this.findVertice(json.target, vertList);
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
  this.edge_el = this.edge_el.data(this.force.links(), function(d) {
    return d.source.id + "-" + d.target.id;
  });
  this.edge_el.enter().insert("line")
    .attr("class", "link");
  var edgeText = "thisisatest";
  this.edge_el.exit().remove();

  this.vertice_el = this.vertice_el.data(this.force.nodes(), function(d) {
    return d.id;
  });
  this.vertice_el.enter().append("circle")
    .attr("class", function(d) {
      return "node " + d.id;
    })
    .attr("r", 12)
    .attr("fill", function(d) {
      return D3Graph.trackColor(d.id);
    })
    .on("click", this._click)
    .call(this.drag);
  this.vertice_el.exit().remove();
  this.force.start();
};

D3Graph.prototype._tick = function() {
  var outerScope = this;
  this.edge_el.attr("x1", function(d) {
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

  this.vertice_el.attr("cx", function(d) {
      return d.x;
    })
    .attr("cy", function(d) {
      return d.y;
    });
  this.text.text(this.graphText());
  this.addEdgeText();
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

D3Graph.prototype.displayAdjacencies = function(track_id) {
  var graphVerts = this.fullGraph.vertices;
  var graphEdges = this.fullGraph.edges;
  var root = this.findVertice(track_id, graphVerts);
  if (root === undefined) {
    return;
  }
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
    if (edge.source == root && vis.indexOf(edge.target) == -1) {
      res = this.getAdjacencies(edge.target, level - 1, edgeList, vis);
      adj.vertices.push.apply(adj.vertices, res.vertices);
      adj.edges.push(edge);
      adj.edges.push.apply(adj.edges, res.edges);
    } else if (edge.target == root && vis.indexOf(edge.source) == -1) {
      res = this.getAdjacencies(edge.source, level - 1, edgeList, vis);
      adj.vertices.push.apply(adj.vertices, res.vertices);
      adj.edges.push(edge);
      adj.edges.push.apply(adj.edges, res.edges);
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
    .attr('id', el)
    .attr('type', 'button');

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
  var outerScope = this;

  for (var i = 0; i < data.vertices.length; i++) {
    var vert = data.vertices[i];
    this.removeVertice(vert, this.fullGraph.edges, this.fullGraph.vertices);
    this.removeVertice(vert);
  }
  this._start();
};

D3Graph.trackColor = function(trackId) {
  var id = 0;
  for (var i = 0; i < trackId.length; i++) {
    id += trackId.charCodeAt(i);
  }
  var red = D3Graph._colorSeed(id + 1);
  var green = D3Graph._colorSeed(id + 4);
  var blue = D3Graph._colorSeed(id + 7);
  var result = "#" + red + green + blue;
  return result;
};

D3Graph._colorSeed = function(id) {
  var num = Math.sin(id) * 10000;
  num = num - Math.floor(num);
  result = Math.round((num * 154) + 100).toString(16);
  return result;
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
    var boundingSphere = new Cesium.BoundingSphere(currentPos, 5000);
    viewer.selectedEntity = trackNode;
    viewer.camera.flyToBoundingSphere(boundingSphere);
  } else {
    viewer.flyTo(entities);
  }
};

D3Graph.prototype.addEdgeText = function() {
  var edgeRect;
  for(var i = 0; i < this.edges.length; i++) {
    edgeRect = $(".link")[i];
    this._svg.append("text")
      .text(this.edges[i].weight)
      .attr("fill", "white")
      .attr("x", edgeRect.x1.animVal.value)
      .attr("y", edgeRect.y1.animVal.value);
  }
}
