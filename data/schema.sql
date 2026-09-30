-- =============================================================================
-- KBC mock bank: DuckDB schema (DRAFT v0, open for team review)
-- =============================================================================
-- Conventions
--   * All data is SYNTHETIC. No real customer data, ever.
--   * Money: DECIMAL(14,2) in EUR. Signed from the account's point of view:
--     negative = money out, positive = money in.
--   * IDs are BIGINT surrogate keys. Human-facing refs (IBAN, masked PAN) are separate columns.
--   * Timestamps are local Belgian time (Europe/Brussels), stored as TIMESTAMP.
--   * Tables prefixed `sim_` are GROUND TRUTH from the generator (personas, injected
--     life events). The engine must NOT read them for detection. They exist only to
--     evaluate the engine and to pick good demo customers.
--   * Tables in the "app state" section are written by the engine/app, not the generator.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Reference data
-- -----------------------------------------------------------------------------

-- Spending taxonomy. `budget_bucket` drives budgeting and soft-block logic.
CREATE TABLE categories (
    category_id     VARCHAR PRIMARY KEY,   -- e.g. 'groceries', 'streaming', 'salary'
    parent_id       VARCHAR,               -- e.g. 'streaming' -> 'subscriptions'
    label_en        VARCHAR NOT NULL,
    label_nl        VARCHAR,
    direction       VARCHAR NOT NULL,      -- 'in' | 'out' | 'both'
    budget_bucket   VARCHAR                -- 'essential' | 'discretionary' | 'savings' | 'income' | 'transfer'
);

CREATE TABLE merchants (
    merchant_id     BIGINT PRIMARY KEY,
    name            VARCHAR NOT NULL,      -- display name, e.g. 'Colruyt', 'Spotify'
    brand           VARCHAR,               -- parent brand when name is a specific store
    mcc             VARCHAR(4),            -- ISO 18245 merchant category code
    category_id     VARCHAR NOT NULL REFERENCES categories(category_id),
    price_tier      TINYINT,               -- 1 = budget .. 3 = premium, used for "cheaper alternative"
    is_online       BOOLEAN NOT NULL DEFAULT FALSE,
    country         VARCHAR(2) NOT NULL DEFAULT 'BE',
    postal_code     VARCHAR,               -- NULL for online merchants
    municipality    VARCHAR
);

-- Priced offers per merchant, so the engine can suggest a like-for-like cheaper option
-- (Spotify -> another streaming service, Proximus -> Mobile Vikings, Delhaize -> Colruyt/Aldi).
CREATE TABLE merchant_offers (
    offer_id        BIGINT PRIMARY KEY,
    merchant_id     BIGINT NOT NULL REFERENCES merchants(merchant_id),
    service_type    VARCHAR NOT NULL,      -- e.g. 'music_streaming', 'mobile_plan', 'energy', 'gym'
    plan_name       VARCHAR NOT NULL,      -- e.g. 'Premium Individual'
    monthly_price   DECIMAL(10,2) NOT NULL,
    quality_tier    TINYINT,               -- rough comparability score, 1..5
    valid_from      DATE,
    valid_to        DATE
);

-- -----------------------------------------------------------------------------
-- 2. Customers
-- -----------------------------------------------------------------------------

