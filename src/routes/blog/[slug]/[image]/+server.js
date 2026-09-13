import fs from 'node:fs';
import path from 'node:path';
import { error } from '@sveltejs/kit';
import { getBlogPath, sanitizeSlug } from '$lib/server/content.js';

const MIME_TYPES = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.avif': 'image/avif',
	'.ico': 'image/x-icon',
	'.bmp': 'image/bmp'
};

export async function GET({ params }) {
	const { slug, image } = params;

	// Validate slug
	const validSlug = sanitizeSlug(slug);
	if (!validSlug) {
		throw error(404, 'Invalid article path');
	}

	// Validate image filename against path traversal
	if (!image || image.includes('..') || image.includes('/') || image.includes('\\') || image.includes('\0')) {
		throw error(400, 'Invalid image filename');
	}

	const blogDir = getBlogPath();
	const articleDir = path.join(blogDir, validSlug);
	const filePath = path.join(articleDir, image);

	// Strict containment check: ensure resolved path is inside the article directory
	const resolvedPath = path.resolve(filePath);
	if (!resolvedPath.startsWith(path.resolve(articleDir))) {
		throw error(403, 'Access denied');
	}

	// Check if file exists and is actually a file
	try {
		const stat = await fs.promises.stat(resolvedPath);
		if (!stat.isFile()) {
			throw error(404, 'Image not found');
		}
	} catch (err) {
		if (err.status) throw err;
		throw error(404, 'Image not found');
	}

	// Determine MIME type
	const ext = path.extname(image).toLowerCase();
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
		console.error(`Failed to read image at ${resolvedPath}:`, err);
		throw error(500, 'Could not read image file');
	}
}
