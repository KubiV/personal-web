import { getSiteConfig } from '$lib/server/config.js';

export const prerender = false;

export async function GET({ url, locals }) {
	const siteConfig = getSiteConfig();
	const subdomainData = locals?.subdomainData;
	const hostInfo = locals?.hostInfo;

	const origin = subdomainData
		? subdomainData.origin
		: process.env.PUBLIC_SITE_URL ||
			process.env.ORIGIN ||
			(hostInfo?.hostname && hostInfo.hostname !== 'localhost' ? hostInfo.origin : null) ||
			siteConfig?.url ||
			url.origin;
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
