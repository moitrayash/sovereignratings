## ====================================================================
## paper_pipeline.R — plain-vanilla R outputs.
## All figures use ggplot2 defaults (default theme, default discrete
## palette, default continuous gradient). No custom colors, no fancy
## themes, no viridis/RColorBrewer/ggrepel.
## ====================================================================

# ---------- 0. SETUP --------------------------------------------------
PROJ_DIR <- "C:/Users/yashm/OneDrive - Cornell University/Desktop/Research/credit rating/cr rating"
DATA_DIR <- PROJ_DIR
OUT_DIR  <- file.path(PROJ_DIR, "R", "out")
TAB_DIR  <- file.path(OUT_DIR, "tables")
FIG_DIR  <- file.path(OUT_DIR, "figures")
dir.create(OUT_DIR, showWarnings = FALSE, recursive = TRUE)
dir.create(TAB_DIR, showWarnings = FALSE, recursive = TRUE)
dir.create(FIG_DIR, showWarnings = FALSE, recursive = TRUE)
setwd(PROJ_DIR)

pkgs_required <- c("tidyverse","readr","data.table","zoo","fixest","MASS",
                   "modelsummary","kableExtra","broom","ggplot2","patchwork")
to_install <- pkgs_required[!pkgs_required %in% installed.packages()[,"Package"]]
if (length(to_install)) install.packages(to_install, repos="https://cran.rstudio.com")
pkgs_to_attach <- setdiff(pkgs_required, "MASS")
invisible(suppressPackageStartupMessages(
  lapply(pkgs_to_attach, library, character.only = TRUE)))
select <- dplyr::select; filter <- dplyr::filter

save_fig <- function(plot, name, w=7, h=5, dpi=300) {
  ggsave(file.path(FIG_DIR, paste0(name,".pdf")), plot, width=w, height=h, units="in")
  ggsave(file.path(FIG_DIR, paste0(name,".png")), plot, width=w, height=h, units="in", dpi=dpi)
  invisible(plot)
}
write_tex <- function(tex, name) {
  fp <- file.path(TAB_DIR, paste0(name,".tex"))
  writeLines(tex, fp); message("Wrote ", fp); invisible(fp)
}
cat("Setup OK.\n")

panel_master <- read_csv(file.path(DATA_DIR,"paper_panel.csv"), show_col_types=FALSE)
panel_scales <- read_csv(file.path(DATA_DIR,"panel_scales.csv"), show_col_types=FALSE)
basu         <- read_csv(file.path(DATA_DIR,"basu_cris_panel.csv"), show_col_types=FALSE)
de_rel       <- read_csv(file.path(DATA_DIR,"de_relative_panel.csv"), show_col_types=FALSE)
shadow_ag    <- read_csv(file.path(DATA_DIR,"shadow_per_agency_panel.csv"), show_col_types=FALSE)
wb_extras    <- read_csv(file.path(DATA_DIR,"wb_macro_extra.csv"), show_col_types=FALSE)
rule_of_law  <- read_csv(file.path(DATA_DIR,"rule_of_law.csv"), show_col_types=FALSE)
events       <- read_csv(file.path(DATA_DIR,"raw_events.csv"), show_col_types=FALSE)
member       <- read_csv(file.path(DATA_DIR,"membership.csv"), show_col_types=FALSE)
rel_all      <- read_csv(file.path(DATA_DIR,"paper_rel_all.csv"), show_col_types=FALSE)
gini_panel   <- read_csv(file.path(DATA_DIR,"paper_gini.csv"), show_col_types=FALSE)

country_continent <- member %>% select(Country, Continent) %>% distinct()

# ---------- 2. ALTERNATIVE SCALES ----
cat("\n[2] alt scales...\n")
scale_cols <- c("score_60","score_21","score_20","score_17",
                "score_16","score_basu60","score_norm01","score_logPD")
spec_list <- list(
  A_growth_fdi      = c("GDP_growth_pct","FDI_pct_GDP"),
  B_loggdppc        = "log_GDPpc",
  C_growth_loggdppc = c("GDP_growth_pct","log_GDPpc"),
  D_full            = c("GDP_growth_pct","FDI_pct_GDP","log_GDPpc"))
panel_long_X <- panel_scales %>%
  select(Country, Year, all_of(scale_cols),
         GDP_growth_pct, FDI_pct_GDP, log_GDPpc) %>%
  filter(!is.na(GDP_growth_pct), !is.na(log_GDPpc))

