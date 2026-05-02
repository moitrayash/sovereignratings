## ============================================================
## 05_shadow_ratings.R
## Replicates and extends Ratha-De-Mohapatra (2007) shadow rating
## model in R using fixest::feols with cluster-robust SE on country.
## Reproduces the five specifications S0..S4 and produces:
##   tables/tab_shadow_models.tex     (LaTeX regression table)
##   tables/tab_shadow_tracking.tex   (overall tracking diagnostics)
##   tables/tab_shadow_continent.tex  (residual by continent)
##   figures/fig25_shadow_actual_scatter.{pdf,png}
##   figures/fig26_shadow_residuals_topbot.{pdf,png}
##   figures/fig27_shadow_resid_continent_heatmap.{pdf,png}
## ============================================================

source(file.path(here::here(), "R", "01_load_data.R"))

# ---- Build a single panel with all regressors ---------------
panel_shadow_X <- panel_master %>%
  left_join(wb_extras, by = c("ISO3", "Year")) %>%
  left_join(rule_of_law, by = c("ISO3", "Year")) %>%
  arrange(Country, Year) %>%
  group_by(Country) %>%
  mutate(GrowthVol_5y = zoo::rollapply(GDP_growth_pct, 5,
                                        FUN = sd, fill = NA,
                                        align = "right", partial = 3)) %>%
  ungroup() %>%
  mutate(log_Population = log(pmax(Population, 1, na.rm = TRUE)))

# If zoo isn't installed, fall back to slider
if (!"zoo" %in% installed.packages()[, "Package"]) {
  panel_shadow_X <- panel_master %>%
    left_join(wb_extras, by = c("ISO3", "Year")) %>%
    left_join(rule_of_law, by = c("ISO3", "Year")) %>%
    arrange(Country, Year) %>%
    group_by(Country) %>%
    mutate(GrowthVol_5y = slider::slide_dbl(GDP_growth_pct,
                                             sd, .before = 4,
                                             .complete = FALSE)) %>%
    ungroup() %>%
    mutate(log_Population = log(pmax(Population, 1, na.rm = TRUE)))
}

# ---- Five specifications -----------------------------------
specs <- list(
  S0 = c("log_GDPpc", "GDP_growth_pct"),
  S1 = c("log_GDPpc", "GDP_growth_pct", "GrowthVol_5y", "Inflation_pct"),
  S2 = c("log_GDPpc", "GDP_growth_pct", "GrowthVol_5y", "Inflation_pct",
         "RuleOfLaw", "CurrentAccount_pct"),
  S3 = c("log_GDPpc", "GDP_growth_pct", "GrowthVol_5y", "Inflation_pct",
         "RuleOfLaw", "CurrentAccount_pct",
         "ExtDebt_pct_GNI", "Reserves_Imports_mo"),
  S4 = c("log_GDPpc", "GDP_growth_pct", "GrowthVol_5y", "Inflation_pct",
         "RuleOfLaw", "CurrentAccount_pct",
         "ExtDebt_pct_GNI", "Reserves_Imports_mo",
         "FDI_pct_GDP", "log_Population")
)

models <- map(specs, function(rhs) {
  fml <- as.formula(paste0("CompositeScore ~ ",
                           paste(rhs, collapse = " + ")))
  feols(fml, data = panel_shadow_X, vcov = "cluster",
        cluster = ~ Country)
})

# ---- LaTeX regression table via modelsummary ---------------
gof <- tribble(
  ~raw,        ~clean,            ~fmt,
  "nobs",      "N",               0,
  "r.squared", "R$^2$",           3,
  "adj.r.squared","Adj. R$^2$",   3
)

ms_tex <- modelsummary(
  models,
  output = "latex",
  fmt = 3,
  gof_map = gof,
  stars = c("*" = 0.10, "**" = 0.05, "***" = 0.01),
  coef_rename = c(
    "(Intercept)" = "Constant",
    "log_GDPpc" = "log GDP per capita",
    "GDP_growth_pct" = "GDP growth (\\%)",
    "GrowthVol_5y" = "Growth volatility (5-yr SD)",
    "Inflation_pct" = "Inflation (\\%)",
    "RuleOfLaw" = "Rule of Law (WGI)",
    "CurrentAccount_pct" = "Current account (\\% GDP)",
    "ExtDebt_pct_GNI" = "Ext. debt (\\% GNI)",
    "Reserves_Imports_mo" = "Reserves (mo. imports)",
    "FDI_pct_GDP" = "FDI (\\% GDP)",
    "log_Population" = "log Population"
  ),
  title = "Shadow rating model — five specifications. Dependent variable: CompositeScore (0–60). Cluster-robust SE on country.",
  notes = "Significance: * p<0.10, ** p<0.05, *** p<0.01."
)
write_tex(as.character(ms_tex), "tab_shadow_models")

# ---- Generate predictions and tracking diagnostics ---------
predict_shadow <- function(mod, data, regs) {
  X <- data
  for (c in regs) {
    if (any(is.na(X[[c]]))) {
      med_country <- X %>% group_by(Country) %>%
        mutate(.med = median(.data[[c]], na.rm = TRUE)) %>%
        ungroup() %>% pull(.med)
      X[[c]][is.na(X[[c]])] <- med_country[is.na(X[[c]])]
      X[[c]][is.na(X[[c]])] <- median(X[[c]], na.rm = TRUE)
    }
  }
  pred <- predict(mod, newdata = X)
  pmax(pmin(pred, 60), 0)
}

shadow_full <- panel_shadow_X
for (k in names(models)) {
  shadow_full[[paste0("Shadow_", k)]] <-
    predict_shadow(models[[k]], shadow_full, specs[[k]])
}
shadow_full <- shadow_full %>%
  mutate(resid_S2 = CompositeScore - Shadow_S2,
         resid_S4 = CompositeScore - Shadow_S4)
