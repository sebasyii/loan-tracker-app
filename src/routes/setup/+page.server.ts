import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import {
	getPropertyInfo,
	createPropertyInfo,
	getCurrentBorrowerSplit,
	createBorrowerSplit
} from '$lib/server/db/queries';
import type { PropertyInfo } from '$lib/types';

/**
 * Load function - Check if setup is already complete
 * If property exists, redirect to main page
 */
export const load: PageServerLoad = async () => {
	const property = await getPropertyInfo();

	// If property already exists, redirect to main app
	if (property) {
		throw redirect(303, '/');
	}

	// Return empty data for setup page
	return {};
};

/**
 * Form action - Create initial property and borrower split
 */
export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		// Property data
		const name = formData.get('name')?.toString();
		const basePrice = Number(formData.get('basePrice'));
		const buyerStampDuty = Number(formData.get('buyerStampDuty'));
		const otherFees = Number(formData.get('otherFees'));

		// Borrower split data
		const mePercent = Number(formData.get('mePercent'));
		const spousePercent = Number(formData.get('spousePercent'));

		// Validation
		if (!name || !name.trim()) {
			console.log(name);
			return fail(400, {
				error: 'validation',
				message: 'Property name is required',
				values: { name, basePrice, buyerStampDuty, otherFees, mePercent, spousePercent }
			});
		}

		if (isNaN(basePrice) || basePrice <= 0) {
			return fail(400, {
				error: 'validation',
				message: 'Base price must be a positive number',
				values: { name, basePrice, buyerStampDuty, otherFees, mePercent, spousePercent }
			});
		}

		if (isNaN(buyerStampDuty) || buyerStampDuty < 0) {
			return fail(400, {
				error: 'validation',
				message: 'Buyer stamp duty must be a non-negative number',
				values: { name, basePrice, buyerStampDuty, otherFees, mePercent, spousePercent }
			});
		}

		if (isNaN(otherFees) || otherFees < 0) {
			return fail(400, {
				error: 'validation',
				message: 'Other fees must be a non-negative number',
				values: { name, basePrice, buyerStampDuty, otherFees, mePercent, spousePercent }
			});
		}

		if (isNaN(mePercent) || mePercent < 0 || mePercent > 100) {
			return fail(400, {
				error: 'validation',
				message: 'Your split percentage must be between 0 and 100',
				values: { name, basePrice, buyerStampDuty, otherFees, mePercent, spousePercent }
			});
		}

		if (isNaN(spousePercent) || spousePercent < 0 || spousePercent > 100) {
			return fail(400, {
				error: 'validation',
				message: "Spouse's split percentage must be between 0 and 100",
				values: { name, basePrice, buyerStampDuty, otherFees, mePercent, spousePercent }
			});
		}

		if (mePercent + spousePercent !== 100) {
			return fail(400, {
				error: 'validation',
				message: 'Split percentages must add up to 100%',
				values: { name, basePrice, buyerStampDuty, otherFees, mePercent, spousePercent }
			});
		}

		try {
			// Create property
			const propertyData: PropertyInfo = {
				name: name.trim(),
				basePrice,
				buyerStampDuty,
				otherFees
			};

			await createPropertyInfo(propertyData);

			// Create initial borrower split (effective from today)
			const today = new Date().toISOString().split('T')[0];
			await createBorrowerSplit(today, mePercent, spousePercent);

			// Redirect to main app
			throw redirect(303, '/');
		} catch (err) {
			// If it's a redirect, re-throw it
			if (err && typeof err === 'object' && 'status' in err && 'location' in err) {
				throw err;
			}

			console.error('Error creating property:', err);
			return fail(500, {
				error: 'database',
				message: 'Failed to create property. Please try again.',
				values: { name, basePrice, buyerStampDuty, otherFees, mePercent, spousePercent }
			});
		}
	}
};
