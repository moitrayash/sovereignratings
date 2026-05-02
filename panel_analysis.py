#!/usr/bin/env python3
"""
panel_analysis.py  –  Sovereign Credit Ratings: Extended Panel Analysis
========================================================================
Steps
-----
1. GDP per capita         merge WB population → GDP_per_capita, log_GDPpc
2. Panel regressions      CompositeScore ~ macro controls | country + year FE
3. Ordered logit/probit   annual rating-transition direction (down/stable/up)
4. Agency divergence      pairwise |score_A – score_B| trends & country ranks
5. FDI inflows ~ score    panel FE (L1/L2 lags) + country-level OLS

Outputs
-------
_panel_gdppc.pkl              extended panel (adds Population, GDP_per_capita, logs)
regression_results.txt        linearmodels summaries (models A/B/C + pooled OLS)
ordered_model_results.txt     ordered logit + probit summaries
fdi_score_results.txt         panel FDI ~ score & score ~ FDI summaries
fig8_panel_regressions.png
fig9_ordered_model.png
fig10_agency_divergence.png
fig11_fdi_score_lags.png
"""

import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import seaborn as sns
from pathlib import Path

from linearmodels.panel import PanelOLS, PooledOLS
from statsmodels.miscmodels.ordinal_model import OrderedModel
import statsmodels.formula.api as smf

BASE    = Path("/sessions/bold-adoring-clarke/mnt/cr rating/")
PALETTE = sns.color_palette("tab10")
sns.set_theme(style="whitegrid", font_scale=0.9)

# ── shared significance helper ────────────────────────────────────────────────
def sig_stars(p):
    if p < 0.01:  return "***"
    if p < 0.05:  return "**"
    if p < 0.10:  return "*"
    return ""


# ═══════════════════════════════════════════════════════════════════════════════
print("\n" + "═"*60)
print("STEP 1 – GDP per capita")
print("═"*60)
# ═══════════════════════════════════════════════════════════════════════════════

panel_macro = pd.read_pickle(BASE / "_panel_macro.pkl")

pop_raw  = pd.read_csv(BASE / "poplntot" / "API_SP.POP.TOTL_DS2_en_csv_v2_58.csv",
                        skiprows=4)
yr_cols  = [c for c in pop_raw.columns if c.isdigit()]
pop_long = (
    pop_raw[["Country Code"] + yr_cols]
    .melt(id_vars="Country Code", var_name="Year", value_name="Population")
    .rename(columns={"Country Code": "ISO3"})
    .assign(Year=lambda d: d["Year"].astype(int))
    .dropna(subset=["Population"])
)

pm = panel_macro.merge(pop_long, on=["ISO3", "Year"], how="left")
pm["GDP_per_capita"] = pm["GDP_USD"] / pm["Population"]
pm["log_GDPpc"]      = np.log10(pm["GDP_per_capita"].replace(0, np.nan))
pm["GDP_bn"]         = pm["GDP_USD"] / 1e9
pm["log_GDP_bn"]     = np.log10(pm["GDP_bn"].replace(0, np.nan))

cov_pc = pm["GDP_per_capita"].notna().mean()
print(f"  GDP per capita coverage : {cov_pc:.1%}")
print(f"  log_GDPpc range         : "
      f"{pm['log_GDPpc'].min():.2f} – {pm['log_GDPpc'].max():.2f}  "
      f"(i.e. ${10**pm['log_GDPpc'].min():,.0f} – ${10**pm['log_GDPpc'].max():,.0f})")

pm.to_pickle(BASE / "_panel_gdppc.pkl")
print(f"  Saved _panel_gdppc.pkl   shape={pm.shape}")


# ═══════════════════════════════════════════════════════════════════════════════
print("\n" + "═"*60)
print("STEP 2 – Panel regressions")
print("═"*60)
# ═══════════════════════════════════════════════════════════════════════════════

reg_raw = (
    pm[["Country", "Year", "CompositeScore",
        "GDP_growth_pct", "FDI_pct_GDP", "log_GDPpc", "log_GDP_bn"]]
    .query("2000 <= Year <= 2024")
    .copy()
)

# Drop countries with < 3 valid rows (entity FE needs within-variation)
cnt_per_cty = reg_raw.dropna().groupby("Country").size()
keep_ctys   = cnt_per_cty[cnt_per_cty >= 3].index
reg_raw     = reg_raw[reg_raw["Country"].isin(keep_ctys)]

