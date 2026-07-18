// relational-chord.js
// Soft-palette D3 chord diagram of offender → victim race relationships
// Same three NYC shooting tables joined on INCIDENT_KEY

function initRelationalChord() {
  const container = document.getElementById("canvas-container-5");

  if (!container) {
    return;
  }

  if (typeof d3 === "undefined") {
    container.innerHTML =
      "<p>Could not load D3.js. Check your internet connection and refresh the page.</p>";
    return;
  }

  container.innerHTML = "<p>Loading related shooting datasets...</p>";

  Promise.all([
    d3.csv("Shootings_(2006-Present)_20260711.csv"),
    d3.csv("Shooting_Victims_(2006-Present)_20260716.csv"),
    d3.csv("Shooting_Offenders_(2006-Present)_20260716.csv")
  ]).then(function(files) {
    try {
      buildChord(container, files[0], files[1], files[2]);
    } catch (err) {
      console.error(err);
      container.innerHTML =
        "<p>Loaded the shooting CSVs, but the chord diagram failed to draw. Check the browser console for details.</p>";
    }
  }).catch(function(err) {
    console.error(err);
    container.innerHTML =
      "<p>Could not load the related shooting CSVs. Open this site through a local server so D3 can read the files.</p>";
  });
}

function buildChord(container, incidents, victims, offenders) {
  container.innerHTML = "";

  function clean(value) {
    const text = (value || "").trim();
    if (!text || text === "UNKNOWN" || text === "(null)") {
      return "Unknown";
    }
    return text;
  }

  function shortLabel(value) {
    return value
      .replace("ASIAN / PACIFIC ISLANDER", "Asian / PI")
      .replace("AMERICAN INDIAN/ALASKAN NATIVE", "AI / AN")
      .replace("WHITE HISPANIC", "White Hispanic")
      .replace("BLACK HISPANIC", "Black Hispanic");
  }

  const incidentKeys = new Set(incidents.map(function(d) { return d.INCIDENT_KEY; }));
  const victimsByKey = d3.group(victims, function(d) { return d.INCIDENT_KEY; });
  const offendersByKey = d3.group(offenders, function(d) { return d.INCIDENT_KEY; });

  const pairCounts = new Map();
  const pairMurders = new Map();
  const raceTotals = new Map();

  function bump(map, key, amount) {
    map.set(key, (map.get(key) || 0) + amount);
  }

  victimsByKey.forEach(function(victimRows, key) {
    if (!incidentKeys.has(key)) {
      return;
    }
    const offenderRows = offendersByKey.get(key);
    if (!offenderRows || !offenderRows.length) {
      return;
    }

    victimRows.forEach(function(victim) {
      const victimRace = shortLabel(clean(victim.VICTIM_RACE));
      const isMurder = victim.STAT_MURDER_FLG === "Y" ? 1 : 0;

      offenderRows.forEach(function(offender) {
        const offenderRace = shortLabel(clean(offender.PERP_RACE));
        const pairKey = offenderRace + "||" + victimRace;
        bump(pairCounts, pairKey, 1);
        bump(pairMurders, pairKey, isMurder);
        bump(raceTotals, offenderRace, 1);
        bump(raceTotals, victimRace, 1);
      });
    });
  });

  const names = Array.from(raceTotals.keys())
    .filter(function(name) { return (raceTotals.get(name) || 0) >= 30; })
    .sort(function(a, b) { return raceTotals.get(b) - raceTotals.get(a); });

  const index = new Map(names.map(function(name, i) { return [name, i]; }));
  const n = names.length;
  const matrix = Array.from({ length: n }, function() {
    return Array.from({ length: n }, function() { return 0; });
  });
  const murderMatrix = Array.from({ length: n }, function() {
    return Array.from({ length: n }, function() { return 0; });
  });

  pairCounts.forEach(function(count, key) {
    const parts = key.split("||");
    const source = index.get(parts[0]);
    const target = index.get(parts[1]);
    if (source == null || target == null) {
      return;
    }
    matrix[source][target] += count;
    murderMatrix[source][target] += pairMurders.get(key) || 0;
  });

  const palette = [
    "#FF88DC",
    "#0072BB",
    "#8FC93A",
    "#E4CC37",
    "#E18335"
  ];

  const color = d3.scaleOrdinal()
    .domain(names)
    .range(palette);

  const fontUi = '"Outfit", "DM Sans", sans-serif';
  const fontLabel = '"DM Sans", "Outfit", sans-serif';

  const width = Math.max(520, Math.min(640, container.parentElement
    ? container.parentElement.clientWidth - 24
    : 640));
  const height = Math.round(width * 1.02);
  const outerRadius = Math.min(width, height) * 0.30;
  const innerRadius = Math.max(outerRadius - 16, outerRadius * 0.72);

  const svg = d3.select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("cursor", "grab");

  svg.append("rect")
    .attr("class", "chord-zoom-bg")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "#0d0d0d")
    .attr("rx", 4);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 24)
    .attr("text-anchor", "middle")
    .attr("fill", "#eeeeee")
    .attr("font-size", 14)
    .attr("font-weight", 500)
    .attr("font-family", fontUi)
    .text("Offender race → Victim race · circular relations");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 16)
    .attr("text-anchor", "middle")
    .attr("fill", "#888888")
    .attr("font-size", 10)
    .attr("font-family", fontLabel)
    .text("Scroll to zoom · drag to pan · hover a group or chord for details");

  const zoomRoot = svg.append("g").attr("class", "chord-zoom-root");
  const g = zoomRoot.append("g")
    .attr("transform", "translate(" + (width / 2) + "," + (height / 2 + 2) + ")");

  const chord = d3.chord()
    .padAngle(0.04)
    .sortSubgroups(d3.descending)
    .sortChords(d3.descending);

  const chords = chord(matrix);
  const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
  const ribbon = d3.ribbon().radius(innerRadius - 2);

  const group = g.append("g")
    .selectAll("g")
    .data(chords.groups)
    .join("g");

  group.append("path")
    .attr("class", "chord-group")
    .attr("fill", function(d) { return color(names[d.index]); })
    .attr("stroke", "#0d0d0d")
    .attr("stroke-width", 1.5)
    .attr("d", arc)
    .append("title")
    .text(function(d) {
      const name = names[d.index];
      const outgoing = d3.sum(matrix[d.index]);
      const incoming = d3.sum(matrix, function(row) { return row[d.index]; });
      return name +
        "\nAs offender links: " + outgoing.toLocaleString() +
        "\nAs victim links: " + incoming.toLocaleString();
    });

  group.append("text")
    .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
    .attr("dy", "0.35em")
    .attr("transform", function(d) {
      return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")" +
        "translate(" + (outerRadius + 10) + ")" +
        (d.angle > Math.PI ? "rotate(180)" : "");
    })
    .attr("text-anchor", function(d) {
      return d.angle > Math.PI ? "end" : "start";
    })
    .attr("fill", "#f2f2f2")
    .attr("font-size", 11)
    .attr("font-weight", 500)
    .attr("font-family", fontLabel)
    .text(function(d) { return names[d.index]; });

  const ribbons = g.append("g")
    .attr("fill-opacity", 0.78)
    .selectAll("path")
    .data(chords)
    .join("path")
    .attr("class", "chord-ribbon")
    .attr("d", ribbon)
    .attr("fill", function(d) { return color(names[d.source.index]); })
    .attr("stroke", "rgba(0,0,0,0.35)")
    .attr("stroke-width", 0.5);

  ribbons.append("title")
    .text(function(d) {
      const from = names[d.source.index];
      const to = names[d.target.index];
      const count = matrix[d.source.index][d.target.index];
      const murders = murderMatrix[d.source.index][d.target.index];
      return from + " → " + to +
        "\n" + count.toLocaleString() + " co-occurrences" +
        "\n" + murders.toLocaleString() + " statistical murders" +
        (count ? " (" + d3.format(".0%")(murders / count) + ")" : "");
    });

  group.selectAll("path.chord-group")
    .on("mouseenter", function(event, d) {
      ribbons
        .transition()
        .duration(180)
        .attr("fill-opacity", function(r) {
          return r.source.index === d.index || r.target.index === d.index ? 0.9 : 0.08;
        });
    })
    .on("mouseleave", function() {
      ribbons
        .transition()
        .duration(220)
        .attr("fill-opacity", 0.72);
    });

  ribbons
    .on("mouseenter", function(event, d) {
      ribbons
        .transition()
        .duration(180)
        .attr("fill-opacity", function(r) {
          return r === d ? 0.95 : 0.08;
        });
    })
    .on("mouseleave", function() {
      ribbons
        .transition()
        .duration(220)
        .attr("fill-opacity", 0.72);
    });

  const key = svg.append("g")
    .attr("transform", "translate(24, " + (height - 52) + ")");

  key.append("text")
    .attr("fill", "#888888")
    .attr("font-size", 9)
    .attr("font-family", fontLabel)
    .text("Ribbon width = relationship volume");

  const zoom = d3.zoom()
    .scaleExtent([0.65, 4.5])
    .on("start", function() {
      svg.style("cursor", "grabbing");
    })
    .on("zoom", function(event) {
      zoomRoot.attr("transform", event.transform);
    })
    .on("end", function() {
      svg.style("cursor", "grab");
    });

  svg.call(zoom);
  // Stop the page from scrolling while zooming over the diagram
  svg.node().addEventListener("wheel", function(event) {
    event.preventDefault();
  }, { passive: false });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initRelationalChord);
} else {
  initRelationalChord();
}
