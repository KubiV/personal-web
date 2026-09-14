import { getAllPosts, getAllCategories } from '$lib/server/content';

export const prerender = false;

export async function GET({ url }) {
	const origin = process.env.PUBLIC_SITE_URL || process.env.ORIGIN || url.origin;
	const posts = await getAllPosts();
	const categories = await getAllCategories();

	const staticPages = [
		{ loc: '', changefreq: 'weekly', priority: '1.0' },
		{ loc: '/blog', changefreq: 'daily', priority: '0.8' },
		{ loc: '/category', changefreq: 'weekly', priority: '0.7' },
		{ loc: '/about', changefreq: 'monthly', priority: '0.7' }
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${staticPages
	.map(
		(page) => `  <url>
    <loc>${origin}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
	)
	.join('\n')}
${categories
	.map(
		(cat) => `  <url>
    <loc>${origin}/category/${cat.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
	)
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
