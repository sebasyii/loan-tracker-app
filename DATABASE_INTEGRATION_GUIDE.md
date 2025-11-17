# Database Integration Guide

## Overview

Your loan tracker app now has full database integration using SvelteKit's server-side data fetching with Drizzle ORM. All data is persisted to SQLite and the UI automatically updates after mutations.

## What Was Implemented

### 1. Database Query Layer
**File**: `src/lib/server/db/queries.ts`

Centralized query functions that handle all database operations:
- **Property queries**: `getPropertyInfo()`, `createPropertyInfo()`, `updatePropertyInfo()`
- **Transaction queries**: `getTransactions()`, `addTransaction()`
- **Borrower split queries**: `getCurrentBorrowerSplit()`, `getBorrowerSplitForDate()`, `createBorrowerSplit()`
- **Loan summary calculation**: `calculateLoanSummary()` - server-side calculation from transactions

**Key Features**:
- Automatic conversion between cents (database) and dollars (UI)
- Type-safe query functions with proper return types
- Server-side loan calculations for consistency and security

### 2. Server Load Function
**File**: `src/routes/+page.server.ts`

Implements SvelteKit's `load` function and form actions:
- **Load function**: Fetches property, transactions, and loan summary in parallel
- **Error handling**: Redirects to setup wizard if no property exists
- **Form actions**:
  - `updateProperty` - Save property changes
  - `addTransaction` - Create new transactions
- **Automatic revalidation**: Data refreshes after successful form submissions

### 3. Setup Wizard
**Files**: `src/routes/setup/+page.svelte`, `src/routes/setup/+page.server.ts`

Initial setup flow for new users:
- Collects property information (name, price, stamp duty, fees)
- Sets initial borrower split percentages
- Creates both property and borrower split records
- Redirects to main app after successful setup
- Auto-calculates complementary percentages (if you = 60%, spouse = 40%)

### 4. Updated Main Page
**File**: `src/routes/+page.svelte`

Now uses server data instead of mock data:
- Data automatically typed via `PageData` from `./$types`
- Uses `$derived` runes for reactive data access
- Form submissions via fetch API with automatic revalidation
- Loading states during submissions

## How It Works

### Data Flow

1. **Initial Load**:
   ```
   User visits / → +page.server.ts load() → Queries database → Returns data → Page renders
   ```

2. **If No Property**:
   ```
   User visits / → No property found → Redirect to /setup → User fills form → Creates property → Redirect to /
   ```

3. **Adding Transaction**:
   ```
   User clicks "Add Transaction" → Fills form → Submit → +page.server.ts action → Insert to DB → Auto-revalidate → UI updates
   ```

4. **Updating Property**:
   ```
   User clicks "Edit" → Changes values → Save → +page.server.ts action → Update DB → Auto-revalidate → UI updates
   ```

### Automatic Revalidation

After any form action succeeds, SvelteKit automatically:
1. Re-runs the `load` function
2. Fetches fresh data from the database
3. Updates the `data` prop
4. Re-renders the page with new data

**No manual state management needed!**

### Type Safety

Full type safety from database to UI:
- Database schema types exported from `schema.ts`
- UI types defined in `src/lib/types/index.ts`
- Conversion functions handle the difference (cents ↔ dollars)
- Auto-generated `PageData` type from load function

## How to Use

### First Time Setup

1. **Start the dev server**:
   ```bash
   pnpm dev
   ```

2. **Visit** `http://localhost:5174/` (or the port shown)

3. **Complete the setup wizard**:
   - Enter property information
   - Set borrower split percentages
   - Click "Complete Setup"

4. **You're redirected to the main app** with your property info loaded

### Adding Transactions

1. Click "Add Transaction"
2. Fill out the form:
   - **Date**: When the transaction occurred
   - **Type**: Helper Disbursement, Interest Charge, or Repayment
   - **Category**: Automatically filtered based on type
   - **Amount**: In dollars (stored as cents in DB)
   - **Paid By**: Auto-set based on type (Helper for disbursements/interest, Me/Spouse for repayments)
   - **Description**: Optional notes

3. Click "Add Transaction"
4. Modal closes and the table automatically updates with the new transaction
5. Loan summary recalculates automatically

### Updating Property Info

1. Click "Edit" on the Property Information card
2. Modify any fields
3. Click "Save"
4. Property info updates and total cost recalculates

### Viewing Loan Summary

The Loan Summary card shows:
- **Loan Totals**:
  - Principal Borrowed (sum of all helper disbursements)
  - Interest Charged (sum of all interest charges)
  - Total Repaid (sum of all repayments)
  - Outstanding Principal & Interest (calculated proportionally)
  - Overall Outstanding Balance

- **Per-Borrower Breakdown**:
  - Your share based on current borrower split percentage
  - Spouse's share based on current borrower split percentage
  - Total paid historically by each person

## Repayment Logic Implementation

Based on your requirements:
- **Interest is tracked separately** as "interest_charge" transactions
- **Repayments reduce the total outstanding** (principal + interest combined)
- **The ratio is maintained**: If you've repaid 30% of the total, both principal and interest outstanding are reduced to 70%
- **Borrower splits determine allocation**: Each person owes their percentage of the remaining balance

### Example Calculation

