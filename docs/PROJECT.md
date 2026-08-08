# Project description

**Web Design Exploration** is a studio portfolio for Computational Design Workflows at Columbia GSAPP (Summer 2026). It collects digital objects that treat code as a visual and spatial medium: projection-minded canvases, live data structures, and interactive city datasets, all inside one dark, tabbed shell.

Author: **Kody Naiker**. Advisor: **Catherine Griffiths**.

## Framing

Instead of one long scroll, the work sits as a set of canvases. Each digital object has its own tab. Shared threads include grids and matrix fields, projection and installation thinking, and NYC shootings data read through place, relation, and time.

## Digital objects

### Agents
An AI collaborator for projector art. Visitors ask for p5.js and Three.js sketch ideas tuned to large-scale projection. Messages sync through Firebase. Replies come from ChatGPT through a Cloud Function so the API key never sits in the browser.

### Survey (Engagement Components)
A five-question yes/no survey about facial recognition technology (FRT) in cities. Votes write to Firebase Realtime Database and update live for everyone on the page.

### Geospatial
A Mapbox map of NYC shootings (2006-present): hex density when zoomed out, individual incidents when zoomed in, with borough outlines and shared-location popups.

### Relational
NYPD shootings as three related tables (incidents, victims, offenders) joined on incident key. A D3 force network shows offender → borough → victim flows. A chord diagram reframes offender/victim race relationships.

### Temporal
Time as layout: a D3 calendar/matrix panel that animates through years of NYC shooting counts, treating the year as a visual field rather than a static table.

### Spatial
p5.js and Three.js experiments aimed at projector-like visual environments: static grids, radiating matrix waves, and orbiting or interactive grid spheres.

## Stack

| Layer | Tools |
| --- | --- |
| Page | HTML, CSS, vanilla JS |
| Graphics | p5.js, Three.js, D3 |
| Maps | Mapbox GL JS, Turf, Carto dark basemap tiles |
| Live data | Firebase Realtime Database |
| Agents backend | Firebase Cloud Functions + OpenAI |

## Data

CSV and GeoJSON sources live in `data/`:

- `Shootings_(2006-Present)_20260711.csv`
- `Shooting_Victims_(2006-Present)_20260716.csv`
- `Shooting_Offenders_(2006-Present)_20260716.csv`
- `nyc-boroughs.geojson`

## About copy (on site)

> A collection of experiments for Computational Design Workflows at Columbia's GSAPP.
