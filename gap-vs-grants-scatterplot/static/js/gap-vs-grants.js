$(document).ready(function(){
    d3.csv("/static/data/NEPPC-appendix-table-1.csv", function(data) {
        const DATA = data.map(function(o) {
                return {
                    "Municipality" : o["Municipality"],
                    "Municipality Type" : o["Municipality Type"],
                    "Municipal Gap($ per capita)" : parseInt(o["Municipal Gap($ per capita)"]),
                    "State Nonschool Grants ($ per capita)" : parseInt(o["State Nonschool Grants ($ per capita)"]),
                    "Percentage of Municipal Gap Filled by State Nonschool Grants" : parseInt(o["Percentage of Municipal Gap Filled by State Nonschool Grants"])
                }
            });
        
        const FILTER_OPTS = [
            // "All",
            "Urban Core",
            "Urban Periphery",
            "Suburban",
            "Above-Average-Property Rural",
            "Below-Average-Property Rural",
            "Wealthy"
        ];

        var filter = FILTER_OPTS;

        // draw selector/options
        var colorScale = d3.scale.ordinal()
            .range(d3.range(0,6).map(function(i) { return "color" + (i+1); }))
            .domain(DATA.map(function(o) { return o["Municipality Type"]; }));

        var checkboxes = d3.selectAll("div#options  > div:first-child")
            .selectAll("label")
            .data(FILTER_OPTS)
            .enter()
            .append("label")
                .attr("class", "btn btn-default active")
                .text(function(d) { return d; })
                .datum(function(d) { return d; });
        
        checkboxes.each(function(checkboxData) {
            d3.select(this)
                .append("span")
                .attr("class", function(d) {
                    return [
                        "colorblock",
                        colorScale(d)
                    ].join(" ");
                })
            d3.select(this)
                .append("input")
                    .property("checked", true)
                    .attr("type", "checkbox")
                    .attr("name", "filter")
                    .attr("value", function(d) { return d; })

        })

        // register change event
        d3.selectAll("div#options > div:first-child > label")
            .on("mousedown", function() {
                var thisLabel = d3.select(this);
                thisLabel.classed("active", !thisLabel.classed("active"))

                var thisValue = thisLabel.select("input").node().attributes["value"].value;
                

                if (filter.indexOf(thisValue) !== -1) {
                    console.log("removing value:" + thisValue);
                    filter = filter.filter(function(f) { return f !== thisValue; });
                } else {
                    console.log("adding value:" + thisValue);
                    filter.push(thisValue);
                }

                console.log(filter);

                drawChart()
            })

        // register select all/none events
        d3.selectAll("button#Select_All")
        .on("click", function(){
            d3.selectAll("div#options > div:first-child label")
                .classed("active", true);

            d3.selectAll("div#options > div:first-child input")
                .property("checked", true);

            filter = FILTER_OPTS;
            drawChart();
        });

        d3.selectAll("button#Select_None")
        .on("click", function(){
            d3.selectAll("div#options > div:first-child label")
                .classed("active", false);

            d3.selectAll("div#options > div:first-child input")
                .property("checked", false);

            filter = [];
            drawChart();
        });

        var numberFormat = d3.format("$,.0f");
        var percentFormat = function(v) {
            return d3.format(",.0f")(v)+ "%";
        };

        // draw chart
        // HEIGHT AND WIDTH NEED TO BE MORE RESPONSIVE
        var BBox = d3.select("div#scatterplot").node().getBoundingClientRect();
        var height = BBox.height;
        var width = BBox.width;
        console.log(BBox);
        var margin = {
            top: (height * 0.01),
            right: (width * 0.05),
            bottom: (height * 0.1),
            left: (width * 0.1)
        }

        var svg = d3.select("#scatterplot")
            .append("svg")
            .attr("height", height)
            .attr("width", width);

        var chart = svg.append("g")
            .attr("height", height - (margin.top + margin.bottom))
            .attr("width", width - (margin.left + margin.right))
            .attr("transform", "translate("+margin.left+", "+margin.top+")");

        // scales, axes, labels
        var xScale = d3.scale.linear()
            .range([0, chart.attr("width")])
            .domain(d3.extent(DATA.map(function(o) { return o["Municipal Gap($ per capita)"]; })).reverse())
            .nice();

        var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom")
            .innerTickSize(margin.top-chart.attr("height"))
            .tickPadding(10)
            .tickFormat(numberFormat);

        chart.append("g")
            .classed({
                "x-axis" : true,
                "axis" : true
            })
            .attr("transform", "translate(0, " + chart.attr("height") + ")")
            .call(xAxis);

        var yScale = d3.scale.linear()
            .range([margin.top, chart.attr("height")])
            .domain([
                d3.max(DATA.map(function(o) { return o["State Nonschool Grants ($ per capita)"]; })),
                0
            ])
            .nice();

        var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .innerTickSize(-chart.attr("width"))
            .tickPadding(10)
            .tickFormat(numberFormat);

        chart.append("g")
            .classed({
                "y-axis" : true,
                "axis" : true
            })
            .attr("transform", "translate(0, 0)")
            .call(yAxis);

        var axisLabels = chart.append("g")
            .classed("axis-labels", true);

        axisLabels.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate(" + (margin.left/-1.5) + ", " + height/2 + ")rotate(-90)")
            .text("State Nonschool Grants ($ per capita)")

        axisLabels.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate(" + (width/2) + ", " + (height-(margin.bottom/2)) + ")")
            .text("Municipal Gap ($ per capita)")


        /** Legend **/
        // LEGEND SHOWS COLOR CODE <-> TYPE RELATIONSHIP ? currently in buttons
        /** END Legend **/

        function drawChart() {
            // filter data
            var filteredData = DATA.filter(function(o) {
                return filter.indexOf(o["Municipality Type"]) !== -1
            });

            var pointGroups = chart.selectAll("g.point")
                .data(filteredData, function(d) {
                    return d["Municipality"];
                });

            pointGroups.enter()
                    .append("g")
                    .classed("point", true)
                    .datum(function(d) { return d; })
                    .each(function(pointData, i) {
                        d3.select(this).append("path")
                            .attr("class", function(d) {
                                // get color# css class from color scale using d["Municipality Type"]
                                return colorScale(d["Municipality Type"]);
                            })
                            .attr("d", d3.svg.symbol().type("cirlce").size(10)) // should size be based on chart size?
                            .attr("transform", function(d) {
                                var tx = xScale(d["Municipal Gap($ per capita)"]),
                                    ty = yScale(d["State Nonschool Grants ($ per capita)"]);
                                return "translate(" + tx + ", " + ty +")";}
                            );

                        /* Register hover events */
                        d3.select(this).on("mouseover", function() {
                            d3.select(this)
                                .classed("highlight", true);

                            d3.selectAll("div#popup")
                            .selectAll("p")
                            .data([
                                {
                                    label: "",
                                    value: pointData["Municipality"]
                                },
                                {
                                    label: "Type",
                                    value: pointData["Municipality Type"]
                                },
                                {
                                    label: "Percentage of Gap Filled by State Nonschool Grants",
                                    value: percentFormat(pointData["Percentage of Municipal Gap Filled by State Nonschool Grants"])
                                }
                            ])
                            .enter()
                            .append("p")
                                .html(function(d) {
                                    if (d.label != "") {
                                        return [
                                            ["<b>", "</b>"].join(d.label),
                                            d.value
                                        ].join(": "); 
                                    } else {
                                        return d.value;
                                    }
                                });
                        })
                        .on("mouseout", function() {
                            d3.select(this)
                                .classed("highlight", false);

                            d3.selectAll("div#popup p").remove();
                        })
                    })

            pointGroups.exit().remove()

            // console.log(filteredData)
            // console.log(filter)
            // console.log(DATA)
            // console.log(GEODATA)
        }

        drawChart()
        
    })

})