## ============================================================
## 06_per_agency.R
## Estimates the shadow rating model agency-by-agency (S&P, Moody's,
## DBRS) and computes per-agency tracking statistics. Then it builds
## the "gap by continent × agency" matrix conditional on the country
## actually being rated by that agency.
##
## Outputs:
##   tables/tab_per_agency_models.tex
##   tables/tab_per_agency_tracking.tex
##   tables/tab_per_agency_gap_continent.tex
##   figures/fig28_per_agency_coefs.{pdf,png}
##   figures/fig29_per_agency_gap_continent.{pdf,png}
## ============================================================

source(file.path(here::here(), "R", "01_load_data.R"))

# ---- Build per-agency-year regression input -----------------
panel_full <- events %>%
  select(Country, ISO2, Year, Agency, Rating, Score) %>%
  left_join(panel_master %>% select(Country, ISO3),
            by = "Country") %>%
  distinct() %>%
  left_join(panel_master %>% select(Country, Year,
                                     log_GDPpc, GDP_growth_pct,
                                     FDI_pct_GDP),
            by = c("Country","Year")) %>%
  left_join(wb_extras, by = c("ISO3","Year")) %>%
  left_join(rule_of_law, by = c("ISO3","Year")) %>%
  arrange(Country, Year) %>%
  group_by(Country) %>%
  mutate(GrowthVol_5y = zoo::rollapply(GDP_growth_pct, 5,
                                        FUN = sd, fill = NA,
                                        align = "right", partial = 3)) %>%
  ungroup()

regs_S2 <- c("log_GDPpc","GDP_growth_pct","GrowthVol_5y","Inflation_pct",
             "RuleOfLaw","CurrentAccount_pct")

# ---- Fit one OLS per agency with cluster-robust SE ----------
agencies <- c("S&P", "Moody's", "DBRS")
ag_models <- map(agencies, function(ag) {
  d <- panel_full %>% filter(Agency == ag) %>% drop_na(Score, all_of(regs_S2))
  feols(as.formula(
          paste0("Score ~ ", paste(regs_S2, collapse = " + "))),
        data = d, vcov = "cluster", cluster = ~ Country)
})
names(ag_models) <- agencies

# ---- Regression table ---------------------------------------
ms_tex <- modelsummary(
  ag_models,
  output = "latex",
  fmt = 3,
  stars = c("*" = 0.10, "**" = 0.05, "***" = 0.01),
  gof_map = tribble(~raw, ~clean, ~fmt,
                    "nobs",        "N",        0,
                    "r.squared",   "R$^2$",    3,
                    "adj.r.squared","Adj. R$^2$", 3),
  coef_rename = c(
    "(Intercept)" = "Constant",
    "log_GDPpc" = "log GDP per capita",
    "GDP_growth_pct" = "GDP growth (\\%)",
    "GrowthVol_5y" = "Growth volatility",
    "Inflation_pct" = "Inflation (\\%)",
    "RuleOfLaw" = "Rule of Law",
    "CurrentAccount_pct" = "Current account (\\% GDP)"
  ),
  title = "Per-agency shadow-rating regressions (Spec S2). Cluster-robust SE on country.",
  notes = "* p<0.10, ** p<0.05, *** p<0.01."
)
write_tex(as.character(ms_tex), "tab_per_agency_models")

# ---- Per-agency tracking diagnostics ------------------------
get_tracking <- function(mod, ag) {
  d <- panel_full %>% filter(Agency == ag) %>% drop_na(Score, all_of(regs_S2))
  pred <- predict(mod, newdata = d) %>% pmax(0) %>% pmin(60)
  e <- d$Score - pred
  tibble(Agency = ag,
         N = nrow(d),
         R2 = 1 - sum(e^2) / sum((d$Score - mean(d$Score))^2),
         RMSE = sqrt(mean(e^2)),
         MAE = mean(abs(e)),
         Bias = mean(e),
         Pearson = cor(d$Score, pred),
         Spearman = cor(d$Score, pred, method = "spearman"),
         Within3 = mean(abs(e) <= 3),
         Within6 = mean(abs(e) <= 6))
}

tracking_ag <- map2_dfr(ag_models, agencies, get_tracking)

write_tex(
  as.character(
    tracking_ag %>%
      mutate(across(where(is.numeric) & !N, ~ sprintf("%.3f", .x))) %>%
      kbl(format = "latex", booktabs = TRUE,
          caption = "Per-agency tracking diagnostics (Spec S2).",
          label = "tab:per_agency_tracking") %>%
      kable_styling(latex_options = c("HOLD_position"))
  ),
  "tab_per_agency_tracking"
)

# ---- Coefficient comparison plot ----------------------------
coefs_df <- imap_dfr(ag_models, function(m, ag) {
  broom::tidy(m, conf.int = TRUE) %>% mutate(Agency = ag)
}) %>%
  filter(term != "(Intercept)") %>%
  mutate(term = factor(term, levels = rev(regs_S2)))

p_coef <- ggplot(coefs_df, aes(estimate, term, color = Agency)) +
  geom_vline(xintercept = 0, linewidth = 0.4) +
  geom_pointrange(aes(xmin = conf.low, xmax = conf.high),
                  position = position_dodge(width = 0.6),
                  size = 0.5, fatten = 2) +
  scale_color_brewer(palette = "Set1") +
  labs(title = "Shadow-rating coefficients: S&P, Moody's, DBRS",
       subtitle = "Spec S2. Cluster-robust 95% CI on country.",
       x = "Coefficient (95% CI)", y = NULL)

save_fig(p_coef, "fig28_per_agency_coefs", w = 9, h = 5)

# ---- Per-agency gap by continent (rated rows only) ----------
country_continent <- member %>% select(Country, Continent) %>% distinct()

gap_df <- imap_dfr(ag_models, function(m, ag) {
  d <- panel_full %>% filter(Agency == ag) %>% drop_na(Score, all_of(regs_S2))
  d$pred <- predict(m, newdata = d) %>% pmax(0) %>% pmin(60)
  d %>%
    mutate(gap = Score - pred, Agency = ag) %>%
    inner_join(country_continent, by = "Country") %>%
    group_by(Agency, Continent) %>%
    summarise(N = n(),
              mean_gap = mean(gap, na.rm = TRUE),
              sd_gap = sd(gap, na.rm = TRUE),
              .groups = "drop")
})

write_tex(
  as.character(
    gap_df %>%
      mutate(mean_gap = sprintf("%+.2f", mean_gap),
             sd_gap = sprintf("%.2f", sd_gap)) %>%
      kbl(format = "latex", booktabs = TRUE,
          caption = "Average rating gap (Actual − Shadow) by continent × agency, conditional on country being rated.",
          label = "tab:per_agency_gap_continent") %>%
      kable_styling(latex_options = c("HOLD_position"))
  ),
  "tab_per_agency_gap_continent"
)

p_gap <- gap_df %>%
  mutate(Continent = factor(Continent,
                            levels = c("Africa","South_America",
                                       "North_America","Oceania",
                                       "Europe","Asia"))) %>%
  ggplot(aes(Continent, mean_gap, fill = Agency)) +
  geom_col(position = position_dodge(0.7), width = 0.65) +
  geom_hline(yintercept = 0, linewidth = 0.5) +
  scale_fill_brewer(palette = "Set1") +
  labs(title = "Average rating gap by continent and agency",
       subtitle = "Negative = under-rated relative to fundamentals (Spec S2)",
       x = NULL, y = "Mean Actual − Shadow (notches)")

save_fig(p_gap, "fig29_per_agency_gap_continent", w = 9, h = 5)
cat("Done: 06_per_agency.R\n")
