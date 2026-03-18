// Vercel serverless function to proxy OpenAI API calls
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key not configured in Vercel environment variables');
    return res.status(500).json({ 
      error: 'OpenAI API key not configured on server',
      details: 'Please add VITE_OPENAI_API_KEY to Vercel environment variables'
    });
  }

  try {
    console.log('Proxying request to OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, data);
      return res.status(response.status).json(data);
    }

    console.log('OpenAI request successful');
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Failed to connect to OpenAI',
      details: error.message 
    });
  }
}
