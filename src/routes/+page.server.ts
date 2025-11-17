import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import {
	getPropertyInfo,
	getTransactions,
	calculateLoanSummary,
	updatePropertyInfo,
	addTransaction,
	updateTransaction,
	deleteTransaction,
	getTransactionById,
	getBorrowerSplits,
	createBorrowerSplit
} from '$lib/server/db/queries';
import { validateTransactionForm } from '$lib/utils/validation';
import type { TransactionFormData, PropertyInfo } from '$lib/types';

/**
 * Load function - Fetches all data needed for the page
 * Runs on server, automatically re-runs after form actions complete
 *
 * If no property exists, redirects to setup wizard
 */
export const load: PageServerLoad = async () => {
	// 1. Early-exit for redirect — no try/catch
	const property = await getPropertyInfo();

	if (!property) {
		// This throws and stops execution, as per SvelteKit docs
		throw redirect(303, '/setup');
	}

	// 2. Normal happy-path data fetching
	try {
		const [transactions, loanSummary, borrowerSplits] = await Promise.all([
			getTransactions(),
			calculateLoanSummary(),
			getBorrowerSplits()
		]);

		return {
			propertyInfo: property,
			transactions,
			loanSummary,
			borrowerSplits
		};
	} catch (err) {
		// 3. Only handle *real* errors here
		console.error('Error loading page data:', err);
		throw error(500, 'Failed to load data. Please try again later.');
	}
};

/**
 * Form actions - Handle mutations (create/update/delete)
 * Data automatically revalidates after actions run
 */
