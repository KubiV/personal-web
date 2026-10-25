---
title: "Vzor 4: Klinická kalkulačka MAP a BMI (Pro subdoménu med)"
date: "2026-10-25"
category: "Medicína"
categories: ["Medicína", "Kardiologie", "Kalkulačky"]
description: "Ukázkový interaktivní článek zařazený do kategorie Medicína. Na subdoméně med.vavra.pro se automaticky vyfiltruje a přepne web do smaragdově zeleného motivu."
interactive: true
html: "index.html"
iframeHeight: "500px"
---

Tento článek má v hlavičce nastaveno `category: "Medicína"`, což po normalizaci odpovídá slugu `medicina`.

Pokud v `server-content/site.json` nastavíte subdoménu `med` s `"category": "medicina"`, tento článek se automaticky zobrazí na `med.vavra.pro` (nebo lokálně na `http://med.localhost:5173`).
