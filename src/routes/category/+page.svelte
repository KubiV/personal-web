<script>
	import { page } from '$app/stores';
	import PostListItem from '$lib/components/PostListItem.svelte';
	export let data;

	function formatCats(count) {
		if (count === 1) return "1 kategorie";
		if (count >= 2 && count <= 4) return `${count} kategorie`;
		return `${count} kategorií`;
	}

	function formatArticles(count) {
		if (count === 1) return "1 článek";
		if (count >= 2 && count <= 4) return `${count} články`;
		return `${count} článků`;
	}
</script>

<svelte:head>
	<title>Kategorie článků - KubiV</title>
	<meta name="description" content="Prohlížeč článků podle kategorií a témat na webu KubiV." />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Kategorie článků - KubiV" />
	<meta property="og:description" content="Prohlížeč článků podle kategorií a témat na webu KubiV." />
	<meta property="og:url" content="{$page.url.origin}/category" />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="Kategorie článků - KubiV" />
	<meta name="twitter:description" content="Prohlížeč článků podle kategorií a témat na webu KubiV." />
</svelte:head>

<div class="category-overview-header">
	<nav style="margin-bottom: 1rem;">
		<a href="/blog" style="font-size: 0.9rem; color: var(--text-muted); text-decoration: none;">
			&larr; Zpět na všechny články
		</a>
	</nav>
	<h1 style="margin-bottom: 0.5rem;">Kategorie článků</h1>
	<p style="color: var(--text-muted); margin-bottom: 1.5rem;">
		Přehled témat a článků rozdělených podle jednotlivých kategorií ({formatCats(data.categories.length)}, {formatArticles(data.totalPosts)}).
	</p>
</div>

{#if data.categories.length === 0}
	<div class="empty-state">
		<p>Zatím nebyly nalezeny žádné kategorie.</p>
	</div>
{:else}
	<!-- Quick category jump pills -->
	<div class="category-pills-bar" style="margin-bottom: 2.5rem;">
		{#each data.categories as cat}
			<a href="/category/{cat.slug}" class="category-pill-link">
				<span class="pill-name">{cat.name}</span>
				<span class="pill-count">{cat.count}</span>
			</a>
		{/each}
	</div>

	<!-- Category sections listing posts -->
	<div class="category-sections">
		{#each data.categories as cat}
			<section class="category-group" id={cat.slug} style="margin-bottom: 3rem;">
				<div class="category-group-header">
					<h2>
						<a href="/category/{cat.slug}">{cat.name}</a>
					</h2>
					<span class="category-count-badge">
						{formatArticles(cat.count)}
					</span>
				</div>

				<ul class="post-list">
					{#each cat.posts as post}
						<PostListItem {post} headingLevel="h3" showCategory={false} />
					{/each}
				</ul>
			</section>
		{/each}
	</div>
{/if}
