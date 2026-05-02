## ============================================================
## 99_run_all.R
## Master driver. Executes every numbered script in order. Run from
## project root with:
##     Rscript R/99_run_all.R
## ============================================================

scripts <- c(
  "00_setup.R",
  "01_load_data.R",
  "02_alt_scales.R",
  "03_basu_cris.R",
  "04_de_relative.R",
  "05_shadow_ratings.R",
  "06_per_agency.R",
  "07_main_panel_regs.R",
  "08_ordered_models.R",
  "09_descriptive_figures.R",
  "10_gini_relative.R"
)

t0 <- Sys.time()
for (s in scripts) {
  cat("\n========================================\n")
  cat(">> Running R/", s, "\n", sep = "")
  cat("========================================\n")
  source(file.path("R", s), echo = FALSE)
}
cat("\nAll scripts finished in",
    format(Sys.time() - t0), "\n")
cat("Tables in: R/out/tables/\n")
cat("Figures in: R/out/figures/\n")
