# Session 5 — Alternative Scales, Basu/De Relativizations, Shadow Ratings

After conversations referenced with Kaushik Basu and the upcoming discussions with Pedro Conceição (UNDP HDRO) and Supriyo De (World Bank), this session implements:

1. A literature survey of alternative numerical sovereign rating scales.
2. A scale-conversion module that re-expresses our composite score on every commonly used scale.
3. Re-runs of the Models A–D panel regressions under each scale.
4. Implementation of the Basu, De, Ratha, Timmer (2013) Relative Risk Rating / CRIS.
5. Multiple De-style relativizations (equal/GDP/population-weighted, Z-score, percentile, normalized).
6. A De/Ratha/Mohapatra (2007) shadow rating model fitted to our panel and applied to all 150 countries.
7. Per-agency tracking diagnostics: how well does each of S&P, Moody's, DBRS track a fundamentals-based shadow rating?

---

## Key references (used directly)

- Basu, De, Ratha, Timmer (2013) *Sovereign Ratings in the Post-Crisis World: An Analysis of Actual, Shadow and Relative Risk Ratings* — **WB Policy Research WP 6641**. PDF on disk as `WPS6641.pdf`.
- Ratha, De, Mohapatra (2007/2011) *Shadow Sovereign Ratings for Unrated Developing Countries* — **WB Policy Research WP 4269**. PDF on disk as `wps4269.pdf`.
- De, Mohapatra, Ratha (2020) *Sovereign Credit Ratings, Relative Risk Ratings, and Private Capital Flows* — **WB Policy Research WP 9401**.
- Cantor & Packer (1996) *Determinants and Impact of Sovereign Credit Ratings* — Federal Reserve Bank of New York EPR.
- UNDP (2023, Conceição peer-reviewed) *Lowering the Cost of Borrowing in Africa: The Role of Sovereign Credit Ratings*.
- Afonso, Furceri, Gomes (2011) ECB WP 1347.
- Reinhart, Rogoff (various) — implicit log-default-probability mapping.

---

## Alternative scales applied to our panel

Saved in `_panel_scales.pkl`, `panel_scales.csv`. Eight numerical representations:

| Column         | Range       | Direction          | Source                                    |
|----------------|------------|--------------------|-------------------------------------------|
| `score_60`     | 0–60       | higher = better    | Our existing (= Basu mirrored, no outlook)|
| `score_21`     | 1–21       | higher = better    | Standard 21-pt academic norm              |
| `score_20`     | 0–20       | higher = better    | BIS 2015                                  |
| `score_17`     | 1–17       | higher = better    | Afonso et al. 2011                        |
| `score_16`     | 1–16       | higher = better    | Cantor-Packer 1996                        |
| `score_basu60` | 1–60       | smaller = better   | Basu et al. 2013 ×3 directional           |
| `score_norm01` | 0–1        | higher = better    | Min-max normalized                        |
| `score_logPD`  | 0–11.5     | higher = better    | −ln(1-yr idealized PD), Moody's table     |

**Pairwise correlations among the eight scales: r ≥ 0.99** for monotone transforms. The Basu mirror is r = −1 with our scale.

### Effect on regression coefficients
File: `alt_scales_regressions.txt`, `alt_scales_regressions.csv`, `fig15_alt_scales_coefs.png`.

Re-running Models A–D under each scale: **all coefficients keep identical sign and statistical significance**. Magnitudes scale exactly with the y-variable's scale (a coefficient of 23.25 on log GDPpc with score_60 corresponds to 7.72 on score_21, 4.59 on score_logPD, etc.). The qualitative narrative of the paper is invariant to scale choice.

---

## Basu/De relativizations

