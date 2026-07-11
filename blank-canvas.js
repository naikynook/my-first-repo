// blank-canvas.js
// D3 bar chart

function initFruitBarChart() {
  if (typeof d3 === "undefined") {
    document.getElementById("chart").innerHTML =
      "<p>Could not load D3.js. Check your internet connection and refresh the page.</p>";
    return;
  }

  const fruits = ["Apple", "Banana", "Orange", "Grape"];
  const counts = [5, 3, 7, 2];

  const chart = document.getElementById("chart");
  chart.innerHTML = "";

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", 400)
    .attr("height", 300);

  svg.selectAll("rect")
    .data(counts)
    .enter()
    .append("rect")
    .attr("x", (d, i) => i * 80 + 50)
    .attr("y", d => 250 - d * 20)
    .attr("width", 60)
    .attr("height", d => d * 20)
    .attr("fill", "steelblue");

  svg.selectAll("text")
    .data(fruits)
    .enter()
    .append("text")
    .attr("x", (d, i) => i * 80 + 80)
    .attr("y", 280)
    .attr("text-anchor", "middle")
    .attr("fill", "#111111")
    .text(d => d);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFruitBarChart);
} else {
  initFruitBarChart();
}
