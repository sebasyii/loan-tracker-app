<script lang="ts">
	import type {
		TransactionFormData,
		LoanSummary,
		ValidationError,
		Transaction,
		BorrowerSplit
	} from '$lib/types';
	import { formatCurrency, getTodayISODate } from '$lib/utils/formatting';
	import {
		CATEGORY_OPTIONS,
		getDefaultCategoryForType,
		getDefaultPayerForType
	} from '$lib/utils/transaction-helpers';
	import { validateTransactionForm } from '$lib/utils/validation';
	import { calculateBorrowerTotalOutstanding } from '$lib/utils/calculations';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';

	interface Props {
		loanSummary: LoanSummary;
		borrowerSplits: BorrowerSplit[];
		onSubmit: (formData: TransactionFormData) => void;
		isSubmitting?: boolean;
		mode?: 'create' | 'edit';
		initialData?: Transaction | null;
	}

	let {
		loanSummary,
		borrowerSplits,
		onSubmit,
		isSubmitting = false,
		mode = 'create',
		initialData = null
	}: Props = $props();

	function getDefaultFormValues(): TransactionFormData {
		return {
			date: getTodayISODate(),
			type: 'helper_disbursement',
			category: 'booking_fee',
			amount: 0,
			paidBy: 'helper',
			description: ''
		};
	}

	function mapTransactionToFormData(txn: Transaction): TransactionFormData {
		return {
			date: txn.date,
			type: txn.type,
			category: txn.category,
			amount: txn.amount,
			paidBy: txn.paidBy,
			description: txn.description,
			borrowerOverride: txn.borrowerOverride
		};
	}

	// Helper function to get split for a specific date
	function getSplitForDate(date: string): BorrowerSplit {
		const applicableSplits = borrowerSplits.filter((s) => s.effectiveFrom <= date);
		if (applicableSplits.length === 0) {
			// Use the earliest split if transaction is before any split
			return borrowerSplits[borrowerSplits.length - 1];
		}
		// Return the most recent split before or on the transaction date
		return applicableSplits[0];
	}

	let formData = $state<TransactionFormData>(
		initialData && mode === 'edit' ? mapTransactionToFormData(initialData) : getDefaultFormValues()
	);

	let errors = $state<ValidationError[]>([]);
	let lastInitKey = $state<string>(mode === 'edit' && initialData ? `edit-${initialData.id}` : 'create');

	// Custom split state
	let useCustomSplit = $state(false);
	let customMeAmount = $state(0);
	let customSpouseAmount = $state(0);

	$effect(() => {
		if (mode === 'edit' && initialData) {
			const nextKey = `edit-${initialData.id}`;
			if (lastInitKey !== nextKey) {
				formData = mapTransactionToFormData(initialData);
				// Set custom split state from initial data
				if (formData.borrowerOverride) {
					useCustomSplit = true;
					customMeAmount = formData.borrowerOverride.meAmount;
					customSpouseAmount = formData.borrowerOverride.spouseAmount;
				} else {
					useCustomSplit = false;
				}
				errors = [];
				lastInitKey = nextKey;
			}
		} else if (mode === 'create' && lastInitKey !== 'create') {
			formData = getDefaultFormValues();
			useCustomSplit = false;
			errors = [];
			lastInitKey = 'create';
		}
	});

	// Update formData when custom split changes
	$effect(() => {
		if (useCustomSplit && canUseCustomSplit) {
			formData.borrowerOverride = {
				meAmount: customMeAmount,
				spouseAmount: customSpouseAmount
			};
		} else {
			formData.borrowerOverride = undefined;
		}
	});

	function handleTypeChange() {
		formData.category = getDefaultCategoryForType(formData.type);
		formData.paidBy = getDefaultPayerForType(formData.type);
		// Reset custom split when changing type
		if (!canUseCustomSplit) {
			useCustomSplit = false;
		}
	}

	function handleCustomSplitToggle() {
		if (!useCustomSplit && formData.amount > 0 && borrowerSplits.length > 0) {
			// Pre-fill with default split amounts
			const split = getSplitForDate(formData.date);
			customMeAmount = Number((formData.amount * (split.mePercent / 100)).toFixed(2));
			customSpouseAmount = Number((formData.amount * (split.spousePercent / 100)).toFixed(2));
		}
	}

	function handleAmountChange() {
		// Update custom split amounts proportionally when amount changes
		if (useCustomSplit && canUseCustomSplit && formData.amount > 0 && borrowerSplits.length > 0) {
			const split = getSplitForDate(formData.date);
			customMeAmount = Number((formData.amount * (split.mePercent / 100)).toFixed(2));
			customSpouseAmount = Number((formData.amount * (split.spousePercent / 100)).toFixed(2));
		}
	}

	export function handleSubmit(e: Event) {
		e.preventDefault();
		errors = validateTransactionForm(formData, loanSummary);

		if (errors.length === 0) {
			onSubmit(formData);
		}
	}

	function getError(field: string): string | undefined {
		return errors.find((e) => e.field === field)?.message;
	}

	let maxRepaymentAmount = $derived.by(() => {
		if (formData.type !== 'repayment') return 0;
		const borrower = loanSummary.borrowers[formData.paidBy as 'me' | 'spouse'];
		return calculateBorrowerTotalOutstanding(borrower);
	});

	let categoryOptions = $derived(CATEGORY_OPTIONS[formData.type]);
	let payerOptions = $derived(
		formData.type === 'repayment'
			? [
					{ value: 'me', label: 'Me' },
					{ value: 'spouse', label: 'Spouse' }
				]
			: [{ value: 'helper', label: 'Helper' }]
	);

	// Can only use custom split for helper_disbursement and interest_charge
	let canUseCustomSplit = $derived(
		formData.type === 'helper_disbursement' || formData.type === 'interest_charge'
	);

	// Get current split for display
	let currentSplit = $derived.by(() => {
		if (borrowerSplits.length === 0) return null;
		return getSplitForDate(formData.date);
	});

	export function reset() {
		if (mode === 'edit' && initialData) {
			formData = mapTransactionToFormData(initialData);
			if (formData.borrowerOverride) {
				useCustomSplit = true;
				customMeAmount = formData.borrowerOverride.meAmount;
				customSpouseAmount = formData.borrowerOverride.spouseAmount;
			} else {
				useCustomSplit = false;
			}
		} else {
			formData = getDefaultFormValues();
			useCustomSplit = false;
		}
		errors = [];
	}
