# Database Schema Design

## Overview

This schema supports a loan tracker for Singapore EC purchase with:
- Immutable transaction log (helper disbursements, interest charges, repayments)
- Time-based borrower split percentages
- Property information
- Calculated balances (not stored, derived from transactions)

## Tables

### 1. `transactions`

**Purpose:** Immutable log of all financial transactions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | UUID generated via crypto.randomUUID() |
| `date` | TEXT | NOT NULL | ISO date string (YYYY-MM-DD) |
| `type` | TEXT | NOT NULL, ENUM | Transaction type: `helper_disbursement`, `interest_charge`, `repayment` |
| `category` | TEXT | NOT NULL, ENUM | Category: `booking_fee`, `down_payment`, `stamp_duty`, `progress_payment`, `misc_property`, `interest`, `repayment` |
| `paid_by` | TEXT | NOT NULL, ENUM | Who paid: `helper`, `me`, `spouse` |
| `amount` | INTEGER | NOT NULL | Amount in cents (SGD × 100) to avoid floating-point precision issues |
| `description` | TEXT | NOT NULL | Human-readable description |
| `created_at` | TEXT | NOT NULL | ISO timestamp when record was created |

**Indexes:**
- Primary index on `id`
- Index on `date` for chronological queries
- Index on `type` for filtering by transaction type

**Notes:**
- Transactions are **immutable** - never updated, only inserted
- Amount stored as cents: $100.50 → 10050
- Date is transaction date, not creation date

---

### 2. `property_info`

**Purpose:** Store property details (typically single row for this app)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | UUID or 'default' for singleton pattern |
| `name` | TEXT | NOT NULL | Property name (e.g., "EC at Punggol") |
| `base_price` | INTEGER | NOT NULL | Base property price in cents |
| `buyer_stamp_duty` | INTEGER | NOT NULL | Buyer's stamp duty in cents |
| `other_fees` | INTEGER | NOT NULL | Other fees in cents |
| `updated_at` | TEXT | NOT NULL | ISO timestamp of last update |

**Notes:**
- For single property: use singleton pattern with id = 'default'
- For multiple properties: each property gets unique UUID
- This app assumes single property, but schema supports extensibility

---

### 3. `borrower_splits`

**Purpose:** Time-based history of borrower split percentages

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | UUID generated via crypto.randomUUID() |
| `effective_from` | TEXT | NOT NULL, UNIQUE | ISO date string when this split becomes active |
| `me_percent` | INTEGER | NOT NULL, CHECK(0-100) | My percentage of loan (0-100) |
| `spouse_percent` | INTEGER | NOT NULL, CHECK(0-100) | Spouse's percentage of loan (0-100) |
| `created_at` | TEXT | NOT NULL | ISO timestamp when split was configured |

**Indexes:**
- Primary index on `id`
- Unique index on `effective_from` (only one split per effective date)
- Index on `effective_from` for range queries

**Constraints:**
- `me_percent + spouse_percent = 100` (enforced at application level)
- `effective_from` must be unique

**Query Pattern:**
To find applicable split for a transaction date:
```sql
SELECT * FROM borrower_splits
WHERE effective_from <= ?
ORDER BY effective_from DESC
LIMIT 1
```

**Notes:**
- Each row represents a "split change event"
- Transactions use the most recent split as of their date
- Past transactions are NOT recalculated when splits change
- Example timeline:
  - 2024-01-01: me=60%, spouse=40%
  - 2024-06-01: me=50%, spouse=50%
  - Transaction on 2024-03-15 uses 60/40 split
  - Transaction on 2024-08-01 uses 50/50 split

---

## Derived Data (NOT Stored in Database)

These are calculated on-the-fly from the tables above:

### `LoanSummary`
Calculated by:
1. Sum all `helper_disbursement` transactions → `principalBorrowed`
2. Sum all `interest_charge` transactions → `interestCharged`
3. Sum all `repayment` transactions → `totalRepaid`
4. `outstandingPrincipal = principalBorrowed - totalRepaid`
5. `outstandingInterest = interestCharged`

### `BorrowerBalance` (per person)
Calculated by:
1. For each transaction, determine applicable split percentage based on transaction date
2. Allocate transaction amount to borrowers based on split:
   - Helper disbursement: Increases both borrowers' principal proportionally
   - Interest charge: Increases both borrowers' interest proportionally
   - Repayment: Decreases specific borrower's balance
3. Sum allocated amounts per borrower

**Example Calculation:**
```
Transaction: Helper pays $100k down payment on 2024-02-01
Active split on 2024-02-01: me=60%, spouse=40%

Result:
- Me owes: $60,000 principal
- Spouse owes: $40,000 principal

Transaction: Me repays $15k on 2024-04-01
Result:
- Me owes: $45,000 principal
- Spouse still owes: $40,000 principal
```

---

## Design Decisions

### ✅ Why Store Amounts as Integers (Cents)?
- Avoids floating-point precision errors (e.g., 0.1 + 0.2 ≠ 0.3)
- Standard practice for financial applications
- Easy conversion: display as `amount / 100` with 2 decimal places

### ✅ Why Not Store Calculated Balances?
- Balances are derived from immutable transaction log
- Storing them creates redundancy and potential inconsistency
- For this app size (personal use), on-the-fly calculation is fast enough
- Can add materialized views or caching later if needed

### ✅ Why Text Dates Instead of Timestamps?
- SQLite's date handling is limited
- ISO date strings (YYYY-MM-DD) are human-readable
- Easy to work with in JavaScript/TypeScript
- Sufficient precision for this app (day-level granularity)

### ✅ Why Immutable Transactions?
- Audit trail: never lose historical data
- Corrections via new offsetting transactions (not updates)
- Simplifies concurrency and data integrity

### ✅ Why Separate Borrower Splits Table?
- Supports changing split percentages over time
- Historical accuracy: transactions use split active at their date
- Prevents retroactive recalculation (past deals stay locked)

---

## Schema Evolution

If the app grows, consider:

1. **Materialized Balance Table** - Cache calculated balances for performance
2. **Audit Log** - Track all changes to property_info
3. **Multiple Properties** - Add property_id foreign key to transactions
4. **Soft Deletes** - Add `deleted_at` column instead of hard deletes
5. **Indexes** - Add composite indexes for complex queries
6. **Constraints** - Add CHECK constraints for valid enum values at DB level

---

## Migration Strategy

1. Create initial schema with all three tables
2. Seed `property_info` with default/example property
3. Seed `borrower_splits` with initial 50/50 split
4. Optionally seed `transactions` with example data
5. Test balance calculations match expected values
