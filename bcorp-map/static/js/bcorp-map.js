$(document).ready(function(){
    d3.json("static/data/data.json", function(data) {
        // d3.select("#map")
        // .append("pre")
        //     .text(JSON.stringify(data, null, 4))

        // return;

        const DATA = data;

        d3.json("static/data/town.geojson", function(error, geodata) {
            const GEODATA = geodata;

            // draw map
            var map = L.map("map", {
                // zoomControl: false
            });

            map.attributionControl.setPrefix('<a href="http://ctdata.org">CTData.org</a>');

            // map.dragging.disable();
            // map.touchZoom.disable();
            // map.doubleClickZoom.disable();
            // map.scrollWheelZoom.disable();
            map.boxZoom.disable();
            map.keyboard.disable()

            var tileLayer = new L.tileLayer(
                "http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
                {
                    attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ"
                })
                .addTo(map);

            var townLayer = L.geoJson(GEODATA.features, {});
            var markers = L.layerGroup();

            function drawChart() {
                // clear previous map data
                if (undefined !== townLayer) {
                    map.removeLayer(townLayer);
                }
                if (undefined !== markers) {
                    map.removeLayer(markers);
                }

                townLayer = L.geoJson(GEODATA, {
                    style: {className : "town"}
                }).addTo(map);

                map.fitBounds(townLayer.getBounds());


                var mapMarker = L.divIcon({
                    className : "map-marker",
                    iconAnchor : [10, 20],
                    html : "<i class=\"fa fa-map-pin\"></i>"
                })

                DATA.filter(function(marker) {
                    return (marker.address !== false && marker.address.geocode !== false)
                })
                .forEach(function(marker, mi, ma) {
                    /**
                     * NAME
                     * Formed as <type> on <date>
                     * Organized on <date> // No articles of organization
                     * [Converted to BCorp on <date>]
                     */
                    var popupText = [
                        marker.name,
                        "Listed at " + marker.address.type + " address",
                        "Formed as " + marker.formation.type + " on " + marker.formation.date
                    ];

                    if (marker.organization !== false) {
                        popupText.push("Organized on " + marker.organization.date);
                    } else {
                        popupText.push("No articles of Organization");
                    }

                    if (marker.conversion !== false) {
                        popupText.push("Converted to Benefit Corp on " + marker.conversion.date);
                    }

                    popupText = popupText.join("<br />");

                    marker = L.marker(
                        [marker.address.geocode[0], marker.address.geocode[1]],
                        {icon: mapMarker}
                    )
                    .bindPopup(popupText)
                    .addTo(markers);
                })

                markers.addTo(map);
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