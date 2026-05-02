# Handoff for next session — Sovereign Credit Ratings paper, R/LaTeX compilation

This is a continuation of the project documented in `HANDOFF.md` (sessions 1–4) and `session5_summary.md` (session 5). Session 6 was about wrapping the analysis into a publication-grade PDF via R + LaTeX. The user is **Yash Moitra**, Cornell graduate researcher. He is preparing this paper for publication and has had/is having conversations with **Kaushik Basu** (Cornell, ex-WB Chief Economist), **Supriyo De** (World Bank), and **Pedro Conceição** (UNDP HDRO Director). Their published work — Basu/De/Ratha/Timmer (2013, WPS 6641), Ratha/De/Mohapatra (2007, WPS 4269), and the UNDP *Lowering the Cost of Borrowing in Africa* report — is the methodological backbone of the paper.

## Where the work stands

### Done (sessions 1–5, Python pipeline)
- 150 countries × 26 years (2000–2025) panel of S&P / Moody's / DBRS sovereign ratings on a 0–60 composite scale.
- Master panel + macro covariates (GDP, growth, FDI, population) at `paper_panel.csv`.
- Eight alternative rating scales (Cantor-Packer 16, Afonso 17, BIS 20, Standard 21, Basu 60-mirror, log-PD, normalized 0–1, our 0–60) at `panel_scales.csv`. Regressions invariant to scale choice.
- Basu/CRIS Relative Risk Rating computed for full panel at `basu_cris_panel.csv`.
- Ten De-style relativizations at `de_relative_panel.csv` (correlate r ≥ 0.93 with our existing M1–M4).
- Five-spec shadow rating model (best fit S2: R² = 0.762, RMSE 8 pts) at `shadow_panel.csv` and `_shadow_panel.pkl`. Rule of Law from WGI via data360 API; inflation, ext-debt, reserves, gov-debt, current-account from WB API.
- Per-agency tracking diagnostics at `shadow_per_agency_panel.csv`. S&P R²=0.764, Moody's 0.734, DBRS 0.668. Africa average gap ~−0.8 (small under-rating), South America ~−3, advanced economies systematically over-rated by +10 to +17.
- All Python scripts on disk: `alt_scales.py`, `basu_cris.py`, `de_relative.py`, `shadow_ratings.py`, `shadow_per_agency.py`, etc. Outputs documented in `session5_summary.md`.

### Done (session 6, R + LaTeX pipeline)
- `R/paper_pipeline.R` — single self-contained R script that reads the CSVs and produces:
  - 19 figures in `R/out/figures/` (PDF + PNG 300dpi). All ggplot2 with **default theme + default palettes** (no viridis, no RColorBrewer, no custom hex colors — explicitly requested by user as "boring plain and old and default").
  - 15 LaTeX tables in `R/out/tables/` (booktabs format only — `kable_styling()` calls were stripped).
  - Regressions in `fixest::feols` with `cluster = ~ Country` (NOT `vcov = "cluster"` — they conflict in the user's fixest version).
  - Ordered logit/probit via `MASS::polr` (called with namespace prefix; MASS is installed but **not attached** because `MASS::select` masks `dplyr::select`).
- `R/paper.Rmd` — knit driver that builds the PDF. Layout:
  - **Cover page** (titlepage block, centered, no TOC).
  - **One figure or table per page**, vertically + horizontally centered, with bold title and italic subtitle. Achieved via a `slide()` helper that wraps content in `\null\vfill\begin{center}...\end{center}\vfill\clearpage`.
  - **Appendix** with seven `longtable`s pulling the full CSVs: paper_panel (~3,300), panel_scales, basu_cris_panel, de_relative_panel, shadow_panel, paper_gini (~1,400), and **paper_rel_all (~23,000 rows × 12 cols)** — the user explicitly wanted this last one in full.

### Last error and the latest fix (knit attempt #N)
- After multiple cycles fighting LaTeX deps, the recurring error was **`! LaTeX Error: File 'tabu.sty' not found.`**
- Root cause discovered: `library(kableExtra)` in the Rmd's setup chunk auto-injects `\usepackage{tabu}` into the preamble *regardless* of whether `kable_styling()` is called. The `tabu` package has been retired from CTAN and is not on the Oxford or rafal.ca MiKTeX mirrors.
- Fix applied in this session: removed `library(kableExtra)` from `paper.Rmd`'s setup chunk; switched the appendix `appendix_table()` helper from `kbl()` to `knitr::kable()` (which doesn't inject anything). `paper_pipeline.R` had its `kable_styling()` calls stripped earlier.
- **Status: awaiting next knit attempt.** The Rmd now uses `knitr::kable(format = "latex", booktabs = TRUE, longtable = TRUE)` for the appendix tables, and the pipeline's tex files were already plain `kbl()` without `kable_styling()`.

