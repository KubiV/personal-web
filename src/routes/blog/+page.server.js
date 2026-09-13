import { getAllPosts, getAllCategories } from '$lib/server/content.js';

export async function load() {
	const [posts, categories] = await Promise.all([
		getAllPosts(),
		getAllCategories()
	]);

	return {
		posts,
		categories
	};
}
