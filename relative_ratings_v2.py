#!/usr/bin/env python3
"""
relative_ratings_v2.py
======================
Computes per-country relative ratings across every (country, year, group) triple.

Methods
-------
M1  Current-period %dev  : rel = score * (1 + (score - loo_mean) / loo_mean)
                           loo_mean = group mean excluding focal country (same year)
M2  Rank                 : ordinal rank within group-year (1 = lowest score)
M3  Lagged-mean %dev     : rel = score_t * (1 + (score_t - group_mean_{t-1}) / group_mean_{t-1})
                           benchmark is full group mean (including i) from prior year
M4  Percentile           : empirical CDF rank within group-year (0–1)

Ingroup parity
--------------
Gini coefficient per (group, year) — measures score inequality within each group.
G = sum|x_i - x_j| / (2 * n^2 * mean)

Outputs
-------
_rel_ratings_all.pkl     long frame: Country, Year, Group, GroupSize,
                         Score, M1, M2, M3, M4, M1_delta, M3_delta
_gini_groups.pkl         Gini + descriptive stats per (Group, Year, GroupSize)
fig12_rr_distributions.png
fig13_top_movers.png
fig14_gini_heatmap.png
"""

import warnings; warnings.filterwarnings("ignore")
import pandas as pd
import numpy as np
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

BASE    = Path("/sessions/bold-adoring-clarke/mnt/cr rating/")
PALETTE = sns.color_palette("tab10")
sns.set_theme(style="whitegrid", font_scale=0.9)

# ── load ──────────────────────────────────────────────────────────────────────
panel      = pd.read_pickle(BASE / "_panel_gdppc.pkl")[["Country","ISO2","Year","CompositeScore"]].dropna()
membership = pd.read_pickle(BASE / "_membership.pkl")   # Country + 61 binary cols
GROUP_COLS = [c for c in membership.columns if c != "Country"]

# ── build long (Country, Group) membership table ──────────────────────────────
mem_long = (
    membership.melt(id_vars="Country", var_name="Group", value_name="IsMember")
    .query("IsMember == 1")[["Country","Group"]]
)
# add World (every country with a score is in World)
world = pd.DataFrame({"Country": panel["Country"].unique(), "Group": "World"})
mem_long = pd.concat([mem_long, world], ignore_index=True)

# ── merge scores onto (Country, Year, Group) ──────────────────────────────────
data = panel.merge(mem_long, on="Country", how="inner")
# data shape: (country-year-group triples with a score)

print(f"Triples (country × year × group): {len(data):,}")
print(f"Unique groups: {data['Group'].nunique()}  "
      f"(61 predefined + World = 62)")

# ── group-level stats per (Group, Year) ──────────────────────────────────────
grp = (data.groupby(["Group","Year"])["CompositeScore"]
       .agg(group_sum="sum", group_n="count", group_mean="mean")
       .reset_index())

data = data.merge(grp, on=["Group","Year"])

# ── M1: leave-one-out mean & current %dev ────────────────────────────────────
# loo_mean = (group_sum - score_i) / (group_n - 1)
data["loo_mean"] = (data["group_sum"] - data["CompositeScore"]) / (data["group_n"] - 1)
data["pct_dev_M1"] = (data["CompositeScore"] - data["loo_mean"]) / data["loo_mean"]
data["M1"] = data["CompositeScore"] * (1 + data["pct_dev_M1"])
# Note: M1 = score^2 / loo_mean by algebra

# ── M2: rank within group-year (ascending; 1 = lowest score) ─────────────────
data["M2"] = data.groupby(["Group","Year"])["CompositeScore"].rank(method="average", ascending=True)

# ── M3: lagged group mean %dev ────────────────────────────────────────────────
grp_lag = grp.copy()
grp_lag["Year"] = grp_lag["Year"] + 1          # shift: "last year's mean" used in current year
grp_lag = grp_lag.rename(columns={"group_mean": "group_mean_lag"})[["Group","Year","group_mean_lag"]]
data = data.merge(grp_lag, on=["Group","Year"], how="left")

