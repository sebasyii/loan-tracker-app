<script lang="ts">
	import type { TransactionFormData, LoanSummary } from '$lib/types';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TransactionForm from './TransactionForm.svelte';

	interface Props {
		open: boolean;
		loanSummary: LoanSummary;
		onClose: () => void;
		onSubmit: (formData: TransactionFormData) => void;
	}

	let { open = $bindable(), loanSummary, onClose, onSubmit }: Props = $props();
	let formComponent: TransactionForm | undefined = $state();
	let isSubmitting = $state(false);

	async function handleSubmit(formData: TransactionFormData) {
		isSubmitting = true;
		try {
			await onSubmit(formData);
			formComponent?.reset();
			onClose();
		} catch (error) {
			console.error('Failed to submit transaction:', error);
		} finally {
			isSubmitting = false;
		}
	}

	function handleClose() {
		if (!isSubmitting) {
			formComponent?.reset();
			onClose();
		}
	}
</script>

<Modal {open} title="Add Transaction" onClose={handleClose}>
	{#snippet children()}
		<TransactionForm bind:this={formComponent} {loanSummary} onSubmit={handleSubmit} {isSubmitting} />
	{/snippet}

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="secondary" onclick={handleClose} disabled={isSubmitting}>Cancel</Button>
			<Button
				type="submit"
				variant="primary"
				disabled={isSubmitting}
				onclick={() => formComponent?.handleSubmit(new Event('submit'))}
			>
				{isSubmitting ? 'Adding...' : 'Add Transaction'}
			</Button>
		</div>
	{/snippet}
</Modal>
