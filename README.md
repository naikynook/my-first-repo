# Web Design Exploration

Collection of experiments for Computational Design Workflows at Columbia GSAPP, Summer 2026. 

Kody Naiker  
Advisor: Catherine Griffiths

Live: https://naikynook.github.io/my-first-repo/

## Docs

- [Project description](docs/PROJECT.md)
- [Style guide](docs/STYLE.md)

## Folders

```
index.html     page shell and tabs
css/           styles
js/            chat, survey, maps, sketches
data/          CSVs and GeoJSON
config/        Firebase and Mapbox setup
assets/        images
docs/          written notes
functions/     Cloud Function for the Agents chat
```

## Preview locally

CSV and GeoJSON will not load from a raw `file://` open, so serve the folder:

```bash
npx serve .
```

## Setup

**Mapbox.** `config/mapbox-config.js` holds the public `pk.` token. Restrict it by URL in the Mapbox dashboard (include your GitHub Pages origin).

**Firebase.** `config/firebase-config.js` is the public web config. Paste `config/firebase-database-rules.json` into Realtime Database → Rules in the Firebase console.

**Agents chat.** Keep the OpenAI key as a Firebase secret (`OPENAI_API_KEY`), not in client files. From the repo root:

```bash
firebase.cmd deploy --only functions
```
