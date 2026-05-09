# _compute_similarity.py
# Reproducibility script for the Country Similarity Engine.
#
# Recomputes the 150x150 (or 137x137 for Shadow) DTW distance matrices
# from paper_panel.csv and shadow_combined_panel.csv and writes them to
# extras_similarity.js as window.SIM_DATA = {abs:..., rel:..., shd:...}.
#
# Algorithm:
#   1. Pivot panel to country-by-year wide form for the chosen metric.
#   2. Forward-fill then back-fill missing years.
#   3. Z-score each country's series so shape comparisons are
#      level-invariant: a country's series has mean 0 and std 1.
#   4. Compute pairwise DTW distance with a Sakoe-Chiba band of 5 years
#      (max time-warp on either side). Standard squared-difference cost.
#   5. Bundle three matrices (Absolute, Relative M4, Shadow OLS) into a
#      single .js file the page can load via <script src> (no CORS).
#
# Run:  python _compute_similarity.py

import json, os
import pandas as pd
import numpy as np

ROOT = os.path.dirname(os.path.abspath(__file__))

def dtw_band(a, b, w=5):
    na, nb = len(a), len(b)
    INF = float('inf')
    dp = np.full((na+1, nb+1), INF)
    dp[0, 0] = 0.0
    for i in range(1, na+1):
        j0 = max(1, i - w)
        j1 = min(nb, i + w)
        for j in range(j0, j1+1):
            cost = (a[i-1] - b[j-1]) ** 2
            dp[i, j] = cost + min(dp[i-1, j], dp[i, j-1], dp[i-1, j-1])
    return float(np.sqrt(dp[na, nb]))

def build(panel_df, value_col, label):
    pivot = panel_df.pivot_table(index='Country', columns='Year',
                                 values=value_col, aggfunc='mean')
    pivot = pivot.sort_index(axis=1).ffill(axis=1).bfill(axis=1).dropna(how='all')
    countries = list(pivot.index)
    years = [int(y) for y in pivot.columns]
    M = pivot.values.astype(float)
    mu = np.nanmean(M, axis=1, keepdims=True)
    sd = np.nanstd(M, axis=1, keepdims=True)
    sd[sd < 1e-9] = 1.0
    Z = np.nan_to_num((M - mu) / sd, nan=0.0)
    M = np.nan_to_num(M, nan=0.0)
    n = len(countries)
    print(f"  [{label}] n={n}, T={len(years)}")
    dist = np.zeros((n, n))
    for i in range(n):
        for j in range(i+1, n):
            d = dtw_band(Z[i], Z[j], w=5)
            dist[i, j] = d
            dist[j, i] = d
    return {
        "countries": countries,
        "years": years,
        "distances": [[round(float(x), 4) for x in row] for row in dist],
        "panel_raw": [[round(float(x), 4) for x in row] for row in M],
    }

def main():
    print("Loading paper_panel.csv...")
    pp = pd.read_csv(os.path.join(ROOT, 'paper_panel.csv'))
    print("Building Absolute (CompositeScore)...")
    abs_d = build(pp, 'CompositeScore', 'abs')
    print("Building Relative (M4 percentile)...")
    rel_d = build(pp, 'M4', 'rel')

    print("Loading shadow_combined_panel.csv...")
    sp = pd.read_csv(os.path.join(ROOT, 'shadow_combined_panel.csv'))
    print("Building Shadow (Shadow_OLS)...")
    shd_d = build(sp, 'Shadow_OLS', 'shd')

    out = {"abs": abs_d, "rel": rel_d, "shd": shd_d}
    target = os.path.join(ROOT, 'extras_similarity.js')
    with open(target, 'w', encoding='utf-8') as f:
        f.write('window.SIM_DATA = ')
        json.dump(out, f, separators=(',', ':'))
        f.write(';\n')
    print(f"Wrote {target} ({os.path.getsize(target)/1024:.1f} KB)")

if __name__ == '__main__':
    main()
