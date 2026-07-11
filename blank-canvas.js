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

    const aspect = 16 / 9;
    const topMargin = 28;
    const bottomMargin = 28;
    const sideMargin = 12;
    const cellGap = 0;
    const legendBarHeight = 8;
    const legendGap = 10;
    const maxDays = 366;

    const scale = 0.95;
    const panelWidth = Math.min(1100, window.innerWidth - 48) * scale;
    const panelHeight = panelWidth / aspect;

    const colorInterpolators = [
      d3.interpolateYlOrRd,
      d3.interpolateYlGnBu,
      d3.interpolatePlasma,
      d3.interpolateTurbo,
      d3.interpolateMagma,
      d3.interpolateInferno,
      d3.interpolateRdPu,
      d3.interpolatePuBu,
      d3.interpolateGnBu,
      d3.interpolateOrRd,
      d3.interpolateYlOrBr,
      d3.interpolateViridis
    ];

    function daysInYear(year) {
      return d3.timeDays(new Date(year, 0, 1), new Date(year + 1, 0, 1));
    }

    function gridDimensions(dayCount) {
      let best = { cols: 1, rows: dayCount, score: Infinity };

      for (let rows = 1; rows <= dayCount; rows++) {
        const cols = Math.ceil(dayCount / rows);
        const score = Math.abs(cols / rows - aspect);

        if (score < best.score) {
          best = { cols: cols, rows: rows, score: score };
        }
      }

      return best;
    }

    const grid = gridDimensions(maxDays);
    const gridAreaWidth = panelWidth - sideMargin * 2;
    const gridAreaHeight = panelHeight - topMargin - bottomMargin;
    const cellWidth = gridAreaWidth / grid.cols;
    const cellHeight = gridAreaHeight / grid.rows;
    const legendWidth = Math.round(panelWidth * 0.22);

    function getYearStats(year) {
      const days = daysInYear(year);
      const yearMax = d3.max(days, function(d) {
        return shootingsByDay.get(+d3.timeDay.floor(d)) || 0;
      }) || 1;

      return { days: days, yearMax: yearMax };
    }

    function colorForYear(year, paletteIndex) {
      const stats = getYearStats(year);

      return {
        color: d3.scaleSequentialSqrt()
          .domain([0, stats.yearMax])
          .interpolator(colorInterpolators[paletteIndex % colorInterpolators.length]),
        yearMax: stats.yearMax
      };
    }

    const svg = d3.select("#chart")
      .append("svg")
      .attr("width", panelWidth)
      .attr("height", panelHeight)
      .attr("viewBox", [0, 0, panelWidth, panelHeight])
      .attr("preserveAspectRatio", "xMidYMid meet");

    svg.append("rect")
      .attr("width", panelWidth)
      .attr("height", panelHeight)
      .attr("fill", "#fafafa")
      .attr("stroke", "#e8e8e8");

    const legendGradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "year-legend-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    const calendar = svg.append("g");

    const yearLabel = svg.append("text")
      .attr("x", panelWidth / 2)
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .attr("fill", "#333");

    const legend = svg.append("g")
      .attr("transform", "translate(" + (panelWidth - legendWidth) / 2 + ", " + (panelHeight - legendBarHeight - 10) + ")");

    legend.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendBarHeight)
      .attr("rx", 2)
      .attr("fill", "url(#year-legend-gradient)");

    let displayedYearIndex = 0;
    const yearInterval = 900;

    function updateLegend(colorScale, yearMax) {
      legendGradient.selectAll("stop")
        .data(d3.range(0, 1.01, 0.1))
        .join("stop")
        .attr("offset", function(d) { return d; })
        .attr("stop-color", function(d) { return colorScale(d * yearMax); });
    }

    function cellFill(yearColor, date) {
      const count = shootingsByDay.get(+d3.timeDay.floor(date)) || 0;
      return yearColor.color(count);
    }

    function showYear(index) {
      const year = years[index];
      const yearColor = colorForYear(year, index % colorInterpolators.length);

      yearLabel.text(year);
      updateLegend(yearColor.color, yearColor.yearMax);

      calendar.selectAll("rect")
        .data(daysInYear(year), function(d, i) { return i; })
        .join(
          function(enter) {
            return enter.append("rect")
              .attr("width", cellWidth)
              .attr("height", cellHeight);
          },
          function(update) { return update; },
          function(exit) { return exit.remove(); }
        )
        .attr("width", cellWidth)
        .attr("height", cellHeight)
        .attr("x", function(d, i) {
          return sideMargin + (i % grid.cols) * cellWidth;
        })
        .attr("y", function(d, i) {
          return topMargin + Math.floor(i / grid.cols) * cellHeight;
        })
        .attr("fill", function(d) { return cellFill(yearColor, d); })
        .each(function(d) {
          const count = shootingsByDay.get(+d3.timeDay.floor(d)) || 0;
          const selection = d3.select(this);

          if (selection.select("title").empty()) {
            selection.append("title");
          }

          selection.select("title")
            .text(d3.timeFormat("%B %d, %Y")(d) + ": " + count + " shooting" + (count === 1 ? "" : "s"));
        });

      displayedYearIndex = index;
    }

    function advanceYear() {
      const nextIndex = (displayedYearIndex + 1) % years.length;
      showYear(nextIndex);
    }

    showYear(0);
    setInterval(advanceYear, yearInterval);
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
