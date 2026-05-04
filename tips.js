/* ─────────────────────────────────────────────────────────────────────
   Hover-tooltip dictionary. Loaded by every page; consumed by shared.js.

   Each entry: { text, source }
     text   — plain-English explanation first, technical detail second.
              Aim: a smart non-specialist (high-school+) understands the
              first sentence; the optional second sentence adds rigour.
     source — short attribution shown in small caps under the text.

   Two ways to attach a tooltip to an element:
     1. <span class="term" data-term="key">…</span>  — explicit tag
     2. Auto-decoration: shared.js scans body text for every alias listed
        in window.TIPS_ALIASES and wraps the first occurrence per page.
        No HTML edits needed — just add the surface word + key to the map.
   ───────────────────────────────────────────────────────────────────── */

window.TIPS = {

  // ═════════ CREDIT RATING BASICS ════════════════════════════════════
  'sovereign': {
    text: 'A country acting as a borrower. A "sovereign credit rating" is the rating an agency gives to a national government, not to a company or individual.',
    source: 'S&P Global Ratings methodology'
  },
  'credit-rating': {
    text: 'A letter grade (like AAA or BB) that estimates how likely a borrower is to repay its debts. Higher = safer. Sovereign ratings are issued by S&P, Moody\'s, DBRS and a few others.',
    source: 'Wikipedia: Credit rating'
  },
  'agency': {
    text: 'A credit-rating company. The three covered here are Standard & Poor\'s (S&P), Moody\'s, and DBRS; together they assign almost every sovereign rating in circulation.',
    source: 'IOSCO Code of Conduct for CRAs'
  },
  'rating-agency': {
    text: 'A firm that publishes credit ratings on borrowers (countries, companies, securities). The "Big Three" globally are S&P, Moody\'s, and Fitch; this site adds DBRS instead of Fitch because of its broader sovereign coverage.',
    source: 'SEC Office of Credit Ratings'
  },
  'notch': {
    text: 'One step on a rating scale. AAA → AA+ is a "one-notch downgrade"; AAA → A+ is a "three-notch downgrade". On the 0–60 scale used here, one notch ≈ 3 points.',
    source: 'S&P Global Ratings Definitions'
  },
  'outlook': {
    text: 'An agency\'s view of where a rating is likely to move next: positive (might be upgraded), stable (probably won\'t change), or negative (might be downgraded). Doesn\'t change the current rating, just signals direction.',
    source: 'Moody\'s rating symbols and definitions'
  },
  'upgrade': {
    text: 'When an agency raises a country\'s rating — e.g. from BB to BBB. Usually triggered by improving economic or political conditions; lowers the country\'s borrowing cost.',
    source: 'S&P Global Ratings Definitions'
  },
  'downgrade': {
    text: 'When an agency lowers a country\'s rating — e.g. from A to BBB. Often pushes up the cost the country pays to borrow money. Crossing from BBB− to BB+ is called "losing investment grade".',
    source: 'S&P Global Ratings Definitions'
  },
  'default': {
    text: 'When a borrower fails to make a debt payment on time, or restructures its debt on worse terms than originally agreed. For sovereigns, default is rare but very costly — recent examples: Argentina (2001, 2014, 2020), Greece (2012), Sri Lanka (2022).',
    source: 'IMF, "Sovereign Debt Restructurings"'
  },
  'investment-grade': {
    text: 'A rating at or above BBB− (S&P / DBRS) or Baa3 (Moody\'s) — corresponds to about 42 on the 0–60 scale. Many institutional investors (pension funds, insurers) are legally required to hold only investment-grade debt, so falling below this line cuts off a huge pool of buyers.',
    source: 'Wikipedia: Bond credit rating'
  },
  'speculative-grade': {
    text: 'Anything below BBB− / Baa3. Also called "junk", "high yield", or "non-investment grade". Riskier; pays a higher interest rate to compensate.',
    source: 'Wikipedia: Bond credit rating'
  },
  'AAA': {
    text: 'The highest credit rating from S&P or DBRS (Aaa from Moody\'s). Corresponds to 60 on the 0–60 scale. Means "extremely strong capacity to meet obligations" — the borrower is considered as safe as it gets.',
    source: 'S&P, Moody\'s, DBRS definitions'
  },
  'BBB': {
    text: 'The lowest investment-grade rating bracket — split into BBB+, BBB, BBB−. About 42 on the 0–60 scale. The line between BBB− and BB+ is the most-watched threshold in sovereign debt markets.',
    source: 'S&P, Moody\'s, DBRS definitions'
  },
  'SD': {
    text: 'Selective Default — the borrower has missed payments on one specific debt but is still paying others. S&P\'s notation; Moody\'s usually writes "C" or "LD" for the same situation.',
    source: 'S&P Global Ratings'
  },
  'composite-score': {
    text: 'The single 0–60 score this site uses for each country in each year, averaged across whichever of S&P, Moody\'s, and DBRS rated it that year. Smooths out per-agency quirks.',
    source: 'Project methodology, §1'
  },
  'basu-mapping': {
    text: 'The conversion table that turns letter grades (AAA, AA+, …) into numbers on a 0–60 scale. Each major grade gets a 6-point band; each notch is 3 points; the outlook (positive/stable/negative) shifts ±1.',
    source: 'Basu, De, Ratha & Timmer (2013), refined here'
  },
  'spread': {
    text: 'The extra interest a riskier borrower has to pay over a benchmark like US Treasuries. A 200-basis-point spread = 2 percentage points more. Spreads widen when markets get nervous about default risk.',
    source: 'CFA Institute, Fixed Income'
  },
  'basis-points': {
    text: 'One basis point = 1/100th of a percentage point. So 50 basis points = 0.50%. Used because moves in interest rates and yields are usually small fractions of a percent.',
    source: 'Investopedia: Basis Point'
  },

  // ═════════ STATISTICS / DESCRIPTIVE ════════════════════════════════
  'mean': {
    text: 'The average — add everything up, divide by how many things there are. Pulled around by extreme values (one billionaire raises a town\'s mean income a lot more than its median).',
    source: 'Wikipedia: Mean'
  },
  'median': {
    text: 'The middle value when everything is lined up in order. Half the observations are above, half below. Less affected by extreme outliers than the mean.',
    source: 'Wikipedia: Median'
  },
  'percentile': {
    text: 'Your rank as a fraction of the group. 90th percentile = you\'re higher than 90% of the group. The median is the 50th percentile.',
    source: 'Wikipedia: Percentile'
  },
  'standard-deviation': {
    text: 'A measure of how spread out the values are around their mean. Small SD = everything close to average; large SD = lots of variation. About two-thirds of values fall within ±1 SD of the mean (for a roughly bell-shaped distribution).',
    source: 'Wikipedia: Standard deviation'
  },
  'variance': {
    text: 'Standard deviation squared. Same idea — how spread out the data are — but in squared units, which makes algebra simpler even though the number is harder to interpret directly.',
    source: 'Wikipedia: Variance'
  },
  'distribution': {
    text: 'The pattern of how values are spread out — e.g. "most countries score 30–45, a few are way below". Visualised with histograms, density plots, or a CDF.',
    source: 'Wikipedia: Probability distribution'
  },
  'normal-distribution': {
    text: 'The classic "bell curve". Symmetric around the mean, with most values close to the centre and few in the tails. Many natural measurements (height, IQ, test scores) are roughly normal.',
    source: 'Wikipedia: Normal distribution'
  },
  'cdf': {
    text: 'Cumulative Distribution Function — for any value x, it tells you the share of observations that are ≤ x. Plotting it gives a smooth curve from 0 to 1 that shows the whole shape of the distribution.',
    source: 'Wikipedia: Cumulative distribution function'
  },
  'z-score': {
    text: 'How many standard deviations a value is away from the mean. A z-score of +2 means the country is two SDs above average; −1.5 means 1.5 SDs below. Lets you compare values measured in different units.',
    source: 'Wikipedia: Standard score'
  },
  'pearson-r': {
    text: 'A number between −1 and +1 that measures how tightly two variables move together in a straight line. +1 = perfect positive correlation; 0 = none; −1 = perfectly opposite.',
    source: 'Wikipedia: Pearson correlation coefficient'
  },
  'spearman-rho': {
    text: 'Like Pearson, but measures whether two variables move together in the same order, even if not in a straight line. Compute Pearson on the ranks instead of the raw values. Robust to outliers.',
    source: 'Wikipedia: Spearman\'s rank correlation coefficient'
  },
  'correlation': {
    text: 'A number summarising how strongly two things move together. +1 means they rise and fall in lockstep; −1 means one rises when the other falls; 0 means no linear relationship. Correlation ≠ causation.',
    source: 'Wikipedia: Correlation'
  },
  'monotonic': {
    text: 'A change that preserves order. If country A scored higher than country B before, it still does after. Switching from a 0–60 scale to a 0–100 scale is monotonic; it doesn\'t change anybody\'s rank.',
    source: 'Wikipedia: Monotonic function'
  },
  'rmse': {
    text: 'Root Mean Squared Error — a way to score how wrong a prediction is. Take each error, square it, average them, take the square root. Lower = better. In the same units as what you\'re predicting.',
    source: 'Wikipedia: Root-mean-square deviation'
  },
  'p-value': {
    text: 'The probability that you\'d see a result this extreme purely by chance, if there really were no effect. p < 0.01 (often marked ***) means "less than 1% chance of a fluke". Smaller p = stronger evidence against the no-effect story.',
    source: 'Wikipedia: P-value'
  },
  'significance': {
    text: 'A loose label for "probably not a fluke". A coefficient is "statistically significant at 1%" if its p-value is below 0.01 — i.e., extremely unlikely to be the result of random variation alone.',
    source: 'Wikipedia: Statistical significance'
  },
  'confidence-interval': {
    text: 'A range of plausible values for a true quantity. A 95% confidence interval of (3.2, 5.8) means "if we repeated the analysis many times, the interval would contain the true value 95% of the time".',
    source: 'Wikipedia: Confidence interval'
  },
  'outlier': {
    text: 'An observation that\'s far from the rest of the data. Could be a real extreme case (a defaulted sovereign) or a data error. Outliers can pull the mean and OLS regression lines around — robust methods (median, rank-based) shrug them off.',
    source: 'Wikipedia: Outlier'
  },

  // ═════════ ECONOMETRICS / REGRESSION ═══════════════════════════════
  'regression': {
    text: 'A statistical method for estimating how one variable (the outcome) responds to changes in others. The output is a set of coefficients — "a 1-unit rise in GDP per capita is associated with a X-point rise in rating".',
    source: 'Wikipedia: Regression analysis'
  },
  'beta': {
    text: 'A regression coefficient (β). Tells you how much the outcome changes when one predictor goes up by 1 unit, holding the other predictors fixed. *** typically means p < 0.01 (very statistically significant).',
    source: 'Wikipedia: Regression coefficient'
  },
  'ols': {
    text: 'Ordinary Least Squares — the standard regression method. Picks the coefficients that minimise the sum of squared errors between predicted and actual values. Workhorse of empirical economics.',
    source: 'Wikipedia: Ordinary least squares'
  },
  'pooled-ols': {
    text: 'OLS run on a panel of country-years without separating "what makes Germany Germany" from "what changed in 2012". Gives a strong fit but mixes between-country and within-country variation, so coefficients can be misleading.',
    source: 'Wooldridge, Econometric Analysis of Panel Data'
  },
  'panel-data': {
    text: 'A dataset that follows the same units (here: countries) over multiple time periods. Lets you separate "things that always make this country different" from "things that changed over time".',
    source: 'Wikipedia: Panel data'
  },
  'fixed-effects': {
    text: 'A regression trick that gives every country its own intercept, absorbing anything that\'s permanently different about that country (geography, colonial history, language). Estimates are then driven only by within-country movement over time.',
    source: 'Wikipedia: Fixed effects model'
  },
  'random-effects': {
    text: 'A panel-regression alternative to fixed effects that treats country differences as random draws from a wider population. More efficient if its assumptions hold; biased if country differences correlate with the predictors. The Hausman test picks between them.',
    source: 'Wooldridge, Econometric Analysis'
  },
  'within-r2': {
    text: 'In a fixed-effects regression, the share of within-country variation that the model explains. Different from the more familiar R² because it ignores between-country differences. A within-R² near 0 means the predictors don\'t move with the outcome over time, even if they correlate cross-sectionally.',
    source: 'Stata documentation: xtreg'
  },
  'r-squared': {
    text: 'A 0–1 score for how much variation in the outcome the model explains. R² = 0.90 means the predictors account for 90% of the variation. High R² doesn\'t mean correct — overfitting can inflate it.',
    source: 'Wikipedia: Coefficient of determination'
  },
  'cluster-se': {
    text: 'Cluster-robust standard errors. Adjust for the fact that observations from the same group (e.g. multiple years for one country) aren\'t fully independent. Without the adjustment, standard errors look smaller than they really are and you\'ll over-claim significance.',
    source: 'Cameron and Miller (2015), JHR'
  },
  'endogeneity': {
    text: 'When a regressor is correlated with the error term — typically because the outcome partly causes the predictor, or both share a common cause. Makes OLS coefficients biased. Fixed by instrumental variables, GMM, or natural experiments.',
    source: 'Wikipedia: Endogeneity'
  },
  'gmm': {
    text: 'Generalized Method of Moments — a way to estimate models when OLS is biased (e.g. dynamic panels with lagged outcomes). Arellano-Bond GMM is the workhorse for sovereign-rating dynamics.',
    source: 'Wikipedia: Generalized method of moments'
  },
  'ordered-logit': {
    text: 'A regression for an outcome that has a natural order but no spacing — here: downgrade / stable / upgrade. Estimates the chance of each category as a function of the predictors.',
    source: 'Wikipedia: Ordered logit'
  },
  'ordered-probit': {
    text: 'Same as ordered logit but with a normal-distribution link function instead of logistic. Coefficients differ in scale; predicted probabilities are nearly identical.',
    source: 'Wikipedia: Ordered probit'
  },
  'instrumental-variable': {
    text: 'A variable that affects your predictor but only affects the outcome through that predictor. Used to escape endogeneity bias. Famous example: rainfall as an IV for African civil-war risk in the Miguel et al. (2004) paper.',
    source: 'Wikipedia: Instrumental variable'
  },
  'mean-reversion': {
    text: 'The tendency of an extreme value to drift back toward the average. Countries with very high or very low ratings tend to move toward the middle over time, partly because there\'s less room to move further out.',
    source: 'Wikipedia: Mean reversion'
  },

  // ═════════ INEQUALITY / DISTRIBUTIONAL MEASURES ════════════════════
  'gini-coefficient': {
    text: 'A 0–1 score for how unequal a distribution is. 0 = perfect equality (everyone identical); 1 = maximal inequality (one person has everything). The world\'s income Gini is around 0.62; rich-country Ginis are typically 0.25–0.45.',
    source: 'Wikipedia: Gini coefficient'
  },
  'lorenz-curve': {
    text: 'A picture of inequality. The x-axis is the cumulative share of population (poorest to richest); the y-axis is the cumulative share of income (or whatever you\'re measuring). The 45° line is perfect equality; the gap between the line and the curve is the Gini.',
    source: 'Wikipedia: Lorenz curve'
  },
  'iqr': {
    text: 'Interquartile Range — the span from the 25th percentile to the 75th. Captures where the "middle half" of the data sits. Wider IQR = more variation in the middle.',
    source: 'Wikipedia: Interquartile range'
  },

  // ═════════ MACRO / FINANCE INDICATORS ══════════════════════════════
  'gdp': {
    text: 'Gross Domestic Product — the total dollar value of everything a country produces in a year. The standard measure of an economy\'s size. The US is around $27T; the world total is around $105T (2024).',
    source: 'World Bank Open Data'
  },
  'gdp-per-capita': {
    text: 'GDP divided by population — a rough indicator of average income. Luxembourg ≈ $130k, Burundi ≈ $300. The most reliable single predictor of credit ratings in cross-section.',
    source: 'World Bank Open Data'
  },
  'fdi': {
    text: 'Foreign Direct Investment — money flowing into a country to buy productive assets (factories, stakes in companies) rather than passive securities. Often expressed as % of GDP. Sustained high FDI signals investor confidence.',
    source: 'IMF Balance of Payments Manual, 6th ed.'
  },
  'inflation': {
    text: 'The rate at which the general price level rises. 2% is the target in most rich countries. Hyperinflation (Venezuela 2017, Zimbabwe 2008) destroys real wealth and tends to wreck credit ratings.',
    source: 'IMF, World Economic Outlook'
  },
  'debt-to-gdp': {
    text: 'A country\'s government debt expressed as a fraction of its annual GDP. Crude solvency gauge: at 30% you\'re relaxed; at 100% you\'re watched; at 150%+ you\'re in trouble unless you can borrow in your own currency (Japan can; Argentina can\'t).',
    source: 'IMF Fiscal Monitor'
  },
  'current-account': {
    text: 'A country\'s net trade with the rest of the world (exports − imports + net income from abroad). Persistent deficits mean borrowing from foreigners; persistent surpluses mean lending to them.',
    source: 'IMF Balance of Payments Manual'
  },

  // ═════════ PROJECT-SPECIFIC METHODS ════════════════════════════════
  'loo-mean': {
    text: 'Leave-One-Out mean — the average of every country in a peer group except the one you\'re measuring. Avoids the circular problem of comparing a country to a benchmark that includes itself.',
    source: 'Project methodology'
  },
  'm1': {
    text: 'Method 1 in this project — country score squared, divided by the leave-one-out group mean. Squaring exaggerates differences at the top end; LOO removes self-influence on the benchmark.',
    source: 'Project methodology, §4'
  },
  'm2': {
    text: 'Method 2 — the country\'s integer rank within its peer group that year (1 = best). Simple and non-parametric; not directly comparable across groups of different sizes.',
    source: 'Project methodology, §4'
  },
  'm3': {
    text: 'Method 3 — like M1, but the benchmark is last year\'s peer-group mean instead of this year\'s. Captures how fast a country adjusts when its peers move.',
    source: 'Project methodology, §4'
  },
  'm4': {
    text: 'Method 4 — within-year percentile rank from 0 to 1. Country at the top of its peer group gets 1.0; bottom gets near 0. Comparable across groups of any size.',
    source: 'Project methodology, §4'
  },
  'cris': {
    text: 'Comparative Rating Index for Sovereigns — Basu, De, Ratha & Timmer (2013). A country\'s score divided by the GDP-weighted world average, multiplied by 100. So 100 means "exactly the world benchmark"; 120 means "20% better".',
    source: 'World Bank Policy Research Working Paper 6641'
  },
  'rrr': {
    text: 'Relative Risk Rating — a country\'s score minus the GDP-weighted world average. Strips out the global cycle so what\'s left is the country-specific risk story. From Basu et al. (2013).',
    source: 'World Bank Policy Research Working Paper 6641'
  },
  'shadow-rating': {
    text: 'A predicted rating, generated by feeding macro and institutional data into a statistical model fitted on countries the agencies do rate. Useful for unrated countries and for spotting when an agency seems to be off-model.',
    source: 'Ratha, De & Mohapatra (2007), WB WPS 4269'
  },
  'haversine': {
    text: 'A formula for the distance between two points on a sphere given their latitude and longitude. Used here to compute "how far is Country A\'s capital from Country B\'s capital" for the distance-graded benchmark.',
    source: 'Wikipedia: Haversine formula'
  },
  'method-a': {
    text: 'Method A — the simplest comparison: pick two countries, plot the gap between their scores over time. Useful for matched pairs (Greece vs Germany, Russia vs Ukraine).',
    source: 'Project methodology'
  },
  'method-b': {
    text: 'Method B — distance-graded benchmark. Compares a country to a weighted average of every other country, with closer neighbours getting more weight (1/distance kernel based on capital coordinates).',
    source: 'Project methodology'
  },
  'method-c': {
    text: 'Method C — Bayesian shrinkage / James-Stein. Pulls each country\'s rating partly toward the peer-group mean, with the pull stronger when the data on that country are noisy. A way to avoid over-reacting to a single year.',
    source: 'Project methodology'
  },
  'method-d': {
    text: 'Method D — Random Forest. An ensemble of decision trees fitted to macro features (GDP, FDI, growth, governance scores) that predicts what the rating "should be". Useful for spotting countries whose rating diverges from their fundamentals.',
    source: 'Project methodology'
  },
  'random-forest': {
    text: 'A machine-learning method that averages predictions from hundreds of decision trees, each trained on a random subset of the data and features. Good at handling non-linearities and interactions; not great at extrapolating beyond the training range.',
    source: 'Breiman (2001), Machine Learning'
  },
  'bayesian-shrinkage': {
    text: 'A way to combine new evidence with prior expectations. The "shrinkage" pulls noisy individual estimates toward a group average — sharper when the individual data are sparse, softer when they\'re abundant.',
    source: 'Efron, Computer Age Statistical Inference'
  },
  'james-stein': {
    text: 'A surprising 1961 result: when estimating three or more averages at once, you get smaller total error by shrinking each estimate toward the grand mean rather than reporting each on its own. The mathematical basis for "regression to the mean" estimators.',
    source: 'Stein (1956); James & Stein (1961)'
  },

  // ═════════ DATA SOURCES & INSTITUTIONS ═════════════════════════════
  'imf': {
    text: 'International Monetary Fund — a 190-country body in Washington that monitors the global financial system, lends to countries in balance-of-payments crises, and publishes the World Economic Outlook.',
    source: 'imf.org'
  },
  'world-bank': {
    text: 'A multilateral development bank in Washington that lends to developing countries for long-term projects (infrastructure, health, education). Publishes the World Development Indicators — the largest cross-country statistical database.',
    source: 'worldbank.org'
  },
  'oecd': {
    text: 'Organisation for Economic Co-operation and Development — 38 mostly-rich-country club headquartered in Paris. Publishes comparative statistics on economies, education, taxes, and social spending.',
    source: 'oecd.org'
  },
  'bis': {
    text: 'Bank for International Settlements — Basel-based "central bank for central banks". Sets the Basel capital rules that govern how much equity banks must hold against risky assets.',
    source: 'bis.org'
  },
  'wgi': {
    text: 'Worldwide Governance Indicators — six annually-updated scores from the World Bank: Voice & Accountability, Political Stability, Government Effectiveness, Regulatory Quality, Rule of Law, Control of Corruption. Each is on a −2.5 to +2.5 scale.',
    source: 'Kaufmann, Kraay & Mastruzzi (2010)'
  },
  'wdi': {
    text: 'World Development Indicators — the World Bank\'s big cross-country statistical database, ~1,400 indicators for 217 economies, going back decades. The default source for GDP, FDI, population, and most macro time series.',
    source: 'World Bank Open Data'
  },
  'hdi': {
    text: 'Human Development Index — a UN composite of life expectancy, education, and income per capita, scaled to 0–1. Created by Mahbub ul Haq with Amartya Sen in 1990 as a counterweight to GDP-only thinking.',
    source: 'UNDP Human Development Report'
  },
  'rule-of-law': {
    text: 'A World Bank governance score (−2.5 to +2.5) measuring perceptions of contract enforcement, property rights, the police and courts, and the chance of crime or violence. One of the strongest single predictors of sovereign ratings.',
    source: 'World Bank, Worldwide Governance Indicators'
  },
  'brics': {
    text: 'Originally Brazil, Russia, India, China, South Africa — coined by Goldman Sachs in 2001 as the largest emerging economies. The expanded "BRICS+" added Iran, Egypt, UAE, Ethiopia, Saudi Arabia, Indonesia from 2024.',
    source: 'BRICS Information Portal'
  },
  'eu': {
    text: 'European Union — 27 member states with a customs union, a single market for goods/services/capital/labour, and (for 20 of them) a common currency, the euro.',
    source: 'european-union.europa.eu'
  },
  'eurozone': {
    text: 'The 20 EU countries that share the euro as their currency. Members give up independent monetary policy in exchange for trade and price-stability benefits — see the 2010–12 crisis for the costs.',
    source: 'European Central Bank'
  },
  'asean': {
    text: 'Association of Southeast Asian Nations — 10 countries from Brunei and Indonesia to Vietnam. Combined economy ≈ $4T (2024); deepening trade integration but no monetary union.',
    source: 'asean.org'
  },
  'g7': {
    text: 'Group of Seven — Canada, France, Germany, Italy, Japan, UK, US. Informal forum of large advanced economies that meets annually at heads-of-state level.',
    source: 'g7germany.de'
  },
  'g20': {
    text: 'Group of Twenty — 19 countries plus the EU and (since 2023) the African Union. Created in 1999, elevated to leaders\' level in 2008 to coordinate the response to the global financial crisis.',
    source: 'g20.org'
  },
  'gcc': {
    text: 'Gulf Cooperation Council — Bahrain, Kuwait, Oman, Qatar, Saudi Arabia, UAE. Oil-exporting Arab monarchies with a customs union and a common market in services and capital.',
    source: 'gcc-sg.org'
  },
  'sids': {
    text: 'Small Island Developing States — UN category of ~40 small island countries facing shared challenges: limited resources, exposure to climate change, dependence on imports and tourism.',
    source: 'sids2024.un.org'
  },
  'ldcs': {
    text: 'Least Developed Countries — UN category, ~45 economies, characterised by low income, weak human assets, and high economic vulnerability. Eligible for special trade preferences and concessional lending.',
    source: 'UN OHRLLS'
  },
  'mercosur': {
    text: 'Mercado Común del Sur — South American customs union: Argentina, Brazil, Paraguay, Uruguay, plus Bolivia and (suspended) Venezuela. Founded 1991.',
    source: 'mercosur.int'
  },
  'nato': {
    text: 'North Atlantic Treaty Organisation — 32-country military alliance built around the Article 5 mutual-defence clause. Founded 1949; expanded eastward post-1999; added Finland (2023) and Sweden (2024) after Russia\'s invasion of Ukraine.',
    source: 'nato.int'
  },
  'cis': {
    text: 'Commonwealth of Independent States — loose grouping of 9 post-Soviet states (Russia plus most Central Asian republics, Belarus, Armenia, Moldova). Reduced relevance since Ukraine and Georgia withdrew.',
    source: 'cis.minsk.by'
  },
  'paris-club': {
    text: 'An informal group of (mostly Western) creditor governments that coordinate debt restructurings for sovereign borrowers. Decisions are by consensus and implemented bilaterally.',
    source: 'clubdeparis.org'
  },
  'hipc': {
    text: 'Heavily Indebted Poor Countries Initiative — IMF/World Bank programme launched 1996 to write off debt for the poorest, most indebted countries in exchange for poverty-reduction reforms. 37 countries reached completion.',
    source: 'IMF Factsheet on HIPC'
  },

  // ═════════ DATA-VIZ TERMINOLOGY ════════════════════════════════════
  'heatmap': {
    text: 'A grid where each cell is coloured by the value it represents — typically warm colours for high values, cool for low. Lets you eyeball patterns across two dimensions (here: country × year) at a glance.',
    source: 'Wikipedia: Heat map'
  },
  'choropleth': {
    text: 'A map where each region is shaded by the value of some statistic (e.g. GDP per capita). The classic election-map style.',
    source: 'Wikipedia: Choropleth map'
  },
  'scatter-plot': {
    text: 'A chart of dots where each dot\'s x and y position represent two measurements on the same observation. Used to spot relationships between variables.',
    source: 'Wikipedia: Scatter plot'
  },

  // ═════════ LEGACY / REL-RATING VARIANTS (kept for back-compat) ═════
  'rel_eq':       { text: 'A country\'s score minus the simple average across all reporting countries that year.', source: 'De, Mohapatra & Ratha (2020)' },
  'rel_gdp':      { text: 'A country\'s score minus a GDP-weighted world average. Big economies pull the benchmark.', source: 'De, Mohapatra & Ratha (2020)' },
  'rel_gdp2008':  { text: 'GDP-weighted relativization with 2008 GDP shares frozen as weights, so the benchmark doesn\'t drift with changing economic mass.', source: 'Basu, De, Ratha & Timmer (2013)' },
  'rel_pop':      { text: 'Population-weighted version: the benchmark is a population-weighted average. Big-population countries dominate.', source: 'De, Mohapatra & Ratha (2020)' },
  'rel_median':   { text: 'Median-anchored: the benchmark is the within-year median, not the mean. Robust to outliers.', source: 'De, Mohapatra & Ratha (2020)' },
  'z_eq':         { text: 'Score minus equal-weighted mean, divided by the standard deviation. Expresses deviation in units of cross-country spread.', source: 'De, Mohapatra & Ratha (2020)' },
  'z_gdp':        { text: 'Score minus GDP-weighted mean, divided by GDP-weighted standard deviation. Bigger-economy bias.', source: 'De, Mohapatra & Ratha (2020)' },
  'pct_rank':     { text: 'Within-year percentile rank, scaled 0 to 1. Doesn\'t depend on the underlying scale.', source: 'De, Mohapatra & Ratha (2020)' },
  'norm_max':     { text: 'Score divided by the year\'s maximum. Top country scores 1.0; everyone else is a fraction of the leader.', source: 'De, Mohapatra & Ratha (2020)' },
  'norm_min':     { text: 'Min-max normalisation: (score − min) / (max − min). Top country = 1, bottom = 0.', source: 'Wikipedia: Feature scaling' }
};

