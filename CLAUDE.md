# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite HMR)
npm run build      # Production build → dist/
npm run preview    # Preview production build
npm run lint       # ESLint

node scripts/fetch-almanac.js   # Scrape 7-day almanac data → public/almanac.json
bash scripts/prepare-deploy.sh  # Copy almanac.json into dist/ before deploying
```

## Architecture

This is a single-page React + Vite app with no router or state management library.

**Data flow:**
1. `scripts/fetch-almanac.js` scrapes `calendar.8s8s.net` for 7 days of Chinese almanac (黃曆) data, writing the result to `public/almanac.json`.
2. `src/App.jsx` fetches `/almanac.json` at runtime via `useEffect`. If the fetch fails or the file is absent, it falls back to hardcoded `MOCK_DATA` in the same file.

**Core logic in `src/App.jsx`:**
- `classifyPillar(pillar)` — determines the alert level of a two-character heavenly stem/earthly branch pair. Alert characters are 辛 and 酉; they interact differently with fire (丙丁巳午) and water (壬癸亥子) characters.
- `COLOR_STYLES` — maps classification results (`extreme`, `pink`, `orange`, `purple`, `default`) to inline style objects.
- Components: `PillarChar` → `PillarDisplay` → `DayCard` → `App`. `Legend` is a standalone display component.
- Today detection uses Taiwan time (UTC+8), computed manually from `Date`.

**All styling is inline** — no CSS modules, no Tailwind. Google Fonts (`Noto Sans TC`, `Source Serif 4`) are injected via a `<style>` tag inside the component.

**Deployment:** Build with `npm run build`, run `prepare-deploy.sh` to ensure `almanac.json` and `.nojekyll` are in `dist/`, then deploy `dist/` to GitHub Pages or any static host.

## Data schema (`public/almanac.json`)

```json
{
  "days": [{
    "date": "2026/3/5",
    "weekday": "四",
    "lunarDate": "二零二六年 正月(大) 十七",
    "monthPillar": "辛卯",
    "dayPillar": "戊寅",
    "yearPillar": "丙午"
  }],
  "metadata": { "lastUpdated": "<ISO timestamp>", "errors": [] }
}
```

Only `date`, `weekday`, `lunarDate`, `monthPillar`, and `dayPillar` are consumed by the UI.