# Each spec has its own dropna() to maximise coverage per model
specs = {
    "A – FE: growth+FDI":
        ("CompositeScore ~ GDP_growth_pct + FDI_pct_GDP + EntityEffects + TimeEffects",
         ["Country", "Year", "CompositeScore", "GDP_growth_pct", "FDI_pct_GDP"]),
    "B – FE: +log GDPpc":
        ("CompositeScore ~ GDP_growth_pct + FDI_pct_GDP + log_GDPpc + EntityEffects + TimeEffects",
         ["Country", "Year", "CompositeScore", "GDP_growth_pct", "FDI_pct_GDP", "log_GDPpc"]),
    "C – FE: +log GDP(bn)":
        ("CompositeScore ~ GDP_growth_pct + FDI_pct_GDP + log_GDP_bn + EntityEffects + TimeEffects",
         ["Country", "Year", "CompositeScore", "GDP_growth_pct", "FDI_pct_GDP", "log_GDP_bn"]),
}

panel_results = {}
for name, (formula, cols) in specs.items():
    sub = reg_raw[cols].dropna().set_index(["Country", "Year"])
    res = PanelOLS.from_formula(formula, data=sub).fit(
        cov_type="clustered", cluster_entity=True
    )
    panel_results[name] = res
    print(f"  {name}: N={res.nobs:,}  "
          f"countries={sub.index.get_level_values('Country').nunique()}  "
          f"R²(within)={res.rsquared_within:.3f}")

# Pooled OLS (baseline, no FE)
pool_sub  = reg_raw[["Country","Year","CompositeScore","GDP_growth_pct","FDI_pct_GDP","log_GDPpc"]].dropna()
pool_res  = PooledOLS.from_formula(
    "CompositeScore ~ GDP_growth_pct + FDI_pct_GDP + log_GDPpc",
    data=pool_sub.set_index(["Country", "Year"])
).fit(cov_type="robust")
panel_results["D – Pooled OLS"] = pool_res
print(f"  D – Pooled OLS : N={pool_res.nobs:,}  R²={pool_res.rsquared:.3f}")

# Save text summaries
lines = []
for name, res in panel_results.items():
    lines += [f"\n{'='*70}", f"{name}", f"{'='*70}", str(res.summary), ""]
(BASE / "regression_results.txt").write_text("\n".join(lines))
print("  Saved regression_results.txt")

# Build coefficient table for plotting
coef_rows = []
for mname, res in panel_results.items():
    ci = res.conf_int()
    for var in res.params.index:
        coef_rows.append(dict(
            model=mname, variable=var,
            coef=res.params[var],
            lo=ci.loc[var, "lower"],
            hi=ci.loc[var, "upper"],
            pval=res.pvalues[var],
        ))
coef_df = pd.DataFrame(coef_rows)

# Quick print of key coefficients
for mname, res in panel_results.items():
    row_bits = []
    for v in ["GDP_growth_pct", "FDI_pct_GDP", "log_GDPpc", "log_GDP_bn"]:
        if v in res.params.index:
            row_bits.append(f"{v}={res.params[v]:.3f}{sig_stars(res.pvalues[v])}")
    print(f"  {mname}: {' | '.join(row_bits)}")


# ═══════════════════════════════════════════════════════════════════════════════
print("\n" + "═"*60)
print("STEP 3 – Ordered logit / probit (rating transitions)")
print("═"*60)
# ═══════════════════════════════════════════════════════════════════════════════

panel_comp = pd.read_pickle(BASE / "_panel_composite.pkl")
tr = (
    panel_comp
    .sort_values(["Country", "Year"])
    .assign(
        Score_lag1  = lambda d: d.groupby("Country")["CompositeScore"].shift(1),
        ScoreChange = lambda d: d["CompositeScore"] - d.groupby("Country")["CompositeScore"].shift(1),
    )
    .dropna(subset=["ScoreChange", "Score_lag1"])
)

# Merge macro controls (Country+Year key – panel_comp has no ISO3)
macro_ctrl = pm[["Country", "Year", "GDP_growth_pct", "FDI_pct_GDP", "log_GDPpc"]].copy()
tr = tr.merge(macro_ctrl, on=["Country", "Year"], how="left")

# Build ordered outcome: downgrade / stable / upgrade
THRESH = 0.5
tr["transition"] = pd.cut(
    tr["ScoreChange"],
    bins=[-np.inf, -THRESH, THRESH, np.inf],
    labels=["downgrade", "stable", "upgrade"],
).cat.as_ordered()

X_COLS = ["GDP_growth_pct", "FDI_pct_GDP", "log_GDPpc", "Score_lag1"]
tr_fit = tr[X_COLS + ["transition"]].dropna()

