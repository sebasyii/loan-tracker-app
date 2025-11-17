<script lang="ts">
	import type { ActionData } from './$types';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { enhance } from '$app/forms';

	let { form }: { form: ActionData } = $props();

	// Preserve form values on validation error
	let formValues = $state({
		name: form?.values?.name || '',
		basePrice: form?.values?.basePrice || 0,
		buyerStampDuty: form?.values?.buyerStampDuty || 0,
		otherFees: form?.values?.otherFees || 0,
		mePercent: form?.values?.mePercent || 60,
		spousePercent: form?.values?.spousePercent || 40
	});

	let isSubmitting = $state(false);

	// Auto-calculate spouse percentage
	function handleMePercentChange() {
		formValues.spousePercent = 100 - formValues.mePercent;
	}

	function handleSpousePercentChange() {
		formValues.mePercent = 100 - formValues.spousePercent;
	}
</script>

<svelte:head>
	<title>Setup - Loan Tracker</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
	<div class="mx-auto max-w-2xl">
		<!-- Header -->
		<header class="mb-8 text-center">
			<h1 class="text-4xl font-bold text-gray-900">Welcome to Loan Tracker</h1>
			<p class="mt-2 text-lg text-gray-600">Let's set up your property information</p>
		</header>

		<!-- Setup Form -->
		<Card>
			{#if form?.error}
				<div class="mb-4 rounded-md bg-red-50 p-4" role="alert">
					<p class="text-sm text-red-800">{form.message}</p>
				</div>
			{/if}

			<form
				method="POST"
				class="space-y-6"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
					};
				}}
			>
				<!-- Property Information Section -->
				<div>
					<h2 class="mb-4 text-xl font-semibold text-gray-900">Property Information</h2>
					<div class="space-y-4">
						<Input
							id="name"
							label="Property Name"
							bind:value={formValues.name}
							placeholder="e.g., EC at Punggol"
							required
						/>

						<Input
							id="basePrice"
							label="Base Price"
							type="number"
							bind:value={formValues.basePrice}
							min="0"
							step="0.01"
							prefix="$"
							required
							helpText="The purchase price of the property"
						/>

						<Input
							id="buyerStampDuty"
							label="Buyer Stamp Duty"
							type="number"
							bind:value={formValues.buyerStampDuty}
							min="0"
							step="0.01"
							prefix="$"
							required
							helpText="Stamp duty payable to IRAS"
						/>

						<Input
							id="otherFees"
							label="Other Fees"
							type="number"
							bind:value={formValues.otherFees}
							min="0"
							step="0.01"
							prefix="$"
							required
							helpText="Legal fees, agent fees, etc."
						/>
					</div>
				</div>

				<!-- Borrower Split Section -->
				<div class="border-t border-gray-200 pt-6">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">Borrower Split</h2>
					<p class="mb-4 text-sm text-gray-600">
						Set the ownership/responsibility split between you and your spouse. This determines how
						loans and repayments are allocated.
					</p>

					<div class="grid gap-4 md:grid-cols-2">
						<Input
							id="mePercent"
							label="Your Share"
							type="number"
							bind:value={formValues.mePercent}
							min="0"
							max="100"
							step="1"
							required
							helpText="Your percentage of ownership"
							onchange={handleMePercentChange}
						/>

						<Input
							id="spousePercent"
							label="Spouse's Share"
							type="number"
							bind:value={formValues.spousePercent}
							min="0"
							max="100"
							step="1"
							required
							helpText="Spouse's percentage of ownership"
							onchange={handleSpousePercentChange}
						/>
					</div>

					{#if formValues.mePercent + formValues.spousePercent !== 100}
						<p class="mt-2 text-sm text-orange-600" role="alert">
							Total must equal 100% (currently {formValues.mePercent + formValues.spousePercent}%)
						</p>
					{/if}
				</div>

				<!-- Submit Button -->
				<div class="border-t border-gray-200 pt-6">
					<Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
						{isSubmitting ? 'Setting up...' : 'Complete Setup'}
					</Button>
				</div>
			</form>
		</Card>

		<!-- Help Text -->
		<div class="mt-6 text-center">
			<p class="text-sm text-gray-500">
				You can update these settings later from the main app
			</p>
		</div>
	</div>
</div>
