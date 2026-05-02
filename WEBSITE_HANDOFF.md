# Sovereign Credit Rating Explorer — Website Handoff

This file complements `HANDOFF.md` (which covers the broader Python pipeline and LaTeX paper goal). This one is **specifically about the static website** at https://sovereignratings.yashmoitra.com — what's there, how to push to it, what's pending.

**Last updated:** 2026-05-02 18:20 (after v41 push, commit `de13cee`)
**Working folder (Windows):** `C:\Users\yashm\OneDrive - Cornell University\Desktop\Research\credit rating\cr rating`
**Working folder (Linux/sandbox):** `/sessions/.../mnt/cr rating/`
**Live site:** https://sovereignratings.yashmoitra.com
**GitHub repo:** https://github.com/moitrayash/sovereignratings (branch `main`, GitHub Pages serves `/`)
**User:** Yash Moitra (Cornell grad researcher, DAEM) — yashmoitratales@gmail.com

---

## 1 · What this thing is

A static website with ~12 HTML pages that renders client-side Plotly charts off a single bundled `extras.json` (~1 MB). The substantive content is the sovereign credit rating methodology described in the parent `HANDOFF.md` plus four relative-rating measures (M1–M4) and five named methodologies:

- **Method A** — paired country-vs-country spread
- **Method B** — distance-graded inverse-distance kernel from capitals
- **Method C** — Bayesian shrinkage / James-Stein toward peer-set mean
- **Method D** — Random Forest ensemble on macro features
- **Shadow ratings** — model-based predictions, contrasted with agency ratings

Origin papers in the literature: Basu, De, Ratha & Timmer (2013) and De, Mohapatra & Ratha (2020) — both World Bank Policy Research Working Papers. Naming convention on the site: "Basu et al. method" and "De et al. method" (renamed in v38 from "Basu RR" / "De Relativizations").

## 2 · Files and what each does

### Pages (HTML)
- `index.html` — landing with 4×N matrix, year slider, country/agency filters
- `methodology.html` — written walkthrough of M1–M4 + worked examples in `<details>` blocks
- `glossary.html` — terms (rating notation, methods, institutions). **Pending expansion** with IMF/WB/ICRC/MSF/UN/BIS entries
- `citations.html` — academic literature with PDF view buttons; every author link goes to an official biography page
- `stories.html` — historical case studies with relative + shadow charts. **Currently 5; user wants many more**
- `pairwise.html` — country-vs-country spread explorer (Method A)
- `paired_grouped_regional.html` — pairwise + 6 pre-rendered case studies (Armenia/Azerbaijan, Czechia/Slovakia, Greece/Germany, Cyprus/Malta, Russia/Ukraine, Argentina/Chile)
- `distance_graded.html` — Method B: rectangular sepia map, year sliders, focal-country selector, isodistance rings, `x-thin` peer markers, focal as Latin cross † in burnt sienna serif
- `relative_hdi.html` — M1–M4 applied to HDI×100 with comparison-set selector (v40+)
- `relative_gini.html` — same for inverted Gini
- `shadow.html` — Method C and D walkthroughs with Pakistan/Norway/Sri Lanka contrasts (v39)
- `landack.html` — land acknowledgement

### Shared assets
- `shared.css` — styling, dark mode pastel palette, Ben10-style green-on-black code blocks (`body.dark code { background: #000; color: #43ff7e; text-shadow: 0 0 6px rgba(67,255,126,0.45); }`), nav forced one-line, `.copy-png-bar` 3-button toolbar
- `shared.js` — **central architecture** (see §3)
- `nav.js`, `tips.js` — small helpers loaded by every page
- `extras.json` — bundled data: `score_matrix`, `capitals`, `hdi`, `hdi_rel`, `gini`, `gini_rel`, `top_drops`, `top_ups`, `stories`, `stories_rel`, `stories_shadow`, `shadow`, `_meta`

