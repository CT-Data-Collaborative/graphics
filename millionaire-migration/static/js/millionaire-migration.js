$(document).ready(function() {
    // variables
    var pymChild = null;
    var aspect_ratio = (1 / 2); // H / W
    var mobile_threshold = 500;

    // we need this in a few places
    var dateFormat = d3.time.format("%Y");
    var numberFormat = d3.format(",d");
    var decimalFormat = d3.format(",.0f");
    var currencyFormat = d3.format("$,.0f");
    var shortCurrencyFormat = currencyFormat;
    // var shortCurrencyFormat = d3.format("$s");
    var percentFormat = function (v) {
        return decimalFormat(v) + "%";
    };

    /** START container vars **/
    var container = d3.select("div#container");
    var optionsContainer = container.select("div#options");
    var chartContainer = container.select("div#chart");
    /** END container vars **/


    d3.csv("static/data/migration-rate.csv", function (data) {
        function drawChart(container_width) {
            if (isNaN(container_width)) {
                console.log('not iframed')
                container_width = container[0][0].clientWidth;
            }
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
            var svg = chartContainer
                .append("svg")
                .attr("height", height)
                .attr("width", width)

            // take margins off of height and width
            height = (height - (margin.top + margin.bottom));
            width = (width - (margin.left + margin.right));

            // Scales
            var x = d3.scale.ordinal()
                .rangeRoundBands([0, width], .1)
                .domain(data.map(function (d) {
                    return d.group
                }))

            var y = d3.scale.linear()
                .range([height, 0])
                .domain([0, 0.05]);

            var barWidth = width / data.length;

            var chart = svg.append("g")
                .classed("chart", true)
                .attr("height", height)
                .attr("width", width)
                .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

            // axes
            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            if (container_width < mobile_threshold) {
                yAxis.ticks(6);
            }

            var xAxis = chart.append("g")
                .attr("class", "axis xaxis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            if (container_width < mobile_threshold) {
                xAxis.call(function (g) {
                    g.selectAll("g text")
                        .attr("dy", function (d, i) {
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

            var yAxis = chart.append("g")
                .attr("class", "axis yaxis")
                .call(yAxis);

            var bars = chart.selectAll('rect.bar')
                .data(data)
                .enter().append('rect')
                .attr("class", 'bar')
                .attr("width", x.rangeBand())
                .attr("x", function (d) {
                    return x(d.group);
                })
                .attr("y", function (d) {
                    return y(d.rate);
                })
                .attr("height", function (d) {
                    return height - y(d.rate);
                });

        }

        pymChild = new pym.Child({renderCallback: drawChart});
    });
})