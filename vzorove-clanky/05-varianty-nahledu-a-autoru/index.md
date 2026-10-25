---
title: "Vzor 5: Pokročilé volby hlavičky (Spoluautoři, vlastní náhled a koncepty)"
date: "2026-10-25"
authors:
  - "KubiV"
  - "Jan Novák"
category: "Návody"
categories: ["Návody", "CMS"]
description: "Referenční šablona ukazující nastavení více spoluautorů, vypnutí či vlastní volbu náhledového obrázku a přepínač rozpracovaného článku (draft)."
image: false
draft: false
---

Tento vzorový článek ukazuje pokročilé možnosti YAML hlavičky:

1. **Více spoluautorů (`authors`):** V hlavičce článku i ve výpisu se zobrazí `KubiV, Jan Novák`.
2. **Vypnutý náhled (`image: false`):** I kdyby článek obsahoval obrázky, v seznamu článků zůstane čistě textový.
3. **Koncept (`draft: true/false`):** Pokud nastavíte `draft: true`, článek uvidíte při lokálním vývoji (`npm run dev`), ale na produkčním serveru zůstane skrytý, dokud jej nepřepnete na `draft: false`.
