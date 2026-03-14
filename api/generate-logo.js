import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { studioName, engineerType, typeDesc, themeName, accent, bg, textColor, styleDirection, logoMode } = req.body;

  if (!studioName) {
    return res.status(400).json({ error: 'studioName is required' });
  }

  const isWordmark = logoMode === 'wordmark';

  // Style direction preamble — only for graphic marks
  const styleBlock = (!isWordmark && styleDirection)
    ? `CRITICAL STYLE REQUIREMENT — you MUST follow this: ${styleDirection.toUpperCase()}. This is the primary design constraint. Every shape, path, and form must reflect this style. Do not default to a generic shape — commit fully to this style direction.\n\n`
    : '';

  const systemPrompt = isWordmark
    ? `You are a senior typographic brand designer specializing in wordmarks for recording studios and audio facilities. You create SVG wordmarks — the studio name rendered as designed, styled lettering. Return ONLY valid SVG markup. No markdown fences, no explanation. Output must start with <svg and end with </svg>.`
    : `You are a senior brand identity designer with 20 years of experience creating logo marks for professional recording studios and audio facilities. You produce iconic, bold, graphic SVG symbols. Return ONLY valid SVG markup. No markdown fences, no explanation. Output must start with <svg and end with </svg>.`;

  const userPrompt = isWordmark
    ? `Create a wordmark SVG for this audio studio — the studio name as styled lettering:

Studio name to render as text: "${studioName}"
Color: ${accent} on transparent background
Style feel: ${themeName} — ${styleDirection || 'professional, bold'}

Technical requirements:
- viewBox="0 0 600 200" width="600" height="200"
- Transparent background — no background rect
- Render the studio name as large, designed text
- Use font-family options: serif, sans-serif, or monospace — pick what suits the name and feel
- Center the text in the viewBox
- Use ${accent} as the text fill color
- Add letter-spacing and font-weight that feels intentional, not default
- You may add a subtle geometric accent element (underline, bracket, dot) but the text must dominate
- Keep it clean and professional

Output a complete, self-contained SVG with the text rendered via <text> elements.`
    : `${styleBlock}Create a pure graphic logo mark SVG for this audio studio — NO TEXT, symbols and shapes only:

Studio name (for inspiration only, do NOT render it): "${studioName}"
Engineer type: ${typeDesc}
Color scheme: ${themeName}
Primary color: ${accent} | Secondary color: ${textColor}

Technical requirements:
- viewBox="0 0 400 400" width="400" height="400"
- Transparent background — no background rect
- NO text, NO letters, NO words of any kind — if any text appears the output is rejected
- ALL elements fully inside the viewBox, at least 30px padding on all sides

Design:
- A single strong symbol: geometric badge, abstract audio icon, monogram initial in a shape, or crest
- Displayed at ~100–120px, so it must read clearly at small sizes
- Bold, high-contrast — no thin lines or fine detail
- Engineer type guidance:
  * Mastering: diamond, square brackets, precision circle, angular crest
  * Mixing: concentric arcs, stacked EQ bars, waveform shape
  * Mix+Master: bisected geometric form, circle with rule, bold monogram in frame
  * Production: triangle/play symbol, microphone silhouette, bold circle
- Primary fill: ${accent}; secondary/outline: ${textColor} if needed

Keep paths simple. No clipPath. Output a complete, self-contained SVG.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  });

  let svg = message.content[0].text.trim();

  // Strip any accidental markdown fences
  svg = svg.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '').trim();

  // Basic validation
  if (!svg.startsWith('<svg') || !svg.includes('</svg>')) {
    return res.status(500).json({ error: 'Generated output was not valid SVG. Try again.' });
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ svg });
}