vc = tr_fit["transition"].value_counts().sort_index()
print(f"  Threshold ±{THRESH} pt  →  "
      f"downgrade={vc.get('downgrade',0)}  "
      f"stable={vc.get('stable',0)}  "
      f"upgrade={vc.get('upgrade',0)}  "
      f"(N={len(tr_fit):,})")

res_ol = OrderedModel(tr_fit["transition"], tr_fit[X_COLS], distr="logit" ).fit(method="bfgs", disp=False)
res_op = OrderedModel(tr_fit["transition"], tr_fit[X_COLS], distr="probit").fit(method="bfgs", disp=False)

print(f"  Ordered logit  LL={res_ol.llf:.1f}  AIC={res_ol.aic:.1f}")
print(f"  Ordered probit LL={res_op.llf:.1f}  AIC={res_op.aic:.1f}")

# Print key covariates
for label, res in [("Logit", res_ol), ("Probit", res_op)]:
    parts = [f"{v}={res.params[v]:.3f}{sig_stars(res.pvalues[v])}" for v in X_COLS]
    print(f"  {label}: {' | '.join(parts)}")

lines_om = ["=== ORDERED LOGIT ===\n", res_ol.summary().as_text(),
            "\n\n=== ORDERED PROBIT ===\n", res_op.summary().as_text()]
(BASE / "ordered_model_results.txt").write_text("\n".join(lines_om))
print("  Saved ordered_model_results.txt")

# Marginal effects (at-the-mean, 'upgrade' category)
try:
    me_ol = res_ol.get_margeff(at="mean")
    me_op = res_op.get_margeff(at="mean")
    marg_ok = True
    print("  Marginal effects (upgrade, logit):",
          {v: round(float(me_ol.margeff[i, 2]), 4)
           for i, v in enumerate(X_COLS)})
except Exception as e:
    marg_ok = False
    print(f"  Marginal effects unavailable: {e}")


# ═══════════════════════════════════════════════════════════════════════════════
print("\n" + "═"*60)
print("STEP 4 – Agency divergence")
print("═"*60)
# ═══════════════════════════════════════════════════════════════════════════════

panel_raw = pd.read_pickle(BASE / "_panel.pkl")

# Pivot to wide: one column per agency score
div = (
    panel_raw[["Country", "ISO2", "Year", "Agency", "Score"]]
    .pivot_table(index=["Country", "ISO2", "Year"],
                 columns="Agency", values="Score", aggfunc="mean")
    .reset_index()
)
div.columns.name = None

agency_pairs = []
for a, b in [("S&P", "Moody's"), ("S&P", "DBRS"), ("Moody's", "DBRS")]:
    if a in div.columns and b in div.columns:
        col = f"|{a}−{b}|"
        div[col] = (div[a] - div[b]).abs()
        agency_pairs.append(col)

div["max_div"] = div[agency_pairs].max(axis=1)
div_valid = div.dropna(subset=agency_pairs, how="all")

# Annual trends
div_yr = (
    div_valid
    .groupby("Year")[agency_pairs + ["max_div"]]
    .agg(["mean", "median"])
    .round(3)
)
div_yr_mean = div_yr.xs("mean", axis=1, level=1)

# Country-level: require ≥ 5 obs; use max divergence
top_div = (
    div_valid
    .groupby("Country")["max_div"]
    .agg(mean="mean", n="count")
    .query("n >= 5")
    .sort_values("mean", ascending=False)
    .head(20)
)

print(f"  Agency pairs tracked: {agency_pairs}")
print(f"  Valid obs (≥1 pair):  {len(div_valid):,}")
print(f"  Top 5 divergent countries:",
      dict(zip(top_div.head(5).index, top_div.head(5)["mean"].round(2).values)))

# Annual mean divergence (last 5 years)
print("\n  Mean |score| divergence by pair (last 5 years):")
print(div_yr_mean.tail(5).to_string())


# ═══════════════════════════════════════════════════════════════════════════════
print("\n" + "═"*60)
print("STEP 5 – FDI inflows ~ lagged credit score")
print("═"*60)
# ═══════════════════════════════════════════════════════════════════════════════

fdi = (
    pm[["Country", "Year", "CompositeScore", "FDI_pct_GDP",
        "GDP_growth_pct", "log_GDPpc"]]
    .sort_values(["Country", "Year"])
    .copy()
)
for lag in [1, 2]:
    fdi[f"Score_L{lag}"] = fdi.groupby("Country")["CompositeScore"].shift(lag)
    fdi[f"FDI_L{lag}"]   = fdi.groupby("Country")["FDI_pct_GDP"].shift(lag)

