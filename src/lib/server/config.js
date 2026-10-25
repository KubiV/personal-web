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
 * Locate optional runtime site.json or site.config.json in content directory or project root.
 */
function findRuntimeConfigFile() {
	const contentDir = getContentPath();
	const cwd = process.cwd();
	const candidates = [
		path.join(contentDir, 'site.json'),
		path.join(contentDir, 'site.config.json'),
		path.join(cwd, 'site.config.json'),
		path.join(cwd, 'site.json')
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

/**
 * Extract normalized host, hostname, port, and protocol from a SvelteKit RequestEvent.
 * Respects reverse proxy / Cloudflare headers (x-forwarded-host, x-forwarded-proto, host).
 */
export function getRequestHostInfo(event) {
	const headers = event?.request?.headers;
	const rawHost =
		headers?.get('x-forwarded-host')?.split(',')[0]?.trim() ||
		headers?.get('host')?.split(',')[0]?.trim() ||
		event?.url?.host ||
		event?.url?.hostname ||
		'localhost';

	let cfProto = null;
	const cfVisitor = headers?.get('cf-visitor');
	if (cfVisitor) {
		try {
			const parsed = JSON.parse(cfVisitor);
			if (parsed?.scheme === 'https' || parsed?.scheme === 'http') {
				cfProto = parsed.scheme;
			}
		} catch {}
	}

	let hostname = rawHost.toLowerCase().trim();
	let port = '';

	const colonIdx = hostname.indexOf(':');
	if (colonIdx !== -1) {
		port = hostname.slice(colonIdx);
		hostname = hostname.slice(0, colonIdx);
	}

	const isLocalHost =
		hostname === 'localhost' ||
		hostname === '127.0.0.1' ||
		hostname.endsWith('.localhost') ||
		hostname.endsWith('.lan') ||
		hostname.endsWith('.local') ||
		/^\d+\.\d+\.\d+\.\d+$/.test(hostname);

	const rawProto =
		headers?.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
		cfProto ||
		(headers?.get('cf-ray') && !isLocalHost ? 'https' : null) ||
		event?.url?.protocol?.replace(':', '') ||
		'http';

	const proto = rawProto === 'https' || rawProto === 'http' ? rawProto : 'https';

	let subCandidate = null;
	let baseHostname = hostname;

	if (hostname.endsWith('.localhost')) {
		subCandidate = hostname.slice(0, -'.localhost'.length);
		baseHostname = 'localhost';
	} else {
		const parts = hostname.split('.');
		if (parts.length >= 3) {
			subCandidate = parts[0];
			baseHostname = parts.slice(1).join('.');
		}
	}

	const baseHost = `${baseHostname}${port}`;
	const origin = `${proto}://${hostname}${port}`;
	const baseOrigin = `${proto}://${baseHost}`;

	return {
		rawHost,
		hostname,
		port,
		proto,
		subCandidate,
		baseHostname,
		baseHost,
		origin,
		baseOrigin
	};
}

/**
 * Resolve active subdomain configuration from request event.
 * Matches subdomain against `config.subdomains` in site.config.json / site.json.
 */
export function resolveSubdomainData(event) {
	const { config } = getSiteRuntimeData();
	const subdomains = config?.subdomains;
	if (!subdomains || typeof subdomains !== 'object') {
		return null;
	}

	const hostInfo = getRequestHostInfo(event);
	const candidate = hostInfo.subCandidate;

	if (!candidate || candidate === 'www') {
		return null;
	}

	const matchedKey = Object.keys(subdomains).find(
		(key) => key !== '_comment' && key.toLowerCase() === candidate.toLowerCase()
	);

	if (!matchedKey) {
		return null;
	}

	const subConfig = subdomains[matchedKey];
	if (!subConfig || typeof subConfig !== 'object') {
		return null;
	}

	const accentColor = subConfig.accentColor || config.theme?.accentColor || '#14A4FF';
	const mainSiteUrl =
		subConfig.mainSiteUrl ||
		(hostInfo.baseHostname === 'localhost' ? hostInfo.baseOrigin : config.url || hostInfo.baseOrigin) ||
		'/';

	const showSocial =
		subConfig.showSocial !== undefined
			? Boolean(subConfig.showSocial)
			: config.home?.showSocial !== undefined
				? Boolean(config.home.showSocial)
				: true;

	const showFooterSocial =
		subConfig.showFooterSocial !== undefined ? Boolean(subConfig.showFooterSocial) : true;

	const heroLogo = subConfig.heroLogo !== undefined ? subConfig.heroLogo : subConfig.logo;
	const iconUrl = subConfig.iconUrl || config.logo?.iconUrl || '/logos/logo-flat.svg';
	const logo3dOverride = subConfig.logo3d && typeof subConfig.logo3d === 'object' ? subConfig.logo3d : null;

	return {
		subdomain: matchedKey.toLowerCase(),
		category: subConfig.category || matchedKey.toLowerCase(),
		title: subConfig.title || `${config.title || 'KubiV'} | ${matchedKey}`,
		tagline: subConfig.tagline || subConfig.description || config.tagline || '',
		description: subConfig.description || config.description || '',
		accentColor,
		navTitle: subConfig.navTitle || subConfig.title || config.logo?.text || config.title || 'KubiV',
		iconUrl,
		heroTitle: subConfig.heroTitle || subConfig.title || config.home?.heroTitle || 'Vítejte',
		heroLead: subConfig.heroLead || subConfig.description || config.home?.heroLead || '',
		heroText: subConfig.heroText !== undefined ? subConfig.heroText : '',
		showSocial,
		showFooterSocial,
		heroLogo: heroLogo !== undefined ? heroLogo : null,
		logo3d: logo3dOverride,
		origin: hostInfo.origin,
		baseOrigin: hostInfo.baseOrigin,
		baseHostname: hostInfo.baseHostname,
		baseHost: hostInfo.baseHost,
		proto: hostInfo.proto,
		mainSiteUrl,
		mainSiteTitle: config.logo?.text || config.title || 'KubiV',
		themeCss: generateThemeCss(accentColor)
	};
}
