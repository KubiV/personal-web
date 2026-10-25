import { getAllPosts, getAllCategories, getPostsByCategory } from '$lib/server/content.js';

export async function load({ locals }) {
	const subdomainCategory = locals.subdomainData?.category;
	const [posts, categories] = await Promise.all([
		subdomainCategory ? getPostsByCategory(subdomainCategory) : getAllPosts(),
		getAllCategories(subdomainCategory || null)
	]);

	return {
		posts,
		categories
	};
}