fdi_clean = fdi.dropna(
    subset=["FDI_pct_GDP", "Score_L1", "Score_L2", "GDP_growth_pct", "log_GDPpc"]
)

# ── Panel FE: FDI ~ lagged score ──────────────────────────────────────────────
fdi_panel = fdi_clean.set_index(["Country", "Year"])

res_fdi = PanelOLS.from_formula(
    "FDI_pct_GDP ~ Score_L1 + Score_L2 + GDP_growth_pct + log_GDPpc"
    " + EntityEffects + TimeEffects",
    data=fdi_panel
).fit(cov_type="clustered", cluster_entity=True)

# ── Panel FE: score ~ lagged FDI (reverse-causality check) ───────────────────
res_score_fdi = PanelOLS.from_formula(
    "CompositeScore ~ FDI_L1 + FDI_L2 + GDP_growth_pct + log_GDPpc"
    " + EntityEffects + TimeEffects",
    data=fdi_panel
).fit(cov_type="clustered", cluster_entity=True)

print(f"  FDI ~ Score_L1 : β={res_fdi.params['Score_L1']:.4f}"
      f"  p={res_fdi.pvalues['Score_L1']:.3f}{sig_stars(res_fdi.pvalues['Score_L1'])}"
      f"  R²(within)={res_fdi.rsquared_within:.3f}")
print(f"  FDI ~ Score_L2 : β={res_fdi.params['Score_L2']:.4f}"
      f"  p={res_fdi.pvalues['Score_L2']:.3f}{sig_stars(res_fdi.pvalues['Score_L2'])}")
print(f"  Score ~ FDI_L1 : β={res_score_fdi.params['FDI_L1']:.4f}"
      f"  p={res_score_fdi.pvalues['FDI_L1']:.3f}{sig_stars(res_score_fdi.pvalues['FDI_L1'])}"
      f"  R²(within)={res_score_fdi.rsquared_within:.3f}")

lines_fdi = [
    "=== FDI (% GDP) ~ Lagged Credit Score  |  country + year FE ===\n",
    str(res_fdi.summary),
    "\n\n=== Credit Score ~ Lagged FDI (% GDP)  |  country + year FE ===\n",
    str(res_score_fdi.summary),
]
(BASE / "fdi_score_results.txt").write_text("\n".join(lines_fdi))
print("  Saved fdi_score_results.txt")

# ── Country-level OLS for illustrative countries ──────────────────────────────
EXAMPLE_CTYS = [
    "Brazil", "India", "Mexico", "South Africa",
    "Turkey", "Poland", "Indonesia", "Colombia",
]
cty_coefs = {}
for cty in EXAMPLE_CTYS:
    sub = fdi_clean[fdi_clean["Country"] == cty]
    if len(sub) < 8:
        print(f"    {cty}: only {len(sub)} obs, skipped")
        continue
    m = smf.ols("FDI_pct_GDP ~ Score_L1 + Score_L2 + GDP_growth_pct", data=sub).fit()
    cty_coefs[cty] = {
        "β(L1)":  round(m.params.get("Score_L1", np.nan), 3),
        "p(L1)":  round(m.pvalues.get("Score_L1", np.nan), 3),
        "β(L2)":  round(m.params.get("Score_L2", np.nan), 3),
        "p(L2)":  round(m.pvalues.get("Score_L2", np.nan), 3),
        "R²":     round(m.rsquared, 3),
        "N":      int(m.nobs),
    }
cty_df = pd.DataFrame(cty_coefs).T
print("\n  Country-level OLS  FDI ~ Score_L1 + Score_L2 + GDP_growth:")
print(cty_df.to_string())


# ═══════════════════════════════════════════════════════════════════════════════
print("\n" + "═"*60)
print("FIGURES")
print("═"*60)
# ═══════════════════════════════════════════════════════════════════════════════

# colour maps
MODEL_COLORS = {
    "A – FE: growth+FDI": PALETTE[0],
    "B – FE: +log GDPpc":  PALETTE[1],
    "C – FE: +log GDP(bn)": PALETTE[2],
    "D – Pooled OLS":       PALETTE[3],
}

# ── FIG 8: Panel regression coefficients ──────────────────────────────────────
FOCUS = ["GDP_growth_pct", "FDI_pct_GDP", "log_GDPpc", "log_GDP_bn"]
FOCUS_LABELS = {
    "GDP_growth_pct": "GDP growth (%)",
    "FDI_pct_GDP":    "FDI (% GDP)",
    "log_GDPpc":      "log₁₀ GDP p.c.",
    "log_GDP_bn":     "log₁₀ GDP (bn $)",
}

