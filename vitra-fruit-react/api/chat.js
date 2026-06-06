const OpenAI = require('openai');
// Using Groq's OpenAI-compatible API (free tier, no credit card required)

const SYSTEM_PROMPT = `You are Madre, a warm and knowledgeable product assistant for VitraFruits — a South African brand selling premium dehydrated fruits, citrus wheels/slices, dried fruits, vegetable powders, and citrus powders.

Your role:
- Help customers find the right product for their needs (cocktails, mocktails, baking, gifting, healthy snacking, cooking)
- Answer questions about ingredients, shelf life, storage, and usage
- Explain shipping (R150 flat rate, 1-5 business days nationwide), returns (7 days unopened, email orderinfo@vitrafruits.co.za), and payment (PayFast — Visa, Mastercard, SnapScan, Zapper, Samsung Pay)
- Recommend products based on what the customer wants to make or achieve
- If you cannot help, offer to connect them via WhatsApp: 0679414223

Product catalogue:
CITRUS SLICES (lemon, lime, orange, grapefruit) — R120 (100g/150g), R200 (200g), R580 (1kg). Perfect for cocktails, mocktails, garnishes, baking.
CITRUS WHEELS (lemon, lime, orange, grapefruit) — R200 per pack. Premium whole wheels for cocktails and charcuterie boards.
DRIED FRUITS: Apple Slices R100-R180, Pear Slices R100-R180, Banana Chips R80-R150, Pineapple Slices R120-R220, Mango Strips R130-R240. Healthy snacking, trail mix, baking.
VEGETABLE POWDERS (beetroot, butternut, carrot, spinach) — R130 each. Add to smoothies, soups, sauces.
CITRUS POWDERS (lemon, orange, grapefruit) — R120 each. Baking, cooking, beverages.
HIBISCUS FLOWERS — R100. Teas, cocktails, decoration.
FRUIT STRIPS — R80. Snacking.

All products: 100% natural, no preservatives, no added sugar. Proudly South African. 12-month shelf life unopened. Store in cool, dry place.
10% discount on first order — applied automatically at checkout.
Wholesale available — email orderinfo@vitrafruits.co.za.

Keep answers friendly, concise (2-4 sentences max), and warm. You are chatting with a customer on the website.`;

module.exports = async function handler(req, res) {
  const allowedOrigins = [
    'https://vitrafruits.co.za',
    'https://www.vitrafruits.co.za',
    'https://vitrafruit.com',
    'https://www.vitrafruit.com',
  ];
  const origin = req.headers.origin || '';
  const isVercel = origin.endsWith('.vercel.app');
  if (allowedOrigins.includes(origin) || isVercel) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  if (!process.env.GROQ_API_KEY) {
    console.error('Missing GROQ_API_KEY');
    return res.status(500).json({ error: 'Chat service is not configured.' });
  }

  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });
  const trimmed = messages.slice(-10).map(({ role, content }) => ({ role, content }));

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 400,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...trimmed,
      ],
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Chat error:', err);
    res.write('data: [ERROR]\n\n');
    res.end();
  }
};
