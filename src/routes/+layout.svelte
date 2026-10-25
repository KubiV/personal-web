<script>
	import '../app.css';
	import { page } from '$app/stores';
	import SocialLinks from '$lib/SocialLinks.svelte';
	import LogoIcon from '$lib/components/LogoIcon.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	export let data;
	$: siteConfig = data?.siteConfig;
	$: subdomainData = data?.subdomainData;
	$: effectiveOrigin = subdomainData?.origin || data?.hostInfo?.origin || $page.url.origin;
	$: langQuery = $page.url.searchParams.has('lang') ? `?lang=${$page.url.searchParams.get('lang')}` : '';
	$: canonicalUrl = $page.data?.canonicalOrigin
		? `${$page.data.canonicalOrigin}${$page.url.pathname}${langQuery}`
		: `${effectiveOrigin}${$page.url.pathname}${langQuery}`;
	$: navItems = siteConfig?.nav || [
		{ label: 'Home', href: '/' },
		{ label: 'Blog', href: '/blog' },
		{ label: 'Kategorie', href: '/category' },
		{ label: 'O mně', href: '/about' }
	];
</script>

<svelte:head>
	{#if data?.themeCss}
		{@html `<style id="dynamic-theme">${data.themeCss}</style>`}
	{/if}
	<link rel="canonical" href={canonicalUrl} />
	<link
		rel="alternate"
		type="application/rss+xml"
		title="{siteConfig?.title || 'KubiV'} - RSS"
		href="{effectiveOrigin}/rss.xml"
	/>
	<meta property="og:site_name" content={siteConfig?.title || 'KubiV'} />
	<meta property="og:locale" content={$page.url.searchParams.get('lang') === 'en' ? 'en_US' : 'cs_CZ'} />
	{#if siteConfig?.favicon?.svg}
		<link rel="icon" type="image/svg+xml" href={siteConfig.favicon.svg} />
	{/if}
	{#if siteConfig?.favicon?.png}
		<link rel="alternate icon" type="image/png" sizes="64x64" href={siteConfig.favicon.png} />
	{/if}
	{#if siteConfig?.favicon?.appleTouchIcon}
		<link rel="apple-touch-icon" href={siteConfig.favicon.appleTouchIcon} />
	{/if}
</svelte:head>

<header class="site-header">
	{#if data?.themeCss}
		{@html `<style id="dynamic-theme-override">${data.themeCss}</style>`}
	{/if}
	<div class="container">
		<div class="site-brand-group">
			<a href="/" class="site-title">
				<LogoIcon src={siteConfig?.logo?.iconUrl} />
				<span>{siteConfig?.logo?.text || siteConfig?.title || 'KubiV'}</span>
			</a>
			{#if subdomainData}
				<a
					href={subdomainData.mainSiteUrl}
					class="main-site-return-pill"
					title="Zpět na hlavní web {subdomainData.mainSiteTitle}"
				>
					&larr; {subdomainData.mainSiteTitle}
				</a>
			{/if}
		</div>
		<div class="header-right">
			<nav class="site-nav" aria-label="Main Navigation">
				{#each navItems as item}
					<a
						href={item.href}
						aria-current={item.href === '/' ? ($page.url.pathname === '/' ? 'page' : undefined) : ($page.url.pathname.startsWith(item.href) ? 'page' : undefined)}
					>
						{item.label}
					</a>
				{/each}
			</nav>
			<ThemeToggle />
		</div>
	</div>
</header>

<main class="content">
	<div class="container">
		<slot />
	</div>
</main>

<footer class="site-footer">
	<div class="container">
		<div class="footer-left">
			<span>&copy; {new Date().getFullYear()} {siteConfig?.footer?.copyright || siteConfig?.title || 'KubiV'}</span>
			{#if subdomainData}
				<span class="footer-sep">&bull;</span>
				<a href={subdomainData.mainSiteUrl} class="footer-main-site-link">
					&larr; Zpět na hlavní web ({subdomainData.mainSiteTitle})
				</a>
			{/if}
		</div>
		{#if subdomainData?.showFooterSocial !== false}
			<SocialLinks links={siteConfig?.social} />
		{/if}
	</div>
</footer>