### Other LaTeX deps the Rmd depends on (already in `header-includes`)
- booktabs, longtable, array, multirow, float, xcolor, graphicx, caption, amsmath
- tabularray + codehigh + ulem (these support tinytable/modelsummary regression tables — `\begin{talltblr}`)
- placeins
- The 4 `\NewTableCommand{\tinytableDefineColor}...` lines plus `\UseTblrLibrary{booktabs, siunitx}`

User has MiKTeX with **"install on the fly = Always"**. tabu still doesn't install because it's not in the repo.

## File map

```
cr rating/
├── HANDOFF.md                 # sessions 1-4
├── session5_summary.md        # session 5
├── HANDOFF_SESSION6.md        # this file
├── paper_panel.csv            # main 3,323-row panel (Country×Year×macros×score)
├── paper_rel_all.csv          # 23,087 rows × 12 cols (M1-M4 across 59 groups)
├── paper_gini.csv             # 1,438 rows
├── panel_scales.csv           # +8 scale variants
├── basu_cris_panel.csv        # Basu RR / CRIS
├── de_relative_panel.csv      # 10 De relativizations
├── shadow_panel.csv           # 5-spec shadow predictions
├── shadow_per_agency_panel.csv
├── wb_macro_extra.csv         # inflation, debt, reserves, etc.
├── rule_of_law.csv            # WGI Rule of Law (-2.5 to 2.5)
├── raw_events.csv             # rating events long format
├── membership.csv             # Country × group flags + Continent col
├── _*.pkl                     # Python pickle versions of the above
├── WPS6641.pdf, wps4269.pdf   # source papers (Basu, Ratha-De-Mohapatra)
├── R/
│   ├── paper_pipeline.R       # generates all tables and figures
│   ├── paper.Rmd              # knit-to-PDF driver (cover + 1-per-page + appendix)
│   ├── README.md              # mapping of inputs to scripts
│   └── out/
│       ├── tables/*.tex       # 15 paper-ready LaTeX tables
│       └── figures/*.{pdf,png}# 19 paper-ready figures
└── (older session 1-4 figures fig01-fig14 and session 5 figs 15-30 in root)
```

## Important conventions / preferences (decoded over the conversation)

- **Plain default styling only.** No custom themes, hex colors, viridis, RColorBrewer, ggrepel, scale_*_manual, or fancy palettes anywhere in the R figures. The user called the colored output "Claude-coded" and asked for it stripped to defaults. Honor this.
- **`fixest::feols` syntax**: `cluster = ~ Country` only, never `vcov = "cluster"` paired with it.
- **MASS handling**: don't `library(MASS)`; use `MASS::polr()` with the namespace prefix. MASS exports a `select()` that masks dplyr's.
- **Defensive aliases at top of pipeline:** `select <- dplyr::select; filter <- dplyr::filter`.
- **One slide per page** in the PDF, cover-style — not a multi-figure-per-page layout.
- **Long appendix tables go in via `longtable` with `repeat_header`** (used to be), now just `longtable`.
- **The user is at Cornell.** His email: yashmoitratales@gmail.com. The project folder is `C:/Users/yashm/OneDrive - Cornell University/Desktop/Research/credit rating/cr rating`. Path syntax in R uses forward slashes.

## What's likely next

1. Re-knit `paper.Rmd`. If the tabu error is gone, verify the cover page, the one-per-page layout, the appendix tables (especially A7 with 23k rows — knit will be slow, expect 5–15 min).
2. If a new LaTeX error appears, the user's MiKTeX has auto-install Always-on but won't fetch packages that have been removed from CTAN. Solve in R-land (drop the offending package call) rather than fighting MiKTeX.
3. After the PDF compiles cleanly, the user will likely want polish: fix lingering modelsummary cosmetic issues (`\%` showing as literal `\%`, `R$^2$` showing as raw text — those are in the regression tables produced by modelsummary's tinytable output and need to be fixed in the `coef_rename` and `gof_map` of `paper_pipeline.R` — drop the `\\%` escapes and use `R²` Unicode, then re-run pipeline).
4. After polish: write the actual paper prose in the Rmd between the cover page and the figures. Currently there's only a one-paragraph Introduction stub.
5. The user has a longer-term plan to publish to a journal. Sections he has flagged for next session in `session5_summary.md`: GMM/Arellano-Bond, default-event dummy, cross-section comparison to De et al.'s 0.78–0.82 R², D3 world-map choropleth, applying RR to predicted shadow scores.

## How to talk to this user

- Concise responses. He likes terse and direct over verbose explanations.
- He'll paste R/MiKTeX/LaTeX error output expecting a fix, not an essay.
- He uses casual / playful phrasing ("my brother in christ", "boring plain and old and default lol", "uh get tabu"). Match his register but stay focused on the problem.
- He's competent in Python and R; can read and run code without hand-holding. Don't over-explain syntax.
- When you patch a script, save the file AND show the relevant change so he can sanity-check.
