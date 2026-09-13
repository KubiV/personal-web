<script>
	export let data;
	$: post = data.post;
</script>

<svelte:head>
	<title>{post.title} - KubiV</title>
	<meta property="og:title" content={post.title} />
	<meta name="twitter:title" content={post.title} />
	{#if post.description}
		<meta name="description" content={post.description} />
		<meta property="og:description" content={post.description} />
		<meta name="twitter:description" content={post.description} />
	{/if}
	{#if post.image}
		<meta property="og:image" content={post.image} />
		<meta name="twitter:image" content={post.image} />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
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
						title={langCode === 'cs' ? 'Čeština' : (langCode === 'en' ? 'English' : (langCode === 'fr' ? 'Français' : langCode.toUpperCase()))}
					>
						{langCode === 'cs' ? 'CZ' : langCode.toUpperCase()}
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
