$(document).ready(function(){
    // variables
    var pymChild = null;
    var aspect_ratio = (1 / 2); // H / W
    var mobile_threshold = 500;

    // we need this in a few places
    var dateFormat = d3.time.format("%Y");
    var numberFormat = d3.format(",d");
    var decimalFormat = d3.format(",.0f");
    var currencyFormat = d3.format("$,.0f");
    var shortCurrencyFormat = d3.format("$s");
    var percentFormat = function(v) {
        return decimalFormat(v) + "%";
    };
    // code from Shopify (see gist: https://gist.github.com/jlbruno/1535691)
    var quintileFormat = function(q) {
        var suffixes = ["th","st","nd","rd"];
        var suffixIndex = q % 100;
        return q + (suffixes[(suffixIndex - 20) % 10] || suffixes[suffixIndex] || suffixes[0]); // + " Quintile";
    };

    /** START container vars **/
    var container = d3.select("div#container");
    var optionsContainer = container.select("div#options");
    var chartContainer = container.select("div#chart");
    var legendContainer = container.select("div#legend");
    /** END container vars **/

    // tooltip function
    var tip = d3.tip()
        .attr("class", "barchart-tip")
        .offset([-10, 0])
        .html(function(d) {
            var labels = {
                "gap" : "Gap",
                "net-gap" : "Net Gap"
            };
            labels = d.map(function(v) {
                return ["<b>","</b>"].join(labels[v.key]) + ": " + currencyFormat(v.values);
            });

            labels.push("(n = " + d[0]["n"]+ ")");
            return labels.join("<br />");
        })

    d3.csv("static/data/data.csv", function(data) {
        // type casting
        var DATA = data.map(function(o) {
            return {
                "Municipality" : o["Municipality"],
                "Planning Region" : o["Planning Region"],
                "Population" : parseInt(o["Population"]),
                "Municipal Gap" : parseInt(o["Municipal Gap"]),
                "State Nonschool Grants" : parseInt(o["State Nonschool Grants"]),
                "quintile" : parseInt(o["quintile"])
            }
        });

        var yScaleExtent = [];
        DATA = d3.nest()
            .key(function(d) { return d.quintile; })
            .rollup(function(quintile) {
                var totalPopulation = 0;
                var weightedGap = 0;
                var weightedNetGap = 0;
                var n = 0;

                quintile.forEach(function(town) {
                    totalPopulation += town["Population"];

                    weightedGap += (town["Population"] * town["Municipal Gap"]);

                    weightedNetGap += (town["Population"] * (town["Municipal Gap"] + town["State Nonschool Grants"]));

                    n++;
                });

                var gap = weightedGap/totalPopulation;
                var netGap = weightedNetGap/totalPopulation;

                yScaleExtent.push(gap, netGap);

                return {
                    "gap" : gap,
                    "net-gap" : netGap,
                    "n" : n
                };
            })
            .entries(DATA)

        function drawChart(container_width) {
            // console.log(container_width)
            // d3.select("span.legend-title").text(function(){
            //     return container_width + "px : " + d3.format("0.2f")(container_width/mobile_threshold)
            // })

            // remove existing chart and legend entries
            chartContainer.selectAll("svg").remove();

            // vars
            var height = container_width * aspect_ratio;
            var width = container_width;

            var margin = {
                top: 0.09 * height,
                right: 0.12 * width,
                bottom: 0.1 * height,
                left: 0.12 * width
            }

            // check bottom/left for minimums
            if (container_width < mobile_threshold) {
                margin = {
                    top: 0.15 * height,
                    right: 0.15 * width,
                    bottom: 0.28 * height,
                    left: 0.22 * width
                }
            } else if (container_width < mobile_threshold * 1.5) {
                margin = {
                    top: 0.09 * height,
                    right: 0.12 * width,
                    bottom: 0.1 * height,
                    left: 0.1 * width
                }
            }

            // svg container
            var svg = chartContainer
                .append("svg")
                    .attr("height", height)
                    .attr("width", width)

            // take margins off of height and width
            height = (height-(margin.top + margin.bottom));
            width = (width-(margin.left + margin.right));

            // Scales
            var groupX = d3.scale.ordinal()
                .domain(d3.range(1, 6))
                .rangeRoundBands([0, width], 0.1);

            var barX = d3.scale.ordinal()
                .domain(["gap", "net-gap"])
                .rangeRoundBands([0, groupX.rangeBand()], 0.02);

            var y = d3.scale.linear()
                .range([height, 0])
                .domain(d3.extent(yScaleExtent))
                .nice();

            var chart = svg.append("g")
                .classed("chart", true)
                .attr("height", height)
                .attr("width", width)
                .attr("transform", "translate("+ margin.left + ", " + margin.top + ")");

            // axes
            var xAxis = d3.svg.axis()
                .scale(groupX)
                .orient("bottom")
                .tickFormat(quintileFormat);

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .tickFormat(currencyFormat);

            if (container_width < (mobile_threshold * 1.5)) {
                yAxis.tickFormat(shortCurrencyFormat);
            }

            // "zero" line - basically duplicate xAxis with no markings
            var zeroAxis = d3.svg.axis()
                .scale(groupX)
                .orient("bottom")
                .tickFormat("")
                .tickSize(0);

            var zeroAxisLine = chart.append("g")
                .classed({
                    "x" : true,
                    "axis" : true,
                    "zero" : true,
                })
                .attr("transform", "translate(0, " + y(0) + ")")
                .call(zeroAxis);

            if (container_width < mobile_threshold) {
                yAxis.ticks(6);
            }

            // if (container_width < mobile_threshold * 1.5) {
            //     xAxis.tickFormat(function(t) {
            //         return "'" + t.slice(-2);
            //     })
            // }

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
                .attr("dy", "-0.5em")
                .attr("dx", width)
                // .attr("transform", "rotate(90)")
                .style("text-anchor", "end")
                .text("Quintile");
            
            var yAxis = chart.append("g")
                .attr("class", "axis yaxis")
                .call(yAxis);
            
            // var yAxisLabel = yAxis.append("text")
            //     .attr("dy", "-0.25em")
            //     .attr("dx", "0.5em")
            //     .html("Gap/Net Gap");
            
            var barGroups = chart.selectAll("g.bar-group")
                .data(DATA)
                .enter()
                .append("g")
                    .attr("class", function(d) {
                        return [
                            "bar-group",
                            "q_"+d.key,
                        ].join(" ");
                    })
                    .attr("transform", function(d) {
                        return "translate(" + groupX(d.key) + ", 0)";
                    })
                    .datum(function(d) {
                        return [
                            {"key" : "gap", "quintile" : d.key, "n" : d.values["n"], "values" : d.values["gap"]},
                            {"key" : "net-gap", "quintile" : d.key, "n" : d.values["n"], "values" : d.values["net-gap"]}
                        ];
                    })
            
            barGroups.call(tip);

            // bars within groups
            barGroups.selectAll("rect.bar")
                .data(function(d) { return d; })
                .enter()
                .append("rect")
                    .attr("class", function(d) {
                        return [
                            "bar",
                            d.key
                        ].join(" ");
                    })
                    .attr("data-type", function(d) {
                        return d.key;
                    })
                    .attr("width", barX.rangeBand())
                    .attr("x", function(d) { return barX(d.key); })
                    .attr("y", function(d) {
                        return d3.min([
                            y(d.values),
                            y(0)
                        ]);
                    })
                    .attr("height", function(d) {
                        return Math.abs(y(d.values) - y(0));
                    });
            
            barGroups.each(function(d, i) {
                var quintile = d[0]["quintile"];
                var barHeight = d3.max(d.map(function(v) { return Math.abs(y(v.values) - y(0)); }));
                var yOffset = d3.min(d.map(function(v) {
                    return d3.min([y(v.values), y(0)]);
                }));

                
                
                d3.select(this)
                    .append("rect")
                    .attr("class", function(d) {
                        return [
                            "hover-target",
                            "q_"+(quintile)
                        ].join(" ");
                    })
                    .attr("data-quintile", ("q_"+quintile))
                    .attr("x", function(d) {
                        return 0;
                        return groupX(quintile);
                    })
                    .attr("y", yOffset)
                    .attr("height", barHeight)
                    .attr("width", groupX.rangeBand());
            })

            // register hover events (tooltips) for bar groups
            d3.selectAll("rect.hover-target")
                .on("mouseover", function(d){
                    var highlightQuintile = d3.select(this).attr("data-quintile");

                    var toHighlight = d3.selectAll("g.bar-group."+highlightQuintile)
                    var toLowlight = d3.selectAll("g.bar-group:not(."+highlightQuintile+")")

                    toLowlight.classed({
                            "lowlight": true
                        });
                    
                    toHighlight.classed({
                            "highlight": true
                        });

                    tip.show(d);
                })
                .on("mouseout", function(d){
                    d3.selectAll(".highlight, .lowlight")
                        .classed({
                            "lowlight": false,
                            "highlight": false
                        });

                    tip.hide(d);
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