import { getAllPosts, getPostsByCategory } from '$lib/server/content.js';

export async function load({ locals }) {
	const subdomainCategory = locals.subdomainData?.category;
	const posts = subdomainCategory
		? await getPostsByCategory(subdomainCategory)
		: await getAllPosts();

	return {
		recentPosts: posts.slice(0, 5)
	};
}
