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

export function calculateBSD(basePrice: number): number {
	if (basePrice <= 180000) {
		return basePrice * 0.01;
	} else if (basePrice <= 360000) {
		return 1800 + (basePrice - 180000) * 0.02;
	} else if (basePrice <= 1000000) {
		return 7200 + (basePrice - 360000) * 0.03;
	} else if (basePrice <= 1500000) {
		return 24600 + (basePrice - 1000000) * 0.04;
	} else if (basePrice <= 3000000) {
		return 44600 + (basePrice - 1500000) * 0.05;
	} else {
		return 108000 + (basePrice - 3000000) * 0.06;
	}
}

// Write tests for calculateBSD function to ensure correctness
export function testCalculateBSD() {
	console.log(calculateBSD(1961000)); // Expected output: 67650
	console.log(calculateBSD(1541000));  // Expected output: 46,650
	console.assert(calculateBSD(1961000) === 67650, 'Test Case 1 Failed');
}