import fs from 'node:fs';
import path from 'node:path';
import { error } from '@sveltejs/kit';
import {
	getBlogPath,
	sanitizeSlug,
	findFileInDir,
	COMMON_MIME_TYPES,
	INLINE_ASSET_EXTENSIONS
} from '$lib/server/content.js';

export async function GET({ params, url }) {
	const { slug, file } = params;

	const validSlug = sanitizeSlug(slug);
	if (!validSlug) {
		throw error(404, 'Invalid article path');
	}

	if (!file || file.includes('..') || file.includes('\\') || file.includes('\0')) {
		throw error(400, 'Invalid asset path');
	}

	const blogDir = getBlogPath();
	const articleDir = path.resolve(blogDir, validSlug);
	const targetDir = path.resolve(articleDir, path.dirname(file));
	const baseName = path.basename(file);

	if (!targetDir.startsWith(articleDir)) {
		throw error(403, 'Access denied');
	}

	const found = await findFileInDir(targetDir, baseName);
	if (!found) {
		throw error(404, 'File not found');
	}

	const resolvedPath = path.resolve(found.fullPath);
	if (!resolvedPath.startsWith(articleDir + path.sep)) {
		throw error(403, 'Access denied');
	}

	const ext = path.extname(found.filename).toLowerCase();
	const contentType = COMMON_MIME_TYPES[ext] || 'application/octet-stream';

	const forceDownload = url.searchParams.has('download');
	const isInline = !forceDownload && INLINE_ASSET_EXTENSIONS.has(ext);
	const disposition = isInline
		? 'inline'
		: `attachment; filename="${encodeURIComponent(found.filename)}"; filename*=UTF-8''${encodeURIComponent(found.filename)}`;

	const isCodeOrHtml = ['.html', '.htm', '.js', '.mjs', '.css', '.json'].includes(ext);
	const cacheControl = isCodeOrHtml
		? 'public, max-age=300, stale-while-revalidate=3600'
		: 'public, max-age=86400, stale-while-revalidate=604800';

	try {
		const fileBuffer = await fs.promises.readFile(resolvedPath);
		return new Response(fileBuffer, {
			headers: {
				'Content-Type': contentType,
				'Content-Length': fileBuffer.length.toString(),
				'Content-Disposition': disposition,
				'X-Content-Type-Options': 'nosniff',
				'Cache-Control': cacheControl
			}
		});
	} catch (err) {
		console.error(`Failed to read nested article asset at ${resolvedPath}:`, err);
		throw error(500, 'Could not read file');
	}
}
