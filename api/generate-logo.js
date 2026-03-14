import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { studioName, engineerType, typeDesc, themeName, accent, bg, textColor, styleDirection } = req.body;

  if (!studioName) {
    return res.status(400).json({ error: 'studioName is required' });
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: `You are a senior brand identity designer with 20 years of experience creating logos for professional recording studios, mastering houses, and audio facilities. You produce iconic, mark-based SVG symbols that look like they cost $5,000 to commission — refined, bold, and graphic. Return ONLY valid SVG markup. No markdown fences, no explanation, no comments outside the SVG. Output must start with <svg and end with </svg>.`,
    messages: [
      {
        role: 'user',
        content: `Create a pure graphic logo mark SVG for this audio studio — NO TEXT, symbols and shapes only:

Studio name (for context/inspiration only, do NOT render it): "${studioName}"
Engineer type: ${typeDesc}
Color scheme: ${themeName}
Primary mark color: ${accent} | Secondary color: ${textColor}

Technical requirements:
- viewBox="0 0 400 400" width="400" height="400"
- NO background fill — transparent background (no background rect at all)
- NO text, NO letters, NO words of any kind
- ALL elements must be fully inside the viewBox — nothing clipped or cut off at the edges
- Leave at least 30px of padding on all sides so nothing touches the edge

Design direction — this is a PURE GRAPHIC MARK, no text:
- NO studio name, NO tagline, NO words of any kind — purely a symbol/icon/glyph
- Think: a monogram initial, a geometric badge, an abstract audio symbol, a crest, or a bold icon
- It will be displayed small (~100–120px) above large typographic text, so it must read clearly at that size
- Bold, graphic, high-contrast — avoid fine detail or thin lines
- Choose a symbol that fits the engineer type:
  * Mastering: diamond, square bracket frame, precision circle with crosshair, angular geometric crest, or a bold abstract M
  * Mixing: concentric arcs (like faders), stacked horizontal bars of varying length (EQ bars), or a bold waveform in a shape
  * Mix+Master: a split/bisected geometric form, a circle with a horizontal rule, or a bold monogram initial in a frame
  * Production: a triangle/play symbol, microphone silhouette, bold circle mark, or bold abstract initial
- Use ${accent} as the primary mark color; ${textColor} as a secondary or outline color if needed
- The mark must look complete and professional with NO text at all

${styleDirection ? `Style direction: ${styleDirection}\n` : ''}Keep paths simple. No clipPath. Output a complete, self-contained SVG.`
      }
    ]
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
