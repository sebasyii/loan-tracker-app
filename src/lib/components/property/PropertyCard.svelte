<script lang="ts">
	import type { PropertyInfo } from '$lib/types';
	import { formatCurrency } from '$lib/utils/formatting';
	import { calculatePropertyTotalCost } from '$lib/utils/calculations';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	interface Props {
		propertyInfo: PropertyInfo;
	}

	let { propertyInfo }: Props = $props();
	let editing = $state(false);
	let formData = $state({ ...propertyInfo });
	let isSubmitting = $state(false);

	function handleEdit() {
		formData = { ...propertyInfo };
		editing = true;
	}

	function handleCancel() {
		editing = false;
	}

	const handleSubmit: SubmitFunction = () => {
		isSubmitting = true;

		return async ({ result }) => {
			isSubmitting = false;

			if (result.type === 'success') {
				await invalidateAll();
				editing = false;
			} else if (result.type === 'failure') {
				alert(result.data?.message || 'Failed to update property information');
			}
		};
	};

	let totalCost = $derived(calculatePropertyTotalCost(propertyInfo));
</script>

<Card>
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-lg font-semibold text-gray-900">Property Information</h2>
		{#if !editing}
			<Button variant="secondary" size="sm" onclick={handleEdit}>Edit</Button>
		{/if}
	</div>

	{#if editing}
		<form class="space-y-3" method="POST" action="?/updateProperty" use:enhance={handleSubmit}>
			<Input id="property-name" label="Property Name" name="name" bind:value={formData.name} required />
			<Input
				id="base-price"
				label="Base Price"
				name="basePrice"
				type="number"
				bind:value={formData.basePrice}
				required
			/>
			<Input
				id="stamp-duty"
				label="Buyer Stamp Duty"
				name="buyerStampDuty"
				type="number"
				bind:value={formData.buyerStampDuty}
				required
			/>
			<Input
				id="other-fees"
				label="Other Fees"
				name="otherFees"
				type="number"
				bind:value={formData.otherFees}
				required
			/>
			<div class="flex gap-2">
				<Button type="submit" variant="primary" disabled={isSubmitting}>
					{isSubmitting ? 'Saving...' : 'Save'}
				</Button>
				<Button type="button" variant="secondary" onclick={handleCancel} disabled={isSubmitting}>
					Cancel
				</Button>
			</div>
		</form>
	{:else}
		<dl class="space-y-3">
			<div class="flex justify-between">
				<dt class="text-sm font-medium text-gray-600">Property Name</dt>
				<dd class="text-sm font-semibold text-gray-900">{propertyInfo.name}</dd>
			</div>
			<div class="flex justify-between">
				<dt class="text-sm font-medium text-gray-600">Base Price</dt>
				<dd class="text-sm font-semibold text-gray-900">
					{formatCurrency(propertyInfo.basePrice)}
				</dd>
			</div>
			<div class="flex justify-between">
				<dt class="text-sm font-medium text-gray-600">Buyer Stamp Duty</dt>
				<dd class="text-sm font-semibold text-gray-900">
					{formatCurrency(propertyInfo.buyerStampDuty)}
				</dd>
			</div>
			<div class="flex justify-between">
				<dt class="text-sm font-medium text-gray-600">Other Fees</dt>
				<dd class="text-sm font-semibold text-gray-900">
					{formatCurrency(propertyInfo.otherFees)}
				</dd>
			</div>
			<div class="border-t border-gray-200 pt-3">
				<div class="flex justify-between">
					<dt class="text-base font-bold text-gray-900">Total Cost</dt>
					<dd class="text-base font-bold text-gray-900">
						{formatCurrency(totalCost)}
					</dd>
				</div>
			</div>
		</dl>
	{/if}
</Card>
