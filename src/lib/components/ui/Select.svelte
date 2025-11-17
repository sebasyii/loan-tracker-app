<script lang="ts">
	interface Option {
		value: string;
		label: string;
	}

	interface Props {
		id: string;
		label: string;
		value: string;
		options: Option[];
		required?: boolean;
		error?: string;
		disabled?: boolean;
		onchange?: (e: Event) => void;
	}

	let {
		id,
		label,
		value = $bindable(),
		options,
		required = false,
		error,
		disabled = false,
		onchange
	}: Props = $props();
</script>

<div class="space-y-1">
	<label for={id} class="block text-sm font-medium text-gray-700">
		{label}
		{#if required}
			<span class="text-red-600" aria-label="required">*</span>
		{/if}
	</label>

	<select
		{id}
		bind:value
		{required}
		{disabled}
		{onchange}
		aria-required={required}
		aria-invalid={!!error}
		aria-describedby={error ? `${id}-error` : undefined}
		class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
	>
		{#each options as option}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>

	{#if error}
		<p id="{id}-error" class="text-xs text-red-600" role="alert">
			{error}
		</p>
	{/if}
</div>