CREATE TABLE customers (
    customer_id         BIGINT PRIMARY KEY,
    first_name          VARCHAR NOT NULL,
    last_name           VARCHAR NOT NULL,
    gender              VARCHAR,                -- 'F' | 'M' | 'X'
    birth_date          DATE NOT NULL,
    language            VARCHAR(2) NOT NULL,    -- 'nl' | 'fr' | 'de' | 'en'
    email               VARCHAR,
    phone               VARCHAR,
    -- Location
    region              VARCHAR NOT NULL,       -- 'Flanders' | 'Brussels' | 'Wallonia'
    province            VARCHAR,
    postal_code         VARCHAR NOT NULL,
    municipality        VARCHAR NOT NULL,
    -- Relationship with the bank
    bank_brand          VARCHAR NOT NULL,       -- 'KBC' | 'CBC' | 'KBC Brussels'
    segment             VARCHAR NOT NULL,       -- 'retail' | 'private_banking' | 'self_employed'
    customer_since      DATE NOT NULL,
    uses_mobile_app     BOOLEAN NOT NULL,
    preferred_channel   VARCHAR,                -- 'app' | 'branch' | 'phone' | 'email'
    -- Socio-economic profile (what KYC / the bank plausibly knows)
    employment_status   VARCHAR NOT NULL,       -- 'employed' | 'self_employed' | 'unemployed' | 'student' | 'retired' | 'inactive'
    occupation          VARCHAR,
    employer_name       VARCHAR,
    declared_monthly_net_income DECIMAL(10,2),  -- at onboarding; may be stale on purpose
    marital_status      VARCHAR,                -- 'single' | 'married' | 'cohabiting' | 'divorced' | 'widowed'
    household_size      TINYINT,
    n_children          TINYINT,
    housing_status      VARCHAR,                -- 'owner_mortgage' | 'owner_outright' | 'renter' | 'with_parents' | 'social_housing'
    risk_profile        VARCHAR,                -- MiFID investor profile: 'defensive' .. 'dynamic', NULL if none
    created_at          TIMESTAMP NOT NULL
);

-- -----------------------------------------------------------------------------
-- 3. Products: accounts, cards, loans, insurance
-- -----------------------------------------------------------------------------

-- Every money-holding product is an account, including credit cards (their
-- statement balance is settled monthly by a direct debit from the current account).
CREATE TABLE accounts (
    account_id      BIGINT PRIMARY KEY,
    customer_id     BIGINT NOT NULL REFERENCES customers(customer_id),  -- primary holder; all holders in account_holders
    iban            VARCHAR NOT NULL UNIQUE, -- 'BE..' format, synthetic but checksum-valid
    account_type    VARCHAR NOT NULL,        -- 'current' | 'savings' | 'credit_card' | 'youth' | 'investment'
    product_name    VARCHAR NOT NULL,        -- e.g. 'KBC Plus Account', 'Start2Save'
    currency        VARCHAR(3) NOT NULL DEFAULT 'EUR',
    overdraft_limit DECIMAL(12,2) NOT NULL DEFAULT 0,  -- positive number; for credit cards = credit limit
    interest_rate   DECIMAL(6,4),
    opened_at       DATE NOT NULL,
    closed_at       DATE,
    status          VARCHAR NOT NULL         -- 'active' | 'closed' | 'blocked'
);

-- Who can use an account. Every account has one 'primary' row (= accounts.customer_id);
-- joint accounts (common for Belgian couples) add a 'joint' row per extra holder.
-- To get "all money a customer can see", join through this table, not accounts.customer_id.
CREATE TABLE account_holders (
    account_id      BIGINT NOT NULL REFERENCES accounts(account_id),
    customer_id     BIGINT NOT NULL REFERENCES customers(customer_id),
    role            VARCHAR NOT NULL,        -- 'primary' | 'joint' | 'guardian' (youth accounts)
    since           DATE NOT NULL,
    PRIMARY KEY (account_id, customer_id)
);

CREATE TABLE cards (
    card_id         BIGINT PRIMARY KEY,
    account_id      BIGINT NOT NULL REFERENCES accounts(account_id),
    customer_id     BIGINT NOT NULL REFERENCES customers(customer_id),
    card_type       VARCHAR NOT NULL,        -- 'debit' | 'credit'
    scheme          VARCHAR NOT NULL,        -- 'bancontact_maestro' | 'bancontact_debit_mastercard' | 'visa' | 'mastercard'
    masked_pan      VARCHAR NOT NULL,        -- e.g. '5413 **** **** 1234'
    issued_at       DATE NOT NULL,
    expires_at      DATE NOT NULL,
    status          VARCHAR NOT NULL         -- 'active' | 'blocked' | 'expired'
);

