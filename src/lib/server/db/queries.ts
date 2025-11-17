import { db } from './index';
import { propertyInfo, transactions, borrowerSplits } from './schema';
import type { NewPropertyInfo, NewTransaction, NewBorrowerSplit } from './schema';
import { desc, eq, lte } from 'drizzle-orm';
import type {
	PropertyInfo as UIPropertyInfo,
	Transaction as UITransaction,
	LoanSummary,
	BorrowerSplit as UIBorrowerSplit
} from '$lib/types';

/**
 * Convert cents to dollars for UI display
 */
function centsToDollars(cents: number): number {
	return cents / 100;
}

/**
 * Convert dollars to cents for database storage
 */
function dollarsToCents(dollars: number): number {
	return Math.round(dollars * 100);
}

// ============================================================================
// PROPERTY INFO QUERIES
// ============================================================================

/**
 * Get property information (single property app)
 * Returns null if no property exists
 */
export async function getPropertyInfo(): Promise<UIPropertyInfo | null> {
	const result = await db.select().from(propertyInfo).limit(1);

	if (result.length === 0) {
		return null;
	}

	const property = result[0];

	return {
		name: property.name,
		basePrice: centsToDollars(property.basePrice),
		buyerStampDuty: centsToDollars(property.buyerStampDuty),
		otherFees: centsToDollars(property.otherFees)
	};
}

/**
 * Create property information
 */
export async function createPropertyInfo(data: UIPropertyInfo): Promise<void> {
	const newProperty: NewPropertyInfo = {
		id: 'default', // Single property app
		name: data.name,
		basePrice: dollarsToCents(data.basePrice),
		buyerStampDuty: dollarsToCents(data.buyerStampDuty),
		otherFees: dollarsToCents(data.otherFees),
		updatedAt: new Date().toISOString()
	};

	await db.insert(propertyInfo).values(newProperty);
}

/**
 * Update property information
 */
export async function updatePropertyInfo(data: UIPropertyInfo): Promise<void> {
	await db
		.update(propertyInfo)
		.set({
			name: data.name,
			basePrice: dollarsToCents(data.basePrice),
			buyerStampDuty: dollarsToCents(data.buyerStampDuty),
			otherFees: dollarsToCents(data.otherFees),
			updatedAt: new Date().toISOString()
		})
		.where(eq(propertyInfo.id, 'default'));
}

// ============================================================================
// TRANSACTION QUERIES
// ============================================================================

/**
 * Get all transactions ordered by date (newest first)
 * Converts amounts from cents to dollars
 */
export async function getTransactions(): Promise<UITransaction[]> {
	const result = await db.select().from(transactions).orderBy(desc(transactions.date));

	return result.map((t) => ({
		id: t.id,
		date: t.date,
		type: t.type as UITransaction['type'],
		category: t.category as UITransaction['category'],
		paidBy: t.paidBy as UITransaction['paidBy'],
		amount: centsToDollars(t.amount),
		description: t.description
	}));
}

/**
 * Add a new transaction
 */
export async function addTransaction(data: Omit<UITransaction, 'id'>): Promise<void> {
	const newTransaction: NewTransaction = {
		date: data.date,
		type: data.type,
		category: data.category,
		paidBy: data.paidBy,
		amount: dollarsToCents(data.amount),
		description: data.description,
		createdAt: new Date().toISOString()
	};

	await db.insert(transactions).values(newTransaction);
}

/**
 * Retrieve a transaction by id
 */
export async function getTransactionById(id: string): Promise<UITransaction | null> {
	const [txn] = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
	if (!txn) {
		return null;
	}

	return {
		id: txn.id,
		date: txn.date,
		type: txn.type as UITransaction['type'],
		category: txn.category as UITransaction['category'],
		paidBy: txn.paidBy as UITransaction['paidBy'],
		amount: centsToDollars(txn.amount),
		description: txn.description
	};
}

/**
 * Update transaction fields
 */
