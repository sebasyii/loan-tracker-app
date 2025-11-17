import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Transactions table - Immutable log of all financial transactions
 *
 * Stores helper disbursements, interest charges, and repayments.
 * Amounts are stored as integers (cents) to avoid floating-point precision issues.
 */
export const transactions = sqliteTable('transactions', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	date: text('date').notNull(), // ISO date string (YYYY-MM-DD)
	type: text('type', {
		enum: ['helper_disbursement', 'interest_charge', 'repayment']
	}).notNull(),
	category: text('category', {
		enum: [
			'booking_fee',
			'down_payment',
			'stamp_duty',
			'progress_payment',
			'misc_property',
			'interest',
			'repayment'
		]
	}).notNull(),
	paidBy: text('paid_by', { enum: ['helper', 'me', 'spouse'] }).notNull(),
	amount: integer('amount').notNull(), // Amount in cents (SGD * 100)
	description: text('description').notNull(),
	// Optional override for borrower allocation (only for helper_disbursement & interest_charge)
	// When set, these override the default split percentage calculation
	borrowerOverrideMeAmount: integer('borrower_override_me_amount'), // In cents
	borrowerOverrideSpouseAmount: integer('borrower_override_spouse_amount'), // In cents
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

/**
 * Property info table - Stores property details
 *
 * Typically contains a single row for the EC being tracked.
 * Amounts are stored as integers (cents).
 */
export const propertyInfo = sqliteTable('property_info', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	basePrice: integer('base_price').notNull(), // In cents
	buyerStampDuty: integer('buyer_stamp_duty').notNull(), // In cents
	otherFees: integer('other_fees').notNull(), // In cents
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

/**
 * Borrower splits table - Time-based history of borrower split percentages
 *
 * Each row represents when the split percentage changed.
 * Transactions use the most recent split as of their transaction date.
 * Past transactions are NOT recalculated when new splits are added.
 */
export const borrowerSplits = sqliteTable('borrower_splits', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	effectiveFrom: text('effective_from').notNull(), // ISO date string (YYYY-MM-DD)
	mePercent: integer('me_percent').notNull(), // 0-100
	spousePercent: integer('spouse_percent').notNull(), // 0-100
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

// Type exports for use in application code
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type PropertyInfo = typeof propertyInfo.$inferSelect;
export type NewPropertyInfo = typeof propertyInfo.$inferInsert;

export type BorrowerSplit = typeof borrowerSplits.$inferSelect;
export type NewBorrowerSplit = typeof borrowerSplits.$inferInsert;
