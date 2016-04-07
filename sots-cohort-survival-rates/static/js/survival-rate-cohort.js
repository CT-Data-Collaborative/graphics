$(document).ready(function(){
    // variables
    var pymChild = null;
    var aspect_ratio = (1 / 3); // H / W
    var mobile_threshold = 500;

    var typeOrder = [
        "Corporation",
        "LLC",
        "Other"
    ];

    // we need this in a few places
    var dateFormat = d3.time.format("%Y");
    var numberFormat = d3.format(",d");
    var decimalFormat = d3.format(",.0f");
    var percentFormat = function(v) {
        return decimalFormat(v) + "%";
    };

    /** START container vars **/
    // var container = d3.select("div#container");
    var optionsContainer = d3.select("div#options");
    var chartContainer = d3.select("div#chart");
    var legendContainer = d3.select("div#legend");
    var labelContainer = d3.select("div#value-label")
    /** END container vars **/

    d3.csv("static/data/survival-rates-by-cohort.csv", function(data) {
        const DATA = data.map(function(o) {
            return {
                "Cohort" : o.Cohort,
                "Type" : o.Type,
                "Year" : parseInt(o.Year),
                "Value" : parseFloat(o.Value)
            }
        });

        function drawChart(container_width) {
            // console.log(container_width)
            // d3.select("span.legend-title").text(function(){
            //     return container_width + "px : " + d3.format("0.2f")(container_width/mobile_threshold)
            // })

            // remove existing chart and legend entries
            chartContainer.selectAll("svg").remove();
            labelContainer.selectAll("p.value").remove();

            data = d3.nest()
                .key(function(o) { return o.Cohort; })
                .sortKeys(function(a, b)  { return +a - +b})
                .key(function(o) { return o.Year; })
                .sortKeys(function(a, b)  { return +a - +b})
                .key(function(o) { return o.Type; })
                .sortKeys(function(a, b)  { return typeOrder.indexOf(a) - typeOrder.indexOf(b); })
                .rollup(function(leaf) { return leaf[0].Value; })
                .entries(DATA);

            // vars
            var height = container_width * aspect_ratio;
            var width = container_width;

            var margin = {
                top: 0.09 * height,
                right: 0.12 * width,
                bottom: 0.15 * height,
                left: 0.08 * width
            }

            // check bottom/left for minimums
            if (container_width < mobile_threshold) {
                margin = {
                    top: 0.15 * height,
                    right: 0.15 * width,
                    bottom: 0.35 * height,
                    left: 0.18 * width
                }
            } else if (container_width < mobile_threshold * 1.5) {
                margin = {
                    top: 0.09 * height,
                    right: 0.12 * width,
                    bottom: 0.2 * height,
                    left: 0.1 * width
                }
            }

            // svg containers
            var svgs = chartContainer.selectAll("svg")
                .data(data, function(d) { return d.key; })
                .enter()
                .append("svg")
                    .attr("height", height)
                    .attr("width", width)
                    // .datum(function(d) { return d; });

            // take margins off of height and width
            height = (height-(margin.top + margin.bottom));
            width = (width-(margin.left + margin.right));

            // Scales
            var groupX = d3.scale.ordinal()
                .rangeRoundBands([0, width], 0.1);

            var barX = d3.scale.ordinal()
                .domain(typeOrder);

            var y = d3.scale.linear()
                .range([height, 0])
                .domain([0, 100]);

            svgs.each(function(chartData, chartIndex) {
                // CHART NEEDS TITLE FOR WHICH COHORT IT IS
                var cohort = chartData.key;
                chartData = chartData.values;

                // save this svg as container var
                var svg = d3.select(this);

                // update x scale data
                groupX.domain(
                    chartData.map(function(d) {
                        return d.key;
                    })
                );

                barX.rangeRoundBands([0, groupX.rangeBand()], 0.1);
                hoverX = groupX.copy()
                    .rangeRoundBands([0, width], 0);


                var chart = svg.append("g")
                    .classed("chart", true)
                    .attr("height", height)
                    .attr("width", width)
                    .attr("transform", "translate("+ margin.left + ", " + margin.top + ")");

                // axes
                var xAxis = d3.svg.axis()
                    .scale(groupX)
                    .orient("bottom")

                var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left")
                    .tickFormat(percentFormat);

                if (container_width < mobile_threshold) {
                    yAxis.ticks(4);
                }

                if (container_width < mobile_threshold * 1.5) {
                  xAxis.tickFormat(function(t) {
                      return "'" + t.slice(-2);
                  })
              }

                var xAxis = chart.append("g")
                  .attr("class", "axis xaxis")
                  .attr("transform", "translate(0," + height + ")")
                  .call(xAxis);

              if (container_width < mobile_threshold) {
                xAxis.call(function(g) {
                    g.selectAll("g text")
                        .attr("dy", function(d, i){
                            if (i % 2 == 1) {
                                // ODD ticks
                                return "1.75em";
                            } else {
                                // EVEN ticks
                                return "0.75em"
                            }
                        })
                })
              }

                var xAxisLabel = xAxis.append("text")
                    .attr("dx", "2em")
                    .attr("dy", (-1.01 * width))
                    .attr("transform", "rotate(90)")
                    .style("text-anchor", "end")
                    .text("Year");

                // under certain size, move x axis label ?

                var yAxis = chart.append("g")
                    .attr("class", "axis yaxis")
                    .call(yAxis);

                var yAxisLabel = yAxis.append("text")
                    .attr("dy", "-0.25em")
                    .attr("dx", "0.5em")
                    .html("Survival Rate &mdash; " + cohort + " Cohort");

                var barGroups = chart.selectAll("g.bar-group")
                    .data(chartData)
                    .enter()
                    .append("g")
                        .attr("class", function(d) {
                            return [
                                "bar-group",
                                "_"+d.key,
                                "c_"+cohort
                            ].join(" ");
                        })
                        .attr("data-year", function(d) {
                            return "_"+d.key;
                        })
                        .attr("data-cohort", "c_"+cohort)
                        .attr("transform", function(d) {
                            return "translate(" + groupX(d.key) + ", 0)";
                        })


                barGroups.each(function(groupData) {
                    // make value labels
                    var valueData = [
                        {key : "Cohort", values: cohort},
                        {key : "Year", values: groupData.key}
                    ].concat(groupData.values);

                    var valueYear = groupData.key;

                    valueData.forEach(function(value) {
                        labelContainer.append("p")
                            .attr("class", function() {
                                return [
                                    "value",
                                    "_"+valueYear,
                                    "c_"+cohort
                                ].join(" ");
                            })
                            .selectAll("span")
                            .data(function() {
                                if (
                                    value.key === "Corporation"
                                    || value.key === "LLC"
                                    || value.key === "Other"
                                ) {
                                    return [value.key, percentFormat(value.values)]
                                } else {
                                    return [value.key, value.values]
                                }
                            })
                            .enter()
                            .append("span")
                                .text(function(v) { return v; })
                    })
                });

                // bars within groups
                barGroups.selectAll("rect.bar")
                        .data(function(d) { return d.values; })
                        .enter()
                        .append("rect")
                            .attr("class", function(d) {
                                return [
                                    "bar",
                                    d.key.toLowerCase()
                                ].join(" ");
                            })
                            .attr("data-type", function(d) {
                                return d.key.toLowerCase();
                            })
                            .attr("width", barX.rangeBand())
                            .attr("x", function(d) { return barX(d.key); })
                            .attr("y", function(d) { return y(d.values); })
                            .attr("height", function(d) { return height - y(d.values); });
                
                barGroups.each(function(d, i) {
                    var yOffset = d3.min(d.values.map(function(v) { return y(v.values); }));

                    d3.select(this)
                    .append("rect")
                        .attr("class", function(d) {
                            return [
                                "hover-target",
                                "_"+d.key,
                                "c_"+cohort
                            ].join(" ");
                        })
                        .attr("data-year", function(d) {
                            return "_"+d.key
                        })
                        .attr("data-cohort", "c_"+cohort)
                        .attr("height", height-yOffset)
                        .attr("x", function(d) {
                            return -0.05 * hoverX.rangeBand();
                        })
                        .attr("y", yOffset)
                        // .attr("height", height)
                        .attr("width", hoverX.rangeBand());
                })
            })


            // // register hover events (tooltips) for bar groups
            d3.selectAll("rect.hover-target")
                .on("mouseover", function(d){
                    var highlightYear = d3.select(this).attr("data-year");
                    var highlightCohort = d3.select(this).attr("data-cohort");

                    var toHighlight = d3.selectAll("div#value-label, g.bar-group."+highlightCohort+"."+highlightYear+", p."+highlightCohort+"."+highlightYear)
                    var toLowlight = d3.selectAll("g.bar-group."+highlightCohort+":not(."+highlightYear+")")

                    toLowlight.classed({
                            "lowlight": true
                        });
                    
                    toHighlight.classed({
                            "highlight": true
                        });
                })
                .on("mouseout", function(d){
                    d3.selectAll(".highlight, .lowlight")
                        .classed({
                            "lowlight": false,
                            "highlight": false
                        });
                });

            d3.selectAll("div.legend-entry")
                .on("mouseover", function(){
                    var highlightClass = d3.select(this).attr("data-type");

                    var toHighlight = d3.selectAll("div.legend-entry."+highlightClass+", rect.bar."+highlightClass)
                    var toLowlight = d3.selectAll("div.legend-entry:not(."+highlightClass+"), rect.bar:not(."+highlightClass+")")

                    toLowlight.classed({
                            "lowlight": true
                        });

                    
                    toHighlight.classed({
                            "highlight": true
                        });
                })
                .on("mouseout", function(){
                    d3.selectAll(".highlight, .lowlight")
                        .classed({
                            "highlight": false,
                            "lowlight": false
                        });
                })
        }

        pymChild = new pym.Child({ renderCallback: drawChart });
    });
});