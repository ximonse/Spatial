# Spatial Note - Handbok

En spatial anteckningsapp inspirerad av Zettelkasten och kognitiv psykologi.

## Innehåll

- [Kom igång](#kom-igång)
- [Kortkommando](#kortkommando)
- [Grundläggande funktioner](#grundläggande-funktioner)
- [Import & Export](#import--export)
- [Vyer](#vyer)
- [Arrangemang](#arrangemang)
- [Tips & tricks](#tips--tricks)

---

## Kom igång

### Skapa ditt första kort

Tryck **N** för att skapa ett nytt kort. Ett kort är 200×150 pixlar (A7-format) och kan växa dynamiskt upp till 800 pixlar höjd beroende på innehåll.

### Redigera kort

**Dubbelklicka** på ett kort för att öppna editorn. Du kan skriva Markdown-formaterad text:

```markdown
# Rubrik
## Underrubrik

**Fet text** och *kursiv text*

- Punktlista
- Objekt 2

`kod` och kodblock
```

**Spara:** Tryck **Ctrl+Enter** eller klicka "Save"
**Avbryt:** Tryck **Esc** eller klicka "×"

### Flytta kort

Klicka och dra ett kort för att flytta det. Alla markerade kort flyttas tillsammans om du har flera markerade.

---

## Kortkommando

### Grundläggande

| Tangent | Funktion |
|---------|----------|
| **N** | Skapa nytt kort |
| **Space** | Öppna kommandopalett (visa alla kommandon) |
| **Esc** | Avmarkera alla kort / Rensa sökning |
| **K** | Växla mellan Board/Column view |

### Markering & Redigering

| Tangent | Funktion |
|---------|----------|
| **Klick** | Markera ett kort (avmarkerar andra) |
| **Shift+Klick** | Lägg till/ta bort kort från markering |
| **Ctrl+A** | Markera alla kort |
| **Dubbelklick** | Redigera kort |

### Kopiera & Klistra

| Tangent | Funktion |
|---------|----------|
| **Ctrl+C** | Kopiera markerade kort |
| **Ctrl+V** | Klistra in kopierade kort |
| **Ctrl+D** | Duplicera markerade kort |

### Kortstatus

| Tangent | Funktion |
|---------|----------|
| **P** | Fäst/lossa markerade kort (pinnning) |
| **Delete/Backspace** | Ta bort markerade kort |

### Arrangemang

| Tangent | Funktion |
|---------|----------|
| **V** | Arrangera vertikalt (15px mellanrum) |
| **H** | Arrangera horisontellt (15px mellanrum) |
| **G** | Arrangera i grid (5 kort/rad) |
| **Q** | Arrangera i cirkel |
| **G+V** | Grid vertikalt (kolumner) |
| **G+H** | Grid horisontellt (rader) |
| **G+T** | Kanban-layout (3 kolumner) |

*Tips: Tryck G följt av V/H/T inom 500ms för kombinationer*

### Import & Export

| Tangent | Funktion |
|---------|----------|
| **S** | Exportera till JSON (Save) |
| **L** | Importera från JSON (Load) |
| **B** | Skapa ZIP-backup (Backup) |
| **R** | Återställ från ZIP (Restore) |
| **M** | Multi-import från text (Multiple) |
| **E** | Exportera till text (Export) |

### I Editorn

| Tangent | Funktion |
|---------|----------|
| **Ctrl+Enter** | Spara och stäng |
| **Esc** | Avbryt och stäng |

---

## Grundläggande funktioner

### Spatial organisation

Spatial Note bygger på principer från kognitiv psykologi:

- **15px mellanrum** = samma grupp/koncept
- **250px mellanrum** = olika grupper/koncept

När du arrangerar kort spatialt skapar din hjärna automatiskt mentala kartor som gör det lättare att komma ihåg och förstå sammanhang.

### Markdown-support

Alla kort stöder Markdown:

- **Rubriker:** `# H1`, `## H2`, `### H3`
- **Formatering:** `**fet**`, `*kursiv*`
- **Kod:** `` `inline kod` ``
- **Listor:** `- punkt` eller `1. numrerad`
- **Citat:** `> blockquote`

### Sökning

Använd sökfältet längst upp för att filtrera kort baserat på innehåll.

### Zoom & Pan

- **Scroll** för att zooma in/ut
- **Klicka och dra på bakgrunden** för att panorera
- **Zoom-nivå** visas längst upp till höger

### Pinnning

Fästa kort (tryck **P**) får en gul bakgrund och visas som "Pinned" i Column View.

---

## Import & Export

### JSON (S/L)

**Exportera (S):**
- Exporterar alla kort och bilder till en JSON-fil
- Inkluderar metadata (datum, tags, kommentarer)
- Filnamn: `spatial-notes-[timestamp].json`

**Importera (L):**
- Importerar kort från JSON-fil
- **OBS:** Rensar befintliga kort först!
- Bekräftelse krävs

### ZIP Backup (B/R)

**Backup (B):**
- Skapar ZIP med `cards.json` och `images/` mapp
- Komprimering: DEFLATE (nivå 6)
- Filnamn: `spatial-backup-[timestamp].zip`

**Restore (R):**
- Återställer från ZIP-backup
- **Lägger till** kort till befintlig samling (rensar INTE)
- Bekräftelse krävs

### Multi-Import (M)

Skapa flera kort samtidigt från text:

```
Första kortet här
Med flera rader text
#viktigt #projekt &författare: Simon

Andra kortet separerat med dubbel radbrytning
#arbete

Tredje kortet...
```

**Format:**
- Separera kort med **dubbla radbrytningar** (tom rad)
- Använd `#hashtag` för tags
- Använd `&kommentar` för metadata/kommentarer
- Tags och kommentarer tas bort från kortets innehåll

**Layout:**
- Kort skapas i grid (5 kort/rad)
- Startar från position (100, 100)

### Text Export (E)

Välj mellan tre format:

**📄 HTML:**
- Stylade dokument med CSS
- Färger och formatering bevarat
- Öppnas direkt i webbläsare
- Perfekt för delning eller utskrift

**📝 Markdown:**
- Markdown-formaterad text
- Metadata som *kursiv text*
- Kompatibel med alla Markdown-editors
- GitHub/Notion-redo

**📃 Plain Text:**
- Oformaterad text
- Maximal kompatibilitet
- Ingen formatering, bara innehåll
- Bra för backup eller enkel export

---

## Vyer

### Board View

Standard-vyn med en oändlig canvas. Dra runt kort fritt, zooma och panorera.

**Fördelar:**
- Spatial organisation
- Flexibel layout
- Visuell översikt

### Column View (K)

List-vy med alla kort i en vertikal lista.

**Fördelar:**
- Översiktlig
- Sökbar
- Sorterbar (senast ändrad, skapad, alfabetisk)

**Växla:** Tryck **K** eller klicka på "Board View"/"Column View"

Vyn du valde sparas automatiskt och återställs nästa gång du öppnar appen.

---

## Arrangemang

### Varför arrangera?

Arrangemang hjälper dig att:
- Skapa visuell struktur
- Gruppera relaterade koncept
- Se mönster och samband
- Utnyttja spatial minne

### Arrangemangstyper

**Vertical (V):**
- Staplar kort vertikalt
- 15px mellanrum
- Bra för listor och sekvenser

**Horizontal (H):**
- Raderar kort horisontellt
- 15px mellanrum
- Bra för tidslinjer

**Grid (G):**
- 5 kort per rad
- 215px horisontellt, 165px vertikalt mellanrum
- Bra för översikt

**Circle (Q):**
- Arrangerar i cirkel
- Alla kort lika långt från mitten
- Bra för brainstorming

**Grid Vertical (G+V):**
- Grid med kolumner
- 3 kolumner
- 250px horisontellt mellanrum (olika grupper)

**Grid Horizontal (G+H):**
- Grid med rader
- 3 rader
- 250px vertikalt mellanrum (olika grupper)

**Kanban (G+T):**
- 3 vertikala kolumner
- 450px mellanrum mellan kolumner
- Perfekt för TODO/DOING/DONE

---

## Tips & Tricks

### 🎯 Snabb navigering

1. Tryck **Space** för kommandopalett
2. Skriv några bokstäver för att filtrera
3. Använd **pilar** för att navigera
4. Tryck **Enter** för att köra

### 📦 Workflow: Brainstorming

1. Tryck **N** flera gånger för att skapa kort
2. Dubbelklicka och skriv idéer
3. Tryck **Q** för att arrangera i cirkel
4. Dra kort närmare varandra (15px) för att gruppera
5. Tryck **G+V** för att skapa kolumner av grupper

### 🔄 Workflow: Från text till spatial

1. Kopiera text från dokument
2. Tryck **M** för multi-import
3. Klistra in text (separera kort med tom rad)
4. Lägg till `#tags` och `&kommentarer`
5. Importera och arrangera

### 💾 Backup-strategi

1. **Varje dag:** Tryck **S** för JSON-export (snabb)
2. **Varje vecka:** Tryck **B** för ZIP-backup (komplett)
3. **Före stora ändringar:** Båda två!

### 🎨 Markera flera kort

- **Shift+Klick** för att lägga till individuella kort
- **Ctrl+A** för att markera alla
- Dra i ett kort för att flytta alla markerade tillsammans

### ⌨️ Kombinationstangenter

Kom ihåg att **G+V**, **G+H**, **G+T** måste tryckas inom 500ms:
1. Tryck **G**
2. Tryck snabbt **V** (eller H/T)

### 🔍 Spatial sökning

Istället för att söka efter text, lär dig var saker är spatialt:
- "Projektet ligger längst upp till vänster"
- "Idéer i cirkeln till höger"
- "TODO i vänstra kolumnen"

Din hjärna kommer ihåg platser bättre än text!

---

## Felsökning

### Kort syns inte

1. Tryck **Esc** för att rensa sökning
2. Zooma ut med scroll
3. Växla till Column View (K) för att se alla kort

### Import funkar inte

- **JSON:** Kolla att filen har rätt format (från Spatial Note export)
- **ZIP:** Se till att ZIP:en innehåller `cards.json`
- **Multi-import:** Kom ihåg dubbla radbrytningar mellan kort

### Kort flyttar sig konstigt

Detta är avsiktligt vid arrangemang! Använd **Ctrl+Z** (om implementerat) eller importera från senaste backup.

---

## Kortfattad referens

```
SKAPA & REDIGERA
N           Nytt kort
Dubbelklick Redigera kort
Ctrl+Enter  Spara (i editor)

MARKERA
Klick       Markera ett
Shift+Klick Lägg till/ta bort
Ctrl+A      Markera alla

KOPIERA
Ctrl+C      Kopiera
Ctrl+V      Klistra
Ctrl+D      Duplicera

ORGANISERA
V           Vertikal
H           Horisontell
G           Grid
Q           Cirkel
G+V         Grid vertikal
G+H         Grid horisontell
G+T         Kanban

IMPORT/EXPORT
S           JSON export
L           JSON import
B           ZIP backup
R           ZIP restore
M           Multi-import
E           Text export

ÖVRIGT
Space       Kommandopalett
K           Växla vy
P           Fäst/lossa
Delete      Ta bort
Esc         Avmarkera
```

---

**Version:** 0.2.0
**Byggt med:** Konva.js, Dexie.js, Marked, JSZip
**Licens:** Open Source

Spatial thinking for better understanding! 🧠✨
