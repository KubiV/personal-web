<div align="center">

# Personal Website & Blog (`personal-web`)

**Ultra-minimalist, database-free personal website, blog, and interactive project hub designed for self-hosting on a Raspberry Pi 5 (NVMe).**

[![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=flat-square&logo=svelte&logoColor=white)](https://kit.svelte.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat-square&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![Docker Multi-Arch](https://img.shields.io/badge/Docker-ARM64%20%7C%20AMD64-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Raspberry Pi 5](https://img.shields.io/badge/Raspberry%20Pi%205-A22846?style=flat-square&logo=raspberrypi&logoColor=white)](https://www.raspberrypi.com/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=flat-square)](./LICENSE)

</div>

---

## 📚 Rozcestník dokumentace (Documentation Index)

Veškerá podrobná provozní a konfigurační dokumentace v češtině je rozdělena do přehledných příruček:

| Dokument | Obsah |
| :--- | :--- |
| ⚙️ **[KONFIGURACE.md](./KONFIGURACE.md)** | Centrální konfigurace (`server-content/site.json`), dynamická barva (`accentColor`), 3D modely, loga (`/assets/...`), favikony a tematické subdomény. |
| 🚀 **[DOKUMENTACE_PROVOZU.md](./DOKUMENTACE_PROVOZU.md)** | Architektura na Raspberry Pi 5, Docker sítě (`proxy_net`), Nginx Proxy Manager, Pi-hole DNS a aktualizační CI/CD proces. |
| ☁️ **[CLOUDFLARE_KONFIGURACE.md](./CLOUDFLARE_KONFIGURACE.md)** | Napojení na Cloudflare Zero Trust Tunnel (`cloudflared`), publikace subdomén (např. `med.kubiv.cz`) a zabezpečení CMS přes Cloudflare Access. |
| 🔐 **[FILEBROWSER_SPRAVA_HESEL.md](./FILEBROWSER_SPRAVA_HESEL.md)** | Správa účtů, změna a nouzový CLI reset hesel ve webovém CMS Filebrowser. |
| 📝 **[vzorove-clanky/README.md](./vzorove-clanky/README.md)** | 5 kompletních šablon článků: klasický Markdown, vícejazyčný článek (`CS`/`EN`/`DE`), interaktivní HTML+JS aplikace a článek pro subdoménu. |

---

## ✨ Key Features & Architecture

1. **Strict Separation of Code and Content**:
   - **Code** is versioned in this GitHub repository and built into a multi-arch Docker image (`linux/arm64` + `linux/amd64`).
   - **Content & Custom Config** (`site.json`, Markdown articles, images, 2D/3D logos in `assets/`) live **exclusively on the host NVMe drive** (`./server-content` mounted to `/data/content`).
   - Updating the application (`git pull` or container update) **never** touches or overwrites your articles, config, or assets.
2. **Instant Runtime Markdown & Multi-Language Support**:
   - Parses `.md` files and YAML frontmatter at runtime (`gray-matter` + `marked`). Edits made in Filebrowser CMS appear **instantly** on browser refresh without rebuilding.
   - Native support for multi-language articles (`index.md`, `index.en.md`, `index.de.md`, etc.) with automatic language badges and switcher.
3. **Interactive HTML+JS Sandbox Articles (`interactive: true`)**:
   - Embed standalone interactive web apps, calculators, or medical simulators directly inside blog posts using an isolated `<iframe sandbox>` with a built-in fullscreen mode.
4. **Multi-Subdomain Engine on a Single Container**:
   - Serve topic-specific subdomains (e.g. `med.kubiv.cz`) from the **same running container** (`personal-web:3000`).
   - Automatically filters articles by category, switches the accent color palette, updates the navigation title, and swaps header/hero logos.
5. **Interactive 3D WebGL Logos (`Three.js`)**:
   - Renders interactive `.obj`, `.glb`/`.gltf`, and `.stl` 3D models on the homepage and About card with orthographic projection, custom PBR materials, textures, and touch/mouse inertia.
6. **Dynamic Theme & Accent Color Generator**:
   - Set a single HEX color (`theme.accentColor`) in `site.json` and the server automatically computes light/dark mode hover states, borders, glows, gradients, dark-mode toggle accents, and dynamic SVG favicons.

---

## 🗂️ Project & Content Structure

```text
personal-web/
├── src/
│   ├── hooks.server.js              # Subdomain detection & language routing
│   ├── app.css                      # Minimalist CSS design system (Light & Dark mode)
│   ├── lib/
│   │   ├── components/              # Logo3D (Three.js), LogoIcon, ThemeToggle, PostListItem
│   │   ├── config/site.config.js    # Default fallback configuration (tracked in Git)
│   │   ├── server/config.js         # Runtime site.json loader, deep-merge & subdomain resolver
│   │   ├── server/content.js        # Runtime Markdown parser, multi-lang & category indexer
│   │   └── themeColors.js           # Dynamic CSS variable generator from HEX accentColor
│   └── routes/                      # SvelteKit routes, RSS, Sitemap, /assets/*, /blog/*
├── static/                          # Default fallback logos & 3D models
├── vzorove-clanky/                  # Ready-to-use article templates & examples
├── site.config.example.json         # Template for server-content/site.json
├── .env.example                     # Template for Raspberry Pi .env file
├── docker-compose.yml               # Production stack (personal-web, filebrowser, watchtower)
├── Dockerfile                       # Multi-stage Node 20 Alpine build (ARM64 / AMD64)
├── update.sh                        # Local update script (runs directly on Raspberry Pi)
└── deploy.sh                        # Remote deploy trigger (runs on Mac via SSH -> Pi)
```

### Host Content Directory (`./server-content` &rarr; `/data/content`)

```text
server-content/                      # Ignored by Git (.gitignore), persisted on host NVMe
├── site.json                        # Production runtime configuration override
├── assets/                          # Custom logos, favicons & 3D models -> served at /assets/<file>
│   ├── med-logo.svg                 # Accessible at https://yourdomain.com/assets/med-logo.svg
│   └── favicon.svg                  # Automatically overrides /favicon.svg
├── about/
│   ├── index.cs.md                  # About page (Czech)
│   └── index.en.md                  # About page (English)
└── blog/
    ├── <article-slug>/
    │   ├── index.md                 # Default article (CS) + YAML frontmatter
    │   ├── index.en.md              # Optional English translation
    │   └── cover.jpg                # Local images resolved to /blog/<slug>/<file>
    └── <interactive-app-slug>/
        ├── index.md                 # Frontmatter with interactive: true, html: "index.html"
        ├── index.html               # Standalone interactive HTML/JS/CSS application
        └── app.js
```

---

## 🛠️ Deployment & Update Scripts (`update.sh` vs. `deploy.sh`)

| Skript / Soubor | Kde se spouští / nachází | Co přesně dělá |
| :--- | :--- | :--- |
| **`./update.sh`** | **Přímo na Raspberry Pi** (`/srv/compose/personal-web`) | Stáhne nejnovější kód z GitHubu (`git pull origin main`), zajistí existenci `.env` a složek `server-content/assets`, nastaví oprávnění (`1000:1000`), stáhne nejnovější Docker image (`docker compose pull`), restartuje kontejnery (`docker compose up -d`) a vyčistí staré Docker vrstvy (`docker image prune -f`). |
| **`./deploy.sh`** | **Na tvém Macu** (lokální počítač) | Připojí se přes SSH na Raspberry Pi (`pi@malina.local`), přejde do `/srv/compose/personal-web` a vzdáleně tam spustí `./update.sh`. |
| **`.env`** | **Přímo na Raspberry Pi** (`/srv/compose/personal-web/.env`) | Obsahuje proměnné prostředí pro Docker Compose (`PERSONAL_WEB_IMAGE`, `TUNNEL_TOKEN`, `UID`, `GID`). Z bezpečnostních důvodů je v `.gitignore` (v Gitu je pouze šablona `.env.example`). |

---

## 💻 Local Development on macOS

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open **[http://localhost:5173](http://localhost:5173)** (or test a subdomain locally via **[http://med.localhost:5173](http://med.localhost:5173)**).
3. **Test production build locally:**
   ```bash
   npm run build
   npm start
   ```

---

## 🍓 Production Setup on Raspberry Pi 5

```bash
# 1. Clone the repository on Raspberry Pi
git clone https://github.com/KubiV/personal-web.git /srv/compose/personal-web
cd /srv/compose/personal-web

# 2. Create environment & runtime configuration from templates
cp .env.example .env
mkdir -p filebrowser server-content/blog server-content/assets
cp site.config.example.json server-content/site.json

# 3. Launch the stack (or simply run ./update.sh)
./update.sh
```

---

## 🛡️ Security Highlights

- **Read-Only App Volume**: The SvelteKit container mounts `./server-content:/data/content:ro` (read-only).
- **Strict Path Containment**: All dynamic file routes (`/blog/[slug]/[...file]` and `/assets/[...file]`) sanitize paths and enforce strict directory containment against traversal (`..`).
- **Non-Root Container**: Runs as unprivileged `node` user inside Alpine Linux.
- **Sandboxed Interactive Apps**: Interactive HTML articles run inside an isolated `<iframe sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals">`.
