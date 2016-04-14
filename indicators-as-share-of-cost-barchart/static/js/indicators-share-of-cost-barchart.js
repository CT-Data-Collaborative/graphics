$(document).ready(function(){
    // variables
    var pymChild = null;
    var aspect_ratio = (2 / 3); // H / W
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
        if (d3.range(0,10).indexOf(text.slice(0, 1)) !== 1) {
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

    d3.csv("static/data/indicator-share-with-cogs.csv", function(data) {
        // type casting
        var DATA = data.map(function(o) {
            return {
                "Municipality" : o["Municipality"],
                "COG" : o["Planning Region"],
                "Unemployment Rate" : parseFloat(o["Unemployment Rate (%)"]),
                "Population Density" : parseFloat(o["Population Density (000s per square mile)"]),
                "Private-Sector Wage Index" : parseFloat(o["Private-Sector Wage Index (%)"]),
                "Road Mileage" : parseFloat(o["Town Maintenance Road Mileage (per 000 population)"]),
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
                "Private-Sector Wage Index",
                "Unemployment Rate",
                "Total Jobs",
                "Population Density",
                "Road Mileage"
            ])

        // tooltip function
        var tip = d3.tip()
            .attr("class", "barchart-tip")
            .offset([-10, 0])
            .direction("n")
            .html(function(d) {
                return colors.domain().map(function(indicator) {
                    return indicator + ": " + decimalPercentFormat(d[indicator]);
                }).join("<br />");
            });

        function drawChart(container_width) {
            // console.log(container_width)
            // d3.select("span.legend-title").text(function(){
            //     return container_width + "px : " + d3.format("0.2f")(container_width/mobile_threshold)
            // })

            // remove existing chart and legend entries
            container.selectAll("svg").remove();

            // vars
            var width = container_width;
            var height = d3.max([
                container_width * aspect_ratio,
                38 * 20 // capital region has 38 bars * 20 px each
            ]);

            var margin = {
                top: 0.09 * height,
                right: 0.1 * width,
                bottom: 0.05 * height,
                left: 0.15 * width
            }

            // check bottom/left for minimums
            if (container_width < mobile_threshold) {
                margin = {
                    top: 0.25 * height,
                    right: 0.1 * width,
                    bottom: 0.1 * height,
                    left: 0.35 * width
                }
            } else if (container_width < mobile_threshold * 1.5) {
                margin = {
                    top: 0.2 * height,
                    right: 0.11 * width,
                    bottom: 0.08 * height,
                    left: 0.25 * width
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
            var y = d3.scale.ordinal()
                .rangeRoundBands([0, height], 0.0);

            var x = d3.scale.linear()
                .range([0, width])
                .domain([0, 100]);

            svgs.each(function(chartData, chartIndex) {
                var svg = d3.select(this);
                var cog = chartData.key;
                var chartData = chartData.values;

                // could implement a sorting routine - click on legend entry to sort by that indicator
                // var chartData = chartData.values.sort(function(a, b) {
                //     return a["Total Jobs"] < b["Total Jobs"] ? 1 : -1;
                // });

                var title = svg.append("text")
                    .classed("chart-title", true)
                    .attr("text-anchor", "start")
                    .attr("dy", "1em")
                    .attr("font-size", "1.5em")
                    .text(cog)


                legendX = d3.scale.ordinal()
                    .rangeRoundBands([0, width], 0.1);

                legendY = d3.scale.ordinal()
                    .rangeRoundBands([0, margin.top/2], 0.0);

                // if (container_width < mobile_threshold) {
                if (container_width < 1.5 * mobile_threshold) {
                    legendX.domain([0]);
                    legendY.domain(d3.range(0,5));
                // } else if (container_width < 1.5 * mobile_threshold) {
                //     legendX.domain(d3.range(0,2));
                //     legendY.domain(d3.range(0,3));
                } else {
                    legendX.domain(d3.range(0,3));
                    legendY.domain(d3.range(0,2));
                }

                var legend = svg.append("g")
                    .classed("legend", true)
                    .attr("transform", function() {
                        if (container_width < 1.5 * mobile_threshold) {
                            return "translate("+ margin.left +", " + (margin.top/3) + ")"
                        } else {
                            return "translate("+ margin.left +", " + (margin.top/2) + ")"
                        }
                    })
                    .selectAll("g.legend-entry")
                    .data(colors.domain())
                    .enter()
                        .append("g")
                        .classed("legend-entry", true)
                        .attr("transform", function(d, i) {
                            var tx = legendX(i % legendX.domain().length);
                            var ty = legendY(i % legendY.domain().length);
                            return "translate(" + tx + ", " + ty + ")"
                        })
                        .each(function(entryData, i) {
                            var entry = d3.select(this)

                            entry.append("path")
                                .attr("d", d3.svg.symbol().type("square").size(150))
                                .attr("class", function() {
                                    return colors(entryData);
                                })
                            entry.append("text")
                                .attr("dx", 8)
                                .attr("dy", 5)
                                .text(entryData)
                        })
                var chart = svg.append("g")
                    .attr("class", function(d) {
                        return [
                            "chart",
                            "c_"+sluggify(cog)
                        ].join(" ");
                    })
                    .attr("height", height)
                    .attr("width", width)
                    .attr("transform", "translate("+ margin.left + ", " + margin.top + ")");

                // update x scale domain
                y.domain(
                    chartData.map(function(d) { return d["Municipality"]; })
                )

                // axes
                var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left");

                var yAxis = chart.append("g")
                    .attr("class", "axis yaxis")
                    .call(yAxis)
                    .call(function() {
                        d3.selectAll("g.yaxis g.tick text")
                            .attr("class", function() {
                                return "m_" + sluggify(d3.select(this).text())
                            })
                    });

                var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom")
                    .tickFormat(integerPercentFormat);

                if (container_width < (mobile_threshold * 1.5)) {
                    xAxis.ticks(4);
                }

                var xAxis = chart.append("g")
                    .attr("class", "axis xaxis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis)
                
                var barGroups = chart.selectAll("g.bar-group")
                    .data(chartData)
                    .enter()
                    .append("g")
                        .attr("class", function(d) {
                            return [
                                "bar-group",
                                "m_"+sluggify(d["Municipality"]),
                                "c_"+sluggify(cog)
                            ].join(" ");
                        })
                        .attr("data-cog", function() {
                            return "c_"+sluggify(cog);
                        })
                        .attr("data-municipality", function(d) {
                            return "m_"+sluggify(d["Municipality"]);
                        })
                        .attr("transform", function(d) {
                            return "translate(0 , " + y(d["Municipality"]) +")";
                        })
                        .call(tip)
                        .each(function(barData, barIndex) {
                            var bargroup = d3.select(this);
                            // make each of the five bars
                            var offset = 0;
                            colors.domain().forEach(function(indicator, index) {
                                var d = barData[indicator];

                                bargroup
                                    .append("rect")
                                        .attr("x", function() {
                                            return x(offset)
                                        })
                                        .attr("y", 0)
                                        .attr("width", function() {
                                            return x(d);
                                        })
                                        .attr("height", y.rangeBand())
                                        .attr("class", function() {
                                            return [
                                                "bar",
                                                colors(indicator)
                                            ].join(" ");
                                        })

                                    offset += d;
                            })
                            
                            bargroup.append("rect")
                                .classed("hover-target", true)
                                .attr("x", 0)
                                .attr("y", 0)
                                .attr("width", width)
                                .attr("height", y.rangeBand())
                        })

                return;
            })

            // register hover events (tooltips) for bar groups
            d3.selectAll("g.bar-group")
                .on("mouseover", function(d) {
                    var highlightCog = d3.select(this).attr("data-cog");
                    var highlightMunicipality = d3.select(this).attr("data-municipality");

                    var toHighlight = d3.selectAll("g.chart."+highlightCog+" g.bar-group."+highlightMunicipality+", g.chart."+highlightCog+" text."+highlightMunicipality);
                    var toLowlight = d3.selectAll("g.chart."+highlightCog+" g.bar-group:not(."+highlightMunicipality+"), g.chart."+highlightCog+" text:not(."+highlightMunicipality+")");


                    console.log("g.chart."+highlightCog+" g.bar-group."+highlightMunicipality+", g.chart."+highlightCog+" text."+highlightMunicipality)

                    toHighlight
                        .classed("highlight", true);
                    toLowlight
                        .classed("lowlight", true);
                    
                    tip.show(d)
                })
                .on("mouseout", function(d) {
                    d3.selectAll(".highlight, .lowlight")
                        .classed({
                            "lowlight": false,
                            "highlight": false
                        });
                    tip.hide(d)
                })
        }

        pymChild = new pym.Child({ renderCallback: drawChart });
    });
});