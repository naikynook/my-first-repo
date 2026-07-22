// geospatial-structures.js
// Mapbox NYC shootings map — hex bins + incident points (incident fields only)

function initGeospatialStructures() {
  const container = document.getElementById("canvas-container-6");
  if (!container) {
    return;
  }

  if (typeof mapboxgl === "undefined") {
    container.innerHTML = "<p>Could not load Mapbox GL JS. Check your internet connection and refresh.</p>";
    return;
  }

  if (typeof turf === "undefined") {
    container.innerHTML = "<p>Could not load Turf.js. Check your internet connection and refresh.</p>";
    return;
  }

  if (!window.MAPBOX_ACCESS_TOKEN || window.MAPBOX_ACCESS_TOKEN.indexOf("YOUR_MAPBOX") === 0) {
    container.innerHTML =
      "<p>Mapbox token missing. Copy <code>mapbox-config.example.js</code> to <code>mapbox-config.js</code> and add your token (that file is gitignored).</p>";
    return;
  }

  if (typeof d3 === "undefined") {
    container.innerHTML = "<p>Could not load D3.js (needed to read the shootings CSV).</p>";
    return;
  }

  mapboxgl.accessToken = window.MAPBOX_ACCESS_TOKEN;

  container.innerHTML = "";
  const mapEl = document.createElement("div");
  mapEl.id = "nyc-shootings-map";
  container.appendChild(mapEl);

  const status = document.createElement("div");
  status.className = "map-status-overlay";
  status.textContent = "Loading NYC shooting locations…";
  container.appendChild(status);

  // Wide envelope so the map can zoom out enough to show all five boroughs
  const nycBounds = [
    [-74.6, 40.28],
    [-73.4, 41.12]
  ];
  const hexBbox = [-74.28, 40.48, -73.68, 40.93];

  // Dark basemap via Carto tiles — avoids Mapbox style API / token URL-restriction failures
  const darkBasemapStyle = {
    version: 8,
    name: "Dark NYC",
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      "carto-dark": {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
          "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
          "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png"
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }
    },
    layers: [
      {
        id: "carto-dark",
        type: "raster",
        source: "carto-dark",
        minzoom: 0,
        maxzoom: 20
      }
    ]
  };

  const map = new mapboxgl.Map({
    container: mapEl,
    style: darkBasemapStyle,
    center: [-73.97, 40.72],
    zoom: 9.2,
    minZoom: 8,
    maxZoom: 17,
    maxBounds: nycBounds,
    attributionControl: true,
    cooperativeGestures: false,
    dragRotate: false,
    pitchWithRotate: false,
    scrollZoom: true
  });

  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
  map.scrollZoom.enable();
  map.scrollZoom.setWheelZoomRate(1 / 450);
  map.dragPan.enable();
  map.boxZoom.enable();
  map.doubleClickZoom.enable();
  map.touchZoomRotate.enable();

  // Capture wheel on the map so the page does not steal scroll-zoom
  mapEl.addEventListener(
    "wheel",
    function(event) {
      event.preventDefault();
    },
    { passive: false }
  );

  map.on("error", function(event) {
    const detail = event && event.error && (event.error.message || String(event.error));
    console.error("Mapbox error:", event && event.error);
    if (!status.classList.contains("is-error")) {
      status.textContent = detail
        ? "Map error: " + detail
        : "Map failed to load. Try refreshing.";
      status.classList.add("is-error");
    }
  });

  function forceResize() {
    map.resize();
  }

  map.on("load", function() {
    forceResize();
    map.fitBounds(
      [
        [-74.28, 40.48],
        [-73.68, 40.93]
      ],
      { padding: 28, duration: 0, maxZoom: 10 }
    );
    window.setTimeout(forceResize, 100);
    window.setTimeout(forceResize, 400);

    addBoroughLayers(map);

    d3.csv("Shootings_(2006-Present)_20260711.csv").then(function(rows) {
      addShootingLayers(map, rows, hexBbox, status);
    }).catch(function(err) {
      console.error(err);
      status.textContent = "Could not load shootings CSV.";
      status.classList.add("is-error");
    });
  });

  window.addEventListener("resize", forceResize);
}