/* ─────────────────────────────────────────────────────────────────────
   Alias map: surface text → key in TIPS.
   Keys are lower-case; matching is case-insensitive on whole words.
   shared.js scans body text for any alias and wraps the first occurrence
   per page (to avoid every paragraph turning into a forest of underlines).
   Hyphenated and plural forms are listed explicitly so plain-string
   matching works without stemming.
   ───────────────────────────────────────────────────────────────────── */
window.TIPS_ALIASES = {
  // Credit-rating basics
  'sovereign': 'sovereign', 'sovereigns': 'sovereign',
  'credit rating': 'credit-rating', 'credit ratings': 'credit-rating',
  'rating agency': 'rating-agency', 'rating agencies': 'rating-agency',
  'rating agencies': 'rating-agency',
  'notch': 'notch', 'notches': 'notch',
  'outlook': 'outlook',
  'upgrade': 'upgrade', 'upgrades': 'upgrade', 'upgraded': 'upgrade', 'upgrading': 'upgrade',
  'downgrade': 'downgrade', 'downgrades': 'downgrade', 'downgraded': 'downgrade', 'downgrading': 'downgrade',
  'default': 'default', 'defaults': 'default', 'defaulted': 'default',
  'investment grade': 'investment-grade', 'investment-grade': 'investment-grade',
  'speculative grade': 'speculative-grade', 'speculative-grade': 'speculative-grade',
  'junk bond': 'speculative-grade', 'junk bonds': 'speculative-grade',
  'composite score': 'composite-score', 'composite scores': 'composite-score',
  'basu mapping': 'basu-mapping',
  'basis points': 'basis-points', 'basis point': 'basis-points',
  'spread': 'spread', 'spreads': 'spread',

  // Stats
  'mean': 'mean',
  'median': 'median', 'medians': 'median',
  'percentile': 'percentile', 'percentiles': 'percentile',
  'standard deviation': 'standard-deviation',
  'variance': 'variance',
  'distribution': 'distribution', 'distributions': 'distribution',
  'normal distribution': 'normal-distribution', 'bell curve': 'normal-distribution',
  'cdf': 'cdf', 'cumulative distribution': 'cdf',
  'z-score': 'z-score', 'z scores': 'z-score', 'z score': 'z-score',
  'pearson correlation': 'pearson-r', 'pearson coefficient': 'pearson-r',
  'spearman correlation': 'spearman-rho', 'spearman correlations': 'spearman-rho',
  'spearman rank': 'spearman-rho',
  'correlation': 'correlation', 'correlations': 'correlation',
  'monotonic': 'monotonic',
  'rmse': 'rmse',
  'p-value': 'p-value', 'p value': 'p-value', 'p values': 'p-value',
  'statistical significance': 'significance', 'statistically significant': 'significance',
  'confidence interval': 'confidence-interval', 'confidence intervals': 'confidence-interval',
  'outlier': 'outlier', 'outliers': 'outlier',

  // Econometrics
  'regression': 'regression', 'regressions': 'regression',
  'coefficient': 'beta', 'coefficients': 'beta',
  'ols': 'ols', 'ordinary least squares': 'ols',
  'pooled ols': 'pooled-ols', 'pooled-ols': 'pooled-ols',
  'panel data': 'panel-data',
  'fixed effects': 'fixed-effects', 'fixed-effects': 'fixed-effects', 'fixed effect': 'fixed-effects',
  'random effects': 'random-effects', 'random-effects': 'random-effects',
  'within-r²': 'within-r2', 'within r²': 'within-r2', 'within-r2': 'within-r2',
  'r-squared': 'r-squared', 'r²': 'r-squared',
  'cluster-robust': 'cluster-se', 'clustered standard errors': 'cluster-se',
  'cluster-robust standard errors': 'cluster-se',
  'endogeneity': 'endogeneity', 'endogenous': 'endogeneity',
  'gmm': 'gmm', 'arellano-bond': 'gmm',
  'ordered logit': 'ordered-logit', 'ordered-logit': 'ordered-logit',
  'ordered probit': 'ordered-probit', 'ordered-probit': 'ordered-probit',
  'instrumental variable': 'instrumental-variable', 'instrumental variables': 'instrumental-variable',
  'mean reversion': 'mean-reversion', 'mean-reverting': 'mean-reversion',

  // Inequality
  'gini coefficient': 'gini-coefficient', 'gini': 'gini-coefficient',
  'lorenz curve': 'lorenz-curve', 'lorenz': 'lorenz-curve',
  'iqr': 'iqr', 'interquartile range': 'iqr',

  // Macro/finance
  'gdp': 'gdp',
  'gdp per capita': 'gdp-per-capita', 'gdp-per-capita': 'gdp-per-capita',
  'gdppc': 'gdp-per-capita', 'log gdppc': 'gdp-per-capita',
  'fdi': 'fdi', 'foreign direct investment': 'fdi',
  'inflation': 'inflation',
  'debt-to-gdp': 'debt-to-gdp', 'debt to gdp': 'debt-to-gdp', 'debt/gdp': 'debt-to-gdp',
  'current account': 'current-account',

  // Project-specific
  'leave-one-out': 'loo-mean', 'leave one out': 'loo-mean', 'loo mean': 'loo-mean',
  'cris': 'cris',
  'rrr': 'rrr', 'relative risk rating': 'rrr',
  'shadow rating': 'shadow-rating', 'shadow ratings': 'shadow-rating',
  'haversine': 'haversine', 'great-circle': 'haversine', 'great circle': 'haversine',
  'method a': 'method-a', 'method b': 'method-b', 'method c': 'method-c', 'method d': 'method-d',
  'random forest': 'random-forest', 'random forests': 'random-forest',
  'bayesian shrinkage': 'bayesian-shrinkage', 'shrinkage estimator': 'bayesian-shrinkage',
  'james-stein': 'james-stein', 'james stein': 'james-stein',

  // Institutions
  'imf': 'imf', 'international monetary fund': 'imf',
  'world bank': 'world-bank',
  'oecd': 'oecd',
  'bis': 'bis', 'bank for international settlements': 'bis',
  'wgi': 'wgi', 'worldwide governance indicators': 'wgi',
  'wdi': 'wdi', 'world development indicators': 'wdi',
  'hdi': 'hdi', 'human development index': 'hdi',
  'rule of law': 'rule-of-law', 'rule-of-law': 'rule-of-law',
  'brics': 'brics', 'brics+': 'brics',
  'eu': 'eu', 'european union': 'eu',
  'eurozone': 'eurozone',
  'asean': 'asean',
  'g7': 'g7',
  'g20': 'g20',
  'gcc': 'gcc', 'gulf cooperation council': 'gcc',
  'sids': 'sids',
  'ldcs': 'ldcs', 'least developed countries': 'ldcs',
  'mercosur': 'mercosur',
  'nato': 'nato',
  'cis': 'cis',
  'paris club': 'paris-club',
  'hipc': 'hipc',

  // Viz
  'heatmap': 'heatmap', 'heat map': 'heatmap',
  'choropleth': 'choropleth',
  'scatter plot': 'scatter-plot', 'scatterplot': 'scatter-plot', 'scatter': 'scatter-plot'
};
