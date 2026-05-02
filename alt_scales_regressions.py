"""
alt_scales_regressions.py
Re-run the four panel-FE specifications (Models A-D from session 2) under each
alternative rating scale. Produces a coefficient comparison table and a figure.
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path
from linearmodels.panel import PanelOLS

BASE = Path("/sessions/adoring-magical-franklin/mnt/cr rating")
panel = pd.read_pickle(BASE / "_panel_scales.pkl").copy()

# Set panel index for linearmodels
panel = panel.set_index(["Country", "Year"]).sort_index()

scale_cols = ["score_60", "score_21", "score_20", "score_17",
              "score_16", "score_basu60", "score_norm01", "score_logPD"]

# Specs from session 2 (replicate)
def run_spec(df, ycol, regressors):
    sub = df.dropna(subset=[ycol] + regressors).copy()
    if len(sub) < 200:
        return None
    y = sub[ycol]
    X = sub[regressors]
    try:
        mod = PanelOLS(y, X, entity_effects=True, time_effects=True,
                       drop_absorbed=True)
        res = mod.fit(cov_type="clustered", cluster_entity=True)
        return res
    except Exception as e:
        print(f"  Failed: {e}")
        return None

specs = {
    "A_growth_fdi"     : ["GDP_growth_pct", "FDI_pct_GDP"],
    "B_loggdppc"       : ["log_GDPpc"],
    "C_growth_loggdppc": ["GDP_growth_pct", "log_GDPpc"],
    "D_full"           : ["GDP_growth_pct", "FDI_pct_GDP", "log_GDPpc"],
}

# --------------------------------------------------------------------------
results = []
for ycol in scale_cols:
    for spec_name, regs in specs.items():
        res = run_spec(panel, ycol, regs)
        if res is None:
            continue
        for var in regs:
            results.append({
                "scale": ycol,
                "spec": spec_name,
                "regressor": var,
                "coef": res.params[var],
                "se":   res.std_errors[var],
                "t":    res.tstats[var],
                "p":    res.pvalues[var],
                "r2_within": res.rsquared_within,
                "r2_between": res.rsquared_between,
                "r2_overall": res.rsquared_overall,
                "n_obs": int(res.nobs),
            })

df = pd.DataFrame(results)
df.to_csv(BASE / "alt_scales_regressions.csv", index=False)

# --------------------------------------------------------------------------
# Print key cross-scale comparison
# --------------------------------------------------------------------------
with open(BASE / "alt_scales_regressions.txt", "w") as f:
    f.write("PANEL FE REGRESSIONS UNDER ALTERNATIVE RATING SCALES\n")
    f.write("=" * 75 + "\n")
    f.write("Each model is country FE + year FE, clustered SE.\n\n")
    pivot = df.pivot_table(
        index=["spec","regressor"],
        columns="scale",
        values="coef"
    ).round(4)
    f.write("--- COEFFICIENTS ---\n")
    f.write(pivot.to_string())
    f.write("\n\n")
    pivotp = df.pivot_table(
        index=["spec","regressor"],
        columns="scale",
        values="p"
    ).round(4)
    f.write("--- P-VALUES ---\n")
    f.write(pivotp.to_string())
    f.write("\n\n")
    pivotr = df.pivot_table(
        index="spec",
        columns="scale",
        values="r2_within"
    ).round(4)
    f.write("--- WITHIN R² ---\n")
    f.write(pivotr.to_string())
    f.write("\n\n")
print(df.head())
print(f"\nSaved alt_scales_regressions.csv and .txt")

# --------------------------------------------------------------------------
# Visualisation: coefficient on log_GDPpc and GDP_growth across scales
# --------------------------------------------------------------------------
fig, axes = plt.subplots(1, 2, figsize=(14, 5))
for i, var in enumerate(["log_GDPpc", "GDP_growth_pct"]):
    sub = df[(df["regressor"] == var) & (df["spec"] == "D_full")].copy()
    if len(sub):
        sub = sub.sort_values("coef")
        sig = sub["p"] < 0.05
        colors = ["#1f77b4" if s else "#d3d3d3" for s in sig]
        axes[i].barh(sub["scale"], sub["coef"], color=colors,
                     edgecolor="black", linewidth=0.5)
        axes[i].set_title(f"Coef on {var} across scales (Spec D, FE)",
                          fontsize=11)
        axes[i].axvline(0, color="black", lw=0.7)
        axes[i].grid(axis="x", alpha=0.3)
plt.tight_layout()
plt.savefig(BASE / "fig15_alt_scales_coefs.png", dpi=140, bbox_inches="tight")
plt.close()
print("Saved fig15_alt_scales_coefs.png")
