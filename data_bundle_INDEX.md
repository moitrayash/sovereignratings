# Sovereign Credit Rating Explorer — Data Bundle

Auto-generated. Source repo: github.com/moitrayash/sovereignratings

License: data subject to source-provider terms (S&P, Moody's, DBRS Morningstar, World Bank, UNDP HDRO).


| # | File | Description |
|---|------|-------------|
| 00001 | `00001_paper_panel.csv` | Master country×year panel (2000–2025, 3,323 rows): composite score, M1–M4, deltas, GDP, FDI, GDP per capita, log GDPpc, population. |
| 00002 | `00002_paper_rel_all.csv` | Long-format relative ratings: every country × year × peer group (23,087 rows × 12 cols) — M1, M2, M3, M4 across 59 groups. |
| 00003 | `00003_paper_gini.csv` | Gini coefficient and distributional stats per peer group × year (1,438 rows): mean, SD, P25/P75, IQR, range. |
| 00004 | `00004_panel_scales.csv` | Composite score expressed on eight numerical scale variants (0–60, 0–20, 1–17, 1–16, 1–21, Basu mirror, log-PD, normalised 0–1). |
| 00005 | `00005_panel_gdppc.csv` | Master panel exported from the master pickle: composite + GDP + FDI + Population + GDP per capita + log GDPpc. |
| 00006 | `00006_basu_cris_panel.csv` | Comparative Rating Index for Sovereigns (CRIS) and Relative Risk Rating per Basu, De, Ratha and Timmer (2013): four GDP-weighting variants. |
| 00007 | `00007_basu_cris_movers_2008_2024.csv` | Largest CRIS movers between 2008 and 2024. |
| 00008 | `00008_de_relative_panel.csv` | Ten linear relativizations per country × year following De, Mohapatra and Ratha (2020): rel_eq, rel_gdp, rel_gdp2008, rel_pop, rel_median, z_eq, z_gdp, pct_rank, norm_max, norm_min. |
| 00009 | `00009_shadow_panel.csv` | Five-spec shadow rating model (S0–S4) per country × year: predicted score under each spec plus residuals. |
| 00010 | `00010_shadow_per_agency.csv` | Per-agency shadow tracking summary: R², RMSE, Pearson, Spearman, within-1-notch, within-2-notch. |
| 00011 | `00011_shadow_per_agency_latest.csv` | Latest year actual − shadow gaps per agency × country. |
| 00012 | `00012_shadow_scorecard.csv` | Country scorecard: actual, shadow, residual, percentile in residual distribution. |
| 00013 | `00013_shadow_tracking_per_country.csv` | Per-country tracking statistics across the panel. |
| 00014 | `00014_shadow_residual_by_continent.csv` | Mean residual by continent. |
| 00015 | `00015_shadow_gap_continent_agency.csv` | Mean residual by continent × agency. |
| 00016 | `00016_shadow_gap_continent_agency_filtered.csv` | Same as above, restricted to country-years where the country was actually rated. |
| 00017 | `00017_wb_macro_extra.csv` | World Bank macro covariates beyond GDP/FDI: inflation, external debt %GNI, reserves (months of imports), gov debt %GDP, current account %GDP. |
| 00018 | `00018_rule_of_law.csv` | Worldwide Governance Indicators Rule of Law estimate (range −2.5 to +2.5), 1996–2024. |
| 00019 | `00019_raw_events.csv` | Long-format rating events: every change/affirmation across S&P, Moody's, DBRS Morningstar with date, score, outlook, direction. |
| 00020 | `00020_membership.csv` | Country × peer group membership flags (151 × 62 columns). |
| 00021 | `00021_hdi_relative.csv` | Relative Human Development Index (M1, M2, M4) on the inflated 0–100 scale (HDI × 100), per UNDP HDR 2023/24. |
| 00022 | `00022_gini_relative.csv` | Relative Gini index (inverted as GiniInv = 100 − Gini, M1, M2, M4) on World Bank SI.POV.GINI series. |
| 00023 | `00023_alt_scales_correlation.csv` | Pairwise correlation matrix between the eight alternative numerical rating scales. |
| 00024 | `00024_alt_scales_regressions.csv` | Regression coefficients (Models A–D) under each of the eight scales — for invariance check. |