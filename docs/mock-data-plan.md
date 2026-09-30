# Mock data plan (DRAFT v0)

How we build a synthetic KBC customer base that looks and behaves like the real
one, so the engine and demo are believable. **Nothing here is generated yet.**
The schema contract lives in [`data/schema.sql`](../data/schema.sql).

## 1. What we know about KBC's customers (research)

| Fact | Value | Source |
|---|---|---|
| Customers in scope of the challenge | 2,300,000+ | Hackathon participants guide |
| KBC Group clients in Belgium (bank + insurance) | ~4M | KBC annual report 2025 |
| Active KBC Mobile users | 2.5M+ | KBC newsroom (Kate, 5 years) |
| Kate (AI assistant) proactive situations in BE | 140+ | KBC newsroom |
| Brands | KBC (Flanders), CBC (Wallonia), KBC Brussels | kbc.com |
| Customers with bank + insurance products | ~76% | KBC annual report 2025 |
| Median gross monthly wage (full-time) | €3,728; P10 €2,303; P90 €5,922 | Statbel |
| Average household consumption (2024) | €44k/yr: housing 31%, food 14%, transport 12% | Statbel HBS 2024 |
| Electronic payments (Bancontact + Payconiq) | ~2.5B/yr (2025) | Bancontact |
| Physical purchases by method | card 53%, cash 39%, apps 3% | pay.com / NBB |
| Income inequality (Gini) | 24.6 (low) | Statbel SILC |

What this means for the mock:

- **Mostly Flemish, Dutch-speaking.** KBC's core market is Flanders. Rough split: ~80% Flanders / ~10% Brussels / ~10% Wallonia (CBC). Language follows region. *(Estimate: confirm if we find better numbers.)*
- **Age mirrors the Belgian adult population**, with a slight tilt to 25–65 because we model app-active customers. Include students (18–24) and retirees (65+). Retirees matter because pension income looks different from salary.
- **Income is compressed** (Belgium has a low Gini). Use a log-normal fitted to the Statbel P10/P50/P90, convert gross to net (~60–65% for employees), and add benefits as separate income streams.
- **Belgian money patterns to reproduce**, because they make the demo feel real and they are real signals:
  - Salary on the last working day of the month (or 1st). Holiday pay (*vakantiegeld*) in May/June, 13th month (*eindejaarspremie*) in December.
  - Replacement income: unemployment from **RVA/ONEM** paid through a union fund (ACV/CSC, ABVV/FGTB, ACLVB, HVW/CAPAC). Sickness benefit via the *mutualiteit*. Child benefit (*Groeipakket* in Flanders). Pension from the **Federale Pensioendienst**. **The switch from salary to RVA/mutualiteit payments is the clearest "rough patch" signal we can plant.**
  - Direct debits: mortgage or rent, energy (Engie, Luminus, TotalEnergies, Mega), telecom (Proximus, Telenet, Orange, and cheap options like Mobile Vikings and Digi), KBC insurance premiums, *mutualiteit* fee.
  - Card spend: supermarkets (Colruyt, Delhaize, Aldi, Lidl, Carrefour, Albert Heijn), fuel, pharmacy, restaurants, online (bol.com, Zalando, Amazon), streaming.
  - Structured communication `+++xxx/xxxx/xxxxx+++` on bill payments. SEPA instant transfers. Payconiq/Wero-style mobile payments.
- **Cheaper-alternative pairs** need real price data in `merchant_offers` (streaming tiers, mobile plans, energy contracts, supermarket price tiers). This is the fuel for the Spotify → cheaper example.

## 2. Volume

| Entity | Target at full scale | Notes |
|---|---|---|
| customers | 2.3M | matches the challenge number |
| accounts | ~4.5M | current + savings for most, credit card for ~35% |
| cards | ~3.5M | |
| transactions | **~1B / year** | ~22 card + ~10 account movements per customer per month |

One billion rows is fine for DuckDB but heavy for laptops: roughly 20–30 GB of Parquet
for one year. So we generate in tiers from the **same seeded code**:

| Tier | Customers | History | Use |
|---|---|---|---|
| `dev` | 10k | 24 months | committed or instantly regenerable; what everyone builds against |
| `demo` | 250k | 24 months | demo machine; "real-looking" aggregates |
| `full` | 2.3M | 24 months | scale proof (~1.8B txns); generated on Google Cloud or a beefy laptop |

## 3. Generation approach (proposal)

**Persona + event simulation, not uniform random.**

1. **Population.** Sample each customer's demographics (region → language → age → household → employment → income) from the marginals above. Use conditional sampling so a 22-year-old student does not own a house with a mortgage.
2. **Persona.** Assign an archetype (student, young professional, family with mortgage, single parent renter, retiree, self-employed, gig worker, affluent). The persona sets which products they hold, which merchants they use, how often, and how much.
3. **Recurring skeleton.** Lay down fixed monthly flows: income, rent or mortgage, utilities, telecom, insurance, subscriptions, savings transfers.
4. **Stochastic spend.** Add card spend per category with Poisson counts and log-normal amounts, with weekday and seasonal shape (December up, summer holidays, back-to-school in late August).
5. **Life events.** Inject events for ~5–10% of customers (job loss, income drop, divorce, new baby, illness, rent increase, overspending spiral, BNPL stacking, gambling increase). Each event *changes the downstream generator*: salary stops and RVA starts, discretionary spend shrinks with a lag, overdraft usage rises, savings drain. Write each event to `sim_life_events` as ground truth.
6. **Ledger pass.** Sort per account, compute `balance_after`, and apply overdraft and decline rules (spending past the limit becomes `declined`).
7. **Hero customers.** Hand-script 5–10 named demo customers with clean, story-like timelines, for example "Sarah, 34, Ghent, laid off in March". The live demo walks through them.

**Tech.** Python orchestration with vectorised NumPy/Polars, or pure DuckDB SQL
(`generate_series` + joins) for the transaction fan-out. Output is Parquet partitioned
by `year/month`, plus a `bank.duckdb` file with views over the Parquet. Everything is
seeded, so the same seed gives the same data on every machine.

## 4. Decisions

1. The engine detects from **transactions only**. Profile data is for display and generation.
2. **Joint accounts are in scope** (`account_holders` table).
3. **24 months of history**, for all tiers including `full` (2.3M customers → ~1.8B transactions).
4. Live transaction replay will be a separate engine later. For now we only produce the data.

Still open: where `full` is generated and hosted (Google Cloud credits vs a local machine).

## Sources

- [KBC Annual Report 2025](https://vpr.hkma.gov.hk/statics/assets/doc/100194/ar_25/ar_25_eng.pdf)
- [Kate: five years and five milestones (KBC)](https://newsroom.kbc.com/kate-five-years-and-five-milestones)
- [Statbel: overview of Belgian wages](https://statbel.fgov.be/en/themes/work-training/wages-and-labourcost/overview-belgian-wages-and-salaries)
- [Statbel: housing share of household budget (HBS 2024)](https://statbel.fgov.be/en/news/housing-taking-ever-increasing-share-household-budget)
- [Statbel SILC 2024 analysis](https://socialsecurity.belgium.be/sites/default/files/content/docs/en/publications/silc/silc-analysis-social-situation-and-protection-belgium-2024-results-en.pdf)
- [Bancontact: payments up 54.5% in five years](https://www.bancontact.com/en/news/payments-with-bancontact-and-payconiq-increase-by-54-5-in-five-years)
- [Top payment methods in Belgium](https://pay.com/blog/top-payment-methods-in-belgium)
