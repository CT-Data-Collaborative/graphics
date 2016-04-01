$(document).ready(function(){
    // variables
    var pymChild = null;
    var aspect_ratio = (2 / 5); // H / W
    var mobile_threshold = 500;

    // we need this in a few places
    var dateFormat = d3.time.format("%Y");
    var numberFormat = d3.format(",d");

    // recession start/end dates
    var recessionFormat = d3.time.format("%Y-%m-%d");
    var recessions = [
        {
            start : recessionFormat.parse("1980-01-01"),
            end : recessionFormat.parse("1980-07-31")
        },{
            start : recessionFormat.parse("1981-06-01"),
            end : recessionFormat.parse("1982-11-30")
        },{
            start : recessionFormat.parse("1990-07-01"),
            end : recessionFormat.parse("1991-03-31")
        },{
            start : recessionFormat.parse("2001-03-01"),
            end : recessionFormat.parse("2001-12-30")
        },{
            start : recessionFormat.parse("2007-12-01"),
            end : recessionFormat.parse("2009-06-30")
        }
    ];

    d3.csv("static/data/formations-and-dissolutions.csv", function(data) {
        const DATA = data.map(function(o) {
            return {
                "Year" : dateFormat.parse(o.Year),
                "Dissolutions" : parseInt(o.Dissolutions),
                "Formations" : parseInt(o.Formations)
            }
        });

        /** START Legend **/
        /** END Legend **/

        /** START container var **/
        var container = d3.select("div#chart");
        /** END container var **/

        function drawChart(container_width) {
            console.log(container_width)

            // remove existing graphics
            container.selectAll("svg").remove();
            d3.selectAll("p.value").remove();

            // vars
            var height = container_width * aspect_ratio;
            var width = container_width;

            var margin = {
                top: 0.05 * height,
                right: 0.12 * width,
                bottom: 0.1 * height,
                left: 0.07 * width
            }

            // check bottom/left for minimums
            if (container_width < mobile_threshold) {
                margin = {
                    top: 0.05 * height,
                    right: 0.12 * width,
                    bottom: 0.18 * height,
                    left: 0.2 * width
                }
            } else if (container_width < mobile_threshold * 2) {
                margin = {
                    top: 0.05 * height,
                    right: 0.12 * width,
                    bottom: 0.1 * height,
                    left: 0.12 * width
                }
            }

            // svg container
            var svg = container.append("svg")
                .attr("height", height)
                .attr("width", width);

            // take margins off of height and width
            height = (height-(margin.top + margin.bottom));
            width = (width-(margin.left + margin.right));

            // Scales
            var x = d3.time.scale()
                .range([0, width])
                .domain(d3.extent(DATA, function(d) { return d.Year; }));

            var y = d3.scale.linear()
                .range([height, 0])
                .domain(
                    d3.extent(
                        DATA.map(function(v) { return v.Formations; }).concat(DATA.map(function(v) { return v.Dissolutions; }))
                    )
                )

            // width of x scale "bands"
            var xBandWidth = x(dateFormat.parse("1981")) - x(dateFormat.parse("1980"))

            var formationLine = d3.svg.line()
                .x(function(d) { return x(d.Year); })
                .y(function(d) { return y(d.Formations); });

            var dissolutionLine = d3.svg.line()
                .x(function(d) { return x(d.Year); })
                .y(function(d) { return y(d.Dissolutions); });

            var chart = svg.append("g")
                .classed("chart", true)
                .attr("height", height)
                .attr("width", width)
                .attr("transform", "translate("+ margin.left + ", " + margin.top + ")");

            // first add recession markers
            var recessionGroup = chart.append("g");

            recessions.forEach(function(r) {
              recessionGroup.append("rect")
                  .classed("recession", true)
                  .attr("x", x(r.start))
                  .attr("y", 0)
                  .attr("height", height)
                  .attr("width", x(r.end) - x(r.start))
            })

            // axes
            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .ticks(d3.time.year, 2);

            if (container_width < mobile_threshold) {
                xAxis
                    .ticks(d3.time.year, 5)
                    .tickFormat(d3.time.format("'%y"))
            } else if (container_width < mobile_threshold * 2) {
                xAxis
                    // .ticks(d3.time.year, 2)
                    .tickFormat(d3.time.format("'%y"))
            }

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            chart.append("g")
              .attr("class", "axis xaxis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis)
              .append("text")
                .attr("dy", -6)
                .attr("dx", width)
                .style("text-anchor", "end")
                .text("Year");

              chart.append("g")
                  .attr("class", "axis yaxis")
                  .call(yAxis)
                .append("text")
                  .attr("transform", "rotate(-90)")
                  .attr("y", 6)
                  .attr("dy", ".71em")
                  .style("text-anchor", "end")
                  .text("Filings");

              var lineGroup = chart.append("g");

              lineGroup.append("path")
                  .datum(DATA)
                  .classed({
                    "line" : true,
                    "formation" : true
                  })
                  .attr("d", formationLine);

              lineGroup.append("path")
                  .datum(DATA)
                  .classed({
                    "line" : true,
                    "dissolution" : true
                  })
                  .attr("d", dissolutionLine);

            var hoverGroups = chart.append("g")
                .selectAll("g")
                .data(DATA)
                .enter()
                    .append("g")
                    .classed("hover-group", true)
                    .attr("width", xBandWidth)
                    .attr("height", height)
                    .attr("data-year", function(d) {
                        return yearClass = "_"+dateFormat(d.Year);
                    })
                    .datum(function(d) { return d; })

            var rectWidth = (x(dateFormat.parse("2001")) - x(dateFormat.parse("2000"))) / 4;
            var labelContainer = d3.select("div#value-label")
            hoverGroups.each(function(pointData, i) {
                // console.log(pointData);

                var group = d3.select(this);

                group.append("rect")
                    .attr("height", group.attr("height"))
                    .attr("width", group.attr("width"))
                    .attr("x", x(pointData.Year) - (xBandWidth/2))
                    .attr("fill", "rgba(0,0,0,0)")
                    .attr("stroke", "red")
                    .attr("stroke-width", "1px")

                var yearClass = "_"+dateFormat(pointData.Year);

                group.append("rect")
                    .classed("hover-line", true)
                    // .attr("data-year", yearClass)
                    // .attr("class", function() {
                    //     return [
                    //         "hover-line",
                    //         yearClass
                    //     ].join(" ")
                    // })
                    .attr("x", x(pointData.Year) - 2)
                    // .attr("y", y(pointData.Formations))
                    // .attr("height", height - y(pointData.Formations))
                    .attr("y", 0)
                    .attr("height", height)
                    .attr("width", 4)

                group.append("path")
                    .classed("point", true)
                    // .attr("data-year", yearClass)
                    // .attr("class", function() {
                    //     return [
                    //         "point",
                    //         yearClass,
                    //         "formation"
                    //     ].join(" ");
                    // })
                    .attr("d", d3.svg.symbol().type("circle").size(50))
                    .attr("transform", function(d) { return "translate(" + x(pointData.Year) + ", " + y(pointData.Formations) +")";})

                group.append("path")
                    .classed("point", true)
                    // .attr("data-year", yearClass)
                    // .attr("class", function() {
                    //     return [
                    //         "point",
                    //         yearClass,
                    //         "dissolution"
                    //     ].join(" ");
                    // })
                    .attr("d", d3.svg.symbol().type("circle").size(50))
                    .attr("transform", function(d) { return "translate(" + x(pointData.Year) + ", " + y(pointData.Dissolutions) +")";})

                // value label text
                labelContainer.append("p")
                    .attr("class", function() {
                        return [
                            "value",
                            yearClass
                        ].join(" ");
                    })
                    .text(dateFormat(pointData.Year));

                labelContainer.append("p")
                    .attr("class", function() {
                        return [
                            "value",
                            yearClass
                        ].join(" ");
                    })
                    .text(function(){
                        return [
                            "Formations:",
                            numberFormat(pointData.Formations)
                        ].join(" ");
                    })

                labelContainer.append("p")
                    .attr("class", function() {
                        return [
                            "value",
                            yearClass
                        ].join(" ");
                    })
                    .text(function(){
                        return [
                            "Dissolutions:",
                            numberFormat(pointData.Dissolutions)
                        ].join(" ");
                    })
            })

            // register hover events for point groups
            // hoverGroups.selectAll("line.hover-line, path.point")
            // hoverGroups.selectAll("rect.hover-line, path.point")
            hoverGroups
                .on("mouseover", function(){
                    var highlightClass = d3.select(this).attr("data-year");

                    d3.select("div#value-label")
                        .classed("highlight", true);

                    d3.selectAll("."+highlightClass)
                        .classed("highlight", true);
                })
                .on("mouseout", function(){
                    d3.selectAll(".highlight")
                        .classed("highlight", false);
                })

            // console.log(DATA);
        }

        pymChild = new pym.Child({ renderCallback: drawChart });
    });
});