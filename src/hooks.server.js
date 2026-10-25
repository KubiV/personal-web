import { resolveSubdomainData, getRequestHostInfo } from '$lib/server/config.js';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const lang = event.url.searchParams.get('lang') || 'cs';
	event.locals.subdomainData = resolveSubdomainData(event);
	event.locals.hostInfo = getRequestHostInfo(event);

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang)
	});
}
