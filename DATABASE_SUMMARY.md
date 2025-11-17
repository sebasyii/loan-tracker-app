# Database Implementation Summary

## Overview

The loan tracker database has been successfully designed and implemented using **SQLite** with **Drizzle ORM**. The schema supports tracking property loans, dynamic borrower splits, and complete transaction history.

---

## 📊 Database Schema

### Tables Created

1. **`transactions`** - Immutable transaction log
   - Stores all helper disbursements, interest charges, and repayments
   - Primary key: UUID
   - Amounts stored as integers (cents) for precision
   - Indexed on `date` for chronological queries

2. **`property_info`** - Property details
   - Stores EC property information
   - Typically single row (singleton pattern)
   - Amounts stored as integers (cents)

3. **`borrower_splits`** - Time-based split history
   - Tracks how loan responsibility splits between borrowers over time
   - Each row represents a split change event
   - Transactions use the most recent split as of their date
   - Indexed on `effective_from` for efficient lookups

---

## 🎯 Key Design Decisions

### 1. **Integer Storage for Money**
All monetary amounts are stored as **integers in cents** (SGD × 100):
- Avoids floating-point precision errors
- Standard practice for financial applications
- Example: $100.50 stored as 10050

**Conversion:**
```typescript
// Store: dollars to cents
const cents = dollars * 100;

// Display: cents to dollars
const dollars = cents / 100;
```

### 2. **Immutable Transaction Log**
- Transactions are **never updated or deleted**
- Corrections made via new offsetting transactions
- Provides complete audit trail
- Simplifies data integrity

### 3. **Calculated Balances**
Balances are **derived on-the-fly** from transactions:
- No redundant storage
- Always accurate and consistent
- Sufficient performance for personal use
- Can add caching later if needed

**Calculation Logic:**
```typescript
// For each transaction:
1. Find applicable split based on transaction.date
2. Allocate amount proportionally to borrowers
3. Sum allocated amounts per borrower

// Example:
Helper pays $100k on 2024-02-01 (60/40 split active)
→ Me owes: $60k, Spouse owes: $40k

Me repays $15k on 2024-04-01
→ Me owes: $45k, Spouse still owes: $40k
```

### 4. **Time-Based Splits**
Supports changing borrower percentages over time:
- Each split has an `effective_from` date
- Transactions use the split active on their date
- **Past transactions NOT recalculated** when splits change
- Historical accuracy preserved

**Example Timeline:**
```
2024-01-01: 50/50 split starts
2024-03-15: Transaction uses 50/50
2024-06-01: Split changes to 60/40
2024-08-01: Transaction uses 60/40
→ March transaction forever uses 50/50 (immutable)
```

---

## 🗂️ File Structure

```
src/lib/server/db/
├── index.ts           # Database client (SvelteKit)
├── schema.ts          # Drizzle schema definitions
└── seed.ts            # Seed script with example data

Root files:
├── drizzle.config.ts  # Drizzle configuration
├── .env               # Environment variables (DATABASE_URL)
├── .env.example       # Environment template
└── local.db           # SQLite database file (28KB)
```

---

## 🚀 Usage

### Database Commands

```bash
# Push schema changes to database (development)
pnpm db:push

# Generate migrations
pnpm db:generate

# Run migrations (production)
pnpm db:migrate

# Open Drizzle Studio (visual database browser)
pnpm db:studio

# Seed database with example data
pnpm db:seed
```

### Current Seeded Data

The database has been seeded with:

**Property:**
- EC at Punggol
- Base price: $650,000
- Stamp duty: $19,600
- Other fees: $5,000

**Borrower Split:**
- Effective from: 2024-01-01
- Me: 50%, Spouse: 50%

**Transactions (6 total):**
1. 2024-01-15: Helper pays $5,000 booking fee
2. 2024-02-01: Helper pays $100,000 down payment
3. 2024-02-15: Helper pays $20,000 stamp duty
4. 2024-03-15: Helper charges $3,250 interest
5. 2024-04-01: Me repays $20,000
6. 2024-04-15: Spouse repays $10,000

