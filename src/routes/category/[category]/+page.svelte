<script>
	import PostListItem from '$lib/components/PostListItem.svelte';
	export let data;
	$: currentCategoryLower = data.category.toLowerCase();

	function formatArticles(count) {
		if (count === 1) return "1 článek";
		if (count >= 2 && count <= 4) return `${count} články`;
		return `${count} článků`;
	}
</script>

<svelte:head>
	<title>Kategorie: {data.category} - KubiV</title>
	<meta name="description" content="Články v kategorii {data.category} na webu KubiV." />
</svelte:head>

<div class="category-header" style="margin-bottom: 2rem;">
	<nav style="margin-bottom: 1rem; display: flex; gap: 1rem; font-size: 0.9rem;">
		<a href="/category" style="color: var(--text-muted); text-decoration: none;">
			&larr; Všechny kategorie
		</a>
		<span style="color: var(--border);">&bull;</span>
		<a href="/blog" style="color: var(--text-muted); text-decoration: none;">
			Všechny články
		</a>
	</nav>
	<h1 style="margin-bottom: 0.5rem; text-transform: capitalize;">Kategorie: {data.category}</h1>
	<p style="color: var(--text-muted); margin-bottom: 1.25rem;">
		Výpis článků zařazených v kategorii {data.category} ({formatArticles(data.posts.length)}).
	</p>

	{#if data.allCategories && data.allCategories.length > 0}
		<div class="category-pills-bar">
			<a href="/category" class="category-pill-link">
				<span class="pill-name">Všechny</span>
			</a>
			{#each data.allCategories as cat}
				<a
					href="/category/{cat.slug}"
					class="category-pill-link"
					class:active={cat.name.toLowerCase() === currentCategoryLower}
				>
					<span class="pill-name">{cat.name}</span>
					<span class="pill-count">{cat.count}</span>
				</a>
			{/each}
		</div>
	{/if}
</div>

{#if data.posts.length === 0}
	<div class="empty-state">
		<p>V kategorii "{data.category}" zatím nebyly nalezeny žádné články.</p>
		<p style="margin-top: 0.5rem;"><a href="/category">Prohlédnout všechny kategorie &rarr;</a></p>
	</div>
{:else}
	<ul class="post-list">
		{#each data.posts as post}
			<PostListItem {post} />
		{/each}
	</ul>
{/if}
