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

  const styleBlock = (!isWordmark && styleDirection)
    ? `STYLE DIRECTION — this overrides everything else: ${styleDirection.toUpperCase()}. Every decision about form, curve, angle, and weight must serve this direction. Do not produce a generic shape.\n\n`
    : '';

  const systemPrompt = isWordmark
    ? `You are a world-class typographic brand designer. You have designed identity systems for Sony Music, Atlantic Records, and major recording studios. You create SVG wordmarks with the craft of a $15,000 commission — precise letter spacing, intentional weight, considered proportions. Return ONLY valid SVG markup. No markdown, no explanation. Output must start with <svg and end with </svg>.`
    : `You are a world-class logo designer. Your marks have appeared on album credits, studio walls, and award plaques. You design with the precision of Saul Bass, the boldness of Aaron Draplin, and the craft of a $10,000 identity system. You construct SVG marks using carefully controlled bezier paths, intentional negative space, and optical balance — never defaulting to primitive shapes when a crafted path would be stronger. Return ONLY valid SVG markup. No markdown, no explanation. Output must start with <svg and end with </svg>.`;

  const userPrompt = isWordmark
    ? `Design a professional wordmark SVG for this recording studio:

Studio name: "${studioName}"
Color: ${accent} on transparent background
Aesthetic: ${themeName}${styleDirection ? ` — ${styleDirection}` : ''}

Specifications:
- viewBox="0 0 600 200" width="600" height="200"
- No background fill
- Render the name as a single <text> element, centered in the viewBox (x="300" y="120" text-anchor="middle")
- Choose a font stack that suits the name: for bold/strong names use a condensed sans ("Impact, 'Arial Narrow', sans-serif"), for refined names use a serif ("Georgia, 'Times New Roman', serif"), for technical/modern use monospace or geometric sans
- font-size should fill the width well — typically 72–96px for short names, 48–64px for longer ones
- letter-spacing: 0.08em to 0.2em for a premium feel (never default 0)
- fill: ${accent}
- You may add ONE secondary design element — a thin rule below the text, two bracket marks flanking it, or a single geometric accent — using ${textColor} at low opacity or as a fine line
- The result should look like it belongs on a studio door plaque, not a Word document

Output a complete, self-contained SVG.`

    : `${styleBlock}Design a sophisticated, professional logo mark for this recording studio. This will be used on a real website, business cards, and studio signage — it must look like it cost thousands to commission.

Studio: "${studioName}"
Type: ${typeDesc}
Color palette: ${themeName}
Primary: ${accent} | Secondary/accent: ${textColor}

Canvas: viewBox="0 0 400 400" width="400" height="400"
- Transparent background — no rect fill
- NO text, letters, or words anywhere — pure symbol only
- All geometry within a 340×340 area centered in the canvas (30px padding)

Construction quality requirements — this is where amateurs fail:
- Use cubic bezier paths (C, c commands) for curves — not just circles and rects
- Build the mark from 2–4 interlocking or layered elements that create visual tension and interest
- Design with intentional negative space — the space between shapes is as important as the shapes themselves
- Optical balance: the mark should feel centered by eye, not just mathematically
- Stroke weights if used: minimum 3px, maximum 8px — nothing hairline, nothing crude
- The mark must read clearly at 80px AND look detailed at 300px

What makes a mark feel premium vs. amateur:
- AMATEUR: a circle with a waveform squiggle on top, a generic triangle, a basic M shape
- PROFESSIONAL: a carefully constructed geometric form where every angle is intentional, shapes that lock together, a symbol that rewards close inspection
- Think: a diamond with a precisely cut notch, concentric forms with deliberate gaps, a monogram where the letters fuse into a new unified shape, a crest with internal structure

Engineer type inspiration (go beyond the obvious):
- Mastering: think precision instruments, calibration marks, the geometry of a lathe, diamond facets, technical drawing symbols
- Mixing: think signal flow, waveform cross-sections, the arc of a fader, frequency curves as architecture
- Mix+Master: think duality — two forms that are mirror images or interlocking halves of a whole
- Production: think the moment of creation, rhythm made visible, the geometry of a kick drum or oscilloscope

Color application:
- Primary shapes: ${accent}
- Use ${textColor} for secondary elements, inner details, or negative space cuts — sparingly
- A single subtle gradient or opacity variation is acceptable if it adds depth, not as decoration

Output a complete, well-constructed SVG. Use as many path points as the design requires — do not simplify at the expense of quality.`;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt }
    ]
  });

  const textBlock = message.content.find(b => b.type === 'text');
  if (!textBlock) {
    return res.status(500).json({ error: 'No SVG output returned. Try again.' });
  }

  let svg = textBlock.text.trim();

  // Strip any accidental markdown fences
  svg = svg.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '').trim();

  // If there's prose before the SVG, extract just the SVG
  const svgStart = svg.indexOf('<svg');
  const svgEnd = svg.lastIndexOf('</svg>');
  if (svgStart > 0 && svgEnd > svgStart) {
    svg = svg.slice(svgStart, svgEnd + 6);
  }

  if (!svg.startsWith('<svg') || !svg.includes('</svg>')) {
    return res.status(500).json({ error: 'Generated output was not valid SVG. Try again.' });
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ svg });
}
