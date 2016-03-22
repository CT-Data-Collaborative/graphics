$(document).ready(function(){
    // variables
    var pymChild = null;
    var aspect_ratio = (2 / 5); // H / W
    var mobile_threshold = 500;

    // we need this in a few places
    var dateFormat = d3.time.format("%Y");
    var numberFormat = d3.format(",d");

    /** START container vars **/
    var container = d3.select("div#container");
    var optionsContainer = container.select("div#options");
    var chartContainer = container.select("div#chart");
    var legendContainer = container.select("div#legend");
    /** END container vars **/

    d3.csv("static/data/survival-rate-by-formation.csv", function(data) {
        const DATA = data.map(function(o) {
            return {
                "Formation" : parseInt(o.Formation),
                "Lifespan" : parseInt(o.Lifespan),
                "Value" : parseInt(o.Value)
            }
        });

        /* START populate select */
        var selectOptions = d3.range(1980, 2015, 5).map(function(y) {
            return [y, y+4];
        })
        optionsContainer.append("label")
            .text("Formation Years");

        optionsContainer.append("select")
            .classed({
                "form-control" : true
            })
            .attr("id", "year-filter")
            .selectAll("option")
            .data(selectOptions)
            .enter()
                .append("option")
                .attr("data-start", function(d) {
                    return d[0];
                })
                .attr("data-end", function(d) {
                    return d[1];
                })
                .text(function(d) {
                    return d.join(" to ");
                })
        /* END populate select */

        function drawChart(container_width) {
            // console.log(container_width)
            // d3.select("span.legend-title").text(function(){
            //     return d3.format("0.2f")(container_width/mobile_threshold)
            // })

            if (undefined === container_width) {
                container_width = d3.select("svg").attr("width");
            }

            // remove existing chart and legend entries
            chartContainer.selectAll("svg").remove();
            legendContainer.selectAll("div").remove();

            // filter data by selected year range
            var filterYears  = optionsContainer.select("select#year-filter option:checked").node()
            filterYears = {
                "start" : parseInt(filterYears.attributes["data-start"].value),
                "end" : parseInt(filterYears.attributes["data-end"].value)
            }

            data = DATA.filter(function(o) {
                return (o.Formation >= filterYears.start && o.Formation <= filterYears.end)
            })
            // data = DATA.filter(function(o) {
            //     return true
            // })

            data = d3.nest()
                .key(function(o) { return o.Formation; })
                .sortKeys(function(a, b)  { return +a - +b})
                .key(function(o) { return o.Lifespan; })
                .sortKeys(function(a, b)  { return +a - +b})
                .rollup(function(leaf) { return leaf[0].Value; })
                .entries(data);

            // legend entries
            var makeEntry = function(entryData, entryIndex) {
                d3.select(this)
                    .append("span")
                    .attr("class", function() {
                        return [
                            "color",
                            "color_"+entryIndex
                        ].join(" ");
                    })

                d3.select(this)
                    .append("span")
                    .text(function() { return entryData.key; })
            }
            var legendEntries = legendContainer.selectAll("div")
                .data(data);

            legendEntries.enter()
                .append("div")
                .attr("data-year", function(d) { return "_" + d.key; })
                .attr("class", function(d){
                    return [
                        "legend-entry",
                        "_" + d.key
                    ].join(" ");
                })
                .each(makeEntry)
                

            legendEntries.exit().remove();

            // vars
            var height = container_width * aspect_ratio;
            var width = container_width;

            var margin = {
                top: 0.07 * height,
                right: 0.12 * width,
                bottom: 0.1 * height,
                left: 0.08 * width
            }

            // check bottom/left for minimums
            if (container_width < mobile_threshold) {
                margin = {
                    top: 0.07 * height,
                    right: 0.15 * width,
                    bottom: 0.2 * height,
                    left: 0.18 * width
                }
            } else if (container_width < mobile_threshold * 1.5) {
                margin = {
                    top: 0.07 * height,
                    right: 0.12 * width,
                    bottom: 0.1 * height,
                    left: 0.1 * width
                }
            }

            // svg container
            var svg = chartContainer.append("svg")
                .attr("height", height)
                .attr("width", width);

            // take margins off of height and width
            height = (height-(margin.top + margin.bottom));
            width = (width-(margin.left + margin.right));

            // Scales
            var x = d3.scale.linear()
                .range([0, width])
                .domain([0, data[0].values.length-1]);

            var y = d3.scale.linear()
                .range([height, 0])
                .domain([0, 100]);

            var line = d3.svg.line()
                .x(function(d) { return x(d.key); })
                .y(function(d) { return y(d.values); });

            var chart = svg.append("g")
                .classed("chart", true)
                .attr("height", height)
                .attr("width", width)
                .attr("transform", "translate("+ margin.left + ", " + margin.top + ")");

            // axes
            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")

            var tickCount = x.domain();
            if (container_width < mobile_threshold) {
                tickCount = Math.floor(x.domain() / 5)
            } else if (container_width < mobile_threshold * 2) {
                tickCount = Math.floor(x.domain() / 2)
            }

            if (x.domain() <= 1) {
                tickCount = x.domain();
            }
            xAxis
                .tickFormat(d3.format("d"));

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .tickFormat(function(v) {
                    return v + "%";
                });

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
                .text("Years Since Formation");

            var yAxis = chart.append("g")
                .attr("class", "axis yaxis")
                .call(yAxis);


            var yAxisLabel = yAxis.append("text")
                .attr("x", (-1 * height))
                .attr("dy", "1em")
                .attr("dx", "0.5em")
                .attr("transform", "rotate(-90)")

            if (container_width < mobile_threshold) {
                yAxisLabel
                    .selectAll("tspan")
                    .data(["Survival", "Rate"])
                    .enter()
                    .append("tspan")
                        .attr("x", (-1 * height))
                        .attr("dx", "0.5em")
                        .attr("dy", "1em")
                        .text(function(d) { return d; });
            } else {
                yAxisLabel
                    .text("Survival Rate");
            }

            chart.append("g")
                .classed("line-group", true)
                .selectAll("path")
                .data(data)
                .enter()
                    .append("path")
                    .attr("data-year", function(d) { return "_" + d.key; })
                    .attr("class", function(d, i) {
                        return [
                            "line",
                            "color_"+i,
                            "_" + d.key
                        ].join(" ");
                    })
                    .attr("d", function(d) {
                        return line(d.values);
                    });


            // register hover events for point groups
            d3.selectAll("div.legend-entry")
                .on("mouseover", function(){
                    var highlightClass = d3.select(this).attr("data-year");
                    console.log(highlightClass);

                    d3.selectAll("div.legend-entry, path.line")
                        .classed({
                            "highlight": false,
                            "lowlight": true
                        });

                    d3.selectAll("."+highlightClass)
                        .classed({
                            "highlight": true,
                            "lowlight": false
                        });
                })
                .on("mouseout", function(){
                    d3.selectAll(".highlight, .lowlight")
                        .classed({
                            "highlight": false,
                            "lowlight": false
                        });
                })

            // console.log(DATA);
        }

        pymChild = new pym.Child({ renderCallback: drawChart });
        optionsContainer.select("select#year-filter")
            .on("change", drawChart);
    });
});