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

# 2. Znovu sestavit Docker kontejner a restartovat služby
echo "🔨 Sestavuji a spouštím kontejnery..."
docker compose up -d --build

# 3. Vyčistit staré nepoužívané Docker vrstvy (aby se neplnil NVMe disk)
echo "🧹 Pročišťuji staré nepoužívané Docker vrstvy..."
docker image prune -f

echo "=========================================="
echo "✅ Aktualizace úspěšně dokončena!"
echo "=========================================="
docker compose ps
