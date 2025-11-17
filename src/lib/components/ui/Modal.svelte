<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		onClose: () => void;
		children: Snippet;
		footer?: Snippet;
	}

	let { open = $bindable(), title, onClose, children, footer }: Props = $props();

	let modalElement: HTMLDivElement | undefined = $state();
	let previousFocus: HTMLElement | null = null;

	function handleKeydown(e: KeyboardEvent) {
		// Handle Escape key
		if (e.key === 'Escape') {
			e.preventDefault();
			onClose();
			return;
		}

		// Handle Tab for focus trapping
		if (!modalElement || e.key !== 'Tab') return;

		const focusable = modalElement.querySelectorAll<HTMLElement>(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		const first = focusable[0];
		const last = focusable[focusable.length - 1];

		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last?.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first?.focus();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	$effect(() => {
		if (open && modalElement) {
			previousFocus = document.activeElement as HTMLElement;

			setTimeout(() => {
				const firstFocusable = modalElement?.querySelector<HTMLElement>(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
				);
				firstFocusable?.focus();
			}, 0);

			document.body.style.overflow = 'hidden';
		} else if (!open && previousFocus) {
			previousFocus.focus();
			document.body.style.overflow = '';
		}
	});
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		tabindex="-1"
		bind:this={modalElement}
		onkeydown={handleKeydown}
		onclick={handleBackdropClick}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="w-full max-w-lg rounded-lg bg-white shadow-xl" onclick={(e) => e.stopPropagation()}>
			<div class="border-b border-gray-200 px-6 py-4">
				<h3 id="modal-title" class="text-lg font-semibold text-gray-900">{title}</h3>
			</div>

			<div class="px-6 py-4">
				{@render children()}
			</div>

			{#if footer}
				<div class="border-t border-gray-200 px-6 py-4">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
