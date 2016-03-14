$(document).ready(function(){
    d3.csv("static/data/gap-and-engl-trends.csv", function(data) {
        const DATA = data.map(function(o) {
            return {
                "Municipality" : o["Municipality"],
                "Planning Region" : o["Planning Region"],
                "Rank" : parseInt(o["Rank"]),
                "Municipal Gap($ per capita)" : parseInt(o["Municipal Gap($ per capita)"]),
                "ENGL AAGR '11-'14" : parseFloat(o["ENGL AAGR '11-'14"])
            }
        });

        const FILTER_OPTS = [
            "Capitol Region",
            "Greater Bridgeport",
            "Lower CT River Valley",
            "Naugatuck Valley",
            "Northeast CT",
            "Northwest Hills",
            "South Central",
            "Southeastern CT",
            "Western CT"
        ];

        var filter = FILTER_OPTS;

        var numberFormat = d3.format("$,.0f");
        var percentFormat = function(v) {
            return d3.format(",.1f")(v)+ "%";
        };

        // draw selector/options
        var filterButtons = d3.selectAll("div#options > div:first-child")
            .selectAll("button")
            .data(FILTER_OPTS)
            .enter()
                .append("button")
                .attr("class", "btn btn-sm btn-default active")
                .attr("value", function(d) { return d; })
                .text(function(d) { return d; });

        // register change event
        d3.selectAll("div#options > div:first-child button")
            .on("click", function() {
                var thisButton = d3.select(this);
                thisButton.classed("active", !thisButton.classed("active"));

                var thisValue = thisButton.attr("value");

                if (filter.indexOf(thisValue) === -1) {
                    filter.push(thisValue)
                } else {
                    filter = filter.filter(function(f) { return f !== thisValue; });
                }

                drawChart()
            })

        // add select all/none buttons
        d3.selectAll("div#options > div:last-child")
            .selectAll("button")
            .data(["All", "None"])
            .enter()
            .append("button")
                .attr("class", "btn btn-sm btn-default")
                .attr("id", function(d) { return ["Select", d].join("_"); })
                .text(function(d) { return ["Select", d].join(" "); })

        // register select all/none events
        d3.selectAll("button#Select_All")
        .on("click", function(){
            d3.selectAll("div#options > div:first-child button")
                .classed("active", true);

            filter = FILTER_OPTS;
            drawChart();
        });

        d3.selectAll("button#Select_None")
        .on("click", function(){
            d3.selectAll("div#options > div:first-child button")
                .classed("active", false);

            filter = [];
            drawChart();
        });

        var gapScale = function(value) {
                // doing this manually
                if (value >= 635) { return 1; }
                else if (value < 635 && value >= 139) { return 2; }
                else if (value < 139 && value >= 0) { return 3; }
                else if (value < 0 && value >= -310) { return 4; }
                else if (value < -310) { return 5; }
            }

        var legendData = [
            [635, 5110],
            [139, 653],
            [0, 139],
            [-310, 0],
            [-1330, -310]
        ]/*.map(function(span) {
            return [numberFormat(span[0]), numberFormat(span[1])]
        })*/

        var legend = d3.select("div#legend");
        
        legend.append("div")
            .append("span")
            .classed("legend-title", true)
            .text("Municipal Gap:");

        legend.append("div")
            .selectAll("div")
            .data(legendData)
            .enter()
            .append("div")
                .append("span")
                .text(function(d) {
                    return d.map(function(v) { return numberFormat(v); }).join(" to ");
                })
                .append("span")
                .attr("class", function(d, i) {
                    return "color_"+gapScale((d[0]+d[1])/2);
                })

        // add note about sorting columns
        var sortCallout = d3.select("div#table")
            .append("div")
            .classed("note", true)
            .append("p")
                .text("Click a column header to sort by that column. Click again to reverse order.");

        // draw table
        var table = d3.select("div#table")
            .append("table");

        var thead = table.append("thead");
        var tbody = table.append("tbody");

        var tableCols = [
            {
                "name": "Municipality",
                "label" : "Municipality"
            },
            {
                "name": "Planning Region",
                "label" : "Planning Region"
            },
            {
                "name": "Rank",
                "label" : "Rank"
            },
            {
                "name": "Municipal Gap($ per capita)",
                "label" : "Municipal Gap"
            },
            {
                "name": "ENGL AAGR '11-'14",
                "label" : "ENGL AAGR '11-'14"
            }
        ];

        //populate thead
        thead.append("tr")
            .selectAll("th")
            .data(tableCols)
            .enter()
            .append("th")
            .attr("data-col", function(d) { return d.name; })
            .text(function(d) { return d.label; })
            .attr("data-sort", function(d, i) {
                if (i === 0) {
                    return "asc";
                }
            });
            
        thead.selectAll("tr > th")
            .append("i")
            .classed({
                "fa" : true,
                "fa-chevron-circle-up" : true,
                "asc" : true
            });
        thead.selectAll("tr > th")
            .append("i")
            .classed({
                "fa" : true,
                "fa-chevron-circle-down" : true,
                "desc" : true
            });

        // register sorting clicks
        thead.selectAll("tr > th").on("click", function() {
            var thisTh = d3.select(this);
            var thisSort = d3.select(this).attr("data-sort");

            // remove all sort attrs
            thead.selectAll("tr > th").attr("data-sort", null);

            // if thisSort is asc/desc, then reverse order
            if (undefined !== thisSort && thisSort == "asc") {
                // set to DESC
                thisTh.attr("data-sort", "desc");
            } else {
                // set to ASC
                thisTh.attr("data-sort", "asc");
            }

            // redraw chart
            drawChart();
        })
        
        function drawChart() {
            var sorter = thead.select("tr > th[data-sort]");
            var sortCol = sorter.attr("data-col");
            var sortOrder = sorter.attr("data-sort");

            // filter and sort data
            var filteredData = DATA.filter(function(o) {
                return filter.indexOf(o["Planning Region"]) !== -1
            }).sort(function(a, b) {
                if (sortOrder === "desc") {
                    return (b[sortCol] > a[sortCol] ? 1 : -1);
                } else {
                    return (a[sortCol] > b[sortCol] ? 1 : -1);
                }
            });

            // remove existing data
            // enter->update->exit pattern wasn't working, and with the size of our
            // data being this small it doesn't affect user experience to just redraw entirely
            tbody.selectAll("tr").remove();

            var tableRows = tbody.selectAll("tr")
                .data(filteredData)
                .enter()
                .append("tr")
                .each(function(rowData, i) {
                    for (col in tableCols) {
                        var thisCell = d3.select(this).append("td");

                        if (tableCols[col].name == "Municipal Gap($ per capita)") {
                            thisCell.attr("class", function(d) {
                                var colorClass = "color_" + gapScale(d[tableCols[col].name]);

                                return [
                                    colorClass,
                                    "gap"
                                ].join(" ");
                            })
                        } else if (tableCols[col].name == "ENGL AAGR '11-'14") {
                            thisCell.attr("class", function(d) {
                                if (d[tableCols[col].name] < -0.95) {
                                    trendClass = "decrease";
                                } else if (d[tableCols[col].name] >= -0.95 && d[tableCols[col].name] < 0.95) {
                                    trendClass = "flat";
                                } else {
                                    trendClass = "increase"
                                }

                                return [
                                    trendClass,
                                    "engl"
                                ].join(" ");
                            })

                            thisCell.append("i")
                                .attr("class", function(d) {
                                    if (d[tableCols[col].name] < -0.95) {
                                        trendClass = "fa-arrow-down";
                                    } else if (d[tableCols[col].name] >= -0.95 && d[tableCols[col].name] < 0.95) {
                                        trendClass = "fa-arrow-right";
                                    } else {
                                        trendClass = "fa-arrow-up"
                                    }
                                    return [trendClass, "fa"].join(" ");
                                })
                        } else {
                        }

                        thisCell.append("span")
                            .text(function(d) {
                                if (tableCols[col].name == "Municipal Gap($ per capita)") {
                                    return numberFormat(d[tableCols[col].name]);
                                } else if (tableCols[col].name == "ENGL AAGR '11-'14") {
                                    return percentFormat(d[tableCols[col].name]);
                                } else {
                                    return d[tableCols[col].name];
                                }
                            })
                    }
                })

            // console.log(filter)
            // console.log(DATA)
            // console.log(GEODATA)
        }

        drawChart()
        
    })

})