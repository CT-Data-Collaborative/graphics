$(document).ready(function(){
    d3.csv("/static/data/NEPPC-appendix-table-1.csv", function(data) {
        const DATA = data;
        const SCALE_VALUES = DATA.map(function(o){
            return parseInt(o["Municipal Gap($ per capita)"]);
        });

        d3.json("/static/data/town.geojson", function(error, geodata) {
            const GEODATA = geodata;

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
            var checkboxes = d3.selectAll("div#options")
                .selectAll("div")
                .data(FILTER_OPTS)
                .enter()
                    .append("div")
                    .classed("checkbox", true)
                    .datum(function(d) { return d; });

            checkboxes.each(function(checkboxOption, i) {
                d3.select(this)
                    .append("input")
                    .attr("type", "checkbox")
                    .attr("name", "filter")
                    .attr("checked", "checked")
                    .attr("value", function(d) { return d; });

                d3.select(this)
                    .append("span")
                    .text(function(d) { return d; });
            })

            // register change event
            d3.selectAll("div.checkbox input")
                .on("change", function() {
                    filter = d3.selectAll("div.checkbox input:checked")[0].map(function(n) {
                        return n.attributes["value"].value
                    })
                    //n.pop().attributes["value"].values
                    // filter = d3.select(this).node().value;
                    drawChart()
                })

            // add select all/none buttons
            var checkboxes = d3.selectAll("div#options")
                .selectAll("button")
                .data(["All", "None"])
                .enter()
                .append("button")
                    .attr("id", function(d) { return ["Select", d].join("_"); })
                    .text(function(d) { return ["Select", d].join(" "); })

            // register select all/none events
            d3.selectAll("button#Select_All")
            .on("click", function(){
                d3.selectAll("div.checkbox input")
                    .property("checked", true)

                filter = FILTER_OPTS;
                drawChart();
            });

            d3.selectAll("button#Select_None")
            .on("click", function(){
                d3.selectAll("div.checkbox input")
                    .property("checked", false)

                filter = [];
                drawChart();
            });
            // draw map
            var map = L.map("map", {
                zoomControl:false
            });

            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();

            var tileLayer = new L.tileLayer(
                "http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
                {
                    attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
                })
                .addTo(map);

            var statesLayer = L.geoJson(GEODATA.features, {});

            /** Legend **/
            var numberFormat = d3.format("$,.0f");

            var quintileScale = d3.scale.quantile()
                .domain(SCALE_VALUES)
                .range(d3.range(1,6));

            var quantiles = [d3.min(SCALE_VALUES)]
                .concat(quintileScale.quantiles())
                .concat([d3.max(SCALE_VALUES)]);

            var legendData = d3.range(0,5).map(function(i) {
                return [numberFormat(quantiles[i]), numberFormat(quantiles[i+1])]
            })

            var legend = L.control({position: "bottomright"});
            legend.onAdd = function (map) {
                var div = L.DomUtil.create("div", "legend");

                var legendTitle = L.DomUtil.create("h3", "title", div),
                    legendSubTitle = L.DomUtil.create("h4", "subtitle", div);
                legendTitle.innerHTML = "Municipal Gap";
                legendSubTitle.innerHTML = "($ per capita)";
                
                // loop through our quantile intervals and generate a label with a colored square for each interval
                for (var i = 0; i < legendData.length; i++) {
                    var entry = L.DomUtil.create("div", "entry", div);
                    entry.innerHTML = legendData[i].join(" to ");

                    var colorBlock = L.DomUtil.create("span", "color"+(i+1), entry)
                }

                return div;
            };
            legend.addTo(map);
            /** END Legend **/

            function drawChart() {
                // clear previous map data
                if (undefined !== statesLayer) {
                    map.removeLayer(statesLayer);
                }

                // filter data
                var filteredData = DATA.map(function(o) {
                    return {
                        "Municipality" : o["Municipality"],
                        "Municipality Type" : o["Municipality Type"],
                        "Municipal Gap($ per capita)" : parseInt(o["Municipal Gap($ per capita)"])
                    }
                }).filter(function(o) {
                    return filter.indexOf(o["Municipality Type"]) !== -1
                });

                // join data to geojson
                var geoJoinedData = GEODATA.features.map(function(geo) {
                    var geoValue = filteredData.filter(function(o) {
                        return o["Municipality"] === geo.properties.NAME;
                    })
                    if (geoValue.length > 0) {
                        geo.properties.VALUE = geoValue.pop()["Municipal Gap($ per capita)"];
                    } else {
                        geo.properties.VALUE = null;
                    }

                    return geo;
                })/*.filter(function(geo) {
                    return geo.properties.VALUE !== null;
                })*/

                function colorize(t) {
                    return {
                        fillColor: "black",
                        fillOpacity: 1,
                        // color: "#9C9C9C",
                        color: (null === t.properties.VALUE ? "#4A4A4A" : "#ECECEC"),
                        weight: 1,
                        className: (null === t.properties.VALUE ? "colornone" : "color"+quintileScale(t.properties.VALUE))
                    };
                }

                statesLayer = L.geoJson(geoJoinedData, {
                    style: colorize,
                    onEachFeature: function (feature, layer) {
                        // if we only want popups on selected towns
                        /*if (null !== feature.properties.VALUE) {
                            var popupContent = [feature.properties.NAME, numberFormat(feature.properties.VALUE)].join(": ")
                            layer.bindPopup(popupContent);
                        }*/

                        // If we want popup on all towns, but only give values for selected towns
                        var popupContent = feature.properties.NAME;
                        if (null !== feature.properties.VALUE) {
                            popupContent += ": "+numberFormat(feature.properties.VALUE);
                        }
                        layer.bindPopup(popupContent);

                        // If we want popup on all towns, regardless of selection,
                        //   we will need to modify this to look at the original DATA const,
                        //   not the filteredData/geoJoinedData
                        /*var popupContent = feature.properties.NAME;
                        if (null !== feature.properties.VALUE) {
                            popupContent += ": "+numberFormat(feature.properties.VALUE);
                        }
                        layer.bindPopup(popupContent);*/
                    }
                }).addTo(map);

                // IF WE WANT TO ADD THESE POPUPS ON MOUSEOVER/OUT INSTEAD OF JUST CLICK
                /*statesLayer.getLayers().forEach(function(geo) {
                    geo.on("mouseover", function(e) { this.openPopup(); })
                    geo.on("mouseout", function(e) { this.closePopup(); })
                })*/

                map.fitBounds(statesLayer.getBounds());

                // console.log(filteredData)
                // console.log(filter)
                // console.log(DATA)
                // console.log(GEODATA)
            }

            drawChart()
        })
    })

})