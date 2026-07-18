// relational-structures.js
// D3 relational network of NYC shootings, victims, and offenders (2006–Present)
// Three Open Data tables joined on INCIDENT_KEY

function initRelationalStructures() {
  const container = document.getElementById("canvas-container-4");

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
    buildVisualization(container, files[0], files[1], files[2]);
  }).catch(function() {
    container.innerHTML =
      "<p>Could not load the related shooting CSVs. Open this site through a local server so D3 can read the files.</p>";
  });
}

function buildVisualization(container, incidents, victims, offenders) {
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
      .replace("BLACK HISPANIC", "Black Hispanic")
      .replace("STATEN ISLAND", "Staten Island");
  }

  const incidentByKey = new Map();
  incidents.forEach(function(row) {
    incidentByKey.set(row.INCIDENT_KEY, { boro: clean(row.BORO) });
  });

  const victimsByKey = d3.group(victims, function(d) { return d.INCIDENT_KEY; });
  const offendersByKey = d3.group(offenders, function(d) { return d.INCIDENT_KEY; });

  const nodeMap = new Map();
  const linkMap = new Map();

  function ensureNode(id, type, label) {
    if (!nodeMap.has(id)) {
      nodeMap.set(id, {
        id: id,
        type: type,
        label: label,
        count: 0,
        murders: 0,
        victims: 0
      });
    }
    return nodeMap.get(id);
  }

  function bumpLink(source, target, amount, murders) {
    const key = source + "||" + target;
    if (!linkMap.has(key)) {
      linkMap.set(key, {
        source: source,
        target: target,
        count: 0,
        murders: 0
      });
    }
    const link = linkMap.get(key);
    link.count += amount;
    link.murders += murders;
  }

  let murderVictimRows = 0;
  let pairedIncidents = 0;

  victimsByKey.forEach(function(victimRows, key) {
    const incident = incidentByKey.get(key);
    const offenderRows = offendersByKey.get(key);
    if (!incident || !offenderRows || !offenderRows.length) {
      return;
    }

    pairedIncidents += 1;

    const boroId = "boro:" + incident.boro;
    const boroNode = ensureNode(boroId, "borough", shortLabel(incident.boro));
    boroNode.count += 1;
    boroNode.victims += victimRows.length;

    const murderInIncident = victimRows.reduce(function(sum, victim) {
      return sum + (victim.STAT_MURDER_FLG === "Y" ? 1 : 0);
    }, 0);
    boroNode.murders += murderInIncident;
    murderVictimRows += murderInIncident;

    victimRows.forEach(function(victim) {
      const race = clean(victim.VICTIM_RACE);
      const isMurder = victim.STAT_MURDER_FLG === "Y" ? 1 : 0;
      const victimId = "victim:" + race;
      const victimNode = ensureNode(victimId, "victim", shortLabel(race));
      victimNode.count += 1;
      victimNode.murders += isMurder;

      bumpLink(boroId, victimId, 1, isMurder);

      offenderRows.forEach(function(offender) {
        const offenderRace = clean(offender.PERP_RACE);
        const offenderId = "offender:" + offenderRace;
        ensureNode(offenderId, "offender", shortLabel(offenderRace));
        bumpLink(offenderId, boroId, 1, isMurder);
        bumpLink(offenderId, victimId, 1, isMurder);
      });
    });

    // Count each offender once per incident for node size;
    // count murder-linked incidents once per offender race in that incident
    const seenOffenderRaces = new Set();
    const seenMurderOffenderRaces = new Set();
    offenderRows.forEach(function(offender) {
      const offenderRace = clean(offender.PERP_RACE);
      const offenderId = "offender:" + offenderRace;
      const offenderNode = ensureNode(offenderId, "offender", shortLabel(offenderRace));

      if (!seenOffenderRaces.has(offenderId)) {
        seenOffenderRaces.add(offenderId);
        offenderNode.count += 1;
      }

      if (murderInIncident > 0 && !seenMurderOffenderRaces.has(offenderId)) {
        seenMurderOffenderRaces.add(offenderId);
        offenderNode.murders += 1;
      }
    });
  });

  const minNodeCount = 10;
  const nodes = Array.from(nodeMap.values()).filter(function(node) {
    return node.count >= minNodeCount;
  });
  const nodeIds = new Set(nodes.map(function(d) { return d.id; }));

  const allLinks = Array.from(linkMap.values()).filter(function(link) {
    return nodeIds.has(link.source) && nodeIds.has(link.target) && link.count >= 1;
  });

  const flowLinks = allLinks.filter(function(link) {
    const offenderToBoro = link.source.indexOf("offender:") === 0 && link.target.indexOf("boro:") === 0;
    const boroToVictim = link.source.indexOf("boro:") === 0 && link.target.indexOf("victim:") === 0;
    return offenderToBoro || boroToVictim;
  });

  const racePairLinks = allLinks
    .filter(function(link) {
      return link.source.indexOf("offender:") === 0 && link.target.indexOf("victim:") === 0;
    })
    .sort(function(a, b) { return b.count - a.count; });

  const topRacePair = racePairLinks[0];
  const deadliestBorough = nodes
    .filter(function(d) { return d.type === "borough"; })
    .slice()
    .sort(function(a, b) {
      const aRate = a.victims ? a.murders / a.victims : 0;
      const bRate = b.victims ? b.murders / b.victims : 0;
      return bRate - aRate || b.count - a.count;
    })[0];

  const width = Math.min(1000, container.clientWidth || 1000);
  const height = Math.round(width / (16 / 9));

  const svg = d3.select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("preserveAspectRatio", "xMidYMid meet");

  svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "#0d0d0d");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 24)
    .attr("text-anchor", "middle")
    .attr("fill", "#f2f2f2")
    .attr("font-size", 14)
    .attr("font-family", "Roboto, sans-serif")
    .text("NYC Shootings · Offenders → Boroughs → Victims (2006–Present)");

  svg.append("text")
    .attr("x", 24)
    .attr("y", height - 28)
    .attr("fill", "#9a9a9a")
    .attr("font-size", 10)
    .attr("font-family", "Roboto, sans-serif")
    .text(
      incidents.length.toLocaleString() + " incidents · " +
      victims.length.toLocaleString() + " victims · " +
      offenders.length.toLocaleString() + " offenders · " +
      murderVictimRows.toLocaleString() + " statistical murders · " +
      pairedIncidents.toLocaleString() + " incidents with both victim + offender records"
    );

  svg.append("text")
    .attr("x", 24)
    .attr("y", height - 12)
    .attr("fill", "#9a9a9a")
    .attr("font-size", 10)
    .attr("font-family", "Roboto, sans-serif")
    .text(
      (topRacePair
        ? "Strongest offender→victim race pair: " +
          shortLabel(topRacePair.source.replace("offender:", "")) +
          " → " +
          shortLabel(topRacePair.target.replace("victim:", "")) +
          " (" + topRacePair.count.toLocaleString() + " co-occurrences). "
        : "") +
      (deadliestBorough
        ? "Highest murder share among boroughs: " + deadliestBorough.label +
          " (" + d3.format(".0%")(deadliestBorough.murders / deadliestBorough.victims) + " of linked victims)."
        : "")
    );

  const columnX = {
    offender: width * 0.18,
    borough: width * 0.50,
    victim: width * 0.82
  };

  const typeColor = {
    offender: "#6ec6ff",
    borough: "#f5f5f5",
    victim: "#ff8a65"
  };

  const radius = d3.scaleSqrt()
    .domain([0, d3.max(nodes, function(d) { return d.count; })])
    .range([6, 28]);

  const linkWidth = d3.scaleSqrt()
    .domain([0, d3.max(flowLinks, function(d) { return d.count; }) || 1])
    .range([0.6, 10]);

  const severityColor = d3.scaleSequential()
    .domain([0, 0.35])
    .interpolator(d3.interpolateRgb("#4a5560", "#e53935"));

  const graphNodes = nodes.map(function(d) {
    return Object.assign({}, d);
  });

  const graphLinks = flowLinks.map(function(d) {
    return {
      source: d.source,
      target: d.target,
      count: d.count,
      murders: d.murders,
      murderRate: d.count ? d.murders / d.count : 0
    };
  });

  let sorting = false;
  let sortedMode = false;

  const controls = d3.select(container)
    .insert("div", "svg")
    .attr("class", "relational-controls");

  const sortButton = controls.append("button")
    .attr("type", "button")
    .text("Auto sort")
    .on("click", function(event) {
      event.preventDefault();
      if (sorting) {
        return;
      }
      if (sortedMode) {
        jumbleNodes();
      } else {
        autoSortNodes();
      }
    });

  controls.append("span")
    .attr("class", "relational-controls-note")
    .text("Toggle between sorted columns and the jumbled force layout");

  const simulation = d3.forceSimulation(graphNodes)
    .force("link", d3.forceLink(graphLinks)
      .id(function(d) { return d.id; })
      .distance(95)
      .strength(0.4))
    .force("charge", d3.forceManyBody().strength(-240))
    .force("collide", d3.forceCollide().radius(function(d) {
      return radius(d.count) + 10;
    }))
    .force("x", d3.forceX(function(d) {
      return columnX[d.type];
    }).strength(0.9))
    .force("y", d3.forceY(height / 2 - 6).strength(0.06));

  const g = svg.append("g");

  const link = g.append("g")
    .attr("stroke-opacity", 0.8)
    .selectAll("line")
    .data(graphLinks)
    .join("line")
    .attr("stroke", function(d) { return severityColor(d.murderRate); })
    .attr("stroke-width", function(d) { return linkWidth(d.count); });

  link.append("title")
    .text(function(d) {
      return d.count.toLocaleString() + " linked records\n" +
        "Murder-weighted share: " + d3.format(".0%")(d.murderRate);
    });

  const node = g.append("g")
    .selectAll("g")
    .data(graphNodes)
    .join("g")
    .call(d3.drag()
      .on("start", function(event, d) {
        if (sorting) {
          return;
        }
        if (!event.active) {
          simulation.alphaTarget(0.25).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", function(event, d) {
        if (sorting) {
          return;
        }
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", function(event, d) {
        if (sorting) {
          return;
        }
        if (!event.active) {
          simulation.alphaTarget(0);
        }
        d.fx = columnX[d.type];
        d.fy = null;
      }));

  node.append("circle")
    .attr("r", function(d) { return radius(d.count); })
    .attr("fill", function(d) { return typeColor[d.type]; })
    .attr("stroke", function(d) {
      return d.type === "victim" && d.count && d.murders / d.count > 0.2 ? "#e53935" : "#111";
    })
    .attr("stroke-width", function(d) {
      return d.type === "victim" && d.count && d.murders / d.count > 0.2 ? 2.5 : 1;
    });

  node.append("text")
    .text(function(d) { return d.label; })
    .attr("x", function(d) {
      if (d.type === "offender") {
        return -(radius(d.count) + 6);
      }
      if (d.type === "victim") {
        return radius(d.count) + 6;
      }
      return 0;
    })
    .attr("y", 3)
    .attr("text-anchor", function(d) {
      if (d.type === "offender") {
        return "end";
      }
      if (d.type === "victim") {
        return "start";
      }
      return "middle";
    })
    .attr("fill", "#dddddd")
    .attr("font-size", 10)
    .attr("font-family", "Roboto, sans-serif")
    .attr("paint-order", "stroke")
    .attr("stroke", function(d) {
      return d.type === "borough" ? "#000000" : "none";
    })
    .attr("stroke-width", function(d) {
      return d.type === "borough" ? 1 : 0;
    })
    .attr("stroke-linejoin", "round")
    .attr("pointer-events", "none");

  node.append("title")
    .text(function(d) {
      if (d.type === "borough") {
        return d.label +
          "\nPaired incidents: " + d.count.toLocaleString() +
          "\nLinked victims: " + d.victims.toLocaleString() +
          "\nStatistical murders: " + d.murders.toLocaleString() +
          (d.victims ? " (" + d3.format(".0%")(d.murders / d.victims) + ")" : "");
      }

      if (d.type === "offender") {
        return d.label +
          "\nType: offender" +
          "\nIncidents: " + d.count.toLocaleString() +
          "\nIncidents resulting in murder: " + d.murders.toLocaleString() +
          (d.count ? " (" + d3.format(".0%")(d.murders / d.count) + ")" : "");
      }

      if (d.type === "victim") {
        return d.label +
          "\nType: victim" +
          "\nCount: " + d.count.toLocaleString() +
          "\nStatistical murders: " + d.murders.toLocaleString() +
          (d.count ? " (" + d3.format(".0%")(d.murders / d.count) + ")" : "");
      }

      return d.label + "\nType: " + d.type + "\nCount: " + d.count.toLocaleString();
    });

  [
    { x: columnX.offender, text: "Offenders" },
    { x: columnX.borough, text: "Boroughs" },
    { x: columnX.victim, text: "Victims" }
  ].forEach(function(item) {
    svg.append("text")
      .attr("x", item.x)
      .attr("y", 44)
      .attr("text-anchor", "middle")
      .attr("fill", "#888")
      .attr("font-size", 11)
      .attr("font-family", "Roboto, sans-serif")
      .text(item.text);
  });

  const legend = svg.append("g")
    .attr("transform", "translate(" + (width - 220) + ", " + (height - 54) + ")");

  legend.append("text")
    .attr("fill", "#bbbbbb")
    .attr("font-size", 10)
    .attr("font-family", "Roboto, sans-serif")
    .text("Link color = murder severity");

  legend.selectAll("rect")
    .data(d3.range(0, 1.01, 0.1))
    .join("rect")
    .attr("x", function(d, i) { return i * 12; })
    .attr("y", 8)
    .attr("width", 12)
    .attr("height", 8)
    .attr("fill", function(d) { return severityColor(d * 0.35); });

  legend.append("text")
    .attr("y", 30)
    .attr("fill", "#888")
    .attr("font-size", 9)
    .attr("font-family", "Roboto, sans-serif")
    .text("Node size = volume · line width = volume");

  legend.append("text")
    .attr("y", 42)
    .attr("fill", "#888")
    .attr("font-size", 9)
    .attr("font-family", "Roboto, sans-serif")
    .text("Redder links = higher murder share");

  function centeredSortTargets() {
    const targets = new Map();
    const types = ["offender", "borough", "victim"];
    // Keep clear of title / column headers above and footer + legend below
    const topBound = 78;
    const bottomBound = height - 78;
    const centerY = (topBound + bottomBound) / 2;

    types.forEach(function(type) {
      const columnNodes = graphNodes
        .filter(function(d) { return d.type === type; })
        .slice()
        .sort(function(a, b) { return b.count - a.count || a.label.localeCompare(b.label); });

      const count = columnNodes.length;
      if (!count) {
        return;
      }

      if (count === 1) {
        targets.set(columnNodes[0].id, { x: columnX[type], y: centerY });
        return;
      }

      const span = bottomBound - topBound;
      const step = span / (count - 1);

      columnNodes.forEach(function(d, i) {
        targets.set(d.id, {
          x: columnX[type],
          y: topBound + i * step
        });
      });
    });

    return targets;
  }

  function drawFrame() {
    link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
  }

  function autoSortNodes() {
    if (sorting) {
      return;
    }

    sorting = true;
    sortButton.attr("disabled", true).text("Sorting...");

    // Freeze force layout so it cannot fight the sort animation
    simulation.stop();
    simulation.alpha(0);
    simulation.alphaTarget(0);
    node.interrupt();
    link.interrupt();

    const targets = centeredSortTargets();
    const starts = new Map();
    graphNodes.forEach(function(d) {
      starts.set(d.id, { x: d.x, y: d.y });
      const target = targets.get(d.id);
      d.fx = target.x;
      d.fy = target.y;
    });

    const duration = 700;
    const startTime = performance.now();

    function frame(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = d3.easeCubicInOut(t);

      graphNodes.forEach(function(d) {
        const start = starts.get(d.id);
        const target = targets.get(d.id);
        d.x = start.x + (target.x - start.x) * eased;
        d.y = start.y + (target.y - start.y) * eased;
      });

      drawFrame();

      if (t < 1) {
        window.requestAnimationFrame(frame);
        return;
      }

      graphNodes.forEach(function(d) {
        const target = targets.get(d.id);
        d.x = target.x;
        d.y = target.y;
        // Keep pinned at the centered sort so nodes don't sink afterward
        d.fx = target.x;
        d.fy = target.y;
      });

      drawFrame();
      sorting = false;
      sortedMode = true;
      sortButton.attr("disabled", null).text("Jumble");
      simulation.alpha(0);
      simulation.stop();
    }

    window.requestAnimationFrame(frame);
  }

  function jumbleNodes() {
    if (sorting) {
      return;
    }

    sorting = true;
    sortButton.attr("disabled", true).text("Jumbling...");

    simulation.stop();
    simulation.alphaTarget(0);

    // Release pins and scatter near each column so the force layout can re-jumble
    graphNodes.forEach(function(d) {
      d.fx = null;
      d.fy = null;
      d.x = columnX[d.type] + (Math.random() - 0.5) * 90;
      d.y = height / 2 + (Math.random() - 0.5) * (height * 0.45);
      d.vx = (Math.random() - 0.5) * 8;
      d.vy = (Math.random() - 0.5) * 8;
    });

    drawFrame();
    sortedMode = false;
    sorting = false;
    sortButton.attr("disabled", null).text("Auto sort");
    simulation.alpha(1).restart();
  }

  simulation.on("tick", function() {
    if (sorting) {
      return;
    }

    link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) {
      d.y = Math.max(70, Math.min(height - 70, d.y));
      return "translate(" + d.x + "," + d.y + ")";
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initRelationalStructures);
} else {
  initRelationalStructures();
}
