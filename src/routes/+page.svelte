<script lang="ts">
	import type { PageData } from "./$types";
	import type {
		TransactionFormData,
		Transaction,
		BorrowerSplit,
	} from "$lib/types";
	import PropertyCard from "$lib/components/property/PropertyCard.svelte";
	import LoanSummaryCard from "$lib/components/loan/LoanSummaryCard.svelte";
	import BorrowerSplitCard from "$lib/components/loan/BorrowerSplitCard.svelte";
	import TransactionTable from "$lib/components/transactions/TransactionTable.svelte";
	import TransactionModal from "$lib/components/transactions/TransactionModal.svelte";
	import Modal from "$lib/components/ui/Modal.svelte";
	import { formatCurrency, formatDate } from "$lib/utils/formatting";
	import { applyAction, deserialize } from "$app/forms";
	import type { ActionResult } from "@sveltejs/kit";
	import { invalidateAll } from "$app/navigation";

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
	let isTransactionSubmitting = $state(false);
	let isDeleteSubmitting = $state(false);
	let isSplitSubmitting = $state(false);

	async function handlePropertyUpdate(updated: typeof propertyInfo) {
		try {
			const formData = new FormData();
			formData.append("name", updated.name);
			formData.append("basePrice", updated.basePrice.toString());
			formData.append(
				"buyerStampDuty",
				updated.buyerStampDuty.toString(),
			);
			formData.append("otherFees", updated.otherFees.toString());

			const response = await fetch("?/updateProperty", {
				method: "POST",
				body: formData,
			});

			if (response.ok) {
				// SvelteKit will automatically revalidate and update data
				window.location.reload(); // Force reload to get fresh data
			} else {
				console.error("Failed to update property");
				alert("Failed to update property information");
			}
		} catch (error) {
			console.error("Error updating property:", error);
			alert("An error occurred while updating property information");
		}
	}

	function buildTransactionForm(formData: TransactionFormData, id?: string) {
		const form = new FormData();
		if (id) form.append("id", id);
		form.append("date", formData.date);
		form.append("type", formData.type);
		form.append("category", formData.category);
		form.append("paidBy", formData.paidBy);
		form.append("amount", formData.amount.toString());
		form.append("description", formData.description);

		// Add borrower override if present
		if (formData.borrowerOverride) {
			form.append(
				"borrowerOverrideMeAmount",
				formData.borrowerOverride.meAmount.toString(),
			);
			form.append(
				"borrowerOverrideSpouseAmount",
				formData.borrowerOverride.spouseAmount.toString(),
			);
		}

		return form;
	}

	async function submitTransaction(
		action: "addTransaction" | "updateTransaction",
		formData: TransactionFormData,
		id?: string,
	) {
		isTransactionSubmitting = true;
		try {
			const form = buildTransactionForm(formData, id);
			const response = await fetch(`?/${action}`, {
				method: "POST",
				body: form,
			});
			// const result = await response.json().catch(() => ({}));
			const result: ActionResult = deserialize(await response.text());
			console.log(result);

			if (response.ok && result?.type === "success") {
				// closeTransactionModal();
				await invalidateAll();
			}

			// const message =
			// 	result?.message ||
			// 	`Failed to ${action === "addTransaction" ? "add" : "update"} transaction`;
			// console.error(`Failed to ${action}:`, result);
			applyAction(result);
			// alert(message);
		} catch (error) {
			console.error(`Error during ${action}:`, error);
			alert("An error occurred while saving the transaction");
		} finally {
			isTransactionSubmitting = false;
		}
	}

	async function handleAddTransaction(formData: TransactionFormData) {
		return submitTransaction("addTransaction", formData);
	}

	async function handleUpdateTransaction(formData: TransactionFormData) {
		if (!editingTransaction) return;
		return submitTransaction(
			"updateTransaction",
			formData,
			editingTransaction.id,
		);
	}

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

	async function handleDeleteTransaction() {
		if (!transactionToDelete) return;
		isDeleteSubmitting = true;
		try {
			const form = new FormData();
			form.append("id", transactionToDelete.id);
			const response = await fetch("?/deleteTransaction", {
				method: "POST",
				body: form,
			});
			const result = await response.json().catch(() => ({}));

			if (response.ok && result?.success) {
				closeDeleteModal();
				window.location.reload();
				return;
			}

			const message = result?.message || "Failed to delete transaction";
			console.error("Failed to delete transaction:", result);
			alert(message);
		} catch (error) {
			console.error("Error deleting transaction:", error);
			alert("An error occurred while deleting the transaction");
		} finally {
			isDeleteSubmitting = false;
		}
	}

	async function handleSaveBorrowerSplit(data: {
		effectiveFrom: string;
		mePercent: number;
		spousePercent: number;
	}) {
		isSplitSubmitting = true;
		try {
			const form = new FormData();
			form.append("effectiveFrom", data.effectiveFrom);
			form.append("mePercent", data.mePercent.toString());
			form.append("spousePercent", data.spousePercent.toString());
			const response = await fetch("?/addBorrowerSplit", {
				method: "POST",
				body: form,
			});
			const result = await response.json().catch(() => ({}));

			console.log(result);

			if (response.ok && result?.type === "success") {
				window.location.reload();
				return;
			}

			const message = result?.message || "Failed to save borrower split";
			console.error("Failed to save borrower split:", result);
			alert(message);
		} catch (error) {
			console.error("Error saving borrower split:", error);
			alert("An error occurred while saving the borrower split");
		} finally {
			isSplitSubmitting = false;
		}
	}
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
					<PropertyCard
						{propertyInfo}
						onUpdate={handlePropertyUpdate}
					/>
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
							onSave={handleSaveBorrowerSplit}
							isSaving={isSplitSubmitting}
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
	onSubmit={transactionModalMode === "edit"
		? handleUpdateTransaction
		: handleAddTransaction}
	isSubmitting={isTransactionSubmitting}
/>

<!-- Delete Transaction Modal -->
<Modal
	open={showDeleteModal}
	title="Delete Transaction"
	onClose={closeDeleteModal}
>
	{#snippet children()}
		<p class="text-sm text-gray-600">
			Are you sure you want to delete{" "}
			<strong>{formatCurrency(transactionToDelete?.amount || 0)}</strong>
			from{" "}
			{transactionToDelete
				? formatDate(transactionToDelete.date)
				: "this transaction"}? This action cannot be undone.
		</p>
	{/snippet}

	{#snippet footer()}
		<div class="flex justify-end gap-2">
			<button
				type="button"
				class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				onclick={closeDeleteModal}
				disabled={isDeleteSubmitting}
			>
				Cancel
			</button>
			<button
				type="button"
				class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
				onclick={handleDeleteTransaction}
				disabled={isDeleteSubmitting}
			>
				{isDeleteSubmitting ? "Deleting..." : "Delete"}
			</button>
		</div>
	{/snippet}
</Modal>