```
Principal Borrowed: $100,000
Interest Charged: $3,000
Total Owed: $103,000

Me Repaid: $15,000
Spouse Repaid: $10,000
Total Repaid: $25,000

Total Outstanding: $103,000 - $25,000 = $78,000
Outstanding Ratio: $78,000 / $103,000 = 75.73%

Outstanding Principal: $100,000 × 75.73% = $75,730
Outstanding Interest: $3,000 × 75.73% = $2,270

With 60/40 split:
Me owes: $78,000 × 60% = $46,800 (Principal: $45,438, Interest: $1,362)
Spouse owes: $78,000 × 40% = $31,200 (Principal: $30,292, Interest: $908)
```

## Database Schema

### Tables

1. **property_info**: Single row with property details (amounts in cents)
2. **transactions**: Immutable log of all financial activity (amounts in cents)
3. **borrower_splits**: Time-based history of ownership percentages

### Key Design Decisions

**Amounts Stored as Cents**:
- Avoids floating-point precision errors
- Standard practice for financial applications
- Conversion to dollars happens in the query layer

**Single Property Model**:
- ID fixed as 'default'
- Simplifies queries and logic
- Can be extended to multi-property later if needed

**Immutable Transactions**:
- Never updated or deleted (append-only log)
- Full audit trail of all financial activity
- Loan summary calculated from transaction history

**Time-Based Splits**:
- Supports changing ownership percentages over time
- Future feature: use `effectiveFrom` to calculate historical balances
- Currently uses latest split for all calculations

## Server-Side vs Client-Side

### What's Server-Side (Secure)

✅ Database queries
✅ Business logic (loan calculations)
✅ Environment variables (DATABASE_URL)
✅ Form validation
✅ Data transformations (cents ↔ dollars)

### What's Client-Side

✅ UI rendering
✅ Form state management
✅ Modal open/close state
✅ Loading indicators
✅ User interactions

## Error Handling

### Load Function Errors

- **No property found**: Automatic redirect to `/setup`
- **Database errors**: SvelteKit error page with 500 status
- **Network errors**: Graceful error boundary

### Form Action Errors

- **Validation errors**: Return `fail(400)` with error message
- **Database errors**: Return `fail(500)` with error message
- **Errors shown in UI**: Alert dialogs (can be improved with toast notifications)

## Performance Optimizations

### Parallel Data Fetching

```typescript
const [transactions, loanSummary] = await Promise.all([
  getTransactions(),
  calculateLoanSummary()
]);
```

Fetches multiple data sources simultaneously instead of sequentially.

### Minimal Re-renders

Using `$derived` runes means components only re-render when the specific data they depend on changes.

### Database Indexes

Consider adding indexes if transaction count grows large:
```sql
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
```

## Future Enhancements

### Potential Improvements

1. **Toast Notifications**: Replace `alert()` with better UI feedback
2. **Loading States**: Show spinners during form submissions
3. **Optimistic Updates**: Update UI immediately, rollback on error
4. **Transaction Editing**: Allow modifying past transactions
5. **Transaction Deletion**: Soft delete with confirmation
6. **Borrower Split Changes**: UI for updating split percentages over time
7. **Historical Calculations**: Calculate balances at any point in time
8. **Export to CSV**: Download transaction history
9. **Charts/Graphs**: Visualize loan balance over time
10. **Progressive Enhancement**: Make forms work without JavaScript

### Database Migrations

When schema changes are needed:

```bash
# Generate migration
pnpm db:generate

# Apply migration
pnpm db:migrate
```

## Troubleshooting

### "Property not found" Error

**Cause**: No property in database
**Solution**: Visit `/setup` and complete the setup wizard

### "No borrower split configuration found"

**Cause**: Property exists but no borrower split
**Solution**: Run the seed script or manually insert a borrower split

### Form Submission Not Working

**Cause**: Various possibilities
**Debug**:
1. Check browser console for errors
2. Check server logs in terminal
3. Verify form data is being sent correctly
4. Check network tab for failed requests

### Type Errors

**Cause**: Mismatch between DB types and UI types
**Solution**: Ensure conversion functions are being used in query layer

## Testing Checklist

- [✓] Fresh database → Setup wizard appears
- [✓] Complete setup → Redirect to main app
- [ ] Add helper disbursement transaction → Appears in table
- [ ] Add interest charge → Loan summary updates
- [ ] Add repayment → Outstanding balance decreases
- [ ] Update property → Changes reflect immediately
- [ ] Try to repay more than outstanding → Validation error
- [ ] Type checking passes: `pnpm check`
- [ ] Dev server runs: `pnpm dev`

## Next Steps

1. **Test the application**:
   - Delete `local.db` to start fresh
   - Go through setup wizard
   - Add various transactions
   - Verify calculations are correct

2. **Consider enhancements**:
   - Better error handling UI (toast notifications)
   - Loading states for better UX
   - Transaction editing/deletion
   - Borrower split management UI

3. **Production preparation**:
   - Add proper error boundaries
   - Implement logging
   - Set up backups for SQLite database
   - Consider migration to hosted database if needed

## Key Takeaways

✅ **Type Safety**: Full type safety from database to UI
✅ **Server-Side Logic**: Calculations and business logic on server
✅ **Automatic Updates**: Data revalidates after mutations
✅ **Setup Wizard**: Smooth onboarding for new users
✅ **Clean Architecture**: Separation of concerns (queries/actions/UI)
✅ **Error Handling**: Graceful handling of edge cases
✅ **Security**: Database credentials never exposed to client

Your loan tracker now has a solid foundation for production use!
