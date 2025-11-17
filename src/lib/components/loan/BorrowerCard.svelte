<script lang="ts">
	import type { BorrowerBalance } from '$lib/types';
	import { formatCurrency } from '$lib/utils/formatting';
	import { calculateBorrowerTotalOutstanding } from '$lib/utils/calculations';

	interface Props {
		name: string;
		balance: BorrowerBalance;
	}

	let { name, balance }: Props = $props();
	let totalOutstanding = $derived(calculateBorrowerTotalOutstanding(balance));
</script>

<div class="rounded-md border border-gray-200 p-4">
	<h3 class="mb-2 text-sm font-semibold text-gray-900">{name}</h3>
	<dl class="space-y-1 text-sm">
		<div class="flex justify-between">
			<dt class="text-gray-600">Principal Owed</dt>
			<dd class="font-medium text-gray-900">
				{formatCurrency(balance.principalOwed)}
			</dd>
		</div>
		<div class="flex justify-between">
			<dt class="text-gray-600">Interest Owed</dt>
			<dd class="font-medium text-gray-900">
				{formatCurrency(balance.interestOwed)}
			</dd>
		</div>
		<div class="flex justify-between border-t border-gray-200 pt-1">
			<dt class="font-semibold text-gray-900">Total Outstanding</dt>
			<dd class="font-bold text-red-600">
				{formatCurrency(totalOutstanding)}
			</dd>
		</div>
		<div class="flex justify-between text-xs">
			<dt class="text-gray-500">Total Paid</dt>
			<dd class="text-gray-700">
				{formatCurrency(balance.totalPaidHistorically)}
			</dd>
		</div>
	</dl>
</div>
