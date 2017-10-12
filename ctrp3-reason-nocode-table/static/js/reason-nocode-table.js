/*jshint sub:true*/
$(document).ready(function(){
    d3.csv("static/data/reason-nocode-table.csv", function(data) {
        const DATA = data.map(function(o) {
            return {
                "Year" : o["Federal Fiscal Year"],
                "Speed Related" : parseFloat(o["Speed Related"]),
                "Cell Phone" : parseFloat(o["Cell Phone"]),
                "Registration" : parseFloat(o["Registration"]),
                "Defective Lights" : parseFloat(o["Defective Lights"]),
                "Moving Violation" : parseFloat(o["Moving Violation"]),
                "Traffic Control Signal" : parseFloat(o["Traffic Control Signal"]),
                "Stop Sign" : parseFloat(o["Stop Sign"]),
                "Seatbelt" : parseFloat(o["Seatbelt"]),
                "Display of Plates" : parseFloat(o["Display of Plates"]),
                "Suspended License" : parseFloat(o["Suspended License"]),
                "Window Tint" : parseFloat(o["Window Tint"]),
                "Equipment Violation" : parseFloat(o["Equipment Violation"]),
                "Other" : parseFloat(o["Other"]),
                "STC Violation" : parseFloat(o["STC Violation"]),
                "Administrative Offense" : parseFloat(o["Administrative Offense"]), 
                "Unlicensed Operation" : parseFloat(o["Unlicensed Operation"]) 
            };
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
            "Year", 
            "Speed Related", 
            "Cell Phone", 
            "Registration", 
            "Defective Lights", 
            "Moving Violation", 
            "Traffic Control Signal", 
            "Stop Sign", 
            "Seatbelt", 
            "Display of Plates", 
            "Suspended License", 
            "Window Tint", 
            "Equipment Violation", 
            "Other", 
            "STC Violation", 
            "Administrative Offense", 
            "Unlicensed Operation" 
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
        });
        
        
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
                    for (var col in tableCols) {
                        var thisCell = d3.select(this).append("td");

                        if (
                            tableCols[col] == "Year"
                            || tableCols[col] == "Speed Related"
                            || tableCols[col] == "Cell Phone"
                            || tableCols[col] == "Registration"
                            || tableCols[col] == "Defective Lights"
                            || tableCols[col] == "Moving Violation"
                            || tableCols[col] == "Traffic Control Signal"
                            || tableCols[col] == "Stop Sign"
                            || tableCols[col] == "Seatbelt"
                            || tableCols[col] == "Display of Plates"
                            || tableCols[col] == "Suspended License"
                            || tableCols[col] == "Window Tint"
                            || tableCols[col] == "Equipment Violation"
                            || tableCols[col] == "Other"
                            || tableCols[col] == "STC Violation"
                            || tableCols[col] == "Administrative Offense"
                            //|| tableCols[col] == "Unlicensed Operation"
                        ) {                                
                            thisCell.append("span")
                                .attr("class", "value")
                                .text(function(d) { return numberFormat(d[tableCols[col]]); });
                        } else if (tableCols[col] == "Unlicensed Operation") {
                            thisCell.append("span")
                                .attr("class", "value")
                                .text(function(d) {
                                    if (d[tableCols[col]] < 0) {
                                        return " - ";
                                    } else {
                                        return percentFormat(d[tableCols[col]]);
                                    }
                                });
                        } else {
                            thisCell.append("span")
                                .attr("class", "value")
                                .text(function(d) { return d[tableCols[col]]; });
                        }
                    }
                });

            // console.log(sortedData)
            // console.log(DATA)
            // console.log(GEODATA)

            $("#table > table").stickyTableHeaders({
                "scrollableArea" : "#table"
            });
        }

        drawChart();
        
    });

});