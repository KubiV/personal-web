<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { getPostCategories } from '$lib/utils.js';
	import PostListItem from '$lib/components/PostListItem.svelte';
	export let data;
	$: post = data.post;
	$: prevPost = data.prevPost;
	$: nextPost = data.nextPost;
	$: relatedPosts = data.relatedPosts || [];
	$: postCategories = getPostCategories(post);

	let iframeWrapperEl;
	let iframeEl;
	let isFullscreen = false;
	let dynamicIframeHeight = null;

	function toggleFullscreen() {
		if (!iframeWrapperEl) return;

		if (!isFullscreen) {
			if (iframeWrapperEl.requestFullscreen) {
				iframeWrapperEl.requestFullscreen().catch(() => {
					isFullscreen = true;
				});
			} else {
				isFullscreen = true;
			}
		} else {
			if (document.fullscreenElement && document.exitFullscreen) {
				document.exitFullscreen().catch(() => {
					isFullscreen = false;
				});
			} else {
				isFullscreen = false;
			}
		}
	}

	onMount(() => {
		function handleFullscreenChange() {
			isFullscreen = Boolean(document.fullscreenElement === iframeWrapperEl);
		}

		function handleKeydown(e) {
			if (e.key === 'Escape' && isFullscreen && !document.fullscreenElement) {
				isFullscreen = false;
			}
		}

		function handleMessage(e) {
			if (
				e.data &&
				typeof e.data === 'object' &&
				(e.data.type === 'iframe-resize' || e.data.type === 'resize') &&
				typeof e.data.height === 'number' &&
				e.data.height > 100
			) {
				dynamicIframeHeight = `${Math.ceil(e.data.height)}px`;
			}
		}

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		window.addEventListener('keydown', handleKeydown);
		window.addEventListener('message', handleMessage);

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			window.removeEventListener('keydown', handleKeydown);
			window.removeEventListener('message', handleMessage);
		};
	});

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

	function getLangLabel(lang) {
		const code = (lang || '').toLowerCase();
		return code === 'cs' ? 'CZ' : code.toUpperCase();
	}

	$: availableLanguages = post?.availableLanguages || post?.languages || [];

	$: siteConfig = data?.siteConfig;
	$: siteTitle = siteConfig?.title || 'KubiV';
	$: defaultAuthorName = siteConfig?.author?.name || 'KubiV';
	$: effectiveOrigin = data?.canonicalOrigin || data?.subdomainData?.origin || data?.hostInfo?.origin || $page.url.origin;

	$: authorsList = post.authors && post.authors.length > 0 ? post.authors : [post.author || defaultAuthorName];
	$: articleAuthorSchema = authorsList.length === 1
		? {
			'@type': 'Person',
			name: authorsList[0],
			...(authorsList[0] === defaultAuthorName ? { url: `${effectiveOrigin}/about` } : {})
		}
		: authorsList.map((name) => ({
			'@type': 'Person',
			name,
			...(name === defaultAuthorName ? { url: `${effectiveOrigin}/about` } : {})
		}));

	$: breadcrumbItems = [
		{
			'@type': 'ListItem',
			position: 1,
			name: siteTitle,
			item: effectiveOrigin
		},
		{
			'@type': 'ListItem',
			position: 2,
			name: 'Blog',
			item: `${effectiveOrigin}/blog`
		},
		...(postCategories.length > 0
			? [
					{
						'@type': 'ListItem',
						position: 3,
						name: postCategories[0].name,
						item: `${effectiveOrigin}/category/${postCategories[0].slug}`
					},
					{
						'@type': 'ListItem',
						position: 4,
						name: post.title,
						item: `${effectiveOrigin}/blog/${post.slug}`
					}
				]
			: [
					{
						'@type': 'ListItem',
						position: 3,
						name: post.title,
						item: `${effectiveOrigin}/blog/${post.slug}`
					}
				])
	];

	$: articleSchema = JSON.stringify({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'BlogPosting',
				'@id': `${effectiveOrigin}/blog/${post.slug}#article`,
				url: `${effectiveOrigin}/blog/${post.slug}`,
				headline: post.title,
				description: post.description || '',
				image: post.image ? `${effectiveOrigin}${post.image}` : undefined,
				datePublished: post.date,
				dateModified: post.updated || post.date,
				author: articleAuthorSchema,
				publisher: {
					'@type': 'Person',
					name: siteTitle,
					url: `${effectiveOrigin}`
				},
				mainEntityOfPage: {
					'@type': 'WebPage',
					'@id': `${effectiveOrigin}/blog/${post.slug}`
				},
				inLanguage: post.lang === 'cs' ? 'cs-CZ' : (post.lang === 'en' ? 'en-US' : post.lang),
				articleSection: postCategories.length > 0 ? postCategories.map((c) => c.name) : post.category
			},
			{
				'@type': 'BreadcrumbList',
				'@id': `${effectiveOrigin}/blog/${post.slug}#breadcrumb`,
				itemListElement: breadcrumbItems
			}
		]
	});
</script>

