# Sovereign Credit Rating Explorer

Interactive static website for exploring sovereign credit rating data across 150 countries, 59 peer groups, and 2000–2025. Built for GitHub Pages — no server required.

## What it does

**Mode A — Single Country × Peer Group**
Select one country and one peer group (e.g. India × BRICS). Displays:
- Absolute composite score vs peer group leave-one-out mean
- M1 and M3 relative ratings over time
- M2 within-group rank and M4 percentile
- ΔM1 annual momentum bar chart
- Year-by-year and summary tables with one-click LaTeX/CSV export

**Mode B — Multi-Country Comparison**
Select 2–8 countries and a reference group. Displays:
- Side-by-side absolute scores
- M1 relative ratings
- M4 percentile ranks
- Summary table with LaTeX export

## Pages

| File | Description |
|---|---|
| `index.html` | Explorer (Mode A: Country × Peer Group; Mode B: Multi-Country) |
| `methodology.html` | Methodology, sections 1–13 (M1–M4, alternative scales, Basu RR/CRIS, De relativizations, shadow ratings, pairwise/distance) |
| `pairwise.html` | Country-vs-country pairwise + distance-graded ratings (interactive sliders for λ, p, α) |
| `relative_hdi.html` | UNDP Human Development Index under M1–M4 logic |
| `relative_gini.html` | World Bank Gini Index under M1–M4 logic |
| `stories.html` | Five empirical narratives drawn from the panel (Argentina 2001, Eurozone 2010–13, Pakistan–India divergence, 2020–23 EM defaults, Iceland 2008) |
| `glossary.html` | Definitions, alphabetised, searchable |
| `citations.html` | Chicago-style bibliography, with offline PDFs where available |

## Data files

| File | Description |
|---|---|
| `data.js` | Pre-processed M1–M4 time series for all country×group combinations |
| `extras.json` | Pairwise score matrix, capital coordinates, HDI/Gini relativizations, story bundles |
| `paper_panel.csv`, `paper_rel_all.csv`, `paper_gini.csv` | Paper-ready CSVs |
| `panel_scales.csv`, `basu_cris_panel.csv`, `de_relative_panel.csv`, `shadow_panel.csv`, `shadow_per_agency_panel.csv` | Methodology-specific CSVs |
| `wb_macro_extra.csv`, `rule_of_law.csv`, `raw_events.csv`, `membership.csv`, `hdi_relative.csv`, `gini_relative.csv` | Source / supporting data |
| `generate_data.py` | Regenerates `data.js` / `data.json` from the pickle files |

## Deploy to GitHub Pages

1. Create a new GitHub repository (public or private with Pages enabled)
2. Push these three files to the repo root:
   ```
   index.html
   data.json
   generate_data.py   (optional — only needed if you regenerate data)
   ```
3. Go to **Settings → Pages → Source**: select `Deploy from a branch`, branch `main`, folder `/ (root)`
4. Your site will be live at `https://<username>.github.io/<repo-name>/`

## Regenerate data.json

Run this in the `cr rating` folder whenever the underlying pickles change:

```bash
python generate_data.py
```

Requires: `pandas`, `numpy`. The script reads `_rel_ratings_all.pkl` and `_panel_gdppc.pkl`.

## Relative rating methods

| Method | Formula | Notes |
|---|---|---|
| M1 | score² / LOO mean (current year) | Main relative measure |
| M2 | Within-year rank (raw count) | e.g. 47 out of 150 |
| M3 | score² / LOO mean (prior year) | Captures lagged benchmark |
| M4 | Within-year percentile (0–1) | Normalized rank |

LOO = leave-one-out: group mean computed excluding the focal country to avoid self-influence.

## Data sources

- Credit ratings: S&P, Moody's, DBRS (scored 0–60; AAA ≈ 60, D ≈ 0)
- GDP and FDI: World Bank Development Indicators
- Period: 2000–2025 (forward-filled from last known rating event)
