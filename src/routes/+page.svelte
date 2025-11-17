<script lang="ts">
	import type { PropertyInfo, LoanSummary, Transaction, TransactionFormData } from '$lib/types';
	import PropertyCard from '$lib/components/property/PropertyCard.svelte';
	import LoanSummaryCard from '$lib/components/loan/LoanSummaryCard.svelte';
	import TransactionTable from '$lib/components/transactions/TransactionTable.svelte';
	import TransactionModal from '$lib/components/transactions/TransactionModal.svelte';

	// Mock data - will be replaced with database queries
	let propertyInfo = $state<PropertyInfo>({
		name: 'EC at Punggol',
		basePrice: 650000,
		buyerStampDuty: 19600,
		otherFees: 5000
	});

	let loanSummary = $state<LoanSummary>({
		totals: {
			principalBorrowed: 125000,
			interestCharged: 3250,
			totalRepaid: 30000,
			outstandingPrincipal: 95000,
			outstandingInterest: 3250
		},
		borrowers: {
			me: {
				principalOwed: 57000,
				interestOwed: 1950,
				totalPaidHistorically: 20000
			},
			spouse: {
				principalOwed: 38000,
				interestOwed: 1300,
				totalPaidHistorically: 10000
			}
		}
	});

	let transactions = $state<Transaction[]>([
		{
			id: '1',
			date: '2024-01-15',
			type: 'helper_disbursement',
			category: 'booking_fee',
			paidBy: 'helper',
			amount: 5000,
			description: 'Initial booking fee'
		},
		{
			id: '2',
			date: '2024-02-01',
			type: 'helper_disbursement',
			category: 'down_payment',
			paidBy: 'helper',
			amount: 100000,
			description: 'Down payment to developer'
		},
		{
			id: '3',
			date: '2024-03-15',
			type: 'interest_charge',
			category: 'interest',
			paidBy: 'helper',
			amount: 1250,
			description: 'Q1 bank loan interest'
		},
		{
			id: '4',
			date: '2024-04-01',
			type: 'repayment',
			category: 'repayment',
			paidBy: 'me',
			amount: 15000,
			description: 'First repayment'
		}
	]);

	let showTransactionModal = $state(false);

	function handlePropertyUpdate(updated: PropertyInfo) {
		propertyInfo = updated;
		// TODO: Persist to database
	}

	function handleAddTransaction(formData: TransactionFormData) {
		const newTransaction: Transaction = {
			...formData,
			id: crypto.randomUUID()
		};
		transactions = [...transactions, newTransaction].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
		);
		// TODO: Recalculate loan summary and persist to database
	}

	function openTransactionModal() {
		showTransactionModal = true;
	}
</script>

<div class="min-h-screen bg-gray-50 p-6">
	<div class="mx-auto max-w-7xl">
		<!-- Page Header -->
		<header class="mb-6">
			<h1 class="text-3xl font-bold text-gray-900">Loan Tracker</h1>
			<p class="mt-1 text-sm text-gray-600">Track property loans, interest, and repayments</p>
		</header>

		<!-- Main Content -->
		<main>
			<!-- Property Info & Loan Summary -->
			<div class="mb-6 grid gap-6 md:grid-cols-2">
				<section aria-labelledby="property-heading">
					<h2 id="property-heading" class="sr-only">Property Information</h2>
					<PropertyCard {propertyInfo} onUpdate={handlePropertyUpdate} />
				</section>

				<section aria-labelledby="loan-heading">
					<h2 id="loan-heading" class="sr-only">Loan Summary</h2>
					<LoanSummaryCard {loanSummary} />
				</section>
			</div>

			<!-- Transactions -->
			<section aria-labelledby="transactions-heading">
				<h2 id="transactions-heading" class="sr-only">Transactions</h2>
				<TransactionTable {transactions} onAddTransaction={openTransactionModal} />
			</section>
		</main>
	</div>
</div>

<!-- Transaction Modal -->
<TransactionModal
	bind:open={showTransactionModal}
	{loanSummary}
	onClose={() => (showTransactionModal = false)}
	onSubmit={handleAddTransaction}
/>
