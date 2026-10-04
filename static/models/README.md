# 3D Modely webu (3D Assets)

Tato složka slouží pro ukládání 3D modelů pro interaktivní zobrazení na webu.

## Podporované formáty a kam nahrát soubor

Váš 3D model můžete nahrát přímo do této složky:

### 1. Formát Wavefront OBJ (`.obj`)
- **Cesta k souboru:** `static/models/logo.obj` (na webu přístupné jako `/models/logo.obj`)
- **Materiály (volitelné):** `static/models/logo.mtl` a případné textury do stejné složky.
- *Poznámka:* Pokud soubor `.mtl` nemáte, web automaticky aplikuje metalický modrý lak odpovídající reálnému 3D renderu loga!

### 2. Formát glTF 2.0 Binary (`.glb` / `.gltf`)
- **Cesta k souboru:** `static/models/logo.glb` (na webu přístupné jako `/models/logo.glb`)
- Obsahuje geometrii i materiály v jednom souboru.

### 3. Formát STL (`.stl`)
- **Cesta k souboru:** `static/models/logo.stl` (na webu přístupné jako `/models/logo.stl`)
- STL obsahuje geometrii; barvu (`color`) a případnou obrázkovou texturu (`texture`) lze nastavit v `server-content/site.json`.

Web automaticky detekuje přítomnost `logo.obj`, `logo.glb` i `logo.stl`.
*Doporučení pro produkční nasazení:* Vlastní modely a textury nahrávejte do `server-content/assets/` a v `server-content/site.json` odkazujte přes `/custom-assets/...`, aby nebyly přepsány při aktualizaci z Gitu.

## Tipy pro export z 3D editoru (např. Blender)

1. **Aplikace transformací (Apply Transforms):**
   - V Blenderu vyberte objekt a stiskněte `Ctrl + A` &rarr; `All Transforms`. Tím se vynulují náhodné rotace a měřítko se nastaví na 1.0.
2. **Nastavení středu (Origin):**
   - Nastavte pivot do geometrického středu: `Object` &rarr; `Set Origin` &rarr; `Origin to Geometry`.
   - *Poznámka: Komponenta na webu má navíc zabudované automatické centrování (auto-centering) a přizpůsobení velikosti.*
3. **Export do glTF:**
   - `File` &rarr; `Export` &rarr; `glTF 2.0 (.glb/.gltf)`
   - Formát: **glTF Binary (.glb)**
   - V sekci *Transform* ponechte standardní `+Y Up`.

---

## Kalibrace výchozího natočení (Default Rotation)

Pokud se váš 3D model po nahrání zobrazí v jiném úhlu, než má původní logo:

1. Otevřete v prohlížeči stránku **O mně** (`/about`).
2. Otevřete vývojářskou konzoli prohlížeče (`F12` nebo `Cmd + Option + I` &rarr; záložka *Console*).
3. Můžete také v URL zadat parametr `http://localhost:5173/about?debug3d=1`.
4. Tažením myši natočte model přesně do úhlu, který odpovídá logu.
5. V konzoli se po otočení vypíší přesné hodnoty rotace, např.:
   ```text
   [Logo3D] initialRotation={{ x: 15, y: -25, z: 0 }}
   ```
6. Hodnoty jednoduše zadejte do `server-content/site.json` bez nutnosti sahat do zdrojových kódů:
   ```json
   "logo3d": {
     "home": {
       "rotation": { "x": 15, "y": -25, "z": 0 }
     }
   }
   ```

---

## Fallback

Pokud žádný 3D soubor v této složce ještě není nebo se nepodaří načíst, web automaticky a bez chyb zobrazí statické logo `/logos/logo-3d.png`.

