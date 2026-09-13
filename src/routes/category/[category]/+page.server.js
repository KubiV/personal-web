import { getPostsByCategory, getAllCategories } from "$lib/server/content.js";

export async function load({ params }) {
	const category = decodeURIComponent(params.category);
	const [posts, allCategories] = await Promise.all([
		getPostsByCategory(category),
		getAllCategories()
	]);

	return {
		category,
		posts,
		allCategories
	};
}
