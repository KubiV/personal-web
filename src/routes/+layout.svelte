<script>
	import '../app.css';
	import { page } from '$app/stores';
	import SocialLinks from '$lib/SocialLinks.svelte';
	import LogoIcon from '$lib/components/LogoIcon.svelte';
</script>

<svelte:head>
	<meta name="description" content="Personal website and blog by KubiV - articles, projects, and guides." />
</svelte:head>

<header class="site-header">
	<div class="container">
		<a href="/" class="site-title">
			<LogoIcon />
			<span>KubiV</span>
		</a>
		<nav class="site-nav" aria-label="Main Navigation">
			<a href="/" aria-current={$page.url.pathname === '/' ? 'page' : undefined}>Home</a>
			<a href="/blog" aria-current={$page.url.pathname.startsWith('/blog') ? 'page' : undefined}>Blog</a>
			<a href="/category" aria-current={$page.url.pathname.startsWith('/category') ? 'page' : undefined}>Kategorie</a>
			<a href="/about" aria-current={$page.url.pathname.startsWith('/about') ? 'page' : undefined}>O mně</a>
		</nav>
	</div>
</header>

<main class="content">
	<div class="container">
		<slot />
	</div>
</main>

<footer class="site-footer">
	<div class="container">
		<div>&copy; {new Date().getFullYear()} KubiV</div>
		<SocialLinks />
	</div>
</footer>
