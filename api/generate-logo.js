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
    ? `Tagline (optional, small text): "${tagline}"`
    : 'No tagline — name only.';

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2000,
    system: `You are an expert brand designer specializing in audio studio identities. You create clean, professional SVG logos. Return ONLY valid SVG markup — no markdown fences, no explanation, no comments. The output must start with <svg and end with </svg>.`,
    messages: [
      {
        role: 'user',
        content: `Design a professional logo SVG for this audio studio:

Studio name: "${studioName}"
Engineer type: ${typeDesc}
Color scheme: ${themeName}
Colors — background: ${bg}, accent/highlight: ${accent}, text: ${textColor}
${taglineNote}

Technical spec:
- viewBox="0 0 600 180" width="600" height="180"
- Embed this font via <defs>: <style>@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue');</style>
- Use font-family="'Bebas Neue', sans-serif" for the studio name
- Use the exact hex colors provided — do not substitute

Design brief:
Let the engineer type shape subtle aesthetic decisions. Mastering engineers → precision, tight geometry, thin lines. Mixing engineers → layered or depth-suggesting marks. Producers → bolder, more expressive shapes. All should feel premium and minimal.

Make deliberate choices on: layout (centered, left-aligned, or stacked), decorative element (waveform hint, rule lines, geometric accent, dot mark), font sizing, letter-spacing, and negative space use. The studio name is always the dominant element. Any decorative marks should feel considered, not generic.

The result should look equally at home on a professional invoice, a business card, and a studio wall.`
      }
    ]
  });

  let svg = message.content[0].text.trim();

  // Strip any accidental markdown fences Claude might have added
  svg = svg.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '').trim();

  // Basic validation
  if (!svg.startsWith('<svg') || !svg.includes('</svg>')) {
    return res.status(500).json({ error: 'Generated output was not valid SVG. Try again.' });
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ svg });
}
