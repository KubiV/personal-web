# 📚 Katalog vzorových článků (Všechny možnosti webu)

Tento adresář slouží jako **přehledná knihovna šablon pro všechny typy článků**, které web podporuje.

> **Jak šablonu použít:**
> Zkopírujte vybranou složku do `server-content/blog/<vas-slug>/` (nebo přímo ve webovém správci **Filebrowser CMS** zkopírujte složku z `vzorove-clanky/` do `blog/`), přejmenujte ji a upravte podle sebe. Změny se na webu projeví okamžitě bez restartu!

---

## 📂 Přehled dostupných šablon

| Složka šablony | Co ukazuje | Klíčové parametry v `index.md` |
|---|---|---|
| **[`01-zakladni-markdown-clanek`](./01-zakladni-markdown-clanek/)** | Klasický článek v Markdownu: nadpisy, bloky kódu, tabulky, citace, vkládání obrázků (`./sample.svg`) a automatický náhled z 1. obrázku v textu. | `title`, `date`, `category`, `description` |
| **[`02-vicejazycny-clanek`](./02-vicejazycny-clanek/)** | Vícejazyčný článek s přepínačem jazyků a vlaječkami (`CZ`, `EN`, `DE`). Stačí přidat `index.en.md` nebo `index.de.md` do stejné složky. | `index.md` + `index.en.md` + `index.de.md` |
| **[`03-interaktivni-html-aplikace`](./03-interaktivni-html-aplikace/)** | Interaktivní HTML + JS + CSS aplikace vykreslená přímo v článku se zachováním hlavičky webu, tlačítkem **Celá obrazovka**, externími skripty (`app.js`, `style.css`), automatickým náhledem `cover.svg` a doprovodným Markdown textem. | `interactive: true`, `html: "index.html"`, `iframeHeight: "620px"` |
| **[`04-clanek-pro-subdomenu-med`](./04-clanek-pro-subdomenu-med/)** | Interaktivní medicínská kalkulačka (BMI & MAP) zařazená do kategorie `Medicína`. Ukazuje filtrování pro tematickou subdoménu (např. `med.vavra.pro`). | `category: "Medicína"`, `categories: ["Medicína", "Kardiologie"]`, `interactive: true` |
| **[`05-varianty-nahledu-a-autoru`](./05-varianty-nahledu-a-autoru/)** | Referenční ukázka pokročilých voleb: více spoluautorů (`authors`), vlastní náhled (`image`), vypnutí náhledu (`image: false`) a režim konceptu (`draft: true`). | `authors`, `image`, `imageAlt`, `draft` |

---

## ⚡ Kompletní tahák všech polí YAML hlavičky (`index.md`)

```yaml
---
# 1. ZÁKLADNÍ POVINNÉ ÚDAJE
title: "Název vašeho článku"
date: "2026-10-25"
category: "Technologie"
description: "Stručný popis (perex) pro výpisy článků a vyhledávače (SEO)."

# 2. VÍCE KATEGORIÍ (volitelné)
categories: ["Technologie", "Hardware", "Návody"]

# 3. AUTOR / SPOLUAUTOŘI (volitelné, výchozí je majitel webu z site.json)
author: "KubiV"
# nebo více autorů:
# authors: ["KubiV", "MUDr. Jan Novák"]

# 4. NÁHLEDOVÝ OBRÁZEK VE VÝPISECH (volitelné)
# - Neuvedeno / "first": automaticky vezme 1. obrázek v textu nebo soubor cover.png / cover.jpg
# - Konkrétní soubor:    image: "./cover.svg"
# - Vypnuto:             image: false (nebo image: "none")
image: "./cover.svg"
imageAlt: "Popis náhledového obrázku pro čtečky a SEO"

# 5. INTERAKTIVNÍ HTML+JS APLIKACE (volitelné)
interactive: true            # Zapne interaktivní iframe režim (alternativně type: "html")
html: "index.html"           # Hlavní HTML soubor ve složce článku (výchozí je "index.html")
iframeHeight: "750px"        # Výška okna aplikace (výchozí "80vh")
contentPosition: "below"     # Kde zobrazit doprovodný Markdown text: "below" (pod) nebo "above" (nad)

# 6. PUBLIKACE / KONCEPT (volitelné)
draft: false                 # Při true se článek na produkčním serveru skryje
---
```
