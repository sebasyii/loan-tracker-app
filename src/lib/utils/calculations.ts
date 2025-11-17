import type { PropertyInfo, LoanTotals, BorrowerBalance } from '$lib/types';

export function calculatePropertyTotalCost(info: PropertyInfo): number {
	return info.basePrice + info.buyerStampDuty + info.otherFees;
}

export function calculateOverallOutstanding(totals: LoanTotals): number {
	return totals.outstandingPrincipal + totals.outstandingInterest;
}

export function calculateBorrowerTotalOutstanding(borrower: BorrowerBalance): number {
	return borrower.principalOwed + borrower.interestOwed;
}
