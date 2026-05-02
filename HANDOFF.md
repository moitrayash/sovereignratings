# Project Handoff: Sovereign Credit Ratings Analysis

## What this project is

Analysis of sovereign credit ratings (scored 0–60, 60 = best) assigned by three agencies — **S&P**, **Moody's**, and **DBRS** — to 151 countries, spanning 1949–2026. Goal: academic paper publication with formal regression results in LaTeX/Overleaf. Work is in Python (data pipeline), and Stata or R (final regressions/tables).

---

## Session log

| Session | What was done |
|---------|---------------|
| 1 | Data cleaning, forward-filled panel, composite scores, Figs 1–6, Excel export |
| 2 | Panel regressions (PanelOLS), ordered logit/probit, agency divergence, FDI~score, Figs 7–11 |
| 3 | Relative ratings M1–M4 (all 62 groups), Gini coefficients, Figs 12–14b, paper-ready CSVs |
| 4 | Static website (index.html + methodology.html + glossary.html), data.js, generate_data.py |
| 5 | **Alternative scales (8), Basu CRIS/RR, De-style relativizations, shadow rating model on full panel, per-agency tracking — see `session5_summary.md`. Figs 15–19. Sourced WGI Rule of Law and 5 extra WB macro indicators.** |

---

## Files in the folder

