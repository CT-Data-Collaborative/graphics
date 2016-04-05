$(document).ready(function(){
    d3.csv("static/data/data.csv", function(data) {
        const DATA = data.map(function(o) {
            return {
                "Municipality" : o["Municipality"],
                "Planning Region" : o["Planning Region"],
                "Municipal Gap" : parseInt(o["Municipal Gap"]),
                "Population" : parseInt(o["Population"]),
                "Quintile" : parseInt(o["quintile"]),
                "State Nonschool Grants" : parseInt(o["State Nonschool Grants"]),
                "Net Municipal Gap" : parseInt(o["Municipal Gap"]) + parseInt(o["State Nonschool Grants"])
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

        var numberFormat = d3.format(",.0f");
        var decimalFormat = d3.format(",.2f");
        var currencyFormat = d3.format("$,.0f");
        var percentFormat = function(v) {
            return d3.format(",.0f")(v)+ "%";
        };
        // code from Shopify (see gist: https://gist.github.com/jlbruno/1535691)
        var quintileFormat = function(q) {
            var suffixes = ["th","st","nd","rd"];
            var suffixIndex = q % 100;
            return q + (suffixes[(suffixIndex - 20) % 10] || suffixes[suffixIndex] || suffixes[0]); // + " Quintile";
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
            "Municipality",
            "Planning Region",
            "Population",
            "Quintile",
            "Municipal Gap",
            "State Nonschool Grants",
            "Net Municipal Gap"
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
        
        
        function drawChart() {
            var sorter = thead.select("tr > th[data-sort]");
            var sortCol = sorter.attr("data-col");
            var sortOrder = sorter.attr("data-sort");

            // filter and sort data
            var filteredData = DATA.filter(function(o) {
                return filter.indexOf(o["Planning Region"]) !== -1
            }).sort(function(a, b) {
                if (sortOrder === "desc") {
                    // console.log((b[sortCol] > a[sortCol] ? 1 : -1));
                    return (b[sortCol] > a[sortCol] ? 1 : -1);
                } else {
                    // console.log((a[sortCol] > b[sortCol] ? 1 : -1));
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

                        if (
                            tableCols[col] == "Municipal Gap"
                            || tableCols[col] == "Net Municipal Gap"
                        ) {
                            thisCell.append("span")
                                .attr("class", function(d) {
                                    var colorClass = "Surplus"
                                    if (d[tableCols[col]] < 0) {
                                        colorClass = "Deficit"
                                    }
                                    return [colorClass, "label"].join(" ");
                                })
                                .text(function(d) {
                                    if (d[tableCols[col]] < 0) {
                                        return "Deficit"
                                    } else {
                                        return "Surplus"
                                    }
                                })
                                
                            thisCell.append("span")
                                .attr("class", "value")
                                .text(function(d) { return currencyFormat(d[tableCols[col]]); })
                        } else if (tableCols[col] == "Population" ) {
                            thisCell.append("span")
                                .attr("class", "value")
                                .text(function(d) { return numberFormat(d[tableCols[col]]); })
                        } else if (tableCols[col] == "State Nonschool Grants" ) {
                            thisCell.append("span")
                                .attr("class", "value")
                                .text(function(d) { return currencyFormat(d[tableCols[col]]); })
                        } else if (tableCols[col] == "Quintile" ) {
                            thisCell.append("span")
                                .attr("class", "value")
                                .text(function(d) { return quintileFormat(d[tableCols[col]]); })
                        } else {
                            thisCell.append("span")
                                .attr("class", "value")
                                .text(function(d) { return d[tableCols[col]]; })
                        }
                    }
                })

            // console.log(filteredData)
            // console.log(filter)
            // console.log(DATA)
            // console.log(GEODATA)
        }

        drawChart()
        
    })

})