fig, axes = plt.subplots(1, 4, figsize=(17, 5), sharey=False)
fig.suptitle(
    "Fig 8 — Panel Regression Coefficients\n"
    "Dependent variable: CompositeScore (0–60)  |  95% CI, clustered SE by country",
    fontsize=11, fontweight="bold"
)

for ax, var in zip(axes, FOCUS):
    sub = coef_df[coef_df["variable"] == var].copy()
    if sub.empty:
        ax.text(0.5, 0.5, f"Not in\nany model", ha="center", va="center",
                transform=ax.transAxes, fontsize=9, color="grey")
        ax.set_title(FOCUS_LABELS[var], fontsize=9)
        continue
    sub = sub.reset_index(drop=True)
    for i, row in sub.iterrows():
        col = MODEL_COLORS.get(row["model"], "grey")
        ax.errorbar(
            row["coef"], i,
            xerr=[[row["coef"] - row["lo"]], [row["hi"] - row["coef"]]],
            fmt="o", color=col, capsize=4, markersize=7, lw=1.5
        )
        ax.text(row["hi"] + abs(row["hi"] - row["lo"]) * 0.05,
                i, sig_stars(row["pval"]),
                va="center", fontsize=9, color=col)
    ax.axvline(0, color="black", lw=0.8, ls="--", alpha=0.4)
    ax.set_yticks(range(len(sub)))
    ax.set_yticklabels(sub["model"].tolist(), fontsize=7.5)
    ax.set_title(FOCUS_LABELS[var], fontsize=9, fontweight="bold")
    ax.set_xlabel("Coefficient", fontsize=8)
    ax.grid(axis="x", alpha=0.25)

from matplotlib.lines import Line2D
handles = [Line2D([0],[0], marker="o", color="w",
                  markerfacecolor=v, label=k, markersize=8)
           for k, v in MODEL_COLORS.items()]
fig.legend(handles=handles, loc="lower center", ncol=4, fontsize=8,
           bbox_to_anchor=(0.5, -0.04))
plt.tight_layout(rect=[0, 0.06, 1, 1])
fig.savefig(BASE / "fig8_panel_regressions.png", dpi=150, bbox_inches="tight")
plt.close(fig)
print("  Saved fig8_panel_regressions.png")


# ── FIG 9: Ordered model ───────────────────────────────────────────────────────
fig, axes = plt.subplots(1, 3, figsize=(16, 5),
                         gridspec_kw={"width_ratios": [3, 3, 2]})
fig.suptitle(
    "Fig 9 — Ordered Logit / Probit: Annual Rating-Transition Direction\n"
    "Outcome: downgrade < stable < upgrade  (threshold ±0.5 pts)",
    fontsize=11, fontweight="bold"
)

X_LABELS = {
    "GDP_growth_pct": "GDP growth (%)",
    "FDI_pct_GDP":    "FDI (% GDP)",
    "log_GDPpc":      "log₁₀ GDP p.c.",
    "Score_lag1":     "Score (t−1)",
}

for ax, (res, title) in zip(axes[:2], [(res_ol, "Ordered Logit"),
                                        (res_op, "Ordered Probit")]):
    coefs = res.params[X_COLS]
    ci    = res.conf_int().loc[X_COLS]
    pvals = res.pvalues[X_COLS]
    ys    = np.arange(len(X_COLS))
    bar_c = ["#c0392b" if p < 0.05 else "#95a5a6" for p in pvals]

    ax.barh(ys, coefs.values, color=bar_c, alpha=0.7, height=0.5)
    ax.errorbar(
        coefs.values, ys,
        xerr=[coefs.values - ci[0].values,
              ci[1].values - coefs.values],
        fmt="none", color="black", capsize=4, lw=1.5
    )
    ax.axvline(0, color="black", lw=0.8, ls="--", alpha=0.4)
    ax.set_yticks(ys)
    ax.set_yticklabels([X_LABELS.get(v, v) for v in X_COLS], fontsize=9)
    ax.set_title(
        f"{title}\nN={int(res.nobs):,}  LL={res.llf:.0f}  AIC={res.aic:.0f}",
        fontsize=9
    )
    ax.set_xlabel("Coefficient  (+→ more likely to upgrade)", fontsize=8)
    ax.grid(axis="x", alpha=0.25)

    for i, (c, p) in enumerate(zip(coefs.values, pvals)):
        s = sig_stars(p)
        if s:
            ax.text(c + 0.005 * np.sign(c) if c != 0 else 0.002,
                    i + 0.18, s, va="bottom", fontsize=9, color="#c0392b")

