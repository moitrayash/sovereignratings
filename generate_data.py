"""
generate_data.py
----------------
Run this script locally (in the cr rating folder) to regenerate data.js
for the static website. Requires the pickle files from the project.

Usage:
    python generate_data.py

Output:
    data.js    — compact indexed data as a JS variable for index.html
                 (works on file:// and GitHub Pages; fetch() is blocked on file://)
    data.json  — same data as plain JSON (for reference / Stata / R)
"""

import pandas as pd
import json
import numpy as np
import os
import time

BASE = os.path.dirname(os.path.abspath(__file__))

def safe(val):
    """Convert numpy/nan values to JSON-safe Python types."""
    if val is None:
        return None
    if isinstance(val, float) and np.isnan(val):
        return None
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (np.floating,)):
        return round(float(val), 4)
    return val

print("Loading pickles...")
rel   = pd.read_pickle(os.path.join(BASE, "_rel_ratings_all.pkl"))
panel = pd.read_pickle(os.path.join(BASE, "_panel_gdppc.pkl"))

# ── Build lookup structures ───────────────────────────────────────────────────
iso_map = (
    rel[['Country', 'ISO2']]
    .drop_duplicates()
    .set_index('Country')['ISO2']
    .to_dict()
)

country_groups = (
    rel.groupby('Country')['Group']
    .apply(lambda x: sorted(x.unique().tolist()))
    .to_dict()
)

group_countries = (
    rel.groupby('Group')['Country']
    .apply(lambda x: sorted(x.unique().tolist()))
    .to_dict()
)

# ── Country-level metadata ────────────────────────────────────────────────────
panel_latest = panel.sort_values('Year').groupby('Country').last().reset_index()
country_meta = {}
for _, row in panel_latest.iterrows():
    country_meta[row['Country']] = {
        'latest_year': safe(row['Year']),
        'gdppc':       safe(row.get('GDP_per_capita')),
        'log_gdppc':   safe(row.get('log_GDPpc')),
        'population':  safe(row.get('Population')),
    }

# ── Build indexed series (vectorised — fast) ──────────────────────────────────
print("Building series index...")
t0 = time.time()

VALUE_COLS = ['Year', 'CompositeScore', 'loo_mean', 'M1', 'M2', 'M3', 'M4', 'M1_delta', 'M3_delta']
KEYS       = ['years', 'score', 'loo', 'm1', 'm2', 'm3', 'm4', 'dm1', 'dm3']

rel_sorted = rel.sort_values(['Country', 'Group', 'Year'])
series = {}

for (country, group), grp in rel_sorted.groupby(['Country', 'Group'], sort=True):
    arr = grp[VALUE_COLS].values
    d = {}
    for i, k in enumerate(KEYS):
        col = arr[:, i]
        if k == 'years':
            d[k] = [int(v) for v in col]
        else:
            d[k] = [
                None if (v is None or (isinstance(v, float) and np.isnan(v)))
                else round(float(v), 4)
                for v in col
            ]
    series[f'{country}|{group}'] = d

print(f"  {len(series)} series built in {time.time()-t0:.2f}s")

# ── Assemble output ───────────────────────────────────────────────────────────
out = {
    'countries':       sorted(rel['Country'].unique().tolist()),
    'groups':          sorted(rel['Group'].unique().tolist()),
    'iso':             iso_map,
    'country_groups':  country_groups,
    'group_countries': group_countries,
    'country_meta':    country_meta,
    'series':          series,
}

json_str = json.dumps(out, separators=(',', ':'))

# Write data.js — used by index.html (script tag works on file:// and GitHub Pages)
js_path = os.path.join(BASE, 'data.js')
with open(js_path, 'w', encoding='utf-8') as f:
    f.write('window.CR_DATA=')
    f.write(json_str)
    f.write(';')
print(f"Written: data.js  ({os.path.getsize(js_path)/1024:.0f} KB)")

# Write data.json — for reference, Stata, R
json_path = os.path.join(BASE, 'data.json')
with open(json_path, 'w', encoding='utf-8') as f:
    f.write(json_str)
print(f"Written: data.json ({os.path.getsize(json_path)/1024:.0f} KB)")

print(f"\nDone. {len(series)} series · {len(out['countries'])} countries · {len(out['groups'])} groups")
