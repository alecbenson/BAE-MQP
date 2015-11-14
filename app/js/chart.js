function D3Graph(width, height, el) {

  this._edges = [];
  this._vertices = [];
  this._width = width;
  this._height = height;

  this._svg = d3.select(el).append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g");

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
    .style("fill", "none")
    .style("pointer-events", "all");

  this._force = d3.layout.force()
    .nodes(this.vertices)
    .links(this.edges)
    .charge(-400)
    .linkDistance(100)
    .size([width, height]);

  this._drag = this._force.drag()
    .on("dragstart", this.dragstart)
    .on("drag", this.dragged)
    .on("dragend", this.dragend);

  zoom.on("zoom", zoomed.bind(this));
  this._svg.call(zoom);
  this._force.on("tick", this._tick.bind(this));
  this._force.start();
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
  }
});

D3Graph.prototype.loadGraphFile = function(filePath) {
  var outerScope = this;
  d3.json(filePath, function(error, graph) {
    if (error) {
      throw error;
    }
    for (var i = 0; i < graph.vertices.length; i++) {
      outerScope.addVertice(graph.vertices[i]);
    }
    for (var j = 0; j < graph.edges.length; j++) {
      outerScope.addEdge(graph.edges[j]);
    }
    outerScope._start();
  });
};

D3Graph.prototype.addVertice = function(json) {
  this.vertices.push({
    "id": json.id
  });
  this._start();
};

D3Graph.prototype.removeVertice = function(id) {
  var v = this.findVertice(id);
  for (var i = 0; i < this.edges.length; i++) {
    if ((this.edges[i].source == v) || (this.edges[i].target == v)) {
      this.edges.splice(i, 1);
    }
  }
  var vertIndex = this.findVerticeIndex(id);
  this.vertices.splice(vertIndex, 1);
  this._start();
};

D3Graph.prototype.addEdge = function(json) {
  var s = this.findVertice(json.source);
  var t = this.findVertice(json.target);
  var w = json.weight;
  this.edges.push({
    "source": s,
    "target": t,
    "weight": w
  });
};

D3Graph.prototype.removeEdge = function(source, target) {
  for(var i = 0; i < this.edges.length; i++){
    if (this.edges[i].source.id == source && this.edges[i].target.id == target){
      this.edges.splice(i, 1);
      break;
    }
  }
};

D3Graph.prototype.findVertice = function(id) {
  for (var i = 0; i < this.vertices.length; i++) {
    if (this.vertices[i].id == id) {
      return this.vertices[i];
    }
  }
};

D3Graph.prototype.findVerticeIndex = function(id) {
  for (var i = 0; i < this.vertices.length; i++) {
    if (this.vertices[i].id == id) {
      return i;
    }
  }
};

D3Graph.prototype._start = function() {
  this.edge_el = this.edge_el.data(this.force.links(), function(d) {
    return d.source.id + "-" + d.target.id;
  });
  this.edge_el.enter().insert("line")
    .attr("class", "link");
  this.edge_el.exit().remove();

  this.vertice_el = this.vertice_el.data(this.force.nodes(), function(d) {
    return d.id;
  });
  this.vertice_el.enter().append("circle")
    .attr("class", function(d) {
      return "node id" + d.id;
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
};

D3Graph.prototype.graphText = function() {
  if (this.isGraphEmpty()) {
    return "No graph data has been loaded";
  } else {
    return "";
  }
};

D3Graph.prototype.isGraphEmpty = function() {
  return this.vertices.length === 0 &&
    this.edges.length === 0;
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

  for(var i = 0; i< data.vertices.length; i++){
    var vert = data.vertices[i];
    this.removeVertice(vert.id);
  }
  this._start();
};

D3Graph.trackColor = function(trackId) {
  var id = 0;
  for (var i = 0; i < trackId.length; i++) {
    id += trackId.charCodeAt(i);
  }
  var red = D3Graph._colorSeed(id + 123);
  var green = D3Graph._colorSeed(id + 456);
  var blue = D3Graph._colorSeed(id + 789);
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
