# ⚙️ Centrální konfigurace webu a bezpečné aktualizace

Tento dokument detailně popisuje architekturu konfigurace webu, způsob změny centrální barvy, výchozího autora, názvu webu, nastavení 3D modelů (Home i sekce O mně) a správné umístění favikon a log. Zároveň vysvětluje, jak je zajištěna **100% kompatibilita při aktualizacích z GitHubu**.

---

## 🚀 Rychlý přehled: Dvě úrovně konfigurace

Web využívá robustní dvouúrovňový konfigurační systém:

```text
┌─────────────────────────────────────────────────────────────────┐
│ 1. Výchozí konfigurace v repozitáři                             │
│    src/lib/config/site.config.js                                │
│    - Verzována v Gitu                                           │
│    - Obsahuje výchozí hodnoty pro celý web                      │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼ (Deep Merge při běhu serveru)
┌─────────────────────────────────────────────────────────────────┐
│ 2. Uživatelská konfigurace (DOPORUČENO PRO PRODUKCI)            │
│    server-content/site.json                                     │
│    - NENÍ verzována v Gitu (složka server-content je v .gitignore)│
│    - Připojena jako Docker volume (/data/content/site.json)     │
│    - Přepíše pouze vámi zadané hodnoty                          │
│    - Lze editovat přímo na serveru nebo přes Filebrowser CMS    │
│    - Změny se projeví OKAMŽITĚ bez nutnosti restartu a buildu!  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Garance kompatibility při aktualizaci

Při aktualizaci webu (např. spuštěním `./deploy.sh` nebo příkazu `git pull origin main`):

1. **Žádné Git konflikty:**
   - Vaše osobní konfigurace `server-content/site.json`, vlastní loga a favikony v `server-content/assets/` a veškeré články v `server-content/blog/` leží ve složce `server-content/`.
   - Tato složka je uvedena v `.gitignore`. Git ji kompletně ignoruje a při příkazu `git pull origin main` se jí ani nedotkne.
2. **Žádné rozbití kvůli chybějícím novým položkám:**
   - Konfigurační loader provádí rekurzivní *deep merge*. Pokud budoucí aktualizace z GitHubu přidá do `site.config.js` novou funkci nebo volbu, vaše existující `site.json` bude stále fungovat – chybějící položky se automaticky doplní z výchozí šablony.
3. **Plná podpora Dockeru a GHCR image:**
   - Pokud používáte automatické stahování sestavených Docker obrazů (GHCR) přes Watchtower nebo `docker compose pull`, kontejner čte soubor `/data/content/site.json` z připojeného svazku.
   - Po stažení nového image kontejneru zůstanou vaše barvy, názvy, autor i modely zachovány bez nutnosti ručního zásahu.

---

## 🎨 Jak nastavit centrální barvu webu

Web disponuje inteligentním generátorem stylů. Stačí nastavit jedinou barvu v HEX formátu:

```json
{
  "theme": {
    "accentColor": "#10b981"
  }
}
```

### Co vše se automaticky přebarví:
- **Akcentová barva prvků** (`--accent`): odkazy, tlačítka, aktivní záložky v navigaci a filtry kategorií.
- **Hover stavy** (`--accent-hover`): automaticky propočtený tmavší odstín pro světlý režim a světlejší odstín pro tmavý režim.
- **Jemná poloprůhledná podbarvení** (`--accent-light`): štítky jazyků, informační boxy a náhledové karty.
- **Ohraničení a rámečky** (`--accent-border` a `--quote-border`): citace a karty profilu.
- **Efekt záře** (`--accent-glow`): aktivní prvky a přepínače.
- **Horní dekorativní pruh** (`--top-bar-gradient`): plynulý barevný přechod v záhlaví stránky.
- **Výchozí SVG favikona:** pokud nemáte vlastní favikonu, výchozí logo favikony se v prohlížeči automaticky přebarví do vašeho zvoleného odstínu!

---

## 🔖 Jak nastavit Favicon (ikona webu v záložce prohlížeče)

Favicon nyní funguje **naprosto jednoduše bez složitého nastavování**:

### 🎯 Nejrychlejší způsob:
Jednoduše nahrajte soubor `favicon.svg`, `favicon.png` nebo `favicon.ico` do složky:
👉 `server-content/assets/` *(např. přetažením myší ve Filebrowser CMS)*

Web automaticky detekuje soubory v `server-content/assets/` a okamžitě je začne servírovat:
- `server-content/assets/favicon.svg` &rarr; automaticky dostupná na `/favicon.svg`
- `server-content/assets/favicon.png` &rarr; automaticky dostupná na `/favicon.png`
- `server-content/assets/favicon.ico` &rarr; automaticky dostupná na `/favicon.ico`
- `server-content/assets/apple-touch-icon.png` &rarr; automaticky dostupná na `/apple-touch-icon.png`

Není potřeba nic měnit v kódu ani spouštět build!

---

## 🧊 Nastavení 3D loga a modelů (`logo3d`)

3D model lze velmi přehledně a granulárně nastavit zvlášť pro hlavní stránku a zvlášť pro sekci "O mně".

Web nativně podporuje formáty **GLB / GLTF**, **Wavefront OBJ** a **STL** (včetně textur, materiálů a přesné kalibrace úhlů a měřítka):

```json
{
  "logo3d": {
    "enabled": true,
    "showOnHome": true,
    "showOnAbout": true,
    "home": {
      "model": "/models/logo.obj",
      "texture": "",
      "material": "",
      "color": "",
      "metalness": 0.50,
      "roughness": 0.36,
      "rotation": { "x": 0, "y": 0, "z": 0 },
      "scale": 1,
      "fallbackImage": "/logos/logo-3d.png",
      "size": 125
    },
    "about": {
      "model": "/models/pandulak.obj",
      "texture": "",
      "material": "",
      "color": "",
      "metalness": 0.50,
      "roughness": 0.36,
      "rotation": { "x": 0, "y": 0, "z": 0 },
      "scale": 1,
      "fallbackImage": "/logos/logo-3d.png",
      "size": 110
    }
  }
}
```

### Podporované formáty a umístění souborů:
- **Kde soubory umístit (DOPORUČENO PRO PRODUKCI):**
  - Nahrajte loga, modely a případné textury do složky `server-content/assets/` *(např. přetažením ve Filebrowser CMS do složky `assets`)*.
  - Všechny soubory jsou okamžitě dostupné na adrese `/assets/<nazev-souboru>` *(ze zpětné kompatibility funguje i `/custom-assets/<nazev-souboru>`)*:
    ```json
    "model": "/assets/logo.obj",
    "material": "/assets/logo.mtl",
    "texture": "/assets/logo-textura.png"
    ```
  - **Tato složka je perzistentní a žádný `git pull` ani aktualizace kontejneru ji nepřepíše!**
- **Alternativní umístění v repozitáři:**
  - Složka `static/models/` (přístupná jako `/models/<nazev-souboru>`).

### Možnosti nastavení:
- **`enabled`** (`true` / `false`): Globální vypínač. Pokud nastavíte `false`, 3D se nezobrazí nikde.
- **`showOnHome`** (`true` / `false`): Zda zobrazovat 3D logo v úvodní sekci na hlavní stránce.
- **`showOnAbout`** (`true` / `false`): Zda zobrazovat 3D model (např. panáčka) v profilové kartě v sekci "O mně". Pokud je `false`, karta "O mně" je čistě textová a text přirozeně využije celou šířku.
- **`model`**: Cesta k 3D modelu (`.glb`, `.gltf`, `.obj` nebo `.stl`). Např. `"/assets/moje-logo.obj"`.
- **`texture`**: Volitelná cesta k obrázkové textuře (PNG, JPG, WebP) pro OBJ, STL i GLB (např. `"/assets/textura.png"`). U formátu STL web automaticky dogeneruje UV mapování.
- **`material`**: Volitelná cesta k souboru materiálů `.mtl` pro OBJ (např. `"/assets/logo.mtl"`). Pokud není zadáno, web u OBJ automaticky zkusí soubor se stejným názvem a příponou `.mtl`.
- **`color`**: Volitelná barva modelu v HEX formátu (např. `"#0095f8"` nebo `"#14A4FF"`), pokud model nemá vlastní texturu.
- **`metalness`** a **`roughness`**: PBR vlastnosti povrchu (od 0.0 do 1.0, výchozí `0.50` a `0.36`).
- **`rotation`**: Výchozí natočení modelu ve stupních `{ "x": 0, "y": 0, "z": 0 }`. Není třeba sahat do kódu.
- **`scale`**: Měřítko modelu (výchozí `1`).
- **`fallbackImage`**: Obrázek zobrazený při načítání, vypnutém WebGL nebo při chybějícím modelu.
- **`size`**: Velikost 3D plátna v pixelech.

---

## 👤 Sekce "O mně" (`about`)

V konfiguraci můžete přizpůsobit nadpis a úvodní text (perex) profilové karty na stránce `/about`:

```json
{
  "about": {
    "title": "O mně",
    "description": "Představení, technologické zaměření, projekty a kontakt na KubiV."
  }
}
```

Tento text se zobrazuje v horní kartě profilu vedle 3D modelu a zároveň se propisuje do vyhledávačů (SEO) a Schema.org. Samotný dlouhý text pod kartou se pak standardně načítá z Markdownu (`server-content/about/index.cs.md` nebo `index.en.md`).

---

## 🌐 Multi-subdoménový provoz na jedné instanci (`subdomains`)

Web umožňuje provozovat tematické subdomény (např. `med.vavra.pro`) na **jediné běžící instanci kontejneru** (`personal-web:3000`).

Stačí v `server-content/site.json` přidat sekci `subdomains`:

```json
{
  "subdomains": {
    "med": {
      "category": "medicina",
      "title": "KubiV | Medicína",
      "description": "Články a interaktivní projekty z medicíny",
      "accentColor": "#059669",
      "navTitle": "KubiV.med",
      "iconUrl": "/assets/med-logo.svg",
      "favicon": "/assets/med-logo.svg",
      "showSocial": false,
      "heroLogo": "/assets/med-logo.svg"
    }
  }
}
```

### Co se na subdoméně automaticky stane:
- **Detekce v `hooks.server.js`:** Ze záhlaví `x-forwarded-host` / `host` (z Cloudflare Tunnelu nebo reverse proxy) se rozpozná subdoména (např. `med`).
- **Automatické filtrování obsahu:** Na úvodní stránce (`/`) i v přehledu článků (`/blog` a `/category`) se zobrazují pouze články zařazené v dané kategorii (`medicina` / `Medicína`).
- **Dynamický barevný motiv:** CSS proměnné (`--accent`, `--accent-color`, `--accent-hover`, `--top-bar-gradient`, barva měsíčku v dark mode přepínači atd.) se okamžitě přepočítají podle `accentColor` dané subdomény.
- **Vlastní název, loga a favicon (`navTitle`, `iconUrl`, `heroLogo`, `favicon`):**
  - `navTitle`: text v levém horním rohu hlavičky (např. `KubiV.med`).
  - `iconUrl`: volitelné malé logo v hlavičce vedle názvu (např. `"/assets/med-logo.svg"`).
  - `heroLogo`: volitelné velké logo (2D SVG/PNG nebo 3D `.obj`/`.glb`/`.stl` model, případně `false`/`"none"` pro skrytí) zobrazené vpravo v úvodní sekci místo hlavního 3D loga.
  - `favicon`: volitelná vlastní ikona záložky prohlížeče pro subdoménu – lze zadat přímo cestu k souboru (např. `"/assets/med-logo.svg"` nebo `"/assets/med-favicon.png"`) nebo objekt `{ "svg": "/assets/med-logo.svg", "png": "/assets/med-favicon.png" }`. Alternativně lze do `assets/` nahrát soubor pojmenovaný `favicon-med.svg` a subdoména jej načte automaticky.
- **SEO a Sitemap:** Canonical URL a `/sitemap.xml` respektují příslušnou subdoménu a nevznikají duplicity.

---

## 🧩 Interaktivní HTML+JS články (`interactive: true`)

Kromě klasických Markdown článků můžete do složky `server-content/blog/<slug>/` nahrát kompletní interaktivní HTML+JS aplikaci:

1. Vytvořte složku článku, např. `server-content/blog/ekg-simulator/`.
2. Nahrajte do ní `index.html`, případné `.js`, `.css`, `.json`, fonty a volitelný náhledový obrázek `cover.png` nebo `cover.jpg`.
3. Vytvořte soubor `index.md` (nebo `<slug>.md`) s frontmatterem:

```markdown
---
title: "Interaktivní EKG simulátor"
date: "2026-10-25"
category: "Medicína"
description: "Interaktivní webová aplikace pro simulaci EKG křivek."
interactive: true
html: "index.html"
iframeHeight: "800px"
---

