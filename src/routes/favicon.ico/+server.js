import fs from 'node:fs';
import path from 'node:path';
import { getContentPath } from '$lib/server/config.js';

export async function GET() {
	const contentDir = getContentPath();

	// 1. Zkontrolovat favicon.ico v server-content/assets/
	const customIcoPath = path.join(contentDir, 'assets', 'favicon.ico');
	if (fs.existsSync(customIcoPath)) {
		try {
			const buffer = await fs.promises.readFile(customIcoPath);
			return new Response(buffer, {
				headers: {
					'Content-Type': 'image/x-icon',
					'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
				}
			});
		} catch (err) {
			console.error('[favicon.ico] Chyba při čtení custom ico:', err);
		}
	}

	// 2. Pokud uživatel nahrál favicon.png, servírovat jej s MIME x-icon
	const customPngPath = path.join(contentDir, 'assets', 'favicon.png');
	if (fs.existsSync(customPngPath)) {
		try {
			const buffer = await fs.promises.readFile(customPngPath);
			return new Response(buffer, {
				headers: {
					'Content-Type': 'image/x-icon',
					'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
				}
			});
		} catch (err) {}
	}

	// 3. Fallback na favicon-default.png
	const defaultPngPath = path.resolve('static/favicon-default.png');
	if (fs.existsSync(defaultPngPath)) {
		try {
			const buffer = await fs.promises.readFile(defaultPngPath);
			return new Response(buffer, {
				headers: {
					'Content-Type': 'image/x-icon',
					'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
				}
			});
		} catch (err) {}
	}

	return new Response('Not found', { status: 404 });
}
