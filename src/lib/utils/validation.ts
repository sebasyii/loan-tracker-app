import type { TransactionFormData, LoanSummary, ValidationError } from '$lib/types';
import { calculateBorrowerTotalOutstanding } from './calculations';

export function validateTransactionForm(
	formData: TransactionFormData,
	loanSummary: LoanSummary
): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!formData.date) {
		errors.push({ field: 'date', message: 'Date is required' });
	}

	if (formData.amount <= 0) {
		errors.push({ field: 'amount', message: 'Amount must be greater than 0' });
	}

	// Validate borrower override amounts if present
	if (formData.borrowerOverride) {
		const { meAmount, spouseAmount } = formData.borrowerOverride;

		if (meAmount <= 0) {
			errors.push({ field: 'overrideMe', message: 'Me amount must be greater than 0' });
		}

		if (spouseAmount <= 0) {
			errors.push({ field: 'overrideSpouse', message: 'Spouse amount must be greater than 0' });
		}

		// Check that override amounts sum to total amount (with small tolerance for floating point)
		const sum = meAmount + spouseAmount;
		const tolerance = 0.01;
		if (Math.abs(sum - formData.amount) > tolerance) {
			errors.push({
				field: 'overrideTotal',
				message: `Custom split amounts must sum to ${formData.amount.toFixed(2)} (currently ${sum.toFixed(2)})`
			});
		}
	}

	if (formData.type === 'repayment') {
		const borrower = loanSummary.borrowers[formData.paidBy as 'me' | 'spouse'];
		const maxAmount = calculateBorrowerTotalOutstanding(borrower);

		if (formData.amount > maxAmount) {
			errors.push({
				field: 'amount',
				message: `Amount exceeds ${formData.paidBy === 'me' ? 'your' : "spouse's"} outstanding balance`
			});
		}
	}

	return errors;
}

export function isFormValid(errors: ValidationError[]): boolean {
	return errors.length === 0;
}
