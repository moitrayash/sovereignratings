## ============================================================
## 10_gini_relative.R
## Gini-coefficient panels (session 3) and World-Gini trend.
##   tables/tab_gini_top_groups.tex
##   figures/fig14_gini_heatmap.{pdf,png}
##   figures/fig14b_world_gini.{pdf,png}
## ============================================================

source(file.path(here::here(), "R", "01_load_data.R"))

# ---- World Gini trend --------------------------------------
world_gini <- gini_panel %>%
  filter(Group == "World") %>%
  arrange(Year)

p_world <- ggplot(world_gini, aes(Year, Gini)) +
  geom_line(linewidth = 0.9, color = "#1f77b4") +
  geom_point(size = 1.5, color = "#1f77b4") +
  labs(title = "Sovereign credit-rating inequality (World Gini)",
       subtitle = "Computed from composite scores across 150 countries",
       y = "Gini coefficient", x = NULL)
save_fig(p_world, "fig14b_world_gini", w = 8, h = 4)

# ---- Heatmap of Gini across MECE groups --------------------
mece <- c("WB_High_Income","WB_Upper_Middle_Income",
          "WB_Lower_Middle_Income","WB_Low_Income",
          "Africa","Asia","Europe","North_America",
          "South_America","Oceania","World")

heat <- gini_panel %>%
  filter(Group %in% mece, Year >= 2000)

p_heat <- ggplot(heat, aes(Year, Group, fill = Gini)) +
  geom_tile() +
  scale_fill_viridis_c(option = "rocket", direction = -1) +
  labs(title = "Rating-Gini heatmap by group × year",
       x = NULL, y = NULL)
save_fig(p_heat, "fig14_gini_heatmap", w = 11, h = 4.5)

# ---- Top-Gini groups (most unequal in latest year) ---------
latest_gini <- gini_panel %>%
  group_by(Group) %>%
  slice_max(Year, n = 1, with_ties = FALSE) %>%
  ungroup() %>%
  arrange(desc(Gini)) %>%
  slice_head(n = 15)

write_tex(
  as.character(
    latest_gini %>%
      transmute(Group, Year,
                Gini = sprintf("%.3f", Gini),
                Mean = sprintf("%.2f", Mean),
                SD   = sprintf("%.2f", SD)) %>%
      kbl(format = "latex", booktabs = TRUE,
          caption = "Most unequal grouping ladders (latest-year Gini).",
          label = "tab:gini_top_groups") %>%
      kable_styling(latex_options = c("HOLD_position"))
  ),
  "tab_gini_top_groups"
)

cat("Done: 10_gini_relative.R\n")
