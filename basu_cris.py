"""
basu_cris.py
Implements the Basu, De, Ratha, Timmer (2013) "Relative Risk Rating" / CRIS for
the full panel.

Definitions (verbatim from WPS 6641 §6):
    RR_it = r_it - Σ_j w_j r_jt
where r_it is the rating of country i in time t, and w_i is the share of
country i's GDP in world GDP. In Basu's convention, smaller r = better rating
and a negative RR = better than world average.

We compute three variants:
    (1) RR_basu  : on Basu's 1-60 scale, GDP-weighted, *negative = better*
                   (their original)
    (2) RR_basu_score60 : on our 0-60 scale, GDP-weighted, *positive = better*
                          than world average. Same information, our sign convention.
    (3) RR_basu_2008w : Basu also fixed the GDP weights at 2008 to "avoid
                        confusion from changes in GDP over time". We replicate.

In addition we compute a CRIS-style index:
    CRIS_it = 100 * Σ_j w_j r_jt / r_it       (1 country relative to world)
in our score_60 direction, so that CRIS > 100 means worse than world avg.

Everything is saved to _basu_cris_panel.pkl and basu_cris_panel.csv.
"""

import numpy as np
import pandas as pd
from pathlib import Path

BASE = Path("/sessions/adoring-magical-franklin/mnt/cr rating")
panel = pd.read_pickle(BASE / "_panel_scales.pkl").copy()

# Use score_basu60 (1=best, 60=worst) for the original RR formulation.
panel = panel.dropna(subset=["score_basu60", "GDP_USD"]).copy()

# ---- (a) GDP weights: time-varying ------------------------------------
panel["w_t"] = panel.groupby("Year")["GDP_USD"].transform(
    lambda g: g / g.sum())

# ---- (b) GDP weights: fixed at 2008 (Basu's choice) -------------------
gdp_2008 = (
    panel.loc[panel["Year"] == 2008, ["Country", "GDP_USD"]]
         .rename(columns={"GDP_USD": "GDP_2008"})
)
panel = panel.merge(gdp_2008, on="Country", how="left")
panel["w_2008"] = panel.groupby("Year")["GDP_2008"].transform(
    lambda g: g / g.sum())

# ---- (c) World averages: time-varying weights -------------------------
def weighted_world_mean(df, score_col, weight_col):
    sub = df.dropna(subset=[score_col, weight_col])
    return (sub[score_col] * sub[weight_col]).sum() / sub[weight_col].sum()

world_means = []
for yr, sub in panel.groupby("Year"):
    avg_basu_t = weighted_world_mean(sub, "score_basu60", "w_t")
    avg_basu_2008 = weighted_world_mean(sub, "score_basu60", "w_2008")
    avg_60_t = weighted_world_mean(sub, "score_60", "w_t")
    avg_60_2008 = weighted_world_mean(sub, "score_60", "w_2008")
    world_means.append({
        "Year": yr,
        "world_avg_basu_t": avg_basu_t,
        "world_avg_basu_2008": avg_basu_2008,
        "world_avg_60_t": avg_60_t,
        "world_avg_60_2008": avg_60_2008,
    })
world = pd.DataFrame(world_means)
panel = panel.merge(world, on="Year", how="left")

# ---- (d) Basu RR variants ---------------------------------------------
# (1) Basu's exact formula: smaller = better, negative RR = better-than-avg
panel["RR_basu_t"]      = panel["score_basu60"] - panel["world_avg_basu_t"]
panel["RR_basu_2008"]   = panel["score_basu60"] - panel["world_avg_basu_2008"]

# (2) Our-direction version: positive RR = better than avg
panel["RR_score60_t"]    = panel["score_60"] - panel["world_avg_60_t"]
panel["RR_score60_2008"] = panel["score_60"] - panel["world_avg_60_2008"]

# (3) CRIS-style ratio index (basu direction)
panel["CRIS_basu_t"] = 100.0 * panel["world_avg_basu_t"] / panel["score_basu60"]
panel["CRIS_basu_2008"] = 100.0 * panel["world_avg_basu_2008"] / panel["score_basu60"]

# (4) CRIS-style ratio index in our 0-60 direction (>100 = worse than avg)
panel["CRIS_score60_t"] = 100.0 * panel["world_avg_60_t"] / panel["score_60"]
panel["CRIS_score60_2008"] = 100.0 * panel["world_avg_60_2008"] / panel["score_60"]

# Save the result
out_cols = ["Country", "ISO2", "ISO3", "Year",
            "CompositeScore", "score_60", "score_basu60",
            "GDP_USD", "GDP_2008", "w_t", "w_2008",
            "world_avg_basu_t", "world_avg_basu_2008",
            "world_avg_60_t", "world_avg_60_2008",
            "RR_basu_t", "RR_basu_2008",
            "RR_score60_t", "RR_score60_2008",
            "CRIS_basu_t", "CRIS_basu_2008",
            "CRIS_score60_t", "CRIS_score60_2008",
            ]
out = panel[out_cols].copy()
out.to_pickle(BASE / "_basu_cris_panel.pkl")
out.to_csv(BASE / "basu_cris_panel.csv", index=False)
print(f"Saved _basu_cris_panel.pkl ({out.shape})")

# ---- (e) Quick diagnostics: world averages over time ------------------
print("\nWorld average rating (Basu scale, smaller=better) by year:")
ann = world.set_index("Year")
print(ann.round(2))

print("\nFirst 10 rows for India:")
ind = out[out["Country"] == "India"].sort_values("Year").head(10)
print(ind[["Year", "score_60", "RR_basu_t", "RR_score60_t",
           "CRIS_basu_t", "CRIS_score60_t"]].round(2).to_string(index=False))

print("\nFirst 10 rows for the United States:")
us = out[out["Country"] == "United States"].sort_values("Year").head(10)
print(us[["Year", "score_60", "RR_basu_t", "RR_score60_t",
          "CRIS_basu_t", "CRIS_score60_t"]].round(2).to_string(index=False))

# ---- (f) "Biggest movers" 2008 vs 2024 according to RR_basu_t ---------
def first_last_diff(g, col, yr_a, yr_b):
    a = g.loc[g["Year"] == yr_a, col].values
    b = g.loc[g["Year"] == yr_b, col].values
    if len(a) and len(b):
        return float(b[0] - a[0])
    return np.nan

movers = []
for c, g in out.groupby("Country"):
    rr_chg = first_last_diff(g, "RR_basu_t", 2008, 2024)
    if not np.isnan(rr_chg):
        movers.append({"Country": c, "RR_change_2008_2024": rr_chg})
mv = pd.DataFrame(movers).sort_values("RR_change_2008_2024")
print("\nTop 10 countries that improved most (RR fell ≤ 0 = better) 2008→2024:")
print(mv.head(10).round(2).to_string(index=False))
print("\nTop 10 countries that worsened most 2008→2024:")
print(mv.tail(10).round(2).to_string(index=False))

mv.to_csv(BASE / "basu_cris_movers_2008_2024.csv", index=False)
