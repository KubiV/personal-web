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

	// Nastavení interaktivního 3D loga a modelů (podporuje .glb, .gltf, .obj, .stl)
	logo3d: {
		// Globální zapnutí / vypnutí 3D modelů na celém webu (true = zapnuto, false = vypnuto)
		enabled: true,

		// Zda zobrazovat 3D model na hlavní stránce v úvodu (Home)
		showOnHome: true,

		// Zda zobrazovat 3D model (např. panáčka) v sekci "O mně"
		showOnAbout: true,

		// Specifické nastavení pro hlavní stránku
		home: {
			// Cesta k modelu: např. '/models/logo.obj' (v repozitáři) nebo '/custom-assets/logo.obj' (z nahraných v server-content/assets/)
			model: '/models/logo.obj',
			// Volitelná obrázková textura (PNG, JPG, WebP)
			texture: '',
			// Volitelný materiálový soubor pro OBJ (.mtl)
			material: '',
			// Volitelná barva modelu (HEX např. '#0095f8'), pokud model nemá vlastní texturu/materiál
			color: '',
			// Kovovost PBR materiálu (0.0 až 1.0)
			metalness: 0.50,
			// Drsnost PBR materiálu (0.0 až 1.0)
			roughness: 0.36,
			// Výchozí natočení ve stupních { x, y, z }
			rotation: { x: 0, y: 0, z: 0 },
			// Měřítko modelu (výchozí 1)
			scale: 1,
			fallbackImage: '/logos/logo-3d.png',
			size: 125
		},

		// Specifické nastavení pro sekci "O mně"
		// Pokud model nebo fallbackImage ponecháte prázdné (""), použijí se automaticky hodnoty z home.
		// Lze sem zadat např. "/models/pandulak.obj" nebo vlastní model ze server-content/assets/ (přes '/custom-assets/...')
		about: {
			model: '',
			texture: '',
			material: '',
			color: '',
			metalness: 0.50,
			roughness: 0.36,
			rotation: { x: 0, y: 0, z: 0 },
			scale: 1,
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
	},

	// Pravidla pro tematické subdomény na jedné instanci (např. med.vavra.pro -> "med")
	subdomains: {}
};
