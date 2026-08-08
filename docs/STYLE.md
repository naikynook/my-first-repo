# Style guide

Notes for the look of **Web Design Exploration**: a dark, tabbed studio shell built around the canvases rather than a long white document page.

Implementation: `css/style.css`. Tokens live on `:root`.

## Mood

- Near-black field with a faint cyan grid overlay
- Soft cyan and magenta atmosphere (radial washes), not flat fills
- More like a projection or generative-art desk than a dashboard of cards
- One composition per view: brand and title, tab bar, then the active object

## Color tokens

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#07090c` | Page ground |
| `--bg-elevated` | `#0d1117` | Modals / raised surfaces |
| `--bg-panel` | `rgba(14, 18, 24, 0.88)` | Active object stage |
| `--text` | `#e8f2ec` | Primary copy |
| `--text-muted` | `#8a9a92` | Secondary copy, meta |
| `--accent` | `#5cffc5` | Cyan highlight (tabs, titles, status) |
| `--accent-dim` | `rgba(92, 255, 197, 0.12)` | Soft hover / glow wash |
| `--line` | `rgba(140, 220, 190, 0.14)` | Hairline borders |
| `--danger` | `#ff6b7a` | Errors / alerts |

Agents chat also uses local accents (`--agent-cyan`, `--agent-magenta`). The FRT survey uses a red accent (`#e11d2e`) on a matching dark surface.

## Typography

| Role | Family | Notes |
| --- | --- | --- |
| Display / titles | **Space Grotesk** | Project title, section labels, Agents headings |
| Body | **DM Sans** (Outfit as support) | Paragraphs, survey copy |
| Mono / chrome | **IBM Plex Mono** | Header, tabs, status chips, meta |

Section titles are small, uppercase, letterspaced, and tinted with `--accent`.

## Layout patterns

1. **Header.** Columbia GSAPP, course title, About. Frosted dark bar with mono type.
2. **Studio intro.** Year, project title, author, advisor.
3. **Object tabs.** Pill tablist (`Agents`, `Survey`, `Geospatial`, `Relational`, `Temporal`, `Spatial`). The active tab fills with a cyan to lime gradient.
4. **Object stage.** Bordered panel for the active digital object. Inactive panels use `hidden` so only one canvas set is interactive.
5. **About modal.** Centered elevated panel over a dimmed backdrop.

Keep the first view simple: title, short supporting paragraph already on the page, then the canvas.

## Component accents

- **Agents:** cyan/magenta gradients, drifting grid, “composing…” pending bubble
- **Survey:** dark cards, red Yes buttons, outlined No buttons, corner toasts
- **Map / D3 / Three containers:** dark chrome borders (`--line`), rounded ~10px frames so light canvases sit in the shell without fighting it

## Motion

Keep motion light and purposeful:

- Tab / panel enter: short fade and slight rise (`panelIn`, `studioFade`)
- Agents grid drift and chat bubble entrance
- Pending status pulse while the agent responds

Skip glow stacks, emoji clusters, and multi-layer card shadows.

## Do / don’t

**Do**

- Stay dark-first
- Use cyan as the primary accent
- Keep body copy readable (`~68ch`)
- Fire a `resize` after tab changes so Mapbox / D3 / Three relayout

**Don’t**

- Fall into purple-on-white or cream/terracotta template looks
- Turn the first view into a dashboard of cards and stat strips
- Put OpenAI keys or other secrets in client JS (see `config/` examples)
