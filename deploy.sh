#!/usr/bin/env bash
# ==============================================================================
# Univerzální skript pro nasazení a aktualizaci osobního webu (Mac -> Pi i lokálně na Pi)
# Použití: ./deploy.sh
# ==============================================================================

set -e

run_on_server() {
	echo "=========================================="
	echo "🚀 Spouštím aktualizaci osobního webu..."
	echo "=========================================="

	# 1. Stáhnout nejnovější kód z větve main na GitHubu
	echo "📥 Stahuji nejnovější změny z GitHubu..."
	git pull origin main

	# 2. Zajistit existenci potřebných složek a oprávnění pro Filebrowser
	mkdir -p filebrowser server-content/blog server-content/assets
	[ ! -f .env ] && cp .env.example .env 2>/dev/null || true
	[ ! -f server-content/site.json.example ] && cp site.config.example.json server-content/site.json.example 2>/dev/null || true
	if [ -d vzorove-clanky ]; then
		mkdir -p server-content/vzorove-clanky
		cp -R vzorove-clanky/* server-content/vzorove-clanky/ 2>/dev/null || true
	fi
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
}

# Pokud skript běží přímo na Linuxu (Raspberry Pi) nebo s parametrem --local, provede aktualizaci lokálně
if [ "${1:-}" = "--local" ] || [ "$(uname -s)" = "Linux" ]; then
	cd "$(dirname "$0")"
	run_on_server
	exit 0
fi

# Jinak (spuštěno na Macu) se připojí přes SSH na Raspberry Pi a spustí aktualizaci vzdáleně
PI_HOST="${PI_HOST:-pi@malina.local}"
PI_DIR="${PI_DIR:-/srv/compose/personal-web}"

echo "=========================================="
echo "📡 Připojuji se k Raspberry Pi (${PI_HOST})..."
echo "=========================================="

ssh -o ConnectTimeout=10 "${PI_HOST}" "cd ${PI_DIR} && $(declare -f run_on_server); run_on_server"

echo "=========================================="
echo "🎉 Vzdálené nasazení proběhlo v pořádku!"
echo "=========================================="
