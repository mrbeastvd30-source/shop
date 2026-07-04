const MAX_DESCRIPTION_LENGTH = 3000;
const { verifyAdminRequest } = require('./_auth');

function send(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify(payload));
}

function extractOutputText(response) {
  if (typeof response.output_text === 'string') return response.output_text.trim();
  return (response.output || [])
    .flatMap((item) => item.content || [])
    .map((part) => part.text || '')
    .join('')
    .trim();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  if (!(await verifyAdminRequest(req))) {
    return send(res, 401, { error: 'Unauthorized' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return send(res, 503, { error: 'OPENAI_API_KEY is not configured' });
  }

  const text = String(req.body?.text || '').trim();
  const sourceLanguage = req.body?.sourceLanguage === 'ru' ? 'Russian' : 'Uzbek';
  const targetLanguage = req.body?.targetLanguage === 'ru' ? 'Russian' : 'Uzbek';

  if (!text || text.length > MAX_DESCRIPTION_LENGTH || sourceLanguage === targetLanguage) {
    return send(res, 400, { error: 'Invalid translation request' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TRANSLATION_MODEL || 'gpt-5.4-mini',
        instructions: `Translate fashion product descriptions from ${sourceLanguage} to ${targetLanguage}. Preserve meaning, sizes, materials, brand names and tone. Return only the translated text without quotes or commentary.`,
        input: text,
        max_output_tokens: 1200
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('OpenAI translation failed:', response.status, data?.error?.message || 'Unknown error');
      return send(res, 502, { error: 'Translation service unavailable' });
    }

    const translation = extractOutputText(data);
    if (!translation) return send(res, 502, { error: 'Empty translation response' });
    return send(res, 200, { translation });
  } catch (error) {
    console.error('Translation request failed:', error);
    return send(res, 502, { error: 'Translation service unavailable' });
  }
};
