/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const lang = event.url.searchParams.get('lang') || 'cs';
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang)
	});
}
