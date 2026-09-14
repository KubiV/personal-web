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

	// Nastavení loga v hlavičce webu
	logo: {
		// Text zobrazený v hlavičce vedle loga
		text: 'KubiV',

		// Cesta k plochému logu (SVG nebo rastrový obrázek).
		// Může odkazovat do /logos/logo-flat.svg nebo do /custom-assets/logo.svg
		iconUrl: '/logos/logo-flat.svg'
	},

	// Nastavení interaktivního 3D loga a modelů
	logo3d: {
		// Globální zapnutí / vypnutí 3D modelů na celém webu (true = zapnuto, false = vypnuto)
		enabled: true,

		// Zda zobrazovat 3D model na hlavní stránce v úvodu (Home)
		showOnHome: true,

		// Zda zobrazovat 3D model (např. panáčka) v sekci "O mně"
		showOnAbout: true,

		// Specifické nastavení pro hlavní stránku
		home: {
			model: '/models/logo.glb',
			fallbackImage: '/logos/logo-3d.png',
			size: 125
		},

		// Specifické nastavení pro sekci "O mně"
		// Pokud model nebo fallbackImage ponecháte prázdné (""), použijí se automaticky hodnoty z home.
		// Lze sem zadat např. "/models/pandulak.obj" nebo vlastní model ze server-content/assets/
		about: {
			model: '',
			fallbackImage: '',
			size: 110
		}
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

	// Texty profilové karty v sekci "O mně"
	about: {
		title: 'O mně',
		description: 'Představení, technologické zaměření, projekty a kontakt na KubiV.'
	},

	// Patička webu
	footer: {
		copyright: 'KubiV',
		showYear: true
	}
};