### Build artifacts (don't edit)
- `_push_v##.bat` — self-deleting push scripts (see §4)
- `push_log.txt` — last push's stdout/stderr; check this after every push to confirm

## 3 · shared.js architecture (the single most important file)

`shared.js` is one ~900-line IIFE. Critical exports on `window`:

| Symbol | What it does |
|---|---|
| `scrLoadExtras()` | Cached `fetch('extras.json')` so multiple consumers share one network call |
| `scrChartConfig` | Plotly config with `displayModeBar:'always'`, custom Fullscreen modebar button |
| `scrBaseLayout(extra)` | Theme-aware Plotly layout factory |
| `scrApplyChartTheme()` | Pastel color swap via `Plotly.restyle` for dark mode |
| `scrApplyAxisArrows` | Idempotent injection of `→ xtitle`, `↑ ytitle`, `0,0` annotations |
| `wireChartHooks(gd)` | Hooks `plotly_hover` (line thickening), `plotly_unhover` (restore), `plotly_legendclick` (fade isolation), `plotly_afterplot` (re-apply arrows) |
| `attachCopyButton(target)` | 3-button toolbar (Fullscreen / Download PNG / Copy PNG) on tables and worked-example blocks |
| `SCR_REGIONS`, `SCR_REGION_OF`, `SCR_COUNTRIES_IN(region)` | UN-style 6-continent partition over the 142 panel countries (v40) |
| `SCR_PRESET_GROUPS`, `SCR_PRESET_ORDER` | 16 multilateral / political / economic preset peer groups: OECD, BRICS+, EU 27, Eurozone, G7, G20, ASEAN, GCC, NATO, Nordic, SIDS, LDCs, Visegrád Four, MERCOSUR, Pacific Alliance, CIS (v41) |
| `scrRecomputeRelative(rows, peerSet)` | Recomputes LOO mean, M1, M2 (rank), M4 (percentile) client-side for an arbitrary subset (v40) |

### Re-entry guards (do not remove)
The MutationObserver-driven re-styling will infinite-loop without these:
- `gd._scrHooksWired` — set AFTER the readiness check, never before
- `_scrInjectingArrows` — flag while `Plotly.relayout` is mid-flight
- `_scrThemingNow` — flag while theme is being applied
- `_scrArrowsApplied` — once-per-chart so `applyAxisArrows` doesn't re-fire on every observer tick

### Critical fixes that took multiple tries
- **v25 axis-arrow infinite loop** (fixed v32) — `applyAxisArrows` called `Plotly.relayout` inside MutationObserver callback → re-triggered observer → loop. Fix: idempotent check on `_fullLayout.annotations` for existing `_scrAxisArrow` markers + `_scrInjectingArrows` flag
- **Hover glow never fired** (fixed v32) — `wireChartHooks` set `_scrHooksWired = true` BEFORE checking if `gd.on` existed. If called when Plotly wasn't ready yet, it early-returned but the flag prevented later retries. Fix: reorder the two lines
- **Arrows kept disappearing on distance-graded sliders** (fixed v32) — page re-runs `Plotly.newPlot()` on every slider tick, replacing all annotations. Fix: hook `plotly_afterplot` to re-inject arrows after every redraw
- **Arrows looked detached from axis lines** (fixed v33) — fix: use `showarrow:true` with `ax/ay` at axis-end and `x/y` at tip so arrowhead grows out of the axis line itself
- **OneDrive partial-write truncation** (v18→v19) — heavy Python sweeps wrote files mid-tag. Fix: re-fetch from last good GitHub commit, re-apply transforms

## 4 · Pushing workflow (CRITICAL — do this exactly, it's brittle)

The OneDrive-mounted folder blocks `.git` operations from inside the Linux sandbox. Pushes MUST go through a Windows `.bat` file invoked from the Run dialog.

