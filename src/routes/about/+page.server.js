import { getAboutContent } from '$lib/server/content.js';

export async function load({ url }) {
	const requestedLang = url.searchParams.get('lang') || 'cs';
	const about = await getAboutContent(requestedLang);

	return {
		about
	};
}