results_alt <- expand.grid(scale=scale_cols, spec=names(spec_list),
                           stringsAsFactors=FALSE) %>%
  mutate(model = pmap(list(scale, spec), function(sc, sp) {
    rhs <- paste(spec_list[[sp]], collapse=" + ")
    feols(as.formula(paste0(sc, " ~ ", rhs, " | Country + Year")),
          data = panel_long_X, cluster = ~ Country)
  }))
tidy_alt <- results_alt %>%
  mutate(td = map(model, broom::tidy, conf.int=TRUE)) %>%
  select(scale, spec, td) %>% unnest(td) %>%
  mutate(stars = case_when(p.value<0.01~"***", p.value<0.05~"**",
                           p.value<0.10~"*", TRUE~""))
write_csv(tidy_alt, file.path(OUT_DIR,"alt_scales_regressions_R.csv"))
coef_pivot <- tidy_alt %>% filter(spec=="D_full") %>%
  mutate(coef_fmt=sprintf("%.4f%s", estimate, stars)) %>%
  select(term, scale, coef_fmt) %>%
  pivot_wider(names_from=scale, values_from=coef_fmt)
within_r2 <- results_alt %>%
  mutate(r2 = map_dbl(model, ~ fitstat(.x,"wr2")$wr2)) %>%
  select(scale, spec, r2) %>%
  pivot_wider(names_from=scale, values_from=r2)
write_tex(as.character(
  coef_pivot %>% kbl(format="latex", booktabs=TRUE,
    caption="Spec-D coefficients across scales.",
    label="tab:alt_scales_coefs")
), "tab_alt_scales_coefs")
write_tex(as.character(
  within_r2 %>% mutate(across(-spec, ~ sprintf("%.4f", .x))) %>%
    kbl(format="latex", booktabs=TRUE,
        caption="Within-$R^2$ for each spec x scale.",
        label="tab:alt_scales_within_r2")
), "tab_alt_scales_within_r2")
p15 <- tidy_alt %>%
  filter(spec=="D_full", term %in% c("log_GDPpc","GDP_growth_pct")) %>%
  mutate(scale=factor(scale, levels=rev(scale_cols))) %>%
  ggplot(aes(estimate, scale)) +
  geom_vline(xintercept=0) +
  geom_pointrange(aes(xmin=conf.low, xmax=conf.high)) +
  facet_wrap(~ term, scales="free_x") +
  labs(x="Coefficient (95% CI)", y=NULL,
       title="Macro coefficients across alternative rating scales",
       subtitle="Spec D: country + year FE, clustered SE")
save_fig(p15, "fig15_alt_scales_coefs", w=9, h=4.5)

# ---------- 3. BASU / CRIS ----
cat("\n[3] Basu CRIS...\n")
world_avg <- basu %>% distinct(Year, world_avg_basu_t, world_avg_basu_2008,
                               world_avg_60_t, world_avg_60_2008) %>% arrange(Year)
write_tex(as.character(
  world_avg %>% mutate(across(-Year, ~ sprintf("%.2f", .x))) %>%
    kbl(format="latex", booktabs=TRUE,
        caption="World-average rating by convention x weight.",
        label="tab:basu_world_avg")
), "tab_basu_world_avg")
p20 <- world_avg %>% pivot_longer(-Year, names_to="series", values_to="value") %>%
  mutate(scale=ifelse(grepl("basu",series),"Basu (smaller=better)","Score-60 (higher=better)"),
         weight=ifelse(grepl("2008",series),"Fixed 2008 weights","Time-varying weights")) %>%
  ggplot(aes(Year, value, linetype=weight)) +
  geom_line() + facet_wrap(~scale, scales="free_y") +
  labs(title="GDP-weighted world average rating, 2000-2025",
       y=NULL, x=NULL, linetype=NULL)
save_fig(p20, "fig20_basu_world_average", w=9, h=4)
movers <- basu %>% filter(Year %in% c(2008,2024)) %>%
  select(Country, Year, RR_basu_t) %>%
  pivot_wider(names_from=Year, values_from=RR_basu_t, names_prefix="Y") %>%
  mutate(delta = Y2024 - Y2008) %>% filter(!is.na(delta)) %>% arrange(delta)
top10 <- bind_rows(
  movers %>% slice_head(n=10) %>% mutate(group="Improved most"),
  movers %>% slice_tail(n=10) %>% mutate(group="Worsened most")
) %>% mutate(Country=factor(Country, levels=.$Country))
p21 <- ggplot(top10, aes(delta, reorder(Country, delta))) +
  geom_col() + geom_vline(xintercept=0) +
  facet_wrap(~ group, scales="free_y") +
  labs(title="Largest 2008-2024 changes in Basu RR",
       x="Delta RR (Basu, smaller = better)", y=NULL)
