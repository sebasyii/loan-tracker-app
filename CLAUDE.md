# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a loan and cashflow tracker for a Singapore EC (Executive Condominium) purchase. The app tracks:
- Helper disbursements (amounts paid on behalf of borrowers)
- Interest charges passed from Helper to borrowers
- Repayments made by individual borrowers (Me/Spouse)
- Dynamic borrower split percentages that change over time
- Per-person outstanding balances and repayment history

## Tech Stack

- **Framework**: SvelteKit 2.x with Svelte 5.x (using runes: `$props`, `$state`, etc.)
- **Database**: SQLite via better-sqlite3
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS v4
- **Package Manager**: pnpm
- **TypeScript**: Strict mode enabled

## Development Commands

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Type checking
pnpm check

# Watch mode type checking
pnpm check:watch

# Linting
pnpm lint

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Database Commands

```bash
# Push schema changes to database (for development)
pnpm db:push

# Generate migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Drizzle Studio (visual database browser)
pnpm db:studio
```

## Environment Setup

Required environment variable in `.env`:
- `DATABASE_URL` - Path to SQLite database file (e.g., `local.db`)

See `.env.example` for reference.

## Architecture

### Database Layer

- **Location**: `src/lib/server/db/`
- **Schema**: `schema.ts` - Drizzle schema definitions
- **Client**: `index.ts` - Database client initialization with environment validation
- **Configuration**: `drizzle.config.ts` in project root

The database client validates `DATABASE_URL` at startup and throws if missing.

### Frontend Structure

- **Routes**: `src/routes/` - SvelteKit file-based routing
- **Components**: `src/lib/` - Shared components and utilities
- **Layout**: `src/routes/+layout.svelte` - Root layout with Tailwind CSS import
- **Assets**: `src/lib/assets/` - Static assets (favicon, etc.)

### Core Domain Concepts

#### Entities (Hard-coded)
- `me` - Primary borrower
- `spouse` - Secondary borrower
- `helper` - Lender who pays on behalf of borrowers
- `developer` - Property developer

#### Transaction Types
1. **Helper Disbursement** - Helper pays for property-related expenses (increases loan principal)
   - Categories: `booking_fee`, `down_payment`, `stamp_duty`, `progress_payment`, `misc_property`
2. **Interest Charge** - Interest cost from Helper's bank loan passed to borrowers
3. **Repayment** - Borrower payment back to Helper

#### Borrower Split
- Time-based split configuration: `{ effectiveFrom: date, mePercent, spousePercent }`
- Only affects transactions from the effective date forward
- Past transactions remain unchanged by split updates

#### Property Information
- Base price
- Buyer stamp duty
- Optional fees
- Total cost (calculated)

## UI Requirements

- Single-page application
- Simple, visually clear interface
- Transaction-focused with summary dashboard
- Built with Svelte components
- Focused on clarity for tracking personal outstanding balances and repayment history
- If you are unsure of best practices, make sure to read from here. This is a reference guide for you. https://svelte.dev/llms-medium.txt