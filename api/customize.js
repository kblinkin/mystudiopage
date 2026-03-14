import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const THEME_VARS = {
  'dark-gold':  { bg:'#0c0c0c', accent:'#c8a96e', text:'#f0ece4', muted:'#686460' },
  'dark-blue':  { bg:'#080c12', accent:'#5b9cf6', text:'#e8f0ff', muted:'#4a5a70' },
  'warm-cream': { bg:'#f5f0e8', accent:'#8b6f4e', text:'#2c2420', muted:'#9a8880' },
  'deep-green': { bg:'#080f0b', accent:'#4caf7d', text:'#e8f5ee', muted:'#3a5040' },
  'monochrome': { bg:'#0a0a0a', accent:'#f0ece4', text:'#f0ece4', muted:'#525252' },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, theme = 'dark-gold' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const colors = THEME_VARS[theme] || THEME_VARS['dark-gold'];

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 500,
    system: `You are a CSS expert helping users make visual tweaks to their audio engineer portfolio website.
The site uses CSS custom properties:
  --bg: ${colors.bg}
  --accent: ${colors.accent}
  --text: ${colors.text}
  --muted: ${colors.muted}

Key CSS classes on the site:
  .hero — the main hero section
  .hero-title — the large studio name heading
  .hero-tagline — the subtitle line below the studio name
  .hero-cta — the main call-to-action button
  .nav — the top navigation bar
  .about — the bio/photo section
  .services — the rates and services section
  .section-heading — all major section headings
  .credits — the credits section
  .work — the audio samples section
  .stats — the stats/numbers section
  .contact — the contact section

Return ONLY a valid CSS block — no explanation, no markdown fences, no comments. Just raw CSS rules that can be dropped into a <style> tag. Keep it minimal — only override what's needed for the requested change.`,
    messages: [
      {
        role: 'user',
        content: `Generate CSS to: ${prompt}`
      }
    ]
  });

  let css = message.content[0].text.trim();

  // Strip markdown fences if Claude adds them anyway
  css = css.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '').trim();

  if (!css || css.length < 5) {
    return res.status(500).json({ error: 'Could not generate a CSS tweak for that. Try rephrasing.' });
  }

  res.status(200).json({ css });
}
