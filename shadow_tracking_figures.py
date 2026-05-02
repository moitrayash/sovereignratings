"""
shadow_tracking_figures.py
Builds the diagnostic plots that answer "how well does the actual composite
score track the shadow (fundamentals-based) rating?"
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

BASE = Path("/sessions/adoring-magical-franklin/mnt/cr rating")
panel = pd.read_pickle(BASE / "_shadow_panel.pkl").copy()
panel = panel.dropna(subset=["CompositeScore", "Shadow_score"])

# ---- 1) actual vs shadow scatter (all years) ---------------------
fig, ax = plt.subplots(figsize=(8, 8))
sns.scatterplot(data=panel, x="Shadow_score", y="CompositeScore",
                hue="Year", palette="viridis",
                size="GDP_USD", sizes=(8, 280), alpha=0.6,
                edgecolor="none", legend=False, ax=ax)
ax.plot([0, 60], [0, 60], "k--", lw=1, alpha=0.6, label="45° (perfect)")
ax.set_xlabel("Shadow score (predicted from fundamentals)")
ax.set_ylabel("Actual agency-composite score")
ax.set_title("Actual vs Shadow rating, 2000–2025 panel\n"
             f"R²={1 - ((panel['CompositeScore']-panel['Shadow_score'])**2).sum()/((panel['CompositeScore']-panel['CompositeScore'].mean())**2).sum():.3f}, "
             f"RMSE={np.sqrt(((panel['CompositeScore']-panel['Shadow_score'])**2).mean()):.2f}, "
             f"N={len(panel)}",
             fontsize=11)
ax.set_xlim(0, 60); ax.set_ylim(0, 60)
ax.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(BASE / "fig16_shadow_actual_scatter.png", dpi=140, bbox_inches="tight")
plt.close()

# ---- 2) Largest residuals (most under- and over-rated) -----------
panel["resid"] = panel["CompositeScore"] - panel["Shadow_score"]
latest = panel.sort_values("Year").groupby("Country").tail(1).copy()
latest = latest.sort_values("resid")

fig, axes = plt.subplots(1, 2, figsize=(15, 8))
under = latest.head(20).iloc[::-1]
over  = latest.tail(20)
axes[0].barh(under["Country"], under["resid"], color="#d62728")
axes[0].set_title("Most UNDER-RATED (actual - shadow, latest year per country)")
axes[0].axvline(0, color="black", lw=0.6)
axes[0].set_xlabel("Actual minus Shadow (negative = harsher than fundamentals predict)")

axes[1].barh(over["Country"], over["resid"], color="#2ca02c")
axes[1].set_title("Most OVER-RATED (actual - shadow, latest year per country)")
axes[1].axvline(0, color="black", lw=0.6)
axes[1].set_xlabel("Actual minus Shadow (positive = friendlier than fundamentals predict)")

plt.tight_layout()
plt.savefig(BASE / "fig17_shadow_residuals_topbot.png", dpi=140, bbox_inches="tight")
plt.close()

# ---- 3) Average residual over time, by income group --------------
mem = pd.read_pickle(BASE / "_membership.pkl").reset_index()
inc_cols = ["WB_High_Income","WB_Upper_Middle_Income",
            "WB_Lower_Middle_Income","WB_Low_Income"]
mem_inc = mem[["Country"] + inc_cols].copy()
def income_class(row):
    for c in inc_cols:
        if row[c] == 1: return c.replace("WB_","")
    return "Unknown"
mem_inc["IncomeGroup"] = mem_inc.apply(income_class, axis=1)
panel = panel.merge(mem_inc[["Country","IncomeGroup"]], on="Country", how="left")

trend = (panel.groupby(["Year","IncomeGroup"])["resid"]
              .mean().unstack())
fig, ax = plt.subplots(figsize=(11, 6))
trend.plot(ax=ax, marker="o", lw=1.5)
ax.axhline(0, color="black", lw=0.7)
ax.set_title("Average rating residual (Actual − Shadow) by income group")
ax.set_ylabel("Notches (composite score scale)")
ax.grid(alpha=0.3)
ax.legend(loc="best", fontsize=9)
plt.tight_layout()
plt.savefig(BASE / "fig18_shadow_resid_by_income.png", dpi=140, bbox_inches="tight")
plt.close()

# ---- 4) Continent residual heatmap --------------------------------
cont_cols = ["Africa","Asia","Europe","North_America","South_America","Oceania"]
mem_c = mem[["Country"] + cont_cols].copy()
def cont_class(row):
    for c in cont_cols:
        if row[c] == 1: return c
    return "Unknown"
mem_c["Continent"] = mem_c.apply(cont_class, axis=1)
panel = panel.merge(mem_c[["Country","Continent"]], on="Country", how="left")

heat = (panel.groupby(["Continent","Year"])["resid"]
             .mean().unstack())
fig, ax = plt.subplots(figsize=(13, 4.5))
sns.heatmap(heat, cmap="RdBu_r", center=0, ax=ax,
            cbar_kws={"label": "Notches above/below fundamentals"})
ax.set_title("Average residual (Actual − Shadow) by continent × year")
plt.tight_layout()
plt.savefig(BASE / "fig19_shadow_resid_continent_heatmap.png",
            dpi=140, bbox_inches="tight")
plt.close()

# ---- 5) Per-country scorecard table ------------------------------
score = []
for c, g in panel.groupby("Country"):
    if len(g) < 5: continue
    score.append({
        "Country": c,
        "Years": len(g),
        "Avg_Actual": g["CompositeScore"].mean(),
        "Avg_Shadow": g["Shadow_score"].mean(),
        "Avg_Residual": g["resid"].mean(),
        "RMSE": np.sqrt((g["resid"]**2).mean()),
        "MaxAbsResid": g["resid"].abs().max(),
        "TrendResid": g["resid"].diff().mean(),
        "Continent": g["Continent"].iloc[0],
        "IncomeGroup": g["IncomeGroup"].iloc[0],
    })
sc = pd.DataFrame(score).sort_values("Avg_Residual")
sc.to_csv(BASE / "shadow_scorecard.csv", index=False)

print("Saved figures 16-19, shadow_scorecard.csv")
print("\nTop 10 most UNDER-rated (actual - shadow most negative):")
print(sc.head(10)[["Country","Avg_Actual","Avg_Shadow","Avg_Residual","RMSE",
                   "Continent","IncomeGroup"]].to_string(index=False))
print("\nTop 10 most OVER-rated (actual - shadow most positive):")
print(sc.tail(10)[["Country","Avg_Actual","Avg_Shadow","Avg_Residual","RMSE",
                   "Continent","IncomeGroup"]].to_string(index=False))

# Aggregate by region (key for the Africa narrative in UNDP report)
region = (sc.groupby("Continent")[["Avg_Actual","Avg_Shadow","Avg_Residual","RMSE"]]
            .mean().round(2))
region.to_csv(BASE / "shadow_residual_by_continent.csv")
print("\nResidual by continent (Avg actual - shadow):")
print(region)
