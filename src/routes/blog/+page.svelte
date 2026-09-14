<script>
	import { page } from '$app/stores';
	import PostListItem from '$lib/components/PostListItem.svelte';
	export let data;
	let activeFilter = 'all';

	$: filteredPosts = activeFilter === 'all'
		? data.posts
		: data.posts.filter((p) =>
				p.categories.some((c) => c.toLowerCase() === activeFilter.toLowerCase())
			);
</script>

<svelte:head>
	<title>Blog - KubiV</title>
	<meta name="description" content="Články, poznámky a návody na webu KubiV." />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Blog - KubiV" />
	<meta property="og:description" content="Články, poznámky a návody na webu KubiV." />
	<meta property="og:url" content="{$page.url.origin}/blog" />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="Blog - KubiV" />
	<meta name="twitter:description" content="Články, poznámky a návody na webu KubiV." />
</svelte:head>

<div style="margin-bottom: 2rem;">
	<h1 style="margin-bottom: 0.5rem;">Blog</h1>
	<p style="color: var(--text-muted); margin-bottom: 1.25rem;">
		Články, poznámky a návody načítané v reálném čase.
	</p>

	{#if data.categories && data.categories.length > 0}
		<div class="category-filter-bar">
			<div class="category-pills-bar">
				<button
					type="button"
					class="category-pill-button"
					class:active={activeFilter === 'all'}
					on:click={() => (activeFilter = 'all')}
				>
					Všechny ({data.posts.length})
				</button>
				{#each data.categories as cat}
					<button
						type="button"
						class="category-pill-button"
						class:active={activeFilter.toLowerCase() === cat.name.toLowerCase()}
						on:click={() =>
							(activeFilter =
								activeFilter.toLowerCase() === cat.name.toLowerCase() ? 'all' : cat.name)}
					>
						<span class="pill-name">{cat.name}</span>
						<span class="pill-count">{cat.count}</span>
					</button>
				{/each}
			</div>
			<div style="margin-top: 0.5rem;">
				<a href="/category" class="category-browse-link">
					Otevřít přehled kategorií &rarr;
				</a>
			</div>
		</div>
	{/if}
</div>

{#if filteredPosts.length === 0}
	<div class="empty-state">
		<p>Pro zvolený filtr nebyly nalezeny žádné články.</p>
		{#if activeFilter !== 'all'}
			<button
				type="button"
				class="category-pill-button"
				style="margin-top: 0.5rem;"
				on:click={() => (activeFilter = 'all')}
			>
				Zobrazit všechny články
			</button>
		{/if}
	</div>
{:else}
	<ul class="post-list">
		{#each filteredPosts as post}
			<PostListItem {post} />
		{/each}
	</ul>
{/if}
