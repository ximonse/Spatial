# Spatial Note

En spatial anteckningsapp med A7-kort, kontextuell kommandopalett och AI-assistent.

## Kom igång

```bash
npm install
npm run dev
```

Öppna `http://localhost:5173` (Vite standardport).

## AI-assistent

- Öppna panelen via knappen **AI Chat** i verktygsfältet eller tryck `C`.
- Lägg in API-nycklar under **API-nycklar** (Claude, Gemini eller OpenAI). Nycklar lagras lokalt i webbläsaren.
- Serverless-proxy: `api/chat.js` hanterar proxning till vald provider. Deploya som Vercel serverless eller motsvarande.
- AI kan:
  - svara på frågor om dina kort (matchar innehåll/tags/spatial kontext),
  - markera kort den refererar till,
  - processa bilder via Gemini/OpenAI Vision (OCR + autometataggar).

## Kortkommandon (AI)

- `C` – toggla AI Chat.
- Kommandopalett innehåller "Open AI Chat" och "AI Settings".

## Bygg / produktion

```bash
npm run build
```

Distribuera `dist/` eller deploya Vercel med `api/chat.js` aktiverad.
