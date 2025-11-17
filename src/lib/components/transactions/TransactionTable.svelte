<script lang="ts">
	import type { Transaction, TransactionType } from '$lib/types';
	import { formatCurrency, formatDate } from '$lib/utils/formatting';
	import { TRANSACTION_TYPE_LABELS, getCategoryLabel } from '$lib/utils/transaction-helpers';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	interface Props {
		transactions: Transaction[];
		onAddTransaction: () => void;
	}

	let { transactions, onAddTransaction }: Props = $props();
	let filterType = $state<TransactionType | 'all'>('all');

	let filteredTransactions = $derived(
		filterType === 'all' ? transactions : transactions.filter((t) => t.type === filterType)
	);

	function getBadgeVariant(type: TransactionType): 'purple' | 'orange' | 'green' {
		if (type === 'helper_disbursement') return 'purple';
		if (type === 'interest_charge') return 'orange';
		return 'green';
	}
</script>

<Card class="!p-0">
	<div class="border-b border-gray-200 px-6 py-4">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<h2 class="text-lg font-semibold text-gray-900">Transactions</h2>

			<div class="flex items-center gap-3">
				<div class="flex items-center gap-2">
					<label for="filter" class="text-sm font-medium text-gray-700">Filter:</label>
					<select
						id="filter"
						bind:value={filterType}
						class="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					>
						<option value="all">All Types</option>
						<option value="helper_disbursement">Helper Disbursement</option>
						<option value="interest_charge">Interest Charge</option>
						<option value="repayment">Repayment</option>
					</select>
				</div>

				<Button variant="primary" onclick={onAddTransaction}>+ Add Transaction</Button>
			</div>
		</div>
	</div>

	<div class="overflow-x-auto">
		{#if filteredTransactions.length === 0}
			<div class="px-6 py-12 text-center">
				<p class="text-gray-500">No transactions yet</p>
			</div>
		{:else}
			<table class="w-full">
				<caption class="sr-only">
					Transaction history showing {filteredTransactions.length} transactions
				</caption>
				<thead class="bg-gray-50">
					<tr>
						<th scope="col" class="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700">
							Date
						</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700">
							Type
						</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700">
							Category
						</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700">
							Paid By
						</th>
						<th scope="col" class="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-700">
							Amount
						</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700">
							Description
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each filteredTransactions as transaction}
						<tr class="hover:bg-gray-50">
							<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
								<time datetime={transaction.date}>
									{formatDate(transaction.date)}
								</time>
							</td>
							<td class="whitespace-nowrap px-6 py-4 text-sm">
								<Badge
									variant={getBadgeVariant(transaction.type)}
									label={TRANSACTION_TYPE_LABELS[transaction.type]}
								/>
							</td>
							<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
								{getCategoryLabel(transaction.type, transaction.category)}
							</td>
							<td class="whitespace-nowrap px-6 py-4 text-sm capitalize text-gray-700">
								{transaction.paidBy}
							</td>
							<td
								class="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold {transaction.type ===
								'repayment'
									? 'text-green-700'
									: 'text-gray-900'}"
							>
								{transaction.type === 'repayment' ? '-' : ''}{formatCurrency(transaction.amount)}
							</td>
							<td class="px-6 py-4 text-sm text-gray-600">
								{transaction.description || '-'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</Card>
