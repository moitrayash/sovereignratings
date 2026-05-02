"""
shadow_ratings.py
Replicates the De/Ratha/Mohapatra (2007 WPS 4269) shadow sovereign rating model
as closely as our data allows, then applies it to the FULL panel of 150
countries × 26 years to produce in-sample predicted scores.

Differences from their original spec:
  - We use a panel (3,300 obs) not a single cross-section.
  - We have log GDP per capita (proxy for log GNI per capita).
  - Variables matched exactly: log GDPpc, GDP growth, growth volatility (5-yr
    rolling std), Reserves/Imports (months), External Debt/GNI, Inflation,
    Rule of Law (WGI estimate, -2.5 to 2.5).
  - Variables we ADDED beyond De et al.: FDI/GDP, Government Debt/GDP,
    Current Account/GDP, log Population (size).

Output:
  _shadow_panel.pkl / shadow_panel.csv : full panel + Shadow_score (0-60)
  shadow_model_results.txt              : regression diagnostics
  shadow_tracking.csv                   : per-country tracking quality
  fig16_shadow_actual_scatter.png       : actual vs shadow scatter
  fig17_shadow_residuals_by_region.png  : residual heatmap
  fig18_shadow_top_gaps.png             : biggest actual-vs-shadow gaps
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import statsmodels.api as sm
from pathlib import Path

BASE = Path("/sessions/adoring-magical-franklin/mnt/cr rating")
panel = pd.read_pickle(BASE / "_panel_gdppc.pkl").copy()

# -------------------------------------------------------------------
# Merge in macro extras: WB indicators + Rule of Law
# -------------------------------------------------------------------
extras = pd.read_pickle(BASE / "_wb_macro_extra.pkl")
rl = pd.read_pickle(BASE / "_rule_of_law.pkl")
panel = panel.merge(extras, on=["ISO3","Year"], how="left")
panel = panel.merge(rl, on=["ISO3","Year"], how="left")

# Country_wb is duplicate; drop
if "Country_wb" in panel.columns:
    panel = panel.drop(columns=["Country_wb"])

# -------------------------------------------------------------------
# Construct growth volatility (5-year backward-looking std of GDP growth)
# -------------------------------------------------------------------
panel = panel.sort_values(["Country", "Year"])
panel["GrowthVol_5y"] = (
    panel.groupby("Country")["GDP_growth_pct"]
         .transform(lambda x: x.rolling(5, min_periods=3).std())
)

# log Population — control for country size
panel["log_Population"] = np.log(panel["Population"].replace(0, np.nan))

# Save coverage diagnostics
print("Coverage of regressors (non-null %):")
for c in ["log_GDPpc","GDP_growth_pct","FDI_pct_GDP","GrowthVol_5y",
          "Inflation_pct","ExtDebt_pct_GNI","Reserves_Imports_mo",
          "GovDebt_pct_GDP","CurrentAccount_pct","RuleOfLaw","log_Population"]:
    if c in panel.columns:
        pct = panel[c].notna().mean() * 100
        print(f"  {c:25s} {pct:5.1f}%")

# -------------------------------------------------------------------
# Shadow rating model — multi-spec OLS on the panel
# -------------------------------------------------------------------
specs = {
    "S0_minimal": ["log_GDPpc","GDP_growth_pct"],
    "S1_de_core": ["log_GDPpc","GDP_growth_pct","GrowthVol_5y","Inflation_pct"],
    "S2_de_full": ["log_GDPpc","GDP_growth_pct","GrowthVol_5y","Inflation_pct",
                    "RuleOfLaw","CurrentAccount_pct"],
    "S3_with_debt": ["log_GDPpc","GDP_growth_pct","GrowthVol_5y","Inflation_pct",
                     "RuleOfLaw","CurrentAccount_pct","ExtDebt_pct_GNI",
                     "Reserves_Imports_mo"],
    "S4_kitchen_sink": ["log_GDPpc","GDP_growth_pct","GrowthVol_5y",
                        "Inflation_pct","RuleOfLaw","CurrentAccount_pct",
                        "ExtDebt_pct_GNI","Reserves_Imports_mo",
                        "FDI_pct_GDP","log_Population"],
}

panel_train = panel.dropna(subset=["CompositeScore"]).copy()
results = {}
fits_text = []

for spec_name, regs in specs.items():
    sub = panel_train.dropna(subset=regs).copy()
    y = sub["CompositeScore"].astype(float)
    X = sm.add_constant(sub[regs].astype(float))
    mod = sm.OLS(y, X).fit(cov_type="cluster",
                           cov_kwds={"groups": sub["Country"]})
    results[spec_name] = mod
    fits_text.append(f"\n=== {spec_name} (N={int(mod.nobs)}, "
                     f"R²={mod.rsquared:.3f}, adj R²={mod.rsquared_adj:.3f}) ===")
    fits_text.append(mod.summary().as_text())

# Pick S2_de_full as benchmark (matches the De et al. paper closest)
benchmark_spec = "S2_de_full"
mod = results[benchmark_spec]
print(f"\n=== Benchmark spec ({benchmark_spec}) ===")
print(f"N={int(mod.nobs)}, R²={mod.rsquared:.3f}, adj R²={mod.rsquared_adj:.3f}")
print(mod.params.round(3))

# -------------------------------------------------------------------
# Predict shadow score for FULL panel using the kitchen-sink + de_full
# -------------------------------------------------------------------
def predict_shadow(spec_name, panel_df):
    mod = results[spec_name]
    regs = specs[spec_name]
    X = panel_df[regs].copy()
    # Use country-specific median imputation for missing values
    for c in regs:
        med = panel_df.groupby("Country")[c].transform("median")
        X[c] = X[c].fillna(med)
        # Then global median for any still-missing
        X[c] = X[c].fillna(X[c].median())
    X = sm.add_constant(X.astype(float), has_constant="add")
    pred = mod.predict(X)
    pred = pred.clip(lower=0, upper=60)
    return pred

panel["Shadow_S0"] = predict_shadow("S0_minimal", panel)
panel["Shadow_S1"] = predict_shadow("S1_de_core", panel)
panel["Shadow_S2"] = predict_shadow("S2_de_full", panel)  # benchmark
panel["Shadow_S3"] = predict_shadow("S3_with_debt", panel)
panel["Shadow_S4"] = predict_shadow("S4_kitchen_sink", panel)

# Use S2 as the "preferred" shadow rating
panel["Shadow_score"] = panel["Shadow_S2"]
panel["Actual_minus_Shadow"] = (panel["CompositeScore"]
                                 - panel["Shadow_score"])
panel["Actual_minus_Shadow_S4"] = (panel["CompositeScore"]
                                    - panel["Shadow_S4"])

# -------------------------------------------------------------------
# Tracking quality: per-country and overall
# -------------------------------------------------------------------
def stats(df, actual="CompositeScore", shadow="Shadow_score"):
    sub = df.dropna(subset=[actual, shadow])
    if len(sub) < 5: return None
    err = sub[actual] - sub[shadow]
    return {
        "n_obs": len(sub),
        "RMSE": np.sqrt((err**2).mean()),
        "MAE":  err.abs().mean(),
        "Bias_actual_minus_shadow": err.mean(),
        "R2": 1 - (err**2).sum() / ((sub[actual]-sub[actual].mean())**2).sum(),
        "Spearman": sub[actual].corr(sub[shadow], method="spearman"),
        "Pearson": sub[actual].corr(sub[shadow]),
        "Within_3pts": (err.abs() <= 3).mean(),  # within one notch (gap=3)
        "Within_6pts": (err.abs() <= 6).mean(),  # within two notches
    }

print("\n=== Overall tracking (S2 benchmark) ===")
overall = stats(panel)
for k,v in overall.items(): print(f"  {k:25s} {v:.4f}")

print("\n=== Overall tracking (S4 kitchen-sink) ===")
overall_s4 = stats(panel, shadow="Shadow_S4")
for k,v in overall_s4.items(): print(f"  {k:25s} {v:.4f}")

# Per-country
per_c = []
for c, g in panel.groupby("Country"):
    s = stats(g)
    if s:
        s["Country"] = c
        per_c.append(s)
per_country = pd.DataFrame(per_c).sort_values("RMSE")
per_country.to_csv(BASE / "shadow_tracking_per_country.csv", index=False)

# -------------------------------------------------------------------
# Save panel + diagnostics text
# -------------------------------------------------------------------
panel.to_pickle(BASE / "_shadow_panel.pkl")
panel.to_csv(BASE / "shadow_panel.csv", index=False)

with open(BASE / "shadow_model_results.txt", "w") as f:
    f.write("SHADOW SOVEREIGN RATING MODEL\n")
    f.write("="*70 + "\n")
    f.write("Replication and extension of Ratha-De-Mohapatra (2007 WPS 4269) "
            "and Basu-De-Ratha-Timmer (2013 WPS 6641).\n")
    f.write("Dependent variable: CompositeScore (0-60, higher = better).\n\n")
    f.write("Specifications:\n")
    for s, r in specs.items():
        f.write(f"  {s}: {' + '.join(r)}\n")
    f.write("\n" + "\n".join(fits_text))

    f.write("\n\n" + "="*70 + "\n")
    f.write("OVERALL TRACKING DIAGNOSTICS\n")
    f.write("="*70 + "\n")
    for spec_name in ["S0_minimal","S1_de_core","S2_de_full","S3_with_debt",
                      "S4_kitchen_sink"]:
        sh = panel.dropna(subset=["CompositeScore"]).copy()
        sh = sh.dropna(subset=[f"Shadow_{spec_name.split('_')[0]}"]
                              if False else
                              [f"Shadow_{spec_name.split('_')[0]}"])
    # simpler: compute for each
    for sk in ["S0","S1","S2","S3","S4"]:
        col = f"Shadow_{sk}"
        if col in panel.columns:
            s = stats(panel, shadow=col)
            if s:
                f.write(f"\n--- {col} ---\n")
                for k, v in s.items():
                    f.write(f"  {k:25s} {v:.4f}\n")

print(f"\nSaved _shadow_panel.pkl, shadow_panel.csv, "
      f"shadow_model_results.txt, shadow_tracking_per_country.csv")
print(f"Total rows in shadow panel: {len(panel)}")
print(f"Of which have actual ratings: {panel['CompositeScore'].notna().sum()}")
print(f"With shadow predictions:     {panel['Shadow_score'].notna().sum()}")
