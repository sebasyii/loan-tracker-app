<script lang="ts">
	interface Props {
		id: string;
		label: string;
		value: string;
		required?: boolean;
		error?: string;
		helpText?: string;
		disabled?: boolean;
		rows?: number;
		placeholder?: string;
	}

	let {
		id,
		label,
		value = $bindable(),
		required = false,
		error,
		helpText,
		disabled = false,
		rows = 3,
		placeholder
	}: Props = $props();
</script>

<div class="space-y-1">
	<label for={id} class="block text-sm font-medium text-gray-700">
		{label}
		{#if required}
			<span class="text-red-600" aria-label="required">*</span>
		{/if}
	</label>

	<textarea
		{id}
		bind:value
		{required}
		{disabled}
		{rows}
		{placeholder}
		aria-required={required}
		aria-invalid={!!error}
		aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
		class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
	></textarea>

	{#if helpText && !error}
		<p id="{id}-help" class="text-xs text-gray-600">
			{helpText}
		</p>
	{/if}

	{#if error}
		<p id="{id}-error" class="text-xs text-red-600" role="alert">
			{error}
		</p>
	{/if}
</div>
