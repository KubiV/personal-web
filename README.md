# Personal Website & Blog (Raspberry Pi 5 + SvelteKit)

A high-performance, ultra-minimalist personal website and blog designed to run on a **Raspberry Pi 5** with an **NVMe SSD**. Built with SvelteKit (`@sveltejs/adapter-node`), pure CSS, runtime Markdown parsing, and containerized deployment with an in-browser CMS.

---

## Key Architecture Principles

1. **Strict Separation of Code and Content**:
   - **Code** is versioned and hosted on GitHub.
   - **Content** (Markdown files, photos, diagrams) lives **EXCLUSIVELY on the host machine** (Raspberry Pi via NVMe) and is mounted as a Docker volume (`/data/content`).
   - The GitHub repository contains **zero** blog posts or images.
2. **Runtime Markdown Parsing**:
   - The SvelteKit server parses `.md` files and frontmatter at **runtime** using `gray-matter` and `marked`.
   - When you publish or edit an article, it appears **instantly** without needing to rebuild or redeploy the application.
3. **No Database, No PHP**:
   - The entire stack is driven by the local file system.
4. **Jeff Geerling-Inspired Aesthetic**:
   - Pure, lightweight CSS with system fonts (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto...`).
   - High contrast, crisp typography, clean code blocks, responsive layout, and zero heavy UI frameworks.
5. **Integrated Web CMS (Filebrowser)**:
   - A lightweight Go-based web file manager mounted to the content storage allows creating folders, editing Markdown, and dragging-and-dropping images directly in your browser.
6. **Automated CI/CD**:
   - Pushing code to GitHub triggers a GitHub Action that builds a multi-architecture image (`linux/arm64` for Raspberry Pi 5 + `linux/amd64`) and pushes it to GitHub Container Registry (GHCR).
   - **Watchtower** automatically pulls the updated image on the Pi.

---

## Content Structure

The application expects the content directory to follow this structure:

```
/data/content/ (or ./server-content/ for local dev)
└── blog/
    ├── <article-slug>/
    │   ├── index.md           # Article content & YAML frontmatter
    │   └── cover.jpg          # Local images referenced in Markdown
    └── another-article/
        ├── index.md
        └── diagram.png
```

### Frontmatter Format (`index.md`)

Each `index.md` file must begin with YAML frontmatter:

```markdown
---
title: "Self-Hosting on a Raspberry Pi 5 with NVMe"
date: "2026-09-13"
category: "Hardware"
description: "A deep dive into running a database-free personal website."
image: "./cover.jpg"   # Optional: specific image, false/none, or defaults to 1st image in post
draft: false
---

# Your Heading Here

Write your Markdown content as normal.

### Local Images

Images placed in the same folder can be referenced relatively:

![Architecture](./cover.jpg)

The server automatically resolves relative image links to the `/blog/[slug]/[image]` endpoint.
```

### Article Thumbnails (`image`)

Each article in post listings can have a preview thumbnail image. Thumbnails are displayed on the right side of the card, ensuring that all headings, metadata, and excerpts always stay cleanly aligned on the left edge.

There are three ways to configure the thumbnail in YAML frontmatter:

1. **Automatic First Image (Default)**: Omit `image:` (or set `image: "first"`). The server automatically scans the article body and picks the first image (ignoring code blocks). If no image exists, no thumbnail is shown.
2. **Explicitly Disabled**: Set `image: false` or `image: none`. No thumbnail is displayed, even if the article contains images.
3. **Specific Image**: Set `image: "./cover.jpg"` (local file in the article folder), `image: "cover.jpg"`, or an external URL (`https://...`). Optionally set `imageAlt: "Description"`.

For complete CMS formatting instructions, see [server-content/README.md](server-content/README.md).

---

## Local Development & Testing on Mac

You can test the entire site and content workflow on macOS without running Docker.

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.
- **Homepage:** `http://localhost:5173/`
- **Blog Index:** `http://localhost:5173/blog`
- **Sample Article:** `http://localhost:5173/blog/hello-raspberry-pi-5`
- **Category Filter:** `http://localhost:5173/category/hardware`

*In local development, the server automatically reads from the local `./server-content/` directory. Edits to Markdown files appear immediately upon browser refresh.*

### 3. Test Production Node Server (Docker Equivalent)
To test the exact compiled bundle that will run in Docker:

```bash
npm run build
npm start
```
Open **[http://localhost:3000](http://localhost:3000)**.

---

## Accessing the CMS (Filebrowser)

Filebrowser acts as your browser-based CMS to create articles and upload photos.

### Running the CMS on your Mac (Local Testing)

#### Option A: Docker (Recommended)
```bash
mkdir -p ./filebrowser

docker run -d \
  --name local-cms \
  -v $(pwd)/server-content:/srv \
  -v $(pwd)/filebrowser/filebrowser.db:/database/filebrowser.db \
  -p 8080:80 \
  filebrowser/filebrowser:latest
```
Open **[http://localhost:8080](http://localhost:8080)**.
- **Username:** `admin`
- **Password:** `admin`

*(Stop anytime with `docker stop local-cms && docker rm local-cms`)*.

#### Option B: Native via Homebrew
```bash
brew install filebrowser
filebrowser -r ./server-content -p 8080
```
Open **[http://localhost:8080](http://localhost:8080)**.

#### Option C: Direct File Editing
Since content is stored as plain files in `server-content/blog/`, you can also create and edit folders and Markdown directly in **VS Code**, **Obsidian**, or **Finder**.

### Publishing an Article via the CMS

1. Log into Filebrowser.
2. Open the `blog/` folder.
3. Click **New Folder** (+ icon) and name it your slug (e.g. `my-new-post`).
4. Inside the folder:
   - Drag and drop any images (e.g. `photo.png`).
   - Click **New File** (+ icon), name it `index.md`.
5. Write your frontmatter and content, then click **Save**.
6. Refresh the website—your post is immediately live!

---

## Production Deployment on Raspberry Pi 5

### 1. Host Architecture Overview

```
                      [ Cloudflare Tunnel (`tunnel_network`) ]
                                         │
                  ┌──────────────────────┴──────────────────────┐
                  ▼                                             ▼
   ┌─────────────────────────────┐               ┌─────────────────────────────┐
   │  SvelteKit Web App (:3000)  │               │      Filebrowser (:80)      │
   │      (Public Website)       │               │       (Web Admin CMS)       │
   └──────────────┬──────────────┘               └──────────────┬──────────────┘
                  │                                             │
                  │ mount:ro                                    │ mount:rw
                  └──────────────────────┬──────────────────────┘
                                         ▼
                        [ Host NVMe: ./server-content ]
                          └── blog/
                              ├── <article-slug>/
                              │   ├── index.md
                              │   └── <image.jpg>
```

### 2. One-Time Setup on the Pi

1. **Prepare directories on the Pi host**:
   ```bash
   mkdir -p ./server-content/blog
   mkdir -p ./filebrowser
   touch ./filebrowser/filebrowser.db
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in:
   - `PERSONAL_WEB_IMAGE`: `ghcr.io/<your-github-username-lowercase>/personal-web:latest`
   - `TUNNEL_TOKEN`: Your Cloudflare Zero Trust Tunnel token

3. **Ensure GHCR Package is Public**:
   After the first GitHub Actions build finishes, go to **GitHub** -> **Packages** -> **personal-web** -> **Package settings** -> change visibility to **Public**. This allows Watchtower to automatically pull new image releases without credentials.

4. **Launch the stack**:
   ```bash
   docker compose up -d
   ```

### 3. Cloudflare Tunnel Configuration (`cloudflared`)

In your Cloudflare Zero Trust Dashboard (Networks -> Tunnels -> Public Hostnames), configure:

| Domain | Service | Security |
|---|---|---|
| `yourdomain.com` | `http://personal-web:3000` | Publicly accessible |
| `cms.yourdomain.com` | `http://filebrowser:80` | **Protected with Cloudflare Zero Trust Access** (Email PIN / OAuth) |

*(Optional: To also access Filebrowser locally on your LAN without Cloudflare, add `ports: - "8080:80"` to `filebrowser` in `docker-compose.yml`)*.

---

## CI/CD Pipeline (GitHub Actions)

The workflow at `.github/workflows/docker-publish.yml`:
1. Triggers on every `push` to the `main` branch.
2. Cross-compiles for **both** `linux/arm64` (Raspberry Pi 5) and `linux/amd64` using Docker Buildx.
3. Automatically converts repository names to lowercase to ensure valid Docker tags.
4. Pushes the image to GitHub Container Registry (`ghcr.io`).
5. **Watchtower** on the Raspberry Pi detects the new image within 5 minutes and updates the running web container automatically with zero downtime.

---

## Security Highlights

- **Path Traversal Protection**: Slugs and image filenames are sanitized to prevent `../` directory traversal.
- **Read-Only App Mount**: The web app container mounts `./server-content:/data/content:ro` (read-only), so even in the event of a container compromise, your host files cannot be altered by the web server.
- **Non-Root Execution**: The Docker container runs as an unprivileged `node` user.
- **Strict Git Boundaries**: `.gitignore` strictly prevents any user content, images, or Filebrowser databases from leaking into git commits.