</script>

<form class="space-y-4" onsubmit={handleSubmit}>
	<Input id="date" label="Date" type="date" bind:value={formData.date} required error={getError('date')} />

	<Select
		id="type"
		label="Type"
		bind:value={formData.type}
		options={[
			{ value: 'helper_disbursement', label: 'Helper Disbursement' },
			{ value: 'interest_charge', label: 'Interest Charge' },
			{ value: 'repayment', label: 'Repayment' }
		]}
		required
		onchange={handleTypeChange}
	/>

	<Select
		id="category"
		label="Category"
		bind:value={formData.category}
		options={categoryOptions}
		required
	/>

	<Input
		id="amount"
		label="Amount"
		type="number"
		bind:value={formData.amount}
		min="0.01"
		step="0.01"
		prefix="$"
		required
		error={getError('amount')}
		onchange={handleAmountChange}
	/>

	{#if canUseCustomSplit && currentSplit}
		<div class="space-y-3 rounded-md border border-gray-300 bg-gray-50 p-4">
			<label class="flex items-center gap-2">
				<input
					type="checkbox"
					bind:checked={useCustomSplit}
					onchange={handleCustomSplitToggle}
					class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
				/>
				<span class="text-sm font-medium text-gray-700">Custom split for this transaction</span>
			</label>

			{#if !useCustomSplit}
				<p class="text-xs text-gray-600">
					Default split ({currentSplit.mePercent}% / {currentSplit.spousePercent}%): Me {formatCurrency(
						formData.amount * (currentSplit.mePercent / 100)
					)}, Spouse {formatCurrency(formData.amount * (currentSplit.spousePercent / 100))}
				</p>
			{/if}

			{#if useCustomSplit}
				<div class="grid grid-cols-2 gap-3">
					<Input
						id="customMeAmount"
						label="Me Amount"
						type="number"
						bind:value={customMeAmount}
						min="0.01"
						step="0.01"
						prefix="$"
						required
						error={getError('overrideMe')}
					/>
					<Input
						id="customSpouseAmount"
						label="Spouse Amount"
						type="number"
						bind:value={customSpouseAmount}
						min="0.01"
						step="0.01"
						prefix="$"
						required
						error={getError('overrideSpouse')}
					/>
				</div>

				{#if getError('overrideTotal')}
					<p class="text-xs text-red-600">{getError('overrideTotal')}</p>
				{:else if customMeAmount + customSpouseAmount === formData.amount}
					<p class="text-xs text-green-600">✓ Amounts sum to {formatCurrency(formData.amount)}</p>
				{/if}
			{/if}
		</div>
	{/if}

	<Select
		id="paidBy"
		label="Paid By"
		bind:value={formData.paidBy}
		options={payerOptions}
		disabled={formData.type !== 'repayment'}
		required
	/>

	{#if formData.type === 'repayment'}
		<p class="text-xs text-gray-600">
			Maximum repayment: {formatCurrency(maxRepaymentAmount)}
		</p>
	{/if}

	<Textarea
		id="description"
		label="Description"
		bind:value={formData.description}
		placeholder="Optional notes about this transaction"
	/>
</form>
