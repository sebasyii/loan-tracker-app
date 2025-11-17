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
