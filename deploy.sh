#!/usr/bin/env bash
# ==============================================================================
# Skript pro vzdálené spuštění aktualizace na Raspberry Pi přímo z Macu
# Použití z Macu: ./deploy.sh
# ==============================================================================

set -e

# Výchozí hostitel na Raspberry Pi (lze upravit na IP nebo Tailscale jméno)
PI_HOST="${PI_HOST:-pi@100.110.63.109}"
PI_DIR="${PI_DIR:-/srv/compose/personal-web}"

echo "=========================================="
echo "📡 Připojuji se k Raspberry Pi (${PI_HOST})..."
echo "=========================================="

ssh -o ConnectTimeout=10 "${PI_HOST}" "cd ${PI_DIR} && git pull origin main && chmod +x update.sh 2>/dev/null || true; cd ${PI_DIR} && ./update.sh"

echo "=========================================="
echo "🎉 Vzdálené nasazení proběhlo v pořádku!"
echo "=========================================="
