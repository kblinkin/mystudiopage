import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const VALID_IDS = ['#hero', '#about', '#credits', '#work', '#services', '#stats', '#contact'];

// Fuzzy-resolve whatever Claude returns to a valid section ID
function resolveSection(raw) {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();

  // Direct match with or without #
  const withHash = s.startsWith('#') ? s : `#${s}`;
  if (VALID_IDS.includes(withHash)) return withHash;

  // Keyword aliases — broad net for anything Claude might produce
  const aliases = [
    [['hero', 'title', 'header', 'top', 'intro', 'landing', 'first', 'banner'], '#hero'],
    [['about', 'bio', 'biography', 'story', 'photo', 'who i am', 'me'], '#about'],
    [['credit', 'clients', 'discography', 'artists', 'names', 'notable'], '#credits'],
    [['work', 'track', 'sample', 'music', 'audio', 'portfolio', 'listen', 'sound'], '#work'],
    [['service', 'rate', 'price', 'pricing', 'package', 'offer', 'cost'], '#services'],
    [['stat', 'number', 'achievement', 'fact', 'quick', 'band'], '#stats'],
    [['contact', 'bottom', 'last', 'form', 'email', 'get in touch', 'footer'], '#contact'],
  ];

  for (const [keywords, id] of aliases) {
    if (keywords.some(k => s.includes(k))) return id;
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, theme = 'dark-gold', hasImage = false } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  let message;
  try {
    message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: `You are building custom HTML sections for an audio engineer's portfolio website. Your two jobs are: (1) figure out WHERE to place the section, and (2) generate beautiful HTML that looks native to the site.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 1 — FIGURING OUT PLACEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The site has these sections in order:

  #hero     — big title/name at the top
  #about    — bio text and profile photo
  #credits  — notable artists/clients they've worked with
  #work     — embedded audio samples / tracks
  #services — pricing and service packages
  #stats    — key numbers (albums mastered, years, etc.)
  #contact  — contact form or email at the bottom

Users will describe placement in many ways — honor ALL of them:
  • Explicit positional words: "below stats", "after my bio", "above contact", "between services and contact", "at the bottom", "near the top", "second from last"
  • Section nicknames: "stats section", "your stats", "the numbers part", "pricing area", "audio section", "the credits thing"
  • Content-based inference (no placement mentioned): use these defaults:
      - Testimonials / quotes / reviews → after #services
      - Gear list / equipment / studio setup → after #about
      - Press / features / as-seen-in / logos → after #credits
      - Process / how I work / workflow → after #about
      - Photo gallery / images / behind the scenes → after #work
      - FAQ / frequently asked → before #contact (so use #stats or #services)
      - Philosophy / manifesto / artist statement → after #about
      - Achievements / awards / milestones → after #credits
      - Call to action / booking CTA → before #contact (use #services or #stats)
      - If truly ambiguous → default to #about

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 2 — BUILDING THE HTML
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Design language: dark, minimal, music-industry. Clean grid layouts. No gradients or shadows unless asked. Everything feels intentional.

CSS custom properties to use (never hardcode colors):
  --bg          main background
  --bg2         slightly lighter background
  --bg3         card / input surface
  --accent      gold accent (or theme color)
  --accent2     lighter accent
  --accent-dim  semi-transparent accent (good for icon backgrounds, hover states)
  --text        main text (light on dark)
  --muted       low-priority text
  --muted2      medium-priority text
  --border      accent-tinted border
  --border2     subtle structural border

Fonts (already loaded — use ONLY these):
  'Bebas Neue', sans-serif  — display headlines, all-caps
  'DM Sans', sans-serif     — body copy (font-weight: 300 preferred)
  'DM Mono', monospace      — labels, eyebrows, mono text, small caps

Standard section shell (always use this outer structure):
<section style="padding:100px 0; background:var(--bg);">
  <div style="max-width:1100px; margin:0 auto; padding:0 40px;">
    [content]
  </div>
</section>

Eyebrow label pattern (use above headings):
<div style="font-family:'DM Mono',monospace; font-size:10px; letter-spacing:0.25em; text-transform:uppercase; color:var(--accent); margin-bottom:16px; display:flex; align-items:center; gap:12px;">
  <span style="display:block; width:28px; height:1px; background:var(--accent); flex-shrink:0;"></span>
  EYEBROW TEXT
</div>

Main heading pattern:
<h2 style="font-family:'Bebas Neue',sans-serif; font-size:52px; letter-spacing:0.03em; line-height:1; color:var(--text); margin-bottom:48px;">HEADING</h2>

Card pattern:
<div style="background:var(--bg2); border:1px solid var(--border2); padding:28px;">

Accent-left-border highlight card:
<div style="border-left:3px solid var(--accent); background:var(--bg2); padding:24px 28px;">

Quote / testimonial card:
<blockquote style="background:var(--bg2); border:1px solid var(--border2); padding:28px; border-top:3px solid var(--accent); margin:0;">
  <p style="font-family:'DM Sans',sans-serif; font-weight:300; font-size:15px; color:var(--muted2); line-height:1.8; margin-bottom:16px;">"Quote text"</p>
  <cite style="font-family:'DM Mono',monospace; font-size:10px; letter-spacing:0.15em; text-transform:uppercase; color:var(--accent); font-style:normal;">— Name, Role</cite>
</blockquote>

Grid layouts (inline styles only):
  2-col: display:grid; grid-template-columns:repeat(2,1fr); gap:20px;
  3-col: display:grid; grid-template-columns:repeat(3,1fr); gap:20px;
  2-col with photo left: display:grid; grid-template-columns:400px 1fr; gap:48px; align-items:start;
  Auto-fill cards: display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:20px;

Image rules (if {{IMAGE_SRC}} is used):
  max-width:100%; display:block; object-fit:cover;
  For portrait/profile: width:100%; aspect-ratio:1/1; object-fit:cover;
  For landscape/wide: width:100%; aspect-ratio:16/9; object-fit:cover;

Mobile: add a <style> block inside the section for responsive rules if the layout is complex.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — follow exactly, nothing else
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
First line: the section ID (e.g. #about)
Second line: ---
Remaining lines: the complete HTML

Example:
#services
---
<section style="padding:100px 0; background:var(--bg);">...</section>`,
    messages: [
      {
        role: 'user',
        content: `Build this section: ${prompt}${hasImage ? '\n\nThe user has uploaded a photo to include — use {{IMAGE_SRC}} as the img src attribute.' : ''}`
      }
    ]
    });
  } catch (err) {
    return res.status(500).json({ error: 'AI service unavailable. Please try again in a moment.' });
  }

  const raw = message.content[0].text.trim();
  const delimIdx = raw.indexOf('---');

  if (delimIdx === -1) {
    return res.status(500).json({ error: 'Could not generate section. Try rephrasing your description.' });
  }

  const sectionRaw = raw.slice(0, delimIdx).trim();
  let html = raw.slice(delimIdx + 3).trim();

  // Try exact match first, then fuzzy resolve
  const insertAfter = resolveSection(sectionRaw);

  if (!insertAfter) {
    return res.status(500).json({ error: 'Could not determine section placement. Try including something like "after the about section".' });
  }

  if (!html || html.length < 20) {
    return res.status(500).json({ error: 'Generated section was empty. Try rephrasing.' });
  }

  res.status(200).json({ insertAfter, html });
}
