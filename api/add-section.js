import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const VALID_IDS = ['#hero', '#about', '#credits', '#work', '#services', '#contact'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, theme = 'dark-gold', hasImage = false } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2000,
    system: `You build custom HTML sections for an audio engineer portfolio website. The site has a dark, minimal, music-industry aesthetic.

CSS custom properties available (use with var()):
  --bg       main background (dark)
  --bg2      slightly lighter background
  --bg3      card/input background
  --accent   accent color (gold by default)
  --accent2  lighter accent
  --accent-dim  semi-transparent accent (for backgrounds)
  --text     main text color (light)
  --muted    muted text
  --muted2   slightly less muted text
  --border   accent-tinted border
  --border2  subtle border

Fonts already loaded on the page:
  'Bebas Neue', sans-serif   — headlines, display text, all-caps
  'DM Sans', sans-serif      — body text (use font-weight: 300)
  'DM Mono', monospace       — labels, eyebrows, small mono text

Section anatomy to follow:
  <section style="padding:100px 0; background:var(--bg);">
    <div style="max-width:1100px; margin:0 auto; padding:0 40px;">
      <!-- eyebrow label -->
      <div style="font-family:'DM Mono',monospace; font-size:10px; letter-spacing:0.25em; text-transform:uppercase; color:var(--accent); margin-bottom:16px; display:flex; align-items:center; gap:12px;">
        <span style="display:block; width:28px; height:1px; background:var(--accent); flex-shrink:0;"></span>
        EYEBROW LABEL
      </div>
      <!-- heading -->
      <h2 style="font-family:'Bebas Neue',sans-serif; font-size:52px; letter-spacing:0.03em; line-height:1; color:var(--text); margin-bottom:48px;">Section Heading</h2>
      <!-- content -->
    </div>
  </section>

If the user wants an image included, use {{IMAGE_SRC}} as the img src — it will be replaced with the real image.

Available section IDs to insert after: #hero, #about, #credits, #work, #services, #contact

Return your response in EXACTLY this format with nothing else — first line is the target section ID, then "---", then the complete HTML:

#about
---
<section style="...">...</section>`,
    messages: [
      {
        role: 'user',
        content: `Build this section: ${prompt}${hasImage ? '\n\nThe user is providing a photo — include it in the section using {{IMAGE_SRC}} as the image src.' : ''}`
      }
    ]
  });

  const raw = message.content[0].text.trim();
  const delimIdx = raw.indexOf('---');

  if (delimIdx === -1) {
    return res.status(500).json({ error: 'Could not generate section. Try rephrasing your description.' });
  }

  const insertAfter = raw.slice(0, delimIdx).trim();
  let html = raw.slice(delimIdx + 3).trim();

  if (!VALID_IDS.includes(insertAfter)) {
    return res.status(500).json({ error: 'Could not determine section placement. Try including something like "after the about section".' });
  }

  if (!html || html.length < 20) {
    return res.status(500).json({ error: 'Generated section was empty. Try rephrasing.' });
  }

  res.status(200).json({ insertAfter, html });
}
