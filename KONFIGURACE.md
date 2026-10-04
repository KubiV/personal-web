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

Při aktualizaci webu (např. spuštěním `./update.sh` nebo příkazu `git pull origin main`):

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
  - Nahrajte model a případné textury do složky `server-content/assets/` *(např. přetažením ve Filebrowser CMS)*.
  - Všechny soubory jsou okamžitě dostupné na adrese `/custom-assets/<nazev-souboru>`:
    ```json
    "model": "/custom-assets/logo.obj",
    "material": "/custom-assets/logo.mtl",
    "texture": "/custom-assets/logo-textura.png"
    ```
  - **Tato složka je perzistentní a žádný `git pull` ani aktualizace kontejneru ji nepřepíše!**
- **Alternativní umístění v repozitáři:**
  - Složka `static/models/` (přístupná jako `/models/<nazev-souboru>`).

### Možnosti nastavení:
- **`enabled`** (`true` / `false`): Globální vypínač. Pokud nastavíte `false`, 3D se nezobrazí nikde.
- **`showOnHome`** (`true` / `false`): Zda zobrazovat 3D logo v úvodní sekci na hlavní stránce.
- **`showOnAbout`** (`true` / `false`): Zda zobrazovat 3D model (např. panáčka) v profilové kartě v sekci "O mně". Pokud je `false`, karta "O mně" je čistě textová a text přirozeně využije celou šířku.
- **`model`**: Cesta k 3D modelu (`.glb`, `.gltf`, `.obj` nebo `.stl`). Např. `"/custom-assets/moje-logo.obj"`.
- **`texture`**: Volitelná cesta k obrázkové textuře (PNG, JPG, WebP) pro OBJ, STL i GLB (např. `"/custom-assets/textura.png"`). U formátu STL web automaticky dogeneruje UV mapování.
- **`material`**: Volitelná cesta k souboru materiálů `.mtl` pro OBJ (např. `"/custom-assets/logo.mtl"`). Pokud není zadáno, web u OBJ automaticky zkusí soubor se stejným názvem a příponou `.mtl`.
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
