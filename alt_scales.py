"""
alt_scales.py — Apply every alternative rating scale to the master panel.

Builds an extended panel `_panel_scales.pkl` and `panel_scales.csv` containing,
for every (country, year), the composite score expressed in eight different
scales. This is the input to alt_scales_regressions.py which re-runs the main
panel regressions under each scale and saves a coefficient comparison.

Reference: scales_reference.md
"""

import numpy as np
import pandas as pd
from pathlib import Path

BASE = Path("/sessions/adoring-magical-franklin/mnt/cr rating")

# --------------------------------------------------------------------------
# 1. Load master panel
# --------------------------------------------------------------------------
panel = pd.read_pickle(BASE / "_panel_gdppc.pkl").copy()
print(f"Loaded panel: {panel.shape}")

# Composite is on our 0-60 scale (60=AAA, 0=D). Drop nulls.
panel = panel.dropna(subset=["CompositeScore"]).reset_index(drop=True)
panel["CompositeScore"] = panel["CompositeScore"].astype(float)

# --------------------------------------------------------------------------
# 2. Letter-grade inference from 0-60 score
#    (so we can re-bucket into any other letter-based scale)
# --------------------------------------------------------------------------
# The mapping our existing data uses (gaps of 3, AAA=60, ..., D=0).
# We round to nearest multiple of 3 to handle averaged composite scores.
LETTER_FROM_60 = {
    60: "AAA", 57: "AA+", 54: "AA", 51: "AA-",
    48: "A+",  45: "A",   42: "A-",
    39: "BBB+",36: "BBB", 33: "BBB-",
    30: "BB+", 27: "BB",  24: "BB-",
    21: "B+",  18: "B",   15: "B-",
    12: "CCC+", 9: "CCC",  6: "CCC-",
     3: "CC",   1: "C",    0: "D",
}
# Composite scores are averaged across agencies, so they may not land exactly
# on a multiple of 3. We assign the nearest letter for downstream conversions.
def nearest_letter_score_60(x):
    keys = np.array(sorted(LETTER_FROM_60.keys()))
    idx = np.argmin(np.abs(keys - x))
    return int(keys[idx])

panel["score_60_round"] = panel["CompositeScore"].apply(nearest_letter_score_60)
panel["letter"] = panel["score_60_round"].map(LETTER_FROM_60)

# --------------------------------------------------------------------------
# 3. Define every alternative scale
# --------------------------------------------------------------------------

# (a) Standard 21-point: AAA=21, D=1.
SCALE_21 = {
    "AAA":21, "AA+":20, "AA":19, "AA-":18,
    "A+":17,  "A":16,   "A-":15,
    "BBB+":14,"BBB":13, "BBB-":12,
    "BB+":11, "BB":10,  "BB-":9,
    "B+":8,   "B":7,    "B-":6,
    "CCC+":5, "CCC":4,  "CCC-":3,
    "CC":2,   "C":1,    "D":1,
}

# (b) BIS 20-point: AAA=20, CC=1, D=0
SCALE_20 = {k: max(v-1, 0) for k, v in SCALE_21.items()}
SCALE_20["D"] = 0

# (c) Afonso 17-point: collapse the speculative tail to one notch
SCALE_17 = {
    "AAA":17, "AA+":16, "AA":15, "AA-":14,
    "A+":13,  "A":12,   "A-":11,
    "BBB+":10,"BBB":9,  "BBB-":8,
    "BB+":7,  "BB":6,   "BB-":5,
    "B+":4,   "B":3,    "B-":2,
    "CCC+":1, "CCC":1,  "CCC-":1,
    "CC":1,   "C":1,    "D":1,
}

# (d) Cantor-Packer 16-point: even more compressed at the bottom
SCALE_16 = {
    "AAA":16, "AA+":15, "AA":14, "AA-":13,
    "A+":12,  "A":11,   "A-":10,
    "BBB+":9, "BBB":8,  "BBB-":7,
    "BB+":6,  "BB":5,   "BB-":4,
    "B+":3,   "B":2,    "B-":1,
    "CCC+":1, "CCC":1,  "CCC-":1,
    "CC":1,   "C":1,    "D":1,
}

# (e) Basu et al. 1-60 directional (smaller=better, no outlook).
# Mirror of our existing 0-60: basu = 60 - score_60 + 1, except score_60==0
# (default) which we map to a NaN to mirror Basu's "default = no score".
def to_basu60(x):
    if x == 0:
        return np.nan
    return 60 - x + 1  # AAA(60) -> 1, C(1) -> 60.

# (f) Normalized 0-1
def to_norm01(x):
    return x / 60.0

# (g) Log default-probability (Moody's idealized 1-year PD, log-transformed)
# Approximate idealized cumulative 1-year PDs (Moody's idealized table).
PD_1YR = {
    "AAA":0.00001, "AA+":0.00002, "AA":0.00003, "AA-":0.00006,
    "A+":0.00010, "A":0.00020, "A-":0.00040,
    "BBB+":0.00080,"BBB":0.00170,"BBB-":0.00420,
    "BB+":0.00870,"BB":0.01560,"BB-":0.02810,
    "B+":0.04680,"B":0.07160,"B-":0.11620,
    "CCC+":0.17380,"CCC":0.26000,"CCC-":0.36000,
    "CC":0.50000,"C":0.65000,"D":0.99999,
}
def to_logPD(letter):
    pd_ = PD_1YR.get(letter, np.nan)
    if pd_ is None or np.isnan(pd_):
        return np.nan
    # higher score = safer
    return -np.log(pd_)

# --------------------------------------------------------------------------
# 4. Apply each scale
# --------------------------------------------------------------------------
panel["score_60"]      = panel["CompositeScore"]                       # existing
panel["score_21"]      = panel["letter"].map(SCALE_21)
panel["score_20"]      = panel["letter"].map(SCALE_20)
panel["score_17"]      = panel["letter"].map(SCALE_17)
panel["score_16"]      = panel["letter"].map(SCALE_16)
panel["score_basu60"]  = panel["CompositeScore"].apply(to_basu60)
panel["score_norm01"]  = panel["CompositeScore"].apply(to_norm01)
panel["score_logPD"]   = panel["letter"].map(to_logPD)

scale_cols = ["score_60", "score_21", "score_20", "score_17",
              "score_16", "score_basu60", "score_norm01", "score_logPD"]

# --------------------------------------------------------------------------
# 5. Diagnostics
# --------------------------------------------------------------------------
print("\nScale summary statistics:")
print(panel[scale_cols].describe().round(3))

print("\nCorrelation matrix among scales:")
corr = panel[scale_cols].corr().round(3)
print(corr)

# --------------------------------------------------------------------------
# 6. Save
# --------------------------------------------------------------------------
panel.to_pickle(BASE / "_panel_scales.pkl")
panel.to_csv(BASE / "panel_scales.csv", index=False)
corr.to_csv(BASE / "alt_scales_correlation.csv")
print(f"\nSaved {BASE / '_panel_scales.pkl'} and {BASE / 'panel_scales.csv'}")
print(f"Rows: {len(panel)}, columns: {len(panel.columns)}")
