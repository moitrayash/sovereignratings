# Sovereign Credit Rating Scoring Scales — Reference

Compiled from a literature survey on credit rating numerical conversions, with the canonical references and the exact mapping used.

---

## Our existing scale (Sessions 1–4)

- **Range**: 0–60, higher = better
- **Construction**: Each S&P/Moody's/DBRS letter grade is mapped to a multiple of 3, with the modal mapping being:
  AAA/Aaa = 60, AA+/Aa1 = 57, AA/Aa2 = 54, AA−/Aa3 = 51,
  A+/A1 = 48, A/A2 = 45, A−/A3 = 42,
  BBB+/Baa1 = 39, BBB/Baa2 = 36, BBB−/Baa3 = 33,
  BB+/Ba1 = 30, BB/Ba2 = 27, BB−/Ba3 = 24,
  B+/B1 = 21, B/B2 = 18, B−/B3 = 15,
  CCC+/Caa1 = 12, CCC/Caa2 = 9, CCC−/Caa3 = 6,
  CC/Ca = 3, C/C = 1, SD/D = 0.
- **Equivalent to**: Basu, De, Ratha, Timmer (2013) ×3 scheme **mirrored** (their 1 ↔ our 60), without outlook subdivision because outlook info is absent in our raw data (all events recorded as `Stable`).

---

## Alternative scales catalogued

### A. Cantor & Packer (1996) — 16-point
- Original empirical paper on rating determinants (Federal Reserve Bank of New York EPR, Oct 1996).
- AAA/Aaa = **16**, B−/B3 = **1**. Higher = better.
- Strictly letter-grade based; no outlook subdivision; no notch within letter.
- Limitation: collapses CCC/CC/C/SD into the bottom rung.

### B. Afonso, Furceri & Gomes (2011, ECB WP 1347) — 17-point
- AAA = **17**, default-grade = **1**. Higher = better.
- Used widely in ECB and emerging-markets work.
- Identical resolution to (A) plus an extra notch at the top.

### C. BIS (2015 Quarterly Review, Sec. H) — 20-point
- AAA = **20**, Ca/CC = **1**. Higher = better.
- 17 investment + 3 speculative-grade notches.
- Effectively "21-point − 1" — drops the bottom rung when default itself is observed separately.

### D. Standard 21-point (modern academic norm)
- AAA = **21**, SD/D = **1**. Higher = better.
- Each letter modifier (+/0/−) consumes one notch. 21 notches × 1 outlook = 21 levels.
- This is what Reinhart, Mauro, Rogoff and many others use.

### E. Basu, De, Ratha, Timmer (2013, WB WPS 6641) — 60-point with outlook (×3 scheme)
- "Multiplying each rating number by 3" (Sen 1977, Basu 1983 cardinal transformation).
- Each of 21 letter grades is split into three outlook classes: positive / stable / negative.
- AAA-positive = **1**, AAA-stable = **2**, AAA-negative = **3**, … C-negative = **60**.
- **Direction reversed**: smaller number = better.
- Collapses to our scale when outlook is forced to "stable" and direction is flipped.

### F. Reverse-coded version of any letter scale
- Useful when interpretation as "default risk index" is desired (high = high risk).
- We keep both directions in our derived columns to avoid sign confusion in regressions.

### G. Logarithmic / default-probability mapping (Reinhart-Rogoff implicit, Moody's Idealized)
- Maps letter grade → 1-year cumulative idealized default probability (PD).
- Score := −ln(PD). Highly non-linear in the speculative-grade tail.
- Useful for risk-economic regressions where coefficient is "elasticity to default".

### H. UNDP / Trading Economics composite (Conceição 2024 reform discussion)
- 0–100 scale, generated from a macro-econometric algorithm independent of the Big Three.
- Used in the UNDP report *Lowering the Cost of Borrowing in Africa* as a cross-check.
- We approximate this with our own shadow rating (De et al. method) below.

---

## Outlook adjustment — what's possible with our data

Our raw events are all flagged `Stable`. With true outlook data we could add ±1 within each ×3 step (Basu's 60-pt scheme). Without it we are restricted to the 21-letter-grade resolution that we already have, mapped into the 0-60 range with gaps of 3.

Documented action: keep the existing scoring as our "Basu-equivalent" scale and propose richer outlook collection in future revisions.

---

## What I will implement next

For every panel observation `(country, year)` we now compute and save:

1. `score_60` — our existing 0-60 (= Basu mirrored, no outlook).
2. `score_21` — standard 21-point letter-grade scale.
3. `score_20` — BIS 20-point.
4. `score_17` — Afonso 17-point.
5. `score_16` — Cantor-Packer 16-point.
6. `score_basu60` — Basu et al. 1-60 directional (smaller = better).
7. `score_norm01` — normalized 0–1.
8. `score_logPD` — log idealized default probability.

Then we apply each of these to the panel regressions to test sensitivity of the macro coefficients to the choice of scale.