**Calculated Balances (from seed data):**
- Total borrowed: $128,250 ($125k principal + $3.25k interest)
- Total repaid: $30,000
- Outstanding: $98,250
- Me owes: ~$49,125 (50%)
- Spouse owes: ~$49,125 (50%)

---

## 🔍 Querying Examples

### Get All Transactions Chronologically
```typescript
const allTransactions = await db
  .select()
  .from(transactions)
  .orderBy(transactions.date);
```

### Get Property Info
```typescript
const property = await db
  .select()
  .from(propertyInfo)
  .where(eq(propertyInfo.id, 'default'))
  .limit(1);
```

### Get Active Split for a Date
```typescript
const split = await db
  .select()
  .from(borrowerSplits)
  .where(lte(borrowerSplits.effectiveFrom, '2024-04-01'))
  .orderBy(desc(borrowerSplits.effectiveFrom))
  .limit(1);
```

### Calculate Total Borrowed
```typescript
const result = await db
  .select({
    total: sum(transactions.amount)
  })
  .from(transactions)
  .where(eq(transactions.type, 'helper_disbursement'));
```

---

## 📈 Schema Evolution

Future enhancements to consider:

### Performance Optimization
- **Materialized balance table** - Cache calculated balances
- **Composite indexes** - For complex multi-column queries
- **Read replicas** - If scaling to multiple users

### Features
- **Multiple properties** - Add `property_id` foreign key to transactions
- **Soft deletes** - Add `deleted_at` timestamp instead of hard deletes
- **Audit log** - Track all changes to property_info
- **Attachments** - Store receipts/documents (S3 URLs)
- **Categories expansion** - More granular transaction categories
- **Comments** - Add notes to transactions

### Data Integrity
- **CHECK constraints** - Enforce split percentages sum to 100
- **Triggers** - Auto-validate data on insert
- **Foreign keys** - If adding relationships between tables

---

## 🔐 Data Validation

### Application-Level Checks (Required)

These are **not enforced at database level** and must be validated in application code:

1. **Split Percentages:** `me_percent + spouse_percent = 100`
2. **Amount Positivity:** All amounts must be > 0
3. **Date Format:** Must be valid ISO date strings (YYYY-MM-DD)
4. **Transaction Type/Category Match:**
   - `helper_disbursement` → booking_fee, down_payment, etc.
   - `interest_charge` → interest
   - `repayment` → repayment
5. **Payer Logic:**
   - `helper_disbursement` → paid_by = 'helper'
   - `interest_charge` → paid_by = 'helper'
   - `repayment` → paid_by = 'me' or 'spouse'

---

## 📚 Documentation

- **Full Schema Design:** See `DATABASE_SCHEMA.md`
- **Drizzle ORM Docs:** https://orm.drizzle.team/docs/overview
- **SQLite Docs:** https://www.sqlite.org/docs.html

---

## ✅ Status

- [x] Schema designed and documented
- [x] Tables created in SQLite
- [x] Seed script implemented
- [x] Example data loaded
- [x] Type safety with Drizzle
- [ ] Server-side data layer (API endpoints)
- [ ] Frontend integration (replace mock data)
- [ ] Balance calculation utilities
- [ ] Transaction validation logic

---

## 🎉 Next Steps

1. **Implement server-side data layer:**
   - Create `+page.server.ts` with load functions
   - Add form actions for creating transactions
   - Add form actions for updating property info

2. **Replace frontend mock data:**
   - Load real data from database
   - Connect transaction form to database
   - Connect property card to database

3. **Add balance calculation utilities:**
   - Implement split lookup logic
   - Calculate borrower balances from transactions
   - Calculate loan summary totals

4. **Add borrower split management:**
   - UI to view/edit splits
   - Validation that splits sum to 100%
   - Timeline view of split changes

---

## 🔧 Troubleshooting

### Database locked error
```bash
# Close Drizzle Studio or other connections
# Then retry your operation
```

### Schema out of sync
```bash
# Push latest schema changes
pnpm db:push --force
```

### Reset database
```bash
# Delete and recreate
rm local.db
pnpm db:push --force
pnpm db:seed
```

---

**Database Size:** 28 KB
**Last Updated:** 2025-11-17
**Status:** ✅ Ready for integration
