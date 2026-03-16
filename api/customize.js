import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const THEME_VARS = {
  'dark-gold':  { bg:'#0c0c0c', accent:'#c8a96e', text:'#f0ece4', muted:'#686460' },
  'dark-blue':  { bg:'#080c12', accent:'#5b9cf6', text:'#e8f0ff', muted:'#4a5a70' },
  'warm-cream': { bg:'#f5f0e8', accent:'#8b6f4e', text:'#2c2420', muted:'#9a8880' },
  'deep-green': { bg:'#080f0b', accent:'#4caf7d', text:'#e8f5ee', muted:'#3a5040' },
  'monochrome': { bg:'#0a0a0a', accent:'#f0ece4', text:'#f0ece4', muted:'#525252' },
};

const VALID_IDS = ['#hero', '#about', '#credits', '#work', '#services', '#stats', '#contact'];

function resolveSection(raw) {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();
  const withHash = s.startsWith('#') ? s : `#${s}`;
  if (VALID_IDS.includes(withHash)) return withHash;

  const aliases = [
    [['hero', 'title', 'header', 'top', 'intro', 'landing', 'banner'], '#hero'],
    [['about', 'bio', 'biography', 'story', 'photo', 'who'], '#about'],
    [['credit', 'clients', 'artists', 'notable', 'discography'], '#credits'],
    [['work', 'track', 'sample', 'audio', 'portfolio', 'listen'], '#work'],
    [['service', 'rate', 'price', 'pricing', 'package', 'offer'], '#services'],
    [['stat', 'number', 'achievement', 'fact', 'quick'], '#stats'],
    [['contact', 'bottom', 'form', 'email', 'footer', 'get in touch'], '#contact'],
  ];

  for (const [keywords, id] of aliases) {
    if (keywords.some(k => s.includes(k))) return id;
  }
  return '#about';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, theme = 'dark-gold', hasImage = false } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const colors = THEME_VARS[theme] || THEME_VARS['dark-gold'];

  let message;
  try {
    message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: `You are an AI that customizes audio engineer portfolio websites. You handle two types of changes and can combine them:

1. CSS TWEAKS — visual/style changes: spacing, font sizes, colors, button shapes, section height, padding, animations, layout adjustments to existing elements.
2. HTML SECTIONS — content changes: new sections, adding text/paragraphs, line breaks between sentences, testimonials, gear lists, galleries, FAQ, press features, anything that adds or modifies content.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DECISION GUIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ CSS only: "make hero taller", "bigger font", "rounded button", "more space between sections", "change accent color", "make nav sticky"
→ HTML only: "add a testimonials section", "add paragraph break after [sentence]", "add a gear list", "add press logos", "add FAQ", "add a photo gallery"
→ Both: "add a dark testimonials section with a gold top border" (HTML for structure, CSS for fine-tuning)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CSS REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Theme: --bg:${colors.bg} --accent:${colors.accent} --text:${colors.text} --muted:${colors.muted}
Available CSS vars: --bg, --bg2, --bg3, --accent, --accent2, --accent-dim, --text, --text2, --muted, --muted2, --border, --border2, --red, --green

Key selectors:
  .hero           main hero section
  .hero-title     large studio name
  .hero-tagline   subtitle under name
  .hero-cta       call-to-action button
  .nav            top navigation bar
  .about          bio/photo section
  .services       rates and services
  .section-heading all major section headings
  .credits        credits section
  .work           audio samples section
  .stats          stats/numbers section
  .contact        contact section

Return raw CSS only — no fences, no comments, no explanations.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HTML REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Site sections (in order): #hero → #about → #credits → #work → #services → #stats → #contact

Design: dark, minimal, music-industry. Inline styles only. No external dependencies.
Fonts (loaded): 'Bebas Neue' (headlines), 'DM Sans' weight 300 (body), 'DM Mono' (labels)

Standard section shell:
<section style="padding:100px 0; background:var(--bg);">
  <div style="max-width:1100px; margin:0 auto; padding:0 40px;">[content]</div>
</section>

Eyebrow label pattern:
<div style="font-family:'DM Mono',monospace; font-size:10px; letter-spacing:0.25em; text-transform:uppercase; color:var(--accent); margin-bottom:16px; display:flex; align-items:center; gap:12px;"><span style="display:block; width:28px; height:1px; background:var(--accent); flex-shrink:0;"></span>LABEL</div>

Heading: <h2 style="font-family:'Bebas Neue',sans-serif; font-size:52px; letter-spacing:0.03em; line-height:1; color:var(--text); margin-bottom:48px;">HEADING</h2>
Card: <div style="background:var(--bg2); border:1px solid var(--border2); padding:28px;">
Quote: <blockquote style="background:var(--bg2); border:1px solid var(--border2); padding:28px; border-top:3px solid var(--accent); margin:0;"><p style="font-family:'DM Sans',sans-serif; font-weight:300; font-size:15px; color:var(--muted2); line-height:1.8; margin-bottom:16px;">"Quote"</p><cite style="font-family:'DM Mono',monospace; font-size:10px; letter-spacing:0.15em; text-transform:uppercase; color:var(--accent); font-style:normal;">— Name</cite></blockquote>
Grids: 2-col: grid-template-columns:repeat(2,1fr); 3-col: repeat(3,1fr); auto-fill: repeat(auto-fill,minmax(280px,1fr))
Image (if user uploaded): use {{IMAGE_SRC}} as src. max-width:100%; display:block; object-fit:cover;

Content edits (paragraph breaks etc.): wrap the modified section in a <div data-replace="section-id"> to signal a content replacement — but for simple paragraph additions, a standalone <p> or <br> inside a <div data-insert-near="text-fragment"> is fine.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT — return valid JSON only, no markdown fences
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "css": "raw CSS string, or null",
  "html": "complete HTML block string, or null",
  "insertAfter": "#section-id or null (only needed when html is non-null)"
}

At least one of css or html must be non-null.`,
      messages: [
        {
          role: 'user',
          content: `Apply this customization: ${prompt}${hasImage ? '\n\nThe user uploaded a photo — use {{IMAGE_SRC}} as the img src.' : ''}`
        }
      ]
    });
  } catch (err) {
    return res.status(500).json({ error: 'AI service unavailable. Please try again in a moment.' });
  }

  let raw = message.content[0].text.trim();
  // Strip markdown fences if Claude adds them anyway
  raw = raw.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return res.status(500).json({ error: 'Could not parse AI response. Try rephrasing.' });
  }

  const css = parsed.css && String(parsed.css).trim().length > 4 ? String(parsed.css).trim() : null;
  const html = parsed.html && String(parsed.html).trim().length > 10 ? String(parsed.html).trim() : null;

  if (!css && !html) {
    return res.status(500).json({ error: 'No changes could be generated. Try rephrasing.' });
  }

  const insertAfter = html ? (resolveSection(parsed.insertAfter) || '#about') : null;

  res.status(200).json({ css, html, insertAfter });
}