save_fig(p21, "fig21_basu_movers", w=9, h=6)
write_tex(as.character(
  top10 %>% transmute(group, Country=as.character(Country),
                      RR_2008=sprintf("%.2f", Y2008), RR_2024=sprintf("%.2f", Y2024),
                      Delta=sprintf("%+.2f", delta)) %>%
    kbl(format="latex", booktabs=TRUE,
        caption="Top 10 RR movers 2008-2024.", label="tab:basu_movers")
), "tab_basu_movers")
p22 <- basu %>% filter(Year %in% c(2002,2008,2014,2020,2024)) %>%
  mutate(YearF=factor(Year)) %>%
  ggplot(aes(RR_basu_t, linetype=YearF)) +
  geom_density() +
  geom_vline(xintercept=0) +
  labs(title="Distribution of Basu RR across countries",
       x="RR (Basu, smaller = better)", y="Density", linetype="Year")
save_fig(p22, "fig22_basu_rr_distribution", w=8, h=4.5)

# ---------- 4. DE RELATIVIZATIONS ----
cat("\n[4] De relativizations...\n")
rel_cols <- c("rel_eq","rel_gdp","rel_gdp2008","rel_pop","rel_median",
              "z_eq","z_gdp","pct_rank","norm_max","norm_min")
corr_mat <- de_rel %>% select(all_of(rel_cols)) %>% cor(use="pairwise.complete.obs")
write_tex(as.character(
  round(corr_mat,3) %>% kbl(format="latex", booktabs=TRUE,
    caption="Correlations among 10 De-style relativizations.",
    label="tab:de_correlation")
), "tab_de_correlation")
corr_long <- as_tibble(corr_mat, rownames="v1") %>%
  pivot_longer(-v1, names_to="v2", values_to="rho") %>%
  mutate(v1=factor(v1, levels=rel_cols), v2=factor(v2, levels=rel_cols))
p23 <- ggplot(corr_long, aes(v1, v2, fill=rho)) +
  geom_tile() +
  geom_text(aes(label=sprintf("%.2f", rho)), size=3) +
  labs(title="Cross-method correlation: De-style relativizations",
       x=NULL, y=NULL, fill="rho") +
  theme(axis.text.x=element_text(angle=45, hjust=1))
save_fig(p23, "fig23_de_correlation_heat", w=7, h=6)
rel_world <- rel_all %>% filter(Group=="World") %>%
  select(Country, Year, M1, M2, M3, M4)
merged <- de_rel %>% inner_join(rel_world, by=c("Country","Year")) %>%
  select(rel_eq, rel_gdp, rel_pop, z_eq, M1, M2, M3, M4)
write_tex(as.character(
  round(cor(merged, use="pairwise.complete.obs"),3) %>%
    kbl(format="latex", booktabs=TRUE,
        caption="De-style measures vs M1-M4 (World).", label="tab:de_vs_m1m4")
), "tab_de_vs_m1m4")
p24 <- merged %>% select(M1, rel_eq, rel_gdp, z_eq) %>%
  pivot_longer(-M1, names_to="method", values_to="value") %>%
  ggplot(aes(value, M1)) +
  geom_point() +
  geom_smooth(method="lm", se=FALSE) +
  facet_wrap(~method, scales="free_x") +
  labs(title="Existing M1 vs De-style relativizations (World)",
       x="De-style measure", y="M1 (LOO mean deviation)")
save_fig(p24, "fig24_de_vs_m1m4_scatter", w=9, h=5)

# ---------- 5. SHADOW RATING MODEL ----
cat("\n[5] shadow rating model...\n")
panel_shadow_X <- panel_master %>%
  left_join(wb_extras, by=c("ISO3","Year")) %>%
  left_join(rule_of_law, by=c("ISO3","Year")) %>%
  arrange(Country, Year) %>% group_by(Country) %>%
  mutate(GrowthVol_5y = zoo::rollapply(GDP_growth_pct, 5, FUN=sd,
                                        fill=NA, align="right", partial=3)) %>%
  ungroup() %>% mutate(log_Population = log(pmax(Population, 1, na.rm=TRUE)))
