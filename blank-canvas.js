// blank-canvas.js
// D3 calendar heatmap of NYC shootings by day

function initShootingsCalendar() {
  const chart = document.getElementById("chart");

  if (typeof d3 === "undefined") {
    chart.innerHTML =
      "<p>Could not load D3.js. Check your internet connection and refresh the page.</p>";
    return;
  }

  chart.innerHTML = "<p>Loading shootings data...</p>";

  d3.csv("Shootings_(2006-Present)_20260711.csv").then(function(data) {
    chart.innerHTML = "";

    const parseDate = d3.timeParse("%m/%d/%Y");
    const shootingsByDay = new Map();

    data.forEach(function(row) {
      const date = parseDate(row.OCCUR_DATE);
      if (!date) {
        return;
      }

      const dayKey = +d3.timeDay.floor(date);
      shootingsByDay.set(dayKey, (shootingsByDay.get(dayKey) || 0) + 1);
    });

    const validDates = data
      .map(function(row) { return parseDate(row.OCCUR_DATE); })
      .filter(Boolean);

    const minYear = d3.min(validDates, function(d) { return d.getFullYear(); });
    const maxYear = d3.max(validDates, function(d) { return d.getFullYear(); });
    const years = d3.range(minYear, maxYear + 1);
    const maxCount = d3.max(Array.from(shootingsByDay.values())) || 1;

    const cellSize = 11;
    const yearLabelWidth = 36;
    const topMargin = 24;
    const width = yearLabelWidth + cellSize * 53 + 20;
    const height = topMargin + cellSize * years.length + 20;

    const color = d3.scaleSequential()
      .domain([0, maxCount])
      .interpolator(d3.interpolateYlOrRd);

    const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    svg.append("g")
      .attr("transform", "translate(" + yearLabelWidth + ", 0)")
      .selectAll("text")
      .data(months)
      .join("text")
      .attr("x", function(d, i) { return d3.timeWeek.count(d3.timeYear(new Date(2006, i, 1)), new Date(2006, i, 1)) * cellSize; })
      .attr("y", 14)
      .attr("font-size", 10)
      .attr("fill", "#666")
      .text(function(d) { return d; });

    const yearGroups = svg.selectAll("g.year")
      .data(years)
      .join("g")
      .attr("class", "year")
      .attr("transform", function(d, i) {
        return "translate(0," + (topMargin + i * cellSize) + ")";
      });

    yearGroups.append("text")
      .attr("x", 0)
      .attr("y", cellSize - 2)
      .attr("font-size", 10)
      .attr("fill", "#333")
      .text(function(d) { return d; });

    yearGroups.each(function(year) {
      const days = d3.timeDays(new Date(year, 0, 1), new Date(year + 1, 0, 1));

      d3.select(this)
        .append("g")
        .attr("transform", "translate(" + yearLabelWidth + ", 0)")
        .selectAll("rect")
        .data(days)
        .join("rect")
        .attr("width", cellSize - 1)
        .attr("height", cellSize - 1)
        .attr("x", function(d) { return d3.timeWeek.count(d3.timeYear(d), d) * cellSize; })
        .attr("y", 0)
        .attr("fill", function(d) {
          return color(shootingsByDay.get(+d3.timeDay.floor(d)) || 0);
        })
        .append("title")
        .text(function(d) {
          const count = shootingsByDay.get(+d3.timeDay.floor(d)) || 0;
          return d3.timeFormat("%B %d, %Y")(d) + ": " + count + " shooting" + (count === 1 ? "" : "s");
        });
    });

    const legendWidth = 160;
    const legendHeight = 10;

    const legend = svg.append("g")
      .attr("transform", "translate(" + yearLabelWidth + "," + (height - 14) + ")");

    const legendScale = d3.scaleLinear()
      .domain([0, maxCount])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(4)
      .tickSize(legendHeight);

    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "shootings-gradient")
      .attr("x1", "0%")
      .attr("x2", "100%");

    gradient.selectAll("stop")
      .data(d3.range(0, 1.01, 0.1))
      .join("stop")
      .attr("offset", function(d) { return d; })
      .attr("stop-color", function(d) { return color(d * maxCount); });

    legend.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#shootings-gradient)");

    legend.append("g")
      .attr("transform", "translate(0," + legendHeight + ")")
      .call(legendAxis)
      .selectAll("text")
      .attr("font-size", 9)
      .attr("fill", "#666");
  }).catch(function() {
    chart.innerHTML =
      "<p>Could not load shootings data. Open this site through a local server so D3 can read the CSV file.</p>";
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initShootingsCalendar);
} else {
  initShootingsCalendar();
}
