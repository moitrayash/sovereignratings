"""
de_relative.py
De-style relativizations of the rating panel.

Builds on Basu RR by computing additional weighting schemes used in the
post-crisis literature (De, Mohapatra, Ratha 2020 WPS 9401). All operate on
our 0-60 scale where higher = better.

Variants per (country, year):
    rel_eq        : score - equal-weighted world mean
    rel_gdp       : score - GDP-weighted world mean
    rel_gdp2008   : score - GDP-weighted (fixed 2008 weights)
    rel_pop       : score - population-weighted world mean
    rel_median    : score - median(world)
    z_eq          : (score - mean) / sd                (cross-sectional z)
    z_gdp         : GDP-weighted z-score
    pct_rank      : percentile rank within year (0-1)
    norm_max      : score / max(world) within year
    norm_min      : (score - min) / (max - min)        (0-1 within year)

We also save per-country per-year deltas (Δrel_xx) — yearly first-differences
of each relative measure — useful for change-on-change regressions.
"""

import numpy as np
import pandas as pd
from pathlib import Path

BASE = Path("/sessions/adoring-magical-franklin/mnt/cr rating")
panel = pd.read_pickle(BASE / "_panel_scales.pkl").copy()
panel = panel.dropna(subset=["score_60", "GDP_USD"]).copy()

# -------------------------------------------------------------------
# Weights -----------------------------------------------------------
panel["w_gdp_t"]  = panel.groupby("Year")["GDP_USD"].transform(
    lambda g: g / g.sum())
panel["w_pop_t"]  = panel.groupby("Year")["Population"].transform(
    lambda g: g / g.sum())

g08 = panel.loc[panel["Year"] == 2008, ["Country", "GDP_USD"]].rename(
    columns={"GDP_USD": "GDP_2008_loc"})
panel = panel.merge(g08, on="Country", how="left")
panel["w_gdp2008_t"] = panel.groupby("Year")["GDP_2008_loc"].transform(
    lambda g: g / g.sum())

# -------------------------------------------------------------------
# World means by year ------------------------------------------------
def w_mean(s, w):
    s = s.dropna()
    w = w.reindex(s.index)
    return (s * w).sum() / w.sum()

stats = []
for yr, sub in panel.groupby("Year"):
    s = sub["score_60"]
    if s.notna().sum() < 10:
        continue
    stats.append({
        "Year": yr,
        "n":    int(s.notna().sum()),
        "eq_mean":      s.mean(),
        "gdp_mean":     w_mean(s, sub["w_gdp_t"]),
        "gdp08_mean":   w_mean(s, sub["w_gdp2008_t"]),
        "pop_mean":     w_mean(s, sub["w_pop_t"]),
        "median":       s.median(),
        "sd":           s.std(),
        "max":          s.max(),
        "min":          s.min(),
        # GDP-weighted second moment for z_gdp
        "gdp_var":      (sub["w_gdp_t"] *
                         (s - w_mean(s, sub["w_gdp_t"])) ** 2).sum(),
    })
ws = pd.DataFrame(stats)
ws["gdp_sd"] = np.sqrt(ws["gdp_var"])
panel = panel.merge(ws, on="Year", how="left")

# -------------------------------------------------------------------
# Relativizations ---------------------------------------------------
panel["rel_eq"]        = panel["score_60"] - panel["eq_mean"]
panel["rel_gdp"]       = panel["score_60"] - panel["gdp_mean"]
panel["rel_gdp2008"]   = panel["score_60"] - panel["gdp08_mean"]
panel["rel_pop"]       = panel["score_60"] - panel["pop_mean"]
panel["rel_median"]    = panel["score_60"] - panel["median"]

panel["z_eq"]    = (panel["score_60"] - panel["eq_mean"]) / panel["sd"]
panel["z_gdp"]   = (panel["score_60"] - panel["gdp_mean"]) / panel["gdp_sd"]

# percentile rank within year
panel["pct_rank"] = panel.groupby("Year")["score_60"].rank(pct=True)

panel["norm_max"] = panel["score_60"] / panel["max"]
panel["norm_min"] = (panel["score_60"] - panel["min"]) \
                  / (panel["max"] - panel["min"])

# -------------------------------------------------------------------
# Yearly first-differences (Δ)
# -------------------------------------------------------------------
panel = panel.sort_values(["Country", "Year"])
for c in ["rel_eq", "rel_gdp", "rel_gdp2008", "rel_pop",
          "rel_median", "z_eq", "z_gdp", "pct_rank"]:
    panel[f"d_{c}"] = panel.groupby("Country")[c].diff()

# -------------------------------------------------------------------
out_cols = ["Country", "ISO2", "ISO3", "Year", "score_60",
            "rel_eq", "rel_gdp", "rel_gdp2008", "rel_pop", "rel_median",
            "z_eq", "z_gdp", "pct_rank", "norm_max", "norm_min",
            "d_rel_eq", "d_rel_gdp", "d_rel_gdp2008", "d_rel_pop",
            "d_rel_median", "d_z_eq", "d_z_gdp", "d_pct_rank",
            "eq_mean", "gdp_mean", "gdp08_mean", "pop_mean", "median",
            "sd", "gdp_sd", "max", "min", "n"]
out = panel[out_cols].copy()
out.to_pickle(BASE / "_de_relative_panel.pkl")
out.to_csv(BASE / "de_relative_panel.csv", index=False)
print(f"Saved _de_relative_panel.pkl  ({out.shape})")

# -------------------------------------------------------------------
# Quick correlation between relativization variants
# -------------------------------------------------------------------
rel_cols = ["rel_eq", "rel_gdp", "rel_gdp2008", "rel_pop", "rel_median",
            "z_eq", "z_gdp", "pct_rank", "norm_max", "norm_min"]
corr = panel[rel_cols].corr().round(3)
corr.to_csv(BASE / "de_relative_correlation.csv")
print("\nCross-method correlation:")
print(corr)

# Comparison with our existing M1 (LOO mean dev) and M2 (LOO z) for World group
rel_old = pd.read_pickle(BASE / "_rel_ratings_all.pkl")
rel_old_world = rel_old[rel_old["Group"] == "World"][
    ["Country","Year","M1","M2","M3","M4"]]
out_w = out.merge(rel_old_world, on=["Country","Year"], how="inner")
print("\nCorrelation between Basu/De RR variants and our existing M1-M4 (World):")
print(out_w[["rel_eq","rel_gdp","rel_pop","z_eq","M1","M2","M3","M4"]
            ].corr().round(3))
