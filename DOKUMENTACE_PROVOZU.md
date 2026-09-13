# Dokumentace provozu, migrace a CI/CD: personal-web (Raspberry Pi 5)

Tento dokument slouží jako kompletní technická příručka pro provoz, správu, síťové zapojení a aktualizace osobního webu a blogu na domácím serveru Raspberry Pi 5 (`malina`).

---

## 1. Architektura systému a síťové propojení

Aplikace běží kontejnerizovaně v Dockeru a je plně integrována do infrastruktury serveru (Pi-hole DNS, Nginx Proxy Manager, Cloudflare Tunnel).

### Schéma toku provozu v lokální síti (.lan)

```
[ Klient (Mac / iPhone) ]
           │
           │  1. Dotaz DNS: "Kde je blog.lan / cms.lan / nas.lan?"
           ▼
[ Pi-hole (<IP_MALINY>:53) ] ──> Odpověď: <IP_MALINY>
           │
           │  2. HTTP požadavek na port 80
           ▼
[ Nginx Proxy Manager (NPM) ] (v síti 'proxy_net')
     ├── blog.lan ──> http://personal-web:3000
     └── cms.lan / nas.lan ──> http://filebrowser:80
```

### Přehled adresářů a úložišť na Raspberry Pi

| Umístění na hostiteli (Pi) | Mount v kontejneru | Oprávnění | Účel |
|---|---|---|---|
| `/srv/compose/personal-web` | — | `pi:pi` | Kořenový adresář projektu, `docker-compose.yml`, skripty |
| `/srv/compose/personal-web/server-content` | `/data/content` (`personal-web`) | `ro` (pouze pro čtení) | Markdown články a obrázky pro web |
| `/srv/compose/personal-web/server-content` | `/srv` (`filebrowser`) | `rw` (čtení i zápis) | Správa obsahu přes webový CMS editor |
| `/srv/compose/personal-web/filebrowser` | `/database` (`filebrowser`) | `1000:1000` | SQLite databáze uživatelů a nastavení Filebrowseru |

---

## 2. Problémy vyřešené při migraci (Co nefungovalo a proč)

Během první migrace došlo ke 4 specifickým zádrhelům, které způsobily nedostupnost stránek:

1. **Izolace Docker sítí (`tunnel_network` vs. `proxy_net`):**
   - *Příčina:* Kontejnery `personal-web` a `filebrowser` byly umístěny pouze v privátním bridge `tunnel_network`. Nginx Proxy Manager (NPM) však běží v externí síti `proxy_net`, takže na ně přes Docker DNS nedosáhl (chyba 502 Bad Gateway).
   - *Řešení:* Do `docker-compose.yml` byla přidána síť `proxy_net: external: true` pro oba kontejnery.

2. **Cyklický pád kontejneru Filebrowser (`Restarting (1)`):**
   - *Příčina:* Původní mount cílil na soubor: `- ./filebrowser/filebrowser.db:/database/filebrowser.db`. Pokud tento soubor předem neexistoval, Docker daemon jej automaticky vytvořil jako **adresář (složku)**. SQLite databáze neumí pracovat se složkou jako se souborem a ihned spadla.
   - *Řešení:* Mount byl upraven na celou složku databáze: `- ./filebrowser:/database` s proměnnou `FB_DATABASE=/database/filebrowser.db`. Filebrowser si tak databázový soubor vytvoří sám bez kolizí.

3. **Záměna portů v NPM u `personal-web` (3001 vs. 3000):**
   - *Příčina:* V NPM byl nastaven Forward Port `3001`. Port 3001 byl ale pouze port vystavený na hostitelský stroj. V interní Docker síti `proxy_net` aplikace naslouchá na portu `3000`.
   - *Řešení:* V NPM byl cílový port opraven na `3000`.

4. **Chybějící DNS záznamy a pravidla pro `nas.lan`:**
   - *Příčina:* Pi-hole neznal překlad domén na IP adresu maliny a v NPM chybělo pravidlo pro doménu `nas.lan`.
   - *Řešení:* Všechny domény byly zapsány do Pi-hole Local DNS Records a v NPM byly namapovány na příslušné kontejnery.

---

## 3. Konfigurace lokálních domén (.lan)

### A. Pi-hole (Local DNS -> DNS Records)
V administraci Pi-hole (`http://pihole.lan/admin`) jsou nastaveny tyto A záznamy:

- `blog.lan` ──> `<IP_MALINY>`
- `cms.lan`  ──> `<IP_MALINY>`
- `nas.lan`  ──> `<IP_MALINY>`

### B. Nginx Proxy Manager (Proxy Hosts)
V administraci NPM (`http://npm.lan` nebo `http://<IP_MALINY>:81`):

