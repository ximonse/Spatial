/**
 * OpenAI Vision API Integration for Image Card Processing
 */

import { db } from '../core/db.js';
import { cardFactory } from '../cards/CardFactory.js';
import { settingsPanel } from '../ui/SettingsPanel.js';
import { statusNotification } from '../ui/statusNotification.js';

/**
 * Calls the OpenAI Vision API with the provided image data and a complex prompt.
 * @param {string} apiKey - The OpenAI API key.
 * @param {string} imageData - The base64 encoded image data (e.g., data:image/jpeg;base64,...).
 * @returns {Promise<Object>} The JSON response from the API.
 */
async function callOpenAIVisionAPI(apiKey, imageData) {
  const url = 'https://api.openai.com/v1/chat/completions';

  // The prompt for OpenAI Vision. It's crucial to match the output format requested for Gemini.
  const prompt = `Transcribe the text from the image exactly as written and extract metadata.

IF THE IMAGE HAS NO TEXT: Briefly describe what the image shows (1-2 sentences).

IMPORTANT: Respond ONLY with a JSON structure according to this format:

{
  "text": "[transcribed text here, or empty string if no text]",
  "description": "[brief image description if no text, otherwise null]",
  "metadata": {
    "extractedDate": "YYYY-MM-DD or null",
    "extractedTime": "HH:MM or null",
    "extractedDateTime": "YYYY-MM-DDTHH:MM or null (combine date+time)",
    "extractedPeople": ["person1", "person2"] or [],
    "extractedPlaces": ["place1", "place2"] or []
  },
  "hashtags": ["tag1", "tag2", "tag3"]
}

HASHTAG RULES:
1. Date tags: If date found, create #YYMMDD (ex: #250819 for 2025-08-19)
2. Week tags: If date known, create #YYwWW (ex: #25w44 for week 44, 2025)
3. Category tags: #meeting #note #todo #invoice #contract #letter #receipt #photo etc
4. Name tags: Mentioned persons, normalized (ex: #smith #jones)
5. Place tags: Mentioned places (ex: #stockholm #office)

METADATA INSTRUCTIONS:
- extractedDate: Extract date from VISIBLE text in the image (YYYY-MM-DD format)
- extractedTime: Extract time from VISIBLE text (HH:MM format)
- extractedDateTime: If both date AND time exist, combine into ISO-format (YYYY-MM-DDTHH:MM)
- extractedPeople: List all person names mentioned in the text
- extractedPlaces: List all places/addresses mentioned

DESCRIPTION INSTRUCTIONS:
- If the image HAS NO readable text: Briefly describe what is shown (e.g., "A sunset over the sea", "A cat on a sofa")
- If the image HAS text: Set description to null
- Keep the description short and concise (max 2 sentences)

NOTE: We will later also add EXIF metadata from the file (GPS, file creator, original date etc), so keep the structure clean.`

  const payload = {
    model: "gpt-4o", // Or gpt-4-turbo
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: imageData, // OpenAI expects the full data URI here
            },
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 2000,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Main function to read an image card with OpenAI Vision, process the result, and update the card.
 * @param {string} cardId - The ID of the card to process.
 */
export async function readImageWithOpenAI(cardId) {
  const apiKey = settingsPanel.getApiKey('openai');
  if (!apiKey) {
    statusNotification.showTemporary('OpenAI Vision OCR cancelled: No API key provided.', 'error');
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

  statusNotification.showTemporary('✨ Läser bild med OpenAI Vision...', 'info', 0);

  try {
    const response = await callOpenAIVisionAPI(apiKey, imageRecord.data);

    if (!response || !response.choices || !response.choices[0] || !response.choices[0].message || !response.choices[0].message.content) {
      throw new Error('Invalid response structure from OpenAI API.');
    }

    const messageContent = response.choices[0].message.content;
    const rawText = Array.isArray(messageContent)
      ? messageContent
        .map(part => {
          if (typeof part === 'string') return part;
          if (part?.type === 'text') return part.text || '';
          if (typeof part?.text === 'string') return part.text;
          return '';
        })
        .filter(Boolean)
        .join('\n')
      : String(messageContent || '');

    let parsedData;
    try {
      // OpenAI might return markdown code block
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : rawText;
      parsedData = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.warn('Failed to parse JSON from OpenAI, falling back to raw text:', parseError);
      parsedData = { text: rawText, hashtags: [] };
    }

    const mainContent = parsedData.text || parsedData.description || '';

    const existingTags = cardData.data.tags || [];
    const newTags = (parsedData.hashtags || []).map(tag => tag.replace('#', ''));
    const mergedTags = [...new Set([...existingTags, ...newTags, 'openai'])]; // Add #openai tag

    const updates = {
      content: mainContent, // Put extracted text in main content field
      tags: mergedTags,
      openaiMetadata: parsedData.metadata || {} // Store metadata
    };

    // Update in DB
    await db.updateCard(cardData.data.id, updates);
    // Update in in-memory state and trigger redraw
    cardFactory.updateCard(cardData.data.id, updates);

    statusNotification.showTemporary('✅ Bilden är analyserad med OpenAI Vision!', 'success');
  } catch (error) {
    console.error('Error reading image with OpenAI Vision:', error);
    statusNotification.showTemporary(`❌ Fel vid OpenAI Vision-analys: ${error.message}`, 'error');
  }
}
