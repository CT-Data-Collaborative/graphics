$(document).ready(function() {
    // variables
    var pymChild = null;
    var aspect_ratio = (1 / 5); // H / W
    var mobile_threshold = 799;

    // we need this in a few places
    var dateFormat = d3.time.format("%Y");
    var numberFormat = d3.format(",d");
    var percentFormat = d3.format(",.1%");

    // sorting functions
    function sortTowns(a, b) {
        if (a === "Connecticut") {
            return -1;
        } else if (b === "Connecticut") {
            return 1;
        } else {
            return a > b ? 1 : -1;
        }
    }

    function sluggify(text) {
        var first = text.slice(0, 1);
        if (first !== "" && d3.range[0, 10].indexOf(first) != -1) {
            text = "_" + text;
        }

        return text
            .toLowerCase()
            .replace(/[^a-zA-Z0-9-_]/ig, "_")
            .replace(/_+/ig, "_");
    }
    d3.csv("static/data/complete-long.csv", function(data) {
        const DATA = data.map(function(o) {
            return {
                "Town": o["Town"],
                "FIPS": o["FIPS"],
                "Indicator": o["Indicator"],
                "Measure Type": o["Measure Type"],
                "Year" : parseInt(o["Year"]),
                "Value" : parseFloat(o["Value"]),
                // // if using long form
                // "2005": parseFloat(o["2005"]),
                // "2006": parseFloat(o["2006"]),
                // "2007": parseFloat(o["2007"]),
                // "2008": parseFloat(o["2008"]),
                // "2009": parseFloat(o["2009"]),
                // "2010": parseFloat(o["2010"]),
                // "2011": parseFloat(o["2011"]),
                // "2012": parseFloat(o["2012"])
            };
        });

        var indicators = [
            "Referrals",
            "Evaluations",
            "Total Eligible",
            "Individualized Family Service Plans",
            "Total Served",
            "Exited to Early Childhood Special Education",
            "Referred that are Evaluated",
            "Evaluated that are Eligible",
            "Eligible that Recieve IFSP",
            "IFSP Receiving Services",
            "Eligible that Exit to ECSE",
        ];

        var container = d3.select("div#chart");

        function drawChart(container_width) {
            // remove existing charts
            container.selectAll("svg").remove();
            // filter data
            // indicator is selectable
            // measure type is selectable - options need to be based on which indicator is selected
            var lines = DATA.filter(function(o) {
                return o["Indicator"] == "Evaluations"
                    && o["Measure Type"] == "Percent"
            })

            // nest data
            lines = d3.nest()
                .key(function(o) { return o["Town"]; })
                .sortKeys(sortTowns)
                .key(function(o) { return o["Year"]; })
                .rollup(function(leaves) {
                    return leaves.pop()["Value"];
                })
                .entries(lines)

            // chunk?

            lineData = [];
            for (var i = 0; i < lines.length; i+=10) {
                lineData[i/10] = lines.slice(i, i+10);
            }

            // // debug code
            // container.append("pre")
            //     // .text(JSON.stringify(DATA, null, 4));
            //     // .text(JSON.stringify(lines, null, 4));
            //     .text(JSON.stringify(lineData, null, 4));
            //     return;

            // margins, sizing vars
            var width = container_width * 0.98;
            var height = width * aspect_ratio;

            var margin = {
                top : 0.05 * height,
                right : 0.05 * width,
                bottom : 0.1 * height,
                left : 0.05 * width
            };

            // draw svgs.
            var svgs = container.selectAll("svg")
                .data(lineData)
                .enter()
                .append("svg")
                    .attr("height", height)
                    .attr("width", width)
                    .datum(function(d) { return d; });

            // // // debug - prints red rectangle as border of svg
            // svgs.append("rect")
            //     .attr("height", height)
            //     .attr("width", width)
            //     .attr("stroke", "red")
            //     .attr("stroke-width", "1px")
            //     .attr("fill-opacity", 0);

            height = height - (margin.top + margin.bottom);
            width = width - (margin.left + margin.right);

            // scales and line function
            var colors = d3.scale.category10()
                .domain(d3.range(0, 10));

            var x = d3.time.scale()
                .range([0, width])
                .domain([2005, 2012].map(function(y) { return dateFormat.parse(y.toString()); }))

            var y = d3.scale.linear()
                .range([height, 0]);

            var line = d3.svg.line()
                .x(function(d) { return x(dateFormat.parse(d["key"])); })
                .y(function(d) { return y(d["values"]); })

            svgs.each(function(chartData, chartIndex) {
                // update y domain
                var yDomain = {};
                chartData.map(function(o) {
                    o["values"].map(function(v) {
                        yDomain[v["values"]] = true;
                    })
                });
                yDomain = d3.extent(
                    Object.keys(yDomain).map(function(k) {
                        return parseFloat(k);
                    })
                );
                y.domain(yDomain)

                // containers
                var svg = d3.select(this);
                var chart = svg.append("g")
                    .classed("chart", true)
                    .attr("height", height)
                    .attr("width", width)
                    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")

                // axes
                var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom")

                chart.append("g")
                    .classed({
                        "xAxis" : true,
                        "axis" : true
                    })
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left")
                    .ticks(5);

                chart.append("g")
                    .classed({
                        "yAxis" : true,
                        "axis" : true
                    })
                    .call(yAxis);

                var lineGroups = chart.selectAll("g.line")
                    .data(chartData)
                    .enter()
                    .append("g")
                        .classed({"line" : true});

                lineGroups.append("path")
                    .classed("line", true)
                    .attr("d", function(d) {
                        return line(d.values);
                    })
                    .attr("stroke", function(d, i) {
                        return colors(i);
                    })
            });
        }

        // call pym, new child with callback
        pymChild = new pym.Child({ renderCallback: drawChart });
    })
})