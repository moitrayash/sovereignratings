## ============================================================
## 00_setup.R
## Common settings, packages, paths, ggplot theme.
## Source this at the top of every other script via:
##     source(file.path(here::here(), "R", "00_setup.R"))
## ============================================================

# ---- Packages -------------------------------------------------
pkgs_required <- c(
  "here", "tidyverse", "readr", "data.table",
  "fixest", "MASS",          # panel & ordered models
  "modelsummary", "kableExtra", "broom", # tables
  "ggplot2", "patchwork", "scales", "viridis", "RColorBrewer", # figures
  "ggrepel"
)
to_install <- pkgs_required[!pkgs_required %in% installed.packages()[, "Package"]]
if (length(to_install))
  install.packages(to_install, repos = "https://cran.rstudio.com")

invisible(lapply(pkgs_required, library, character.only = TRUE))

# ---- Paths ----------------------------------------------------
PROJ_DIR <- here::here()
DATA_DIR <- PROJ_DIR
OUT_DIR  <- file.path(PROJ_DIR, "R", "out")
TAB_DIR  <- file.path(OUT_DIR, "tables")
FIG_DIR  <- file.path(OUT_DIR, "figures")
dir.create(OUT_DIR, showWarnings = FALSE, recursive = TRUE)
dir.create(TAB_DIR, showWarnings = FALSE, recursive = TRUE)
dir.create(FIG_DIR, showWarnings = FALSE, recursive = TRUE)

# ---- ggplot theme (paper-ready) -------------------------------
theme_paper <- function(base_size = 11) {
  theme_minimal(base_size = base_size) +
    theme(
      plot.title       = element_text(face = "bold", size = base_size + 1),
      plot.subtitle    = element_text(color = "gray30", size = base_size - 1),
      panel.grid.minor = element_blank(),
      panel.grid.major = element_line(linewidth = 0.25, color = "gray85"),
      strip.background = element_rect(fill = "gray95", color = NA),
      strip.text       = element_text(face = "bold"),
      legend.position  = "bottom",
      legend.title     = element_text(size = base_size - 1)
    )
}
theme_set(theme_paper())

# ---- Helpers --------------------------------------------------
save_fig <- function(plot, name, w = 7, h = 5, dpi = 300) {
  ggsave(file.path(FIG_DIR, paste0(name, ".pdf")),
         plot, width = w, height = h, units = "in")
  ggsave(file.path(FIG_DIR, paste0(name, ".png")),
         plot, width = w, height = h, units = "in", dpi = dpi)
  invisible(plot)
}

write_tex <- function(tex_content, name) {
  fp <- file.path(TAB_DIR, paste0(name, ".tex"))
  writeLines(tex_content, fp)
  message("Wrote ", fp)
  invisible(fp)
}

cat("Setup complete. Project dir:", PROJ_DIR, "\n")
cat("Outputs go to:", OUT_DIR, "\n")
