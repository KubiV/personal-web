/**
 * Helper to generate a clean ASCII slug for category URLs.
 * Strips diacritics (e.g. Návody -> navody).
 */
export function slugifyCategory(text) {
	if (!text) return "general";
	return (
		text
			.toString()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "") || "general"
	);
}

/**
 * Normalizes post category data into an array of { name, slug } objects.
 * Safe to use in both SSR and client Svelte components.
 */
export function getPostCategories(post) {
	if (!post) return [];
	if (Array.isArray(post.categoryItems) && post.categoryItems.length > 0) {
		return post.categoryItems;
	}
	if (Array.isArray(post.categories) && post.categories.length > 0) {
		return post.categories
			.map((cat) => ({
				name: String(cat).trim(),
				slug: slugifyCategory(cat)
			}))
			.filter((c) => c.name);
	}
	if (post.category) {
		const cats =
			typeof post.category === "string" && post.category.includes(",")
				? post.category.split(",")
				: [post.category];
		return cats
			.map((cat) => ({
				name: String(cat).trim(),
				slug: slugifyCategory(cat)
			}))
			.filter((c) => c.name);
	}
	return [];
}
