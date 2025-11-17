import type {
	TransactionType,
	TransactionCategory,
	CategoryOptionsMap,
	TransactionTypeLabels,
	Payer
} from '$lib/types';

export const TRANSACTION_TYPE_LABELS: TransactionTypeLabels = {
	helper_disbursement: 'Helper Disbursement',
	interest_charge: 'Interest Charge',
	repayment: 'Repayment'
} as const;

export const CATEGORY_OPTIONS: CategoryOptionsMap = {
	helper_disbursement: [
		{ value: 'booking_fee', label: 'Booking Fee' },
		{ value: 'down_payment', label: 'Down Payment' },
		{ value: 'stamp_duty', label: 'Stamp Duty' },
		{ value: 'progress_payment', label: 'Progress Payment' },
		{ value: 'misc_property', label: 'Misc Property' }
	],
	interest_charge: [{ value: 'interest', label: 'Interest' }],
	repayment: [{ value: 'repayment', label: 'Repayment' }]
} as const;

export function getCategoryLabel(type: TransactionType, category: string): string {
	const options = CATEGORY_OPTIONS[type];
	return options?.find((opt) => opt.value === category)?.label || category;
}

export function getDefaultCategoryForType(type: TransactionType): TransactionCategory {
	return CATEGORY_OPTIONS[type][0].value;
}

export function getDefaultPayerForType(type: TransactionType): Payer {
	return type === 'repayment' ? 'me' : 'helper';
}
