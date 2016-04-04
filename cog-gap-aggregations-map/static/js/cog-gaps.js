$(document).ready(function(){
    d3.csv("static/data/agg-data.csv", function(data) {
        const DATA = data.map(function(o) {
            return {
                "Planning Region" : o["Planning Region"],
                "Municipal Cost" : parseInt(o["Municipal Cost"]),
                "Municipal Capacity" : parseInt(o["Municipal Capacity"]),
                "Municipal Gap" : parseInt(o["Municipal Gap"])
            }
        }).filter(function(o) {
            // We don't need a total in this map
            return o["Planning Region"] !== "Connecticut Total";
        });

        const SCALE_VALUES = DATA.map(function(o){
            return o["Municipal Gap"];
        });

        d3.json("static/data/cogs.geojson", function(error, geodata) {
            const GEODATA = geodata;

            console.log(GEODATA)

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

            var cogsLayer = L.geoJson(GEODATA.features, {});

            /** Legend **/
            var numberFormat = d3.format("$,.0f");

            var quintileScale = function(value) {
                // doing this manually
                if (value > 49512205) { return 1; }
                else if (value <= 49512205 && value >= 0) { return 2; }
                else if (value < 0 && value >= -40238773) { return 3; }
                else if (value < -40238773 && value >= -153193043) { return 4; }
                else if (value < -153193043) { return 5; }
            }

            var legendData = [
                [49512205, 779786634],
                [0, 49512205],
                [-40238773, 0],
                [-153193043, -40238773],
                [-347057370, -153193043]
            ].map(function(span) {
                return [numberFormat(span[0]), numberFormat(span[1])]
            })

            var legend = L.control({position: "bottomright"});
            legend.onAdd = function (map) {
                var div = L.DomUtil.create("div", "legend");

                var legendTitle = L.DomUtil.create("span", "title", div),
                    legendBreak = L.DomUtil.create("br", "", div);
                    legendSubTitle = L.DomUtil.create("span", "subtitle", div);
                legendTitle.innerHTML = "Fiscal Gap";
                // legendSubTitle.innerHTML = "2007-2011 Avg. in 2012 Dollars";
                
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

            function drawChart() {
                // clear previous map data
                if (undefined !== cogsLayer) {
                    map.removeLayer(cogsLayer);
                }

                // join data to geojson, color code etc according to filtering
                var geoJoinedData = GEODATA.features.map(function(geo) {
                        console.log(geo.properties.NAME)
                    var geoValue = DATA.filter(function(o) {
                        return o["Planning Region"] === geo.properties.NAME;
                    }).pop();

                    if (undefined === geoValue) {
                        return;
                    }                    
                    geo.properties.CAPACITY = geoValue["Municipal Capacity"];
                    geo.properties.COST = geoValue["Municipal Cost"];
                    geo.properties.GAP = geoValue["Municipal Gap"];
                    geo.properties.COG = geoValue["Planning Region"];
                    // if this is one of the towns we're color coding
                    geo.properties.COLOR = "#ECECEC"
                    geo.properties.CLASS = "color"+quintileScale(geoValue["Municipal Gap"])

                    return geo;
                })

                function colorize(t) {
                    return {
                        fillColor: "black",
                        fillOpacity: 1,
                        color: t.properties.COLOR,
                        weight: 1,
                        className: t.properties.CLASS
                    };
                }

                cogsLayer = L.geoJson(geoJoinedData, {
                    style: colorize,
                    onEachFeature: function (feature, layer) {
                        var popupContent = ["<b>", "</b>"].join(feature.properties.NAME);
                        popupContent += "<br>Capacity: "+numberFormat(feature.properties.CAPACITY);
                        popupContent += "<br>Cost: "+numberFormat(feature.properties.COST);
                        // popupContent += "<br>Gap: "+numberFormat(feature.properties.GAP);
                        if (feature.properties.GAP < 0) {
                            popupContent += "<br>Deficit: "+numberFormat(feature.properties.GAP);;
                        } else {
                            popupContent += "<br>Surplus: "+numberFormat(feature.properties.GAP);;
                        }
                        layer.bindPopup(popupContent);
                    }
                }).addTo(map);

                // IF WE WANT TO ADD THESE POPUPS ON MOUSEOVER/OUT INSTEAD OF JUST CLICK
                /*cogsLayer.getLayers().forEach(function(geo) {
                    geo.on("mouseover", function(e) { this.openPopup(); })
                    geo.on("mouseout", function(e) { this.closePopup(); })
                })*/

                map.fitBounds(cogsLayer.getBounds());

                // console.log(filteredData)
                // console.log(filter)
                // console.log(DATA)
                // console.log(GEODATA)
            }

            drawChart()

            $(window).on('resize', drawChart);
        })
    })
})