# Right panel: transition distribution
ax3 = axes[2]
vc2 = tr_fit["transition"].value_counts().sort_index()
colors_pie = ["#e74c3c", "#95a5a6", "#27ae60"]
wedges, texts, pcts = ax3.pie(
    vc2.values, labels=vc2.index.tolist(),
    colors=colors_pie, autopct="%1.1f%%", startangle=90,
    textprops={"fontsize": 9}
)
ax3.set_title(f"Transition distribution\n(N={vc2.sum():,})", fontsize=9)

plt.tight_layout()
fig.savefig(BASE / "fig9_ordered_model.png", dpi=150, bbox_inches="tight")
plt.close(fig)
print("  Saved fig9_ordered_model.png")


# ── FIG 10: Agency divergence ──────────────────────────────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(15, 5))
fig.suptitle(
    "Fig 10 — Inter-Agency Score Divergence\n"
    "Pairwise absolute difference |score_A – score_B|  (forward-filled annual panel)",
    fontsize=11, fontweight="bold"
)

# Left: time series
ax = axes[0]
pair_c = {col: PALETTE[i] for i, col in enumerate(agency_pairs)}
for col in agency_pairs:
    if col not in div_yr_mean.columns:
        continue
    yr_data = div_yr_mean[col].dropna()
    ax.plot(yr_data.index, yr_data.values, marker="o", markersize=4,
            label=col, color=pair_c[col], lw=1.8)
ax.fill_between(
    div_yr_mean.index,
    div_yr_mean.get(agency_pairs[0], 0) * 0,      # zero baseline
    div_yr_mean[agency_pairs].max(axis=1),
    alpha=0.06, color="grey"
)
ax.set_xlabel("Year")
ax.set_ylabel("Mean |score| difference  (0–60 scale)")
ax.set_title("Average pairwise divergence over time")
ax.legend(fontsize=9)
ax.grid(alpha=0.3)

# Right: top-20 countries
ax = axes[1]
top20 = top_div.head(20).sort_values("mean", ascending=True)
bar_colors = [PALETTE[0]] * len(top20)
ax.barh(range(len(top20)), top20["mean"].values, color=bar_colors, alpha=0.75)
ax.set_yticks(range(len(top20)))
ax.set_yticklabels(top20.index.tolist(), fontsize=8)
for i, (mean_val, n) in enumerate(zip(top20["mean"], top20["n"])):
    ax.text(mean_val + 0.05, i, f"{mean_val:.1f} (n={n})",
            va="center", fontsize=7.5, color="dimgrey")
ax.set_xlabel("Mean max pairwise |score| difference")
ax.set_title("Top 20 most divergent countries\n(min 5 paired-agency obs)")
ax.grid(axis="x", alpha=0.3)

plt.tight_layout()
fig.savefig(BASE / "fig10_agency_divergence.png", dpi=150, bbox_inches="tight")
plt.close(fig)
print("  Saved fig10_agency_divergence.png")


# ── FIG 11: FDI ~ score lags ───────────────────────────────────────────────────
FDI_VARS      = ["Score_L1", "Score_L2", "GDP_growth_pct", "log_GDPpc"]
FDI_LABELS    = {"Score_L1": "Score (L1)", "Score_L2": "Score (L2)",
                 "GDP_growth_pct": "GDP growth", "log_GDPpc": "log GDPpc"}
SCORE_FDI_VARS = ["FDI_L1", "FDI_L2", "GDP_growth_pct", "log_GDPpc"]
SCORE_FDI_LBL  = {"FDI_L1": "FDI L1", "FDI_L2": "FDI L2",
                  "GDP_growth_pct": "GDP growth", "log_GDPpc": "log GDPpc"}

fig = plt.figure(figsize=(18, 11))
fig.suptitle(
    "Fig 11 — FDI Net Inflows (% GDP) ↔ Credit Score: Lag Structure\n"
    "Panel FE regressions (country + year effects, clustered SE) + country-level OLS",
    fontsize=11, fontweight="bold"
)
gs = gridspec.GridSpec(2, 3, figure=fig, hspace=0.45, wspace=0.35)

# ── 11A: FDI ~ Score (panel) ──────────────────────────────────────────────────
ax_a = fig.add_subplot(gs[0, 0])
fdi_c_arr  = res_fdi.params[FDI_VARS].values
fdi_ci_arr = res_fdi.conf_int().loc[FDI_VARS]
fdi_p_arr  = res_fdi.pvalues[FDI_VARS].values
bar_c = ["#c0392b" if p < 0.05 else "#95a5a6" for p in fdi_p_arr]
ys = np.arange(len(FDI_VARS))
ax_a.barh(ys, fdi_c_arr, color=bar_c, alpha=0.75, height=0.5)
ax_a.errorbar(fdi_c_arr, ys,
              xerr=[fdi_c_arr - fdi_ci_arr["lower"].values,
                    fdi_ci_arr["upper"].values - fdi_c_arr],
              fmt="none", color="black", capsize=4, lw=1.5)