specs_shadow <- list(
  S0=c("log_GDPpc","GDP_growth_pct"),
  S1=c("log_GDPpc","GDP_growth_pct","GrowthVol_5y","Inflation_pct"),
  S2=c("log_GDPpc","GDP_growth_pct","GrowthVol_5y","Inflation_pct",
       "RuleOfLaw","CurrentAccount_pct"),
  S3=c("log_GDPpc","GDP_growth_pct","GrowthVol_5y","Inflation_pct",
       "RuleOfLaw","CurrentAccount_pct","ExtDebt_pct_GNI","Reserves_Imports_mo"),
  S4=c("log_GDPpc","GDP_growth_pct","GrowthVol_5y","Inflation_pct",
       "RuleOfLaw","CurrentAccount_pct","ExtDebt_pct_GNI","Reserves_Imports_mo",
       "FDI_pct_GDP","log_Population"))
shadow_models <- map(specs_shadow, function(rhs) {
  feols(as.formula(paste0("CompositeScore ~ ", paste(rhs, collapse=" + "))),
        data=panel_shadow_X, cluster = ~ Country)
})
ms_shadow <- modelsummary(
  shadow_models, output="latex", fmt=3,
  stars=c("*"=0.10,"**"=0.05,"***"=0.01),
  gof_map=tribble(~raw,~clean,~fmt,
                  "nobs","N",0, "r.squared","R-squared",3, "adj.r.squared","Adj. R-squared",3),
  coef_rename=c("(Intercept)"="Constant",
    "log_GDPpc"="log GDP per capita","GDP_growth_pct"="GDP growth (pct)",
    "GrowthVol_5y"="Growth volatility (5-yr SD)","Inflation_pct"="Inflation (pct)",
    "RuleOfLaw"="Rule of Law (WGI)","CurrentAccount_pct"="Current account (pct GDP)",
    "ExtDebt_pct_GNI"="Ext. debt (pct GNI)","Reserves_Imports_mo"="Reserves (mo. imports)",
    "FDI_pct_GDP"="FDI (pct GDP)","log_Population"="log Population"),
  title="Shadow rating model -- five specifications.",
  notes="* p<0.10, ** p<0.05, *** p<0.01.")
write_tex(as.character(ms_shadow), "tab_shadow_models")
predict_shadow <- function(mod, data, regs) {
  X <- data
  for (cc in regs) {
    if (any(is.na(X[[cc]]))) {
      med_country <- X %>% group_by(Country) %>%
        mutate(.med=median(.data[[cc]], na.rm=TRUE)) %>% ungroup() %>% pull(.med)
      X[[cc]][is.na(X[[cc]])] <- med_country[is.na(X[[cc]])]
      X[[cc]][is.na(X[[cc]])] <- median(X[[cc]], na.rm=TRUE)
    }
  }
  pmax(pmin(predict(mod, newdata=X), 60), 0)
}
shadow_full <- panel_shadow_X
for (k in names(shadow_models))
  shadow_full[[paste0("Shadow_",k)]] <- predict_shadow(shadow_models[[k]], shadow_full, specs_shadow[[k]])
shadow_full <- shadow_full %>%
  mutate(resid_S2=CompositeScore-Shadow_S2, resid_S4=CompositeScore-Shadow_S4)
write_csv(shadow_full, file.path(OUT_DIR,"shadow_full_R.csv"))
stats_pair <- function(actual, pred) {
  ok <- !is.na(actual) & !is.na(pred); a <- actual[ok]; p <- pred[ok]; e <- a-p
  list(N=length(a), RMSE=sqrt(mean(e^2)), MAE=mean(abs(e)), Bias=mean(e),
       R2=1-sum(e^2)/sum((a-mean(a))^2),
       Pearson=cor(a,p), Spearman=cor(a,p,method="spearman"),
       Within3=mean(abs(e)<=3), Within6=mean(abs(e)<=6))
}
tracking <- map_df(names(shadow_models), function(k) {
  s <- stats_pair(shadow_full$CompositeScore, shadow_full[[paste0("Shadow_",k)]])
  c(Spec=k, lapply(s, function(x) sprintf("%.4f", x)))
})
write_tex(as.character(
  tracking %>% kbl(format="latex", booktabs=TRUE,
    caption="Shadow tracking diagnostics.", label="tab:shadow_tracking")
), "tab_shadow_tracking")
resid_cont <- shadow_full %>% inner_join(country_continent, by="Country") %>%
  filter(!is.na(CompositeScore)) %>% group_by(Continent) %>%
  summarise(N=n(), Avg_Actual=mean(CompositeScore, na.rm=TRUE),
            Avg_Shadow=mean(Shadow_S2, na.rm=TRUE),
            Avg_Resid=mean(resid_S2, na.rm=TRUE),
            RMSE=sqrt(mean(resid_S2^2, na.rm=TRUE)), .groups="drop")