<svelte:head>
	<title>{post.title} - {siteTitle}</title>
	<meta property="og:type" content="article" />
	<meta property="og:title" content={post.title} />
	<meta property="og:url" content="{effectiveOrigin}/blog/{post.slug}{$page.url.searchParams.has('lang') ? `?lang=${post.lang}` : ''}" />
	<meta property="article:published_time" content={post.date} />
	{#each authorsList as authorName}
		<meta property="article:author" content={authorName} />
	{/each}
	<meta name="author" content={post.author || defaultAuthorName} />
	{#if postCategories.length > 0}
		{#each postCategories as cat}
			<meta property="article:tag" content={cat.name} />
		{/each}
		<meta property="article:section" content={postCategories[0].name} />
	{:else if post.category}
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
		<meta property="og:image" content="{effectiveOrigin}{post.image}" />
		<meta name="twitter:image" content="{effectiveOrigin}{post.image}" />
	{/if}

	{#if post.availableLanguages && post.availableLanguages.length > 1}
		{#each post.availableLanguages as l}
			<link rel="alternate" hreflang={l} href="{effectiveOrigin}/blog/{post.slug}?lang={l}" />
		{/each}
		<link rel="alternate" hreflang="x-default" href="{effectiveOrigin}/blog/{post.slug}" />
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
			{#if postCategories.length > 0}
				<span>&bull;</span>
				<span class="post-categories">
					{#each postCategories as cat}
						<a href="/category/{cat.slug}" class="category-link">
							{cat.name}
						</a>
					{/each}
				</span>
			{/if}
			{#if availableLanguages && availableLanguages.length > 0}
				<span>&bull;</span>
				<span class="lang-badges" aria-label="Dostupné jazyky">
					{#each availableLanguages as langCode}
						{#if availableLanguages.length > 1}
							<a
								href="?lang={langCode}"
								class="lang-badge"
								class:active={post.lang === langCode}
								title={getLangTitle(langCode)}
								aria-label={langCode.toUpperCase()}
							>
								<span class="flag-text flag-{langCode.toLowerCase()}">
									{getLangLabel(langCode)}
								</span>
							</a>
						{:else}
							<span class="lang-badge" title={getLangTitle(langCode)}>
								<span class="flag-text flag-{langCode.toLowerCase()}">
									{getLangLabel(langCode)}
								</span>
							</span>
						{/if}
					{/each}
				</span>
			{/if}
		</div>
	</header>

	{#if post.interactive && post.iframeUrl}
		{#if post.hasMarkdownContent && post.contentPosition === 'above'}
			<div class="prose" style="margin-bottom: 1.75rem;">
				{@html post.html}
			</div>
		{/if}

		<div
			class="interactive-app-wrapper"
			class:is-fullscreen={isFullscreen}
			bind:this={iframeWrapperEl}
		>
			<div class="interactive-app-toolbar">
				<span class="interactive-badge">Interaktivní aplikace</span>
				<div class="interactive-toolbar-actions">
					<a
						href={post.iframeUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="interactive-action-btn"
						title="Otevřít aplikaci v novém okně"
					>
						Otevřít samostatně &#8599;
					</a>
					<button
						type="button"
						class="interactive-action-btn interactive-fullscreen-btn"
						on:click={toggleFullscreen}
						aria-label={isFullscreen ? 'Ukončit celou obrazovku' : 'Zobrazit na celou obrazovku'}
					>
						{#if isFullscreen}
							&#x2715; Ukončit celou obrazovku
						{:else}
							&#x26F6; Celá obrazovka
						{/if}
					</button>
				</div>
			</div>
			<iframe
				bind:this={iframeEl}
				src={post.iframeUrl}
				title={post.title}
				class="interactive-app-iframe"
				sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
				allow="fullscreen"
				style="border: none; width: 100%; height: {isFullscreen ? 'calc(100vh - 42px)' : (dynamicIframeHeight || post.iframeHeight || '80vh')}; border-radius: 0 0 8px 8px; display: block;"
			></iframe>
		</div>

		{#if post.hasMarkdownContent && post.contentPosition !== 'above'}
			<div class="prose" style="margin-top: 2rem;">
				{@html post.html}
			</div>
		{/if}
	{:else}
		<div class="prose">
			{@html post.html}
		</div>
	{/if}

	<hr />

	{#if prevPost || nextPost}
		<nav class="post-adjacent-nav" aria-label={post.lang === 'en' ? 'Previous and next articles' : 'Předchozí a následující článek'}>
			{#if prevPost}
				<a href="/blog/{prevPost.slug}" class="post-adjacent-card post-adjacent-prev">
					<span class="post-adjacent-label">&larr; {post.lang === 'en' ? 'Older article' : 'Starší článek'}</span>
					<span class="post-adjacent-title">{prevPost.title}</span>
				</a>
			{:else}
				<div></div>
			{/if}
			{#if nextPost}
				<a href="/blog/{nextPost.slug}" class="post-adjacent-card post-adjacent-next">
					<span class="post-adjacent-label">{post.lang === 'en' ? 'Newer article' : 'Novější článek'} &rarr;</span>
					<span class="post-adjacent-title">{nextPost.title}</span>
				</a>
			{/if}
		</nav>
	{/if}

	{#if relatedPosts.length > 0}
		<section class="related-posts-section" aria-label={post.lang === 'en' ? 'Related articles' : 'Další články k přečtení'}>
			<h2 class="related-posts-heading">
				{post.lang === 'en' ? 'More articles to read' : 'Další články k přečtení'}
			</h2>
			<ul class="post-list">
				{#each relatedPosts as relPost}
					<PostListItem post={relPost} headingLevel="h3" />
				{/each}
			</ul>
		</section>
	{/if}

	<div style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
		<a href="/blog">&larr; {post.lang === 'en' ? 'Back to Blog' : 'Zpět na přehled článků'}</a>
		<a href="#top" on:click|preventDefault={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
			{post.lang === 'en' ? 'Back to top' : 'Nahoru'} &uarr;
		</a>
	</div>
</article>
