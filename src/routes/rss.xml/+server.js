import { getAllPosts, getPostsByCategory } from '$lib/server/content';
import { getSiteConfig } from '$lib/server/config.js';

export const prerender = false;

function escapeXml(str) {
	if (!str) return '';
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

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

	const subdomainCategory = subdomainData?.category || null;
	const posts = subdomainCategory ? await getPostsByCategory(subdomainCategory) : await getAllPosts();

	const siteTitle = subdomainData?.title || siteConfig?.title || 'KubiV';
	const siteDescription =
		subdomainData?.description ||
		siteConfig?.description ||
		'Osobní web a blog KubiV - technologie, software, hardware a projekty.';
	const lastBuildDate =
		posts.length > 0 ? new Date(posts[0].date).toUTCString() : new Date().toUTCString();

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <link>${origin}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>${escapeXml(siteConfig?.locale || 'cs-CZ')}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml" />
${posts
	.map((post) => {
		const postUrl = `${origin}/blog/${post.slug}`;
		const pubDate = new Date(post.date).toUTCString();
		const categoriesXml = (post.categories || [])
			.map((cat) => `      <category>${escapeXml(cat)}</category>`)
			.join('\n');

		return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(post.description || post.title)}</description>${categoriesXml ? '\n' + categoriesXml : ''}
    </item>`;
	})
	.join('\n')}
  </channel>
</rss>`.trim();

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
}