write_tex(as.character(
  resid_cont %>% mutate(across(where(is.numeric) & !N, ~ sprintf("%.2f", .x))) %>%
    kbl(format="latex", booktabs=TRUE,
        caption="Residual by continent (S2).", label="tab:shadow_continent")
), "tab_shadow_continent")
shadow_clean <- shadow_full %>% drop_na(CompositeScore, Shadow_S2)
p25 <- ggplot(shadow_clean, aes(Shadow_S2, CompositeScore)) +
  geom_abline(slope=1, linetype="dashed") +
  geom_point() +
  coord_equal(xlim=c(0,60), ylim=c(0,60)) +
  labs(title="Actual vs Shadow rating, full panel",
       subtitle=sprintf("R^2 = %.3f, RMSE = %.2f, N = %d",
                        1 - sum(shadow_clean$resid_S2^2) /
                        sum((shadow_clean$CompositeScore - mean(shadow_clean$CompositeScore))^2),
                        sqrt(mean(shadow_clean$resid_S2^2)), nrow(shadow_clean)),
       x="Shadow score", y="Actual composite score")
save_fig(p25, "fig25_shadow_actual_scatter", w=7, h=6)
latest <- shadow_clean %>% group_by(Country) %>%
  slice_max(Year, n=1, with_ties=FALSE) %>% ungroup() %>% arrange(resid_S2)
over_under <- bind_rows(
  latest %>% slice_head(n=15) %>% mutate(group="Most under-rated"),
  latest %>% slice_tail(n=15) %>% mutate(group="Most over-rated")
) %>% mutate(Country=factor(Country, levels=.$Country))
p26 <- ggplot(over_under, aes(resid_S2, Country)) +
  geom_col() + geom_vline(xintercept=0) +
  facet_wrap(~ group, scales="free_y") +
  labs(title="Most over- and under-rated countries (latest year)",
       x="Residual (composite score units)", y=NULL)
save_fig(p26, "fig26_shadow_residuals_topbot", w=9, h=8)
heat_data <- shadow_clean %>% inner_join(country_continent, by="Country") %>%
  group_by(Continent, Year) %>% summarise(meanresid=mean(resid_S2, na.rm=TRUE), .groups="drop")
p27 <- ggplot(heat_data, aes(Year, Continent, fill=meanresid)) +
  geom_tile() +
  scale_fill_gradient2() +
  labs(title="Average residual by continent x year",
       x=NULL, y=NULL, fill="Notches")
save_fig(p27, "fig27_shadow_resid_continent_heatmap", w=11, h=4)

# ---------- 6. PER-AGENCY ----
cat("\n[6] per-agency...\n")
panel_full <- events %>% select(Country, ISO2, Year, Agency, Rating, Score) %>%
  left_join(panel_master %>% select(Country, ISO3), by="Country") %>% distinct() %>%
  left_join(panel_master %>% select(Country, Year, log_GDPpc, GDP_growth_pct, FDI_pct_GDP),
            by=c("Country","Year")) %>%
  left_join(wb_extras, by=c("ISO3","Year")) %>%
  left_join(rule_of_law, by=c("ISO3","Year")) %>%
  arrange(Country, Year) %>% group_by(Country) %>%
  mutate(GrowthVol_5y = zoo::rollapply(GDP_growth_pct, 5, FUN=sd,
                                        fill=NA, align="right", partial=3)) %>% ungroup()
regs_S2 <- c("log_GDPpc","GDP_growth_pct","GrowthVol_5y","Inflation_pct",
             "RuleOfLaw","CurrentAccount_pct")
agencies <- c("S&P","Moody's","DBRS")
ag_models <- map(agencies, function(ag) {
  d <- panel_full %>% filter(Agency==ag) %>% drop_na(Score, all_of(regs_S2))
  feols(as.formula(paste0("Score ~ ", paste(regs_S2, collapse=" + "))),
        data=d, cluster = ~ Country)
})
names(ag_models) <- agencies
ms_ag <- modelsummary(ag_models, output="latex", fmt=3,
  stars=c("*"=0.10,"**"=0.05,"***"=0.01),
  gof_map=tribble(~raw,~clean,~fmt,
                  "nobs","N",0,"r.squared","R-squared",3,"adj.r.squared","Adj. R-squared",3),
  coef_rename=c("(Intercept)"="Constant","log_GDPpc"="log GDP per capita",
    "GDP_growth_pct"="GDP growth (pct)","GrowthVol_5y"="Growth volatility",
    "Inflation_pct"="Inflation (pct)","RuleOfLaw"="Rule of Law",
    "CurrentAccount_pct"="Current account (pct GDP)"),
  title="Per-agency shadow regressions (S2).",
  notes="* p<0.10, ** p<0.05, *** p<0.01.")
