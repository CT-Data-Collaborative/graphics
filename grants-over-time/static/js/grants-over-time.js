$(document).ready(function(){
    function isNumeric(val) {
        return !isNaN(parseFloat(val)) && isFinite(val);
    }

    function sluggify(text) {
        if (isNumeric(text.slice(0, 1))) {
            text = "_" + text;
        }

        return text
            .toLowerCase()
            .replace(/[^0-9a-zA-Z_-]/ig, "_")
            .replace(/_+/ig, "_");
    }

    function sortGrants(a, b) {
        if (a == "Total") {
            return -1;
        } else if (b == "Total") {
            return 1;
        } else {
          return (a < b ? 1 : -1)
        }
    }

    var currencyFormat = d3.format("$,.0f")
    var integerPercentFormat = d3.format(",.0%");
    var decimalPercentFormat = d3.format(",.2%");
    var diffFormat = function(val) {
        if (isNaN(val)) {
            return "&mdash;";
        }
        if (val > 0) {
            return "+" + decimalPercentFormat(val);
        } else {
            return decimalPercentFormat(val);
        }
    }

    d3.csv("static/data/wide-grant-data.csv", function(data) {
        data = data.map(function(o) {
            return {
                "Town" : o["Town"],
                "Grant" : o["Grant"],
                "2014" : parseFloat(o["2014"]),
                "2015" : parseFloat(o["2015"])
            };
        });

        const DATA = d3.nest()
            .key(function(d) { return d["Town"]; })
            .key(function(d) { return d["Grant"]; })
            .rollup(function(leaf) {
                leaf = leaf.pop();
                // // if we want to trim out the duplicated info at the leaf level
                leaf = {
                    "2014" : leaf["2014"],
                    "2015" : leaf["2015"]
                };
                return leaf;
            })
            .map(data);

        d3.json("static/data/town.geojson", function(error, geodata) {
            const GEODATA = geodata;

            // draw map
            var map = L.map("map", {
                zoomControl:false
            });

            map.attributionControl.setPrefix('<a href="http://ctdata.org">CTData.org</a>');

            // map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
            map.boxZoom.disable();
            map.keyboard.disable()

            var tileLayer = new L.tileLayer(
                "http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
                {
                    attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ"
                })
                .addTo(map);

            var townLayer = L.geoJson(GEODATA.features, {});

            /** Legend **/
            var legend = L.control({position: "bottomright"});
            legend.onAdd = function (map) {
                var div = L.DomUtil.create("div", "legend");

                var legendTitle = L.DomUtil.create("span", "title", div);
                legendTitle.innerHTML = "Nonschool Grant Trend";

                var legendBreak = L.DomUtil.create("br", "", div);
                var legendSubTitle = L.DomUtil.create("span", "subtitle", div);
                legendSubTitle.innerHTML = "FY 14 to FY 15";

                ["Increase", "Decrease"].map(function(val) {
                    var entry = L.DomUtil.create("div", "entry", div);
                    entry.innerHTML = val;
                    var colorBlock = L.DomUtil.create("span", sluggify(val), entry);
                });

                return div;
            };
            legend.addTo(map);
            /** END Legend **/

            function drawChart(autoClickTown) {
                // clear previous map data
                if (undefined !== townLayer) {
                    map.removeLayer(townLayer);
                }

                // join data to geojson, color code etc according to filtering
                var geoJoinedData = GEODATA.features.map(function(geo) {
                    if (!(geo.properties.NAME in DATA)) {
                        console.log(geo.properties.NAME + "Has no data!!!");
                        return geo;
                    }

                    geo.properties.GRANTS = DATA[geo.properties.NAME];

                    if (geo.properties.GRANTS["Total"]["2015"] > geo.properties.GRANTS["Total"]["2014"]) {
                        // Decrease in grants
                        geo.properties.CLASS = "increase"
                    } else {
                        // otherwise
                        geo.properties.CLASS = "decrease"
                    }

                    return geo;
                })

                function colorize(t) {
                    return {
                        className: t.properties.CLASS
                    };
                }


                townLayer = L.geoJson(geoJoinedData, {
                    style: colorize,
                    onEachFeature: function (feature, layer) {
                        var grantChange = (feature.properties.GRANTS["Total"]["2015"]/feature.properties.GRANTS["Total"]["2014"]) - 1;
                        var popupContent = ["<b>", "</b>"].join(feature.properties.NAME);
                            popupContent += "<br>2014: "+currencyFormat(feature.properties.GRANTS["Total"]["2014"]);
                            popupContent += "<br>2015: "+currencyFormat(feature.properties.GRANTS["Total"]["2015"]);
                            popupContent += "<br>Change: "+diffFormat(grantChange);
                        layer.bindPopup(popupContent);
                    }
                }).addTo(map);

                townLayer.getLayers().forEach(function(geo) {
                    geo.on("click", function(e) { drawTable(this.feature.properties); })
                    geo.on("popupclose", function(e) { destroyTables(); })

                    if (
                        undefined !== autoClickTown
                        && geo.feature.properties.NAME == autoClickTown
                    ) {
                        geo.openPopup();
                        drawTable(geo.feature.properties)
                    }
                })

                map.fitBounds(townLayer.getBounds());

                function destroyTables() {
                    d3.select("div#table").selectAll("*").remove();
                }

                function drawTable(tableData) {
                    var tableContainer = d3.select("div#table");

                    // title of table
                    var title = tableContainer.append("h3")
                        .text(tableData.NAME);

                    var table = tableContainer.append("table")
                        .attr("data-town", tableData.NAME)
                        .classed();

                    var thead = table.append("thead");
                    var tbody = table.append("tbody");

                    // populate thead > tr > th
                    thead.append("tr")
                        .selectAll("th")
                        .data([
                            "Grant",
                            "2014",
                            "2015",
                            "Trend"
                        ])
                        .enter()
                        .append("th")
                            .text(function(d) { return d; })

                    // reorganize data for tbody
                    grantData = [];

                    for (var grant in tableData["GRANTS"]) {
                        grant = {
                            "key" : grant,
                            "values" : tableData["GRANTS"][grant]
                        };

                        grant["values"]["Trend"] = (grant["values"]["2015"]/grant["values"]["2014"]) - 1;
                        
                        grantData.push(grant);
                    }

                    // populate tbody > tr > td
                    tbody.selectAll("tr")
                        .data(grantData.sort(sortGrants))
                        .enter()
                        .append("tr")
                        .datum(function(d) { return d; })
                        .each(function(rowData, rowIndex) {
                            var row = d3.select(this);

                            // append grant cell
                            row.append("td")
                                .text(rowData["key"])

                            // append 2014 cell
                            row.append("td")
                                .text(currencyFormat(rowData["values"]["2014"]))

                            // append 2015 cell
                            row.append("td")
                                .text(currencyFormat(rowData["values"]["2015"]))

                            // append trend cell
                            row.append("td")
                                .append("span")
                                .attr("class", function() {
                                    if (rowData["values"]["Trend"] > 0) {
                                        return "increase";
                                    } else if (rowData["values"]["Trend"] < 0) {
                                        return "decrease"
                                    } else {
                                        return "neutral";
                                    }
                                })
                                .html(diffFormat(rowData["values"]["Trend"]))

                        });
                }
            }

            drawChart()

            $(window).on('resize', function() {
                // get table town
                var currentTown = d3.select("div#table").select("table")

                if (currentTown.size() > 0) {
                    currentTown = currentTown.attr("data-town");
                } else {
                    currentTown = null;
                }
                drawChart(currentTown);
            });
        })
    })
})