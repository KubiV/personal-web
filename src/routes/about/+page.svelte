<script>
	import { page } from '$app/stores';
	import SocialLinks from '$lib/SocialLinks.svelte';
	import Logo3D from '$lib/components/Logo3D.svelte';
	export let data;
	$: about = data.about;
	$: siteConfig = data?.siteConfig;
	$: siteTitle = siteConfig?.title || 'KubiV';
	$: authorName = siteConfig?.author?.name || 'KubiV';
	$: socialLinksList = siteConfig?.social
		? Object.values(siteConfig.social).filter(Boolean)
		: ['https://github.com/KubiV'];

	const langTitles = {
		cs: 'Čeština (CZ)',
		cz: 'Čeština (CZ)',
		en: 'English (EN)',
		sk: 'Slovenčina (SK)',
		de: 'Deutsch (DE)',
		fr: 'Français (FR)',
		es: 'Español (ES)',
		it: 'Italiano (IT)',
		pl: 'Polski (PL)',
		ua: 'Українська (UA)',
		uk: 'Українська (UA)'
	};

	function getLangTitle(lang) {
		const code = (lang || '').toLowerCase();
		return langTitles[code] || code.toUpperCase();
	}

	$: personSchema = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: authorName,
		url: `${$page.url.origin}/about`,
		description: about.description || 'Personal profile and projects',
		sameAs: socialLinksList
	});
</script>

<svelte:head>
	<title>{about.title} - {siteTitle}</title>
	{#if about.description}
		<meta name="description" content={about.description} />
		<meta property="og:description" content={about.description} />
		<meta name="twitter:description" content={about.description} />
	{/if}
	<meta property="og:type" content="profile" />
	<meta property="og:title" content="{about.title} - {siteTitle}" />
	<meta property="og:url" content="{$page.url.origin}/about" />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="{about.title} - {siteTitle}" />

	{#if about.availableLanguages && about.availableLanguages.length > 1}
		{#each about.availableLanguages as l}
			<link rel="alternate" hreflang={l} href="{$page.url.origin}/about?lang={l}" />
		{/each}
		<link rel="alternate" hreflang="x-default" href="{$page.url.origin}/about" />
	{/if}

	{@html `<script type="application/ld+json">${personSchema}</` + `script>`}
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
							title={getLangTitle(langCode)}
						>
							<span class="flag-text flag-{langCode.toLowerCase()}">
								{langCode.toLowerCase() === 'cs' ? 'CZ' : langCode.toUpperCase()}
							</span>
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
			{#if siteConfig?.logo?.show3D !== false}
				<div class="about-profile-logo">
					<Logo3D
						size={110}
						src={siteConfig?.logo?.model3d || '/models/logo.glb'}
						fallbackSrc={siteConfig?.logo?.fallback3d || '/logos/logo-3d.png'}
						alt="{authorName} 3D Logo"
					/>
				</div>
			{/if}
		</div>
	</header>

	<div class="prose">
		{@html about.html}
	</div>
</article>
