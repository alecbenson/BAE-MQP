/* global d3, sharedObject */

(function () {
    "use strict";

    // Various accessors that specify the four dimensions of data to visualize.
    function x(d) { return d.lon; }
    function y(d) { return d.lat; }
    function radius(d) { return d.ele; }
    // function color(d) { return d.; }
    function key(d) { return d.id; }

    // Chart dimensions.
    var margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 39.5},
        width = 500 - margin.right,
        height = 500 - margin.top - margin.bottom;

    // Various scales. These domains make assumptions of data, naturally.
    var xScale = d3.scale.linear().domain([-180, 180]).range([0, width]),
        yScale = d3.scale.linear().domain([-90, 90]).range([height, 0]),
        radiusScale = d3.scale.pow().domain([0, 50000]).range([0, 40]);
        // colorScale = d3.scale.category20c();

    // The x & y axes.
    var xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(12, d3.format(",d")),
        yAxis = d3.svg.axis().scale(yScale).orient("left");

    // Create the SVG container and set the origin.
    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add the x-axis.
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the y-axis.
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    // Add an x-axis label.
    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 6)
        .text("longitude (degrees)");

    // Add a y-axis label.
    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("latitude (degrees)");

    // Add the year label; the value is set on transition.
    var label = svg.append("text")
        .attr("class", "year label")
        .attr("text-anchor", "start")
        .attr("y", 28)
        .attr("x", 30)
        .text("test title");

    // Load the data.
    function load(source) {

        // A bisector since many nation's data is sparsely-defined.
        var bisect = d3.bisector(function(d) { return d[0]; });

        // Positions the dots based on data.
        function position(dot) {
            dot.attr("cx", function(d) { return xScale(x(d)); })
                .attr("cy", function(d) { return yScale(y(d)); })
                .attr("r", function(d) { return radiusScale(radius(d)); });
        }

        // Defines a sort order so that the smallest dots are drawn on top.
        function order(a, b) {
            return radius(b) - radius(a);
        }
        // Interpolates the dataset for the given (fractional) year.
        function interpolateData() {
            sharedObject.yearData = vertices.vertices.map(function(d) {
                return {
                    id: d.id,
                    lat: d.lat,
                    lon: d.lon,
                    ele: d.ele,
                    time: d.time
                };
            });

            return sharedObject.yearData;
        }

        // Add a dot per nation. Initialize the data at 1800, and set the colors.
        var dot = svg.append("g")
            .attr("class", "dots")
            .selectAll(".dot")
            .d ata(interpolateData())
            .enter().append("circle")
            .attr("class", "dot")
            //  .style("fill", function(d) { return colorScale(color(d)); })
            .call(position)
            .sort(order)
            .on("mouseover", function(d) {
                sharedObject.dispatch.nationMouseover(d);
            })
            .on("click", function(d){
                sharedObject.flyTo(d);
            });

        // Add a title.
        dot.append("title")
            .text(function(d) { return d.name; });


        // Tweens the entire chart by first tweening the year, and then the data.
        // For the interpolated data, the dots and label are redrawn.
        function tweenYear() {
            var year = d3.interpolateNumber(1800, 2009);
            return function(t) {
                displayYear(year(t));
            };
        }

        // Updates the display to show the specified year.
        function displayYear(year) {
            dot.data(interpolateData(year), key).call(position).sort(order);
            label.text(Math.round(year));
        }

        // make displayYear global
        window.displayYear = displayYear;

        // Finds (and possibly interpolates) the value for the specified year.
        function interpolateValues(values, year) {
            var i = bisect.left(values, year, 0, values.length - 1),
                a = values[i];
            if (i > 0) {
                var b = values[i - 1],
                    t = (year - a[0]) / (b[0] - a[0]);
                return a[1] * (1 - t) + b[1] * t;
            }
            return a[1];
        }

        sharedObject.dispatch.on("nationMouseover.d3", function(nationObject) {
            dot.style("fill", function(d) {
                if (typeof nationObject !== 'undefined' && d.name === nationObject.name) {
                    return "#00FF00";
                }

                return colorScale(color(d));
            });
        });
    }


    setTimeout(function() {
        console.log(collections);
        for(var collection in collections) {
            console.log(collection);
            for(var source in collection) {
                console.log(source);
            }
        }
    }, 10000);
}());
