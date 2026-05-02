## ============================================================
## 08_ordered_models.R
## Replicates the ordered logit / probit transition models from
## session 2 in R using MASS::polr. Computes the same dependent
## variable: rating change direction (Downgrade / Stable / Upgrade)
## as a function of lagged macro variables.
##   tables/tab_ordered_models.tex
##   figures/fig30_ordered_coefs.{pdf,png}
## ============================================================

source(file.path(here::here(), "R", "01_load_data.R"))

# Build transitions: per Country-Year, change relative to last year
trans <- panel_master %>%
  arrange(Country, Year) %>%
  group_by(Country) %>%
  mutate(prev_score = lag(CompositeScore),
         change = CompositeScore - prev_score,
         direction = case_when(
           change > 0  ~ "Upgrade",
           change < 0  ~ "Downgrade",
           TRUE        ~ "Stable"
         )) %>%
  ungroup() %>%
  mutate(direction = factor(direction,
                            levels = c("Downgrade","Stable","Upgrade"),
                            ordered = TRUE))

# Lagged regressors
trans <- trans %>%
  group_by(Country) %>%
  mutate(lag_growth = lag(GDP_growth_pct),
         lag_fdi    = lag(FDI_pct_GDP),
         lag_loggdp = lag(log_GDPpc),
         lag_score  = lag(CompositeScore)) %>%
  ungroup() %>%
  drop_na(direction, lag_growth, lag_fdi, lag_loggdp, lag_score)

# ---- Ordered logit & probit --------------------------------
m_logit  <- MASS::polr(direction ~ lag_growth + lag_fdi +
                                  lag_loggdp + lag_score,
                       data = trans, method = "logistic", Hess = TRUE)
m_probit <- MASS::polr(direction ~ lag_growth + lag_fdi +
                                  lag_loggdp + lag_score,
                       data = trans, method = "probit", Hess = TRUE)

ms <- modelsummary(
  list("Ordered logit" = m_logit, "Ordered probit" = m_probit),
  output = "latex",
  fmt = 3,
  stars = c("*" = 0.10, "**" = 0.05, "***" = 0.01),
  gof_map = tribble(~raw, ~clean, ~fmt,
                    "nobs",       "N",        0,
                    "logLik",     "Log-Lik.", 1,
                    "aic",        "AIC",      1),
  coef_rename = c(
    "lag_growth" = "Lagged GDP growth (\\%)",
    "lag_fdi"    = "Lagged FDI (\\% GDP)",
    "lag_loggdp" = "Lagged log GDP per capita",
    "lag_score"  = "Lagged composite score"
  ),
  title = "Ordered-response models for rating-change direction (Downgrade < Stable < Upgrade).",
  notes = "* p<0.10, ** p<0.05, *** p<0.01."
)
write_tex(as.character(ms), "tab_ordered_models")

# ---- Coefficient plot --------------------------------------
coefs <- bind_rows(
  broom::tidy(m_logit) %>% mutate(model = "Ordered logit"),
  broom::tidy(m_probit) %>% mutate(model = "Ordered probit")
) %>% filter(coef.type == "coefficient")

p_ord <- ggplot(coefs,
                aes(estimate, fct_reorder(term, estimate),
                    color = model)) +
  geom_vline(xintercept = 0, linewidth = 0.4) +
  geom_pointrange(aes(xmin = estimate - 1.96 * std.error,
                       xmax = estimate + 1.96 * std.error),
                  position = position_dodge(width = 0.6),
                  size = 0.5, fatten = 2) +
  scale_color_brewer(palette = "Dark2") +
  labs(title = "Ordered-response coefficients (Downgrade ← Stable → Upgrade)",
       x = "Coefficient (95% CI)", y = NULL, color = NULL)

save_fig(p_ord, "fig30_ordered_coefs", w = 8, h = 4.5)
cat("Done: 08_ordered_models.R\n")
