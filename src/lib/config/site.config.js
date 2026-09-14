/**
 * site.config.js
 * Centrální výchozí konfigurace osobního webu.
 *
 * POZNÁMKA PRO AKTUALIZACE:
 * Tento soubor je verzován v gitu a slouží jako bezpečná výchozí šablona.
 * Pro osobní úpravy na serveru (které NIKDY nepřepíše git pull origin main)
 * můžete vytvořit soubor `server-content/site.json`, který tyto hodnoty
 * automaticky a dynamicky přepisuje.
 */

export const defaultSiteConfig = {
	// Základní metadata webu
	title: 'KubiV',
	tagline: 'Personal Website',
	description: 'Osobní web a blog KubiV - technologie, software, hardware a projekty.',
	url: 'https://kubiv.cz',
	locale: 'cs-CZ',

	// Výchozí autor článků a vlastník webu
	author: {
		name: 'KubiV',
		bio: 'Technologický nadšenec, software & hardware.',
		url: '/about',
		github: 'https://github.com/KubiV'
	},

	// Vizuální styl a centrální barva webu
	theme: {
		// Centrální barva akcentu (HEX). Z této barvy se automaticky počítají
		// hover stavy, jemná podbarvení, záře a horní barevný pruh webu.
		// Příklady: "#14A4FF" (výchozí modrá), "#10b981" (emerald zelená), "#8b5cf6" (fialová)
		accentColor: '#14A4FF'
	},

	// Nastavení loga a ikon
	logo: {
		// Text zobrazený v hlavičce vedle loga
		text: 'KubiV',

		// Cesta k plochému logu (SVG nebo rastrový obrázek).
		// Může odkazovat do /logos/logo-flat.svg nebo do /custom-assets/logo.svg
		iconUrl: '/logos/logo-flat.svg',

		// Zda zobrazovat interaktivní 3D logo v úvodu hlavní stránky
		show3D: true,

		// Cesta k 3D modelu (.glb nebo .obj)
		model3d: '/models/logo.glb',

		// Náhradní 3D render (PNG) pro zařízení bez WebGL nebo během načítání
		fallback3d: '/logos/logo-3d.png'
	},

	// Favikony webu
	favicon: {
		svg: '/favicon.svg',
		png: '/favicon.png',
		appleTouchIcon: '/apple-touch-icon.png'
	},

	// Odkazy na sociální sítě v patičce a v úvodu
	// Pokud je hodnota prázdná ("" nebo null), daná ikona se nezobrazí.
	social: {
		twitter: 'https://twitter.com/kubi_vav',
		youtube: 'https://www.youtube.com/channel/UC4giHTe7Ym-1kSip5TNiltQ',
		twitch: 'https://www.twitch.tv/kubivak',
		instagram: 'https://www.instagram.com/kubivcz/',
		linkedin: 'https://www.linkedin.com/in/jakub-vavra',
		github: 'https://github.com/KubiV'
	},

	// Položky hlavní navigace v hlavičce webu
	nav: [
		{ label: 'Home', href: '/' },
		{ label: 'Blog', href: '/blog' },
		{ label: 'Kategorie', href: '/category' },
		{ label: 'O mně', href: '/about' }
	],

	// Texty úvodní sekce na hlavní stránce
	home: {
		heroTitle: 'Vítejte',
		heroLead:
			'Vítejte v mém osobním koutku webu. Najdete zde články, poznámky a návody věnované moderním technologiím, softwarovému vývoji a zajímavým projektům.',
		heroText:
			'Můžete si projít nejnovější články níže, filtrovat podle témat v prohlížeči kategorií, nebo si přečíst více o mně.'
	},

	// Patička webu
	footer: {
		copyright: 'KubiV',
		showYear: true
	}
};
