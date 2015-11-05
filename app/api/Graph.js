var fs = require('fs');
var path = require('path');

function Graph(edges, vertices) {
  this._edges = edges;
  this._vertices = vertices;

}

Object.defineProperties(Graph.prototype, {
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
  }
});

Graph.prototype.writeJSON = function(filePath, fileName) {
  var result = JSON.stringify(this, null, 2);
  var fullPath = path.join(filePath, fileName);
  fs.writeFile(fullPath, result, function(err) {
    if (err) {
      return console.log(err);
    }
  });
};

Graph.prototype.toJSON = function() {
  return {
    vertices: this._vertices,
    edges: this._edges,
  };
};

// For your own sanity, please do not try to make sense of the following
// ~50 lines of code. Just accept that it works and move on
// The code below is used to parse data from a sage file.
Graph.fromSage = function(buffer) {
  try {
    //Remove backslashes, newlines, and single quotes
    var strippedData = buffer.replace(/['\\\n]/g, '');
    //I hate this so much
    //Grab the text between 'add_vertices'
    var verticesString = /add_vertices\(\[([^)]+)\]/.exec(strippedData)[1];
    //Remove trailing comma if it exists
    verticesString = verticesString.replace(/,$/, '');
    //Split the resulting text by commas
    var verticesList = verticesString.split(',').map(formatVertice);
    //Grab text between 'add_edges'
    var edgesString = /add_edges\(\[([^]*)\]\)/.exec(strippedData)[1];
    var edgesList = formatEdges(edgesString);
    return new this(edgesList, verticesList);
  } catch (e) {
    return new this([], []);
  }
};

function formatEdges(edgesString) {
  // (╯°□°)╯ ┻━┻
  edgesString = edgesString.replace(/\s/g, '');
  var items = edgesString.replace(/^\(|\)$|\),$/g, "").split("),(");
  items.forEach(function(val, index, array) {
    var nums = val.split(",");

    var edge = {
      "source": parseInt(nums[0]),
      "target": parseInt(nums[1]),
      "weight": parseFloat(nums[2]),
    };
    array[index] = edge;
  });
  return items;
}

function formatVertice(vertice) {
  return {
    "id": parseInt(vertice)
  };
}

module.exports = Graph;
