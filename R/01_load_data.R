## ============================================================
## 01_load_data.R
## Loads every panel/CSV produced by the Python pipeline. All later
## scripts source this one and use the named tibbles below.
## ============================================================

source(file.path(here::here(), "R", "00_setup.R"))

# Master annual panel with macro covariates and our composite score
panel_master <- read_csv(
  file.path(DATA_DIR, "paper_panel.csv"),
  show_col_types = FALSE
) %>%
  mutate(across(c(Country, ISO2, ISO3), as.character),
         Year = as.integer(Year))

# Eight scale variants (session 5)
panel_scales <- read_csv(
  file.path(DATA_DIR, "panel_scales.csv"),
  show_col_types = FALSE
)

# Basu / CRIS computations
basu <- read_csv(
  file.path(DATA_DIR, "basu_cris_panel.csv"),
  show_col_types = FALSE
)

# De-style relativizations
de_rel <- read_csv(
  file.path(DATA_DIR, "de_relative_panel.csv"),
  show_col_types = FALSE
)

# Shadow rating panel (composite-level)
shadow <- read_csv(
  file.path(DATA_DIR, "shadow_panel.csv"),
  show_col_types = FALSE
)

# Per-agency shadow panel
shadow_ag <- read_csv(
  file.path(DATA_DIR, "shadow_per_agency_panel.csv"),
  show_col_types = FALSE
)

# WB macro extras + Rule of Law
wb_extras <- read_csv(
  file.path(DATA_DIR, "wb_macro_extra.csv"),
  show_col_types = FALSE
)
rule_of_law <- read_csv(
  file.path(DATA_DIR, "rule_of_law.csv"),
  show_col_types = FALSE
)

# Per-agency raw events (long format, one row per rating change)
events <- read_csv(
  file.path(DATA_DIR, "raw_events.csv"),
  show_col_types = FALSE
)

# Group membership (Country × group flags)
member <- read_csv(
  file.path(DATA_DIR, "membership.csv"),
  show_col_types = FALSE
)

# Existing relative ratings (M1-M4 across 59 groups)
rel_all <- read_csv(
  file.path(DATA_DIR, "paper_rel_all.csv"),
  show_col_types = FALSE
)

# Gini panel
gini_panel <- read_csv(
  file.path(DATA_DIR, "paper_gini.csv"),
  show_col_types = FALSE
)

cat("Loaded datasets:\n")
purrr::iwalk(
  list(panel_master = panel_master, panel_scales = panel_scales,
       basu = basu, de_rel = de_rel, shadow = shadow,
       shadow_ag = shadow_ag, wb_extras = wb_extras,
       rule_of_law = rule_of_law, events = events,
       member = member, rel_all = rel_all, gini_panel = gini_panel),
  ~ cat(sprintf("  %-15s %5d rows × %d cols\n",
                .y, nrow(.x), ncol(.x)))
)