write_tex(as.character(ms_ag), "tab_per_agency_models")
get_tracking <- function(mod, ag) {
  d <- panel_full %>% filter(Agency==ag) %>% drop_na(Score, all_of(regs_S2))
  pred <- pmax(pmin(predict(mod, newdata=d), 60), 0); e <- d$Score - pred
  tibble(Agency=ag, N=nrow(d),
         R2=1-sum(e^2)/sum((d$Score-mean(d$Score))^2),
         RMSE=sqrt(mean(e^2)), MAE=mean(abs(e)), Bias=mean(e),
         Pearson=cor(d$Score,pred), Spearman=cor(d$Score,pred,method="spearman"),
         Within3=mean(abs(e)<=3), Within6=mean(abs(e)<=6))
}
tracking_ag <- map2_dfr(ag_models, agencies, get_tracking)
write_tex(as.character(
  tracking_ag %>% mutate(across(where(is.numeric) & !N, ~ sprintf("%.3f", .x))) %>%
    kbl(format="latex", booktabs=TRUE,
        caption="Per-agency tracking (S2).", label="tab:per_agency_tracking")
), "tab_per_agency_tracking")
coefs_df <- imap_dfr(ag_models, function(m, ag) {
  broom::tidy(m, conf.int=TRUE) %>% mutate(Agency=ag)
}) %>% filter(term != "(Intercept)") %>%
  mutate(term=factor(term, levels=rev(regs_S2)))
p28 <- ggplot(coefs_df, aes(estimate, term)) +
  geom_vline(xintercept=0) +
  geom_pointrange(aes(xmin=conf.low, xmax=conf.high)) +
  facet_wrap(~ Agency) +
  labs(title="Shadow coefficients by agency (S2)",
       x="Coefficient (95% CI)", y=NULL)
save_fig(p28, "fig28_per_agency_coefs", w=10, h=5)
gap_df <- imap_dfr(ag_models, function(m, ag) {
  d <- panel_full %>% filter(Agency==ag) %>% drop_na(Score, all_of(regs_S2))
  d$pred <- pmax(pmin(predict(m, newdata=d), 60), 0)
  d %>% mutate(gap=Score-pred, Agency=ag) %>%
    inner_join(country_continent, by="Country") %>%
    group_by(Agency, Continent) %>%
    summarise(N=n(), mean_gap=mean(gap, na.rm=TRUE),
              sd_gap=sd(gap, na.rm=TRUE), .groups="drop")
})
write_tex(as.character(
  gap_df %>% mutate(mean_gap=sprintf("%+.2f", mean_gap),
                    sd_gap=sprintf("%.2f", sd_gap)) %>%
    kbl(format="latex", booktabs=TRUE,
        caption="Gap by continent x agency (rated only).",
        label="tab:per_agency_gap_continent")
), "tab_per_agency_gap_continent")
p29 <- gap_df %>%
  mutate(Continent=factor(Continent,
    levels=c("Africa","South_America","North_America","Oceania","Europe","Asia"))) %>%
  ggplot(aes(Continent, mean_gap)) +
  geom_col() + geom_hline(yintercept=0) +
  facet_wrap(~ Agency) +
  labs(title="Average rating gap by continent and agency",
       x=NULL, y="Mean Actual - Shadow (notches)")
save_fig(p29, "fig29_per_agency_gap_continent", w=10, h=5)

# ---------- 7. MAIN PANEL A-D ----
cat("\n[7] main panel A-D...\n")
d_main <- panel_master %>% drop_na(CompositeScore)
mods_main <- list(
  "Model A" = feols(CompositeScore ~ GDP_growth_pct + FDI_pct_GDP | Country + Year,
                    data=d_main, cluster=~ Country),
  "Model B" = feols(CompositeScore ~ log_GDPpc | Country + Year,
                    data=d_main, cluster=~ Country),
  "Model C" = feols(CompositeScore ~ GDP_growth_pct + log_GDPpc | Country + Year,
                    data=d_main, cluster=~ Country),
  "Model D" = feols(CompositeScore ~ GDP_growth_pct + FDI_pct_GDP + log_GDPpc | Country + Year,
                    data=d_main, cluster=~ Country))
