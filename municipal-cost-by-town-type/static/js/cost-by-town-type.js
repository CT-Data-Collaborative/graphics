$(document).ready(function(){
    d3.csv("/static/data/data-with-cogs.csv", function(data) {
        const DATA = data.map(function(o) {
            return {
                "Municipality" : o["Municipality"],
                "Planning Region" : o["Planning Region"],
                "Municipal Cost ($ per capita)" : parseInt(o["Municipal Cost ($ per capita)"])
            }
        });
        const SCALE_VALUES = DATA.map(function(o){
            return parseInt(o["Municipal Cost ($ per capita)"]);
        });

        d3.json("/static/data/town.geojson", function(error, geodata) {
            const GEODATA = geodata;

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

            // draw selector/options
            var checkboxes = d3.selectAll("div#options > div:first-child")
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
            // draw map
            var map = L.map("map", {
                zoomControl:false
            });

            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
            map.boxZoom.disable();
            map.keyboard.disable()

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

            function drawChart() {
                // clear previous map data
                if (undefined !== statesLayer) {
                    map.removeLayer(statesLayer);
                }

                // join data to geojson, color code etc according to filtering
                var geoJoinedData = GEODATA.features.map(function(geo) {
                    var geoValue = DATA.filter(function(o) {
                        return o["Municipality"] === geo.properties.NAME;
                    }).pop();
                        geo.properties.VALUE = geoValue["Municipal Cost ($ per capita)"];
                        geo.properties.COG = geoValue["Planning Region"];
                    if (filter.indexOf(geoValue["Planning Region"]) !== -1) {
                        // if this is one of the towns we're color coding
                        geo.properties.COLOR = "#ECECEC"
                        geo.properties.CLASS = "color"+quintileScale(geoValue["Municipal Cost ($ per capita)"])
                    } else {
                        // otherwise
                        geo.properties.COLOR = "#4A4A4A"
                        geo.properties.CLASS = "colornone"
                    }

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

                statesLayer = L.geoJson(geoJoinedData, {
                    style: colorize,
                    onEachFeature: function (feature, layer) {
                        var popupContent = ["<b>", "</b>"].join(feature.properties.NAME);
                        if (null !== feature.properties.VALUE) {
                            popupContent += "<br>"+feature.properties.COG;
                            popupContent += "<br>Cost: "+numberFormat(feature.properties.VALUE);
                        }
                        layer.bindPopup(popupContent);
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