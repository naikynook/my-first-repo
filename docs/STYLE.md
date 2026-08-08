# Style guide

Visual reference for **Web Design Exploration** - a dark, tabbed studio shell that synthesizes the canvases rather than presenting a long white document page.

Implementation lives in `css/style.css`. Tokens are defined on `:root`.

## Mood

- Near-black field with a faint cyan grid overlay
- Soft cyan / magenta atmosphere (radial washes), not flat fills
- Feels like a projection / generative-art desk, not a dashboard of cards
- One composition per viewport: brand + title strip, tab bar, then the active object

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

1. **Header** - Columbia GSAPP | course title | About. Frosted dark bar with mono type.
2. **Studio intro** - year, project title, author, advisor.
3. **Object tabs** - pill tablist (`Agents`, `Survey`, `Geospatial`, `Relational`, `Temporal`, `Spatial`). Active tab is filled with a cyan→lime gradient.
4. **Object stage** - bordered panel holding the active digital object. Inactive panels use `hidden` so only one canvas set is interactive.
5. **About modal** - centered elevated panel over a dimmed backdrop.

Avoid packing secondary marketing blocks into the first viewport. Prefer one job per section: title, short supporting paragraph (copy already on the page), then the canvas.

## Component accents

- **Agents** - cyan/magenta gradients, drifting grid, “composing…” pending bubble
- **Survey** - dark cards, red Yes buttons, outlined No buttons, corner toasts
- **Map / D3 / Three containers** - dark chrome borders (`--line`), rounded ~10px frames so light canvases sit in the shell without fighting it

## Motion

Keep motion purposeful and light:

- Tab / panel enter: short fade + slight rise (`panelIn`, `studioFade`)
- Agents grid drift and chat bubble entrance
- Pending status pulse while the agent responds

Do not add glow stacks, emoji clusters, or multi-layer card shadows.

## Do / don’t

**Do**

- Stay dark-first
- Use cyan as the primary accent
- Keep copy max-width readable (`~68ch` for body paragraphs)
- Fire a `resize` after tab changes so Mapbox / D3 / Three relayout

**Don’t**

- Default to purple-on-white or cream/terracotta “AI template” looks
- Turn the hero into a dashboard of cards and stat strips
- Commit OpenAI or unrestricted secrets into client JS (see `config/` examples)