export async function updateTransaction(
	id: string,
	data: Omit<UITransaction, 'id'>
): Promise<void> {
	await db
		.update(transactions)
		.set({
			date: data.date,
			type: data.type,
			category: data.category,
			paidBy: data.paidBy,
			amount: dollarsToCents(data.amount),
			description: data.description
		})
		.where(eq(transactions.id, id));
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(id: string): Promise<void> {
	await db.delete(transactions).where(eq(transactions.id, id));
}

// ============================================================================
// BORROWER SPLIT QUERIES
// ============================================================================

/**
 * Get the current borrower split (most recent by effectiveFrom)
 */
export async function getCurrentBorrowerSplit() {
	const result = await db
		.select()
		.from(borrowerSplits)
		.orderBy(desc(borrowerSplits.effectiveFrom))
		.limit(1);

	return result[0] || null;
}

function mapBorrowerSplit(split: typeof borrowerSplits.$inferSelect): UIBorrowerSplit {
	return {
		id: split.id,
		effectiveFrom: split.effectiveFrom,
		mePercent: split.mePercent,
		spousePercent: split.spousePercent,
		createdAt: split.createdAt
	};
}

/**
 * List borrower split history (newest first)
 */
export async function getBorrowerSplits(): Promise<UIBorrowerSplit[]> {
	const result = await db
		.select()
		.from(borrowerSplits)
		.orderBy(desc(borrowerSplits.effectiveFrom), desc(borrowerSplits.createdAt));

	return result.map(mapBorrowerSplit);
}

/**
 * Get the borrower split effective for a specific date
 */
export async function getBorrowerSplitForDate(date: string) {
	const result = await db
		.select()
		.from(borrowerSplits)
		.where(lte(borrowerSplits.effectiveFrom, date))
		.orderBy(desc(borrowerSplits.effectiveFrom))
		.limit(1);

	return result[0] || null;
}

/**
 * Check if a borrower split already exists for a specific date
 */
export async function getBorrowerSplitByDate(effectiveFrom: string) {
	const result = await db
		.select()
		.from(borrowerSplits)
		.where(eq(borrowerSplits.effectiveFrom, effectiveFrom))
		.limit(1);

	return result[0] || null;
}

/**
 * Create a new borrower split
 */
export async function createBorrowerSplit(
	effectiveFrom: string,
	mePercent: number,
	spousePercent: number
): Promise<void> {
	const newSplit: NewBorrowerSplit = {
		effectiveFrom,
		mePercent,
		spousePercent,
		createdAt: new Date().toISOString()
	};

	await db.insert(borrowerSplits).values(newSplit);
}

// ============================================================================
// LOAN SUMMARY CALCULATION
// ============================================================================

/**
 * Calculate loan summary from transactions
 *
 * Repayment Logic:
 * - Principal borrowed = sum of all helper_disbursement transactions
 * - Interest charged = sum of all interest_charge transactions
 * - Total owed = principalBorrowed + interestCharged
 * - When repayments are made, they reduce the total outstanding balance
 * - Borrower splits determine how much each person owes of the outstanding amount
 */
export async function calculateLoanSummary(): Promise<LoanSummary> {
	const txns = await getTransactions();
	const split = await getCurrentBorrowerSplit();

	if (!split) {
		throw new Error('No borrower split configuration found. Please run database seed.');
	}

	const mePercent = split.mePercent / 100;
	const spousePercent = split.spousePercent / 100;

	// Calculate totals from transactions
	let principalBorrowed = 0;
	let interestCharged = 0;
	let meRepaid = 0;
	let spouseRepaid = 0;

	for (const txn of txns) {
		if (txn.type === 'helper_disbursement') {
			principalBorrowed += txn.amount;
		} else if (txn.type === 'interest_charge') {
			interestCharged += txn.amount;
		} else if (txn.type === 'repayment') {
			if (txn.paidBy === 'me') {
				meRepaid += txn.amount;
			} else if (txn.paidBy === 'spouse') {
				spouseRepaid += txn.amount;
			}
		}
	}

	const totalRepaid = meRepaid + spouseRepaid;
	const totalOwed = principalBorrowed + interestCharged;
	const totalOutstanding = totalOwed - totalRepaid;

	// Calculate outstanding principal and interest
	// After repayments, we reduce the total outstanding proportionally
	const outstandingRatio = totalRepaid >= totalOwed ? 0 : totalOutstanding / totalOwed;
	const outstandingPrincipal = principalBorrowed * outstandingRatio;
	const outstandingInterest = interestCharged * outstandingRatio;

	// Calculate per-borrower amounts based on current split
	const meTotalOutstanding = totalOutstanding * mePercent;
	const spouseTotalOutstanding = totalOutstanding * spousePercent;

	return {
		totals: {
			principalBorrowed,
			interestCharged,
			totalRepaid,
			outstandingPrincipal,
			outstandingInterest
		},
		borrowers: {
			me: {
				principalOwed: meTotalOutstanding * (outstandingPrincipal / totalOutstanding || 0),
				interestOwed: meTotalOutstanding * (outstandingInterest / totalOutstanding || 0),
				totalPaidHistorically: meRepaid
			},
			spouse: {
				principalOwed: spouseTotalOutstanding * (outstandingPrincipal / totalOutstanding || 0),
				interestOwed: spouseTotalOutstanding * (outstandingInterest / totalOutstanding || 0),
				totalPaidHistorically: spouseRepaid
			}
		}
	};
}