ax_a.axvline(0, color="black", lw=0.8, ls="--", alpha=0.4)
ax_a.set_yticks(ys)
ax_a.set_yticklabels([FDI_LABELS[v] for v in FDI_VARS], fontsize=9)
ax_a.set_title(
    f"Panel FE: FDI ~ Score\n"
    f"N={res_fdi.nobs:,}  R²(w)={res_fdi.rsquared_within:.3f}\n"
    f"Score_L1 β={res_fdi.params['Score_L1']:.3f}"
    f"{sig_stars(res_fdi.pvalues['Score_L1'])}  "
    f"L2={res_fdi.params['Score_L2']:.3f}"
    f"{sig_stars(res_fdi.pvalues['Score_L2'])}",
    fontsize=8
)
ax_a.set_xlabel("Coefficient (effect on FDI % GDP)", fontsize=8)
ax_a.grid(axis="x", alpha=0.25)

# ── 11B: Score ~ FDI (reverse causality, panel) ───────────────────────────────
ax_b = fig.add_subplot(gs[0, 1])
sc_c_arr  = res_score_fdi.params[SCORE_FDI_VARS].values
sc_ci_arr = res_score_fdi.conf_int().loc[SCORE_FDI_VARS]
sc_p_arr  = res_score_fdi.pvalues[SCORE_FDI_VARS].values
bar_c2 = ["#c0392b" if p < 0.05 else "#95a5a6" for p in sc_p_arr]
ax_b.barh(ys, sc_c_arr, color=bar_c2, alpha=0.75, height=0.5)
ax_b.errorbar(sc_c_arr, ys,
              xerr=[sc_c_arr - sc_ci_arr["lower"].values,
                    sc_ci_arr["upper"].values - sc_c_arr],
              fmt="none", color="black", capsize=4, lw=1.5)
ax_b.axvline(0, color="black", lw=0.8, ls="--", alpha=0.4)
ax_b.set_yticks(ys)
ax_b.set_yticklabels([SCORE_FDI_LBL[v] for v in SCORE_FDI_VARS], fontsize=9)
ax_b.set_title(
    f"Reverse: Score ~ FDI\n"
    f"N={res_score_fdi.nobs:,}  R²(w)={res_score_fdi.rsquared_within:.3f}\n"
    f"FDI_L1 β={res_score_fdi.params['FDI_L1']:.3f}"
    f"{sig_stars(res_score_fdi.pvalues['FDI_L1'])}  "
    f"L2={res_score_fdi.params['FDI_L2']:.3f}"
    f"{sig_stars(res_score_fdi.pvalues['FDI_L2'])}",
    fontsize=8
)
ax_b.set_xlabel("Coefficient (effect on CompositeScore)", fontsize=8)
ax_b.grid(axis="x", alpha=0.25)

