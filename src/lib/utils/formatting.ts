export const LOCALE = 'en-SG';
export const CURRENCY = 'SGD';

export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat(LOCALE, {
		style: 'currency',
		currency: CURRENCY,
		minimumFractionDigits: 0
	}).format(amount);
}

export function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString(LOCALE, {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}

export function getTodayISODate(): string {
	return new Date().toISOString().split('T')[0];
}