ms_main <- modelsummary(mods_main, output="latex", fmt=3,
  stars=c("*"=0.10,"**"=0.05,"***"=0.01),
  gof_map=tribble(~raw,~clean,~fmt,
                  "nobs","N",0,"r.squared","R-squared",3,"adj.r.squared","Adj. R-squared",3),
  coef_rename=c("GDP_growth_pct"="GDP growth (pct)",
                "FDI_pct_GDP"="FDI (pct GDP)","log_GDPpc"="log GDP per capita"),
  title="Main panel-FE regressions (A-D).",
  notes="* p<0.10, ** p<0.05, *** p<0.01.")
write_tex(as.character(ms_main), "tab_main_panel")

# ---------- 8. ORDERED LOGIT / PROBIT ----
cat("\n[8] ordered models...\n")
trans <- panel_master %>% arrange(Country, Year) %>% group_by(Country) %>%
  mutate(prev_score=lag(CompositeScore),
         change=CompositeScore-prev_score,
         direction=case_when(change>0~"Upgrade", change<0~"Downgrade", TRUE~"Stable"),
         lag_growth=lag(GDP_growth_pct), lag_fdi=lag(FDI_pct_GDP),
         lag_loggdp=lag(log_GDPpc), lag_score=lag(CompositeScore)) %>%
  ungroup() %>%
  mutate(direction=factor(direction, levels=c("Downgrade","Stable","Upgrade"), ordered=TRUE)) %>%
  drop_na(direction, lag_growth, lag_fdi, lag_loggdp, lag_score)
m_logit  <- MASS::polr(direction ~ lag_growth + lag_fdi + lag_loggdp + lag_score,
                       data=trans, method="logistic", Hess=TRUE)
m_probit <- MASS::polr(direction ~ lag_growth + lag_fdi + lag_loggdp + lag_score,
                       data=trans, method="probit", Hess=TRUE)
ms_ord <- modelsummary(list("Ordered logit"=m_logit, "Ordered probit"=m_probit),
  output="latex", fmt=3,
  stars=c("*"=0.10,"**"=0.05,"***"=0.01),
  gof_map=tribble(~raw,~clean,~fmt,
                  "nobs","N",0,"logLik","Log-Lik.",1,"aic","AIC",1),
  coef_rename=c("lag_growth"="Lag GDP growth","lag_fdi"="Lag FDI",
                "lag_loggdp"="Lag log GDPpc","lag_score"="Lag composite score"),
  title="Ordered-response models for rating change.",
  notes="* p<0.10, ** p<0.05, *** p<0.01.")
write_tex(as.character(ms_ord), "tab_ordered_models")
coefs_ord <- bind_rows(
  broom::tidy(m_logit) %>% mutate(model="Ordered logit"),
  broom::tidy(m_probit) %>% mutate(model="Ordered probit")
) %>% filter(coef.type=="coefficient")
p30 <- ggplot(coefs_ord, aes(estimate, fct_reorder(term, estimate))) +
  geom_vline(xintercept=0) +
  geom_pointrange(aes(xmin=estimate-1.96*std.error, xmax=estimate+1.96*std.error)) +
  facet_wrap(~ model) +
  labs(title="Ordered-response coefficients",
       x="Coefficient (95% CI)", y=NULL)
save_fig(p30, "fig30_ordered_coefs", w=9, h=4.5)

# ---------- 9. DESCRIPTIVE FIGURES ----
cat("\n[9] descriptive figures...\n")
p1a <- ggplot(events, aes(Score)) + geom_histogram(bins=30) +
  labs(title="Distribution of agency-level scores", x="Score (0-60)", y="Count")
p1b <- ggplot(events, aes(Agency, Score)) +
  geom_boxplot() +
  labs(title="Score by agency", x=NULL, y="Score")
p1c <- ggplot(events %>% count(Year), aes(Year, n)) + geom_col() +
  labs(title="Events per year", x=NULL, y="Count")
p1d <- ggplot(events %>% filter(!is.na(Direction)) %>% count(Direction),
              aes(Direction, n)) + geom_col() +
  labs(title="Up vs down events", x=NULL, y="Count")
