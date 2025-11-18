<script lang="ts">
	import type { LoanSummary, Transaction, BorrowerSplit } from '$lib/types';
	import Modal from '$lib/components/ui/Modal.svelte';
	import TransactionForm from './TransactionForm.svelte';

	interface Props {
		open: boolean;
		loanSummary: LoanSummary;
		borrowerSplits: BorrowerSplit[];
		mode?: 'create' | 'edit';
		initialData?: Transaction | null;
		onClose: () => void;
	}

	let {
		open = $bindable(),
		loanSummary,
		borrowerSplits,
		mode = 'create',
		initialData = null,
		onClose
	}: Props = $props();

	function handleSuccess() {
		onClose();
	}

	let title = $derived(mode === 'edit' ? 'Edit Transaction' : 'Add Transaction');
</script>

<Modal {open} {title} onClose={onClose}>
	{#snippet children()}
		<TransactionForm
			{loanSummary}
			{borrowerSplits}
			{mode}
			{initialData}
			onSuccess={handleSuccess}
			onCancel={onClose}
		/>
	{/snippet}
</Modal>