data["pct_dev_M3"] = (data["CompositeScore"] - data["group_mean_lag"]) / data["group_mean_lag"]
data["M3"] = data["CompositeScore"] * (1 + data["pct_dev_M3"])

# ── M4: percentile within group-year (0–1) ────────────────────────────────────
data["M4"] = data.groupby(["Group","Year"])["CompositeScore"].rank(pct=True, method="average")

# ── year-over-year deltas for M1 and M3 ──────────────────────────────────────
data = data.sort_values(["Country","Group","Year"])
data["M1_delta"] = data.groupby(["Country","Group"])["M1"].diff()
data["M3_delta"] = data.groupby(["Country","Group"])["M3"].diff()

# ── clean up & save ───────────────────────────────────────────────────────────
keep = ["Country","ISO2","Year","Group","group_n","CompositeScore",
        "loo_mean","pct_dev_M1","M1","M2","M3","M4","M1_delta","M3_delta"]
out = data[keep].rename(columns={"group_n":"GroupSize"})

# filter: drop group-years with < 3 members (loo_mean undefined or trivial)
out = out[out["GroupSize"] >= 3]

out.to_pickle(BASE / "_rel_ratings_all.pkl")
print(f"\nSaved _rel_ratings_all.pkl  shape={out.shape}")

# ── GINI per (Group, Year) ────────────────────────────────────────────────────
def gini(arr):
    a = np.array(arr, dtype=float)
    a = a[~np.isnan(a)]
    n = len(a)
    if n < 3 or a.mean() == 0:
        return np.nan
    return np.sum(np.abs(a[:, None] - a[None, :])) / (2 * n**2 * a.mean())

gini_rows = []
for (grp_name, yr), sub in data.groupby(["Group","Year"]):
    scores = sub["CompositeScore"].dropna().values
    if len(scores) < 3:
        continue
    gini_rows.append({
        "Group":   grp_name,
        "Year":    yr,
        "N":       len(scores),
        "Gini":    gini(scores),
        "Mean":    scores.mean(),
        "SD":      scores.std(),
        "Range":   scores.max() - scores.min(),
        "P25":     np.percentile(scores, 25),
        "P75":     np.percentile(scores, 75),
        "IQR":     np.percentile(scores, 75) - np.percentile(scores, 25),
    })
gini_df = pd.DataFrame(gini_rows)
gini_df.to_pickle(BASE / "_gini_groups.pkl")
print(f"Saved _gini_groups.pkl       shape={gini_df.shape}")

# ══════════════════════════════════════════════════════════════════════════════
# ANALYSIS
# ══════════════════════════════════════════════════════════════════════════════

print("\n── SD & Range comparison ────────────────────────────────────────────────")
world_out = out[out["Group"] == "World"].dropna(subset=["M1","M3"])
stats_compare = pd.DataFrame({
    "AbsScore":  world_out["CompositeScore"].describe(),
    "M1 (curr)": world_out["M1"].describe(),
    "M3 (lagg)": world_out["M3"].describe(),
    "M4 (pctile)":world_out["M4"].describe(),
}).round(3)
print(stats_compare.to_string())

print("\n── Top 20 fastest M1 rises (world group, YoY) ───────────────────────────")
top_rises = (out[out["Group"]=="World"]
             .dropna(subset=["M1_delta"])
             .nlargest(20, "M1_delta")[["Country","Year","CompositeScore","M1","M1_delta"]]
             .reset_index(drop=True))
print(top_rises.to_string())

print("\n── Top 20 fastest M1 drops (world group, YoY) ───────────────────────────")
top_drops = (out[out["Group"]=="World"]
             .dropna(subset=["M1_delta"])
             .nsmallest(20, "M1_delta")[["Country","Year","CompositeScore","M1","M1_delta"]]
             .reset_index(drop=True))
print(top_drops.to_string())