fig01 <- (p1a | p1b) / (p1c | p1d) + plot_annotation(title="Score distribution overview")
save_fig(fig01, "fig01_distribution_overview", w=11, h=7)
latest_country <- panel_master %>% group_by(Country) %>%
  slice_max(Year, n=1, with_ties=FALSE) %>% ungroup() %>% drop_na(CompositeScore)
top25 <- latest_country %>% slice_max(CompositeScore, n=25, with_ties=FALSE)
bot25 <- latest_country %>% slice_min(CompositeScore, n=25, with_ties=FALSE)
ptop <- ggplot(top25, aes(CompositeScore, fct_reorder(Country, CompositeScore))) +
  geom_col() + labs(title="Top 25 sovereigns (latest)", x="Composite score", y=NULL)
pbot <- ggplot(bot25, aes(CompositeScore, fct_reorder(Country, CompositeScore))) +
  geom_col() + labs(title="Bottom 25 sovereigns (latest)", x="Composite score", y=NULL)
fig02 <- ptop | pbot
save_fig(fig02, "fig02_country_rankings", w=12, h=8)
ann <- events %>% group_by(Agency, Year) %>%
  summarise(meanScore=mean(Score, na.rm=TRUE), .groups="drop")
p3 <- ggplot(ann, aes(Year, meanScore, linetype=Agency)) +
  geom_line() +
  labs(title="Average rating per agency over time", y="Mean score", x=NULL)
save_fig(p3, "fig03_trends", w=9, h=4.5)
wide <- events %>% group_by(Country, Agency) %>%
  slice_max(Year, n=1, with_ties=FALSE) %>% ungroup() %>%
  select(Country, Agency, Score) %>%
  pivot_wider(names_from=Agency, values_from=Score)
p4 <- ggplot(wide, aes(`S&P`, `Moody's`)) +
  geom_abline(slope=1, linetype="dashed") +
  geom_point() +
  geom_smooth(method="lm", se=FALSE) +
  coord_equal(xlim=c(0,60), ylim=c(0,60)) +
  labs(title="S&P vs Moody's latest scores", x="S&P score", y="Moody's score")
save_fig(p4, "fig04_agency_scatter", w=6, h=6)
vol <- panel_master %>% drop_na(CompositeScore) %>% group_by(Country) %>%
  summarise(vol=sd(CompositeScore, na.rm=TRUE), n=n(), .groups="drop") %>%
  filter(n>=10) %>% slice_max(vol, n=30)
p6 <- ggplot(vol, aes(vol, fct_reorder(Country, vol))) +
  geom_col() +
  labs(title="Top 30 most volatile sovereigns",
       x="SD of composite score", y=NULL)
save_fig(p6, "fig06_volatility", w=8, h=8)

# ---------- 10. GINI ----
cat("\n[10] Gini...\n")
world_gini <- gini_panel %>% filter(Group=="World") %>% arrange(Year)
p_world <- ggplot(world_gini, aes(Year, Gini)) +
  geom_line() +
  geom_point() +
  labs(title="Sovereign rating inequality (World Gini)",
       y="Gini coefficient", x=NULL)
save_fig(p_world, "fig14b_world_gini", w=8, h=4)
mece <- c("WB_High_Income","WB_Upper_Middle_Income","WB_Lower_Middle_Income","WB_Low_Income",
          "Africa","Asia","Europe","North_America","South_America","Oceania","World")
heat <- gini_panel %>% filter(Group %in% mece, Year >= 2000)
p_heat <- ggplot(heat, aes(Year, Group, fill=Gini)) +
  geom_tile() +
  labs(title="Rating-Gini heatmap by group x year",
       x=NULL, y=NULL, fill="Gini")
save_fig(p_heat, "fig14_gini_heatmap", w=11, h=4.5)
latest_gini <- gini_panel %>% group_by(Group) %>%
  slice_max(Year, n=1, with_ties=FALSE) %>% ungroup() %>%
  arrange(desc(Gini)) %>% slice_head(n=15)
write_tex(as.character(
  latest_gini %>% transmute(Group, Year,
                            Gini=sprintf("%.3f", Gini),
                            Mean=sprintf("%.2f", Mean),
                            SD=sprintf("%.2f", SD)) %>%
    kbl(format="latex", booktabs=TRUE,
        caption="Most unequal grouping ladders (latest-year Gini).",
        label="tab:gini_top_groups")
), "tab_gini_top_groups")

cat("\nFINISHED. Tables in", TAB_DIR, "\nFigures in", FIG_DIR, "\n")
