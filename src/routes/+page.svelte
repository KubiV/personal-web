<script>
	import { page } from '$app/stores';
	import SocialLinks from '$lib/SocialLinks.svelte';
	import Logo3D from '$lib/components/Logo3D.svelte';
	import PostListItem from '$lib/components/PostListItem.svelte';
	export let data;

	$: siteSchema = JSON.stringify({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebSite',
				'@id': `${$page.url.origin}/#website`,
				url: $page.url.origin,
				name: 'KubiV',
				description: 'Osobní web a blog KubiV - technologie, software, hardware a projekty.',
				inLanguage: 'cs-CZ'
			},
			{
				'@type': 'Person',
				'@id': `${$page.url.origin}/#person`,
				name: 'KubiV',
				url: `${$page.url.origin}/about`,
				sameAs: ['https://github.com/KubiV']
			}
		]
	});
</script>

<svelte:head>
	<title>KubiV - Personal Website</title>
	<meta name="description" content="Osobní web a blog KubiV - technologie, software, hardware a projekty." />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="KubiV - Personal Website" />
	<meta property="og:description" content="Osobní web a blog KubiV - technologie, software, hardware a projekty." />
	<meta property="og:url" content={$page.url.origin} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="KubiV - Personal Website" />
	<meta name="twitter:description" content="Osobní web a blog KubiV - technologie, software, hardware a projekty." />
	{@html `<script type="application/ld+json">${siteSchema}</` + `script>`}
</svelte:head>

<section class="intro-section" style="margin-bottom: 2.5rem;">
	<div class="intro-layout">
		<div class="intro-text">
			<h1 style="margin-bottom: 0.75rem;">Vítejte</h1>
			<p style="font-size: 1.1rem; line-height: 1.7; color: var(--text); margin-bottom: 1rem;">
				Vítejte v mém osobním koutku webu. Najdete zde články, poznámky a návody věnované moderním technologiím,
				softwarovému vývoji a zajímavým projektům.
			</p>
			<p style="color: var(--text-muted); margin-bottom: 0;">
				Můžete si projít nejnovější články níže, filtrovat podle témat v <a href="/category">prohlížeči kategorií</a>, nebo si přečíst více <a href="/about">o mně</a>.
			</p>
			<div style="margin-top: 1.15rem;">
				<SocialLinks />
			</div>
		</div>
		<div class="intro-logo-wrapper">
			<Logo3D size={125} />
		</div>
	</div>
</section>

<section class="recent-posts">
	<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1rem; border-bottom: 2px solid var(--accent); padding-bottom: 0.4rem;">
		<h2 style="margin: 0; font-size: 1.4rem;">Nejnovější články</h2>
		<a href="/blog" style="font-size: 0.95rem; font-weight: 500; color: var(--accent);">Všechny články &rarr;</a>
	</div>

	{#if data.recentPosts.length === 0}
		<div class="empty-state">
			<p>No articles published yet. Content will appear here when added to the server storage.</p>
		</div>
	{:else}
		<ul class="post-list">
			{#each data.recentPosts as post}
				<PostListItem {post} />
			{/each}
		</ul>
	{/if}
</section>
