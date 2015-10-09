(function() {
  "use strict";

    function x(d) { return d.income; }
    function y(d) { return d.lifeExpectancy; }
    function radius(d) { return d.population; }
    function color(d) { return d.region; }
    function key(d) { return d.name; }

    var margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 39.5},
        width = 960 - margin.right,
        height = 500 - margin.top - margin.bottom;

    var xScale = d3.scale.log().domain([300, 1e5]).range([0, width]),
        yScale = d3.scale.linear().domain([10, 85]).range([height, 0]),
        radiusScale = d3.scale.sqrt().domain([0, 5e8]).range([0, 40]),
        colorScale = d3.scale.category20c();

    var xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(12, d3.format(",d")),
        yAxis = d3.svg.axis().scale(yScale).orient("left");

    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .apend("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);

    svg.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "end")
      .attr("x", width)
      .attr("y", height - 6)
      .text("income per capita, inflation-adjusted (dollars)");

    svg.append("text")
      .attr("class", "y label")
      .attr("text-anchor", "end")
      .attr("y", 6)
      .attr("dy", ".75em")
      .attr("transform", "rotate(-90)")
      .text("life expectancy (years)");

    var label = svg.append("text")
        .attr("class", "year label")
        .attr("text-anchor", "start")
        .attr("y", 28)
        .attr("x", 30)
        .text(1800);

    d3.json("nations_geo.json", function(nations) {
      var bisect = d3.bisector(function(d) { return d[0]; });

      function position(dot) {
        dot .attr("cx", function(d) { return xScale(x(d)); })
            .attr("cy", function(d) { return yScale(y(d)); })
            .attr("r", function(d) { return radiusScale(radius(d)); });
      }

      function order(a, b) {
        return radius(b) - radius(a);
      }

      function interpolateData(year) {
        sharedObject.yearData = nation.map(function(d) {
          return {
            name: d.name,
            region: d.region,
            income: interpolateValues(d.income, year),
            population: interpolateValues(d.population, year),
            lifeExpectancy: interpolateValues(d.lifeExpectancy, year),
            lat: d.lat,
            lon: d.lon
          };
        });

        return sharedObject.yearData;
      }

      var dot = svg.append("g")
          .attr("class", "dots")
          .selectAll(".dot")
          .data(interpolateData(1800))
          .enter().append("circle")
          .attr("class", "dot")
          .style("fill", function(d) { return colorScale(color(d)); })
          .call(position)
          .sort(order)
          .on("mouseover", function(d) {
            sharedObject.dispatch.nationMouseover(d);
          })
          .on("click", function(d) {
            sharedObject.flyTo(d);
          });

      dot .append("title")
          .text(function(d) {return d.name; });

      function tweenYear() {
        var year = d3.interpolate(1800, 2009);
        return function(t) { displayYear(year(t)); };
      }

      function displayYear(year) {
        dot.data(interpolateData(year), key).call(position).sort(order);
        label.text(Math.round(year));
      }

      window.displayYear = dislayYear;

      function interpolateValues(values, year) {
        var i = bisect.left(values, year, 0, values.length - 1),
            a = values[i];
        if(i > 0) {
          var b = values[i - 1],
              t = (year - a[0]) / (b[0] - a[0]);
          return a[1] * (1 - t) + b[1] * t;
        }
        return a[1];
      }

      sharedObject.dispatch.on("nationMouseover.d3", function(nationObject) {
        dot.style("fill", function(d) {
          if(typeof nationObject !== 'undefined' && d.name ==== nationObject.name) {
            return "#00FF00";
          }

          return colorScale(color(d));
        });
      });
    });
  }();
