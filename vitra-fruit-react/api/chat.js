const OpenAI = require('openai');
const { applyCors, describeCatalogue, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } = require('./_lib/shop');
const { createRateLimiter } = require('./_lib/rate-limit');
// Using Groq's OpenAI-compatible API (free tier, no credit card required)

const MAX_HISTORY = 12;
const MAX_MESSAGE_CHARS = 1000;
const MAX_INCOMING_MESSAGES = 50;
const ALLOWED_ROLES = new Set(['user', 'assistant']);

// Best-effort per serverless instance: counts are in memory and not shared across instances.
const isRateLimited = createRateLimiter({ limit: 20, windowMs: 10 * 60 * 1000 });

const SYSTEM_PROMPT = `You are Madre, a warm and knowledgeable product assistant for VitraFruits — a South African brand selling premium dehydrated fruits, citrus wheels/slices, dried fruits, vegetable powders, and citrus powders.

Your role:
- Help customers find the right product for their needs (cocktails, mocktails, baking, gifting, healthy snacking, cooking)
- Answer questions about ingredients, shelf life, storage, and usage
- Explain shipping (R${SHIPPING_COST} flat rate, free delivery on orders of R${FREE_SHIPPING_THRESHOLD} or more, 1-5 business days nationwide), returns (7 days unopened, email orderinfo@vitrafruits.co.za), and payment (PayFast — Visa, Mastercard, SnapScan, Zapper, Samsung Pay)
- Recommend products based on what the customer wants to make or achieve
- If you cannot help, offer to connect them via WhatsApp: 0679414223

What each range is good for:
CITRUS SLICES (lemon, lime, orange, grapefruit) — perfect for cocktails, mocktails, garnishes, baking.
CITRUS WHEELS (lemon, lime, orange, grapefruit) — premium whole wheels for cocktails and charcuterie boards.
DRIED FRUITS (apple, pear, banana chips, pineapple, mango) — healthy snacking, trail mix, baking.
VEGETABLE POWDERS (beetroot, butternut, carrot, spinach) — add to smoothies, soups, sauces.
CITRUS POWDERS (lemon, orange, grapefruit) — baking, cooking, beverages.
HIBISCUS FLOWERS — teas, cocktails, decoration.
FRUIT STRIPS — snacking.

Current prices (only quote these):
${describeCatalogue()}

All products: 100% natural, no preservatives, no added sugar. Proudly South African. 12-month shelf life unopened. Store in cool, dry place.
Shipping is a R${SHIPPING_COST} flat rate, with free delivery on orders of R${FREE_SHIPPING_THRESHOLD} or more.
Wholesale available — email orderinfo@vitrafruits.co.za.

Keep answers friendly, concise (2-4 sentences max), and warm. You are chatting with a customer on the website.`;

function cleanMessages(messages) {
  return messages
    .filter((m) => m && ALLOWED_ROLES.has(m.role))
    .map((m) => ({ role: m.role, content: m.content == null ? '' : String(m.content) }))
    .filter((m) => m.content.trim())
    .slice(-MAX_HISTORY);
}

module.exports = async function handler(req, res) {
  applyCors(req, res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (isRateLimited(req)) {
    return res.status(429).json({ error: "You're sending messages a little fast. Please wait a few minutes and try again." });
  }

  const { messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_INCOMING_MESSAGES) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const trimmed = cleanMessages(messages);
  if (!trimmed.length) {
    return res.status(400).json({ error: 'messages array is required' });
  }
  if (trimmed.some((m) => m.content.length > MAX_MESSAGE_CHARS)) {
    return res.status(400).json({ error: `Messages must be ${MAX_MESSAGE_CHARS} characters or fewer.` });
  }

  if (!process.env.GROQ_API_KEY) {
    console.error('Missing GROQ_API_KEY');
    return res.status(500).json({ error: 'Chat service is not configured.' });
  }

  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });

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
