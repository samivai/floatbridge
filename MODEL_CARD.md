# FloatBridge model and data card

## Intended use

Demonstrate learned demand forecasting within a synthetic mobile-financial-services agent planning workflow. Not a production liquidity model, financial adviser, credit model or live dispatch system.

## Data generation

`train.py` uses NumPy's seeded generator (20261004). Twelve agents have synthetic names, three demand archetypes, scale factors and opening cash/e-float allocations. There are no real customer identifiers, actual agent locations or financial records.

Ninety days x twelve agents x ten operating hours produce 10,800 rows with two targets: hourly cash-in amount and hourly cash-out amount in BDT. Gaussian-shaped within-day demand patterns interact with agent archetype, scale, weekend and known payday conditions; multiplicative lognormal noise adds variability. These distributions are assumptions, not estimates of upay behavior. Daily cash availability does not censor training demand: attempted demand is assumed known in the simulation.

Four demonstration scenarios and twelve separate evaluation seeds generate transaction-level requests by dividing hourly demand into three random shares per direction. Amounts are rounded to BDT 10; zero-amount requests are ignored in the metric denominator. This explains denominators slightly below 432 per scenario. The model cannot see future sampled demand or surprise shocks.

## Features and model

Ridge regression fits `log(1 + amount)` using fourteen features: intercept; first and second hourly sine/cosine harmonics; weekend; known payday; cash-out and balanced archetype indicators; their first-harmonic interactions; and log scale. There are no future realized transaction totals in features.

Solve `(X'X + lambda I) B = X' log(1 + Y)` with an unpenalized intercept. Select lambda from 0.01, 0.1, 1 and 10 using validation WAPE. Apply a training-only residual smearing correction when converting predictions back to amount space. `model.json` records coefficients, lambda and correction. JavaScript implements the same arithmetic for in-browser inference.

The features are interpretable, but a coefficient is not a causal effect. No calibrated intervals, shortage probabilities, SHAP values or uncertainty-aware optimizer are implemented in this emergency version.

## Splits and evaluation

- Train: days 0-59, 7,200 rows.
- Validation: days 60-74, 1,800 rows, used to choose regularization.
- Forecast test: days 75-89, 1,800 rows, not used for fitting or lambda selection.
- Policy evaluation: seeds 8100-8111, with independently sampled requests; these use the same synthetic process and calendar range rather than a different real population.

Historical seasonal predictions average training amounts per agent/hour/weekend status. The same planner consumes seasonal and learned forecasts, which is the main comparison for model contribution. The fixed threshold is an additional simple baseline: if either opening balance is below 30% of total, target a 50/50 mix. That threshold is not optimized.

Learned test WAPE: 0.2579780599. Seasonal test WAPE: 0.2631824079. Learned mean absolute error: BDT 719.31. Seasonal mean absolute error: BDT 733.82. Small gains should not be overstated.

## Planning and simulation

The heuristic estimates cumulative net flows, computes a desired opening cash allocation, and prioritizes reserve shortfall. It proposes at most the visit cap and keeps total exchanged principal below the budget. Cash and e-float at the hub are finite. All deliveries share the selected lead time; no physical routing or simultaneous-visit staffing model is included.

The ledger rechecks feasibility at actual arrival and skips an invalid exchange. Deliveries occur before customer requests at the same minute, with stable sequence ordering within each event type. Principal cash-plus-e-float is conserved for each agent and the hub. Failed requests do not change balances. Fees and external shop cash are excluded. No retry migration to other agents is modeled.

## Group check

Across 5,160 attempted requests, the synthetic low-volume group has 1,287 requests; the standard group has 3,873. Learned policy failures: 0 and 12 respectively. Seasonal failures: 0 and 16. Static-threshold failures: 3 and 109. These are workload slices with different demand, not evidence of demographic fairness or equal access. There is no implemented minimum-coverage constraint.

## Reproducibility and limitations

Run `python train.py` and `node test.js`. Included artifacts eliminate runtime training dependencies. Review the accompanying runtime version file for exact training versions. Data and output can be fully inspected; all fixtures are public because they are synthetic.

No empirical customer interviews, production upay observations, real economic savings, causal business uplift, statistical significance, global novelty or guaranteed competition outcome is claimed. Security controls in this static app are demonstrations, not protection against a user editing their own browser. Future use requires authenticated services and operational authorization.
