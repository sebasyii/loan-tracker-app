<script lang="ts">
	import type { TransactionFormData, LoanSummary, Transaction, BorrowerSplit } from '$lib/types';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TransactionForm from './TransactionForm.svelte';

	interface Props {
		open: boolean;
		loanSummary: LoanSummary;
		borrowerSplits: BorrowerSplit[];
		mode?: 'create' | 'edit';
		initialData?: Transaction | null;
		onClose: () => void;
		onSubmit: (formData: TransactionFormData) => void;
		isSubmitting?: boolean;
	}

	let {
		open = $bindable(),
		loanSummary,
		borrowerSplits,
		mode = 'create',
		initialData = null,
		onClose,
		onSubmit,
		isSubmitting = false
	}: Props = $props();
	let formComponent: TransactionForm | undefined = $state();
	let localSubmitting = $state(false);

	async function handleSubmit(formData: TransactionFormData) {
		localSubmitting = true;
		try {
			await onSubmit(formData);
			formComponent?.reset();
			onClose();
		} catch (error) {
			console.error('Failed to submit transaction:', error);
		} finally {
			localSubmitting = false;
		}
	}

	function handleClose() {
		if (!localSubmitting && !isSubmitting) {
			formComponent?.reset();
			onClose();
		}
	}

	let title = $derived(mode === 'edit' ? 'Edit Transaction' : 'Add Transaction');
	let submitLabel = $derived(() => {
		if (isSubmitting || localSubmitting) {
			return mode === 'edit' ? 'Saving...' : 'Adding...';
		}
		return mode === 'edit' ? 'Save Changes' : 'Add Transaction';
	});
</script>

<Modal {open} {title} onClose={handleClose}>
	{#snippet children()}
		<TransactionForm
			bind:this={formComponent}
			{loanSummary}
			{borrowerSplits}
			{isSubmitting}
			onSubmit={handleSubmit}
			{mode}
			initialData={initialData}
		/>
	{/snippet}

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="secondary" onclick={handleClose} disabled={isSubmitting || localSubmitting}>
				Cancel
			</Button>
			<Button
				type="submit"
				variant="primary"
				disabled={isSubmitting || localSubmitting}
				onclick={() => formComponent?.handleSubmit(new Event('submit'))}
			>
				{submitLabel}
			</Button>
		</div>
	{/snippet}
</Modal>