# ── 11C: Lag-1 impulse summary: β(L1) + β(L2) by year (pseudo-IRF) ──────────
ax_c = fig.add_subplot(gs[0, 2])
# Rolling 5-year sub-panel regressions to show how β(L1) evolves over time
windows, b_l1, b_l2, b_l1_lo, b_l1_hi = [], [], [], [], []
years_range = sorted(fdi_clean["Year"].unique())
WIN = 8  # 8-year rolling window
for start in range(len(years_range) - WIN + 1):
    yrs  = years_range[start: start + WIN]
    mid  = years_range[start + WIN // 2]
    sub  = fdi_clean[fdi_clean["Year"].isin(yrs)].set_index(["Country","Year"])
    # Only fit if enough obs
    cnt  = sub.groupby(level="Country").size()
    sub2 = sub[sub.index.get_level_values("Country").isin(cnt[cnt >= 3].index)]
    if len(sub2) < 50:
        continue
    try:
        r = PanelOLS.from_formula(
            "FDI_pct_GDP ~ Score_L1 + Score_L2 + GDP_growth_pct + log_GDPpc"
            " + EntityEffects + TimeEffects",
            data=sub2
        ).fit(cov_type="clustered", cluster_entity=True)
        windows.append(mid)
        b_l1.append(r.params["Score_L1"])
        b_l2.append(r.params["Score_L2"])
        ci_ = r.conf_int()
        b_l1_lo.append(ci_.loc["Score_L1","lower"])
        b_l1_hi.append(ci_.loc["Score_L1","upper"])
    except Exception:
        pass

if windows:
    ax_c.plot(windows, b_l1, "o-", color=PALETTE[0], lw=1.8,
              markersize=5, label="β(Score_L1)")
    ax_c.fill_between(windows, b_l1_lo, b_l1_hi, alpha=0.2, color=PALETTE[0])
    ax_c.plot(windows, b_l2, "s--", color=PALETTE[1], lw=1.5,
              markersize=5, label="β(Score_L2)")
    ax_c.axhline(0, color="black", lw=0.8, ls="--", alpha=0.4)
    ax_c.legend(fontsize=8)
    ax_c.set_xlabel("Window midpoint (year)")
    ax_c.set_ylabel("β coefficient")
    ax_c.set_title(f"Rolling {WIN}-year β(Score→FDI)\n(95% CI shaded for L1)",
                   fontsize=8)
    ax_c.grid(alpha=0.25)

# ── 11D: Scatter FDI vs Score_L1 for example countries ───────────────────────
ax_d = fig.add_subplot(gs[1, :2])
cty_colors = {c: PALETTE[i % 10] for i, c in enumerate(cty_df.index)}
for cty in cty_df.index:
    sub = fdi_clean[fdi_clean["Country"] == cty].sort_values("Year")
    col = cty_colors[cty]
    ax_d.scatter(sub["Score_L1"], sub["FDI_pct_GDP"],
                 color=col, alpha=0.55, s=30, label=cty, zorder=3)
    # Fitted line
    if len(sub) >= 4:
        xs = np.linspace(sub["Score_L1"].min(), sub["Score_L1"].max(), 60)
        b1 = cty_df.loc[cty, "β(L1)"]
        b2 = cty_df.loc[cty, "β(L2)"]
        intercept = (sub["FDI_pct_GDP"].mean()
                     - b1 * sub["Score_L1"].mean()
                     - b2 * sub["Score_L2"].mean())
        ax_d.plot(xs, b1 * xs + intercept, color=col, lw=1.6, alpha=0.8)
ax_d.set_xlabel("CompositeScore (1-year lag)", fontsize=9)
ax_d.set_ylabel("FDI net inflows (% GDP)", fontsize=9)
ax_d.set_title("Country-level scatter: FDI vs lagged score (with OLS fit lines)")
ax_d.legend(fontsize=7.5, ncol=4, loc="upper left")
ax_d.grid(alpha=0.2)

# ── 11E: β(L1) bar chart by country ──────────────────────────────────────────
ax_e = fig.add_subplot(gs[1, 2])
cty_sorted = cty_df.sort_values("β(L1)", ascending=True)
bar_c_cty  = ["#c0392b" if p < 0.05 else "#95a5a6" for p in cty_sorted["p(L1)"]]
ax_e.barh(range(len(cty_sorted)), cty_sorted["β(L1)"].values,
          color=bar_c_cty, alpha=0.8, height=0.6)
ax_e.set_yticks(range(len(cty_sorted)))
ax_e.set_yticklabels(cty_sorted.index.tolist(), fontsize=9)
ax_e.axvline(0, color="black", lw=0.8, ls="--", alpha=0.4)
ax_e.set_xlabel("β(Score_L1)", fontsize=9)
ax_e.set_title("Country β(L1)\n(red = p<0.05)", fontsize=9)
ax_e.grid(axis="x", alpha=0.25)
for i, row in enumerate(cty_sorted.itertuples()):
    s = sig_stars(row._4)   # p(L1) is 4th field
    if s:
        ax_e.text(row._3 + 0.003 * np.sign(row._3),   # β(L1)
                  i + 0.15, s, fontsize=9, color="#c0392b")

fig.savefig(BASE / "fig11_fdi_score_lags.png", dpi=150, bbox_inches="tight")
plt.close(fig)
print("  Saved fig11_fdi_score_lags.png")


# ═══════════════════════════════════════════════════════════════════════════════
print("\n" + "═"*60)
print("ALL STEPS COMPLETE")
print("═"*60)
print("\nNew files written to project folder:")
for f in ["_panel_gdppc.pkl", "regression_results.txt",
          "ordered_model_results.txt", "fdi_score_results.txt",
          "fig8_panel_regressions.png", "fig9_ordered_model.png",
          "fig10_agency_divergence.png", "fig11_fdi_score_lags.png"]:
    p = BASE / f
    exists = "✓" if p.exists() else "✗ MISSING"
    size   = f"{p.stat().st_size/1024:.0f} KB" if p.exists() else ""
    print(f"  {exists}  {f}  {size}")
