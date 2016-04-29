$(document).ready(function(){
    // variables
    var pymChild = null;
    var aspect_ratio = (2 / 5); // H / W
    var mobile_threshold = 799;

    // we need this in a few places
    var dateFormat = d3.time.format("%Y");
    var numberFormat = d3.format(",d");
    var shortNumberFormat = d3.format(",s");
    var integerPercentFormat = d3.format(",.0%");
    var decimalPercentFormat = d3.format(",.1%");

    var classNames = {
        "Hartford" : "hartford",
        "Stamford" : "stamford",
        "Bridgeport" : "bridgeport",
        "Waterbury" : "waterbury",
        "New Haven" : "new_haven"
    };

    function sluggify(text) {
        text = text.toString();
        var first = text.slice(0, 1);
        if(d3.range(0,10).indexOf(parseInt(first)) !== -1) {
            text = "_" + text;
        }

        return text
            .toLowerCase()
            .replace(/[^0-9a-zA-Z_]/ig, "_")
            .replace(/_+/ig, "_");
    }

    d3.csv("static/data/eligible-exit-to-ecse.csv", function(data) {
        const DATA = data.map(function(o) {
            return {
                "Town" : o["Town"],
                "Year" : dateFormat.parse(o["Year"]),
                "Eligible Exited to ECSE" : parseFloat(o["Value"]) / 100
            };
        });

        /** START container var **/
        var container = d3.select("div#chart");
        /** END container var **/

        function drawChart(container_width) {
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
                left: 0.05 * width
            }

            // check bottom/left for minimums
            if (container_width < mobile_threshold) {
                margin = {
                    top: 0.08 * height,
                    right: 0.15 * width,
                    bottom: 0.30 * height,
                    left: 0.12 * width
                }
            } else if (container_width < mobile_threshold * 1.5) {
                margin = {
                    top: 0.05 * height,
                    right: 0.12 * width,
                    bottom: 0.1 * height,
                    left: 0.08 * width
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
                .domain(d3.extent(DATA, function(d) { return d.Year; }))

            var xBandWidth = x(dateFormat.parse("2012")) - x(dateFormat.parse("2011"))

            var y = d3.scale.linear()
                .range([height, 0])
                .domain([0.2, 0.65]);

            var chart = svg.append("g")
                .classed("chart", true)
                .attr("height", height)
                .attr("width", width)
                .attr("transform", "translate("+ margin.left + ", " + margin.top + ")");

            // axes
            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .ticks(d3.time.year, 2);

            if (container_width < mobile_threshold) {
                xAxis
                    // .ticks(d3.time.year, 5)
                    .tickFormat(d3.time.format("'%y"))
            } else if (container_width < mobile_threshold * 2) {
                xAxis
                    // .ticks(d3.time.year, 2)
                    .tickFormat(d3.time.format("'%y"))
            }

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .tickFormat(integerPercentFormat);

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

            // if (container_width < mobile_threshold) {
                xAxisLabel.attr("dy", "2.25em")
            // }

            var yAxis = chart.append("g")
                  .attr("class", "axis yaxis")
                  .call(yAxis)
            var yAxisLabel = yAxis.append("text")
                  .text("Eligible Exited to ECSE")
                  .attr("dx", "0.5em")
                  .attr("dy", "0.1em")

            var lines = d3.nest()
                .key(function(o) { return o["Town"]; })
                .map(DATA);

            var lineGroup = chart.append("g");

            Object.keys(classNames).forEach(function(town) {
                var lineData = lines[town];

                var lineFunction = d3.svg.line()
                    .x(function(d) { console.log(x(d.Year)); return x(d.Year); })
                    .y(function(d) { console.log(y(d["Eligible Exited to ECSE"])); return y(d["Eligible Exited to ECSE"]); })

                lineGroup.append("path")
                    .datum(lineData)
                    .attr("class", function(){
                        return [
                            "line",
                            classNames[town]
                        ].join(" ")
                    })
                    .attr("d", lineFunction);
            });

            var years = d3.nest()
                .key(function(o) { return o["Year"]; })
                .entries(DATA);

            var hoverGroups = chart.append("g")
                .selectAll("g")
                .data(years)
                .enter()
                    .append("g")
                    .attr("class", function(d){
                        return [
                            "hover-group",
                            "_"+dateFormat(d.values[0].Year)
                        ].join(" ")
                    })
                    .attr("width", xBandWidth)
                    .attr("height", height)
                    .attr("data-year", function(d) {
                        return "_"+dateFormat(d.values[0].Year);
                    })
                    .datum(function(d) { return d.values; })

            var rectWidth = (x(dateFormat.parse("2012")) - x(dateFormat.parse("2011"))) / 4;
            var labelContainer = d3.select("div#value-label")
            hoverGroups.each(function(pointData, i) {
                // console.log(pointData);
                var yearClass = "_"+dateFormat(pointData[0].Year);

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
                        if (i == 0) {
                            // first bar is only half width, not offset left
                            return x(pointData[0].Year);
                        } else {
                            return x(pointData[0].Year) - (xBandWidth/2)
                        }
                    })

                group.append("rect")
                    .classed("hover-line", true)
                    .attr("x", x(pointData[0].Year) - 2)
                    .attr("y", 0)
                    .attr("height", height)
                    .attr("width", 4)

                // Value labels - year
                labelContainer.append("p")
                    .attr("class", function() {
                        return [
                            "value",
                            yearClass
                        ].join(" ");
                    })
                    .selectAll("span")
                    .data(["Year", dateFormat(pointData[0].Year)])
                    .enter()
                    .append("span")
                        .text(function(t) { return t; })

                // Draw points
                var points = group.selectAll("path.point")
                    .data(pointData)
                    .enter()
                    .append("path")
                        .attr("class", function(d) {
                            return [
                                "point",
                                sluggify(d["Town"])
                            ].join(" ");
                        })
                        .attr("d", d3.svg.symbol().type("circle").size(50))
                        .attr("transform", function(d) { return "translate(" + x(d["Year"]) + ", " + y(d["Eligible Exited to ECSE"]) +")";})

                pointData.map(function(town) {
                    // make text labels
                    var valueText = [
                        town["Town"],
                        decimalPercentFormat(town["Eligible Exited to ECSE"])
                    ];

                    // value labels - value
                    labelContainer.append("p")
                        .attr("class", function() {
                            return [
                                "value",
                                sluggify(dateFormat(town["Year"]))
                            ].join(" ");
                        })
                        .selectAll("span")
                        .data(valueText)
                        .enter()
                            .append("span")
                            .text(function(t) { return t; })
                })
            });

            // return;
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