function addBoroughLayers(map) {
  d3.json("nyc-boroughs.geojson").then(function(geo) {
    if (!geo || !geo.features) {
      return;
    }

    const labels = {
      type: "FeatureCollection",
      features: geo.features.map(function(feature) {
        return {
          type: "Feature",
          properties: { name: feature.properties.name },
          geometry: {
            type: "Point",
            coordinates: [feature.properties.labelLng, feature.properties.labelLat]
          }
        };
      })
    };

    map.addSource("boroughs", {
      type: "geojson",
      data: geo
    });
    map.addSource("borough-labels", {
      type: "geojson",
      data: labels
    });

    // Subtle borough shapes — only when zoomed out (hide as you zoom into neighborhood detail)
    const underHexes = map.getLayer("hex-fill") ? "hex-fill" : undefined;

    map.addLayer({
      id: "borough-fill",
      type: "fill",
      source: "boroughs",
      maxzoom: 12,
      paint: {
        "fill-color": "#d8d8d8",
        "fill-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          8, 0.035,
          11, 0.018,
          12, 0
        ],
        "fill-outline-color": "rgba(0, 0, 0, 0)"
      }
    }, underHexes);

    map.addLayer({
      id: "borough-outline",
      type: "line",
      source: "boroughs",
      maxzoom: 12,
      paint: {
        "line-color": [
          "interpolate",
          ["linear"],
          ["zoom"],
          8, "rgba(220, 220, 220, 0.32)",
          11, "rgba(220, 220, 220, 0.18)",
          12, "rgba(220, 220, 220, 0)"
        ],
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          8, 0.95,
          11, 0.7
        ]
      }
    }, underHexes);

    map.addLayer({
      id: "borough-labels",
      type: "symbol",
      source: "borough-labels",
      maxzoom: 12,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          8, 11,
          11, 14
        ],
        "text-transform": "uppercase",
        "text-letter-spacing": 0.1,
        "text-allow-overlap": true,
        "text-ignore-placement": true
      },
      paint: {
        "text-color": "rgba(235, 235, 235, 0.8)",
        "text-halo-color": "rgba(0, 0, 0, 0.7)",
        "text-halo-width": 1.25,
        "text-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          8, 0.85,
          11, 0.65,
          12, 0
        ]
      }
    }, underHexes);
  }).catch(function(err) {
    console.warn("Borough boundaries could not be loaded:", err);
  });
}