Volitelný doprovodný text v Markdownu, který se vykreslí pod interaktivním oknem.
```

Aplikace se zobrazí v izolovaném `<iframe sandbox>` se zachováním hlavičky webu, SEO metadat a přepínačem na **celou obrazovku (Fullscreen)**.

---

## 📋 Kompletní vzor `server-content/site.json`

Zkopírujte `site.config.example.json` do `server-content/site.json` a upravte podle sebe:

```json
{
  "title": "Moje Jméno",
  "tagline": "Personal Website",
  "description": "Osobní web a blog - technologie, software, hardware a projekty.",
  "url": "https://mojedomena.cz",
  "locale": "cs-CZ",

  "author": {
    "name": "Moje Jméno",
    "bio": "Technologický nadšenec, software & hardware.",
    "url": "/about",
    "github": "https://github.com/mojeprofil"
  },

  "theme": {
    "accentColor": "#14A4FF"
  },

  "logo": {
    "text": "Moje Jméno",
    "iconUrl": "/logos/logo-flat.svg"
  },

  "logo3d": {
    "enabled": true,
    "showOnHome": true,
    "showOnAbout": true,
    "home": {
      "model": "/models/logo.obj",
      "texture": "",
      "material": "",
      "color": "",
      "metalness": 0.50,
      "roughness": 0.36,
      "rotation": { "x": 0, "y": 0, "z": 0 },
      "scale": 1,
      "fallbackImage": "/logos/logo-3d.png",
      "size": 125
    },
    "about": {
      "model": "",
      "texture": "",
      "material": "",
      "color": "",
      "metalness": 0.50,
      "roughness": 0.36,
      "rotation": { "x": 0, "y": 0, "z": 0 },
      "scale": 1,
      "fallbackImage": "",
      "size": 110
    }
  },

  "about": {
    "title": "O mně",
    "description": "Představení, technologické zaměření, projekty a kontakt na mé jméno."
  },

  "favicon": {
    "svg": "/favicon.svg",
    "png": "/favicon.png",
    "appleTouchIcon": "/apple-touch-icon.png"
  },

  "social": {
    "github": "https://github.com/mojeprofil",
    "twitter": "https://x.com/mojeprofil",
    "linkedin": "https://linkedin.com/in/mojeprofil",
    "youtube": "",
    "twitch": "",
    "instagram": ""
  },

  "nav": [
    { "label": "Home", "href": "/" },
    { "label": "Blog", "href": "/blog" },
    { "label": "Kategorie", "href": "/category" },
    { "label": "O mně", "href": "/about" }
  ],

  "home": {
    "heroTitle": "Vítejte",
    "heroLead": "Vítejte v mém osobním koutku webu.",
    "heroText": "Můžete si projít nejnovější články níže nebo si přečíst více o mně."
  },

  "footer": {
    "copyright": "Moje Jméno",
    "showYear": true
  }
}
```
