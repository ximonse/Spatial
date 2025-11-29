/**
 * Vercel Serverless Function - AI Chat Proxy
 * Proxies requests to Claude and Gemini APIs
 * Keeps API keys secure on server-side
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { provider, message, context } = req.body;

    // Validate request
    if (!provider || !message) {
      return res.status(400).json({ error: 'Missing provider or message' });
    }

    // Get API key from header (sent from client's localStorage)
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ error: 'Missing API key' });
    }

    let response;

    if (provider === 'claude') {
      response = await callClaude(apiKey, message, context);
    } else if (provider === 'gemini') {
      response = await callGemini(apiKey, message, context);
    } else {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
}

/**
 * Call Claude API
 */
async function callClaude(apiKey, message, context) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      system: context.systemPrompt,
      messages: [
        {
          role: 'user',
          content: `${context.cardContext}\n\n---\n\nFråga: ${message}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Claude API error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return {
    text: data.content[0].text,
    provider: 'claude',
  };
}

/**
 * Call Gemini API
 */
async function callGemini(apiKey, message, context) {
  const prompt = `${context.systemPrompt}\n\n${context.cardContext}\n\n---\n\nFråga: ${message}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt,
        }],
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    const errorMessage = error.error?.message || response.statusText;
    throw new Error(`Gemini API error (model: gemini-2.5-flash): ${errorMessage}`);
  }

  const data = await response.json();
  return {
    text: data.candidates[0].content.parts[0].text,
    provider: 'gemini',
  };
}
