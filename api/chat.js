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

    // Get API keys from environment variables
    const claudeKey = process.env.CLAUDE_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    let response;

    if (provider === 'claude') {
      if (!claudeKey) {
        return res.status(500).json({ error: 'Claude API key not configured' });
      }
      response = await callClaude(claudeKey, message, context);
    } else if (provider === 'gemini') {
      if (!geminiKey) {
        return res.status(500).json({ error: 'Gemini API key not configured' });
      }
      response = await callGemini(geminiKey, message, context);
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
      model: 'claude-3-5-sonnet-20241022',
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
    throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
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
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    text: data.candidates[0].content.parts[0].text,
    provider: 'gemini',
  };
}