| Domain Names | Scheme | Forward Hostname / IP | Forward Port | Poznámka |
|---|---|---|---|---|
| `blog.lan` | `http` | `personal-web` | `3000` | SvelteKit veřejný blog |
| `cms.lan`, `nas.lan` | `http` | `filebrowser` | `80` | Webový správce souborů / CMS |

*Doporučení:* U obou záznamů ponechte zapnuté **Block Common Exploits**.

---

## 4. Postup čisté reinstalace projektu od nuly

Pokud bude v budoucnu potřeba celý stack z Raspberry Pi smazat a nasadit zcela načisto z GitHubu:

```bash
# 1. Zastavit běžící kontejnery a odstranit staré svazky
cd /srv/compose/personal-web
docker compose down --volumes --remove-orphans

# 2. Smazat starou složku projektu
cd /srv/compose
sudo rm -rf personal-web

# 3. Klonovat čistý repozitář z GitHubu
git clone https://github.com/KubiV/personal-web.git
cd /srv/compose/personal-web

# 4. Vytvořit adresáře s právy pro uživatele pi (UID/GID 1000)
mkdir -p filebrowser server-content/blog
sudo chown -R 1000:1000 filebrowser server-content

# 5. Připravit konfigurační soubor prostředí
cp .env.example .env

# 6. Spustit kontejnery
docker compose up -d

# 7. Zkontrolovat stav běhu
docker ps
```

---

## 5. Jak fungují aktualizace skrze GitHub (CI/CD cyklus)

Projekt důsledně dodržuje **oddělení kódu od obsahu**:

```
[ Kód aplikace / Šablony ] ──> GitHub Repo ──> GitHub Actions (GHCR) ──> Raspberry Pi (Docker)
[ Články / Obrázky ]       ──> Pouze Raspberry Pi NVMe disk (přes http://cms.lan)
```

### A. Změna zdrojového kódu (SvelteKit, CSS, komponenty)
Když na svém Macu upravíte kód v repozitáři:

1. **Commit a Push na Macu:**
   ```bash
   git add .
   git commit -m "Úprava designu nebo funkcionality"
   git push origin main
   ```
2. **Automatické sestavení (GitHub Actions):**
   Workflow `.github/workflows/docker-publish.yml` automaticky spustí cloudový build. Vytvoří multi-arch Docker image (`linux/arm64` pro Pi 5 + `linux/amd64`) a nahraje jej do GitHub Container Registry (`ghcr.io/kubiv/personal-web:latest`).
3. **Aktivace na serveru (3 možnosti):**
   - **Automaticky (Watchtower):** Kontejner `watchtower` na malině pravidelně kontroluje GHCR. Jakmile zjistí nový release, stáhne novou verzi a provede bezvýpadkový restart. *(Podmínka: Package v GitHubu musí být nastaven jako Public).*
   - **Vzdáleně z Macu:** V kořeni repozitáře na Macu spustíte:
     ```bash
     ./deploy.sh
     ```
     Skript se přes SSH připojí k malině a provede bezpečné nasazení.
   - **Přímo na malině:** Ve složce `/srv/compose/personal-web` spustíte skript:
     ```bash
     ./update.sh
     ```

### B. Změna konfigurace serveru (`docker-compose.yml`, sítě, porty)
Pokud upravíte samotný soubor `docker-compose.yml`:
1. Na Macu odešlete změny: `git commit -am "Změna compose"` a `git push origin main`.
2. Na serveru spustíte `./update.sh` (nebo z Macu `./deploy.sh`). Docker Compose porovná konfiguraci a restartuje pouze modifikované služby.

### C. Publikování článků a fotek (Obsah blogu)
Správa obsahu **nevyžaduje Git ani restartování Dockeru**:
1. V prohlížeči otevřete `http://cms.lan` (nebo `http://nas.lan`).
2. Přihlaste se do Filebrowseru (výchozí: `admin` / `admin`, po přihlášení změňte heslo v *Settings*).
3. Ve složce `blog/` vytvořte složku článku (např. `muj-novy-post/`).
4. Uvnitř vytvořte soubor `index.md` s YAML hlavičkou a přetáhněte obrázky.
5. Po uložení ve Filebrowseru stačí obnovit `http://blog.lan` – článek je díky runtime Markdown parseru okamžitě publikován.

---

## 6. Užitečné diagnostické příkazy na Raspberry Pi

```bash
# Zobrazení běžících kontejnerů a jejich zdraví
docker ps

# Živé logy aplikace blogu
docker logs -f personal-web

# Živé logy správce souborů (CMS)
docker logs -f filebrowser

# Živé logy automatického aktualizátoru Watchtower
docker logs -f watchtower

# Ruční restart celého stacku osobního webu
cd /srv/compose/personal-web && docker compose restart

# Pročištění starých nepoužívaných Docker obrazů (šetří NVMe disk)
docker image prune -f
```
