$(document).ready(function(){
    // variables
    var pymChild = null;
    var aspect_ratio = (1 / 2); // H / W
    var mobile_threshold = 500;

    // we need this in a few places
    var dateFormat = d3.time.format("%Y");
    var numberFormat = d3.format(",d");
    var decimalFormat = d3.format(",.1f");
    var currencyFormat = d3.format("$,.0f");
    var shortCurrencyFormat = currencyFormat;
    // var shortCurrencyFormat = d3.format("$s");
    var integerPercentFormat = function(v) {
        return numberFormat(v) + "%";
    };
    var decimalPercentFormat = function(v) {
        return decimalFormat(v) + "%";
    };
    // code from Shopify (see gist: https://gist.github.com/jlbruno/1535691)
    var quintileFormat = function(q) {
        var suffixes = ["th","st","nd","rd"];
        var suffixIndex = q % 100;
        return q + (suffixes[(suffixIndex - 20) % 10] || suffixes[suffixIndex] || suffixes[0]); // + " Quintile";
    };

    var sluggify = function(text) {
        if (d3.range(0,10).indexOf(text.slice(0)) !== 1) {
            text = "_" + text;
        }
        return text.toLowerCase().replace(/[^_0-9a-zA-Z]/ig, "_")
    }

    /** START container vars **/
    var container = d3.select("div#container");
    // var optionsContainer = container.select("div#options");
    // var chartContainer = container.select("div#chart");
    // var legendContainer = container.select("div#legend");
    /** END container vars **/

    // tooltip functions
    var townTip = d3.tip()
        .attr("class", "barchart-tip")
        .offset([-10, 0])
        .html(function(d) {
            return "Town Name"
        });
    var indicatorTip = d3.tip()
        .attr("class", "barchart-tip")
        .offset([-10, 0])
        .html(function(d) {
            return "Indicator%"
        });

    d3.csv("static/data/indicator-share-with-cogs.csv", function(data) {
        // type casting
        var DATA = data.map(function(o) {
            return {
                "Municipality" : o["Municipality"],
                "COG" : o["Planning Region"],
                "Unemployment Rate" : parseFloat(o["Unemployment Rate (%)"]),
                "Population Density" : parseFloat(o["Population Density (000s per square mile)"]),
                "Private-Sector Wage Index" : parseFloat(o["Private-Sector Wage Index (%)"]),
                "Town Maintenance Road Mileage" : parseFloat(o["Town Maintenance Road Mileage (per 000 population)"]),
                "Total Jobs" : parseFloat(o["Total Jobs (per capita)"])
            }
        });

        DATA = d3.nest()
            .key(function(d) { return d["COG"]})
            .entries(DATA)

        var colors = d3.scale.ordinal()
            .range(
                d3.range(0,5).map(function(n) { return "color_"+(n+1); })
            )
            .domain([
                "Town Maintenance Road Mileage",
                "Population Density",
                "Total Jobs",
                "Unemployment Rate",
                "Private-Sector Wage Index"
            ])

        function drawChart(container_width) {
            // console.log(container_width)
            // d3.select("span.legend-title").text(function(){
            //     return container_width + "px : " + d3.format("0.2f")(container_width/mobile_threshold)
            // })

            // remove existing chart and legend entries
            container.selectAll("svg").remove();

            // vars
            var height = container_width * aspect_ratio;
            var width = container_width;

            var margin = {
                top: 0.09 * height,
                right: 0.12 * width,
                bottom: 0.1 * height,
                left: 0.08 * width
            }

            // check bottom/left for minimums
            if (container_width < mobile_threshold) {
                margin = {
                    top: 0.15 * height,
                    right: 0.15 * width,
                    bottom: 0.28 * height,
                    left: 0.16 * width
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
            var svgs = container
                .selectAll("svg")
                .data(DATA)
                .enter()
                .append("svg")
                    .attr("height", height)
                    .attr("width", width)

            // take margins off of height and width
            height = (height-(margin.top + margin.bottom));
            width = (width-(margin.left + margin.right));

            // Scales
            var x = d3.scale.ordinal()
                .rangeRoundBands([0, width], 0.0);

            var y = d3.scale.linear()
                .range([0, height])
                .domain([0, 100]);

            svgs.each(function(chartData, chartIndex) {
                var cog = chartData.key;
                var chartData = chartData.values;

                var chart = d3.select(this).append("g")
                    .classed("chart", true)
                    .attr("height", height)
                    .attr("width", width)
                    .classed(sluggify(cog), true)
                    .attr("transform", "translate("+ margin.left + ", " + margin.top + ")");

                // update x scale domain
                x.domain(
                    chartData.map(function(d) { return d["Municipality"]; })
                )

                // axes
                var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom");

                var xAxis = chart.append("g")
                    .attr("class", "axis xaxis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                // if (container_width < mobile_threshold) {
                //   xAxis.call(function(g) {
                //       g.selectAll("g text")
                //           .attr("dy", function(d, i){
                //               if (i % 2 == 1) {
                //                   // ODD ticks
                //                   return "1.75em";
                //               } else {
                //                   // EVEN ticks
                //                   return "0.75em"
                //               }
                //           })
                //   })
                // }

                // var xAxisLabel = xAxis.append("text")
                //     .attr("dy", "-0.5em")
                //     .attr("dx", width)
                //     // .attr("transform", "rotate(90)")
                //     .style("text-anchor", "end")
                //     .text("Municipality");
                
                var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left")
                    .tickFormat(integerPercentFormat);

                if (container_width < (mobile_threshold * 1.5)) {
                    yAxis.ticks(4);
                }

                var yAxis = chart.append("g")
                    .attr("class", "axis yaxis")
                    .call(yAxis);
                
                // var yAxisLabel = yAxis.append("text")
                //     .attr("dy", "-0.25em")
                //     .attr("dx", "0.5em")
                //     .html("Gap/Net Gap");
                
                var barGroups = chart.selectAll("g.bar-group")
                    .data(chartData)
                    .enter()
                    .append("g")
                        .attr("class", function(d) {
                            return [
                                "bar-group",
                                sluggify(d["Municipality"]),
                            ].join(" ");
                        })
                        .attr("transform", function(d) {
                            return "translate(" + x(d["Municipality"]) + ", 0)";
                        })
                        .call(townTip)
                        .each(function(barData, barIndex) {
                            var bargroup = d3.select(this);
                            // make each of the five bars
                            var offset = 0;
                            colors.domain().forEach(function(indicator, index) {
                                var d = barData[indicator];

                                console.log([d, y(d)])

                                bargroup
                                    .append("rect")
                                        .attr("x", 0)
                                        .attr("y", function() {
                                            return y(offset)
                                        })
                                        .attr("height", function() {
                                            // console.log(d);
                                            return y(d);
                                        })
                                        .attr("width", x.rangeBand())
                                        .attr("class", function() {
                                            return [
                                                "bar",
                                                colors(indicator)
                                            ].join(" ");
                                        })

                                    offset += d;
                            })
                            // barData = .map(function(key, index, array) {
                            //     if (index === 0) {
                            //         offset = 0
                            //     } else {
                            //         offset = d3.sum(
                            //             d3.range(0, index-1).map(function(i) {
                            //                 return barData[array[index-1]];
                            //             })
                            //         )
                            //     }
                            //     return {key : key, values : barData[key], offset : offset};
                            // })
                        })

                return;
            })

return;

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