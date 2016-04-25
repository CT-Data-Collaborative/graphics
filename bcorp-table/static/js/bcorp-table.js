$(document).ready(function(){
    d3.json("static/data/data.json", function(data) {
        var numberFormat = d3.format("$,.0f");
        var percentFormat = function(v) {
            return d3.format(",.0f")(v)+ "%";
        };
        var dateFormat = d3.time.format("%b %d, %Y");

        const DATA = data.map(function(o) {
            var bcorp = {};

            // name
            bcorp["Name"] = o["name"];
            
            // address
            if (o["address"] !== false) {
                bcorp["Address"] = o["address"]["city"]+", "+o["address"]["state"];
            } else {
                bcorp["Address"] = "&mdash;"
            }

            // formation date and type
            bcorp["Formation"] = dateFormat.parse(o["formation"]["date"]);
            bcorp["Original Type"] = o["formation"]["type"];

            // organization
            if (o["organization"] !== false) {
                bcorp["Organization"] = dateFormat.parse(o["organization"]["date"]);
            } else {
                bcorp["Organization"] = "&mdash;"
            }

            // conversion
            if (o["conversion"] !== false) {
                bcorp["Conversion to BCorp"] = dateFormat.parse(o["conversion"]["date"]);
            } else {
                bcorp["Conversion to BCorp"] = "&mdash;"
            }

            return bcorp;
        });

        // d3.select("#table").append("pre")
        //     .text(JSON.stringify(DATA, null, 4));
        // return;

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
            "index",
            "Name",
            "Address",
            "Formation",
            "Original Type",
            "Organization",
            "Conversion to BCorp"
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
                    if (a[sortCol] == "&mdash;" && b[sortCol] == "&mdash;") {
                        return 0;
                    } else if (b[sortCol] == "&mdash;" || a[sortCol] > b[sortCol]) {
                        return -1;
                    } else if (a[sortCol] == "&mdash;" || b[sortCol] > a[sortCol]) {
                        return 1;
                    } else {
                        return 0;
                    }
                    // return (b[sortCol] > a[sortCol] ? 1 : -1);
                } else {
                    // console.log((a[sortCol] > b[sortCol] ? 1 : -1));
                    if (a[sortCol] == "&mdash;" && b[sortCol] == "&mdash;") {
                        return 0;
                    } else if (a[sortCol] == "&mdash;" || b[sortCol] > a[sortCol]) {
                        return -1;
                    } else if (b[sortCol] == "&mdash;" || a[sortCol] > b[sortCol]) {
                        return 1;
                    } else {
                        return 0;
                    }
                    // return (a[sortCol] > b[sortCol] ? 1 : -1);
                }
            }).map(function(o, oi, oa){
                o.index = oi;
                return o;
            });

            // remove existing data
            // enter->update->exit pattern wasn't working, and with the size of our
            // data being this small it doesn't affect user experience to just redraw entirely
            tbody.selectAll("tr").remove();

            var tableRows = tbody.selectAll("tr")
                .data(sortedData)
                .enter()
                .append("tr")
                .each(function(rowData, i) {
                    for (col in tableCols) {
                        var thisCell = d3.select(this).append("td");

                        if (
                            tableCols[col] == "Formation"
                            || tableCols[col] == "Organization"
                            || tableCols[col] == "Conversion to BCorp"
                        ) {
                            if (rowData[tableCols[col]] == "&mdash;") {
                                thisCell.append("span")
                                    .attr("class", "value")
                                    .html(function(d) { return d[tableCols[col]]; })
                            } else {
                                thisCell.append("span")
                                    .attr("class", "value")
                                    .html(function(d) { return dateFormat(d[tableCols[col]]); })
                            }
                        } else {
                            thisCell.append("span")
                                .attr("class", "value")
                                .html(function(d) { return d[tableCols[col]]; })
                        }
                    }
                })

            // console.log(sortedData)
            // console.log(DATA)
            // console.log(GEODATA)
        }

        drawChart()
        
    })

})