### 4a · Write a self-deleting bat
```batch
@echo off
cd /d "%~dp0"
set GIT="C:\Users\yashm\AppData\Local\GitHubDesktop\app-3.5.8\resources\app\git\cmd\git.exe"
echo === push v## at %DATE% %TIME% === > push_log.txt
%GIT% add <only-the-files-you-changed> >> push_log.txt 2>&1
%GIT% commit -m "v##: <description>" >> push_log.txt 2>&1
%GIT% push origin main >> push_log.txt 2>&1
echo === DONE === >> push_log.txt
del "%~f0"
```

Save as `_push_v##.bat` in the working folder. The trailing `del "%~f0"` removes the bat file after running so old versions don't pile up.

### 4b · Run it
1. `request_access` for "Run" (and "File Explorer" if not already granted)
2. Send `cmd+R` via computer-use → Run dialog opens
3. Click the Open: field → `ctrl+a` + `Delete` to clear (the dialog **remembers the last entry** — don't trust that the field is empty even after triple_click)
4. Type the absolute path with quotes: `"C:\Users\yashm\OneDrive - Cornell University\Desktop\Research\credit rating\cr rating\_push_v##.bat"`
5. Click the **OK button** (coordinate ~138, 785) rather than pressing Enter — Enter sometimes doesn't fire on first try; clicking OK is reliable
6. Wait 8 seconds
7. `Read` `push_log.txt` to confirm `=== DONE ===` and a new commit hash

### 4c · Common failures and fixes
- **"Location is not available" error** — text wasn't cleared, so old + new paths are concatenated. Click in field, ctrl+a, Delete, retry
- **Push log still shows previous version** — bat didn't actually run. Try clicking OK instead of pressing Return
- **GitHub Pages takes ~40 seconds to rebuild** — don't refresh the live site immediately; wait

### 4d · Commit message convention
`v##: <one-line summary>; <detail 1>; <detail 2>; ...`

Semicolons are intentional — they keep everything on one git log line so `git log --oneline` stays scannable. Use em dashes (—) inside detail items for visual separation. Keep ASCII-safe (smart quotes get mangled in the .bat encoding).

## 5 · Version history (v37 onward — earlier in `git log`)

| Version | Commit | What shipped |
|---|---|---|
| v37 | (in log) | Nav menu forced to one line — `flex-wrap: nowrap; overflow-x: auto; font-size: 0.62rem` |
| v38 | `338d7ce` | Rename "Basu RR" → "Basu et al. method" and "De Relativizations" → "De et al. method" globally |
| v39 | `1d3d6d8` | 3-button toolbar (Fullscreen / Download PNG / Copy PNG) on tables and worked-example blocks; Method C beefed up to full step-by-step with Norway/Pakistan/Sri Lanka contrast; Method D added with worked end-to-end via 5-tree forest |
| v40 | `4552b21` | Compare-against selector on Relative HDI/Gini — World, Same continent, Custom subset; new `SCR_REGION_OF` and `scrRecomputeRelative` in shared.js |
| v41 | `de13cee` | 16 preset peer groups added to dropdown (OECD, BRICS+, EU 27, Eurozone, G7, G20, ASEAN, GCC, NATO, Nordic, SIDS, LDCs, Visegrád Four, MERCOSUR, Pacific Alliance, CIS); organised under optgroups |

For everything before v37: `git log --oneline | head -50` from a Windows terminal in the working folder.

## 6 · Pending work (in approximate priority order)

### High priority (user has asked, not yet done)
- **Glossary expansion** (task #42, in_progress) — institutions block: IMF, World Bank, ICRC, MSF, OECD, UN system (UNDP, UNCTAD, UNHCR, OHCHR), BIS, IBRD, IDA, IFC, MIGA, ICSID, Paris Club, London Club, debt-restructuring vocabulary (HIPC, MDRI, DSSI, Common Framework). Earlier Python escape script crashed; retry by editing glossary.html directly with multiple Edit calls
- **Lorenz comparison plots on Gini page** with 45° line (partial — exists but needs a multi-country overlay variant)
- **Hover text inversion in dark mode** — currently has weird white highlight; needs CSS override on `.hovertext`
- **Update sub-tagline** for current relevance (currently: "151 countries · S&P, Moody's, DBRS Morningstar · 2000–2025 · Composite scores (0–60) · Relative methods M1–M4")
- **Distance-map year animation** — Plotly play button cycling 2000→2025
- **Online report links in story endnotes** — every story claim should have an academic / official source linked
- **More historical stories** — user explicitly asked for "the whole set" (5 currently; he wants 10–15+)

### Medium priority (architecturally clean to add)
- **Worked-end-to-end methods on every page** with expandable details (currently only on shadow.html — extend to pairwise, distance, HDI, Gini)
- **Reuse the comparison-set selector on paired_grouped_regional and shadow** — both pages currently hardcode "all countries"; the selector pattern is generic enough to drop in
- **Lazy-load extras.json sections** — currently every page fetches the whole 1 MB; could split

### Low priority (nice to have)
- Population-weighted variant of the Gini LOO mean (mentioned in caveats but not implemented)
- Wealth-Gini track in addition to income-Gini (data source: WID)
- Mobile layout polish — works but cramped

## 7 · Communication style

Yash writes terse, often single-line requests with low ceremony ("bruh", "dawg, please…", "fugly", "no glowwwwww"). The expected response style is:
- Skip preamble, dive into the work
- Push promptly when a feature is complete; don't hold back asking permission
- Show diffs / before-after sparingly — Yash reads the live site, not the explanation
- Acknowledge mistakes briefly when the user calls them out; don't grovel
- After pushing, the standard postamble is one sentence about what's now live + what URL to check

Yash explicitly does NOT want excessive lists, bullet hierarchies, or apology theatre. He wants the bug fixed and the bat file run.

## 8 · Things to be careful about

1. **Never edit `shared.js` lazily** — it's loaded by every page. A regression there breaks the entire site. Mentally test changes against: chart hover, theme toggle, axis arrows on slider redraws, the copy-png button on tables, the comparison-set selector on Relative HDI
2. **Don't run bash git commands** — they fail because OneDrive blocks `.git`. Always go through a `.bat` file
3. **Em dashes (—) display fine but smart quotes ("…") sometimes get mangled by the .bat encoding** — keep commit messages ASCII-safe
4. **Plotly version is 2.27.0** pinned in every HTML — don't bump without testing every chart
5. **GitHub Pages cache is aggressive** — after a push, wait 40 s and force-refresh (Ctrl+Shift+R) to see changes
6. **The dark mode pastel palette has specific swaps** — `'#1a1a1a':'#a9d6f1'` (sky blue), `'#1B4F8A':'#88c4ee'`, etc. Don't introduce new chart colors without adding a swap
7. **OneDrive has occasionally caused partial-write truncation** during heavy Python sweeps — if a file ends mid-tag, fetch the last good version from GitHub and re-apply
8. **The user has 5 different unrelated chats running in parallel** — sometimes a message lands in the wrong chat ("BRMC chat", "wrong chat my bad"). Just acknowledge and continue

## 9 · Quick orientation for the next session

If you're starting fresh:
1. Read this file (`WEBSITE_HANDOFF.md`)
2. Read the older `HANDOFF.md` for the broader research project context (data pipeline, regressions, paper)
3. Read `MEMORY.md` from the auto-memory directory
4. `Read push_log.txt` for the most recent push
5. Wait for Yash's request — he'll tell you what's next

If Yash asks "what's the state?" or "where did we leave off?":
- Last push: v41 `de13cee` — preset peer groups (OECD, BRICS+, etc.) on Relative HDI / Gini
- Next likely: glossary expansion (task #42), more stories, hover text inversion, or a fresh feature he hasn't named yet

---

*End of WEBSITE_HANDOFF.md.*
