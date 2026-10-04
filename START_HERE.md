# FloatBridge: emergency submission guide

The working prototype is ready locally. **The public repository, live deployment URL and your recorded video are still required.** Do not submit a localhost URL. No official contest submission has been made for you.

## Open it now

Double-click `index.html`. It works without installation, an API key or internet after the files are available. Or run `python -m http.server 8000` from this folder and open `http://localhost:8000`.

## Three teammates, three parallel jobs

**Member 1: repository and hosting (start immediately).** Publish the existing local Git repository to a public GitHub repository while preserving its real commit history. Use GitHub Desktop's Add Local Repository and Publish Repository, or the commands in README. The local author label explicitly says AI-assisted prototype. Do not backdate or impersonate earlier development. In GitHub Settings > Pages, publish the main branch from /(root). Replace README's live-link placeholder with the verified HTTPS URL. Open the site signed out. GitHub Pages supports public repositories on GitHub Free.

**Member 2: demonstration video.** Follow DEMO_SCRIPT.md. Record the actual working app for about 2-3 minutes, subject to the organizer's limit. Show approval changing the result, stale-data rejection and the honest seasonal comparison. Use your own voice and make sure every member can explain the model. Upload using the required official method or a judge-accessible video link.

**Member 3: report and submission.** Review PROJECT_REPORT.md / Project_Report.pdf; add team identity if the form requires it; verify claims against evaluation.json. Submit report, video, public repository, live URL and any other requested materials through the official form. Save the receipt. Check the organizer's deadline rather than guessing from the festival date.

## Rehearse these five facts

1. Cash-in consumes agent e-float and increases physical cash. Cash-out does the opposite.
2. The model is real trained ridge regression over 14 features, not an LLM or a hardcoded forecast.
3. Training uses synthetic days 0-59, validation 60-74, and forecast testing 75-89.
4. The planner is a greedy heuristic with resource caps, finite hub inventory and delayed delivery; it is not an exact optimizer.
5. The learned policy has 12 failed requests versus 16 for a seasonal forecast with the same planner across 5,160 requests, but it uses four more visits. These are synthetic results, not production savings.

## Final checklist

- Public repository opens without your login, includes meaningful commits and all source files.
- Live app opens over HTTPS on another device; it is not merely a screenshot.
- README contains the real deployment URL, exact run/test commands and honest limitations.
- Report and video match the submitted build; no unsupported features or invented impact.
- Initial code is pushed and all required links/files reach the official channel before the deadline.
- Keep prompt history and disclose AI assistance if requested. Do not share another team's work or credentials.

## If you have time left

Understand and rehearse the existing product. Adjust design text or add your team details. Do not replace the model, add live payments, or start a second project shortly before submission. Keep time for the final-day update phase on 7 October.