CREATE TABLE loans (
    loan_id             BIGINT PRIMARY KEY,
    customer_id         BIGINT NOT NULL REFERENCES customers(customer_id),
    repayment_account_id BIGINT NOT NULL REFERENCES accounts(account_id),
    loan_type           VARCHAR NOT NULL,    -- 'mortgage' | 'car' | 'personal' | 'renovation'
    principal           DECIMAL(14,2) NOT NULL,
    outstanding         DECIMAL(14,2) NOT NULL,
    interest_rate       DECIMAL(6,4) NOT NULL,
    monthly_installment DECIMAL(12,2) NOT NULL,
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    days_past_due       INTEGER NOT NULL DEFAULT 0,  -- as of snapshot date
    status              VARCHAR NOT NULL             -- 'active' | 'repaid' | 'in_arrears' | 'restructured'
);

-- KBC is a bank-insurer, so insurance premiums show up as direct debits too.
CREATE TABLE insurance_policies (
    policy_id       BIGINT PRIMARY KEY,
    customer_id     BIGINT NOT NULL REFERENCES customers(customer_id),
    policy_type     VARCHAR NOT NULL,        -- 'home' | 'car' | 'hospitalisation' | 'life' | 'travel' | 'family_liability'
    premium_amount  DECIMAL(10,2) NOT NULL,
    premium_frequency VARCHAR NOT NULL,      -- 'monthly' | 'quarterly' | 'yearly'
    start_date      DATE NOT NULL,
    end_date        DATE,
    status          VARCHAR NOT NULL         -- 'active' | 'cancelled' | 'lapsed'
);

-- -----------------------------------------------------------------------------
-- 4. Transactions (the big fact table)
-- -----------------------------------------------------------------------------
-- ONE ledger for all money movements on all accounts: card payments, transfers,
-- direct debits, ATM, fees, interest. `channel` says how it happened.
-- At full scale this lives in Parquet partitioned by year/month and is exposed as
-- a view; the DDL below is the logical contract.

CREATE TABLE transactions (
    txn_id              BIGINT PRIMARY KEY,
    account_id          BIGINT NOT NULL REFERENCES accounts(account_id),
    customer_id         BIGINT NOT NULL,     -- the holder who made it (card owner / initiator); primary holder for incoming money
    booked_at           TIMESTAMP NOT NULL,  -- when it hit the ledger
    value_date          DATE NOT NULL,
    amount              DECIMAL(14,2) NOT NULL,  -- signed: < 0 out, > 0 in
    currency            VARCHAR(3) NOT NULL DEFAULT 'EUR',
    original_amount     DECIMAL(14,2),       -- for non-EUR card spend
    original_currency   VARCHAR(3),
    balance_after       DECIMAL(14,2),       -- running balance of the account after this txn
    channel             VARCHAR NOT NULL,    -- 'card_pos' | 'card_contactless' | 'card_online' | 'mobile_payment'
                                             -- | 'atm_withdrawal' | 'sepa_transfer' | 'sepa_instant'
                                             -- | 'direct_debit' | 'standing_order' | 'internal_transfer'
                                             -- | 'fee' | 'interest'
    status              VARCHAR NOT NULL,    -- 'booked' | 'pending' | 'declined' | 'reversed'
    -- Card side (NULL when not a card txn)
    card_id             BIGINT,
    merchant_id         BIGINT,
    mcc                 VARCHAR(4),
    -- Transfer / direct-debit side (NULL for card txns)
    counterparty_name   VARCHAR,             -- e.g. employer, landlord, 'RVA/ONEM', 'Engie'
    counterparty_iban   VARCHAR,
    structured_ref      VARCHAR,             -- Belgian '+++123/4567/89012+++' structured communication
    description         VARCHAR,             -- free-text remittance / statement line
    -- Bank's own categorisation (like what the app shows today)
    category_id         VARCHAR REFERENCES categories(category_id)
);

