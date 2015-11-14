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
  var that = this;
  d3.json(filePath, function(error, graph) {
    if (error) {
      throw error;
    }
    that.vertices = $.merge(that.vertices, graph.vertices);
    that.edges = $.merge(that.edges, graph.edges);
    that._start();
  });
};

D3Graph.prototype._start = function() {
  this.edge_el = this.edge_el.data(this.force.links());
  this.edge_el.enter().insert("line")
    .attr("class", "link");
  this.edge_el.exit().remove();

  this.vertice_el = this.vertice_el.data(this.force.nodes());
  this.vertice_el.enter().append("circle")
    .attr("class", "node")
    .attr("r", 12)
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
    })
    .attr("source", function(d) {
      return "vert" + d.source.id;
    })
    .attr("target", function(d) {
      return "vert" + d.target.id;
    });

  this.vertice_el.attr("cx", function(d) {
      return d.x;
    })
    .attr("cy", function(d) {
      return d.y;
    })
    .attr("fill", function(d) {
      return D3Graph.trackColor(d.id);
    })
    .attr("id", function(d) {
      return "vert" + d.id;
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

D3Graph.prototype.addNode = function(node) {
  this.nodes.push(node);
  this._start();
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
  //Filter is a built in javascript method that returns a new array with
  //All elements that pass the 'test'
  var outerScope = this;

  //Set the vertices array to all elements that do not contain the vertices
  //Defined in the file we are unloading
  this.vertices = this.vertices.filter(function(el) {
    var is_delete_el = data.vertices.indexOfProperty("id", el.id) >= 0;
    //Delete the SVG circle
    if (is_delete_el) {
      outerScope.container.select("[id=vert" + el.id + "]").remove();
    }
    return !is_delete_el;
  });

  //Set the edges array to all elements that do not contain the edges
  //Defined in the file we are unloading
  this.edges = this.edges.filter(function(el) {
    var contains_s, contains_t = false;
    has_s = data.edges.indexOfProperty("source", el.source.id) >= 0;
    if (!has_s) {
      return false;
    }
    has_t = data.edges.indexOfProperty("target", el.target.id) >= 0;
    var is_delete_el = has_s && has_t;
    //Delete the SVG line
    if (is_delete_el) {
      var s_selector = "[source=vert" + el.source.id + "]";
      var t_selector = "[target=vert" + el.target.id + "]";
      outerScope.container.select(s_selector + t_selector).remove();
    }
    return !is_delete_el;
  });
  this._start();
};

D3Graph.trackColor = function(trackId) {
  var red = D3Graph._colorSeed(trackId + 123);
  var green = D3Graph._colorSeed(trackId + 456);
  var blue = D3Graph._colorSeed(trackId + 789);
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

Array.prototype.indexOfProperty = function(attr, val) {
  for (var i = 0; i < this.length; i++) {
    element = this[i];
    if (element.hasOwnProperty(attr)) {
      if (element[attr] == val) {
        return i;
      }
    }
  }
  return -1;
};
