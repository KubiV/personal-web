import { getSiteRuntimeData } from '$lib/server/config.js';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ locals }) {
	const { config, themeCss } = getSiteRuntimeData();
	const subdomainData = locals.subdomainData || null;
	const hostInfo = locals.hostInfo || null;

	if (subdomainData) {
		const subLogo3d = subdomainData.logo3d || {};
		const is3dHeroLogo =
			typeof subdomainData.heroLogo === 'string' &&
			/\.(glb|gltf|obj|stl)$/i.test(subdomainData.heroLogo.trim());

		const mergedHomeLogo3d = {
			...(config.logo3d?.home || {}),
			...(subLogo3d.home || subLogo3d),
			...(is3dHeroLogo ? { model: subdomainData.heroLogo.trim() } : {}),
			color:
				subLogo3d.home?.color ||
				subLogo3d.color ||
				config.logo3d?.home?.color ||
				subdomainData.accentColor
		};

		const effectiveConfig = {
			...config,
			title: subdomainData.title,
			tagline: subdomainData.tagline,
			description: subdomainData.description,
			theme: {
				...(config.theme || {}),
				accentColor: subdomainData.accentColor
			},
			logo: {
				...(config.logo || {}),
				text: subdomainData.navTitle,
				iconUrl: subdomainData.iconUrl || config.logo?.iconUrl
			},
			favicon: subdomainData.favicon || config.favicon,
			logo3d: {
				...(config.logo3d || {}),
				...(subLogo3d.enabled !== undefined ? { enabled: Boolean(subLogo3d.enabled) } : {}),
				...(subLogo3d.showOnHome !== undefined ? { showOnHome: Boolean(subLogo3d.showOnHome) } : {}),
				...(subdomainData.heroLogo === false || subdomainData.heroLogo === 'none'
					? { showOnHome: false }
					: {}),
				home: mergedHomeLogo3d
			},
			home: {
				...(config.home || {}),
				heroTitle: subdomainData.heroTitle,
				heroLead: subdomainData.heroLead,
				heroText: subdomainData.heroText,
				showSocial: subdomainData.showSocial,
				heroLogo: subdomainData.heroLogo
			}
		};

		return {
			siteConfig: effectiveConfig,
			themeCss: subdomainData.themeCss,
			subdomainData,
			hostInfo
		};
	}

	return {
		siteConfig: config,
		themeCss,
		subdomainData: null,
		hostInfo
	};
}
