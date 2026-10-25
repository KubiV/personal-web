import { getAllPosts, getAllCategories, getPostsByCategory } from '$lib/server/content';
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

	const subdomainCategory = subdomainData?.category || null;
	const [posts, categories] = await Promise.all([
		subdomainCategory ? getPostsByCategory(subdomainCategory) : getAllPosts(),
		getAllCategories(subdomainCategory)
	]);

	const latestPostDate = posts.length > 0 ? posts[0].date : null;

	const staticPages = [
		{ loc: '', lastmod: latestPostDate, changefreq: 'daily', priority: '1.0' },
		{ loc: '/blog', lastmod: latestPostDate, changefreq: 'daily', priority: '0.9' },
		{ loc: '/category', lastmod: latestPostDate, changefreq: 'weekly', priority: '0.7' },
		{ loc: '/about', lastmod: null, changefreq: 'monthly', priority: '0.7' }
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${staticPages
	.map(
		(page) => `  <url>
    <loc>${origin}${page.loc}</loc>${page.lastmod ? `\n    <lastmod>${page.lastmod}</lastmod>` : ''}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
	)
	.join('\n')}
${categories
	.map((cat) => {
		const catLastmod = cat.posts && cat.posts.length > 0 ? cat.posts[0].date : latestPostDate;
		return `  <url>
    <loc>${origin}/category/${cat.slug}</loc>${catLastmod ? `\n    <lastmod>${catLastmod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
	})
	.join('\n')}
${posts
	.map((post) => {
		const hasMultipleLangs = post.languages && post.languages.length > 1;
		const alternates = hasMultipleLangs
			? post.languages
					.map(
						(l) =>
							`    <xhtml:link rel="alternate" hreflang="${l}" href="${origin}/blog/${post.slug}?lang=${l}" />`
					)
					.concat([
						`    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/blog/${post.slug}" />`
					])
					.join('\n')
			: '';

		return `  <url>
    <loc>${origin}/blog/${post.slug}</loc>
    <lastmod>${post.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>${alternates ? '\n' + alternates : ''}
  </url>`;
	})
	.join('\n')}
</urlset>`.trim();

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
}