write_csv(shadow_full, file.path(OUT_DIR, "shadow_full_R.csv"))

stats <- function(actual, pred) {
  ok <- !is.na(actual) & !is.na(pred)
  a <- actual[ok]; p <- pred[ok]; e <- a - p
  list(N = length(a),
       RMSE = sqrt(mean(e^2)),
       MAE = mean(abs(e)),
       Bias = mean(e),
       R2 = 1 - sum(e^2) / sum((a - mean(a))^2),
       Pearson = cor(a, p),
       Spearman = cor(a, p, method = "spearman"),
       Within3 = mean(abs(e) <= 3),
       Within6 = mean(abs(e) <= 6))
}

tracking <- map_df(names(models), function(k) {
  s <- stats(shadow_full$CompositeScore,
             shadow_full[[paste0("Shadow_", k)]])
  c(Spec = k, lapply(s, function(x) sprintf("%.4f", x)))
})

write_tex(
  as.character(
    tracking %>%
      kbl(format = "latex", booktabs = TRUE,
          caption = "Shadow-rating tracking diagnostics for each specification.",
          label = "tab:shadow_tracking") %>%
      kable_styling(latex_options = c("scale_down", "HOLD_position"))
  ),
  "tab_shadow_tracking"
)

# ---- Continent residual table -------------------------------
country_continent <- member %>% select(Country, Continent) %>% distinct()

resid_cont <- shadow_full %>%
  inner_join(country_continent, by = "Country") %>%
  filter(!is.na(CompositeScore)) %>%
  group_by(Continent) %>%
  summarise(
    N = n(),
    Avg_Actual = mean(CompositeScore, na.rm = TRUE),
    Avg_Shadow = mean(Shadow_S2, na.rm = TRUE),
    Avg_Resid  = mean(resid_S2, na.rm = TRUE),
    RMSE       = sqrt(mean(resid_S2^2, na.rm = TRUE)),
    .groups = "drop"
  )

write_tex(
  as.character(
    resid_cont %>%
      mutate(across(where(is.numeric) & !N, ~ sprintf("%.2f", .x))) %>%
      kbl(format = "latex", booktabs = TRUE,
          caption = "Average residual (Actual − Shadow) by continent. Benchmark spec S2.",
          label = "tab:shadow_continent") %>%
      kable_styling(latex_options = c("HOLD_position"))
  ),
  "tab_shadow_continent"
)

# ---- Figures -----------------------------------------------
shadow_clean <- shadow_full %>% drop_na(CompositeScore, Shadow_S2)

p_scatter <- ggplot(shadow_clean,
                    aes(Shadow_S2, CompositeScore,
                        color = Year)) +
  geom_abline(slope = 1, linetype = "dashed", color = "black") +
  geom_point(alpha = 0.45, size = 0.7) +
  scale_color_viridis_c(option = "plasma", name = "Year") +
  coord_equal(xlim = c(0, 60), ylim = c(0, 60)) +
  labs(title = "Actual vs Shadow rating, full panel",
       subtitle = sprintf("R² = %.3f, RMSE = %.2f, N = %d",
                          1 - sum(shadow_clean$resid_S2^2) /
                              sum((shadow_clean$CompositeScore -
                                   mean(shadow_clean$CompositeScore))^2),
                          sqrt(mean(shadow_clean$resid_S2^2)),
                          nrow(shadow_clean)),
       x = "Shadow score (predicted from fundamentals)",
       y = "Actual agency-composite score")

save_fig(p_scatter, "fig25_shadow_actual_scatter", w = 7, h = 6)

# Top 20 most over- and under-rated (latest year per country)
latest <- shadow_clean %>%
  group_by(Country) %>%
  slice_max(Year, n = 1, with_ties = FALSE) %>%
  ungroup() %>%
  arrange(resid_S2)

over_under <- bind_rows(
  latest %>% slice_head(n = 15) %>%
    mutate(group = "Most under-rated"),
  latest %>% slice_tail(n = 15) %>%
    mutate(group = "Most over-rated")
) %>% mutate(Country = factor(Country, levels = .$Country))

p_oU <- ggplot(over_under, aes(resid_S2, Country, fill = group)) +
  geom_col() +
  geom_vline(xintercept = 0, linewidth = 0.5) +
  scale_fill_manual(values = c("Most under-rated" = "#d62728",
                                "Most over-rated"  = "#2ca02c"),
                    name = NULL) +
  labs(title = "Most over- and under-rated countries (latest year)",
       subtitle = "Actual − Shadow (S2). Negative = harsher than fundamentals predict.",
       x = "Residual (composite score units)", y = NULL)

save_fig(p_oU, "fig26_shadow_residuals_topbot", w = 9, h = 8)

# Continent × year heatmap
heat_data <- shadow_clean %>%
  inner_join(country_continent, by = "Country") %>%
  group_by(Continent, Year) %>%
  summarise(meanresid = mean(resid_S2, na.rm = TRUE),
            .groups = "drop")

p_heat <- ggplot(heat_data, aes(Year, Continent, fill = meanresid)) +
  geom_tile(color = "white") +
  scale_fill_gradient2(low = "#d62728", mid = "white", high = "#2ca02c",
                       midpoint = 0, name = "Notches") +
  labs(title = "Average residual (Actual − Shadow) by continent × year",
       x = NULL, y = NULL)

save_fig(p_heat, "fig27_shadow_resid_continent_heatmap", w = 11, h = 4)
cat("Done: 05_shadow_ratings.R\n")
