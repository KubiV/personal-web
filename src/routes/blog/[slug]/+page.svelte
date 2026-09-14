<script>
	import { page } from '$app/stores';
	export let data;
	$: post = data.post;

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

	$: siteConfig = data?.siteConfig;
	$: siteTitle = siteConfig?.title || 'KubiV';
	$: defaultAuthorName = siteConfig?.author?.name || 'KubiV';

	$: authorsList = post.authors && post.authors.length > 0 ? post.authors : [post.author || defaultAuthorName];
	$: articleAuthorSchema = authorsList.length === 1
		? {
			'@type': 'Person',
			name: authorsList[0],
			...(authorsList[0] === defaultAuthorName ? { url: `${$page.url.origin}/about` } : {})
		}
		: authorsList.map((name) => ({
			'@type': 'Person',
			name,
			...(name === defaultAuthorName ? { url: `${$page.url.origin}/about` } : {})
		}));

	$: articleSchema = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: post.title,
		description: post.description || '',
		image: post.image ? `${$page.url.origin}${post.image}` : undefined,
		datePublished: post.date,
		author: articleAuthorSchema,
		publisher: {
			'@type': 'Person',
			name: siteTitle,
			url: `${$page.url.origin}`
		},
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': `${$page.url.origin}/blog/${post.slug}`
		},
		inLanguage: post.lang === 'cs' ? 'cs-CZ' : (post.lang === 'en' ? 'en-US' : post.lang),
		articleSection: post.category
	});
</script>

<svelte:head>
	<title>{post.title} - {siteTitle}</title>
	<meta property="og:type" content="article" />
	<meta property="og:title" content={post.title} />
	<meta property="og:url" content="{$page.url.origin}/blog/{post.slug}{$page.url.searchParams.has('lang') ? `?lang=${post.lang}` : ''}" />
	<meta property="article:published_time" content={post.date} />
	{#each authorsList as authorName}
		<meta property="article:author" content={authorName} />
	{/each}
	<meta name="author" content={post.author || defaultAuthorName} />
	{#if post.category}
		<meta property="article:section" content={post.category} />
	{/if}
	<meta name="twitter:title" content={post.title} />
	<meta name="twitter:card" content={post.image ? "summary_large_image" : "summary"} />
	{#if post.description}
		<meta name="description" content={post.description} />
		<meta property="og:description" content={post.description} />
		<meta name="twitter:description" content={post.description} />
	{/if}
	{#if post.image}
		<meta property="og:image" content="{$page.url.origin}{post.image}" />
		<meta name="twitter:image" content="{$page.url.origin}{post.image}" />
	{/if}

	{#if post.availableLanguages && post.availableLanguages.length > 1}
		{#each post.availableLanguages as l}
			<link rel="alternate" hreflang={l} href="{$page.url.origin}/blog/{post.slug}?lang={l}" />
		{/each}
		<link rel="alternate" hreflang="x-default" href="{$page.url.origin}/blog/{post.slug}" />
	{/if}

	{@html `<script type="application/ld+json">${articleSchema}</` + `script>`}
</svelte:head>

<article class="article-container">
	<div class="article-top-bar" style="margin-bottom: 1.5rem;">
		<nav>
			<a href="/blog" style="font-size: 0.9rem; color: var(--text-muted); text-decoration: none;">
				&larr; {post.lang === 'en' ? 'Back to all articles' : 'Zpět na všechny články'}
			</a>
		</nav>

		<!-- Dynamic Language Switcher -->
		{#if post.availableLanguages && post.availableLanguages.length > 0}
			<div class="lang-switcher" aria-label="Jazyková verze článku">
				<span class="lang-label">{post.lang === 'en' ? 'Lang:' : (post.lang === 'fr' ? 'Langue:' : 'Jazyk:')}</span>
				{#each post.availableLanguages as langCode}
					<a
						href="?lang={langCode}"
						class="lang-btn"
						class:active={post.lang === langCode}
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

	{#if post.isFallback}
		<div class="notice-pill" style="margin-bottom: 1.25rem;">
			Verze v požadovaném jazyce ({(post.requestedLang || '').toUpperCase()}) není k dispozici. Zobrazuje se verze v jazyce {post.lang === 'cs' ? 'CZ' : post.lang.toUpperCase()}.
		</div>
	{/if}

	<header class="post-header">
		<h1>{post.title}</h1>
		<div class="post-meta">
			<time datetime={post.date}>{post.dateFormatted}</time>
			<span>&bull;</span>
			<a href="/category/{post.categorySlug || encodeURIComponent(post.category.toLowerCase())}" class="category-link">
				{post.category}
			</a>
			{#if post.author}
				<span>&bull;</span>
				<span class="post-author">
					{#if post.author === defaultAuthorName}
						<a href="/about" class="author-link">{post.author}</a>
					{:else}
						{post.author}
					{/if}
				</span>
			{/if}
		</div>
	</header>

	<div class="prose">
		{@html post.html}
	</div>

	<hr />

	<div style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
		<a href="/blog">&larr; Back to Blog</a>
		<a href="#top" on:click|preventDefault={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
			Back to top &uarr;
		</a>
	</div>
</article>
