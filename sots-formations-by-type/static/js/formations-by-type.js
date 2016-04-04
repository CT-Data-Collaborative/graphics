$(document).ready(function(){
    // variables
    var pymChild = null;
    var aspect_ratio = (2 / 5); // H / W
    var mobile_threshold = 500;

    // we need this in a few places
    var dateFormat = d3.time.format("%Y");
    var numberFormat = d3.format(",d");
    var percentFormat = d3.format(",%");

    // recession start/end dates
    var recessionFormat = d3.time.format("%Y-%m-%d");
    var recessions = [
        {
            start : recessionFormat.parse("2001-03-01"),
            end : recessionFormat.parse("2001-12-30")
        },{
            start : recessionFormat.parse("2007-12-01"),
            end : recessionFormat.parse("2009-06-30")
        }
    ];

    d3.csv("static/data/formations-by-type-by-year.csv", function(data) {
        const DATA = data.map(function(o) {
            return {
                "Year" : dateFormat.parse(o.Year),
                "LLC" : parseInt(o.LLC),
                "Corporation" : parseInt(o.Corporation),
                "Other" : parseInt(o.Other)
            }
        });

        /** START Legend **/
        /** END Legend **/

        /** START container var **/
        var container = d3.select("div#chart");
        /** END container var **/

        function drawChart(container_width) {
            console.log(container_width)

            // remove existing graphics
            container.selectAll("svg").remove();
            d3.selectAll("p.value").remove();

            // vars
            var height = container_width * aspect_ratio;
            var width = container_width;

            var margin = {
                top: 0.05 * height,
                right: 0.12 * width,
                bottom: 0.1 * height,
                left: 0.08 * width
            }

            // check bottom/left for minimums
            if (container_width < mobile_threshold) {
                margin = {
                    top: 0.05 * height,
                    right: 0.12 * width,
                    bottom: 0.30 * height,
                    left: 0.2 * width
                }
            } else if (container_width < mobile_threshold * 1.5) {
                margin = {
                    top: 0.05 * height,
                    right: 0.12 * width,
                    bottom: 0.1 * height,
                    left: 0.12 * width
                }
            }

            // svg container
            var svg = container.append("svg")
                .attr("height", height)
                .attr("width", width);

            // take margins off of height and width
            height = (height-(margin.top + margin.bottom));
            width = (width-(margin.left + margin.right));

            // Scales
            var x = d3.time.scale()
                .range([0, width])
                .domain(d3.extent(DATA, function(d) { return d.Year; }));

            var y = d3.scale.linear()
                .range([height, 0])
                .domain(
                    d3.extent(
                        DATA.map(function(v) { return v.Corporation; }).concat(DATA.map(function(v) { return v.LLC; }))
                    )
                )

            // width of x scale "bands"
            var xBandWidth = x(dateFormat.parse("1981")) - x(dateFormat.parse("1980"))

            var corpLine = d3.svg.line()
                .x(function(d) { return x(d.Year); })
                .y(function(d) { return y(d.Corporation); });

            var llcLine = d3.svg.line()
                .x(function(d) { return x(d.Year); })
                .y(function(d) { return y(d.LLC); });

            var otherLine = d3.svg.line()
                .x(function(d) { return x(d.Year); })
                .y(function(d) { return y(d.Other); });

            var chart = svg.append("g")
                .classed("chart", true)
                .attr("height", height)
                .attr("width", width)
                .attr("transform", "translate("+ margin.left + ", " + margin.top + ")");

            // first add recession markers
            var recessionGroup = chart.append("g");

            recessions.forEach(function(r) {
              recessionGroup.append("rect")
                  .classed("recession", true)
                  .attr("x", x(r.start))
                  .attr("y", 0)
                  .attr("height", height)
                  .attr("width", x(r.end) - x(r.start))
            })

            // axes
            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .ticks(d3.time.year, 2);

            if (container_width < mobile_threshold) {
                xAxis
                    .ticks(d3.time.year, 5)
                    .tickFormat(d3.time.format("'%y"))
            } else if (container_width < mobile_threshold * 2) {
                xAxis
                    // .ticks(d3.time.year, 2)
                    .tickFormat(d3.time.format("'%y"))
            }

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            if (container_width < mobile_threshold) {
                yAxis.ticks(5);
            }

            var xAxis = chart.append("g")
              .attr("class", "axis xaxis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis);

            var xAxisLabel = xAxis.append("text")
                .attr("dy", "-1em")
                .attr("dx", width)
                .style("text-anchor", "end")
                .text("Year");

            if (container_width < mobile_threshold) {
                xAxisLabel.attr("dy", "2.25em")
            }

            var yAxis = chart.append("g")
                  .attr("class", "axis yaxis")
                  .call(yAxis)
            var yAxisLabel = yAxis.append("text")
                  .attr("y", 6)
                  .attr("dy", "0.71em")
                  .attr("dx", "0.5em")
                  .text("Formations");

            if (container_width > mobile_threshold) {
                yAxisLabel
                    .attr("transform", "rotate(-90)")
                    .attr("dx", 0)
                    .style("text-anchor", "end")
            }  

              var lineGroup = chart.append("g");

              lineGroup.append("path")
                  .datum(DATA)
                  .classed({
                    "line" : true,
                    "corporation" : true
                  })
                  .attr("d", corpLine);

              lineGroup.append("path")
                  .datum(DATA)
                  .classed({
                    "line" : true,
                    "llc" : true
                  })
                  .attr("d", llcLine);

              lineGroup.append("path")
                  .datum(DATA)
                  .classed({
                    "line" : true,
                    "other" : true
                  })
                  .attr("d", otherLine);

            var hoverGroups = chart.append("g")
                .selectAll("g")
                .data(DATA)
                .enter()
                    .append("g")
                    .attr("class", function(d){
                        return [
                            "hover-group",
                            "_"+dateFormat(d.Year)
                        ].join(" ")
                    })
                    .attr("width", xBandWidth)
                    .attr("height", height)
                    .attr("data-year", function(d) {
                        return "_"+dateFormat(d.Year);
                    })
                    .datum(function(d) { return d; })

            var rectWidth = (x(dateFormat.parse("2001")) - x(dateFormat.parse("2000"))) / 4;
            var labelContainer = d3.select("div#value-label")
            hoverGroups.each(function(pointData, i) {
                // console.log(pointData);
                var yearClass = "_"+dateFormat(pointData.Year);

                var group = d3.select(this);

                group.append("rect")
                    .classed("group-filler", true)
                    .attr("height", group.attr("height"))
                    .attr("width", function() {
                        // first and last bars are only half width
                        if (i === 0 || i == (hoverGroups.size() - 1)) {
                            return group.attr("width")/2
                        } else {
                            return group.attr("width");
                        }
                    })
                    .attr("x", function() {
                        if (i === 0) {
                            // first bar is only half width, not offset left
                            return x(pointData.Year);
                        } else {
                            return x(pointData.Year) - (xBandWidth/2)
                        }
                    })

                group.append("rect")
                    .classed("hover-line", true)
                    .attr("x", x(pointData.Year) - 2)
                    .attr("y", 0)
                    .attr("height", height)
                    .attr("width", 4)

                group.append("path")
                    .attr("class", function() {
                        return [
                            "point",
                            "corporation"
                        ].join(" ");
                    })
                    .attr("d", d3.svg.symbol().type("circle").size(50))
                    .attr("transform", function(d) { return "translate(" + x(pointData.Year) + ", " + y(pointData.Corporation) +")";})

                group.append("path")
                    .attr("class", function() {
                        return [
                            "point",
                            "llc"
                        ].join(" ");
                    })
                    .attr("d", d3.svg.symbol().type("circle").size(50))
                    .attr("transform", function(d) { return "translate(" + x(pointData.Year) + ", " + y(pointData.LLC) +")";})

                group.append("path")
                    .attr("class", function() {
                        return [
                            "point",
                            "other"
                        ].join(" ");
                    })
                    .attr("d", d3.svg.symbol().type("circle").size(50))
                    .attr("transform", function(d) { return "translate(" + x(pointData.Year) + ", " + y(pointData.Other) +")";})

                // value label text

                // calculate percent shares
                var total = pointData.Corporation + pointData.LLC + pointData.Other;
                var shares = {
                    Corporation : percentFormat(pointData.Corporation/total),
                    LLC : percentFormat(pointData.LLC/total),
                    Other : percentFormat(pointData.Other/total)
                }

                labelContainer.append("p")
                    .attr("class", function() {
                        return [
                            "value",
                            yearClass
                        ].join(" ");
                    })
                    .selectAll("span")
                    .data(["Year", dateFormat(pointData.Year)])
                    .enter()
                        .append("span")
                        .text(function(t) { return t; })

                var corpValue = [
                    numberFormat(pointData.Corporation),
                    ["(", ")"].join(shares["Corporation"])
                ].join(" ");
                labelContainer.append("p")
                    .attr("class", function() {
                        return [
                            "value",
                            yearClass
                        ].join(" ");
                    })
                    .selectAll("span")
                    .data(["Corporation", corpValue])
                    .enter()
                        .append("span")
                        .text(function(t) { return t; })

                var llcValue = [
                    numberFormat(pointData.LLC),
                    ["(", ")"].join(shares["LLC"])
                ].join(" ");
                labelContainer.append("p")
                    .attr("class", function() {
                        return [
                            "value",
                            yearClass
                        ].join(" ");
                    })
                    .selectAll("span")
                    .data(["LLC", llcValue])
                    .enter()
                        .append("span")
                        .text(function(t) { return t; })

                var otherValue = [
                    numberFormat(pointData.Other),
                    ["(", ")"].join(shares["Other"])
                ].join(" ");
                labelContainer.append("p")
                    .attr("class", function() {
                        return [
                            "value",
                            yearClass
                        ].join(" ");
                    })
                    .selectAll("span")
                    .data(["Other", otherValue])
                    .enter()
                        .append("span")
                        .text(function(t) { return t; })
            })

            // register hover events for point groups
            hoverGroups
                .on("mouseover", function(){
                    var highlightClass = d3.select(this).attr("data-year");

                    d3.select("div#value-label")
                        .classed("highlight", true);

                    d3.selectAll("."+highlightClass)
                        .classed("highlight", true);
                })
                .on("mouseout", function(){
                    d3.selectAll(".highlight")
                        .classed("highlight", false);
                })

            // console.log(DATA);
        }

        pymChild = new pym.Child({ renderCallback: drawChart });
    });
});