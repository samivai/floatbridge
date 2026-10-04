# FloatBridge demonstration script

Suggested duration: 2-3 minutes. Adjust to the organizers' announced limit. Record the actual app, not slides pretending to be functionality.

## 0:00-0:25 — the problem

Screen: Network operations, Ordinary weekday, default settings.

Say: "A mobile wallet agent needs two kinds of liquidity. Physical cash lets a customer withdraw. Electronic balance lets a customer deposit. Having enough total money does not guarantee the agent can serve the next customer. FloatBridge helps an operator anticipate that imbalance and plan an exchange before service fails."

## 0:25-0:55 — show real AI

Select Market Road. Show the forecast bars and proposed physical-cash exchange.

Say: "This is a trained ridge-regression model, running directly in the browser. It predicts hourly cash-in and cash-out amounts using time patterns, agent characteristics and known payday information. All data is synthetic. The planner is a separate constrained heuristic; the model does not move money."

## 0:55-1:25 — approve and demonstrate

Show the five proposed exchanges and their reasons. Click Approve & replay.

Say: "The operator reviews the proposed exchanges. Each exchange respects balances, a finite hub and our resource caps, and is rechecked when it arrives. In this example, the same 432 attempted requests produce 19 failures without replenishment and four with the approved plan. This uses five visits at an assumed total cost of 750 taka. This is a demonstration scenario, not a real-world impact claim."

## 1:25-1:45 — show a failure control

Check Simulate stale balances. Show paused state and disabled approval. Uncheck it. Optionally choose Unexpected demand shock and explain it is not provided to the model in advance.

Say: "We stop recommendations when balances are stale. Changing conditions resets approval. Unexpected demand can still cause failure: the system makes point forecasts, not guarantees."

## 1:45-2:20 — show honest evidence

Open Evidence lab.

Say: "Our frozen evaluation uses twelve independent synthetic scenarios and identical resource caps. The learned policy has twelve failures out of 5,160 requests. The same planner with a seasonal forecast has sixteen, but our learned policy uses four extra visits. We report that cost tradeoff. The forecast error is 25.8 percent, versus 26.3 percent for the seasonal baseline. This is a modest AI improvement on top of a useful planning workflow."

## 2:20-2:40 — product path

Open Inside the model; briefly show Export evidence.

Say: "The prototype runs without paid APIs. Forecasting, planning and accounting are separate, so we can adapt to new requirements. The next step would be governed historical validation with reliable balances and attempted-demand data, followed by shadow mode. No production access or live financial execution is claimed."

Finish by displaying the real public repository and deployment links once available. Do not read placeholder links.

## Five-minute technical rehearsal

- Member 1 explains the two-balance accounting and delayed matched exchange.
- Member 2 explains ridge regression, features, train/validation/test split and WAPE.
- Member 3 explains the baselines, actual costs, synthetic-data limitations and future validation.
- Every member knows how to start the app, approve a plan, change a scenario and explain one failure case.
