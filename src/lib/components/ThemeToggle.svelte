<script>
	import { onMount } from 'svelte';
	import { themeStore } from '$lib/theme';

	onMount(() => {
		themeStore.init();
	});
</script>

<button
	type="button"
	class="clean-theme-toggle"
	role="switch"
	aria-checked={$themeStore.currentTheme === 'dark'}
	aria-label={$themeStore.currentTheme === 'dark' ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim'}
	title={$themeStore.currentTheme === 'dark' ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim'}
	on:click={() => themeStore.toggle()}
>
	<!-- Posuvný indikátor (thumb) -->
	<span class="toggle-thumb" class:is-dark={$themeStore.currentTheme === 'dark'}></span>

	<!-- Ikona slunce (světlý režim) -->
	<span class="icon-slot sun-slot" class:active={$themeStore.currentTheme === 'light'}>
		<svg
			class="theme-icon"
			viewBox="0 0 24 24"
			width="14"
			height="14"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
		</svg>
	</span>

	<!-- Ikona měsíce (tmavý režim) -->
	<span class="icon-slot moon-slot" class:active={$themeStore.currentTheme === 'dark'}>
		<svg
			class="theme-icon"
			viewBox="0 0 24 24"
			width="14"
			height="14"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
		</svg>
	</span>
</button>

<style>
	.clean-theme-toggle {
		position: relative;
		display: inline-flex;
		align-items: center;
		width: 54px;
		height: 28px;
		padding: 2px;
		background-color: var(--code-bg);
		border: 1px solid var(--border);
		border-radius: 9999px;
		cursor: pointer;
		user-select: none;
		outline: none;
		transition: border-color 0.2s ease, background-color 0.2s ease;
		flex-shrink: 0;
	}

	.clean-theme-toggle:hover {
		border-color: var(--accent);
	}

	.clean-theme-toggle:focus-visible {
		box-shadow: 0 0 0 2px var(--accent-light), 0 0 0 4px var(--accent);
	}

	/* Posuvný kruhový podklad pod aktivní ikonou */
	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background-color: var(--bg);
		border: 1px solid var(--border);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
		transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
		pointer-events: none;
	}

	.toggle-thumb.is-dark {
		transform: translateX(26px);
		border-color: var(--accent-border);
		box-shadow: 0 1px 5px rgba(20, 164, 255, 0.2);
	}

	/* Pozice a chování ikon */
	.icon-slot {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		color: var(--text-muted);
		opacity: 0.45;
		transition: color 0.2s ease, opacity 0.2s ease, transform 0.2s ease;
	}

	.icon-slot.sun-slot.active {
		color: #eab308; /* Teplá zlatavá pro slunce */
		opacity: 1;
		transform: scale(1.05);
	}

	.icon-slot.moon-slot.active {
		color: #38bdf8; /* Jasná nebeská modř pro měsíc */
		opacity: 1;
		transform: scale(1.05);
	}

	.theme-icon {
		display: block;
	}
</style>
