<script lang="ts">
	import type { BorrowerSplit } from '$lib/types';
	import { formatDate, getTodayISODate } from '$lib/utils/formatting';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	interface Props {
		currentSplit: BorrowerSplit | null;
		history: BorrowerSplit[];
	}

	let { currentSplit, history = [] }: Props = $props();

	let editing = $state(false);
	let formData = $state({
		effectiveFrom: getTodayISODate(),
		mePercent: currentSplit?.mePercent ?? 50,
		spousePercent: currentSplit?.spousePercent ?? 50
	});
	let error = $state<string | null>(null);
	let isSubmitting = $state(false);

	function startEditing() {
		formData = {
			effectiveFrom: getTodayISODate(),
			mePercent: currentSplit?.mePercent ?? 50,
			spousePercent: currentSplit?.spousePercent ?? 50
		};
		error = null;
		editing = true;
	}

	function handleCancel() {
		editing = false;
		error = null;
	}

	function handleInputChange() {
		const total = Number(formData.mePercent) + Number(formData.spousePercent);
		error = total === 100 ? null : 'Split must total 100%';
	}

	function validateForm(): boolean {
		const mePercent = Number(formData.mePercent);
		const spousePercent = Number(formData.spousePercent);

		if (isNaN(mePercent) || isNaN(spousePercent)) {
			error = 'Percentages are required';
			return false;
		}

		if (mePercent + spousePercent !== 100) {
			error = 'Split must total 100%';
			return false;
		}

		error = null;
		return true;
	}

	const handleSubmit: SubmitFunction = () => {
		if (!validateForm()) {
			return () => {}; // Return empty function to cancel submission
		}

		isSubmitting = true;

		return async ({ result }) => {
			isSubmitting = false;

			if (result.type === 'success') {
				await invalidateAll();
				editing = false;
			} else if (result.type === 'failure') {
				error = result.data?.message || 'Failed to save borrower split';
			}
		};
	};

	let latestSplit = $derived(currentSplit || history[0] || null);
</script>

<Card>
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-lg font-semibold text-gray-900">Borrower Split</h2>
		{#if !editing}
			<Button variant="secondary" size="sm" onclick={startEditing}>Edit Split</Button>
		{/if}
	</div>

	{#if latestSplit}
		<dl class="mb-4 grid grid-cols-2 gap-4 text-sm">
			<div class="rounded-md bg-gray-50 p-3">
				<dt class="text-gray-600">Me</dt>
				<dd class="text-2xl font-bold text-gray-900">{latestSplit.mePercent}%</dd>
			</div>
			<div class="rounded-md bg-gray-50 p-3">
				<dt class="text-gray-600">Spouse</dt>
				<dd class="text-2xl font-bold text-gray-900">{latestSplit.spousePercent}%</dd>
			</div>
		</dl>
	{:else}
		<p class="mb-4 text-sm text-gray-600">
			Add a borrower split to calculate each person's outstanding amount.
		</p>
	{/if}

	{#if editing}
		<form class="space-y-3" method="POST" action="?/addBorrowerSplit" use:enhance={handleSubmit}>
			<Input
				id="split-date"
				label="Effective From"
				name="effectiveFrom"
				type="date"
				bind:value={formData.effectiveFrom}
				required
			/>
			<div class="grid grid-cols-2 gap-4">
				<Input
					id="split-me"
					label="Me (%)"
					name="mePercent"
					type="number"
					bind:value={formData.mePercent}
					min="0"
					max="100"
					step="1"
					helpText="Enter between 0-100"
					onchange={handleInputChange}
					required
				/>
				<Input
					id="split-spouse"
					label="Spouse (%)"
					name="spousePercent"
					type="number"
					bind:value={formData.spousePercent}
					min="0"
					max="100"
					step="1"
					helpText="Enter between 0-100"
					onchange={handleInputChange}
					required
				/>
			</div>
			{#if error}
				<p class="text-xs text-red-600" role="alert">{error}</p>
			{/if}
			<p class="text-xs text-gray-600">
				Adding a new split does not retroactively change historical repayments. It only affects
				future calculations.
			</p>

			<div class="flex justify-end gap-2">
				<Button type="button" variant="secondary" onclick={handleCancel} disabled={isSubmitting}>
					Cancel
				</Button>
				<Button type="submit" variant="primary" disabled={isSubmitting}>
					{isSubmitting ? 'Saving...' : 'Save Split'}
				</Button>
			</div>
		</form>
	{:else if history.length > 0}
		<div>
			<h3 class="mb-2 text-xs font-semibold uppercase text-gray-500">History</h3>
			<ul class="space-y-2 text-sm">
				{#each history as split}
					<li class="flex justify-between rounded-md border border-gray-200 px-3 py-2">
						<div>
							<span class="font-medium text-gray-900">{split.mePercent}% / {split.spousePercent}%</span>
							<p class="text-xs text-gray-500">
								Effective {formatDate(split.effectiveFrom)}
							</p>
						</div>
						<span class="text-xs text-gray-500">
							Added {formatDate(split.createdAt)}
						</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</Card>
