$(document).ready(function(){
    // variables
    var pymChild = null;
    var aspect_ratio = (1 / 3); // H / W
    var mobile_threshold = 500;
    var c10 = d3.scale.category10();
    var typeOrder = [
        "2000",
        "2005-2009",
        "2010-2014"
    ];

    var yearColors = {};
    typeOrder.forEach(function(y) {
        yearColors[y] = c10(y);
    });
    console.log(yearColors);
    // we need this in a few places
    var dateFormat = d3.time.format("%Y");
    var numberFormat = d3.format(",d");
    var decimalFormat = d3.format(",.0f");
    var percentFormat = d3.format('0%');
    //var percentFormat = function(v) {
    //    return decimalFormat(v) + "%";
    //};

    /** START container vars **/
    var chartContainer = d3.select("div#chart");
    var legendContainer = d3.select("div#legend");
    var labelContainer = d3.select("div#value-label")
    /** END container vars **/


    d3.csv("static/data/ct-income-distribution.csv", function(data) {
        const DATA = d3.nest()
            .key(function(o) { return o.IncomeGroup; })
            .sortKeys(function(a, b)  { return +a - +b})
            .key(function(o) { return o.Year; })
            .sortKeys(function(a, b)  { return +a - +b})
            .rollup(function(leaf) { return +leaf[0].Share; })
            .entries(data);


        function drawChart(container_width) {
            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .html(function(d) {
                    var text = "Year: " + d.key + "<br>Share: " + percentFormat(d.values);
                    return text;
                });
            // d3.select("span.legend-title").text(function(){
            //     return container_width + "px : " + d3.format("0.2f")(container_width/mobile_threshold)
            // })

            // remove existing chart and legend entries
            chartContainer.selectAll("svg").remove();

        
            console.log(DATA);

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

            typeOrder.forEach(function(d) {
                var itemClass = ".legend-item.y" + d + "> span.legend-box";
                var item = d3.select(itemClass);
                var itemColor = yearColors[d];
                var style = 'background-color:' + itemColor;
                item.attr('style', style);
            });
            //var legend = legendContainer.selectAll('span')
            //    .data(typeOrder)
            //    .enter()
            //    .append('span')
            //    .html(function(d) {
            //        return d;
            //    })
            //    .append('span')
            //    .attr("height", '10')
            //    .attr("width", '10')
            //    .html(" ")
            //    .attr('background-color', function(d) {
            //        return c10(d);
            //    });
            //
            // svg containers
            var svg = chartContainer.append("svg")
                .classed("chart", true)
                .attr("height", height)
                .attr("width", width)
                .attr("transform", "translate("+ margin.left + ", " + margin.top + ")");

            svg.call(tip);
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
                .domain([0, 1]);

            // update x scale data
            groupX.domain(
                DATA.map(function(d) {
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
                .orient("bottom");

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
                .text("Income Group");

            // under certain size, move x axis label ?

            var yAxis = chart.append("g")
                .attr("class", "axis yaxis")
                .call(yAxis);

            var yAxisLabel = yAxis.append("text")
                .attr("dy", "-0.25em")
                .attr("dx", "0.5em")
                .html("Percent");

            var barGroups = chart.selectAll("g.bar-group")
                .data(DATA)
                .enter()
                .append("g")
                .attr("class", function(d) {
                    return [
                        "bar-group",
                        "_"+d.key
                    ].join(" ");
                })
                .attr("data-year", function(d) {
                    return "_"+d.key;
                })
                .attr("transform", function(d) {
                    return "translate(" + groupX(d.key) + ", 0)";
                })



            barGroups.each(function(groupData) {
                // make value labels
                var valueData = [
                    {key : "Year", values: groupData.key}
                ].concat(groupData.values);

                var incomeGroup = groupData.key;
                valueData.forEach(function(value) {
                    labelContainer.append("p")
                        .attr("class", function() {
                            return [
                                "value",
                                "_"+incomeGroup
                            ].join(" ");
                        })
                        .selectAll("span")
                        .data(function() {
                            if (value.key in typeOrder) {
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

            //// bars within groups
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
                .attr("fill", function(d) {
                    return c10(d.key);
                })
                .attr("x", function(d) {return barX(d.key);})
                .attr("y", function(d) { return y(d.values); })
                .attr("height", function(d) { return height - y(d.values); })
                .on("mouseover",tip.show)
                .on("mouseout", tip.hide);

            //barGroups.each(function(d, i) {
            //    var yOffset = d3.min(d.values.map(function(v) { return y(v.values); }));
            //
            //    d3.select(this)
            //        .append("rect")
            //        .attr("class", function(d) {
            //            return [
            //                "hover-target",
            //                "_"+d.key
            //            ].join(" ");
            //        })
            //        .attr("data-year", function(d) {
            //            return "_"+d.key
            //        })
            //        .attr("height", height-yOffset)
            //        .attr("x", function(d) {
            //            return -0.05 * hoverX.rangeBand();
            //        })
            //        .attr("y", yOffset)
            //        // .attr("height", height)
            //        .attr("width", hoverX.rangeBand());
            //})


            // // register hover events (tooltips) for bar groups
            //d3.selectAll("rect.hover-target")
            //    .on("mouseover", function(d){
            //        var highlightYear = d3.select(this).attr("data-year");
            //        var highlightCohort = d3.select(this).attr("data-cohort");
            //
            //        var toHighlight = d3.selectAll("div#value-label, g.bar-group."+highlightCohort+"."+highlightYear+", p."+highlightCohort+"."+highlightYear)
            //        var toLowlight = d3.selectAll("g.bar-group."+highlightCohort+":not(."+highlightYear+")")
            //
            //        toLowlight.classed({
            //            "lowlight": true
            //        });
            //
            //        toHighlight.classed({
            //            "highlight": true
            //        });
            //    })
            //    .on("mouseout", function(d){
            //        d3.selectAll(".highlight, .lowlight")
            //            .classed({
            //                "lowlight": false,
            //                "highlight": false
            //            });
            //    });
            //
            //d3.selectAll("div.legend-entry")
            //    .on("mouseover", function(){
            //        var highlightClass = d3.select(this).attr("data-type");
            //
            //        var toHighlight = d3.selectAll("div.legend-entry."+highlightClass+", rect.bar."+highlightClass)
            //        var toLowlight = d3.selectAll("div.legend-entry:not(."+highlightClass+"), rect.bar:not(."+highlightClass+")")
            //
            //        toLowlight.classed({
            //            "lowlight": true
            //        });
            //
            //
            //        toHighlight.classed({
            //            "highlight": true
            //        });
            //    })
            //    .on("mouseout", function(){
            //        d3.selectAll(".highlight, .lowlight")
            //            .classed({
            //                "highlight": false,
            //                "lowlight": false
            //            });
            //    })
        }
        drawChart($(window).width());
        //pymChild = new pym.Child({ renderCallback: drawChart });
    });
});