<script>
	import SocialLinks from '$lib/SocialLinks.svelte';
	import Logo3D from '$lib/components/Logo3D.svelte';
	export let data;
	$: about = data.about;
</script>

<svelte:head>
	<title>{about.title} - KubiV</title>
	{#if about.description}
		<meta name="description" content={about.description} />
	{/if}
</svelte:head>

<article class="about-container">
	<header class="about-header" style="margin-bottom: 2rem;">
		<div class="about-header-top">
			<nav>
				<a href="/" style="font-size: 0.9rem; color: var(--text-muted); text-decoration: none;">
					&larr; {about.lang === 'en' ? 'Back to Home' : 'Zpět na úvod'}
				</a>
			</nav>

			<!-- Dynamic Language Switcher for About -->
			{#if about.availableLanguages && about.availableLanguages.length > 0}
				<div class="lang-switcher" aria-label="Language selection">
					<span class="lang-label">{about.lang === 'en' ? 'Lang:' : (about.lang === 'fr' ? 'Langue:' : 'Jazyk:')}</span>
					{#each about.availableLanguages as langCode}
						<a
							href="?lang={langCode}"
							class="lang-btn"
							class:active={about.lang === langCode}
							aria-label={langCode.toUpperCase()}
							title={langCode === 'cs' ? 'Čeština' : (langCode === 'en' ? 'English' : (langCode === 'fr' ? 'Français' : langCode.toUpperCase()))}
						>
							{langCode === 'cs' ? 'CZ' : langCode.toUpperCase()}
						</a>
					{/each}
				</div>
			{/if}
		</div>

		<div class="about-profile-card">
			<div class="about-profile-info">
				<h1>{about.title}</h1>
				{#if about.description}
					<p class="about-lead">{about.description}</p>
				{/if}
				<div style="margin-top: 1rem;">
					<SocialLinks />
				</div>
			</div>
			<div class="about-profile-logo">
				<Logo3D size={110} />
			</div>
		</div>
	</header>

	<div class="prose">
		{@html about.html}
	</div>
</article>
