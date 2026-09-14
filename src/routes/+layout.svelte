<script>
	import '../app.css';
	import { page } from '$app/stores';
	import SocialLinks from '$lib/SocialLinks.svelte';
	import LogoIcon from '$lib/components/LogoIcon.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	export let data;
	$: siteConfig = data?.siteConfig;
	$: canonicalUrl = `${$page.url.origin}${$page.url.pathname}${$page.url.searchParams.has('lang') ? `?lang=${$page.url.searchParams.get('lang')}` : ''}`;
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
	<div class="container">
		<a href="/" class="site-title">
			<LogoIcon src={siteConfig?.logo?.iconUrl} />
			<span>{siteConfig?.logo?.text || siteConfig?.title || 'KubiV'}</span>
		</a>
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
		<div>
			&copy; {new Date().getFullYear()} {siteConfig?.footer?.copyright || siteConfig?.title || 'KubiV'}
		</div>
		<SocialLinks links={siteConfig?.social} />
	</div>
</footer>