function addShootingLayers(map, rows, hexBbox, status) {
  const popup = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: true,
    maxWidth: "300px"
  });

  const pointFeatures = [];

  rows.forEach(function(row) {
    // This CSV has Latitude/Longitude headers swapped (lat column holds ~-74, lon holds ~40).
    const a = parseFloat(row.Latitude);
    const b = parseFloat(row.Longitude);
    if (!isFinite(a) || !isFinite(b)) {
      return;
    }
    const lng = a < -1 ? a : b;
    const lat = a < -1 ? b : a;
    if (lng < hexBbox[0] || lng > hexBbox[2] || lat < hexBbox[1] || lat > hexBbox[3]) {
      return;
    }

    pointFeatures.push({
      type: "Feature",
      properties: {
        incidentKey: row.INCIDENT_KEY || "",
        date: row.OCCUR_DATE || "",
        time: row.OCCUR_TIME || "",
        boro: row.BORO || "",
        locOfOccur: row.LOC_OF_OCCUR_DESC || "Unknown",
        precinct: row.PRECINCT || "",
        locClass: row.LOC_CLASSFCTN_DESC || "",
        locationDesc: row.LOCATION_DESC || "",
        marker: 1
      },
      geometry: {
        type: "Point",
        coordinates: [lng, lat]
      }
    });
  });

  status.textContent = "Building hex bins…";

  // Yield so the basemap can paint before heavy Turf work
  window.setTimeout(function() {
    const pointsFc = turf.featureCollection(pointFeatures);
    const hexgrid = turf.hexGrid(hexBbox, 0.2, { units: "kilometers" });
    const collected = turf.collect(hexgrid, pointsFc, "marker", "values");

    let maxCount = 1;
    collected.features.forEach(function(feature) {
      const count = (feature.properties.values || []).length;
      feature.properties.count = count;
      delete feature.properties.values;
      if (count > maxCount) {
        maxCount = count;
      }
    });

    const hexWithShootings = {
      type: "FeatureCollection",
      features: collected.features.filter(function(f) {
        return f.properties.count > 0;
      })
    };

    // One map point per unique coordinate. Coincident incidents are opened via an index in the popup.
    const incidentsByLocation = {};
    const locationFeatures = [];

    pointFeatures.forEach(function(feature) {
      const lng = feature.geometry.coordinates[0];
      const lat = feature.geometry.coordinates[1];
      const key = lng.toFixed(5) + "|" + lat.toFixed(5);
      if (!incidentsByLocation[key]) {
        incidentsByLocation[key] = [];
        locationFeatures.push({
          type: "Feature",
          properties: {
            locationKey: key,
            count: 0
          },
          geometry: {
            type: "Point",
            coordinates: [lng, lat]
          }
        });
      }
      incidentsByLocation[key].push(feature.properties);
    });

    locationFeatures.forEach(function(feature) {
      feature.properties.count = incidentsByLocation[feature.properties.locationKey].length;
    });

    map.addSource("hexbins", {
      type: "geojson",
      data: hexWithShootings
    });

    map.addSource("incidents", {
      type: "geojson",
      data: turf.featureCollection(locationFeatures)
    });

    map.addLayer({
      id: "hex-fill",
      type: "fill",
      source: "hexbins",
      paint: {
        "fill-color": [
          "interpolate",
          ["linear"],
          ["get", "count"],
          1, "#5c1818",
          Math.max(8, Math.round(maxCount * 0.1)), "#8f2020",
          Math.max(25, Math.round(maxCount * 0.25)), "#c62828",
          Math.max(60, Math.round(maxCount * 0.5)), "#e53935",
          maxCount, "#ff0000"
        ],
        "fill-opacity": [
          "interpolate",
          ["linear"],
          ["get", "count"],
          1, 0.22,
          Math.max(8, Math.round(maxCount * 0.1)), 0.3,
          Math.max(25, Math.round(maxCount * 0.25)), 0.4,
          Math.max(60, Math.round(maxCount * 0.5)), 0.5,
          maxCount, 0.58
        ],
        "fill-outline-color": "rgba(0, 0, 0, 0)"
      }
    });

    map.addLayer({
      id: "incident-points",
      type: "circle",
      source: "incidents",
      minzoom: 13.5,
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          13.5, 2.6,
          15, 3.8,
          17, 5.5
        ],
        "circle-color": "#ffd27a",
        "circle-opacity": 0.9,
        "circle-stroke-width": 0.5,
        "circle-stroke-color": "rgba(0, 0, 0, 0.35)"
      }
    });

    map.on("click", "hex-fill", function(event) {
      const feature = event.features && event.features[0];
      if (!feature) {
        return;
      }
      const count = feature.properties.count;
      popup
        .setLngLat(event.lngLat)
        .setHTML(
          "<div class=\"map-popup\">" +
            "<strong>Hex cell</strong><br>" +
            Number(count).toLocaleString() + " shooting" + (Number(count) === 1 ? "" : "s") +
          "</div>"
        )
        .addTo(map);
    });

    map.on("click", "incident-points", function(event) {
      const feature = event.features && event.features[0];
      if (!feature) {
        return;
      }

      const key = feature.properties.locationKey;
      const incidents = incidentsByLocation[key] || [];
      const coords = feature.geometry.coordinates.slice();

      openIncidentPopup(popup, map, coords, incidents);

      if (event.originalEvent) {
        event.originalEvent.stopPropagation();
      }
    });

    map.on("mouseenter", "hex-fill", function() {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "hex-fill", function() {
      map.getCanvas().style.cursor = "";
    });
    map.on("mouseenter", "incident-points", function() {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "incident-points", function() {
      map.getCanvas().style.cursor = "";
    });

    map.resize();
    status.remove();

    const container = map.getContainer().parentElement;
    if (container) {
      const existing = container.querySelector(".map-legend");
      if (existing) {
        existing.remove();
      }

      const legend = document.createElement("div");
      legend.className = "map-legend";
      legend.innerHTML =
        "<div class=\"map-legend-title\">Shootings per hex</div>" +
        "<div class=\"map-legend-ramp\" aria-hidden=\"true\"></div>" +
        "<div class=\"map-legend-labels\">" +
          "<span>Least</span>" +
          "<span>Most</span>" +
        "</div>" +
        "<div class=\"map-legend-total\">" +
          Number(rows.length).toLocaleString() + " shootings since 2006" +
        "</div>";
      container.appendChild(legend);
    }
  }, 50);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGeospatialStructures);
} else {
  initGeospatialStructures();
}

