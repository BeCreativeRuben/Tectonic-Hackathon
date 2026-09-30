# CLAUDE.md

Monorepo for our **Tectonic Hackathon** entry (Belgium, 14-person team), **KBC challenge**.

## ⚠️ Read first: voice input

Some teammates dictate prompts by voice. Expect transcription errors: misspelled names,
homophones, run-on sentences, half-finished thoughts.

- If intent is unclear or two readings lead to different work, **ask before building**. Do not guess on anything that changes the schema, shared contracts, or another teammate's area.
- Common mix-up: the bank is **KBC** (Belgian bank-insurer), not "KCB" (a Kenyan bank). Treat "KCB", "KBC bank", "Kay-bee-see" and similar as KBC.
- Echo back your understanding in one or two lines before large changes.

## The challenge (from the organisers)

> Imagine a future where KBC perfectly understands what customers need and responds at
> exactly the right moment … build a proof of concept for a new way in which KBC
> understands, supports, and guides its customers, delivered to 2,300,000+ customers at scale.

They explicitly want **a vision plus a scalable personalisation PoC, not just another feature.**

**Judging:** creativity, technical ability (does it work?), fit to the challenge, and **security (10%, via an Aikido AI code audit of this repo)**.
**Submission:** short description, demo video under 3 minutes, public GitHub repo with a README (what it is, how to run it, what's unfinished), and Aikido before/after screenshots.
**Partner credits:** ElevenLabs (voice), Cursor, Google Cloud (1 week).

## Our idea

The bank already sees everything a customer does with money, so it can **notice when
someone is going through a rough time and step in early**, and **guide everyday spending
toward their goals**.

1. **Detect rough patches from transaction patterns.** Examples: salary stops and RVA/ONEM (unemployment) payments start, income drops, balance trends toward overdraft, missed loan instalments, a spending spiral, BNPL stacking, a new baby, a divorce.
2. **Respond with financial planning help**, picking the channel to fit the customer and the severity:
   - an AI agent conversation (chat or **voice call** via ElevenLabs)
   - a written personal report or plan
   - escalation to a **human financial advisor**
3. **In-the-moment spending guidance:**
   - **soft-block** a transaction that would break the customer's budget plan (the customer can override)
   - **cheaper alternatives**, e.g. "You pay €X for Spotify; in your region Y offers comparable quality for less." The same works for mobile plans, energy, and supermarkets.
4. **Scale:** it has to plausibly work for 2.3M customers. Signals are batch/stream analytics; the expensive stuff (LLM, voice, humans) is reserved for the customers who need it.

## Repo layout (proposed, still evolving)

```
data/        schema.sql (the shared contract) + synthetic data generator
docs/        research and design notes (see docs/mock-data-plan.md)
engine/      signal detection + intervention logic            (TBD by team)
frontend/    customer app / advisor dashboard demo            (TBD by team)
```

## Data layer

- **DuckDB, local-first.** Synthetic data only. The schema is in `data/schema.sql`; `data/README.md` has the table map and gotchas.
- **Decisions so far:** the engine detects from **transactions only** (no profile shortcuts); **joint accounts are in scope** (`account_holders`); target is **2.3M customers × 24 months** of history; live transaction replay will be a separate engine later.
- `data/schema.sql` is the **contract between teams**. Change it deliberately: say so in the PR and tell the people building on it.
- **Money** is `DECIMAL`, in EUR, signed from the account's perspective (negative = out).
- **`transactions` is one unified ledger** (cards, transfers, direct debits, ATM, fees). `channel` tells you which kind.
- **`sim_*` tables are generator ground truth** (personas, injected life events). The engine **must not** read them for detection. Use them only to evaluate detection and to pick demo customers.
- `budgets`, `signals`, `interventions` are **app state**, written by the engine or app.
- Data tiers: `dev` (10k customers), `demo` (250k), `full` (2.3M), all with 24 months of history. Same seeded generator, different size. Large data files (`*.duckdb`, `*.parquet`) are **never committed**.
- Mock data should mirror KBC's real customer base (mostly Flemish, Belgian salary and benefit patterns, Belgian merchants). See `docs/mock-data-plan.md`.

## Security (it's graded)

Aikido audits this repo for business-logic flaws, IDOR, authentication, and authorization.

- Never commit secrets or API keys. Use `.env` (git-ignored) and commit a `.env.example`.
- Any API that returns customer data must scope it to the authenticated customer or advisor. Never trust a `customer_id` coming from the client.
- A soft-block override and advisor actions must check who is acting.
- Synthetic data only. No real personal data.

## Working agreements

- 14 people in one repo: keep changes scoped to your area and prefer small PRs.
- Don't commit or push unless asked.
- The time limit is real. Prefer something that works end-to-end for the demo over perfect architecture.
