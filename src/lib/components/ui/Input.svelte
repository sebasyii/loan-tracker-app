<script lang="ts">
	interface Props {
		id: string;
		name?: string;
		label: string;
		type?: string;
		value: string | number;
		required?: boolean;
		error?: string;
		helpText?: string;
		prefix?: string;
		disabled?: boolean;
		min?: string | number;
		max?: string | number;
		step?: string | number;
		placeholder?: string;
		onchange?: (e: Event) => void;
	}

	let {
		id,
		name,
		label,
		type = 'text',
		value = $bindable(),
		required = false,
		error,
		helpText,
		prefix,
		disabled = false,
		min,
		max,
		step,
		placeholder,
		onchange
	}: Props = $props();

	// Use name if provided, otherwise fall back to id
	let inputName = $derived(name || id);
</script>

<div class="space-y-1">
	<label for={id} class="block text-sm font-medium text-gray-700">
		{label}
		{#if required}
			<span class="text-red-600" aria-label="required">*</span>
		{/if}
	</label>

	<div class="relative">
		{#if prefix}
			<span class="absolute left-3 top-2 text-gray-500">{prefix}</span>
		{/if}
		<input
			{id}
			name={inputName}
			{type}
			bind:value
			{required}
			{disabled}
			{min}
			{max}
			{step}
			{placeholder}
			{onchange}
			aria-required={required}
			aria-invalid={!!error}
			aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
			class="w-full rounded-md border border-gray-300 py-2 pr-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 {prefix
				? 'pl-7'
				: 'px-3'}"
		/>
	</div>

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
