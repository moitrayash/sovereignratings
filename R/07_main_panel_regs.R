## ============================================================
## 07_main_panel_regs.R
## Reproduces the four headline panel regressions (Models A–D from
## session 2) on the standard 0-60 score with country + year FE
## and writes a publication-grade LaTeX table.
##   tables/tab_main_panel.tex
## ============================================================

source(file.path(here::here(), "R", "01_load_data.R"))

d <- panel_master %>% drop_na(CompositeScore)

mods <- list(
  "Model A" = feols(CompositeScore ~ GDP_growth_pct + FDI_pct_GDP
                                 | Country + Year, data = d,
                    vcov = "cluster", cluster = ~ Country),
  "Model B" = feols(CompositeScore ~ log_GDPpc
                                 | Country + Year, data = d,
                    vcov = "cluster", cluster = ~ Country),
  "Model C" = feols(CompositeScore ~ GDP_growth_pct + log_GDPpc
                                 | Country + Year, data = d,
                    vcov = "cluster", cluster = ~ Country),
  "Model D" = feols(CompositeScore ~ GDP_growth_pct + FDI_pct_GDP + log_GDPpc
                                 | Country + Year, data = d,
                    vcov = "cluster", cluster = ~ Country)
)

ms <- modelsummary(
  mods,
  output = "latex",
  fmt = 3,
  stars = c("*" = 0.10, "**" = 0.05, "***" = 0.01),
  gof_map = tribble(~raw, ~clean, ~fmt,
                    "nobs",        "N",        0,
                    "r.squared",   "R$^2$",    3,
                    "adj.r.squared","Adj. R$^2$",3,
                    "FE: Country", "Country FE", 0,
                    "FE: Year",    "Year FE",    0),
  coef_rename = c(
    "GDP_growth_pct" = "GDP growth (\\%)",
    "FDI_pct_GDP"    = "FDI (\\% GDP)",
    "log_GDPpc"      = "log GDP per capita"
  ),
  title = "Main panel-FE regressions of composite sovereign rating on macro fundamentals. Cluster-robust SE on country.",
  notes = "* p<0.10, ** p<0.05, *** p<0.01."
)

write_tex(as.character(ms), "tab_main_panel")
cat("Done: 07_main_panel_regs.R\n")
