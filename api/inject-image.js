import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const VALID_IDS = ['#hero', '#about', '#credits', '#work', '#services', '#contact'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 80,
    system: `You help place images on an audio engineer portfolio website. The site has these sections in order from top to bottom:
- #hero — the main hero/title section at the top
- #about — the bio and photo section
- #credits — the notable credits section
- #work — the audio samples/tracks section
- #services — the rates and services section
- #contact — the contact form/email section at the bottom

The user will describe where they want an image placed. Return ONLY valid JSON with no explanation or markdown:
{"insertAfter":"<section-id>"}

Use only one of these exact values: #hero, #about, #credits, #work, #services, #contact`,
    messages: [{ role: 'user', content: prompt }]
  });

  let raw = message.content[0].text.trim();
  raw = raw.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return res.status(500).json({ error: 'Could not parse placement from prompt. Try something like "after the about section".' });
  }

  if (!VALID_IDS.includes(parsed.insertAfter)) {
    return res.status(500).json({ error: 'Could not determine which section. Try something like "centered after the about section".' });
  }

  res.status(200).json({ insertAfter: parsed.insertAfter });
}
