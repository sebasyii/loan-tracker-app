<script lang="ts">
	import type { LoanSummary } from '$lib/types';
	import { formatCurrency } from '$lib/utils/formatting';
	import { calculateOverallOutstanding } from '$lib/utils/calculations';
	import BorrowerCard from './BorrowerCard.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	interface Props {
		loanSummary: LoanSummary;
	}

	let { loanSummary }: Props = $props();
	let overallOutstanding = $derived(calculateOverallOutstanding(loanSummary.totals));
</script>

<Card>
	<h2 class="mb-4 text-lg font-semibold text-gray-900">Loan Summary</h2>

	<!-- Overall Totals -->
	<div class="mb-6 rounded-md bg-blue-50 p-4">
		<h3 class="mb-3 text-sm font-semibold uppercase text-blue-900">Loan Totals</h3>
		<dl class="space-y-2">
			<div class="flex justify-between text-sm">
				<dt class="text-gray-700">Principal Borrowed</dt>
				<dd class="font-semibold text-gray-900">
					{formatCurrency(loanSummary.totals.principalBorrowed)}
				</dd>
			</div>
			<div class="flex justify-between text-sm">
				<dt class="text-gray-700">Interest Charged</dt>
				<dd class="font-semibold text-gray-900">
					{formatCurrency(loanSummary.totals.interestCharged)}
				</dd>
			</div>
			<div class="flex justify-between text-sm">
				<dt class="text-gray-700">Total Repaid</dt>
				<dd class="font-semibold text-green-700">
					-{formatCurrency(loanSummary.totals.totalRepaid)}
				</dd>
			</div>
			<div class="mt-2 border-t border-blue-200 pt-2">
				<div class="flex justify-between">
					<dt class="font-bold text-gray-900">Overall Outstanding</dt>
					<dd class="text-lg font-bold text-red-600">
						{formatCurrency(overallOutstanding)}
					</dd>
				</div>
			</div>
		</dl>
	</div>

	<!-- Borrower Breakdown -->
	<div class="space-y-4">
		<BorrowerCard name="Me" balance={loanSummary.borrowers.me} />
		<BorrowerCard name="Spouse" balance={loanSummary.borrowers.spouse} />
	</div>
</Card>
