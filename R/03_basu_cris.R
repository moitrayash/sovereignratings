## ============================================================
## 03_basu_cris.R
## Basu/De/Ratha/Timmer (2013) Relative Risk Rating + CRIS index
## Generates panel diagnostics, world-average evolution and big-mover
## tables, plus three figures.
## Outputs:
##   tables/tab_basu_world_avg.tex
##   tables/tab_basu_movers.tex
##   figures/fig20_basu_world_average.{pdf,png}
##   figures/fig21_basu_movers.{pdf,png}
##   figures/fig22_basu_rr_distribution.{pdf,png}
## ============================================================

source(file.path(here::here(), "R", "01_load_data.R"))

# ---- (1) World average rating over time ----------------------
world_avg <- basu %>%
  distinct(Year,
           world_avg_basu_t, world_avg_basu_2008,
           world_avg_60_t,   world_avg_60_2008) %>%
  arrange(Year)

write_tex(
  as.character(
    world_avg %>%
      mutate(across(-Year, ~ sprintf("%.2f", .x))) %>%
      kbl(format = "latex", booktabs = TRUE,
          col.names = c("Year",
                        "Basu RR (smaller=better, t-vary)",
                        "Basu RR (smaller=better, 2008 wt)",
                        "Score-60 (higher=better, t-vary)",
                        "Score-60 (higher=better, 2008 wt)"),
          caption = "GDP-weighted world-average rating, two scoring conventions × two weighting choices.",
          label = "tab:basu_world_avg") %>%
      kable_styling(latex_options = c("scale_down", "HOLD_position"))
  ),
  "tab_basu_world_avg"
)

p_world <- world_avg %>%
  pivot_longer(-Year, names_to = "series", values_to = "value") %>%
  mutate(scale = ifelse(grepl("basu", series), "Basu (smaller=better)",
                                                "Score-60 (higher=better)"),
         weight = ifelse(grepl("2008", series), "Fixed 2008 weights",
                                                "Time-varying weights")) %>%
  ggplot(aes(Year, value, color = weight, linetype = weight)) +
  geom_line(linewidth = 0.8) +
  facet_wrap(~ scale, scales = "free_y") +
  labs(title = "GDP-weighted world average sovereign rating, 2000–2025",
       y = NULL, x = NULL, color = NULL, linetype = NULL)

save_fig(p_world, "fig20_basu_world_average", w = 9, h = 4)

# ---- (2) Biggest 2008 → 2024 movers (RR_basu_t direction) ----
movers <- basu %>%
  filter(Year %in% c(2008, 2024)) %>%
  select(Country, Year, RR_basu_t) %>%
  pivot_wider(names_from = Year, values_from = RR_basu_t,
              names_prefix = "Y") %>%
  mutate(delta = Y2024 - Y2008) %>%
  filter(!is.na(delta)) %>%
  arrange(delta)

top10  <- bind_rows(
  movers %>% slice_head(n = 10) %>% mutate(group = "Improved most"),
  movers %>% slice_tail(n = 10) %>% mutate(group = "Worsened most")
) %>%
  mutate(Country = factor(Country, levels = .$Country))

p_mov <- ggplot(top10,
                aes(x = delta, y = reorder(Country, delta),
                    fill = group)) +
  geom_col() +
  geom_vline(xintercept = 0, linewidth = 0.5) +
  scale_fill_manual(values = c("Improved most" = "#2ca02c",
                                "Worsened most" = "#d62728"),
                    name = NULL) +
  labs(title = "Largest 2008→2024 changes in Basu Relative Risk Rating",
       subtitle = "Negative Δ = relative improvement; positive Δ = deterioration",
       x = expression(Delta * "RR (Basu, smaller = better)"),
       y = NULL)

save_fig(p_mov, "fig21_basu_movers", w = 9, h = 6)

write_tex(
  as.character(
    top10 %>%
      transmute(group, Country = as.character(Country),
                RR_2008 = sprintf("%.2f", Y2008),
                RR_2024 = sprintf("%.2f", Y2024),
                Delta   = sprintf("%+.2f", delta)) %>%
      kbl(format = "latex", booktabs = TRUE,
          caption = "Top 10 improvers and deteriorators in Basu Relative Risk Rating 2008→2024.",
          label = "tab:basu_movers") %>%
      kable_styling(latex_options = c("HOLD_position"))
  ),
  "tab_basu_movers"
)

# ---- (3) RR distribution by year (selected years) -----------
sel_years <- c(2002, 2008, 2014, 2020, 2024)
dist_data <- basu %>%
  filter(Year %in% sel_years) %>%
  mutate(YearF = factor(Year))

p_dist <- ggplot(dist_data, aes(RR_basu_t, fill = YearF)) +
  geom_density(alpha = 0.4, color = NA) +
  geom_vline(xintercept = 0, linewidth = 0.5) +
  scale_fill_viridis_d(name = "Year", option = "C") +
  labs(title = "Distribution of Basu Relative Risk Rating across countries",
       subtitle = "Negative = better than world average. Selected years.",
       x = "RR (Basu, smaller = better)", y = "Density")

save_fig(p_dist, "fig22_basu_rr_distribution", w = 8, h = 4.5)
cat("Done: 03_basu_cris.R\n")
