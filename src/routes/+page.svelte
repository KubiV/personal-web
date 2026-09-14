<script>
	import { page } from '$app/stores';
	import SocialLinks from '$lib/SocialLinks.svelte';
	import Logo3D from '$lib/components/Logo3D.svelte';
	import PostListItem from '$lib/components/PostListItem.svelte';
	export let data;

	$: siteConfig = data?.siteConfig;
	$: authorName = siteConfig?.author?.name || 'KubiV';
	$: siteTitle = siteConfig?.title || 'KubiV';
	$: siteTagline = siteConfig?.tagline || 'Personal Website';
	$: siteDesc = siteConfig?.description || 'Osobní web a blog - technologie, software, hardware a projekty.';
	$: socialLinksList = siteConfig?.social
		? Object.values(siteConfig.social).filter(Boolean)
		: ['https://github.com/KubiV'];

	$: siteSchema = JSON.stringify({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebSite',
				'@id': `${$page.url.origin}/#website`,
				url: $page.url.origin,
				name: siteTitle,
				description: siteDesc,
				inLanguage: siteConfig?.locale || 'cs-CZ'
			},
			{
				'@type': 'Person',
				'@id': `${$page.url.origin}/#person`,
				name: authorName,
				url: `${$page.url.origin}/about`,
				sameAs: socialLinksList
			}
		]
	});
</script>

<svelte:head>
	<title>{siteTitle} - {siteTagline}</title>
	<meta name="description" content={siteDesc} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="{siteTitle} - {siteTagline}" />
	<meta property="og:description" content={siteDesc} />
	<meta property="og:url" content={$page.url.origin} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="{siteTitle} - {siteTagline}" />
	<meta name="twitter:description" content={siteDesc} />
	{@html `<script type="application/ld+json">${siteSchema}</` + `script>`}
</svelte:head>

<section class="intro-section" style="margin-bottom: 2.5rem;">
	<div class="intro-layout">
		<div class="intro-text">
			<h1 style="margin-bottom: 0.75rem;">{siteConfig?.home?.heroTitle || 'Vítejte'}</h1>
			<p style="font-size: 1.1rem; line-height: 1.7; color: var(--text); margin-bottom: 1rem;">
				{siteConfig?.home?.heroLead || 'Vítejte v mém osobním koutku webu.'}
			</p>
			{#if siteConfig?.home?.heroText}
				<p style="color: var(--text-muted); margin-bottom: 0;">
					{siteConfig.home.heroText}
				</p>
			{/if}
			<div style="margin-top: 1.15rem;">
				<SocialLinks />
			</div>
		</div>
		{#if siteConfig?.logo3d?.enabled !== false && siteConfig?.logo3d?.showOnHome !== false && siteConfig?.logo?.show3D !== false}
			<div class="intro-logo-wrapper">
				<Logo3D
					size={siteConfig?.logo3d?.home?.size || 125}
					src={siteConfig?.logo3d?.home?.model || siteConfig?.logo?.model3d || '/models/logo.glb'}
					fallbackSrc={siteConfig?.logo3d?.home?.fallbackImage || siteConfig?.logo?.fallback3d || '/logos/logo-3d.png'}
					alt="{siteTitle} 3D Logo"
				/>
			</div>
		{/if}
	</div>
</section>

<section class="recent-posts">
	<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1rem; border-bottom: 2px solid var(--accent); padding-bottom: 0.4rem;">
		<h2 style="margin: 0; font-size: 1.4rem;">Nejnovější články</h2>
		<a href="/blog" style="font-size: 0.95rem; font-weight: 500; color: var(--accent);">Všechny články &rarr;</a>
	</div>

	{#if data.recentPosts.length === 0}
		<div class="empty-state">
			<p>Zatím nebyly publikovány žádné články.</p>
		</div>
	{:else}
		<ul class="post-list">
			{#each data.recentPosts as post}
				<PostListItem {post} />
			{/each}
		</ul>
	{/if}
</section>
