"""
relative_ratings.py
-------------------
Computes relative/comparative rating statistics for the sovereign credit
ratings panel.  Produces three outputs saved to BASE:

  _relative_ratings.pkl  — mean, SD, GDP-weighted mean, GDP-weighted SD
                           per category × year (61 groupings × 26 years)
  _world_stats.pkl       — same stats computed over ALL rated countries
                           per year (the global reference distribution)
  _panel_zscores.pkl     — panel_macro extended with z_global and
                           z_global_gdp for every country × year

Also renders and saves fig7_z_distributions.png — overlaid density
histograms of z_global and z_global_gdp.

Usage
-----
    python relative_ratings.py

Assumes the following pickles already exist in BASE (created by the
earlier cleaning / panel-construction script):
    _panel_macro.pkl   — country × year panel with CompositeScore + macro
    _membership.pkl    — country × 61 grouping indicator columns
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker

# ── Configuration ─────────────────────────────────────────────────────────────

BASE = "C:/Users/yashm/OneDrive - Cornell University/Desktop/Research/credit rating/cr rating/"

# ── Load data ─────────────────────────────────────────────────────────────────

print("Loading pickles …")
panel_macro = pd.read_pickle(BASE + "_panel_macro.pkl")
membership  = pd.read_pickle(BASE + "_membership.pkl")

# Merge grouping flags into the panel
df = panel_macro.merge(membership, on="Country", how="left")

# All 61 binary grouping columns (everything in membership except 'Country')
group_cols = [c for c in membership.columns if c != "Country"]

print(f"  panel_macro : {panel_macro.shape}")
print(f"  membership  : {membership.shape}  ({len(group_cols)} group columns)")
print(f"  merged      : {df.shape}")

# ── Helper: GDP-weighted mean and (population) SD ─────────────────────────────

def _gdp_weighted_stats(sub):
    """
    Given a slice with columns CompositeScore and GDP_USD, return the
    GDP-weighted mean and population SD.  Requires at least 2 non-null rows;
    returns NaN otherwise.
    """
    valid = sub[["CompositeScore", "GDP_USD"]].dropna()
    n = len(valid)
    if n < 2:
        return pd.Series({"N_gdp": n, "gdp_wmean": np.nan, "gdp_wsd": np.nan})
    w     = valid["GDP_USD"]
    x     = valid["CompositeScore"]
    W     = w.sum()
    wmean = (w * x).sum() / W
    wvar  = (w * (x - wmean) ** 2).sum() / W   # population-weighted variance
    return pd.Series({"N_gdp": n, "gdp_wmean": wmean, "gdp_wsd": np.sqrt(wvar)})


# ─────────────────────────────────────────────────────────────────────────────
# 1.  Relative ratings: mean, SD, GDP-weighted mean, GDP-weighted SD
#     per category × year
# ─────────────────────────────────────────────────────────────────────────────

print("\nComputing per-category × year stats …")

records_simple = []
records_gdp    = []

for col in group_cols:
    members = df[df[col] == 1]

    # Simple stats
    stats = (
        members.groupby("Year")["CompositeScore"]
        .agg(N="count", mean="mean", sd="std")
        .reset_index()
    )
    stats.insert(0, "Category", col)
    records_simple.append(stats)

    # GDP-weighted stats
    gdp_stats = (
        members[["Year", "CompositeScore", "GDP_USD"]]
        .groupby("Year")
        .apply(_gdp_weighted_stats, include_groups=False)
        .reset_index()
    )
    gdp_stats.insert(0, "Category", col)
    records_gdp.append(gdp_stats)

simple_stats  = pd.concat(records_simple, ignore_index=True)
gdp_stats_df  = pd.concat(records_gdp,   ignore_index=True)

relative = (
    simple_stats
    .merge(gdp_stats_df, on=["Category", "Year"], how="left")
    [["Category", "Year", "N", "mean", "sd", "N_gdp", "gdp_wmean", "gdp_wsd"]]
    .sort_values(["Category", "Year"])
    .reset_index(drop=True)
)

relative.to_pickle(BASE + "_relative_ratings.pkl")
print(f"  Saved _relative_ratings.pkl  {relative.shape}")


# ─────────────────────────────────────────────────────────────────────────────
# 2.  World (global) stats per year
# ─────────────────────────────────────────────────────────────────────────────

print("\nComputing world stats per year …")

world_simple = (
    panel_macro.groupby("Year")["CompositeScore"]
    .agg(world_N="count", world_mean="mean", world_sd="std")
    .reset_index()
)

world_gdp = (
    panel_macro[["Year", "CompositeScore", "GDP_USD"]]
    .groupby("Year")
    .apply(_gdp_weighted_stats, include_groups=False)
    .reset_index()
    .rename(columns={"N_gdp": "world_N_gdp",
                     "gdp_wmean": "world_gdp_wmean",
                     "gdp_wsd":   "world_gdp_wsd"})
)

world_stats = world_simple.merge(world_gdp, on="Year")

world_stats.to_pickle(BASE + "_world_stats.pkl")
print(f"  Saved _world_stats.pkl  {world_stats.shape}")
print(world_stats.to_string(index=False))


# ─────────────────────────────────────────────────────────────────────────────
# 3.  Z-scores per country × year
#
#     z_global     = (score - world_mean)     / world_sd
#     z_global_gdp = (score - world_gdp_wmean) / world_gdp_wsd
#
#     Both are kept unconverted (raw z-scores, not percentiles or ranks).
# ─────────────────────────────────────────────────────────────────────────────

print("\nComputing z-scores …")

panel_z = panel_macro.merge(world_stats, on="Year", how="left")

panel_z["z_global"] = (
    (panel_z["CompositeScore"] - panel_z["world_mean"])
    / panel_z["world_sd"]
)

panel_z["z_global_gdp"] = (
    (panel_z["CompositeScore"] - panel_z["world_gdp_wmean"])
    / panel_z["world_gdp_wsd"]
)

panel_z.to_pickle(BASE + "_panel_zscores.pkl")
print(f"  Saved _panel_zscores.pkl  {panel_z.shape}")
print(f"  z_global     nulls : {panel_z['z_global'].isna().sum()}"
      "  (years with only 1 rated country → world_sd = NaN)")
print(f"  z_global_gdp nulls : {panel_z['z_global_gdp'].isna().sum()}"
      "  (2025 has no WB GDP; Guinea & Taiwan throughout)")


# ─────────────────────────────────────────────────────────────────────────────
# 4.  Figure: density distributions of z_global and z_global_gdp
# ─────────────────────────────────────────────────────────────────────────────

print("\nRendering fig7_z_distributions.png …")

z1 = panel_z["z_global"].dropna().values
z2 = panel_z["z_global_gdp"].dropna().values

bins = np.linspace(-5, 2, 71)

fig, ax = plt.subplots(figsize=(9, 4.5))

ax.hist(z1, bins=bins, density=True, alpha=0.45, color="#3266ad",
        label=f"z_global  (μ={z1.mean():.2f}, σ={z1.std():.2f}, N={len(z1):,})")
ax.hist(z2, bins=bins, density=True, alpha=0.45, color="#d85a30",
        label=f"z_global_gdp  (μ={z2.mean():.2f}, σ={z2.std():.2f}, N={len(z2):,})")

# Vertical reference lines at each mean
ax.axvline(z1.mean(), color="#3266ad", linewidth=1.4, linestyle="--")
ax.axvline(z2.mean(), color="#d85a30", linewidth=1.4, linestyle="--")

ax.set_xlabel("z-score", fontsize=11)
ax.set_ylabel("density", fontsize=11)
ax.set_title("Distribution of z_global vs z_global_gdp  (all country-years, 2000–2025)",
             fontsize=11)
ax.legend(fontsize=9)
ax.xaxis.set_minor_locator(mticker.AutoMinorLocator())
ax.yaxis.set_minor_locator(mticker.AutoMinorLocator())
ax.grid(axis="y", alpha=0.3)
fig.tight_layout()
fig.savefig(BASE + "fig7_z_distributions.png", dpi=150)
plt.close(fig)
print("  Saved fig7_z_distributions.png")

print("\nDone.")
