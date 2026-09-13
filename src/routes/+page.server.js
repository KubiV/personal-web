import { getAllPosts } from '$lib/server/content.js';

export async function load() {
	const posts = await getAllPosts();
	return {
		recentPosts: posts.slice(0, 5)
	};
}
