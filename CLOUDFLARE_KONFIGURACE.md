# Konfigurace a správa Cloudflare Tunnelu: personal-web

Tento dokument slouží jako kompletní návod pro publikaci webových aplikací z domácího serveru Raspberry Pi do internetu pomocí služby **Cloudflare Tunnel** (kontejner `cloudflared`).

---

## 1. Jak Cloudflare Tunnel funguje

Cloudflare Tunnel umožňuje bezpečně zpřístupnit lokální služby z domácí sítě bez nutnosti:
- Mít veřejnou nebo statickou IP adresu od poskytovatele internetu.
- Otevírat porty (Port Forwarding / NAT) na domácím routeru.
- Řešit generování a obnovu SSL certifikátů na serveru (Cloudflare zajišťuje HTTPS automaticky).

### Schéma toku provozu

```
[ Návštěvník z internetu ]
           │
           │  1. HTTPS dotaz na např. https://blog.vasedomena.cz
           ▼
[ Cloudflare Edge Network ] (DDoS ochrana, CDN cache, SSL ukončení)
           │
           │  2. Šifrovaný odchozí tunel (protokol QUIC / WireGuard)
           ▼
[ Kontejner 'cloudflared' na Pi ] (v síti 'proxy_net')
           │
           │  3. Přímé interní směrování v Docker síti
           ▼
[ Kontejner 'personal-web':3000 ]
```

---

## 2. Architektura Docker sítě (`proxy_net`)

Kontejner `cloudflared` i aplikace `personal-web` musí běžet ve stejné externí Docker síti `proxy_net`:

- **Název sítě:** `proxy_net` (`external: true`)
- **Výhoda:** Tunel se může na cílovou službu odkazovat přímo jejím kontejnerovým jménem a interním portem (`http://personal-web:3000`), aniž by musel jít oklikou přes hostitelský stroj.

---

## 3. Postup publikace nové subdomény (např. `blog.kubiv.cz`)

### Krok 1: Přidání trasy v Cloudflare Zero Trust
1. V administraci Cloudflare přejděte do **Networks** -> **Tunnels**.
2. Rozklikněte svůj aktivní tunel (např. `malina-server`) a přejděte do záložky **Published application routes** (nebo **Hostname routes**).
3. Klikněte na **Add a published application route** (nebo *Add a route*).
4. Vyplňte formulář:

| Pole formuláře | Příklad hodnoty | Význam |
|---|---|---|
| **Subdomain** | `blog` | Název požadované subdomény |
| **Domain** | `vasedomena.cz` | Hlavní registrovaná doména v Cloudflare |
| **Path** | *(ponechat prázdné)* | Pravidlo platí pro celý web |
| **Service Type** | `HTTP` | Protokol lokální webové aplikace |
| **URL** | `personal-web:3000` | Název kontejneru a jeho interní port |

5. Klikněte na **Save**.

### Krok 2: Automatický DNS CNAME záznam
Cloudflare v sekci **DNS** -> **Records** automaticky vytvoří záznam:
- **Typ:** `CNAME` (v rozhraní zobrazeno jako `Tunnel`)
- **Název:** `blog.vasedomena.cz`
- **Cíl:** `<TUNNEL_ID>.cfargotunnel.com`
- **Proxy status:** `Proxied` (oranžový mráček zapnut)

---

## 4. Řešení častých problémů a diagnostika

### ⚠️ Problém: Doména hlásí `NXDOMAIN` (Server not found)
- **Příčina:** Pokud jste se na subdoménu pokusili připojit *předtím*, než byl záznam v Cloudflare aktivní, váš lokální DNS resolver (router nebo Wi-Fi poskytovatel) si uložil tzv. **negativní mezipaměť** (RFC 2308) a po dobu až 30 minut bude tvrdit, že doména neexistuje.
- **Jak ověřit, že Cloudflare už záznam ve skutečnosti zná:**
  Spusťte dotaz na nezávislý DNS resolver:
  ```bash
  dig @1.1.1.1 blog.vasedomena.cz
  ```
  Nebo přímo na autoritativní nameserver Cloudflaru:
  ```bash
  dig @<VAS_NS_SERVER>.ns.cloudflare.com blog.vasedomena.cz
  ```
  Pokud vidíte `status: NOERROR` a dvě Cloudflare IP adresy, záznam je v pořádku aktivní.
- **Jak otestovat bez čekání na lokální cache:**
  - Na mobilním telefonu **vypněte Wi-Fi** a otevřete web přes mobilní data (LTE/5G).
  - Na počítači lze využít přímé přesměrování v curl:
    ```bash
    curl -IL --resolve blog.vasedomena.cz:443:104.21.x.x https://blog.vasedomena.cz
    ```

### ⚠️ Problém: Chyba `502 Bad Gateway` v prohlížeči
- **Příčina 1:** Kontejner `personal-web` neběží (`docker ps`).
- **Příčina 2:** Kontejner `cloudflared` a `personal-web` nejsou ve stejné Docker síti (`proxy_net`).
- **Příčina 3:** V nastavení trasy tunelu byl zadán nesprávný port (např. `3001` namísto interního portu `3000`).

---

## 5. Zabezpečení neveřejných služeb (Cloudflare Access / Zero Trust)

Pokud budete v budoucnu chtít přes internet zpřístupnit i správce souborů (**File Browser** pro psaní článků na např. `cms.vasedomena.cz`), nenechávejte jej otevřený veřejnosti.

### Doporučený postup zabezpečení:
1. V tunelu přidejte trasu: `cms.vasedomena.cz` ──> `http://filebrowser:80`.
2. V Cloudflare Zero Trust přejděte do **Access** -> **Applications**.
3. Klikněte na **Add an application** -> **Self-hosted**.
4. Zadejte adresu `cms.vasedomena.cz`.
5. V sekci **Policies**:
   - **Action:** `Allow`
   - **Rule type / Include:** `Emails`
   - Zadejte svůj osobní e-mail.
6. Uložte.

**Výsledek:** Kdokoliv, kdo otevře `cms.vasedomena.cz`, uvidí nejprve přihlašovací obrazovku Cloudflare. Teprve po zadání jednorázového PINu zaslaného na váš e-mail bude vpuštěn do administračního rozhraní na Raspberry Pi.

---

## 6. Užitečné příkazy pro diagnostiku tunelu

Spouštějte na Raspberry Pi:

```bash
# Zobrazení stavu a posledních událostí tunelu
docker logs --tail 50 cloudflared

# Živé sledování provozu protékajícího tunelem
docker logs -f cloudflared

# Ověření, že tunel zevnitř vidí na aplikaci
docker exec cloudflared curl -sI http://personal-web:3000 | head -n 5

# Restartování kontejneru tunelu
docker restart cloudflared
```
