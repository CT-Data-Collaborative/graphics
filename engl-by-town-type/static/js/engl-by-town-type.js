$(document).ready(function(){
    d3.csv("/static/data/NEPPC-appendix-table-1.csv", function(data) {
        const DATA = data;
        const SCALE_VALUES = DATA.map(function(o){
            return parseInt(o["Equalized Net Grand List ($000s per capita)"]);
        });

        d3.json("/static/data/town.geojson", function(error, geodata) {
            const GEODATA = geodata;

            var filter = "All";

            const FILTER_OPTS = [
                "All",
                "Urban Core",
                "Urban Periphery",
                "Suburban",
                "Above-Average-Property Rural",
                "Below-Average-Property Rural",
                "Wealthy"
            ];

            // draw selector/options
            d3.selectAll("div#options")
                .append("select")
                .attr("id", "filter")
                .selectAll("option")
                .data(FILTER_OPTS)
                .enter()
                .append("option")
                    .attr("value", function(d) { return d; })
                    .text(function(d) { return d; })
            
            // register change event
            d3.select("select#filter")
                .on("change", function() {
                    // console.log(d3.select(this).node().value);
                    filter = d3.select(this).node().value;
                    drawChart()
                })

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
                        "Equalized Net Grand List ($000s per capita)" : parseInt(o["Equalized Net Grand List ($000s per capita)"])
                    }
                }).filter(function(o) {
                    return filter === "All" || o["Municipality Type"] === filter
                });

                var quintileScale = d3.scale.quantile()
                    .domain(SCALE_VALUES)
                    .range(d3.range(1,6));

                // join data to geojson
                var geoJoinedData = GEODATA.features.map(function(geo) {
                    var geoValue = filteredData.filter(function(o) {
                        return o["Municipality"] === geo.properties.NAME;
                    })
                    if (geoValue.length > 0) {
                        geo.properties.VALUE = geoValue.pop()["Equalized Net Grand List ($000s per capita)"];
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
                            var popupContent = [feature.properties.NAME, feature.properties.VALUE].join(": ")
                            layer.bindPopup(popupContent);
                        }*/

                        // If we want popup on all towns, but only give values for selected towns
                        var popupContent = feature.properties.NAME;
                        if (null !== feature.properties.VALUE) {
                            popupContent += ": "+feature.properties.VALUE;
                        }
                        layer.bindPopup(popupContent);

                        // If we want popup on all towns, regardless of selection,
                        //   we will need to modify this to look at the original DATA const,
                        //   not the filteredData/geoJoinedData
                        /*var popupContent = feature.properties.NAME;
                        if (null !== feature.properties.VALUE) {
                            popupContent += ": "+feature.properties.VALUE;
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

                /** Legend **/
                var quantiles = [d3.min(SCALE_VALUES)]
                    .concat(quintileScale.quantiles())
                    .concat([d3.max(SCALE_VALUES)]);

                var legendData = d3.range(0,5).map(function(i) {
                    return [Math.round(quantiles[i]), Math.round(quantiles[i+1])]
                })

                var legend = L.control({position: "bottomright"});
                legend.onAdd = function (map) {
                    var div = L.DomUtil.create("div", "legend");

                    var legendTitle = L.DomUtil.create("h3", "title", div),
                        legendSubTitle = L.DomUtil.create("h4", "subtitle", div);
                    legendTitle.innerHTML = "Equalized Net Grand List";
                    legendSubTitle.innerHTML = "($000s per capita)";
                    
                    // loop through our quantile intervals and generate a label with a colored square for each interval
                    for (var i = 0; i < legendData.length; i++) {
                        var entry = L.DomUtil.create("div", "entry", div);
                        entry.innerHTML = legendData[i].join(" - ");

                        var colorBlock = L.DomUtil.create("span", "color"+(i+1), entry)
                    }

                    return div;
                };
                legend.addTo(map);
                /** END Legend **/

                // console.log(filteredData)
                // console.log(filter)
                // console.log(DATA)
                // console.log(GEODATA)
            }

            drawChart()
        })
    })

})