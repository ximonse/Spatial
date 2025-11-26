Vetenskaplig bakgrund

### Visuospatial Sketchpad (Baddeley & Hitch, 1974)

I Alan Baddeleys klassiska modell av arbetsminne är den visuospatiala sketchpaden ansvarig för:

1. **Visuell cache**: Tillfällig lagring av visuell information
2. **Inner scribe**: Spatial och movement-planering
3. **Spatial manipulation**: Rotation och transformation av objekt

Spatial View digitaliserar dessa funktioner:
- **Visual cache** → Kort med text/bilder
- **Inner scribe** → Dra, arrangera, gruppera
- **Spatial manipulation** → Arrangerings-algoritmer

### Varför det fungerar

**Spatial memory** (O'Keefe & Nadel, 1978):
> "Platsceller i hippocampus skapar kognitiva kartor som är starkare än sekventiella minnen"

**Dual Coding Theory** (Paivio, 1971):
> "Information kodad både visuellt och verbalt ger starkare minnesförmåga"

Spatial View kombinerar dessa principer för optimalt lärande och minne.

### Varför spatial organisering?

I kognitiv psykologi vet vi att:
- **Spatial memory** är starkare än linjär minne
- **Visuell association** genom närhet skapar naturliga samband
- **Fri manipulation** i 2D-rum speglar hur vi tänker

Spatial View tar dessa principer och skapar en digital arbetsyta där du kan:

✨ **Organisera visuellt**: Placera kort fritt baserat på relationer
🧠 **Tänka spatialt**: Hitta information genom position, inte sök
🎨 **Skapa mönster**: Se samband genom spatial gruppering
📸 **Integrera bilder**: Importera foton av handskrivna anteckningar


Mål:
jag vill kunna använda olika ai's för att söka, analysera och manipulera korts placering och innehåll. Det kan vara studier, forskning, jobba, vardagsgrejer och djupare reflektioner. Ain ska all textinnehåll. rubriker, löptext, kommentarer, meta-taggar, taggar etc

API - jag använder api och oauth-nycklar om det behövs.

Github - den ska publiceras på via github och finnas på vercel.



### Kort-typer
- **Text-kort**: Som liggande a7 indexkort med text
- **Bild-kort**: Importera foton/skärmdumpar
  - Dubbelklick för att redigera (öppnar dialog med bild + textfält)
  - Kommentarer visas under bilden på framsidan

**Återställ från backup (R):**
- Välj en tidigare nedladdad backup-zip
- Importerar alla kort och bilder från backuppen
- Lägger till korten till befintliga (tar inte bort gamla)
- Bekräftar före import med datum och antal kort

### Essentiella
- `Space` - Kommandopalett (visar alla kommandon)
- `K` - Toggle brädvy/kolumnvy
- `N` - Nytt kort
- `I` - Importera bild

- Dubbelklicka för att redigera
- Inline editor med Markdown preview
- Bulk editor för flera kort samtidigt
- Touch bulk menu (mobil)

### Sök
- Boolean search: AND, OR, NOT
- Wildcards: `*` (flera tecken), `?` (ett tecken)
- Proximity search: `ord1 NEAR/5 ord2`
- Exempel: `(python OR javascript) AND NOT tutorial*`

### Copy/Paste
- Ctrl+C: Kopiera markerade kort
- Ctrl+V: Klistra in vid muspekare
- Kan kombineras med arrangering (Q, G+V etc) (viktig)

### Import/Export
- **Importera bilder**: Välj flera bilder samtidigt
- **Bildkvalitet**: Välj Normal, Hög eller Original
  - Normal: 800px, 80% kvalitet
  - Hög: 1200px, 90% kvalitet
  - Original: Ingen komprimering
- **Multi-Import (M)**: Skapa flera kort från text
  - Format: Dubbel radbrytning = nytt kort
  - `#taggar` på sista raden = taggar till kortet
  - `&kommentar` på sista raden = kommentar
  - Två lägen:
    - **Skapa kort**: Manuell parsing av formatet
    - **✨ Analysera med Gemini**: AI extraherar nyckelcitat från lång text
- **Exportera läsbar text (E)**: Exportera till läsbara format
  - **HTML**: Färgstylad export som kolumnvy
  - **Markdown**: Formaterad med kursiva kommentarer
  - **Plain text**: Enkel oformaterad export
- **Exportera JSON**: S i kommandopaletten
- **Importera JSON**: L i kommandopaletten
- **Backup (zip)**: B i kommandopaletten - alla kort + bilder som zip
- **Återställ från backup**: R i kommandopaletten - återställ från zip-backup

### Vyer
- 🗂️ Brädvy (canvas): Fri positionering, spatial view
- 📋 Kolumnvy: Scrollbar lista sorterad efter senast ändrad

### Storage
- IndexedDB med Dexie.js
- Lokal lagring i webbläsaren

### Kommandopalett
Öppna med **Space**:
- Visar alla tillgängliga kommandon
- Snabb åtkomst till funktioner
- Tangentbordsgenvägar listade
- Tips och beskrivningar

## Tangentbordsgenvägar

### Navigation & View
- `Space`: Kommandopalett
- `K`: Toggle brädvy/kolumnvy
- `Escape`: Avmarkera alla kort, rensa sök

### Editing
- `N`: Nytt text-kort
- `I`: Importera bild
- `F`: Fokusera sökfält
- `Double-click`: Redigera kort

### Copy/Paste/Undo
- `Ctrl+C`: Kopiera
- `Ctrl+V`: Klistra in
- `Ctrl+Z`: Ångra
- `Ctrl+Y`: Gör om
- `Ctrl+D`: Duplicera

### Arrangering
- `V`: Vertikal
- `H`: Horisontell
- `G`: Grid
- `Q`: Cirkel/Cluster
- `G+V`: Grid vertikal
- `G+H`: Grid horisontell
- `G+T`: Grid överlappande (Kanban)

### Actions
- `P`: Pinna/Avpinna kort
- `Delete`: Ta bort markerade kort
- `Ctrl+A`: Markera alla kort

### Import/Export/Backup
- `S`: Exportera JSON
- `L`: Importera JSON
- `M`: Multi-import (skapa flera kort från text)
- `E`: Exportera till läsbar text (HTML/Markdown/Plain)
- `B`: Ladda ner backup (zip)
- `R`: Återställ från backup (zip)

## AI-funktioner (Gemini)

### Bildanalys med OCR
- **Läs bild med Gemini** från högerklicksmenyn på bildkort
- Extraherar:
  - Text från bilder (OCR)
  - Datum och tid (om synligt i bilden)
  - Personer och platser
  - Automatiska hashtags baserat på innehåll
- Metadata sparas på kortets baksida
- Kräver Google AI API-nyckel (gratis på [Google AI Studio](https://makersuite.google.com/app/apikey))
- API-nyckeln sparas lokalt i webbläsaren

### Text-analys för multi-import
- **✨ Analysera med Gemini** i multi-import-dialogen (M)
- Ta lång text och få AI att extrahera nyckelcitat
- Skapar flera små kort från en text
- Perfekt för att bryta ner artiklar, föreläsningar, etc.

- **Dexie.js**: IndexedDB wrapper
- **JSZip**: Backup zip-filer
- **Vite**: Build tool & dev server
- **browser-image-compression**: Bildkomprimering
- **marked**: Markdown rendering (editor preview)

4. **FÖRKLARA:**
   - "Jag grupperade i Forskning (15 kort inklusive #zotero), Planering (22 kort inklusive #calendar), Kreativitet (8 kort)"
   - Transparent om resonemang och val

### Innan du lägger till en funktion

1. **Fråga**: Vilken modul hör detta till?
2. **Kolla**: Är filen redan över 200 rader?
3. **Om ja**: Skapa en ny modul eller dela upp befintlig först
4. **Importera**: Använd named exports, inte default exports

### Refactoring-signaler

- **Fil > 300 rader** = Akut refactoring
- **Fil > 200 rader** = Planera uppdelning
- **Funktion > 50 rader** = Överväg att dela upp
   
- AI förstår spatial geometri (kort = 200×150px, 15px = samma grupp, 250px = olika grupper)
- AI komponerar lösningar från grundoperationer
- "Arrangera i 3 kategorier" → analyserar data → beräknar layout → skapar 3 kolumner


## Principer

### Modularisering
- **Ingen fil över 300 rader** (helst under 200)
- **En fil = ett ansvar** (Single Responsibility Principle)
- **Dela upp tidigt** - vänta inte tills filen är för stor

Istället för tool-beskrivningar innehåller prompten:

1. **Spatial kunskap:**
   ```
   - Kort: 200×150px (fast storlek)
   - 13-20px spacing = samma grupp
   - 200-300px spacing = olika grupper
   - Canvas: oändligt 2D-system
   ```

2. **Visuella mönster:**
   ```
   - Grid: x += 215px kolumner, y += 165px rader
   - Kluster: 15px inom, 250px mellan
   - Timeline: sortera efter datum, placera sekvensiellt
   - Hierarki: central → periferi
   ```

### Fördelar med denna arkitektur

✅ **Intelligent:** AI resonerar istället för pattern-matching
✅ **Flexibel:** Kan skapa VILKEN layout som helst
✅ **Transparent:** Förklarar sina val och beräkningar
✅ **Skalbar:** Ingen ny kod behövs för nya mönster
✅ **Användarvänlig:** Shortcuts och buttons fungerar som vanligt

### Testing och validering

**Test cases:**
1. "Arrangera i 3 kategorier" → ska skapa 3 kolumner, inte 60 grids
2. "Gruppera forskningskort" → ska inkludera #zotero-kort
3. "Visa veckan som tidslinje" → ska beräkna kronologisk layout
4. "Samla duplicerade kort" → ska identifiera och gruppera

**Success criteria:**
- AI förklarar sitt resonemang
- Meta-taggar inkluderas i alla operationer
- Spacing-principer följs (15px inom, 250px mellan)
- Användare behåller alla shortcuts

## Enhetsstöd

### Desktop
- Full funktionalitet
- Alla kortkommandon
- Mouse + keyboard workflow

### Tablet/Mobile
- Touch-optimerad
- Pinch-to-zoom
- Swipe för panorering
- Touch bulk menu (håll + välj flera kort)
- Standard UI-läge: Minimal

### E-ink (Viwoood AiPaper Mini, etc)
- Auto-detected
- E-ink tema aktiveras automatiskt
- Inga animationer
- Kolumnvy som standard
- Standard UI-läge: Minimal


### Arrangering
Arrangera markerade kort i mönster:
- Vertikal kolumn (V)
- Horisontell rad (H)
- Grid (G)
- Cirkel/Cluster (Q)
- Grid vertikal (G+V)
- Grid horisontell (G+H)
- Grid överlappande Kanban-stil (G+T)

### Editing
- `Dubbelklick` - Redigera kort
- `Ctrl+C/V` - Kopiera/Klistra in
- `Ctrl+Z/Y` - Ångra/Gör om

### Arrangering
- `V/H/G` - Vertikal/Horisontell/Grid
- `Q` - Cirkel
- `P` - Pinna kort (lås position)

### Data
- `B` - Backup (ladda ner zip)
- `S` - Exportera JSON
- `L` - Importera JSON

### 🌓 Teman
- ☀️ Ljust
- 🌙 Mörkt
- 📄 E-ink (optimerat för e-papper)

### 🎨 Arrangering
- Vertikal/Horisontell
- Grid (flera varianter)
- Cirkel/Cluster
- Kanban-stil (överlappande)

### 💾 Backup
Ladda ner komplett backup:
- Alla kort som JSON
- Alla bilder som PNG
- Packade i zip-fil

### 🔍 Boolean Search
```
(python OR javascript) AND NOT tutorial*
ord1 NEAR/5 ord2
```

### 🎯 Spatial Canvas
- Fri positionering av kort på 2D-canvas
- Touch-optimerad (pinch-to-zoom, swipe)
- Smooth Konva.js rendering

### 📝 Kort-typer
- **Text-kort**: Snabba anteckningar (Markdown-stöd)
- **Bild-kort**: Importera foton av handskrivet

# Build Instructions för Spatial View

## Development

Kör lokalt med Vite dev server:
```bash
npm run dev
```

Detta använder `index.html.dev` (om du har bytt tillbaka) eller kan peka direkt på src-filerna.

## Production Build

När du gör ändringar som ska till GitHub Pages:

### 1. Bygg projektet
```bash
npm run build
```

Detta skapar en `dist/` mapp med:
- Minifierad och bundlad JavaScript
- Optimerad CSS
- Production-ready index.html

### 2. Kopiera till root
```bash
# Spara dev-version (om du vill)
mv index.html index.html.dev

# Kopiera production build
cp dist/index.html index.html
cp -r dist/assets assets
```

### 3. Commit och push
```bash
git add -A
git commit -m "Build production version"
git push origin master
```

## Viktigt att komma ihåg

- **GitHub Pages kan INTE hantera ES modules från node_modules**
- Du måste bygga med Vite först innan du pushar
- `index.html` i root ska vara production-versionen
- `src/` behålls för development
- `dist/` och `index.html.dev` är gitignored

## Automatisk deploy (framtida förbättring)

Du kan lägga till GitHub Actions för att bygga automatiskt:
1. Commit endast src-ändringar
2. GitHub Actions kör `npm run build` automatiskt
3. Deployer till GitHub Pages

Men för nu: bygg manuellt innan push!