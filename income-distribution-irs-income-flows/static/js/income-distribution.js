$(document).ready(function(){
    // variables
    var pymChild = null;
    var aspect_ratio = (1 / 2.5); // H / W
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

    var xAxisRelabelLookup = {
        'Less than $10,000': '< $10k',
        '$10,000-$24,999': '$10k-$25k',
        '$25,000-$49,999': '$25k-$50k',
        '$50,000-$99,999': '$50k-$100k',
        '$100,000-$149,999': '$100k-$150k',
        '$150,000+': '$150k+'
    };
    console.log(yearColors);
    // we need this in a few places
    var dateFormat = d3.time.format("%Y");
    var numberFormat = d3.format(",d");
    var decimalFormat = d3.format(",.0f");
    var percentFormat = d3.format('0%');
    var precisePercentFormat = d3.format('.1%');
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
            if (isNaN(container_width)) {
                container_width = $(window).width();
            }
            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .html(function(d) {
                    var text = "Year: " + d.key + "<br>Share: " + precisePercentFormat(d.values);
                    return text;
                });

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
            //var margin = {
            //    top: 0.09 * height,
            //    right: 0.12 * width,
            //    bottom: 0.1 * height,
            //    left: 0.08 * width
            //}
            //
            //// check bottom/left for minimums
            //if (container_width < mobile_threshold) {
            //    margin = {
            //        top: 0.15 * height,
            //        right: 0.15 * width,
            //        bottom: 0.1 * height,
            //        left: 0.1 * width
            //    }
            //} else if (container_width < mobile_threshold * 1.5) {
            //    margin = {
            //        top: 0.09 * height,
            //        right: 0.12 * width,
            //        bottom: 0.1 * height,
            //        left: 0.1 * width
            //    }
            //}

            typeOrder.forEach(function(d) {
                var itemClass = ".legend-item.y" + d + "> span.legend-box";
                var item = d3.select(itemClass);
                var itemColor = yearColors[d];
                var style = 'background-color:' + itemColor;
                item.attr('style', style);
            });

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
                    return xAxisRelabelLookup[t];
                    //return "'" + t.slice(-2);
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
            
        }
        pymChild = new pym.Child({ renderCallback: drawChart });
    });
});