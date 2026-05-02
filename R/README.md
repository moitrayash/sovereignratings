# R script suite for the Sovereign Credit Ratings paper

These scripts read the CSVs produced by the Python pipeline (sessions 1–5) and rebuild every regression, table, and figure in R for direct LaTeX/Overleaf integration.

## How to run

From the project root in an R console (or RStudio's "Build → Run All"):

```r
source("R/99_run_all.R")
```

or from the shell:

```bash
Rscript R/99_run_all.R
```

The first run will install any missing packages (see `00_setup.R`).

## Layout

| Script                       | What it produces                                                                       |
|------------------------------|---------------------------------------------------------------------------------------|
| `00_setup.R`                 | Loads packages, sets paths, defines `theme_paper()` and helpers                       |
| `01_load_data.R`             | Reads every CSV / pickle the Python pipeline saved                                    |
| `02_alt_scales.R`            | Eight scale variants → coefficient comparison table + figure 15                       |
| `03_basu_cris.R`             | Basu CRIS / RR — world-avg table, top-mover table, three figures                       |
| `04_de_relative.R`           | Ten De-style relativizations — correlation tables and scatter plots                   |
| `05_shadow_ratings.R`        | Five shadow-rating specs in fixest, LaTeX regression table + tracking diagnostics     |
| `06_per_agency.R`            | Per-agency S&P / Moody's / DBRS shadow models with by-continent gap matrix            |
| `07_main_panel_regs.R`       | Headline panel-FE Models A–D (matches session 2)                                      |
| `08_ordered_models.R`        | Ordered logit / probit (MASS::polr) for upgrade/downgrade transitions                 |
| `09_descriptive_figures.R`   | Distribution / ranking / trends / agency-scatter / volatility (figs 1–6)              |
| `10_gini_relative.R`         | Gini panel — world Gini trend and group × year heatmap                                |
| `99_run_all.R`               | Master driver                                                                          |

## Outputs

All outputs land in `R/out/`:

```
R/out/
├── tables/         <- *.tex files, drop into Overleaf
└── figures/        <- *.pdf and *.png at 300 dpi, paper-ready
```

## Key packages

- **fixest** — fast two-way FE OLS with cluster-robust SE
- **MASS** — ordered logit / probit
- **modelsummary + kableExtra** — LaTeX regression and summary tables
- **ggplot2 + patchwork + viridis** — figures
- **broom + tidyverse** — tidy data manipulation

## Mapping to Python outputs

| Python file                              | R script(s) using it                            |
|------------------------------------------|------------------------------------------------|
| `paper_panel.csv`                        | `01`, `07`, `08`, `09`, `10`, `05`, `06`        |
| `panel_scales.csv`                       | `02`                                            |
| `basu_cris_panel.csv`                    | `03`                                            |
| `de_relative_panel.csv`                  | `04`                                            |
| `shadow_panel.csv`                       | `05`                                            |
| `shadow_per_agency_panel.csv`            | `06`                                            |
| `wb_macro_extra.csv` + `rule_of_law.csv` | `05`, `06`                                      |
| `paper_rel_all.csv`                      | `04`, `10`                                      |
| `paper_gini.csv`                         | `10`                                            |
| `raw_events.csv`                         | `06`, `09`                                      |
| `membership.csv`                         | `05`, `06`                                      |

## Embedding in the paper

In your Overleaf preamble:

```latex
\usepackage{booktabs}
\usepackage{caption}
\usepackage{graphicx}
```

Then for each table:

```latex
\input{tables/tab_main_panel.tex}
\input{tables/tab_shadow_models.tex}
\input{tables/tab_per_agency_models.tex}
% etc.
```

For each figure:

```latex
\begin{figure}
  \centering
  \includegraphics[width=.85\linewidth]{figures/fig25_shadow_actual_scatter.pdf}
  \caption{Actual vs shadow rating, full panel.}
  \label{fig:shadow_scatter}
\end{figure}
```

## Notes

- Cluster-robust SE on **country** is used everywhere a panel structure is exploited.
- `fixest::feols` syntax for two-way fixed effects is `y ~ x1 + x2 | Country + Year`.
- Outputs are deterministic given the same input CSVs (no random seeds needed).
- The `R/out/` directory is gitignorable; the inputs (CSVs) are the canonical artefacts.
