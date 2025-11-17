// Core domain types for loan tracker application

export type TransactionType = 'helper_disbursement' | 'interest_charge' | 'repayment';

export type TransactionCategory =
	| 'booking_fee'
	| 'down_payment'
	| 'stamp_duty'
	| 'progress_payment'
	| 'misc_property'
	| 'interest'
	| 'repayment';

export type Payer = 'helper' | 'me' | 'spouse';

export interface PropertyInfo {
	name: string;
	basePrice: number;
	buyerStampDuty: number;
	otherFees: number;
}

export interface BorrowerBalance {
	principalOwed: number;
	interestOwed: number;
	totalPaidHistorically: number;
}

export interface LoanTotals {
	principalBorrowed: number;
	interestCharged: number;
	totalRepaid: number;
	outstandingPrincipal: number;
	outstandingInterest: number;
}

export interface LoanSummary {
	totals: LoanTotals;
	borrowers: {
		me: BorrowerBalance;
		spouse: BorrowerBalance;
	};
}

export interface BorrowerSplit {
	id: string;
	effectiveFrom: string;
	mePercent: number;
	spousePercent: number;
	createdAt: string;
}

export interface BorrowerAllocationOverride {
	meAmount: number;
	spouseAmount: number;
}

export interface Transaction {
	id: string;
	date: string; // ISO date string
	type: TransactionType;
	category: TransactionCategory;
	paidBy: Payer;
	amount: number;
	description: string;
	// Optional override for borrower allocation (only for helper_disbursement & interest_charge)
	borrowerOverride?: BorrowerAllocationOverride;
}

export interface TransactionFormData {
	date: string;
	type: TransactionType;
	category: TransactionCategory;
	amount: number;
	paidBy: Payer;
	description: string;
	// Optional override for borrower allocation
	borrowerOverride?: BorrowerAllocationOverride;
}

export interface CategoryOption {
	value: TransactionCategory;
	label: string;
}

export type CategoryOptionsMap = Record<TransactionType, CategoryOption[]>;
export type TransactionTypeLabels = Record<TransactionType, string>;

export interface ValidationError {
	field: string;
	message: string;
}
