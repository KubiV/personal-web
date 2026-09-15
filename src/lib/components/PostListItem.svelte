<script>
	import { getPostCategories } from '$lib/utils.js';

	export let post;
	export let headingLevel = 'h2';
	export let showCategory = true;
	const langNames = {
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

	function getLangLabel(lang) {
		const code = (lang || '').toLowerCase();
		return code === 'cs' ? 'CZ' : code.toUpperCase();
	}

	function getLangTitle(lang) {
		const code = (lang || '').toLowerCase();
		return langNames[code] || code.toUpperCase();
	}

	$: postCategories = getPostCategories(post);
</script>

<li class="post-list-item" class:has-thumbnail={Boolean(post.image)}>
	<div class="post-item-content">
		{#if headingLevel === 'h3'}
			<h3>
				<a href="/blog/{post.slug}">{post.title}</a>
			</h3>
		{:else}
			<h2>
				<a href="/blog/{post.slug}">{post.title}</a>
			</h2>
		{/if}
		<div class="post-meta">
			<time datetime={post.date}>{post.dateFormatted}</time>
			{#if post.author}
				<span>&bull;</span>
				<span class="post-author">{post.author}</span>
			{/if}
			{#if showCategory && postCategories.length > 0}
				<span>&bull;</span>
				<span class="post-categories">
					{#each postCategories as cat}
						<a
							href="/category/{cat.slug}"
							class="category-link"
						>
							{cat.name}
						</a>
					{/each}
				</span>
			{/if}
			{#if post.languages && post.languages.length > 0}
				<span>&bull;</span>
				<span class="lang-badges" aria-label="Dostupné jazyky">
					{#each post.languages as l}
						<span class="lang-badge" title={getLangTitle(l)}>
							<span class="flag-text flag-{l.toLowerCase()}">
								{getLangLabel(l)}
							</span>
						</span>
					{/each}
				</span>
			{/if}
		</div>
		{#if post.description}
			<p class="post-excerpt">{post.description}</p>
		{/if}
	</div>

	{#if post.image}
		<a href="/blog/{post.slug}" class="post-thumbnail-link" tabindex="-1" aria-hidden="true">
			<img
				src={post.image}
				alt={post.imageAlt || post.title}
				class="post-thumbnail"
				loading="lazy"
			/>
		</a>
	{/if}
</li>
