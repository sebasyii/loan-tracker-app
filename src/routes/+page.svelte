<script lang="ts">
	import type { PageData } from "./$types";
	import type { Transaction, BorrowerSplit } from "$lib/types";
	import PropertyCard from "$lib/components/property/PropertyCard.svelte";
	import LoanSummaryCard from "$lib/components/loan/LoanSummaryCard.svelte";
	import BorrowerSplitCard from "$lib/components/loan/BorrowerSplitCard.svelte";
	import TransactionTable from "$lib/components/transactions/TransactionTable.svelte";
	import TransactionModal from "$lib/components/transactions/TransactionModal.svelte";
	import Modal from "$lib/components/ui/Modal.svelte";
	import { formatCurrency, formatDate } from "$lib/utils/formatting";
	import { enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import type { SubmitFunction } from "@sveltejs/kit";

	// PageData is auto-generated from load function return type
	let { data }: { data: PageData } = $props();

	// Access server data - automatically typed and reactive
	let propertyInfo = $derived(data.propertyInfo);
	let loanSummary = $derived(data.loanSummary);
	let transactions = $derived(data.transactions);
	let borrowerSplits = $derived(
		(data.borrowerSplits as BorrowerSplit[] | undefined) ?? [],
	);

	let showTransactionModal = $state(false);
	let transactionModalMode = $state<"create" | "edit">("create");
	let editingTransaction = $state<Transaction | null>(null);
	let showDeleteModal = $state(false);
	let transactionToDelete = $state<Transaction | null>(null);
	let isDeleteSubmitting = $state(false);

	function openTransactionModal() {
		transactionModalMode = "create";
		editingTransaction = null;
		showTransactionModal = true;
	}

	function closeTransactionModal() {
		showTransactionModal = false;
		transactionModalMode = "create";
		editingTransaction = null;
	}

	function handleEditTransaction(transaction: Transaction) {
		transactionModalMode = "edit";
		editingTransaction = transaction;
		showTransactionModal = true;
	}

	function handleRequestDelete(transaction: Transaction) {
		transactionToDelete = transaction;
		showDeleteModal = true;
	}

	function closeDeleteModal() {
		if (isDeleteSubmitting) return;
		showDeleteModal = false;
		transactionToDelete = null;
	}

	const handleDeleteSubmit: SubmitFunction = () => {
		isDeleteSubmitting = true;

		return async ({ result }) => {
			isDeleteSubmitting = false;

			if (result.type === "success") {
				await invalidateAll();
				closeDeleteModal();
			} else if (result.type === "failure") {
				const message = result.data?.message || "Failed to delete transaction";
				alert(message);
			}
		};
	};
</script>

<svelte:head>
	<title>Loan Tracker</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
	<div class="mx-auto max-w-7xl">
		<!-- Page Header -->
		<header class="mb-6">
			<h1 class="text-3xl font-bold text-gray-900">Loan Tracker</h1>
			<p class="mt-1 text-sm text-gray-600">
				Track property loans, interest, and repayments
			</p>
		</header>

		<!-- Main Content -->
		<main>
			<!-- Property Info & Loan Summary -->
			<div class="mb-6 grid gap-6 md:grid-cols-2">
				<section aria-labelledby="property-heading">
					<h2 id="property-heading" class="sr-only">
						Property Information
					</h2>
					<PropertyCard {propertyInfo} />
				</section>

				<div class="space-y-6">
					<section aria-labelledby="loan-heading">
						<h2 id="loan-heading" class="sr-only">Loan Summary</h2>
						<LoanSummaryCard {loanSummary} />
					</section>

					<section aria-labelledby="split-heading">
						<h2 id="split-heading" class="sr-only">
							Borrower Split
						</h2>
						<BorrowerSplitCard
							currentSplit={borrowerSplits?.[0] ?? null}
							history={borrowerSplits ?? []}
						/>
					</section>
				</div>
			</div>

			<!-- Transactions -->
			<section aria-labelledby="transactions-heading">
				<h2 id="transactions-heading" class="sr-only">Transactions</h2>
				<TransactionTable
					{transactions}
					onAddTransaction={openTransactionModal}
					onEditTransaction={handleEditTransaction}
					onDeleteTransaction={handleRequestDelete}
				/>
			</section>
		</main>
	</div>
</div>

<!-- Transaction Modal -->
<TransactionModal
	bind:open={showTransactionModal}
	{loanSummary}
	{borrowerSplits}
	mode={transactionModalMode}
	initialData={editingTransaction}
	onClose={closeTransactionModal}
/>

<!-- Delete Transaction Modal -->
<Modal
	open={showDeleteModal}
	title="Delete Transaction"
	onClose={closeDeleteModal}
>
	{#snippet children()}
		<p class="text-sm text-gray-600 mb-4">
			Are you sure you want to delete{" "}
			<strong>{formatCurrency(transactionToDelete?.amount || 0)}</strong>
			from{" "}
			{transactionToDelete
				? formatDate(transactionToDelete.date)
				: "this transaction"}? This action cannot be undone.
		</p>

		<form
			method="POST"
			action="?/deleteTransaction"
			use:enhance={handleDeleteSubmit}
			class="flex justify-end gap-2"
		>
			<input type="hidden" name="id" value={transactionToDelete?.id ?? ""} />
			<button
				type="button"
				class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				onclick={closeDeleteModal}
				disabled={isDeleteSubmitting}
			>
				Cancel
			</button>
			<button
				type="submit"
				class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
				disabled={isDeleteSubmitting}
			>
				{isDeleteSubmitting ? "Deleting..." : "Delete"}
			</button>
		</form>
	{/snippet}
</Modal>
