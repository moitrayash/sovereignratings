/* ─────────────────────────────────────────────────────────────────────
   Hover-tooltip dictionary. Loaded by every page; consumed by shared.js.
   Each entry: text (verbatim or near-verbatim from a public reference),
   source (short attribution shown small).

   Add data-term="<key>" to any element to attach a tooltip. The element
   acquires a dotted underline. Toggle off via the HINTS pill.
   ───────────────────────────────────────────────────────────────────── */

window.TIPS = {

  // ── statistics / econometrics ─────────────────────────────────────
  'monotonic': {
    text: 'A function or transformation that preserves order: if x ≤ y then f(x) ≤ f(y) (or the reverse, in the strictly-decreasing case). Two ratings scales related by a monotonic transformation give identical rank-order results.',
    source: 'Wikipedia: Monotonic function'
  },
  'fixed-effects': {
    text: 'In panel data, fixed effects (FE) absorb unobserved time-invariant heterogeneity by including a separate intercept for each unit (e.g., country). Within-FE estimates use only variation around each unit\'s own mean.',
    source: 'Wikipedia: Fixed effects model'
  },
  'pooled-ols': {
    text: 'Ordinary least squares estimated on a panel without separate intercepts per unit. Captures both between-unit and within-unit variation; biased if there is unobserved unit-level heterogeneity correlated with regressors.',
    source: 'Wikipedia: Ordinary least squares'
  },
  'within-r2': {
    text: 'In fixed-effects regression, the share of variance in the demeaned dependent variable explained by the demeaned regressors. Distinct from R² in the pooled regression, which can be much larger if between-unit differences dominate.',
    source: 'Stata documentation: xtreg'
  },
  'beta': {
    text: 'A regression coefficient (β) is the estimated change in the dependent variable for a one-unit change in the regressor, holding others constant. *** typically denotes statistical significance at p < 0.01.',
    source: 'Wikipedia: Regression coefficient'
  },
  'cluster-se': {
    text: 'Cluster-robust standard errors allow the regression error term to be correlated within clusters (e.g., country) but assume independence across clusters. Standard correction when residuals are not i.i.d.',
    source: 'Cameron and Miller (2015), JHR'
  },
  'ordered-logit': {
    text: 'A regression model for an ordinal outcome (here: downgrade / stable / upgrade). Estimates the probability of falling into each ordered category as a function of regressors, using a logistic link.',
    source: 'Wikipedia: Ordered logit'
  },
  'ordered-probit': {
    text: 'Identical to ordered logit but with a normal CDF link instead of logistic. Coefficients are not directly comparable across the two; marginal effects usually are.',
    source: 'Wikipedia: Ordered probit'
  },
  'gini-coefficient': {
    text: 'A measure of statistical dispersion intended to represent the inequality within a distribution. Gini = 0 means perfect equality (everyone has the same value); Gini = 1 means maximal inequality (all the mass is held by one observation).',
    source: 'Wikipedia: Gini coefficient'
  },
  'lorenz-curve': {
    text: 'A graphical representation of the distribution of a quantity (income, scores) plotting the cumulative share of total mass against the cumulative share of population. The 45° line represents perfect equality; Gini is twice the area between the line and the curve.',
    source: 'Wikipedia: Lorenz curve'
  },
  'cdf': {
    text: 'The cumulative distribution function F(x) of a random variable X gives the probability that X is at most x. Plotting empirical F(x) (sorting the sample) reveals the shape of the distribution at every percentile.',
    source: 'Wikipedia: Cumulative distribution function'
  },
  'normal-distribution': {
    text: 'A continuous probability distribution symmetric around its mean μ with standard deviation σ. The classic bell curve. Many empirical distributions are approximately normal in the centre but have heavier or lighter tails.',
    source: 'Wikipedia: Normal distribution'
  },
  'haversine': {
    text: 'A formula for the great-circle distance between two points on a sphere given their latitudes and longitudes. Used here to compute inter-capital distances for the distance-graded benchmark.',
    source: 'Wikipedia: Haversine formula'
  },
  'pearson-r': {
    text: 'The Pearson correlation coefficient measures the strength of the linear relationship between two variables. Ranges from −1 (perfect negative) through 0 (no linear relation) to +1 (perfect positive).',
    source: 'Wikipedia: Pearson correlation coefficient'
  },
  'spearman-rho': {
    text: 'The Spearman rank correlation measures the monotone (not necessarily linear) relationship between two variables, computed as the Pearson correlation of their ranks. Robust to outliers and non-linear monotone transforms.',
    source: 'Wikipedia: Spearman\'s rank correlation coefficient'
  },
  'rmse': {
    text: 'Root mean squared error: the square root of the average squared difference between observed and predicted values. In the same units as the dependent variable; lower is better.',
    source: 'Wikipedia: Root-mean-square deviation'
  },

  // ── relativization variants ───────────────────────────────────────
  'rel_eq': {
    text: 'Equal-weighted relativization: a country\'s score minus the simple (unweighted) mean across all reporting countries in the same year.',
    source: 'De, Mohapatra and Ratha (2020)'
  },
  'rel_gdp': {
    text: 'GDP-weighted relativization: a country\'s score minus the GDP-weighted mean of all reporting countries in the same year. Larger economies pull the benchmark.',
    source: 'De, Mohapatra and Ratha (2020)'
  },
  'rel_gdp2008': {
    text: 'GDP-weighted relativization with weights fixed at the 2008 GDP shares. Eliminates drift in the benchmark caused by changing economic mass.',
    source: 'Basu, De, Ratha and Timmer (2013)'
  },
  'rel_pop': {
    text: 'Population-weighted relativization: subtracts a population-weighted mean. Larger populations pull the benchmark.',
    source: 'De, Mohapatra and Ratha (2020)'
  },
  'rel_median': {
    text: 'Median-anchored relativization: subtracts the within-year median. Robust to outliers.',
    source: 'De, Mohapatra and Ratha (2020)'
  },
  'z_eq': {
    text: 'Standardised score: (Score − equal-weighted mean) divided by the standard deviation. Expresses the country\'s deviation in units of cross-country dispersion.',
    source: 'De, Mohapatra and Ratha (2020)'
  },
  'z_gdp': {
    text: 'Standardised score using a GDP-weighted mean and standard deviation. Bigger-economy bias.',
    source: 'De, Mohapatra and Ratha (2020)'
  },
  'pct_rank': {
    text: 'Within-year percentile rank, scaled to [0, 1]. Non-parametric; insensitive to the underlying scale.',
    source: 'De, Mohapatra and Ratha (2020)'
  },
  'norm_max': {
    text: 'Score divided by the maximum within the year. Top country gets 1.0; everyone else is a fraction of the leader.',
    source: 'De, Mohapatra and Ratha (2020)'
  },
  'norm_min': {
    text: 'Min-max normalisation: (Score − min) / (max − min). Top country gets 1.0, bottom gets 0.0.',
    source: 'Wikipedia: Feature scaling'
  },
  'cris': {
    text: 'Comparative Rating Index for Sovereigns (CRIS) — Basu, De, Ratha and Timmer (2013). Each country\'s rating expressed as 100 × (score / GDP-weighted world average); 100 is the world benchmark.',
    source: 'World Bank Policy Research Working Paper 6641'
  },
  'rrr': {
    text: 'Relative Risk Rating: a sovereign\'s score minus a GDP-weighted world average of sovereign scores, isolating idiosyncratic risk from the global cycle. Defined in Basu, De, Ratha and Timmer (2013).',
    source: 'World Bank Policy Research Working Paper 6641'
  },
  'shadow-rating': {
    text: 'A rating implied by a country\'s macro and institutional fundamentals, estimated by regressing observed agency scores on structural covariates and applying the model out of sample. Concept due to Ratha, De and Mohapatra (2007).',
    source: 'World Bank Policy Research Working Paper 4269'
  },
  'rule-of-law': {
    text: 'A Worldwide Governance Indicator (range −2.5 to +2.5) capturing perceptions of contract enforcement, property rights, the police, the courts, and the likelihood of crime and violence. Methodology in Kaufmann, Kraay and Mastruzzi (2010).',
    source: 'World Bank, Worldwide Governance Indicators'
  },
  'investment-grade': {
    text: 'A rating at or above BBB− (S&P / DBRS Morningstar) or Baa3 (Moody\'s), corresponding to a score of approximately 42 on the 0–60 scale. Below this threshold a sovereign is classified as speculative grade.',
    source: 'Wikipedia: Bond credit rating'
  },
  'loo-mean': {
    text: 'Leave-one-out mean: the average of all peer-group members\' values in a given year, excluding the focal country. Avoids the mechanical compression that arises when a country\'s own value is included in its benchmark.',
    source: 'Project methodology'
  },
  'm1': {
    text: 'Primary relative-rating measure: country score squared, divided by the leave-one-out group mean. Squaring amplifies upper-tail discrimination; LOO removes self-influence.',
    source: 'Project methodology, §4'
  },
  'm2': {
    text: 'Within-group ordinal rank (raw integer). Non-parametric; not directly comparable across groups of different sizes.',
    source: 'Project methodology, §4'
  },
  'm3': {
    text: 'Score squared divided by the prior-year leave-one-out group mean. Captures the speed of adjustment at structural breaks.',
    source: 'Project methodology, §4'
  },
  'm4': {
    text: 'Within-year percentile rank, scaled to [0, 1]. Comparable across groups of different sizes.',
    source: 'Project methodology, §4'
  },

  // ── credit-rating notation ────────────────────────────────────────
  'AAA': { text: 'Highest credit rating from S&P / DBRS Morningstar; equivalent to Aaa from Moody\'s. Score 60 on the 0–60 scale. Reflects an extremely strong capacity to meet financial commitments.', source: 'S&P, Moody\'s, DBRS Morningstar definitions' },
  'BBB': { text: 'Lowest investment-grade rating from S&P / DBRS (with the BBB+, BBB, BBB− subdivisions); equivalent to Baa from Moody\'s. Score around 42 on the 0–60 scale.', source: 'S&P, Moody\'s, DBRS Morningstar definitions' },
  'SD':  { text: 'Selective Default: an issuer has defaulted on a specific obligation but continues to honour others. S&P\'s notation; Moody\'s typically uses C or LD.', source: 'S&P Global Ratings' },

  // ── data sources ──────────────────────────────────────────────────
  'WGI':  { text: 'Worldwide Governance Indicators — six aggregate indicators of institutional quality (Voice & Accountability, Political Stability, Government Effectiveness, Regulatory Quality, Rule of Law, Control of Corruption) compiled annually by the World Bank.', source: 'Kaufmann, Kraay and Mastruzzi (2010)' },
  'WDI':  { text: 'World Development Indicators — the World Bank\'s primary database of cross-country development statistics, covering ~1,400 indicators for 217 economies.', source: 'World Bank Open Data' },
  'HDR':  { text: 'Human Development Report — UNDP\'s flagship publication, including the Human Development Index. Initial 1990 framing by Mahbub ul Haq, refined with input from Amartya Sen.', source: 'UNDP Human Development Report Office' },
  'IMF':  { text: 'International Monetary Fund — multilateral institution monitoring the international monetary system and providing balance-of-payments lending and policy advice.', source: 'imf.org' }
};
