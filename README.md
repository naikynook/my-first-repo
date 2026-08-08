# Web Design Exploration

A collection of web design experiments for Columbia GSAPP's Computational Design Workflows class (Summer 2026).

**Author:** Kody Naiker  
**Advisor:** Catherine Griffiths  
**Live site:** [naikynook.github.io/my-first-repo](https://naikynook.github.io/my-first-repo/)

## Docs

- [Project description](docs/PROJECT.md) - what each digital object explores
- [Style guide](docs/STYLE.md) - visual system, tokens, and UI patterns

## Folder structure

```
├── index.html          # Page shell + tabbed digital objects
├── css/                # Site styles
├── js/                 # Feature scripts (chat, survey, maps, sketches)
├── data/               # CSVs + GeoJSON used by visualizations
├── config/             # Firebase / Mapbox client config (examples + rules)
├── assets/             # Static images
├── docs/               # Project + style markdown
└── functions/          # Firebase Cloud Function (OpenAI proxy for Agents)
```

## Local preview

Serve the repo root over HTTP (file:// will block CSV/GeoJSON fetches):

```bash
npx serve .
```

Then open the printed localhost URL.

## Setup notes

1. **Mapbox** - copy `config/mapbox-config.example.js` → `config/mapbox-config.js` and add your public `pk.` token (URL-restricted).
2. **Firebase** - `config/firebase-config.js` is public client config. Publish `config/firebase-database-rules.json` in the Firebase console under Realtime Database → Rules.
3. **Agents chat** - OpenAI key lives only as a Firebase secret (`OPENAI_API_KEY`). Deploy with `firebase.cmd deploy --only functions` from the repo root.
