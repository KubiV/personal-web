---
title: "Vzor 1: Klasický článek v Markdownu s obrázky a kódem"
date: "2026-10-25"
category: "Návody"
categories: ["Návody", "Markdown"]
description: "Základní šablona běžného textového článku. Ukazuje formátování nadpisů, seznamů, citací, bloků kódu, tabulek a automatický náhled z prvního obrázku."
draft: false
---

Toto je ukázka klasického článku psaného v **Markdownu**. Protože v hlavičce není uvedeno `image:`, web automaticky použije první obrázek v textu níže (`./sample.svg`) jako náhledovou kartu v seznamu článků.

## 1. Vložení lokálního obrázku

Obrázek nahraný ve stejné složce jako `index.md` vložíte relativním odkazem:

![Ukázková ilustrace článku](./sample.svg)

## 2. Bloky kódu a zvýraznění

Inline kód se píše do zpětných apostrofů, např. `docker compose up -d`. Víceřádkový blok kódu:

```javascript
export function vypocitejVykon(napeti, proud) {
	const vykon = napeti * proud;
	return `${vykon.toFixed(1)} W`;
}
```

## 3. Citace a poznámky

> **Tip:** Jakoukoliv změnu v souboru `index.md` uvidíte na webu okamžitě po obnovení stránky v prohlížeči (F5), není potřeba spouštět build.

## 4. Tabulka parametrů

| Parametr | Hodnota | Poznámka |
|---|---|---|
| Formát | Markdown (`.md`) | Parsováno za běhu (runtime) |
| Náhled | Automatický | První obrázek v textu |
| Kategorie | `Návody`, `Markdown` | Podporuje diakritiku i více štítků |
