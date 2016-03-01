$(document).ready(function(){
    d3.csv("/static/data/gap-and-engl-trends.csv", function(data) {
        const DATA = data.map(function(o) {
            return {
                "Municipality" : o["Municipality"],
                "Planning Region" : o["Planning Region"],
                "Municipal Gap($ per capita)" : parseInt(o["Municipal Gap($ per capita)"]),
                "ENGL '09 vs '12" : parseFloat(o["ENGL '09 vs '12"])
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
                .attr("class", "btn btn-default active")
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
                .attr("class", "btn btn-default")
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

        // draw table
        var table = d3.select("div#table")
            .append("table");

        var thead = table.append("thead");
        var tbody = table.append("tbody");

        var tableCols = [
            "Municipality",
            "Planning Region",
            "Municipal Gap($ per capita)",
            "ENGL '09 vs '12"
        ];

        //populate thead
        thead.append("tr")
            .selectAll("th")
            .data(tableCols)
            .enter()
            .append("th")
            .attr("data-col", function(d) { return d; })
            .text(function(d) { return d; })
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
        
        var gapScale = function(value) {
                // doing this manually
                if (value <= -635) { return "Best"; }
                else if (value > -635 && value <= -139) { return "Better"; }
                else if (value > -139 && value <= 0) { return "Good"; }
                else if (value > 0 && value <= 310) { return "Bad"; }
                else if (value > 310) { return "Worst"; }
            }
        
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

                        if (col == 2) {
                            thisCell.append("span")
                                .attr("class", function(d) {
                                    return [gapScale(d[tableCols[col]]).toLowerCase(), "gap"].join(" ");
                                })
                                .text(function(d) {
                                    return gapScale(d[tableCols[col]]);
                                })
                        }

                        if (col == 3) {
                            thisCell.append("span")
                                .attr("class", function(d) {
                                    if (d[tableCols[col]] < -5) {
                                        trendClass = "negative";
                                    } else if (d[tableCols[col]] >= -5 && d[tableCols[col]] <= 5) {
                                        trendClass = "neutral";
                                    } else {
                                        trendClass = "positive"
                                    }
                                    return [trendClass, "trend"].join(" ");
                                })
                                .text(function(d) {
                                    if (d[tableCols[col]] < -5) {
                                        return "Negative";
                                    } else if (d[tableCols[col]] >= -5 && d[tableCols[col]] <= 5) {
                                        return "Neutral";
                                    } else {
                                        return "Positive";
                                    }
                                })
                        }
                        
                        thisCell.append("span")
                            .text(function(d) {
                                if (col == 2) {
                                    return numberFormat(d[tableCols[col]]);
                                } else if (col == 3) {
                                    return percentFormat(d[tableCols[col]]);
                                } else {
                                    return d[tableCols[col]];
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