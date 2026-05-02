"""
shadow_per_agency.py
Run the shadow rating model separately for each agency (S&P, Moody's, DBRS)
and compare tracking quality. This answers: which agency is closest to a
fundamentals-based shadow rating?
"""

import numpy as np
import pandas as pd
import statsmodels.api as sm
from pathlib import Path

BASE = Path("/sessions/adoring-magical-franklin/mnt/cr rating")

# Load per-agency annual panel
panel_master = pd.read_pickle(BASE / "_panel.pkl")  # has Agency col
print("Master per-agency panel cols:", panel_master.columns.tolist())
print("Shape:", panel_master.shape)

# Macro extras and rule of law
extras = pd.read_pickle(BASE / "_wb_macro_extra.pkl")
rl     = pd.read_pickle(BASE / "_rule_of_law.pkl")
gdpd   = pd.read_pickle(BASE / "_panel_gdppc.pkl")

# Bring macro into per-agency panel
df = panel_master.copy()
df = df.merge(gdpd[["Country","Year","ISO3","log_GDPpc","GDP_growth_pct",
                    "FDI_pct_GDP","Population"]],
              on=["Country","Year"], how="left")
df = df.merge(extras, on=["ISO3","Year"], how="left")
df = df.merge(rl, on=["ISO3","Year"], how="left")

# Growth volatility per country
df = df.sort_values(["Country","Year"])
df["GrowthVol_5y"] = df.groupby("Country")["GDP_growth_pct"].transform(
    lambda x: x.rolling(5, min_periods=3).std())
df["log_Population"] = np.log(df["Population"].replace(0, np.nan))

# Final regressors (S2 spec)
regs = ["log_GDPpc","GDP_growth_pct","GrowthVol_5y","Inflation_pct",
        "RuleOfLaw","CurrentAccount_pct"]

# Per-agency model
agency_models = {}
agency_summary = []
for ag in ["S&P","Moody's","DBRS"]:
    sub = df[df["Agency"] == ag].dropna(subset=["Score"] + regs).copy()
    if len(sub) < 100: continue
    y = sub["Score"].astype(float)
    X = sm.add_constant(sub[regs].astype(float))
    mod = sm.OLS(y, X).fit(cov_type="cluster",
                           cov_kwds={"groups": sub["Country"]})
    agency_models[ag] = mod
    pred = mod.predict(X).clip(0, 60)
    err = sub["Score"] - pred
    agency_summary.append({
        "Agency": ag,
        "N": int(mod.nobs),
        "R2": mod.rsquared,
        "AdjR2": mod.rsquared_adj,
        "RMSE": np.sqrt((err**2).mean()),
        "MAE": err.abs().mean(),
        "Bias": err.mean(),
        "Pearson": sub["Score"].corr(pred),
        "Spearman": sub["Score"].corr(pred, method="spearman"),
        "Within_3": (err.abs() <= 3).mean(),
        "Within_6": (err.abs() <= 6).mean(),
    })
    print(f"\n=== {ag} (N={int(mod.nobs)}, R²={mod.rsquared:.3f}) ===")
    print(mod.params.round(3))

ag_summary = pd.DataFrame(agency_summary)
ag_summary.to_csv(BASE / "shadow_per_agency.csv", index=False)
print("\nPer-agency tracking summary:")
print(ag_summary.round(3).to_string(index=False))

# -----------------------------------------------------------------
# Predict the FULL panel using each agency's coefficients
# -----------------------------------------------------------------
shadow_per_agency = []
for c in df["Country"].unique():
    sub_c = df[df["Country"] == c]
    for yr in sub_c["Year"].unique():
        row = sub_c[sub_c["Year"] == yr].iloc[0]
        out = {"Country": c, "Year": yr,
               "ISO3": row.get("ISO3", "")}
        for ag, mod in agency_models.items():
            try:
                X = pd.DataFrame({k: [row[k]] for k in regs})
                # Impute missing
                for k in regs:
                    if pd.isna(X[k].iloc[0]):
                        X[k] = df[k].median()
                X = sm.add_constant(X.astype(float), has_constant="add")
                p = float(mod.predict(X).iloc[0])
                out[f"Shadow_{ag}"] = max(0, min(60, p))
            except Exception as e:
                out[f"Shadow_{ag}"] = np.nan
        # Actual scores from each agency for this year
        for ag in ["S&P","Moody's","DBRS"]:
            actual = df[(df["Country"] == c) & (df["Year"] == yr)
                        & (df["Agency"] == ag)]["Score"]
            out[f"Actual_{ag}"] = float(actual.iloc[0]) if len(actual) else np.nan
        shadow_per_agency.append(out)

shadow_panel = pd.DataFrame(shadow_per_agency)
shadow_panel.to_pickle(BASE / "_shadow_per_agency_panel.pkl")
shadow_panel.to_csv(BASE / "shadow_per_agency_panel.csv", index=False)
print(f"\nSaved shadow_per_agency_panel.csv ({shadow_panel.shape})")
print(shadow_panel.head())

# Compute per-country gaps (actual - shadow) by agency for latest year
latest = (shadow_panel.sort_values("Year")
                       .groupby("Country").tail(1).copy())
for ag in ["S&P","Moody's","DBRS"]:
    latest[f"Gap_{ag}"] = latest[f"Actual_{ag}"] - latest[f"Shadow_{ag}"]
latest.to_csv(BASE / "shadow_per_agency_latest.csv", index=False)

# Average gap by agency × continent
mem = pd.read_pickle(BASE / "_membership.pkl").reset_index()
cont_cols = ["Africa","Asia","Europe","North_America","South_America","Oceania"]
mem_c = mem[["Country"] + cont_cols].copy()
mem_c["Continent"] = mem_c.apply(
    lambda r: next((c for c in cont_cols if r[c] == 1), "Unknown"), axis=1)
latest = latest.merge(mem_c[["Country","Continent"]], on="Country", how="left")

print("\nAverage rating gap (Actual - Shadow) by continent × agency, latest year:")
gap_by = (latest.groupby("Continent")[
    [f"Gap_{a}" for a in ["S&P","Moody's","DBRS"]]
].mean().round(2))
print(gap_by)
gap_by.to_csv(BASE / "shadow_gap_continent_agency.csv")