### Static website (new — session 4)
| File | Description |
|------|-------------|
| `index.html` | Main explorer — Mode A (Country × Peer Group) and Mode B (Multi-Country). Plotly.js charts, year-by-year and summary tables, LaTeX + CSV export. |
| `methodology.html` | 8-section methodology writeup: data construction, composite score formula, panel specs, M1–M4 derivations, Gini, regression results |
| `glossary.html` | 25+ term glossary with live search filter and A–Z index |
| `data.js` | Pre-computed time series for all 1,017 country×group combinations as `window.CR_DATA`. Loaded via `<script src>` (not fetch — Chrome blocks fetch on file://) |
| `data.json` | Same data as plain JSON (for Stata/R/reference) |
| `generate_data.py` | Regenerates data.js + data.json from pickles. Run whenever data changes. Takes ~1s. |
| `README.md` | GitHub Pages deployment instructions |

**To deploy to GitHub Pages:** push `index.html`, `methodology.html`, `glossary.html`, `data.js` to a repo root → Settings → Pages → branch main, / (root).

**IMPORTANT — data.js vs data.json:** The site uses `data.js` (not `data.json`) because Chrome blocks `fetch()` on `file://` URLs. `data.js` sets `window.CR_DATA` via a `<script>` tag, which is not subject to this restriction. Both files contain identical data.

### Ad-hoc figures (new — session 4)
| File | Description |
|------|-------------|
| `fig_india_relative_ratings.png` | India M1/M2/M4/ΔM1 over time vs World — 3-panel matplotlib figure |
| `fig_us_vs_world.png` | US vs India, China, Germany — absolute scores, M1, M2 percentile vs World |

### Primary outputs (existing)
| File | Description |
|------|-------------|
| `Credit_Ratings_Analysis.xlsx` | 3 sheets: Raw Data, Latest Ratings, Annual Panel |
| `fig1_distribution_overview.png` | Score distribution, box plots by agency, events/year, upgrades vs downgrades |
| `fig2_country_rankings.png` | Top 25 / bottom 25 countries by latest composite score |
| `fig3_trends.png` | Global avg score over time by agency + biggest movers 2005→2024 |
| `fig4_agency_scatter.png` | S&P vs Moody's vs DBRS pairwise scatter with OLS lines |
| `fig5_heatmap.png` | Country × year heatmap, top 55 countries (2005–2024) |
| `fig6_volatility.png` | Top 30 most volatile countries by std dev of score |
| `fig7_z_distributions.png` | Z-score distributions (global and GDP-weighted) |
| `fig8_panel_regressions.png` | Coefficient plots for 4 panel regression specs |
| `fig9_ordered_model.png` | Ordered logit/probit coefficient comparison |
| `fig10_agency_divergence.png` | Pairwise agency divergence trends + most divergent countries |
| `fig11_fdi_score_lags.png` | FDI ~ lagged score: panel FE + rolling windows + country OLS |
| `fig12_rr_distributions.png` | Relative rating (M1–M4) distributions by group |
| `fig13_top_movers.png` | Biggest relative rating movers across groups |
| `fig14_gini_heatmap.png` | Gini coefficient heatmap across groups and years |
| `fig14b_world_gini.png` | World Gini trend 2000–2024 |

### Paper-ready CSVs (use directly in Stata/R — no Python needed)
| File | Rows | Description |
|------|------|-------------|
| `paper_panel.csv` | 3,323 | **Main dataset** — Country, ISO2, ISO3, Year, CompositeScore, M1–M4, M1_delta, M3_delta, GDP_USD, GDP_bn, GDP_growth_pct, FDI_pct_GDP, GDP_per_capita, log_GDPpc, Population |
| `paper_rel_all.csv` | 23,087 | All country×year×group — M1/M2/M3/M4 + deltas for all 59 groups |
| `paper_gini.csv` | 1,438 | Gini + distributional stats (Mean, SD, P25, P75, IQR, Range) per group×year |

### Python scripts
| File | Description |
|------|-------------|
| `panel_analysis.py` | Panel regressions, ordered logit/probit, FDI analysis, agency divergence |
| `relative_ratings_v2.py` | M1–M4 computation, Gini, all 59 groups |
| `generate_data.py` | Exports data.js + data.json for the website |

### Regression results (text)
| File | Description |
|------|-------------|
| `regression_results.txt` | Full PanelOLS output: Models A–D |
| `ordered_model_results.txt` | Ordered logit + probit output |
| `fdi_score_results.txt` | FDI ~ lagged score panel results |

### Python pickle cache
| Pickle | Description |
|--------|-------------|
| `_df.pkl` | Cleaned raw data (2,178 obs): Country, ISO2, Agency, Rating, Score, Outlook, Date, Year, PrevScore, Change, Direction |
| `_latest_ca.pkl` | Most recent rating per country-agency pair (331 rows) |
| `_latest_country.pkl` | Latest composite score per country (150 rows) |
| `_panel.pkl` | Annual panel, country × agency × year, forward-filled (6,679 rows) |
| `_panel_composite.pkl` | Annual composite score per country × year (3,336 rows) |
| `_panel_macro.pkl` | Annual composite + GDP + FDI (150 countries × 2000–2025) |
| `_panel_gdppc.pkl` | **Master panel** (3,336 × 13): composite + GDP + FDI + Population + GDP_per_capita + log_GDPpc |
| `_panel_zscores.pkl` | Panel with z_global and z_global_gdp (GDP-weighted) z-scores |
| `_membership.pkl` | Country × 61 grouping indicator columns |
| `_rel_ratings_all.pkl` | Relative ratings (23,087 × 14): Country, ISO2, Year, Group, GroupSize, CompositeScore, loo_mean, pct_dev_M1, M1, M2, M3, M4, M1_delta, M3_delta — all 59 groups |
| `_gini_groups.pkl` | Gini + distributional stats per group×year (1,438 × 10) |
| `_world_stats.pkl` | World-level summary stats per year |

---

## Key data facts

- **151 countries**, 3 agencies (S&P, Moody's, DBRS), ratings from 1949–2026
- **Score scale**: 0 (worst) → 60 (best); AAA=60, D/SD=0
- **DBRS** scores systematically higher (mean 41.1) vs S&P (31.2) and Moody's (30.7) — use agency FE in regressions
- **Inter-agency correlation**: r ≈ 0.97 across all three pairs
- **Global trend**: average composite score declined from ~39 (2000–2006) to ~34 (2020–2025)
- Downgrades larger than upgrades in magnitude (avg −6.1 pts vs +4.4 pts)
- 802 upgrades vs 604 downgrades in total history
- **GDP coverage**: 94.4%; missing: Guinea, Taiwan (WB doesn't publish Taiwan)
- **FDI coverage**: 92.3%; **GDP growth**: 99%; **GDP per capita**: 94.3%

---

## Grouping structure (59 groups across data.js and pickles)

### MECE partitions (use these for FE or exhaustive group analysis)
1. **WB Income**: `WB_High_Income` / `WB_Upper_Middle_Income` / `WB_Lower_Middle_Income` / `WB_Low_Income`
2. **Continents**: `Africa` / `Asia` / `Europe` / `North_America` / `South_America` / `Oceania`
3. **African sub-regions** (within Africa): `North_Africa` / `West_Africa` / `East_Africa` / `Southern_Africa` / `Central_Africa`

### Redundant pairs (identical membership — keep one)
- `South_Asia` ≡ `SAARC`
- `Southeast_Asia` ≡ `ASEAN`

All other groups intentionally overlap — do not use collinear group dummies in the same regression.

---

## Key findings

### Panel regressions (Models A–D, country + year FE, clustered SE)
- **R²(within) ≈ 0** (Model A: growth + FDI only): macro flows explain almost nothing within-country year-to-year. Scores are extremely persistent.
- **Pooled OLS R² = 0.90**: almost all variation is *between* countries. log GDPpc β ≈ 9.2*** pooled.
- **FDI coefficient flips**: pooled β = +0.010*** (cross-sectional); within-FE β ≈ 0 (FDI swings don't move ratings).
- **GDP growth** within-FE β = −0.04*** (counterintuitive — likely EM composition effect).

### Ordered logit / probit (N = 2,922 transitions)
- GDP growth → upgrade: β = +0.044*** | log GDPpc → upgrade: β = +0.538***
- Score_lag1 → mean reversion: β = −0.019*** | FDI: insignificant
- Distribution: ~13% downgrades, ~70% stable, ~17% upgrades

### Relative ratings
- **India (World group)**: absolute +8 pts over 25 yrs, but M1 nearly doubled (19.5→38.6), M4 from 0.29→0.57 — latent drift as world mean fell
- **US (World group)**: absolute fell 60→58, but M1 rose 97→106 — world mean fell faster than US score
- **World Gini**: 0.232 (2000) → 0.321 (2023) — 38% rise in global credit inequality

---

## What's next (suggested)

### Analysis
- [ ] Add macro vars: inflation, debt/GDP, current account balance, political risk index (ICRG/V-Dem)
- [ ] GMM / Arellano-Bond to address endogeneity of GDPpc
- [ ] Event study: ratings around sovereign defaults and financial crises
- [ ] Decompose variance: within-country vs between-country components (ANOVA or VCA)
- [ ] Democracy/autocracy dummy — do political institutions predict ratings conditional on income?

### Paper deliverables
- [ ] LaTeX regression tables — run in Stata (`estout`/`esttab`) or R (`modelsummary`) from the paper CSVs
- [ ] Write paper sections (introduction, data, methodology, results, conclusion)
- [ ] Publication-quality figures for the paper (matplotlib or R/ggplot2 with journal style)
- [ ] World map choropleth with year slider (D3.js — planned, not yet built)

---

## Python environment

All work done in Python 3.10. Key packages:
```
pip install pandas numpy matplotlib seaborn scipy openpyxl pycountry linearmodels statsmodels --break-system-packages
```

Reload state in a new session:
```python
import pandas as pd
BASE = "C:/Users/yashm/OneDrive - Cornell University/Desktop/Research/credit rating/cr rating/"

panel_gdppc  = pd.read_pickle(BASE + "_panel_gdppc.pkl")   # master panel (3,336 × 13)
rel_ratings  = pd.read_pickle(BASE + "_rel_ratings_all.pkl") # relative ratings (23,087 × 14)
gini_groups  = pd.read_pickle(BASE + "_gini_groups.pkl")   # Gini per group×year (1,438 × 10)
membership   = pd.read_pickle(BASE + "_membership.pkl")    # group membership flags
```

Load paper CSVs in Stata or R:
```stata
import delimited "paper_panel.csv", clear        // main regression dataset
import delimited "paper_rel_all.csv", clear      // all groups, all methods
import delimited "paper_gini.csv", clear         // Gini by group×year
```
```r
panel   <- read.csv("paper_panel.csv")
rel_all <- read.csv("paper_rel_all.csv")
gini    <- read.csv("paper_gini.csv")
```