function formatIncidentDetails(incident) {
  return [
    "<strong>Shooting incident</strong>",
    incident.date ? "Date: " + incident.date : null,
    incident.time ? "Time: " + incident.time : null,
    incident.boro ? "Borough: " + incident.boro : null,
    incident.locOfOccur ? "Location: " + incident.locOfOccur : null,
    incident.precinct ? "Precinct: " + incident.precinct : null,
    incident.locClass ? "Classification: " + incident.locClass : null,
    incident.locationDesc ? "Description: " + incident.locationDesc : null
  ].filter(Boolean).join("<br>");
}

function openIncidentPopup(popup, map, coords, incidents) {
  if (!incidents.length) {
    return;
  }

  if (incidents.length === 1) {
    popup
      .setLngLat(coords)
      .setHTML("<div class=\"map-popup\">" + formatIncidentDetails(incidents[0]) + "</div>")
      .addTo(map);
    return;
  }

  const indexButtons = incidents.map(function(incident, index) {
    const label = incident.date || ("Incident " + (index + 1));
    return (
      "<button type=\"button\" class=\"map-incident-index-btn\" data-index=\"" + index + "\">" +
        (index + 1) + ". " + label +
      "</button>"
    );
  }).join("");

  popup
    .setLngLat(coords)
    .setHTML(
      "<div class=\"map-popup map-popup-multi\">" +
        "<p class=\"map-shared-note\">" +
          incidents.length.toLocaleString() +
          " shootings in this dataset share the same location. Select one:" +
        "</p>" +
        "<div class=\"map-incident-index\">" + indexButtons + "</div>" +
        "<div class=\"map-incident-detail\" hidden></div>" +
      "</div>"
    )
    .setMaxWidth("300px")
    .addTo(map);

  const popupEl = popup.getElement();
  if (!popupEl) {
    return;
  }

  const detailEl = popupEl.querySelector(".map-incident-detail");
  const buttons = popupEl.querySelectorAll(".map-incident-index-btn");

  buttons.forEach(function(button) {
    button.addEventListener("click", function(clickEvent) {
      clickEvent.preventDefault();
      clickEvent.stopPropagation();

      const index = Number(button.getAttribute("data-index"));
      const incident = incidents[index];
      if (!incident || !detailEl) {
        return;
      }

      buttons.forEach(function(other) {
        other.classList.remove("is-active");
      });
      button.classList.add("is-active");

      detailEl.hidden = false;
      detailEl.innerHTML = formatIncidentDetails(incident);
    });
  });
}
