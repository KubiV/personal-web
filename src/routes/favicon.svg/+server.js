import fs from 'node:fs';
import path from 'node:path';
import { getContentPath, getSiteConfig, resolveLocalAssetFile } from '$lib/server/config.js';

export async function GET({ locals }) {
	const contentDir = getContentPath();
	const subData = locals?.subdomainData;
	const siteConfig = getSiteConfig();

	// 1. Pokud jsme na subdoméně, zkusit specifický SVG favicon subdomény (ze site.json nebo konvence v assets/)
	if (subData) {
		const subCandidates = [
			resolveLocalAssetFile(subData.favicon?.svg),
			path.join(contentDir, 'assets', `favicon-${subData.subdomain}.svg`),
			path.join(contentDir, 'assets', `${subData.subdomain}-favicon.svg`)
		].filter(Boolean);

		for (const candidate of subCandidates) {
			if (fs.existsSync(candidate)) {
				try {
					const buffer = await fs.promises.readFile(candidate);
					return new Response(buffer, {
						headers: {
							'Content-Type': 'image/svg+xml',
							'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
						}
					});
				} catch (err) {
					console.error('[favicon.svg] Chyba při čtení subdoménové favicon:', err);
				}
			}
		}
	}

	// 2. Zkontrolovat hlavní favicon nastavený v site.json nebo nahraný jako server-content/assets/favicon.svg
	const mainCandidates = [
		resolveLocalAssetFile(siteConfig?.favicon?.svg),
		path.join(contentDir, 'assets', 'favicon.svg')
	].filter(Boolean);

	for (const candidate of mainCandidates) {
		if (fs.existsSync(candidate)) {
			try {
				const buffer = await fs.promises.readFile(candidate);
				return new Response(buffer, {
					headers: {
						'Content-Type': 'image/svg+xml',
						'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
					}
				});
			} catch (err) {
				console.error('[favicon.svg] Chyba při čtení custom favicon:', err);
			}
		}
	}

	// 3. Fallback na výchozí favicon z repozitáře s dynamickým obarvením podle accentColor
	const defaultPath = path.resolve('static/favicon-default.svg');
	if (fs.existsSync(defaultPath)) {
		try {
			let svg = await fs.promises.readFile(defaultPath, 'utf-8');
			const accentColor = subData?.accentColor || siteConfig?.theme?.accentColor || '#14A4FF';
			svg = svg.replace(/fill="#14A4FF"/gi, `fill="${accentColor}"`);

			return new Response(svg, {
				headers: {
					'Content-Type': 'image/svg+xml',
					'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
				}
			});
		} catch (err) {
			console.error('[favicon.svg] Chyba při čtení výchozí favicon:', err);
		}
	}

	return new Response('Not found', { status: 404 });
}
