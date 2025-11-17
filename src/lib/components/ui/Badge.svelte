<script lang="ts">
	interface Props {
		variant: 'purple' | 'orange' | 'green' | 'gray';
		label: string;
	}

	let { variant, label }: Props = $props();

	const variantClasses = {
		purple: 'bg-purple-100 text-purple-800',
		orange: 'bg-orange-100 text-orange-800',
		green: 'bg-green-100 text-green-800',
		gray: 'bg-gray-100 text-gray-800'
	};
</script>

<span
	class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {variantClasses[
		variant
	]}"
	role="status"
>
	{label}
</span>
