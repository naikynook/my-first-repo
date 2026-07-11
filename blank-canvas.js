// blank-canvas.js
// D3 calendar heatmap of NYC shootings by day, animated by year

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

    const years = d3.range(
      d3.min(validDates, function(d) { return d.getFullYear(); }),
      d3.max(validDates, function(d) { return d.getFullYear(); }) + 1
    );

    const maxCount = d3.max(Array.from(shootingsByDay.values())) || 1;
    const cellSize = 14;
    const leftMargin = 28;
    const topMargin = 36;
    const width = leftMargin + cellSize * 53 + 16;
    const height = topMargin + cellSize * 7 + 36;
    const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const color = d3.scaleSequential()
      .domain([0, maxCount])
      .interpolator(function(t) {
        return d3.interpolateRgb("#3b82f6", "#ec4899")(t);
      });

    const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    const yearLabel = svg.append("text")
      .attr("x", width / 2)
      .attr("y", 16)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("fill", "#333");

    svg.append("g")
      .attr("transform", "translate(" + leftMargin + ", " + (topMargin - 8) + ")")
      .selectAll("text")
      .data(months)
      .join("text")
      .attr("x", function(d, i) {
        return d3.timeWeek.count(d3.timeYear(new Date(2006, i, 1)), new Date(2006, i, 1)) * cellSize;
      })
      .attr("y", 0)
      .attr("font-size", 9)
      .attr("fill", "#888")
      .text(function(d) { return d; });

    svg.append("g")
      .attr("transform", "translate(8, " + topMargin + ")")
      .selectAll("text")
      .data(dayLabels)
      .join("text")
      .attr("x", 0)
      .attr("y", function(d, i) { return i * cellSize + cellSize - 3; })
      .attr("font-size", 9)
      .attr("fill", "#888")
      .text(function(d) { return d; });

    const calendar = svg.append("g")
      .attr("transform", "translate(" + leftMargin + ", " + topMargin + ")");

    function daysInYear(year) {
      return d3.timeDays(new Date(year, 0, 1), new Date(year + 1, 0, 1));
    }

    let yearIndex = 0;

    function showYear(year) {
      yearLabel.text(year);

      calendar.selectAll("rect")
        .data(daysInYear(year), function(d) { return +d; })
        .join("rect")
        .attr("width", cellSize - 1)
        .attr("height", cellSize - 1)
        .attr("x", function(d) { return d3.timeWeek.count(d3.timeYear(d), d) * cellSize; })
        .attr("y", function(d) { return d.getDay() * cellSize; })
        .each(function(d) {
          const count = shootingsByDay.get(+d3.timeDay.floor(d)) || 0;
          const selection = d3.select(this);

          if (selection.select("title").empty()) {
            selection.append("title");
          }

          selection.select("title")
            .text(d3.timeFormat("%B %d, %Y")(d) + ": " + count + " shooting" + (count === 1 ? "" : "s"));
        })
        .transition()
        .duration(500)
        .attr("fill", function(d) {
          return color(shootingsByDay.get(+d3.timeDay.floor(d)) || 0);
        });
    }

    function advanceYear() {
      showYear(years[yearIndex]);
      yearIndex = (yearIndex + 1) % years.length;
    }

    showYear(years[0]);
    yearIndex = 1;
    setInterval(advanceYear, 2000);
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
