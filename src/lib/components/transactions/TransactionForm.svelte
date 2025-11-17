<script lang="ts">
	import type { TransactionFormData, LoanSummary, ValidationError } from '$lib/types';
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
		onSubmit: (formData: TransactionFormData) => void;
		isSubmitting?: boolean;
	}

	let { loanSummary, onSubmit, isSubmitting = false }: Props = $props();

	let formData = $state<TransactionFormData>({
		date: getTodayISODate(),
		type: 'helper_disbursement',
		category: 'booking_fee',
		amount: 0,
		paidBy: 'helper',
		description: ''
	});

	let errors = $state<ValidationError[]>([]);

	function handleTypeChange() {
		formData.category = getDefaultCategoryForType(formData.type);
		formData.paidBy = getDefaultPayerForType(formData.type);
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

	export function reset() {
		formData = {
			date: getTodayISODate(),
			type: 'helper_disbursement',
			category: 'booking_fee',
			amount: 0,
			paidBy: 'helper',
			description: ''
		};
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
	/>

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
