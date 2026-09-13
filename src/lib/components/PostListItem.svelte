<script>
	export let post;
	export let headingLevel = 'h2';
	export let showCategory = true;
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
			{#if showCategory && post.category}
				<span>&bull;</span>
				<a
					href="/category/{post.categorySlug || encodeURIComponent(post.category.toLowerCase())}"
					class="category-link"
				>
					{post.category}
				</a>
			{/if}
			{#if post.languages && post.languages.length > 0}
				<span class="lang-badges">
					{#each post.languages as l}
						<span class="lang-badge" class:accent={l === 'en'}>{l.toUpperCase()}</span>
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
