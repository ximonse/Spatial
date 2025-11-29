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
            text: `Transkribera texten från bilden exakt som den är skriven och extrahera metadata.
                                                                                                 
OM BILDEN INTE HAR NÅGON TEXT: Beskriv kort vad bilden visar (1-2 meningar).                      
                                                                                                 
VIKTIGT: Svara ENDAST med en JSON-struktur enligt detta format:                                  
                                                                                                 
{                                                                                                
  "text": "[transkriberad text här, eller tom sträng om ingen text]",                            
  "description": "[kort bildbeskrivning om ingen text finns, annars null]",                       
  "metadata": {                                                                                  
    "extractedDate": "YYYY-MM-DD eller null",                                                    
    "extractedTime": "HH:MM eller null",                                                         
    "extractedDateTime": "YYYY-MM-DDTHH:MM eller null (kombinera datum+tid)",                    
    "extractedPeople": ["person1", "person2"] eller [],                                          
    "extractedPlaces": ["plats1", "plats2"] eller []                                             
  },                                                                                             
  "hashtags": ["tag1", "tag2", "tag3"]                                                           
}                                                                                                
                                                                                                 
HASHTAG-REGLER:                                                                                  
1. Datumtaggar: Om datum hittas, skapa #YYMMDD (ex: #250819 för 2025-08-19)                       
2. Veckotaggar: Om datum känt, skapa #YYvVV (ex: #25v44 för vecka 44, 2025)                       
3. Kategoritaggar: #möte #anteckning #todo #faktura #kontrakt #brev #kvitto #foto etc            
4. Namntaggar: Personer som nämns, normaliserade (ex: #smith #jones)                             
5. Platstaggar: Platser som nämns (ex: #stockholm #kontoret)                                     
                                                                                                 
METADATA-INSTRUKTIONER:                                                                          
- extractedDate: Extrahera datum från SYNLIG text i bilden (YYYY-MM-DD format)                   
- extractedTime: Extrahera tid från SYNLIG text (HH:MM format)                                   
- extractedDateTime: Om både datum OCH tid finns, kombinera till ISO-format (YYYY-MM-DDTHH:MM)   
- extractedPeople: Lista alla personnamn som nämns i texten                                       
- extractedPlaces: Lista alla platser/adresser som nämns                                          
                                                                                                 
BESKRIVNING-INSTRUKTIONER:                                                                       
- Om bilden INTE har någon läsbar text: Beskriv kort vad som visas (ex: "En solnedgång över havet", "En katt på en soffa")
- Om bilden HAR text: Sätt description till null                                                 
- Håll beskrivningen kort och koncis (max 2 meningar)                                            
                                                                                                 
OBS: Vi kommer senare även lägga till EXIF-metadata från filen (GPS, filskapare, originaldatum etc), så håll strukturen ren.`
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

  statusNotification.showTemporary('✨ Läser bild med Gemini...', 'info', 0); // Show persistent status

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

    const mainContent = parsedData.text || parsedData.description || '';

    const existingTags = cardData.data.tags || [];
    const newTags = (parsedData.hashtags || []).map(tag => tag.replace('#', ''));
    const mergedTags = [...new Set([...existingTags, ...newTags, 'gemini'])]; // Add #gemini tag

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

    statusNotification.showTemporary('✅ Bilden är analyserad!', 'success');
  } catch (error) {
    console.error('Error reading image with Gemini:', error);
    statusNotification.showTemporary(`❌ Fel vid Gemini-analys: ${error.message}`, 'error');
  } finally {
    // statusNotification.hide(); // Hide persistent status
  }
}
