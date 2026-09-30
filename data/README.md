# Data

Synthetic KBC customer data in DuckDB. `schema.sql` is the contract; column comments live there.
The generator is not built yet. See `../docs/mock-data-plan.md`.

## Table map

```
customers ─┬─< account_holders >─ accounts ─┬─< transactions >─ merchants ─< merchant_offers
           │                                 └─< cards
           ├─< loans, insurance_policies
           ├─< budgets, signals ─< interventions        (app state: engine/frontend write these)
           └── sim_customer_persona, sim_life_events    (ground truth: engine must NOT read)
categories: shared taxonomy for merchants, transactions, budgets
```

## Who uses what

| You're building | Read | Write |
|---|---|---|
| Engine (detection) | `transactions`, `accounts`, `account_holders`, `merchants`, `categories` | `signals` |
| Engine (actions) | the above + `merchant_offers`, `budgets` | `interventions` |
| Frontend / advisor UI | everything except `sim_*` | `budgets`, `interventions.status` |
| Evaluation / demo picking | `sim_*` vs `signals` | nothing |

The engine detects from **transactions only**. The profile fields in `customers` exist for
display and for the generator; don't use them as detection shortcuts.

## Gotchas

- `amount` is signed: negative is money out. Spend per category is `-SUM(amount) WHERE amount < 0`.
- Joint accounts: a customer's money is everything reachable via `account_holders`, not just `accounts.customer_id`.
- Credit cards are accounts (`account_type = 'credit_card'`). Their monthly settlement shows up as a `direct_debit` on the current account, so don't double-count spend: count card spend on the card account, and skip the settlement debit.
- Only `status = 'booked'` rows moved money. `declined` rows are still useful signals (e.g. insufficient funds).

## Quick start

```bash
uv run --with duckdb python -c "import duckdb; duckdb.connect('bank.duckdb').execute(open('data/schema.sql').read())"
```

`*.duckdb` and `*.parquet` are git-ignored. Don't commit data.
