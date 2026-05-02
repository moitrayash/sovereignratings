## ============================================================
## 09_descriptive_figures.R
## Descriptive / structural figures (counterparts of Python figs 1-6).
##   figures/fig01_distribution_overview.{pdf,png}
##   figures/fig02_country_rankings.{pdf,png}
##   figures/fig03_trends.{pdf,png}
##   figures/fig04_agency_scatter.{pdf,png}
##   figures/fig06_volatility.{pdf,png}
## ============================================================

source(file.path(here::here(), "R", "01_load_data.R"))

# ---- 1) Distribution overview ------------------------------
p1a <- ggplot(events, aes(Score)) +
  geom_histogram(bins = 30, fill = "#1f77b4", color = "white") +
  labs(title = "Distribution of agency-level scores", x = "Score (0-60)", y = "Count")

p1b <- ggplot(events, aes(Agency, Score, fill = Agency)) +
  geom_boxplot(alpha = 0.85, outlier.size = 0.5) +
  scale_fill_brewer(palette = "Set2") +
  labs(title = "Score by agency", x = NULL, y = "Score") +
  theme(legend.position = "none")

events_year <- events %>% count(Year)
p1c <- ggplot(events_year, aes(Year, n)) +
  geom_col(fill = "#9467bd") +
  labs(title = "Events per year", x = NULL, y = "Count")

events_dir <- events %>%
  filter(!is.na(Direction)) %>%
  count(Direction)
p1d <- ggplot(events_dir, aes(Direction, n, fill = Direction)) +
  geom_col() +
  scale_fill_manual(values = c("Downgrade" = "#d62728",
                                "No Change" = "gray70",
                                "Upgrade" = "#2ca02c")) +
  labs(title = "Up vs down events", x = NULL, y = "Count") +
  theme(legend.position = "none")

fig01 <- (p1a | p1b) / (p1c | p1d) +
  plot_annotation(title = "Score distribution overview")
save_fig(fig01, "fig01_distribution_overview", w = 11, h = 7)

# ---- 2) Country rankings — top 25 / bottom 25 (latest year) -
latest_country <- panel_master %>%
  group_by(Country) %>%
  slice_max(Year, n = 1, with_ties = FALSE) %>%
  ungroup() %>%
  drop_na(CompositeScore)

top25 <- latest_country %>% slice_max(CompositeScore, n = 25, with_ties = FALSE)
bot25 <- latest_country %>% slice_min(CompositeScore, n = 25, with_ties = FALSE)

ptop <- ggplot(top25, aes(CompositeScore, fct_reorder(Country, CompositeScore))) +
  geom_col(fill = "#2ca02c") +
  labs(title = "Top 25 sovereigns (latest)", x = "Composite score", y = NULL)

pbot <- ggplot(bot25, aes(CompositeScore, fct_reorder(Country, CompositeScore))) +
  geom_col(fill = "#d62728") +
  labs(title = "Bottom 25 sovereigns (latest)", x = "Composite score", y = NULL)

fig02 <- ptop | pbot
save_fig(fig02, "fig02_country_rankings", w = 12, h = 8)

# ---- 3) Trends over time -----------------------------------
ann <- events %>%
  group_by(Agency, Year) %>%
  summarise(meanScore = mean(Score, na.rm = TRUE), .groups = "drop")

p3 <- ggplot(ann, aes(Year, meanScore, color = Agency)) +
  geom_line(linewidth = 0.9) +
  scale_color_brewer(palette = "Set2") +
  labs(title = "Average rating per agency over time",
       y = "Mean score", x = NULL)
save_fig(p3, "fig03_trends", w = 9, h = 4.5)

# ---- 4) Inter-agency scatter (latest per country) ----------
wide <- events %>%
  group_by(Country, Agency) %>%
  slice_max(Year, n = 1, with_ties = FALSE) %>%
  ungroup() %>%
  select(Country, Agency, Score) %>%
  pivot_wider(names_from = Agency, values_from = Score)

p4 <- ggplot(wide, aes(`S&P`, `Moody's`)) +
  geom_abline(slope = 1, linetype = "dashed", color = "gray50") +
  geom_point(alpha = 0.55, color = "#1f77b4", size = 1.5) +
  geom_smooth(method = "lm", se = FALSE, color = "#d62728") +
  labs(title = "S&P vs Moody's latest scores",
       x = "S&P score", y = "Moody's score") +
  coord_equal(xlim = c(0, 60), ylim = c(0, 60))
save_fig(p4, "fig04_agency_scatter", w = 6, h = 6)

# ---- 6) Volatility — top 30 most volatile countries --------
vol <- panel_master %>%
  drop_na(CompositeScore) %>%
  group_by(Country) %>%
  summarise(vol = sd(CompositeScore, na.rm = TRUE),
            n = n(), .groups = "drop") %>%
  filter(n >= 10) %>%
  slice_max(vol, n = 30)

p6 <- ggplot(vol, aes(vol, fct_reorder(Country, vol))) +
  geom_col(fill = "#ff7f0e") +
  labs(title = "Top 30 most volatile sovereigns",
       subtitle = "Standard deviation of composite score (only countries with ≥10 obs)",
       x = "SD of composite score", y = NULL)
save_fig(p6, "fig06_volatility", w = 8, h = 8)
cat("Done: 09_descriptive_figures.R\n")
