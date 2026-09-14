# ⚙️ Centrální konfigurace webu a bezpečné aktualizace

Tento dokument detailně popisuje architekturu konfigurace webu, způsob změny centrální barvy, výchozího autora, názvu webu a umístění log a ikon. Zároveň vysvětluje, jak je zajištěna **100% kompatibilita při aktualizacích z GitHubu**.

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
   - Vaše osobní konfigurace `server-content/site.json`, vlastní loga v `server-content/assets/` a veškeré články v `server-content/blog/` leží ve složce `server-content/`.
   - Tato složka je uvedena v `.gitignore`. Git ji kompletně ignoruje a při příkazu `git pull origin main` se jí ani nedotkne.
2. **Žádné rozbití kvůli chybějícím novým položkám:**
   - Konfigurační loader provádí rekurzivní *deep merge*. Pokud budoucí aktualizace z GitHubu přidá do `site.config.js` novou funkci nebo novou konfigurační volbu, vaše existující `site.json` bude stále fungovat – chybějící položky se automaticky doplní z výchozí šablony.
3. **Plná podpora Dockeru a GHCR image:**
   - Pokud používáte automatické stahování sestavených Docker obrazů (GHCR) přes Watchtower nebo `docker compose pull`, kontejner čte soubor `/data/content/site.json` z připojeného svazku.
   - Po stažení nového image kontejneru zůstanou vaše barvy, názvy i autor zachovány bez nutnosti jakéhokoliv ručního zásahu!

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

Vše funguje automaticky v **obou režimech** (Light i Dark mode)!

---

## 🖼️ Místa pro loga, ikony a 3D modely

Máte na výběr ze dvou umístění podle toho, jak web provozujete:

### 1. Možnost A: Složka `server-content/assets/` (Doporučeno pro server a Filebrowser)
Všechny soubory nahrané do této složky jsou webem servírovány na URL `/custom-assets/<soubor>`:
- **Výhoda:** Můžete je nahrát pohodlně přes webové CMS Filebrowser (přetažením myší) a `git pull` je nikdy nepřepíše.

| Soubor v `server-content/assets/` | Nastavení v `server-content/site.json` | Účel |
| :--- | :--- | :--- |
| `moje-logo.svg` (nebo `.png`) | `"logo": { "iconUrl": "/custom-assets/moje-logo.svg" }` | Plochá ikona / logo v horní liště |
| `favicon.svg` | `"favicon": { "svg": "/custom-assets/favicon.svg" }` | Moderní vektorová favikona |
| `favicon.png` | `"favicon": { "png": "/custom-assets/favicon.png" }` | Rastrová favikona (pro starší prohlížeče) |
| `apple-touch-icon.png` | `"favicon": { "appleTouchIcon": "/custom-assets/apple-touch-icon.png" }` | Ikona pro uložení na plochu mobilu |
| `muj-model.glb` | `"logo": { "model3d": "/custom-assets/muj-model.glb" }` | 3D model loga pro úvodní sekci |
| `render-3d.png` | `"logo": { "fallback3d": "/custom-assets/render-3d.png" }` | Náhradní 2D obrázek 3D loga |

---

### 2. Možnost B: Složka `static/` (Pro vývojáře přímo v Gitu)
Pokud preferujete spravovat loga přímo v repozitáři:
- `static/logos/logo-flat.svg` – výchozí vektorové logo v navigaci (podporuje `fill="currentColor"`)
- `static/logos/logo-3d.png` – výchozí rastrový render 3D loga
- `static/models/logo.glb` (nebo `logo.obj` + `logo.mtl`) – výchozí 3D model
- `static/favicon.svg`, `static/favicon.png`, `static/apple-touch-icon.png` – výchozí ikony webu

---

## 📋 Kompletní šablona `server-content/site.json`

Pro aktivaci vlastní konfigurace stačí zkopírovat soubor `server-content/site.json.example` do `server-content/site.json`:

```json
{
  "title": "Moje Jméno",
  "tagline": "Osobní blog a projekty",
  "description": "Zápisky o programování, technologiích a mých projektech.",
  "url": "https://mojedomena.cz",
  "locale": "cs-CZ",

  "author": {
    "name": "Moje Jméno",
    "bio": "Vývojář, nadšenec do technologií.",
    "url": "/about",
    "github": "https://github.com/mojeprofil"
  },

  "theme": {
    "accentColor": "#14A4FF"
  },

  "logo": {
    "text": "Moje Jméno",
    "iconUrl": "/logos/logo-flat.svg",
    "show3D": true,
    "model3d": "/models/logo.glb",
    "fallback3d": "/logos/logo-3d.png"
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
    "heroLead": "Vítejte na mém osobním webu věnovaném moderním technologiím.",
    "heroText": "Prohlédněte si nejnovější články níže nebo si přečtěte více o mně."
  },

  "footer": {
    "copyright": "Moje Jméno",
    "showYear": true
  }
}
```

> **Tip:** V `social` stačí nevyplněné sítě ponechat jako `""` (prázdný řetězec) nebo je vymazat – web pak danou ikonku vůbec nezobrazí.
