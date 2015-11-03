/* global d3 */

(function () {
    // Chart dimensions.
    var width = 500,
        height = 500;

    // Set the force between vertices
    var force = d3.layout.force()
        .size([width, height]) // Sets the size of the chart
        .charge(-400) // The strength of the force
        .linkDistance(100) // The distance between 2 nodes
        .on("tick", tick); // When to update

    // Make vertices dragable
    var drag = force.drag()
        .on("dragstart", dragstart);

    // Create the SVG container and set the origin.
    var svg = d3.select("#chart").append("svg")
        .attr("width", width)
        .attr("height", height);

    // Get a list of the links and nodes
    var link = svg.selectAll(".link"),
        node = svg.selectAll(".node");

    d3.json("graph.json", function(error, graph) {
        if(error) {
            throw error;
        }

        force
            .nodes(graph.nodes)
            .links(graph.links)
            .start();

        link = link.data(graph.links)
            .enter().append("line")
            .attr("class", "link");

        node = node.data(graph.nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", 12)
            .on("dblclick", dblclick)
            .call(drag);
    });

    function tick() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
    }

    function dblclick(d) {
        d3.select(this).classed("fixed", d.fixed = false);
    }

    function dragstart(d) {
        d3.select(this).classed("fixed", d.fixed = true);
    }
}());
