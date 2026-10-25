import { getSiteRuntimeData } from '$lib/server/config.js';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ locals }) {
	const { config, themeCss } = getSiteRuntimeData();
	const subdomainData = locals.subdomainData || null;
	const hostInfo = locals.hostInfo || null;

	if (subdomainData) {
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
				text: subdomainData.navTitle
			},
			home: {
				...(config.home || {}),
				heroTitle: subdomainData.heroTitle,
				heroLead: subdomainData.heroLead,
				heroText: subdomainData.heroText
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
