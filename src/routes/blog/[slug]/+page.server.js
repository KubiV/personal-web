import { error } from '@sveltejs/kit';
import { getPostBySlug } from '$lib/server/content.js';

export async function load({ params, url }) {
	const requestedLang = url.searchParams.get('lang') || 'cs';
	const post = await getPostBySlug(params.slug, requestedLang);

	if (!post) {
		throw error(404, {
			message: `Article "${params.slug}" was not found.`
		});
	}

	return {
		post
	};
}
