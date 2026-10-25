import { getAllCategories, getAllPosts, getPostsByCategory } from '$lib/server/content.js';

export async function load({ locals }) {
	const subdomainCategory = locals.subdomainData?.category;
	const [categories, allPosts] = await Promise.all([
		getAllCategories(subdomainCategory || null),
		subdomainCategory ? getPostsByCategory(subdomainCategory) : getAllPosts()
	]);

	return {
		categories,
		totalPosts: allPosts.length
	};
}