### Basu RR (`basu_cris_panel.csv`, `_basu_cris_panel.pkl`)
- **Formula**: `RR_it = r_it − Σ_j w_j r_jt`
- We compute four versions: GDP-weighted time-varying, GDP-weighted fixed-2008 (Basu's choice), and the same on score_60 directional. Plus CRIS-style ratio index (% of world average).

### De-style relativizations (`de_relative_panel.csv`, `_de_relative_panel.pkl`)
Ten relativizations of `score_60` per (country, year):

- `rel_eq` / `rel_gdp` / `rel_gdp2008` / `rel_pop` / `rel_median` (subtract a centring statistic)
- `z_eq` / `z_gdp` (standard z-score, two weighting schemes)
- `pct_rank` (percentile rank within year)
- `norm_max` / `norm_min` (max-anchored, min-max normalized)

**Cross-method correlation r ≥ 0.97** on raw measures. **Versus our existing M1–M4: r ≥ 0.93** (i.e., our M1–M4 are essentially equivalent to the Basu/De relativization family).

---

## Shadow rating model (De/Ratha/Mohapatra replication + extension)

We fit five specifications on the panel of countries where we observe the composite score. Files: `shadow_model_results.txt`, `shadow_panel.csv`, `_shadow_panel.pkl`.

**Variables sourced:**
- `log_GDPpc`, `GDP_growth_pct`, `FDI_pct_GDP`, `Population` from existing master panel.
- `Inflation_pct` (FP.CPI.TOTL.ZG), `ExtDebt_pct_GNI` (DT.DOD.DECT.GN.ZS), `Reserves_Imports_mo` (FI.RES.TOTL.MO), `GovDebt_pct_GDP` (GC.DOD.TOTL.GD.ZS), `CurrentAccount_pct` (BN.CAB.XOKA.GD.ZS) from World Bank API → `_wb_macro_extra.pkl`.
- `RuleOfLaw` (WGI estimate, range −2.5 to +2.5) from data360 API → `_rule_of_law.pkl`.
- `GrowthVol_5y` = 5-yr rolling std of GDP_growth (computed).

**Specifications:**

| Spec | Regressors                                                                                          | N    | R²   |
|------|-----------------------------------------------------------------------------------------------------|------|------|
| S0   | log_GDPpc, GDP_growth_pct                                                                           | 3,137| 0.50 |
| S1   | + GrowthVol_5y, Inflation_pct                                                                       | 2,733| 0.55 |
| S2 ★ | + RuleOfLaw, CurrentAccount_pct                                                                     | 2,578| 0.76 |
| S3   | + ExtDebt_pct_GNI, Reserves_Imports_mo                                                              | 1,418| 0.81 |
| S4   | + FDI_pct_GDP, log_Population                                                                       | 1,418| 0.82 |

★ = our preferred benchmark (closest to Ratha-De-Mohapatra 2007 with full panel coverage).

**Benchmark S2 coefficients** (cluster-robust SE on country):

```
const                -10.23    log GDPpc            +11.25 ***
GDP_growth_pct        +0.026   GrowthVol_5y          −0.074 *
Inflation_pct         −0.105 ***  RuleOfLaw           +7.53 ***
CurrentAccount_pct    +0.241 ***
```

R² = 0.76, RMSE = 8.05 pts (≈ 2.7 letter-grade notches).

The model recovers the De et al. economic story: **log GNI per capita and Rule of Law are the two dominant predictors** with correctly signed lower-order controls.

---

## How well do we (the agencies) track the shadow rating?

### Overall (composite-score panel, S2 benchmark)
- **R² = 0.75**, **Pearson 0.87**, **Spearman 0.86**
- **Within 3 points (one notch) of shadow: 31%**
- **Within 6 points (two notches) of shadow: 56%**

So the composite of the three agencies stays within two notches of a fundamentals-based prediction in just over half of country-years — meaningful tracking but with substantial residual variation.

### Per-agency (only country-years actually rated by each agency)

| Agency  | N    | R²    | RMSE | Pearson | Within 1 notch | Within 2 notches |
|---------|------|-------|------|---------|----------------|------------------|
| S&P     | 2,346| 0.764 | 7.41 | 0.876   | 33%            | 60%              |
| Moody's | 2,471| 0.734 | 8.18 | 0.858   | 30%            | 56%              |
| DBRS    | 508  | 0.668 | 7.28 | 0.818   | 36%            | 67%              |

S&P tracks shadow most tightly on R² and Pearson; DBRS has best within-notch accuracy among rated cases (small sample, mainly developed countries).

### Average gap (Actual − Shadow) by continent, conditional on rating

| Continent      | S&P    | Moody's | DBRS   |
|----------------|--------|---------|--------|
| Africa         | **−0.75**  | **−0.84**   | (n=0)  |
| Asia           | +2.14  | +1.95   | +3.23  |
| Europe         | +1.07  | +1.03   | +0.58  |
| North America  | −2.98  | −2.85   | +6.02  |
| Oceania        | +0.87  | +1.40   | +7.33  |
| South America  | **−2.90**  | **−3.61**   | −5.10  |

**Result:** *Among rated African countries*, the average gap is small (~−0.8). The much larger Africa "under-rating" sometimes reported is partially a *coverage effect* — many African countries are rated by very few agencies, so simple cross-country averages mix rated and unrated. The clearest systematic under-rating in our model is for **South America (−2.9 to −3.6 notches)** and the **Caribbean** (Barbados, Belize, Cuba, etc.).

### Most under-rated and over-rated countries

**S&P, latest 3-year average gap:**
- *Most under-rated*: Sri Lanka (−26), Barbados (−24), Ghana (−23), Ukraine (−23), Ethiopia (−21), Bahrain (−20), Zambia (−19) — mostly recent defaulters or distressed sovereigns.
- *Most over-rated*: European Union (+17), Taiwan (+16), China (+15), Canada (+13), Liechtenstein (+13), Australia (+12), United States (+11), Germany (+11) — concentrated in advanced economies (and politically-significant Asian aggregates).

**Note:** The under-rated tail tracks countries that defaulted or are in active distress — an event the fundamentals model partially captures but not fully. The over-rated tail is dominated by advanced economies, suggesting agencies apply an "advanced-economy premium" that goes beyond what macro+rule-of-law explains.

---

## Files added (saved locally to the project folder)

### Reference / documentation
- `scales_reference.md`
- `session5_summary.md` (this file)

### Pickles
- `_panel_scales.pkl`     — panel + 8 scale variants
- `_basu_cris_panel.pkl`  — Basu RR / CRIS computations
- `_de_relative_panel.pkl`— De-style relativizations
- `_wb_macro_extra.pkl`   — Inflation, ext debt, reserves, gov debt, CAB
- `_rule_of_law.pkl`      — WGI Rule of Law (1996–2024)
- `_shadow_panel.pkl`     — full panel + Shadow_S0–S4 + residuals
- `_shadow_per_agency_panel.pkl`

### CSVs (paper-ready)
- `panel_scales.csv`, `alt_scales_correlation.csv`, `alt_scales_regressions.csv`
- `basu_cris_panel.csv`, `basu_cris_movers_2008_2024.csv`
- `de_relative_panel.csv`, `de_relative_correlation.csv`
- `wb_macro_extra.csv`, `rule_of_law.csv`
- `shadow_panel.csv`, `shadow_scorecard.csv`, `shadow_tracking_per_country.csv`
- `shadow_per_agency.csv`, `shadow_per_agency_panel.csv`, `shadow_per_agency_latest.csv`
- `shadow_residual_by_continent.csv`, `shadow_gap_continent_agency.csv`, `shadow_gap_continent_agency_filtered.csv`

### Text results
- `alt_scales_regressions.txt`
- `shadow_model_results.txt`

### Figures
- `fig15_alt_scales_coefs.png`
- `fig16_shadow_actual_scatter.png`
- `fig17_shadow_residuals_topbot.png`
- `fig18_shadow_resid_by_income.png`
- `fig19_shadow_resid_continent_heatmap.png`

### Scripts
- `alt_scales.py`, `alt_scales_regressions.py`
- `basu_cris.py`, `de_relative.py`
- `shadow_ratings.py`, `shadow_tracking_figures.py`, `shadow_per_agency.py`

---

## Talking points for Conceição & De

1. **Africa under-rating average is modest (−0.8 notches) once you condition on rated countries.** The big under-rated countries are concentrated in active distress (Ghana, Sri Lanka, Ukraine, Ethiopia) and select Caribbean economies (Barbados, Belize) — not a continent-wide pattern.
2. **The bigger systematic bias is over-rating of advanced economies (+11 to +17)** that is *not* explained by GDP per capita, rule of law, growth, inflation, or current-account fundamentals.
3. **Rule of Law is the second-largest predictor** of ratings after log GDPpc — so to the extent that WGI mis-measures African governance, that flows directly into our shadow score. This is consistent with UNDP's critique that subjective governance perceptions drive ratings.
4. **CRIS / Relative Risk Rating is highly correlated with our M1–M4 (r ≥ 0.93).** They are the same idea executed with different weighting and centering choices.
5. **Substantive findings (sign and significance of macro variables) are invariant to scale choice** — paper conclusions are robust regardless of the conversion convention.

---

## Open questions (for next session)

- Source GMM / Arellano-Bond estimates to address GDPpc endogeneity in the shadow model.
- Run shadow-rating model on a *cross-section* (latest year only) with full De et al. variable set to compare directly to their R² ≈ 0.78–0.82.
- Rerun shadow with **Trading Economics composite** (UNDP comparator) once we can source those values.
- Add a default-event indicator and re-fit; see whether residual pessimism for Ghana/Sri Lanka/Ukraine is purely "default already in price."
- Compute relative shadow ratings (shadow CRIS) — i.e., apply Basu RR formula to the predicted shadow scores rather than the actual.
