import fs from 'node:fs';
import path from 'node:path';
import { error } from '@sveltejs/kit';
import { getContentPath } from '$lib/server/config.js';

const MIME_TYPES = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.avif': 'image/avif',
	'.ico': 'image/x-icon',
	'.bmp': 'image/bmp',
	'.glb': 'model/gltf-binary',
	'.gltf': 'model/gltf+json',
	'.obj': 'text/plain',
	'.mtl': 'text/plain',
	'.bin': 'application/octet-stream',
	'.woff2': 'font/woff2',
	'.woff': 'font/woff',
	'.ttf': 'font/ttf'
};

export async function GET({ params }) {
	const relFile = params.file;

	if (!relFile || relFile.includes('..') || relFile.includes('\0')) {
		throw error(400, 'Invalid asset path');
	}

	const assetsDir = path.join(getContentPath(), 'assets');
	const filePath = path.join(assetsDir, relFile);

	// Strict containment check: ensure resolved path is inside assets directory
	const resolvedPath = path.resolve(filePath);
	if (!resolvedPath.startsWith(path.resolve(assetsDir))) {
		throw error(403, 'Access denied');
	}

	try {
		const stat = await fs.promises.stat(resolvedPath);
		if (!stat.isFile()) {
			throw error(404, 'Asset not found');
		}
	} catch (err) {
		if (err.status) throw err;
		throw error(404, 'Asset not found');
	}

	const ext = path.extname(relFile).toLowerCase();
	const contentType = MIME_TYPES[ext] || 'application/octet-stream';

	try {
		const fileBuffer = await fs.promises.readFile(resolvedPath);
		return new Response(fileBuffer, {
			headers: {
				'Content-Type': contentType,
				'Content-Length': fileBuffer.length.toString(),
				'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
			}
		});
	} catch (err) {
		console.error(`[custom-assets] Chyba při čtení souboru ${resolvedPath}:`, err);
		throw error(500, 'Could not read asset file');
	}
}
