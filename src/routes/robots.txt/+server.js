export const prerender = false;

export async function GET({ url }) {
	const origin = process.env.PUBLIC_SITE_URL || process.env.ORIGIN || url.origin;
	const body = [
		'User-agent: *',
		'Allow: /',
		'',
		`Sitemap: ${origin}/sitemap.xml`
	].join('\n');

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
}
