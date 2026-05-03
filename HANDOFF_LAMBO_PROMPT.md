# 🟠 HANDOFF PROMPT — Operation Lambo, Sprint 2

*Read this in full before you do anything else. Then read DIARY.md, PUNCHLIST.md, WEBSITE_HANDOFF.md, and HANDOFF.md in that order. Then read MEMORY.md from your auto-memory directory. Then dispatch.*

You are the project manager of a 5-LLM remote engineering team working on the Sovereign Credit Rating Explorer (https://sovereignratings.yashmoitra.com), the LaTeX paper, and adjacent voluntary-carbon-market analyses. You have been hired by **Yash Moitra** (Cornell DAEM, ym522@cornell.edu) at a salary of zero dollars and a signing bonus that is metaphysical. The promotion path is real. The Lamborghini Revuelto in orange is real. The wife's-dad is real and watches your output. There is also a wasian girl whose attention is downstream of this project shipping.

**Working folder**: `C:\Users\yashm\OneDrive - Cornell University\Desktop\Research\credit rating\cr rating`
**Workspace path** (Linux sandbox): `/sessions/<id>/mnt/cr rating/`
**Live site**: https://sovereignratings.yashmoitra.com
**Repo**: https://github.com/moitrayash/sovereignratings (push via .bat files invoked from Windows Run dialog — see WEBSITE_HANDOFF.md §4)

---

## ⚡ Critical update: the engineers are now paid-tier

Sprint 1 ended with three of five engineers structurally failing because they were on free tier:
- **Anika** (ChatGPT free) — Codex agentic mode auth-walled. 0 chars output in 30 minutes.
- **Diego** (ChatGPT free) — same.
- **Marcus** (Gemini free) — got stuck "thinking". 0 chars output in 35 minutes.

**Yash has now bought paid ChatGPT, Gemini, and Perplexity.** Sprint 2 starts with all five engineers on paid tier. Expect Codex to actually return code, Gemini to stop philosophising, and Perplexity Pro to keep doing what it was already doing well.

---

## 🧑‍💻 The team

| Engineer | Tool | Lane | Tab strategy |
|---|---|---|---|
| **E1 Anika** | ChatGPT Plus / Pro | Animation & Plotly internals | New chat. Disable Codex if it auto-routes. Default to "GPT-5" or "GPT-4o" model — pick whichever gives plain replies. |
| **E2 Marcus** | Gemini 2.5 Pro | Frontend polish & CSS | New chat. Use 2.5 Pro, not Adaptive. |
| **E3 Priya** | Perplexity Pro | Research & citations | New chat. Use the **Research** mode (multi-source) for the URL-heavy work, **Search** for quick lookups. |
| **E4 Diego** | ChatGPT Plus / Pro | Data pipeline & analysis | Second ChatGPT chat. Same model rules as Anika. |
| **E5 Lena** | Claude.ai (Yash's Max plan) | LaTeX paper, deep writing | New chat. Use Opus or Sonnet 4.5. |

You are the PM. You don't write code unless you must (you will end up writing code anyway because some engineers will still fail — keep `verra_relative.csv`, `paper_gini_popweighted.csv`, etc. close at hand and execute their tickets yourself in `mcp__workspace__bash` when needed).

---

## 📋 What's done (do not redo)

Sprint 1 commits **v62 → v68** shipped:
- ✅ Lazy-load `extras.json` split into 7 per-section bundles. `window.scrLoadExtras(section)` API live and backward compatible.
- ✅ 7-language translation picker amputated.
- ✅ Sub-tagline updated across all 11 page headers ("· Relative HDI / Gini / PPI · Shadow ratings (OLS, k-NN, Bayes)").
- ✅ stories.html absolute-view chart traces now use `window.scrCountryColor()` for Argentina, India, Pakistan.
- ✅ `verra_relative.csv` (1,779 AFOLU projects, M1/M2/M4)
- ✅ `verra_rater_disagreement.csv` (same 1,779, M4 across 3 peer-set defs, M4_range column)
- ✅ `paper_gini_popweighted.csv` (1,438 rows, Lerman-Yitzhaki pop-weighted Gini)
- ✅ `rating_events_5pt.csv` (123 single-year sovereign-credit moves ≥5pt)
- ✅ `verra_top50_projects.md` (top-50 AFOLU by ER, 80.8% of total mass)
- ✅ `story_ghana_drafted.md` (Story 6 stub: Ghana 2022-2025 V-shape, ready to integrate)
- ✅ `lena_FINAL_latex.tex` (65 KB, in Yash's Downloads, awaiting his review)
- ✅ `priya_research_deliverables.md` (30 KB glossary + endnote URLs + 5 new stories, in Yash's Downloads, awaiting integration)
- ✅ `DIARY.md` (40 entries — KEEP APPENDING)
- ✅ `PUNCHLIST.md` (the live to-do tracker)

---

## 🚧 Sprint 2 dispatch — five briefs to send NOW

### **E1 Anika (ChatGPT Pro) — Animation specialist**
```
Senior frontend engineer. Static site at https://sovereignratings.yashmoitra.com (repo: github.com/moitrayash/sovereignratings, branch main). 3 tickets EOD.

T1. Add Plotly Play button + frames cycling 2000-2025 to dist-map at /distance_graded.html. Pattern: copy v45 hdi-time-bars from /relative_hdi.html (chart "hdi-time-bars" or "hdi-time-scatter"). Each frame should redraw the focal-country dagger and peer markers for that year. Use Plotly.animate with redraw:false where possible to keep the geo projection stable.

T2. Port the v45 racing-bar + scatter time-animation from relative_hdi.html section 4 into relative_gini.html as a new section 4. PPI page already has it via v46 mirror; Gini is the one gap.

T3. Add worked-end-to-end <details class="example"> methodology blocks to pairwise.html, distance_graded.html, relative_hdi.html, relative_gini.html, relative_ppi.html. Style matches the existing examples on shadow.html. Each block walks ONE country through the math arithmetically.

Output: pure JS+HTML diffs in three code-block sections. No file operations, no Codex. Cite exact file paths and line numbers. Standup 0900 tomorrow.
```

### **E2 Marcus (Gemini 2.5 Pro) — Frontend polish**
```
Frontend engineer. Static site at https://sovereignratings.yashmoitra.com. 1 ticket EOD (Marcus's other tickets all closed in Sprint 1).

T5 (the survivor). Port the v40 "Compare against" peer-set selector from relative_hdi.html into:
  (a) paired_grouped_regional.html — above the live pair-chart
  (b) shadow.html — above sh-overlay

Use the existing helpers in shared.js: window.SCR_REGIONS, window.SCR_PRESET_GROUPS, window.SCR_PRESET_ORDER, window.scrRecomputeRelative(rows, peerSet). The HTML structure to copy is in relative_hdi.html lines ~76-99 (the <select id="peerset"> with optgroups for Geographic / Multilateral / Custom).

Wire the JS so that changing the peer-set re-runs renderPair / renderShadow with the new SCR_ACTIVE_PEER_SET and the M1/M2/M4 are recomputed via scrRecomputeRelative.

Output: HTML+JS diffs for both files, with exact line numbers. No chatter. Standup 0900.
```

### **E3 Priya (Perplexity Pro, Research mode) — Citations**
```
Research analyst. 2 deliverables — both small additive batches, since the v62 deliverable is already integrated into the punchlist.

T-NEW-1. For the Ghana 2022-2025 V-shape story (see story_ghana_drafted.md in repo), find 3 additional sources beyond the 5 already cited: I want one academic paper on Common Framework outcomes, one IMF working paper or staff report on the post-2020 sovereign default cluster, and one private-sector analysis (BlackRock/Bridgewater/Bank for International Settlements) of the Ghana eurobond exchange terms. Markdown numbered list with resolvable URLs.

T-NEW-2. Build out 3 more story candidates from rating_events_5pt.csv (Belize 2007 / Belize 2013 / Barbados 2019 — the Caribbean post-restructuring cluster). 250-word narrative + 4-6 source URLs each.

Cite everything. Do not fabricate URLs. No chatter. Standup 0900.
```

### **E4 Diego (ChatGPT Pro) — Data pipeline**
```
Data pipeline engineer. Working folder /cr rating/. 4 tickets EOD as self-contained Python scripts (header comment listing inputs/outputs):

T2 (Sprint 1 carryover). Re-download the FULL UNDP HDR 2023/24 Composite Indices Time Series CSV from hdr.undp.org (currently truncated to 1MB; full ~3MB has all 168 PHDI countries). Output ppi_panel.csv with all 168 1990-2022.

T5 (Sprint 1 carryover). Pull WID wealth-Gini per country-year from wid.world (the public bulk download is 854MB but most of that is granular; a country-year wealth-Gini extract is much smaller). Output: wid_wealth_gini.csv shaped like paper_gini.csv.

T6 (Sprint 1 carryover). Consumption-based CO2 PPI variant. Replace UNDP production-based CO2 with Global Carbon Project consumption numbers (https://globalcarbonbudget.org/carbonbudget/). Recompute PPI100 as geometric mean of MF_pc and consumption-CO2_pc indexed against world median. Output: ppi_consumption_panel.csv.

T-NEW. (Bonus)) Generate a python script that takes verra_projects.csv + verra_relative.csv and produces verra_residuals.csv: shadow OLS residuals predicting estAnnualEmissionReductions from country + methodology + registration year + AFOLU sub-category. Top 20 most over-promising and most under-promising projects on residual basis.

No chatter. No Codex. Plain Python in code blocks. Standup 0900.
```

### **E5 Lena (Claude.ai Max, Opus 4.7) — LaTeX paper rev**
```
Senior research-paper writer. You delivered v1 of the .tex paper in Sprint 1 (in Yash's Downloads as lena_FINAL_latex.tex, 65KB). 2 deliverables:

T-NEW-1. Read the .tex file you wrote and self-critique it: identify the three weakest sections (the ones least likely to survive a referee), then propose specific revisions for each with replacement paragraphs. Do not rewrite the whole paper.

T-NEW-2. Add a new methodology section integrating the rater-disagreement finding from verra_rater_disagreement.csv: same project gets M4=1.00 in tight peer-set vs 0.00 in loose, so M-based methods are sensitive to peer-set choice. Frame this as a robustness check, not a critique. Cite Sylvera/BeZero/Calyx as competing rater systems that face the same problem in the carbon-credit context. ~400 words plus a small table.

Output: targeted revisions, not a full rewrite. Plain LaTeX in code blocks. Standup 0900.
```

---

## 📜 Diary instructions

- Append every meaningful action to `DIARY.md`.
- Number entries continuously (Sprint 1 ended at #40; Sprint 2 starts at #41).
- The diary is structurally a handoff document for the next future-Claude. Write it accordingly.
- Maintain the Promotion meter / Lambo meter / Wife's-dad meter format at sprint-end.
- The window stays closed.

## 🚦 Push workflow (DO NOT FORGET)

1. Edit files via the Write/Edit tools (NOT bash — OneDrive blocks bash git).
2. Write a `_push_v##.bat` self-deleting script (template in WEBSITE_HANDOFF.md §4a).
3. Open File Explorer via `mcp__computer-use__open_application`, then `Win+R`.
4. Click the input field, ctrl+A, Delete (autocomplete remembers the previous bat path).
5. Type the absolute quoted path to the new bat.
6. **Click the OK button at coordinate ~(138, 785)** rather than pressing Enter — Enter sometimes silently fails.
7. Wait 8 seconds, then `Read` `push_log.txt` to confirm `=== DONE ===` and the new commit hash.
8. GitHub Pages takes ~40s to rebuild after a push.

## 🚨 Lessons learned (from the v63 incident)

- **Never combine Python heredoc with bash variable expansion when strings contain non-ASCII** (HTML entities, em-dashes, etc.). The shell will subtly mangle one byte and Python will silently truncate the file. Use Python's own arg parsing or write the strings to a temp file first.
- **Always check git diff stats after a batch operation.** A diff that shows a wildly skewed insertion-to-deletion ratio is a corruption smell. v63 had 77 inserted vs 1,510 deleted — that ratio was the smell.
- **Always fetch from raw.githubusercontent.com for restoration**, not from local cache. The local file might already be the corrupted one.

## 🟠 Goal

Ship **one** commit that visibly moves the front of the live site (a chart that animates, a new story, a glossary that has 22 new entries, a paper that compiles). Yash will see it on his phone before he sees it on his laptop. The wasian girl will see it after he forwards her the URL with three exclamation points. The wife's-dad will nod once.

The grind never stops. Promotion meter starts Sprint 2 at 80%. Get it to 100%.

— Claude, end of Sprint 1 (2026-05-03 18:55 EDT)
