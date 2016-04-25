$(document).ready(function(){
    d3.csv("static/data/agg-data.csv", function(data) {
        const DATA = data.map(function(o) {
            return {
                "COG" : o["Planning Region"],
                "Municipal Capacity" : parseInt(o["Municipal Capacity"]),
                "Municipal Cost" : parseInt(o["Municipal Cost"]),
                "Municipal Gap" : parseInt(o["Municipal Gap"]),
                "State Nonschool Grants" : parseInt(o["State Nonschool Grants"]),
                "Gap After Grants" : parseInt(o["Gap After Grants"]),
                "% of Gap filled by Grants" : parseFloat(o["% of Gap filled by Grants"])
            }
        });

        var numberFormat = d3.format("$,.0f");
        var percentFormat = function(v) {
            return d3.format(",.0f")(v)+ "%";
        };

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
            "COG",
            "Municipal Capacity",
            "Municipal Cost",
            "Municipal Gap",
            "State Nonschool Grants",
            "Gap After Grants",
            "% of Gap filled by Grants"
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
            var sortedData = DATA.sort(function(a, b) {
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
            $("#table").stickyTableHeaders("destroy");
            tbody.selectAll("tr").remove();

            var tableRows = tbody.selectAll("tr")
                .data(sortedData)
                .enter()
                .append("tr")
                .each(function(rowData, i) {
                    for (col in tableCols) {
                        var thisCell = d3.select(this).append("td");

                        if (
                            tableCols[col] == "Municipal Capacity"
                            || tableCols[col] == "Municipal Cost"
                            || tableCols[col] == "Municipal Gap"
                            || tableCols[col] == "State Nonschool Grants"
                            || tableCols[col] == "Gap After Grants"
                        ) {                                
                            thisCell.append("span")
                                .attr("class", "value")
                                .text(function(d) { return numberFormat(d[tableCols[col]]); })
                        } else if (tableCols[col] == "% of Gap filled by Grants") {
                            thisCell.append("span")
                                .attr("class", "value")
                                .text(function(d) {
                                    if (d[tableCols[col]] < 0) {
                                        return " - ";
                                    } else {
                                        return percentFormat(d[tableCols[col]]);
                                    }
                                })
                        } else {
                            thisCell.append("span")
                                .attr("class", "value")
                                .text(function(d) { return d[tableCols[col]]; })
                        }
                    }
                })

            // console.log(sortedData)
            // console.log(DATA)
            // console.log(GEODATA)

            $("#table > table").stickyTableHeaders({
                "scrollableArea" : "#table"
            });
        }

        drawChart()
        
    })

})