-- -----------------------------------------------------------------------------
-- 5. Generator ground truth (sim_*): DO NOT use for detection
-- -----------------------------------------------------------------------------

-- The archetype the generator used to produce this customer's behaviour.
CREATE TABLE sim_customer_persona (
    customer_id     BIGINT PRIMARY KEY REFERENCES customers(customer_id),
    persona         VARCHAR NOT NULL,        -- e.g. 'young_professional', 'student', 'family_mortgage', 'retiree', 'gig_worker'
    income_decile   TINYINT,
    spend_propensity DOUBLE,                 -- 0..1, how much of income they tend to spend
    notes           VARCHAR
);

-- Life events injected into the timeline. These are what the engine should
-- discover from transactions alone.
CREATE TABLE sim_life_events (
    event_id        BIGINT PRIMARY KEY,
    customer_id     BIGINT NOT NULL REFERENCES customers(customer_id),
    event_type      VARCHAR NOT NULL,        -- 'job_loss' | 'income_drop' | 'divorce' | 'new_baby' | 'illness'
                                             -- | 'rent_increase' | 'overspending_spiral' | 'new_job' | 'moved_house'
                                             -- | 'gambling_increase' | 'bnpl_stacking'
    start_date      DATE NOT NULL,
    end_date        DATE,                    -- NULL = ongoing at snapshot
    severity        TINYINT,                 -- 1..3
    params          JSON                     -- event-specific knobs, e.g. {"income_after": 1450.0}
);

-- -----------------------------------------------------------------------------
-- 6. App state (written by engine / frontend, not by the generator)
-- -----------------------------------------------------------------------------

CREATE TABLE budgets (
    budget_id       BIGINT PRIMARY KEY,
    customer_id     BIGINT NOT NULL REFERENCES customers(customer_id),
    category_id     VARCHAR NOT NULL REFERENCES categories(category_id),
    monthly_limit   DECIMAL(12,2) NOT NULL,
    enforcement     VARCHAR NOT NULL DEFAULT 'notify',  -- 'notify' | 'soft_block'
    created_at      TIMESTAMP NOT NULL,
    source          VARCHAR NOT NULL         -- 'customer' | 'advisor' | 'ai_plan'
);

-- Something the engine noticed about a customer.
CREATE TABLE signals (
    signal_id       BIGINT PRIMARY KEY,
    customer_id     BIGINT NOT NULL REFERENCES customers(customer_id),
    signal_type     VARCHAR NOT NULL,        -- e.g. 'income_stopped', 'balance_trending_negative', 'subscription_overlap'
    detected_at     TIMESTAMP NOT NULL,
    score           DOUBLE,                  -- 0..1 confidence / severity
    evidence        JSON,                    -- txn_ids, aggregates, explanation
    engine_version  VARCHAR
);

-- What we do about it: advice, soft block, cheaper alternative, advisor call, report.
CREATE TABLE interventions (
    intervention_id BIGINT PRIMARY KEY,
    customer_id     BIGINT NOT NULL REFERENCES customers(customer_id),
    signal_id       BIGINT REFERENCES signals(signal_id),
    txn_id          BIGINT,                  -- set for real-time nudges / soft blocks
    intervention_type VARCHAR NOT NULL,      -- 'advice_message' | 'soft_block' | 'cheaper_alternative'
                                             -- | 'ai_call' | 'written_report' | 'advisor_callback'
    channel         VARCHAR NOT NULL,        -- 'app_push' | 'in_app' | 'email' | 'voice' | 'advisor'
    content         JSON,                    -- rendered message / report payload
    created_at      TIMESTAMP NOT NULL,
    status          VARCHAR NOT NULL,        -- 'proposed' | 'sent' | 'accepted' | 'dismissed' | 'overridden'
    responded_at    TIMESTAMP
);
