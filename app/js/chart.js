/* global d3 */

(function() {

  // Chart dimensions.
  var width = 500;
  var height = 500;
  var nodes = [];
  var links = [];

  // Set the force between vertices
  var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .charge(-400)
    .linkDistance(100)
    .size([width, height])
    .on("tick", tick);

  var zoom = d3.behavior.zoom()
    .scaleExtent([0.1, 10])
    .on("zoom", zoomed);

  // Make vertices dragable
  var drag = force.drag()
    .on("dragstart", dragstart)
    .on("drag", dragged)
    .on("dragend", dragend);

  // Create the SVG container and set the origin.
  var svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .call(zoom);

  var container = svg.append("g");
  var rect = container.append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all");

  // Get a list of the links and nodes
  var link = container.selectAll(".link"),
    node = container.selectAll(".node");

  function start() {
    link = link.data(force.links());
    link.enter().insert("line")
      .attr("class", "link");
    link.exit().remove();

    node = node.data(force.nodes());
    node.enter().append("circle")
      .attr("class", "node")
      .attr("r", 12)
      .on("dblclick", dblclick)
      .call(drag);
    node.exit().remove();

    force.start();
  }

  function loadGraphFile(filePath) {
    d3.json(filePath, function(error, graph) {
      if (error) {
        throw error;
      }
      nodes = $.merge(nodes, graph.nodes);
      links = $.merge(links, graph.links);
      start();
    });
  }

  function addNode(node) {
    nodes.push(node);
    start();
  }

  loadGraphFile("graph.json");

  function tick() {
    link.attr("x1", function(d) {
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

    node.attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      });
  }

  function dblclick(d) {}

  function zoomed() {
    container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  }

  function dragstart(d) {
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).classed("dragging", true);
  }

  function dragged(d) {
    d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
  }

  function dragend(d) {
    d3.select(this).classed("dragging", false);
  }

}());
