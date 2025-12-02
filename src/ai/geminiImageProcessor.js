/**
 * Gemini AI Integration for Image Card Processing
 * Adapts functions from inspiration_only/lib/gemini.js for the current project structure.
 */

import { state } from '../core/state.js';
import { db } from '../core/db.js';
import { cardFactory } from '../cards/CardFactory.js';
import { stageManager } from '../core/stage.js';
import { settingsPanel } from '../ui/SettingsPanel.js';
import { statusNotification } from '../ui/statusNotification.js';
import { readImageWithOpenAI } from './openaiImageProcessor.js';

// OCR prompt for Gemini: transcribe text and add scene description when applicable
const geminiOcrPrompt = `Transcribe the text from the image exactly as written and extract metadata.

If the image contains more than just a handwritten note (e.g., a photo or scene), ALSO provide a short visual description (1-2 sentences). If it's only a handwritten note, the description can be null.

Respond ONLY with this JSON:
{
  "text": "[transcribed text or empty]",
  "description": "[short scene/motif description, or null if only handwritten note]",
  "metadata": {
    "extractedDate": "YYYY-MM-DD or null",
    "extractedTime": "HH:MM or null",
    "extractedDateTime": "YYYY-MM-DDTHH:MM or null",
    "extractedPeople": ["person1", "person2"] or [],
    "extractedPlaces": ["place1", "place2"] or []
  },
  "hashtags": ["tag1", "tag2", "tag3"]
}

Hashtag rules:
1) Date tags #YYMMDD if date found.
2) Week tags #YYvVV if date known.
3) Category tags e.g. #mote #anteckning #todo #faktura #kontrakt #brev #kvitto #foto.
4) Name tags for mentioned people.
5) Place tags for mentioned locations.
6) Total hashtags: aim for 3-7 relevant tags. Do NOT include provider names (e.g. gemini). Ensure tags are lowercase and meaningful.

Description rules: Include a short description when there is a scene/motif. Use null if only a handwritten note.

Metadata rules: same as before.`;

/**
 * Calls the Gemini API with the provided image data and a complex prompt.
 * @param {string} apiKey - The Google AI API key.
 * @param {string} imageData - The base64 encoded image data.
 * @returns {Promise<Object>} The JSON response from the API.
 */
async function callGeminiAPI(apiKey, imageData) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: geminiOcrPrompt
          },
          {
            inline_data: {
              mime_type: "image/jpeg", // Assuming JPEG, adjust if needed
              data: imageData.split(',')[1]
            }
          }
        ]
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error.message || `API request failed with status ${response.status}`);
  }

  return response.json();
}

function isQuotaExceeded(message) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes('quota') || normalized.includes('rate limit');
}

/**
 * Main function to read an image card with Gemini, process the result, and update the card.
 * @param {string} cardId - The ID of the card to process.
 */
export async function readImageWithGemini(cardId) {
  const apiKey = settingsPanel.getApiKey('gemini'); // Adapt API key retrieval
  if (!apiKey) {
    statusNotification.showTemporary('Gemini OCR cancelled: No API key provided.', 'error');
    return;
  }

  const cardData = cardFactory.getCard(cardId);

  if (!cardData || !cardData.data.id) {
    statusNotification.showTemporary('Kortet hittades inte.', 'error');
    return;
  }

  const imageRecord = await db.getImage(cardData.data.id);

  if (!imageRecord || !imageRecord.data) {
    statusNotification.showTemporary('Ingen bilddata hittades för detta kort.', 'error');
    return;
  }

  statusNotification.showTemporary('✨ Läser bild med Gemini...', 2500);

  try {
    const response = await callGeminiAPI(apiKey, imageRecord.data);

    if (!response || !response.candidates || !response.candidates[0].content || !response.candidates[0].content.parts) {
      throw new Error('Invalid response structure from Gemini API.');
    }

    const rawText = response.candidates[0].content.parts[0].text;

    let parsedData;
    try {
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : rawText;
      parsedData = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.warn('Failed to parse JSON, falling back to raw text:', parseError);
      parsedData = { text: rawText, hashtags: [] };
    }

    const parts = [];
    if (parsedData.text) parts.push(parsedData.text);
    if (parsedData.description) parts.push(`Beskrivning: ${parsedData.description}`);
    const mainContent = parts.join('\n\n');

    const existingTags = cardData.data.tags || [];
    const rawTags = parsedData.hashtags || [];
    const cleanedTags = rawTags
      .map(tag => String(tag || '').replace(/^#/, '').trim().toLowerCase())
      .filter(tag => tag && tag !== 'gemini');
    const limitedTags = cleanedTags.slice(0, 7); // cap at 7
    const mergedTags = [];
    const seen = new Set();
    for (const t of [...existingTags, ...limitedTags]) {
      const key = String(t).toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        mergedTags.push(t);
      }
    }

    const updates = {
      content: mainContent, // Put extracted text in main content field
      tags: mergedTags,
      geminiMetadata: parsedData.metadata || {} // Store metadata
    };

    // Update in DB
    await db.updateCard(cardData.data.id, updates);
    // Update in in-memory state and trigger redraw
    cardFactory.updateCard(cardData.data.id, updates);

    // No longer need to manually reload canvas, stageManager.getLayer().batchDraw() is handled by cardFactory.updateCard
    // stageManager.getLayer().batchDraw();

    statusNotification.showTemporary('✅ Bilden är analyserad!', 2000);
  } catch (error) {
    console.error('Error reading image with Gemini:', error);
    const message = error?.message || 'Okänt fel';
    if (isQuotaExceeded(message)) {
      const hasOpenAIKey = Boolean(settingsPanel.getApiKey('openai'));
      if (hasOpenAIKey) {
        statusNotification.showTemporary('Gemini-kvot nådd. Byter till OpenAI Vision...', 3500);
        await readImageWithOpenAI(cardId);
        return;
      }
      statusNotification.showTemporary('Gemini-kvoten är slut. Lägg till en OpenAI-nyckel eller byt provider i inställningarna.', 4000);
      return;
    }

    statusNotification.showTemporary(`❌ Fel vid Gemini-analys: ${message}`, 4000);
  } finally {
    // statusNotification.hide(); // Hide persistent status
  }
}

