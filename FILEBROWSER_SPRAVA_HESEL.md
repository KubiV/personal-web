# Správa uživatelů a hesel ve File Browseru (CMS)

Tento manuál popisuje, jak bezpečně měnit, resetovat a spravovat uživatelské účty a hesla v aplikaci **File Browser** na Raspberry Pi, a vysvětluje technické pasti, na které je nutné si dát pozor.

---

## 1. Změna hesla přes webové rozhraní (Nejjednodušší způsob)

Pokud jste přihlášeni do webového rozhraní na `http://cms.lan` nebo `http://nas.lan`:

1. V levém menu klikněte na **Settings** (Nastavení).
2. V sekci **Profile** (Profil):
   - Vyplňte **Password** (Nové heslo).
   - Znovu zadejte heslo do **Password confirmation**.
3. Klikněte dole na tlačítko **Save** (Uložit).

> **Tip:** Zde si můžete také změnit jazyk rozhraní do češtiny (**Language** -> *Čeština*).

---

## 2. Reset / Změna hesla z příkazové řádky (Když jste heslo zapomněli)

Pokud se do webového rozhraní nemůžete přihlásit (chyba *Wrong credentials*), postupujte přesně podle tohoto 4-krokového postupu:

```bash
# 1. Zastavit kontejner (uvolní se zámek databáze bbolt)
docker stop filebrowser

# 2. Aktualizovat heslo (nebo vytvořit admina, pokud neexistuje)
docker run --rm \
  -v /srv/compose/personal-web/filebrowser:/database \
  filebrowser/filebrowser:latest \
  users update admin --password "VaseNoveHeslo123" -d /database/filebrowser.db || \
docker run --rm \
  -v /srv/compose/personal-web/filebrowser:/database \
  filebrowser/filebrowser:latest \
  users add admin "VaseNoveHeslo123" --perm.admin -d /database/filebrowser.db

# 3. Obnovit vlastnictví souborů pro uživatele pi (UID:GID 1000)
sudo chown -R 1000:1000 /srv/compose/personal-web/filebrowser

# 4. Znovu nastartovat kontejner
docker start filebrowser
```

Po dokončení se přihlaste na `http://cms.lan`:
- **Uživatel:** `admin`
- **Heslo:** `VaseNoveHeslo123`

---

## 3. Na co si dát pozor (Kritická úskalí a chyby)

### ⚠️ Past 1: Zámek databáze (`Error: timeout`)
- **Proč vzniká:** File Browser používá databázový engine **bbolt** (BoltDB). Tento engine vyžaduje **výhradní zámek souboru** (exclusive file lock). Dokud webový server uvnitř kontejneru běží, nikdo jiný nesmí do databáze zapisovat.
- **Důsledek:** Pokud spustíte příkaz `docker exec filebrowser filebrowser users update ...` za plného běhu kontejneru, příkaz zamrzne a po chvíli skončí chybou `Error: timeout`.
- **Řešení:** Před použitím CLI nástroje kontejner vždy nejprve zastavte (`docker stop filebrowser`) a po úpravě znovu spusťte (`docker start filebrowser`).

### ⚠️ Past 2: Špatná cesta na disku (`/srv/data/` vs. `/srv/compose/`)
- **Proč vzniká:** Některé obecné návody na internetu doporučují cestu `/srv/data/...`. Naše architektura má však projekt a jeho volumes umístěny v:
  `/srv/compose/personal-web/filebrowser/`
- **Důsledek:** Pokud do `docker run -v` zadáte neexistující cestu `/srv/data/personal-web/...`, Docker tam vytvoří novou prázdnou databázi, heslo nastaví v ní, ale váš běžící kontejner stále čte svou původní databázi v `/srv/compose/...`. Výsledkem je, že přihlášení stále hlásí *Wrong credentials*.
- **Řešení:** Vždy používejte absolutní cestu `/srv/compose/personal-web/filebrowser:/database`.

### ⚠️ Past 3: Oprávnění souborů (`Permission denied` / pád kontejneru)
- **Proč vzniká:** Příkaz `docker run --rm` běží pod uživatelem `root`. Tím může změnit vlastníka souboru `filebrowser.db` na `root:root`.
- **Důsledek:** Kontejner Filebrowseru běží pod neprivilegovaným uživatelem `pi` (`UID:GID 1000:1000`). Pokud databáze patří `rootu`, kontejner do ní nemá právo zapisovat a při startu spadne.
- **Řešení:** Po každém spuštění jednorázového kontejneru obnovte práva příkazem:
  ```bash
  sudo chown -R 1000:1000 /srv/compose/personal-web/filebrowser
  ```

---

## 4. Další užitečné příkazy pro správu uživatelů

Všechny následující příkazy spouštějte při **zastaveném kontejneru** (`docker stop filebrowser`):

### Výpis všech existujících uživatelů:
```bash
docker run --rm \
  -v /srv/compose/personal-web/filebrowser:/database \
  filebrowser/filebrowser:latest \
  users ls -d /database/filebrowser.db
```

### Vytvoření nového uživatele (např. běžný uživatel bez administrátorských práv):
```bash
docker run --rm \
  -v /srv/compose/personal-web/filebrowser:/database \
  filebrowser/filebrowser:latest \
  users add jana "HesloJany123" -d /database/filebrowser.db
```

### Smazání uživatele:
```bash
docker run --rm \
  -v /srv/compose/personal-web/filebrowser:/database \
  filebrowser/filebrowser:latest \
  users rm jana -d /database/filebrowser.db
```

---

## 5. Úplný reset do továrního nastavení

Pokud je databáze poškozená nebo chcete začít zcela od nuly:

```bash
cd /srv/compose/personal-web
docker compose stop filebrowser
rm -f filebrowser/filebrowser.db
docker compose start filebrowser
```

File Browser si při startu automaticky vygeneruje novou prázdnou databázi s továrním účtem:
- **Uživatel:** `admin`
- **Heslo:** `admin`
