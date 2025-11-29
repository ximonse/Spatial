/**
 * Vercel Serverless Function - Anthropic API Proxy
 * Handles CORS and proxies requests to Anthropic API
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key and request body (handle case-insensitive headers)
  const apiKey = req.headers['x-api-key'] || req.headers['X-API-Key'] || req.headers['X-Api-Key'];

  console.log('📨 Request received:', {
    method: req.method,
    hasApiKey: !!apiKey,
    keyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
    headers: Object.keys(req.headers)
  });

  if (!apiKey) {
    console.error('❌ No API key provided');
    return res.status(401).json({ error: 'Missing API key' });
  }

  if (!apiKey.startsWith('sk-ant-')) {
    console.error('❌ Invalid API key format');
    return res.status(401).json({ error: 'Invalid API key format. Key should start with "sk-ant-"' });
  }

  try {
    // Pass through the model as-is, no modification needed
    const requestBody = req.body;

    console.log('📤 Forwarding to Anthropic API:', {
      model: requestBody.model,
      maxTokens: requestBody.max_tokens
    });

    // Forward request to Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    // Get response data
    const data = await response.json();

    // If there's an error from Anthropic, provide more context
    if (!response.ok) {
      console.error('Anthropic API error:', response.status, data);
    }

    // Forward status code and response
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Anthropic API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
