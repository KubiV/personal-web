import { getAllCategories, getAllPosts } from '$lib/server/content.js';

export async function load() {
	const [categories, allPosts] = await Promise.all([
		getAllCategories(),
		getAllPosts()
	]);

	return {
		categories,
		totalPosts: allPosts.length
	};
}
