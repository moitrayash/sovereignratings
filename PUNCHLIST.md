# 📋 PUNCHLIST — post-Operation-Lambo

State at end of v65 (commit `63efff8`, 2026-05-03 18:39 EDT). What's done in this sprint, what's still on deck.

---

## ✅ Shipped this sprint (v62–v65)

### Code / infrastructure
- [x] `extras.json` lazy-load: split into 7 per-section bundles (`extras_score`, `extras_hdi`, `extras_gini`, `extras_ppi`, `extras_shadow`, `extras_stories`, `extras_meta`). `window.scrLoadExtras(section)` opt-in API; backward compatible.
- [x] 7-language translation picker amputated from controls rail.
- [x] Sub-tagline updated across all 11 page headers to mention Relative HDI / Gini / PPI · Shadow ratings.
- [x] Story-chart traces (stories.html) now use `window.scrCountryColor()` for Argentina, India, Pakistan instead of hardcoded `#1a1a1a`/`#888`.

### Data deliverables
- [x] `verra_relative.csv` (1,779 rows) — M1/M2/M4 for AFOLU projects within methodology+country+sub-category peer sets
- [x] `verra_rater_disagreement.csv` (1,779 rows) — same projects scored M4 across THREE peer-set definitions, M4_range column
- [x] `paper_gini_popweighted.csv` (1,438 rows) — Lerman-Yitzhaki pop-weighted Gini per group/year
- [x] `rating_events_5pt.csv` (123 events) — single-year sovereign-credit moves of |delta|≥5pt
- [x] `verra_projects.csv` (4,960 rows, from earlier session) — full Verra project registry snapshot

### Documentation
- [x] `DIARY.md` — 32+ entries documenting the sprint
- [x] This `PUNCHLIST.md`

---

## 🚧 Still pending (for tomorrow's session)

### Real-shaped tickets
- **Story endnote source URLs** (Priya delivered 30 KB; needs integration into `<sup class="note-ref">` blocks across stories.html). Priya's deliverable file: `priya_research_deliverables.md` (in user's Downloads — re-pull from Perplexity tab if needed).
- **Glossary expansion** — Priya's same deliverable has 22 institution entries (IMF, IBRD, IDA, IFC, MIGA, ICSID, OECD, BIS, UNDP, etc.). Drop into `glossary.html` as new entries, each with `<sup>` linking to the official source.
- **5 new historical stories** — Priya wrote draft narratives for Vietnam upgrade, Lebanon 2019-22, Turkey 2018-23 + others; integrate into `stories.html`.
- **Lena's LaTeX paper** (~65 KB) — review the .tex file (in user's Downloads as `lena_E5_latex.tex` or `_v2`), edit, compile, send to Yash for academic-tone calibration.
- **T5 compare-against selector port** — port the v40 peer-set selector from `relative_hdi.html` into `paired_grouped_regional.html` and `shadow.html`. Use existing helpers `SCR_REGIONS`, `SCR_PRESET_GROUPS`, `scrRecomputeRelative`.
- **Distance-map year animation** — add Plotly play button + frames cycling 2000–2025 to `dist-map` on `distance_graded.html`. Reusable v45 pattern from `relative_hdi.html` section 4.
- **Section-4 time animation on Relative Gini** — same v45 pattern as HDI/PPI.
- **Hover-text dark-mode CSS check** — verify the `.hovertext` overrides actually fix the white-highlight artifact across all chart pages.

### Big science deliverables  
- **Lorenz multi-country overlay on Gini page** — partial implementation exists; needs the multi-country variant.
- **Ghana 2022-2025 story** — *new candidate*: the rating_events_5pt.csv shows Ghana had the biggest single-year drop (2022, -13.5) AND the biggest single-year rise (2025, +12) in the post-2010 sample. Cleanest narrative arc available.
- **Population-weighted Gini integration** — `paper_gini_popweighted.csv` already on disk; visualize on `relative_gini.html` as a toggle alongside unweighted.
- **Rater-disagreement footnote in the paper** — `verra_rater_disagreement.csv` finding (same project gets M4 1.00 → 0.00 across peer-set definitions) is publishable methodology fodder.
- **Verra project explorer page** — fully scoped, data already on disk (`verra_projects.csv`, `verra_relative.csv`, `verra_rater_disagreement.csv`). Could ship as new page `verra.html`.

### Outside the sprint scope
- **Wealth-Gini track** — WID API blocked, bulk is 854 MB; needs manual download.
- **Consumption-based CO₂ for PPI** — Global Carbon Project data; deferred.
- **Mobile polish round 3** — current state mostly OK from v56-v60 work; punt until user reports specifics.

---

## 🧠 Engineer postmortem

The five-LLM pipeline was effective for **two** engineers:
- **Priya (Perplexity)** delivered 30 KB of research with real, resolvable URLs in <5 minutes
- **Lena (Claude.ai)** delivered 65 KB of LaTeX in <15 minutes

The other three failed structurally:
- **Anika & Diego (ChatGPT free tier)** — both got auto-routed into Codex agentic mode, which is auth-walled. Produced 0 chars in 30 minutes. Recommendation: paid ChatGPT login OR don't use ChatGPT free tier for long technical briefs.
- **Marcus (Gemini free tier)** — got stuck "thinking" with no output rendered. Produced 0 chars in 35 minutes. Recommendation: try Gemini Pro paid tier OR switch to a more reliable model.

The single-PM-five-LLM pattern works **only** when the LLMs are at-or-above paid-tier quality. Free tiers will quietly fail at multi-ticket technical briefs.

---

*End of punchlist. Next session: pick a number from the pending list, dispatch.*
