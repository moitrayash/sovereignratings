## ============================================================
## 04_de_relative.R
## De-style relativizations of the rating panel. Compares the ten
## variants and their relationship to our existing M1–M4 measures.
## Outputs:
##   tables/tab_de_correlation.tex
##   tables/tab_de_vs_m1m4.tex
##   figures/fig23_de_correlation_heat.{pdf,png}
##   figures/fig24_de_vs_m1m4_scatter.{pdf,png}
## ============================================================

source(file.path(here::here(), "R", "01_load_data.R"))

rel_cols <- c("rel_eq", "rel_gdp", "rel_gdp2008", "rel_pop", "rel_median",
              "z_eq", "z_gdp", "pct_rank", "norm_max", "norm_min")

# ---- 1) Correlation among De relativizations -----------------
corr_mat <- de_rel %>%
  select(all_of(rel_cols)) %>%
  cor(use = "pairwise.complete.obs")

write_tex(
  as.character(
    round(corr_mat, 3) %>%
      kbl(format = "latex", booktabs = TRUE,
          caption = "Pairwise correlations among ten De-style relativization variants.",
          label = "tab:de_correlation") %>%
      kable_styling(latex_options = c("scale_down", "HOLD_position"))
  ),
  "tab_de_correlation"
)

corr_long <- as_tibble(corr_mat, rownames = "v1") %>%
  pivot_longer(-v1, names_to = "v2", values_to = "rho") %>%
  mutate(v1 = factor(v1, levels = rel_cols),
         v2 = factor(v2, levels = rel_cols))

p_corr <- ggplot(corr_long, aes(v1, v2, fill = rho)) +
  geom_tile() +
  geom_text(aes(label = sprintf("%.2f", rho)),
            size = 3, color = "black") +
  scale_fill_viridis_c(option = "rocket", direction = -1, name = expression(rho)) +
  labs(title = "Cross-method correlation: De-style relativizations",
       x = NULL, y = NULL) +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))

save_fig(p_corr, "fig23_de_correlation_heat", w = 7, h = 6)

# ---- 2) Correlation with our existing M1-M4 (World group) ---
rel_world <- rel_all %>%
  filter(Group == "World") %>%
  select(Country, Year, M1, M2, M3, M4)

merged <- de_rel %>%
  inner_join(rel_world, by = c("Country", "Year")) %>%
  select(rel_eq, rel_gdp, rel_pop, z_eq, M1, M2, M3, M4)

m_corr <- cor(merged, use = "pairwise.complete.obs")
write_tex(
  as.character(
    round(m_corr, 3) %>%
      kbl(format = "latex", booktabs = TRUE,
          caption = "Correlation between four De-style measures and our M1–M4 (World group).",
          label = "tab:de_vs_m1m4") %>%
      kable_styling(latex_options = c("HOLD_position"))
  ),
  "tab_de_vs_m1m4"
)

# Long form for ggplot
mlong <- merged %>%
  select(M1, rel_eq, rel_gdp, z_eq) %>%
  pivot_longer(-M1, names_to = "method", values_to = "value")

p_scatter <- ggplot(mlong, aes(value, M1)) +
  geom_point(alpha = 0.25, size = 0.6, color = "#1f77b4") +
  geom_smooth(method = "lm", se = FALSE, color = "#d62728",
              linewidth = 0.8) +
  facet_wrap(~ method, scales = "free_x") +
  labs(title = "Existing M1 vs De-style relativizations (World group)",
       x = "De-style measure", y = "M1 (LOO mean deviation)")

save_fig(p_scatter, "fig24_de_vs_m1m4_scatter", w = 9, h = 5)
cat("Done: 04_de_relative.R\n")
