# FloatBridge

**Keep cash-in and cash-out available.** An explainable, zero-API-cost AI prototype for agent liquidity planning, created for AI DEV FEST 2026, Track 05: Merchant & Agent Intelligence.

> Synthetic data only. No real upay data, live financial execution, official affiliation or production impact claim. Development was AI-assisted; the team must review, understand and explain the code.

## Live deployment

**REQUIRED BEFORE SUBMISSION: replace this line with your verified public deployment URL.** The project is deployment-ready but this repository does not claim an already-published site. A localhost URL is not a public deployment.

## Problem and solution

Agents need both physical cash for withdrawals and electronic balance for deposits. FloatBridge predicts six hours of hourly cash-in and cash-out demand, proposes constrained exchanges with a synthetic authorized hub, requires operator approval, and replays identical customer requests to expose service and cost tradeoffs.

## Implemented features

- Real trained ridge-regression demand model with 14 interpretable input features and chronological evaluation.
- 12 synthetic agents, four interactive scenarios, adjustable exchange cap, visit capacity and arrival delay.
- Matched cash/e-float exchanges, finite hub inventory, principal conservation and arrival-time feasibility checks.
- Approval/rejection, approval reset after configuration changes, and a stale-balance stop.
- Request-level simulation, before/after results, event audit trail and JSON evidence export.
- Frozen benchmark of static threshold, seasonal forecast plus planner, and learned forecast plus the same planner.
- Clear disclosure of actual visit/exchange usage, model errors and synthetic-data limitations.
- Responsive, dependency-free browser interface; no server inference, paid API or login required for the demo.

## Stack and requirements

Runtime: HTML, CSS and plain JavaScript in a modern browser. There is no build system, application backend, database or paid service.

Optional model reproduction: Python 3.10+ with NumPy (`requirements.txt`). Training was tested with the NumPy version recorded in MODEL_CARD.md. Optional automated engine tests: Node.js 18+. No GPU is needed.

## Installation and run

1. Clone or download the repository.
2. Open `index.html` directly in a modern browser. All data is in local `bundle.js`, so no fetch or server is required.
3. Alternatively, from the project folder run:

```sh
python -m http.server 8000
```

Open `http://localhost:8000`. Stop the server with Ctrl+C. No build command is necessary.

## Environment variables and configuration

No environment variables or API keys are required. Do not enter financial credentials. UI controls configure exchange budget, visit capacity, lead time and snapshot freshness. `engine.js` defines demo defaults: BDT 120,000 initial cash and e-float at the hub, BDT 3,000 reserve, BDT 60,000 per-scenario exchange cap, six visits and 60-minute arrival. A visit cost of BDT 150 is a disclosed simulation assumption.

## Reproduce training

```sh
python -m venv .venv
```

Activate the environment: Windows ` .venv\Scripts\activate `; macOS/Linux `source .venv/bin/activate`. Then:

```sh
python -m pip install -r requirements.txt
python train.py
```

This regenerates `model.json` and `bundle.js` from seed 20261004. Reload the page after regenerating. Numerical results may differ slightly across library versions; use the included trained artifacts for the submitted benchmark.

## Tests and verification

```sh
node test.js
```

This checks accounting, positivity, resource caps, reproducibility, approval behavior, duplicate delivery and timing, and writes `evaluation.json`.

Manual workflow: open Ordinary weekday, keep default settings, select an agent and inspect forecasts. Approve & replay: failed requests change from 19 to 4 in this demonstration scenario, with five completed visits. Switch on stale balances: recommendations stop and approval resets. Open Evidence lab to inspect the separate multi-seed benchmark. Export evidence downloads the current configuration, simulation, model metadata and frozen evaluation as JSON.

## Results and interpretation

The chronological forecast test has 1,800 agent-hour rows. Learned forecast WAPE is 25.80%; seasonal baseline WAPE is 26.32%. WAPE means total absolute error divided by total actual demand.

Across 12 separately seeded synthetic evaluation scenarios:

| Policy | Failed / attempted | Visits | Assumed visit cost | Exchanged principal |
|---|---:|---:|---:|---:|
| Static threshold | 112 / 5,160 | 48 | BDT 7,200 | BDT 415,200 |
| Seasonal + same planner | 16 / 5,160 | 64 | BDT 9,600 | BDT 720,000 |
| Learned forecast + planner | 12 / 5,160 | 68 | BDT 10,200 | BDT 718,800 |

Caps and demand are identical; actual costs differ. The learned policy prevents four additional failures versus seasonal forecasting at BDT 600 more assumed visit cost. That does not establish positive commercial ROI. Small counts and synthetic assumptions limit inference. The static 30%-balance threshold is a simple reference, not a claimed optimal rule. No hyperparameters were selected on the frozen evaluation outcomes.

## Publish free on GitHub Pages

The existing folder contains real local Git commits. Preserve them. Create an empty public repository in your own GitHub account (do not initialize a conflicting README), then from this folder use the repository's exact URL:

```sh
git branch -M main
git remote add origin YOUR_PUBLIC_REPOSITORY_URL
git push -u origin main
```

These are instructions, not evidence that publishing has occurred. Authenticate through your own GitHub account when prompted. Do not paste access tokens into the code or README. If the repository already contains work, do not force-push; integrate it carefully.

Repository Settings > Pages > Deploy from a branch > main > /(root) > Save. The root contains `index.html` and `.nojekyll`. Wait for successful deployment, open the resulting URL signed out, then paste it in the Live deployment section and push that change. GitHub Free supports Pages for public repositories; see [official Pages setup](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

## Files

- `index.html`, `style.css`, `app.js`: user interface.
- `engine.js`: model inference, planning, ledger replay and evaluation.
- `train.py`, `requirements.txt`: reproducible synthetic generation and model fitting.
- `bundle.js`, `model.json`: generated synthetic data and trained parameters.
- `test.js`, `evaluation.json`: automated checks and reproducible benchmark.
- `MODEL_CARD.md`, `PROJECT_REPORT.md`, `DEMO_SCRIPT.md`, `START_HERE.md`: technical, submission and rehearsal material.

## Limitations and responsible design

Point predictions are not calibrated confidence intervals. The planner is greedy, batch-based and uses a common lead time; it does not optimize routes or run a repeated real-time dispatch loop. It ignores fees on principal transfers and external shop cash flows. Synthetic attempted demand is observed; production completed transactions alone would miss turned-away customers. Synthetic low-volume comparisons are not a demographic fairness audit.

No real PII is present. Client-side approval is a demonstration, not production access control. Real integration needs provider-authorized APIs, authenticated roles, reconciled cash snapshots, operational permissions and security review. A future path is governed historical validation, shadow mode and then a controlled human-reviewed pilot; none is promised.

## Attribution and external resources

NumPy is the numerical dependency; its license and authorship remain with its maintainers. This project uses ridge regression, an established statistical method, and synthetic data generated by the included script. AI assistance was used for analysis, implementation, testing and documentation. No external trained model, paid inference API, production dataset or copied complete challenge solution is embedded.

The contest playbook explicitly lists agent liquidity as a Track 05 opportunity. [IFC's agent liquidity field note](https://documents1.worldbank.org/curated/en/794131592190426168/pdf/Digital-Financial-Services-and-the-Business-of-Managing-Cash-Using-Data-Driven-Insights-to-Address-the-Agent-Liquidity-Challenge.pdf) establishes related prior art. FloatBridge claims an implemented product combination, not invention of liquidity forecasting.