print("\n── Gini by group (2024, top-20 most unequal, min N=5) ──────────────────")
gini_2024 = (gini_df[gini_df["Year"]==2024]
             .query("N >= 5")
             .sort_values("Gini", ascending=False)
             .head(20)[["Group","N","Gini","Mean","SD","Range"]]
             .reset_index(drop=True))
print(gini_2024.round(3).to_string())

print("\n── Gini trend (World group, all years) ──────────────────────────────────")
world_gini = gini_df[gini_df["Group"]=="World"].sort_values("Year")
print(world_gini[["Year","N","Gini","Mean","SD"]].round(3).to_string())

# ══════════════════════════════════════════════════════════════════════════════
# FIGURES
# ══════════════════════════════════════════════════════════════════════════════

# ── Fig 12: Distribution comparison ──────────────────────────────────────────
fig, axes = plt.subplots(1, 3, figsize=(15, 4))
fig.suptitle("Fig 12 — Score Distributions: Absolute vs Relative Ratings (World group)",
             fontsize=11, fontweight="bold")

wd = out[out["Group"] == "World"].dropna(subset=["M1","M3","M4"])

# Panel A: Absolute vs M1
ax = axes[0]
ax.hist(wd["CompositeScore"], bins=30, alpha=0.55, color=PALETTE[0],
        label=f"Absolute  σ={wd['CompositeScore'].std():.2f}", density=True)
ax.hist(wd["M1"], bins=30, alpha=0.55, color=PALETTE[1],
        label=f"M1 curr  σ={wd['M1'].std():.2f}", density=True)
ax.set_xlabel("Score"); ax.set_ylabel("Density")
ax.set_title("Absolute vs M1 (current-period %dev)")
ax.legend(fontsize=8); ax.grid(alpha=0.3)

# Panel B: Absolute vs M3
ax = axes[1]
ax.hist(wd["CompositeScore"], bins=30, alpha=0.55, color=PALETTE[0],
        label=f"Absolute  σ={wd['CompositeScore'].std():.2f}", density=True)
ax.hist(wd["M3"], bins=30, alpha=0.55, color=PALETTE[2],
        label=f"M3 lagg  σ={wd['M3'].std():.2f}", density=True)
ax.set_xlabel("Score")
ax.set_title("Absolute vs M3 (lagged-mean %dev)")
ax.legend(fontsize=8); ax.grid(alpha=0.3)

# Panel C: M4 percentile distribution (should be ~uniform if scores varied)
ax = axes[2]
ax.hist(wd["M4"], bins=20, alpha=0.75, color=PALETTE[3], density=True)
ax.axhline(1.0, color="black", ls="--", lw=1, alpha=0.5, label="Uniform reference")
ax.set_xlabel("Percentile (M4)"); ax.set_title("M4: within-world percentile dist.")
ax.legend(fontsize=8); ax.grid(alpha=0.3)

plt.tight_layout()
fig.savefig(BASE / "fig12_rr_distributions.png", dpi=150, bbox_inches="tight")
plt.close(fig)
print("\nSaved fig12_rr_distributions.png")

# ── Fig 13: Top movers ────────────────────────────────────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(15, 6))
fig.suptitle("Fig 13 — Fastest Year-over-Year Relative Rating Changes (M1, World group)\n"
             "M1 = score² / leave-one-out world mean",
             fontsize=11, fontweight="bold")

for ax, df, title, color in [
    (axes[0], top_rises, "Top 20 Rises", "#27ae60"),
    (axes[1], top_drops, "Top 20 Drops", "#c0392b"),
]:
    labels = [f"{r['Country']} ({int(r['Year'])})" for _, r in df.iterrows()]
    vals   = df["M1_delta"].values
    ax.barh(range(len(vals)), vals[::-1], color=color, alpha=0.8)
    ax.set_yticks(range(len(vals)))
    ax.set_yticklabels(labels[::-1], fontsize=8)
    ax.axvline(0, color="black", lw=0.8, ls="--", alpha=0.4)
    ax.set_xlabel("ΔM1 (year-over-year)")
    ax.set_title(title)
    # annotate with absolute score
    for i, (_, r) in enumerate(df.iloc[::-1].iterrows()):
        ax.text(r["M1_delta"] * 1.01, len(df)-1-i,
                f"score={r['CompositeScore']:.0f}", va="center", fontsize=7, color="dimgrey")
    ax.grid(axis="x", alpha=0.25)