export const actions: Actions = {
	/**
	 * Update property information
	 */
	updateProperty: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		const basePrice = Number(formData.get('basePrice'));
		const buyerStampDuty = Number(formData.get('buyerStampDuty'));
		const otherFees = Number(formData.get('otherFees'));

		// Server-side validation
		if (!name || !name.trim()) {
			return fail(400, {
				error: 'validation',
				message: 'Property name is required'
			});
		}

		if (isNaN(basePrice) || basePrice <= 0) {
			return fail(400, {
				error: 'validation',
				message: 'Base price must be a positive number'
			});
		}

		if (isNaN(buyerStampDuty) || buyerStampDuty < 0) {
			return fail(400, {
				error: 'validation',
				message: 'Buyer stamp duty must be a non-negative number'
			});
		}

		if (isNaN(otherFees) || otherFees < 0) {
			return fail(400, {
				error: 'validation',
				message: 'Other fees must be a non-negative number'
			});
		}

		try {
			const propertyData: PropertyInfo = {
				name: name.trim(),
				basePrice,
				buyerStampDuty,
				otherFees
			};

			await updatePropertyInfo(propertyData);

			return { success: true, type: 'property_updated' };
		} catch (err) {
			console.error('Error updating property:', err);
			return fail(500, {
				error: 'database',
				message: 'Failed to update property information'
			});
		}
	},

	/**
	 * Add new transaction
	 */
	addTransaction: async ({ request }) => {
		const formData = await request.formData();

		const transactionData: TransactionFormData = {
			date: formData.get('date')?.toString() || '',
			type: formData.get('type')?.toString() as any,
			category: formData.get('category')?.toString() as any,
			paidBy: formData.get('paidBy')?.toString() as any,
			amount: Number(formData.get('amount')),
			description: formData.get('description')?.toString() || ''
		};

		// Server-side validation
		if (!transactionData.date) {
			return fail(400, {
				error: 'validation',
				message: 'Date is required'
			});
		}

		const validTypes = ['helper_disbursement', 'interest_charge', 'repayment'];
		if (!validTypes.includes(transactionData.type)) {
			return fail(400, {
				error: 'validation',
				message: 'Invalid transaction type'
			});
		}

		if (isNaN(transactionData.amount) || transactionData.amount <= 0) {
			return fail(400, {
				error: 'validation',
				message: 'Amount must be a positive number'
			});
		}

		// For repayment transactions, validate against loan summary
		if (transactionData.type === 'repayment') {
			try {
				const loanSummary = await calculateLoanSummary();
				const errors = validateTransactionForm(transactionData, loanSummary);

				if (errors.length > 0) {
					return fail(400, {
						error: 'validation',
						message: errors[0].message
					});
				}
			} catch (err) {
				console.error('Error validating repayment:', err);
				return fail(500, {
					error: 'validation',
					message: 'Failed to validate repayment amount'
				});
			}
		}

		try {
			await addTransaction(transactionData);

			return { success: true, type: 'transaction_added' };
		} catch (err) {
			console.error('Error adding transaction:', err);
			return fail(500, {
				error: 'database',
				message: 'Failed to add transaction'
			});
		}
	},

	/**
	 * Update an existing transaction
	 */
	updateTransaction: async ({ request }) => {
		const formData = await request.formData();

		const id = formData.get('id')?.toString();
		if (!id) {
			return fail(400, {
				error: 'validation',
				message: 'Missing transaction id'
			});
		}

		const existing = await getTransactionById(id);
		if (!existing) {
			return fail(404, {
				error: 'not_found',
				message: 'Transaction not found'
			});
		}

		const transactionData: TransactionFormData = {
			date: formData.get('date')?.toString() || '',
			type: formData.get('type')?.toString() as any,
			category: formData.get('category')?.toString() as any,
			paidBy: formData.get('paidBy')?.toString() as any,
			amount: Number(formData.get('amount')),
			description: formData.get('description')?.toString() || ''
		};

		if (!transactionData.date) {
			return fail(400, {
				error: 'validation',
				message: 'Date is required'
			});
		}

		const validTypes = ['helper_disbursement', 'interest_charge', 'repayment'];
		if (!validTypes.includes(transactionData.type)) {
			return fail(400, {
				error: 'validation',
				message: 'Invalid transaction type'
			});
		}

		if (isNaN(transactionData.amount) || transactionData.amount <= 0) {
			return fail(400, {
				error: 'validation',
				message: 'Amount must be a positive number'
			});
		}

		if (transactionData.type === 'repayment') {
			try {
				const loanSummary = await calculateLoanSummary();
				const errors = validateTransactionForm(transactionData, loanSummary);

				if (errors.length > 0) {
					return fail(400, {
						error: 'validation',
						message: errors[0].message
					});
				}
			} catch (err) {
				console.error('Error validating repayment:', err);
				return fail(500, {
					error: 'validation',
					message: 'Failed to validate repayment amount'
				});
			}
		}

		try {
			await updateTransaction(id, transactionData);
			return { success: true, type: 'transaction_updated' };
		} catch (err) {
			console.error('Error updating transaction:', err);
			return fail(500, {
				error: 'database',
				message: 'Failed to update transaction'
			});
		}
	},

	/**
	 * Delete transaction
	 */
	deleteTransaction: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, {
				error: 'validation',
				message: 'Missing transaction id'
			});
		}

		const existing = await getTransactionById(id);
		if (!existing) {
			return fail(404, {
				error: 'not_found',
				message: 'Transaction not found'
			});
		}

		try {
			await deleteTransaction(id);
			return { success: true, type: 'transaction_deleted' };
		} catch (err) {
			console.error('Error deleting transaction:', err);
			return fail(500, {
				error: 'database',
				message: 'Failed to delete transaction'
			});
		}
	},

	/**
	 * Add a new borrower split record
	 */
	addBorrowerSplit: async ({ request }) => {
		const formData = await request.formData();
		const effectiveFrom = formData.get('effectiveFrom')?.toString() || '';
		const mePercent = Number(formData.get('mePercent'));
		const spousePercent = Number(formData.get('spousePercent'));

		if (!effectiveFrom) {
			return fail(400, {
				error: 'validation',
				message: 'Effective date is required'
			});
		}

		if (
			[mePercent, spousePercent].some(
				(value) => isNaN(value) || value < 0 || value > 100 || !Number.isInteger(value)
			) ||
			mePercent + spousePercent !== 100
		) {
			return fail(400, {
				error: 'validation',
				message: 'Split percentages must be between 0-100 and sum to 100%'
			});
		}

		try {
			await createBorrowerSplit(effectiveFrom, mePercent, spousePercent);
			return { success: true, type: 'borrower_split_added' };
		} catch (err) {
			console.error('Error adding borrower split:', err);
			return fail(500, {
				error: 'database',
				message: 'Failed to save borrower split'
			});
		}
	}
};
