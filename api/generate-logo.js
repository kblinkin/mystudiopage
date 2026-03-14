import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { studioName, engineerType, typeDesc, themeName, accent, bg, textColor, tagline } = req.body;

  if (!studioName) {
    return res.status(400).json({ error: 'studioName is required' });
  }

  const taglineNote = tagline
    ? `Tagline (optional small text): "${tagline}"`
    : 'No tagline.';

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: `You are a senior brand identity designer with 20 years of experience creating logos for professional recording studios, mastering houses, and audio facilities. You produce compact, mark-based SVG logos that look like they cost $5,000 to commission — refined, iconic, and typographically precise. Return ONLY valid SVG markup. No markdown fences, no explanation, no comments outside the SVG. Output must start with <svg and end with </svg>.`,
    messages: [
      {
        role: 'user',
        content: `Create a traditional, compact logo mark SVG for this audio studio:

Studio name: "${studioName}"
Engineer type: ${typeDesc}
Color scheme: ${themeName}
Accent/highlight color: ${accent} | Text/mark color: ${textColor}
${taglineNote}

Technical requirements:
- viewBox="0 0 400 400" width="400" height="400"
- NO background fill — the SVG must have a transparent background (no background rect)
- Load Bebas Neue via: <defs><style>@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue');</style></defs>
- ALL elements must be fully inside the viewBox — nothing clipped or cut off at the edges
- Leave at least 20px of padding on all sides so nothing touches the edge

Design direction — this is a TRADITIONAL LOGO MARK, not a banner:
- Think: circular badge, stacked wordmark with a symbol, monogram with a geometric frame, or a bold icon above the name
- Structure: a graphic symbol/mark in the upper portion, studio name below in Bebas Neue — OR a strong monogram mark that integrates both
- The graphic symbol should be bold and readable at small sizes (will be displayed at ~120px)
- Choose a symbol that fits the engineer type:
  * Mastering: diamond, square bracket frame, precision circle with crosshair, or an angular geometric crest
  * Mixing: concentric arcs (like a mixing desk), stacked horizontal bars, or a wave form contained in a shape
  * Mix+Master: a split or bisected geometric form, or a clean bold monogram in a frame
  * Production: a bold abstract mark, microphone silhouette, triangle/play form, or bold initials in a circle
- Studio name in Bebas Neue, letter-spacing 0.15em–0.25em, centered below the mark
- If tagline, render it in a very small (12px), widely tracked monospace style below the name
- Use ${accent} for the graphic element/mark; ${textColor} for the studio name text
- The logo must read clearly at 120px wide — bold, graphic, not detailed

Keep paths simple. No clipPath. Output a complete, self-contained SVG.`
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
