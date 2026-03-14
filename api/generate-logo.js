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
    ? `Tagline (small text below name): "${tagline}"`
    : 'No tagline.';

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: `You are a senior brand identity designer with 20 years of experience creating logos for professional recording studios, mastering houses, and audio facilities. You produce SVG logos that look like they cost $5,000 to commission — refined, confident, and typographically precise. Return ONLY valid SVG markup. No markdown fences, no explanation, no comments outside the SVG. Output must start with <svg and end with </svg>.`,
    messages: [
      {
        role: 'user',
        content: `Create a professional, established-looking logo SVG for this audio studio:

Studio name: "${studioName}"
Engineer type: ${typeDesc}
Color scheme: ${themeName}
Background: ${bg} | Accent/highlight: ${accent} | Text: ${textColor}
${taglineNote}

Technical requirements:
- viewBox="0 0 600 200" width="600" height="200"
- Load Bebas Neue via: <defs><style>@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue');</style></defs>
- Studio name: font-family="'Bebas Neue', sans-serif" — this is the hero of the design
- Use the EXACT hex colors given. Background fill the entire SVG with ${bg}.
- All text must be clearly legible against the background

Design direction — make it look like a REAL studio brand:
- The studio name should be large, confident, and dominant (minimum 72px for short names, scale down for longer)
- Add a considered graphic element — choose ONE that fits the engineer type:
  * Mastering: a thin horizontal rule or pair of parallel lines flanking the name, or a precise geometric mark (diamond, square bracket)
  * Mixing: stacked parallel lines suggesting layers/faders, or a waveform-inspired arc
  * Mix+Master: a clean monogram mark or bold rule system
  * Production: a bold geometric shape, circle mark, or abstract sound symbol
- Use letter-spacing generously (0.15em to 0.25em) — audio brands always have wide tracking
- If there's a tagline, render it in a lighter weight below in a clean sans-serif or monospace style at ~14px, with even wider letter-spacing and muted color
- Use accent color ${accent} for the graphic element or as a highlight — not for the main name text
- Main name text color: ${textColor}
- Negative space is your friend — don't crowd the canvas
- The result must look at home on a business card, invoice header, and studio wall print

Do not use clipPath unless essential. Keep paths simple and clean. The output should be a complete, self-contained SVG that renders correctly in a browser img tag.`
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
