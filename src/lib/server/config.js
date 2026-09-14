import fs from 'node:fs';
import path from 'node:path';
import { defaultSiteConfig } from '../config/site.config.js';
import { generateThemeCss } from '../themeColors.js';

/**
 * Resolve the base content path.
 * In production / Docker, this defaults to /data/content.
 * In local development, falls back to ./server-content if /data/content does not exist.
 */
export function getContentPath() {
	if (process.env.CONTENT_PATH) {
		return path.resolve(process.env.CONTENT_PATH);
	}
	if (fs.existsSync('/data/content')) {
		return '/data/content';
	}
	return path.resolve(process.cwd(), 'server-content');
}

/**
 * Deep merge utility for objects.
 * Target keys take precedence over source keys.
 * Preserves default values for any keys omitted in target.
 */
function deepMerge(source, target) {
	if (!target || typeof target !== 'object' || Array.isArray(target)) {
		return target !== undefined ? target : source;
	}

	const result = { ...source };

	for (const key of Object.keys(target)) {
		const targetVal = target[key];
		const sourceVal = source ? source[key] : undefined;

		if (
			targetVal &&
			typeof targetVal === 'object' &&
			!Array.isArray(targetVal) &&
			sourceVal &&
			typeof sourceVal === 'object' &&
			!Array.isArray(sourceVal)
		) {
			result[key] = deepMerge(sourceVal, targetVal);
		} else if (targetVal !== undefined) {
			result[key] = targetVal;
		}
	}

	return result;
}

// In-memory cache for configuration with mtime tracking
let cachedConfig = null;
let cachedThemeCss = null;
let lastCheckTime = 0;
let lastFileMtime = 0;
let lastFilePath = null;

const CACHE_CHECK_INTERVAL_MS = 2000; // Check file stat at most once every 2 seconds

/**
 * Locate optional runtime site.json in content directory.
 * Checks server-content/site.json or server-content/site.config.json.
 */
function findRuntimeConfigFile() {
	const contentDir = getContentPath();
	const candidates = [
		path.join(contentDir, 'site.json'),
		path.join(contentDir, 'site.config.json')
	];

	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) {
			return candidate;
		}
	}
	return null;
}

/**
 * Loads the active site configuration.
 * Merges defaultSiteConfig with runtime server-content/site.json (if present).
 * Automatically hot-reloads when site.json is edited on disk or via Filebrowser.
 *
 * @returns {{ config: typeof defaultSiteConfig, themeCss: string }}
 */
export function getSiteRuntimeData() {
	const now = Date.now();
	const configFile = findRuntimeConfigFile();

	// If no config file exists and we have defaults cached, return them
	if (!configFile) {
		if (!cachedConfig || lastFilePath !== null) {
			cachedConfig = { ...defaultSiteConfig };
			cachedThemeCss = generateThemeCss(cachedConfig.theme?.accentColor || '#14A4FF');
			lastFilePath = null;
			lastFileMtime = 0;
		}
		return { config: cachedConfig, themeCss: cachedThemeCss };
	}

	// Throttle filesystem stat checks for performance
	if (cachedConfig && configFile === lastFilePath && now - lastCheckTime < CACHE_CHECK_INTERVAL_MS) {
		return { config: cachedConfig, themeCss: cachedThemeCss };
	}

	lastCheckTime = now;

	try {
		const stat = fs.statSync(configFile);
		if (cachedConfig && stat.mtimeMs === lastFileMtime && configFile === lastFilePath) {
			return { config: cachedConfig, themeCss: cachedThemeCss };
		}

		const rawContent = fs.readFileSync(configFile, 'utf-8');
		const userConfig = JSON.parse(rawContent);

		const merged = deepMerge(defaultSiteConfig, userConfig);

		// Zpětná kompatibilita pro starší konfigurace s flat logo.show3D / model3d
		if (userConfig?.logo) {
			if (userConfig.logo.show3D !== undefined && (!userConfig.logo3d || userConfig.logo3d.enabled === undefined)) {
				merged.logo3d.enabled = Boolean(userConfig.logo.show3D);
				merged.logo3d.showOnHome = Boolean(userConfig.logo.show3D);
			}
			if (userConfig.logo.model3d && (!userConfig.logo3d || !userConfig.logo3d.home?.model)) {
				merged.logo3d.home.model = userConfig.logo.model3d;
			}
			if (userConfig.logo.fallback3d && (!userConfig.logo3d || !userConfig.logo3d.home?.fallbackImage)) {
				merged.logo3d.home.fallbackImage = userConfig.logo.fallback3d;
			}
		}

		const accentColor = merged.theme?.accentColor || '#14A4FF';

		cachedConfig = merged;
		cachedThemeCss = generateThemeCss(accentColor);
		lastFileMtime = stat.mtimeMs;
		lastFilePath = configFile;

		return { config: cachedConfig, themeCss: cachedThemeCss };
	} catch (err) {
		console.error(`[site.config] Chyba při načítání souboru ${configFile}:`, err);
		// Fallback to default config on error (e.g. invalid JSON syntax during editing)
		if (!cachedConfig) {
			cachedConfig = { ...defaultSiteConfig };
			cachedThemeCss = generateThemeCss(cachedConfig.theme?.accentColor || '#14A4FF');
		}
		return { config: cachedConfig, themeCss: cachedThemeCss };
	}
}

/**
 * Get active site configuration object.
 */
export function getSiteConfig() {
	return getSiteRuntimeData().config;
}

/**
 * Get generated dynamic theme CSS variables for the active accent color.
 */
export function getThemeCss() {
	return getSiteRuntimeData().themeCss;
}
