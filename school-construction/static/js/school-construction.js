$(document).ready(function(){
    // variables
    var pymChild = null;
    var aspect_ratio = (2 / 5); // H / W
    var mobile_threshold = 500;

    // we need this in a few places
    var dateFormat = d3.time.format("%Y");
    var numberFormat = d3.format(",d");
    var percentFormat = d3.format(",%");
    var currencyFormat = d3.format("$011,.0f");

    d3.csv("static/data/grant-totals.csv", function(data) {
        const DATA = [];
        data.forEach(function(r) {
            var keys = Object.keys(r);
            keys.forEach(function(k) {
                if (k == 'Grant') {

                } else {
                    DATA.push({Grant: 'School Construction', Year: k, 'Amount': +r[k]})
                }
            })
        });

        // Get the years from the data so that we can set the scales
        var years = DATA.map(function(d) { return d.Year; });

        // We want to pad the y-axis so that the values do not bump up to the edge of the graphic
        // We'll use 10% of the difference between the min and max
        var amount_range = d3.extent(
            DATA.map(function(v) { return v.Amount; })
        );
        var scale_padding = (amount_range[1] - amount_range[0]) * .1;
        amount_range[0] -= scale_padding;
        amount_range[1] += scale_padding;


        /** START container var **/
        var container = d3.select("div#chart");
        /** END container var **/

        function drawChart(container_width) {
            // When testing, pym.js has not yet passed in a container.
            // Testing for NaN lets us set a default
            if (isNaN(container_width )) {
                console.log('not iframed')
                container_width = container[0][0].clientWidth;
            }
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
                left: 0.08 * width
            }

            // check bottom/left for minimums
            if (container_width < mobile_threshold) {
                margin = {
                    top: 0.05 * height,
                    right: 0.12 * width,
                    bottom: 0.30 * height,
                    left: 0.2 * width
                }
            } else if (container_width < mobile_threshold * 1.5) {
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
            var x = d3.scale.ordinal()
                .domain(years)
                .rangePoints([0, width]);


            var y = d3.scale.linear()
                .range([height, 0])
                .domain(amount_range);

            // width of x scale "bands"
            var xBandWidth = x(years[1]) - x(years[0])
            var grantLine = d3.svg.line()
                .x(function(d) { return x(d.Year); })
                .y(function(d) { return y(d.Amount); });


            var chart = svg.append("g")
                .classed("chart", true)
                .attr("height", height)
                .attr("width", width)
                .attr("transform", "translate("+ margin.left + ", " + margin.top + ")");

            // axes
            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");


            //if (container_width < mobile_threshold) {
            //    xAxis
            //        .ticks(d3.time.year, 5)
            //        .tickFormat(d3.time.format("'%y"))
            //} else if (container_width < mobile_threshold * 2) {
            //    xAxis
            //        // .ticks(d3.time.year, 2)
            //        .tickFormat(d3.time.format("'%y"))
            //}

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .tickFormat(currencyFormat);

            if (container_width < mobile_threshold) {
                yAxis.ticks(5);
            }

            var xAxis = chart.append("g")
              .attr("class", "axis xaxis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis);

            var xAxisLabel = xAxis.append("text")
                .attr("dy", "-1em")
                .attr("dx", width)
                .style("text-anchor", "end")
                .text("Year");

            if (container_width < mobile_threshold) {
                xAxisLabel.attr("dy", "2.25em")
            }

            var yAxis = chart.append("g")
                  .attr("class", "axis yaxis")
                  .call(yAxis)

            var yAxisLabel = yAxis.append("text")
                  .attr("y", 6)
                  .attr("dy", "0.71em")
                  .attr("dx", "0.5em")
                  .text("Amount");

            if (container_width > mobile_threshold) {
                yAxisLabel
                    .attr("transform", "rotate(-90)")
                    .attr("dx", 0)
                    .style("text-anchor", "end")
            }  

              var lineGroup = chart.append("g");

              lineGroup.append("path")
                  .datum(DATA)
                  .classed({
                    "line" : true,
                    "corporation" : true
                  })
                  .attr("d", grantLine);


            var hoverGroups = chart.append("g")
                .selectAll("g")
                .data(DATA)
                .enter()
                    .append("g")
                    .attr("class", function(d){
                        return [
                            "hover-group",
                            "_"+d.Year
                        ].join(" ")
                    })
                    .attr("width", xBandWidth)
                    .attr("height", height)
                    .attr("data-year", function(d) {
                        return "_"+d.Year;
                    })
                    .attr("data-amount", function(d) {
                        return currencyFormat(d.Amount);
                    })
                    .datum(function(d) { return d; })

            var rectWidth = xBandWidth / 4;
            var labelContainer = d3.select("div#value-label");

            hoverGroups.each(function(pointData, i) {
                var yearClass = "_"+(pointData.Year);

                var group = d3.select(this);

                group.append("rect")
                    .classed("group-filler", true)
                    .attr("height", group.attr("height"))
                    .attr("width", function() {
                        // first and last bars are only half width
                        if (i === 0 || i == (hoverGroups.size() - 1)) {
                            return group.attr("width")/2
                        } else {
                            return group.attr("width");
                        }
                    })
                    .attr("x", function() {
                        if (i === 0) {
                            // first bar is only half width, not offset left
                            return x(pointData.Year);
                        } else {
                            return x(pointData.Year) - (xBandWidth/2)
                        }
                    })

                group.append("rect")
                    .classed("hover-line", true)
                    .attr("x", x(pointData.Year) - 2)
                    .attr("y", 0)
                    .attr("height", height)
                    .attr("width", 4)
            });


            //// register hover events for point groups
            hoverGroups
                .on("mouseover", function(){
                    //console.log(this);
                    var highlightClass = d3.select(this).attr("data-year");
                    var year = highlightClass.replace("_", "");
                    var amount = d3.select(this).attr("data-amount");
                    d3.select('#year-value').html(year);
                    d3.select('#amount-value').html(amount);
                    //d3.select("div#value-label")
                    //    .classed("highlight", false);

                    d3.selectAll("."+highlightClass)
                        .classed("highlight", true);
                })
                .on("mouseout", function(){
                    d3.selectAll(".highlight")
                        .classed("highlight", false);
                    d3.select('#year-value').html('&mdash;');
                    d3.select('#amount-value').html('&mdash;');
                })

        }

        pymChild = new pym.Child({ renderCallback: drawChart });
    });
});