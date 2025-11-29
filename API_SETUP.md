# AI API Setup Guide

## Vercel Deployment

### 1. Lägg till Environment Variables i Vercel

Gå till din Vercel projekt → Settings → Environment Variables och lägg till:

```
CLAUDE_API_KEY=sk-ant-xxxxx
GEMINI_API_KEY=xxxxx
```

**Hämta API-nycklar:**
- Claude: https://console.anthropic.com/settings/keys
- Gemini: https://makersuite.google.com/app/apikey

### 2. Redeploya

Vercel deployar automatiskt när du pushar till GitHub. Om inte:
```bash
vercel --prod
```

## Lokal Development (Valfritt)

Om du vill testa AI-funktioner lokalt:

### 1. Skapa `.env.local`

```bash
cp .env.example .env.local
```

### 2. Lägg in dina API-nycklar

Redigera `.env.local`:
```
CLAUDE_API_KEY=din_riktiga_nyckel_här
GEMINI_API_KEY=din_riktiga_nyckel_här
```

### 3. Kör med Vercel CLI

```bash
npm install -g vercel
vercel dev --port 3004
```

Detta startar en lokal serverless environment som fungerar precis som Vercel.

## Säkerhet

✅ **GÖR:**
- Lägg API-nycklar i Vercel Environment Variables
- Använd `.env.local` för lokal development (git-ignorerad)

❌ **GÖR INTE:**
- Committa API-nycklar till Git
- Dela API-nycklar med andra
- Använda samma nycklar för test och production

## Felsökning

**"Claude API key not configured"**
- Kolla att `CLAUDE_API_KEY` finns i Vercel Environment Variables
- Redeploya efter att ha lagt till nycklar

**"Gemini API error"**
- Kolla att `GEMINI_API_KEY` finns i Vercel Environment Variables
- Verifiera att nyckeln fungerar på https://makersuite.google.com