plt.tight_layout()
fig.savefig(BASE / "fig13_top_movers.png", dpi=150, bbox_inches="tight")
plt.close(fig)
print("Saved fig13_top_movers.png")

# ── Fig 14: Gini heatmap ──────────────────────────────────────────────────────
# Select groups with complete data across years and N >= 5
pivot_groups = (gini_df.query("N >= 5")
                .groupby("Group")["Year"].nunique())
good_groups = pivot_groups[pivot_groups >= 15].index.tolist()

# Remove very large catch-all groups that would swamp the heatmap
exclude = ["World"]  # keep World separate
plot_groups = [g for g in good_groups if g not in exclude]

gini_pivot = (gini_df[gini_df["Group"].isin(plot_groups)]
              .pivot(index="Group", columns="Year", values="Gini"))

# Sort by mean Gini descending
gini_pivot = gini_pivot.loc[gini_pivot.mean(axis=1).sort_values(ascending=False).index]

fig, axes = plt.subplots(1, 2, figsize=(18, max(5, len(plot_groups) * 0.28 + 2)),
                         gridspec_kw={"width_ratios": [4, 1]})
fig.suptitle("Fig 14 — Gini Coefficient of Credit Scores Within Each Group\n"
             "(higher = more unequal within-group; min 5 members, ≥15 year coverage)",
             fontsize=11, fontweight="bold")

sns.heatmap(gini_pivot, ax=axes[0], cmap="YlOrRd", linewidths=0.3,
            linecolor="#ddd", fmt=".2f", annot=False,
            vmin=0, vmax=gini_pivot.values[~np.isnan(gini_pivot.values)].max(),
            cbar_kws={"label": "Gini coefficient"})
axes[0].set_xlabel("Year"); axes[0].set_ylabel("")
axes[0].set_title("Gini by group × year")

# Right panel: mean Gini bar chart (sorted)
mean_gini = gini_pivot.mean(axis=1)
axes[1].barh(range(len(mean_gini)), mean_gini.values[::-1], color=PALETTE[1], alpha=0.8)
axes[1].set_yticks(range(len(mean_gini)))
axes[1].set_yticklabels(mean_gini.index[::-1].tolist(), fontsize=7.5)
axes[1].set_xlabel("Mean Gini (all years)")
axes[1].set_title("Mean Gini")
axes[1].grid(axis="x", alpha=0.3)

plt.tight_layout()
fig.savefig(BASE / "fig14_gini_heatmap.png", dpi=150, bbox_inches="tight")
plt.close(fig)
print("Saved fig14_gini_heatmap.png")

# ── Also: World Gini over time (separate small plot) ─────────────────────────
world_gini_sorted = world_gini.sort_values("Year")
fig, ax = plt.subplots(figsize=(9, 4))
ax.plot(world_gini_sorted["Year"], world_gini_sorted["Gini"],
        "o-", color=PALETTE[0], lw=2, markersize=5)
ax.fill_between(world_gini_sorted["Year"], 0, world_gini_sorted["Gini"],
                alpha=0.1, color=PALETTE[0])
ax.set_xlabel("Year"); ax.set_ylabel("Gini coefficient")
ax.set_title("Fig 14b — World Credit-Rating Gini (intra-world score inequality, 2000–2025)")
ax.grid(alpha=0.3)
fig.tight_layout()
fig.savefig(BASE / "fig14b_world_gini.png", dpi=150, bbox_inches="tight")
plt.close(fig)
print("Saved fig14b_world_gini.png")

print("\n✓ All done.")
