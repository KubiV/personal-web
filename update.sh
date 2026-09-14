#!/usr/bin/env bash
# ==============================================================================
# Skript pro manuální aktualizaci osobního webu na Raspberry Pi
# Použití: ./update.sh
# ==============================================================================

set -e

# Přejít do adresáře se skriptem (kořen projektu)
cd "$(dirname "$0")"

echo "=========================================="
echo "🚀 Spouštím aktualizaci osobního webu..."
echo "=========================================="

# 1. Stáhnout nejnovější kód z větve main na GitHubu
echo "📥 Stahuji nejnovější změny z GitHubu..."
git pull origin main

# 2. Zajistit existenci potřebných složek a oprávnění pro Filebrowser
mkdir -p filebrowser server-content/blog server-content/assets
[ ! -f server-content/site.json.example ] && cp site.config.example.json server-content/site.json.example 2>/dev/null || true
sudo chown -R 1000:1000 filebrowser server-content 2>/dev/null || true

# 3. Stáhnout nejnovější sestavený image (z GHCR) a restartovat kontejnery
echo "🔨 Stahuji a spouštím kontejnery..."
docker compose pull || true
docker compose up -d

# 4. Vyčistit staré nepoužívané Docker vrstvy (aby se neplnil NVMe disk)
echo "🧹 Pročišťuji staré nepoužívané Docker vrstvy..."
docker image prune -f

echo "=========================================="
echo "✅ Aktualizace úspěšně dokončena!"
echo "=========================================="
docker compose ps
