## ============================================================
## 02_alt_scales.R
## Replicates the eight rating-scale conversions and the panel-FE
## regressions under each scale. Outputs:
##   tables/tab_alt_scales_coefs.tex
##   tables/tab_alt_scales_within_r2.tex
##   figures/fig15_alt_scales_coefs.{pdf,png}
## ============================================================

source(file.path(here::here(), "R", "01_load_data.R"))

stopifnot("score_60" %in% names(panel_scales))

scale_cols <- c("score_60", "score_21", "score_20", "score_17",
                "score_16", "score_basu60", "score_norm01", "score_logPD")

panel_long_X <- panel_scales %>%
  select(Country, Year, all_of(scale_cols),
         GDP_growth_pct, FDI_pct_GDP, log_GDPpc) %>%
  filter(!is.na(GDP_growth_pct), !is.na(log_GDPpc))

# ---- Specifications (Models A–D from session 2) ---------------
spec_list <- list(
  A_growth_fdi      = c("GDP_growth_pct", "FDI_pct_GDP"),
  B_loggdppc        = c("log_GDPpc"),
  C_growth_loggdppc = c("GDP_growth_pct", "log_GDPpc"),
  D_full            = c("GDP_growth_pct", "FDI_pct_GDP", "log_GDPpc")
)

# ---- Run fixest two-way FE regressions ------------------------
results <- expand.grid(
  scale = scale_cols,
  spec  = names(spec_list),
  stringsAsFactors = FALSE
) %>%
  mutate(model = pmap(list(scale, spec), function(sc, sp) {
    rhs <- paste(spec_list[[sp]], collapse = " + ")
    fml <- as.formula(paste0(sc, " ~ ", rhs, " | Country + Year"))
    feols(fml, data = panel_long_X, vcov = "cluster")
  }))

# ---- Coefficient table --------------------------------------
tidy_results <- results %>%
  mutate(td = map(model, broom::tidy, conf.int = TRUE)) %>%
  select(scale, spec, td) %>%
  unnest(td) %>%
  mutate(stars = case_when(
    p.value < 0.01  ~ "***",
    p.value < 0.05  ~ "**",
    p.value < 0.10  ~ "*",
    TRUE            ~ ""
  ))

write_csv(tidy_results,
          file.path(OUT_DIR, "alt_scales_regressions_R.csv"))

# Coefficient pivot for Spec D
coef_pivot <- tidy_results %>%
  filter(spec == "D_full") %>%
  mutate(coef_fmt = sprintf("%.4f%s", estimate, stars)) %>%
  select(term, scale, coef_fmt) %>%
  pivot_wider(names_from = scale, values_from = coef_fmt)

# Within-R2 pivot
within_r2 <- results %>%
  mutate(r2 = map_dbl(model, ~ fitstat(.x, "wr2")$wr2)) %>%
  select(scale, spec, r2) %>%
  pivot_wider(names_from = scale, values_from = r2)

# ---- LaTeX tables -------------------------------------------
tex_coef <- coef_pivot %>%
  kbl(format = "latex", booktabs = TRUE,
      caption = "Spec-D coefficients (regressor on score, country + year FE, clustered SE) under alternative numerical scales.",
      label = "tab:alt_scales_coefs") %>%
  kable_styling(latex_options = c("scale_down", "HOLD_position"))

tex_r2 <- within_r2 %>%
  mutate(across(-spec, ~ sprintf("%.4f", .x))) %>%
  kbl(format = "latex", booktabs = TRUE,
      caption = "Within-$R^2$ for each spec × scale combination.",
      label = "tab:alt_scales_within_r2") %>%
  kable_styling(latex_options = c("scale_down", "HOLD_position"))

write_tex(as.character(tex_coef), "tab_alt_scales_coefs")
write_tex(as.character(tex_r2),   "tab_alt_scales_within_r2")

# ---- Figure: coefficient on log_GDPpc and GDP_growth ---------
plot_data <- tidy_results %>%
  filter(spec == "D_full",
         term %in% c("log_GDPpc", "GDP_growth_pct")) %>%
  mutate(scale = factor(scale, levels = rev(scale_cols)))

p_alt <- ggplot(plot_data,
                aes(x = estimate, y = scale,
                    color = p.value < 0.05)) +
  geom_vline(xintercept = 0, linewidth = 0.4, color = "black") +
  geom_pointrange(aes(xmin = conf.low, xmax = conf.high),
                  size = 0.6, fatten = 2) +
  facet_wrap(~ term, scales = "free_x") +
  scale_color_manual(values = c("TRUE" = "#1f77b4",
                                "FALSE" = "gray70"),
                     name = "p < 0.05") +
  labs(x = "Coefficient (95% CI)", y = NULL,
       title = "Macro coefficients across alternative rating scales",
       subtitle = "Spec D: country + year FE, clustered SE")

save_fig(p_alt, "fig15_alt_scales_coefs", w = 9, h = 4.5)
cat("Done: 02_alt_scales.R\n")
