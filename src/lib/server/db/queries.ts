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
		description: t.description,
		borrowerOverride:
			t.borrowerOverrideMeAmount !== null && t.borrowerOverrideSpouseAmount !== null
				? {
						meAmount: centsToDollars(t.borrowerOverrideMeAmount),
						spouseAmount: centsToDollars(t.borrowerOverrideSpouseAmount)
					}
				: undefined
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
		borrowerOverrideMeAmount: data.borrowerOverride
			? dollarsToCents(data.borrowerOverride.meAmount)
			: undefined,
		borrowerOverrideSpouseAmount: data.borrowerOverride
			? dollarsToCents(data.borrowerOverride.spouseAmount)
			: undefined,
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
		description: txn.description,
		borrowerOverride:
			txn.borrowerOverrideMeAmount !== null && txn.borrowerOverrideSpouseAmount !== null
				? {
						meAmount: centsToDollars(txn.borrowerOverrideMeAmount),
						spouseAmount: centsToDollars(txn.borrowerOverrideSpouseAmount)
					}
				: undefined
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
			description: data.description,
			borrowerOverrideMeAmount: data.borrowerOverride
				? dollarsToCents(data.borrowerOverride.meAmount)
				: null,
			borrowerOverrideSpouseAmount: data.borrowerOverride
				? dollarsToCents(data.borrowerOverride.spouseAmount)
				: null
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
 * - For each helper_disbursement or interest_charge:
 *   - If borrowerOverride exists, use those amounts
 *   - Otherwise, use the split effective for that transaction date
 * - Track per-borrower principal and interest charges
 * - When repayments are made, they reduce the borrower's outstanding balance
 */
export async function calculateLoanSummary(): Promise<LoanSummary> {
	const txns = await getTransactions();
	const splits = await getBorrowerSplits();

	if (splits.length === 0) {
		throw new Error('No borrower split configuration found. Please run database seed.');
	}

	// Helper function to get split for a specific date
	const getSplitForDate = (date: string) => {
		const applicableSplits = splits.filter((s) => s.effectiveFrom <= date);
		if (applicableSplits.length === 0) {
			// Use the earliest split if transaction is before any split
			return splits[splits.length - 1];
		}
		// Return the most recent split before or on the transaction date
		return applicableSplits[0];
	};

	// Track per-borrower amounts
	let mePrincipal = 0;
	let meInterest = 0;
	let spousePrincipal = 0;
	let spouseInterest = 0;
	let meRepaid = 0;
	let spouseRepaid = 0;

	// Sort transactions by date (oldest first) for chronological processing
	const sortedTxns = [...txns].sort((a, b) => a.date.localeCompare(b.date));

	for (const txn of sortedTxns) {
		if (txn.type === 'helper_disbursement') {
			if (txn.borrowerOverride) {
				// Use override amounts
				mePrincipal += txn.borrowerOverride.meAmount;
				spousePrincipal += txn.borrowerOverride.spouseAmount;
			} else {
				// Use split for transaction date
				const split = getSplitForDate(txn.date);
				const meShare = txn.amount * (split.mePercent / 100);
				const spouseShare = txn.amount * (split.spousePercent / 100);
				mePrincipal += meShare;
				spousePrincipal += spouseShare;
			}
		} else if (txn.type === 'interest_charge') {
			if (txn.borrowerOverride) {
				// Use override amounts
				meInterest += txn.borrowerOverride.meAmount;
				spouseInterest += txn.borrowerOverride.spouseAmount;
			} else {
				// Use split for transaction date
				const split = getSplitForDate(txn.date);
				const meShare = txn.amount * (split.mePercent / 100);
				const spouseShare = txn.amount * (split.spousePercent / 100);
				meInterest += meShare;
				spouseInterest += spouseShare;
			}
		} else if (txn.type === 'repayment') {
			if (txn.paidBy === 'me') {
				meRepaid += txn.amount;
			} else if (txn.paidBy === 'spouse') {
				spouseRepaid += txn.amount;
			}
		}
	}

	// Calculate totals
	const principalBorrowed = mePrincipal + spousePrincipal;
	const interestCharged = meInterest + spouseInterest;
	const totalRepaid = meRepaid + spouseRepaid;

	// Calculate per-borrower outstanding amounts
	const meTotalCharged = mePrincipal + meInterest;
	const spouseTotalCharged = spousePrincipal + spouseInterest;
	const meTotalOutstanding = Math.max(0, meTotalCharged - meRepaid);
	const spouseTotalOutstanding = Math.max(0, spouseTotalCharged - spouseRepaid);

	// Calculate outstanding principal and interest per borrower
	// When borrower makes repayment, reduce their charges proportionally
	const meOutstandingRatio = meTotalCharged > 0 ? meTotalOutstanding / meTotalCharged : 0;
	const spouseOutstandingRatio =
		spouseTotalCharged > 0 ? spouseTotalOutstanding / spouseTotalCharged : 0;

	const meOutstandingPrincipal = mePrincipal * meOutstandingRatio;
	const meOutstandingInterest = meInterest * meOutstandingRatio;
	const spouseOutstandingPrincipal = spousePrincipal * spouseOutstandingRatio;
	const spouseOutstandingInterest = spouseInterest * spouseOutstandingRatio;

	return {
		totals: {
			principalBorrowed,
			interestCharged,
			totalRepaid,
			outstandingPrincipal: meOutstandingPrincipal + spouseOutstandingPrincipal,
			outstandingInterest: meOutstandingInterest + spouseOutstandingInterest
		},
		borrowers: {
			me: {
				principalOwed: meOutstandingPrincipal,
				interestOwed: meOutstandingInterest,
				totalPaidHistorically: meRepaid
			},
			spouse: {
				principalOwed: spouseOutstandingPrincipal,
				interestOwed: spouseOutstandingInterest,
				totalPaidHistorically: spouseRepaid
			}
		}
	};
}
