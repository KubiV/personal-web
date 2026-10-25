import fs from 'node:fs';
import path from 'node:path';
import { getContentPath, getSiteConfig, resolveLocalAssetFile } from '$lib/server/config.js';

export async function GET({ locals }) {
	const contentDir = getContentPath();
	const subData = locals?.subdomainData;
	const siteConfig = getSiteConfig();

	const candidates = [
		...(subData
			? [
					resolveLocalAssetFile(subData.favicon?.appleTouchIcon),
					resolveLocalAssetFile(subData.favicon?.png),
					path.join(contentDir, 'assets', `apple-touch-icon-${subData.subdomain}.png`),
					path.join(contentDir, 'assets', `favicon-${subData.subdomain}.png`)
				]
			: []),
		resolveLocalAssetFile(siteConfig?.favicon?.appleTouchIcon),
		path.join(contentDir, 'assets', 'apple-touch-icon.png'),
		path.join(contentDir, 'assets', 'favicon.png'),
		path.resolve('static/apple-touch-icon-default.png')
	].filter(Boolean);

	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) {
			try {
				const buffer = await fs.promises.readFile(candidate);
				return new Response(buffer, {
					headers: {
						'Content-Type': 'image/png',
						'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
					}
				});
			} catch (err) {}
		}
	}

	return new Response('Not found', { status: 404 });
}
