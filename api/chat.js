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

  const candidateEndpoints = [
    { version: 'v1', models: ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-1.5-flash', 'gemini-1.0-pro'] },
    { version: 'v1beta', models: ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-1.5-flash', 'gemini-1.0-pro'] },
  ];

  let lastError = null;
  const tried = [];
  const attemptErrors = [];

  for (const { version, models } of candidateEndpoints) {
    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
      tried.push(`${version}/${model}`);

      let response;
      try {
        response = await fetch(url, {
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
      } catch (fetchError) {
        lastError = fetchError.message || String(fetchError);
        attemptErrors.push(`${version}/${model}: ${lastError}`);
        continue;
      }

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0];
        const textPart = candidate?.content?.parts?.find(part => part.text)?.text;

        if (textPart) {
          return { text: textPart, provider: 'gemini' };
        }

        const finishReason = candidate?.finishReason;
        const blockReason = data.promptFeedback?.blockReason;
        const safetyReasons = data.promptFeedback?.safetyRatings
          ?.map(rating => rating.category)
          ?.join(', ');

        const reasonParts = [blockReason, finishReason, safetyReasons && `säkerhet: ${safetyReasons}`]
          .filter(Boolean)
          .join(' | ');

        lastError = `svar saknar text (${reasonParts || 'okänt skäl'})`;
        attemptErrors.push(`${version}/${model}: ${lastError}`);
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      const error = contentType.includes('application/json')
        ? await response.json().catch(() => ({ error: { message: response.statusText } }))
        : { error: { message: await response.text().catch(() => response.statusText) } };

      lastError = error.error?.message || response.statusText;
      attemptErrors.push(`${version}/${model}: ${lastError} (status: ${response.status})`);

      const errorMessage = lastError.toLowerCase();
      const isMissingModel =
        response.status === 404 ||
        errorMessage.includes('not found') ||
        errorMessage.includes('not supported for generatecontent');

      if (!isMissingModel) {
        throw new Error(`Gemini API error (${version}/${model}): ${lastError}`);
      }
    }
  }

  throw new Error(
    `Gemini API error: ${lastError || 'Okänd modell'} (försökte modeller: ${tried.join(', ')})${
      attemptErrors.length ? ` | fel: ${attemptErrors.join(' | ')}` : ''
    }`
  );
}
