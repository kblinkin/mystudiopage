import Anthropic from '@anthropic-ai/sdk';

export const config = { maxDuration: 60 };

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

  // --- WORDMARK: Claude handles text SVG well ---
  if (isWordmark) {
    let message;
    try {
      message = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 2048,
        system: `You are a world-class typographic brand designer. You have designed identity systems for Sony Music, Atlantic Records, and major recording studios. You create SVG wordmarks with the craft of a $15,000 commission — precise letter spacing, intentional weight, considered proportions. Return ONLY valid SVG markup. No markdown, no explanation. Output must start with <svg and end with </svg>.`,
        messages: [{
          role: 'user',
          content: `Design a professional wordmark SVG for this recording studio:

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
        }]
      });
    } catch (err) {
      return res.status(500).json({ error: `API error: ${err?.message}` });
    }

    const textBlock = message.content.find(b => b.type === 'text');
    if (!textBlock) return res.status(500).json({ error: 'No SVG output returned. Try again.' });

    let svg = textBlock.text.trim();
    svg = svg.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '').trim();
    const s = svg.indexOf('<svg'), e = svg.lastIndexOf('</svg>');
    if (s > 0 && e > s) svg = svg.slice(s, e + 6);
    if (!svg.startsWith('<svg') || !svg.includes('</svg>')) {
      return res.status(500).json({ error: 'Generated output was not valid SVG. Try again.' });
    }
    return res.status(200).json({ svg });
  }

  // --- GRAPHIC MARK: Build prompt → Recraft v3 vector generates SVG ---

  // Style direction → visual language mapping
  const styleGuide = {
    organic:      'flowing organic curves, natural fluid forms, soft rounded geometry, biomorphic shapes',
    geometric:    'precise geometric forms, sharp angles, clean lines, mathematical symmetry',
    minimal:      'single bold minimal shape, extreme negative space, restrained and pure',
    industrial:   'angular industrial forms, mechanical precision, hard edges, structural weight',
    brutalist:    'raw bold shapes, heavy mass, stark contrast, uncompromising geometry',
    retro:        'vintage-inspired mark, classic proportions, timeless craft',
    futuristic:   'sleek futuristic forms, dynamic angles, forward motion, tech precision',
    elegant:      'refined elegant curves, graceful balance, sophisticated restraint',
  };
  const styleDesc = styleGuide[styleDirection?.toLowerCase()] || (styleDirection ? `${styleDirection} aesthetic` : 'sophisticated geometric forms');

  // Engineer type → visual concept mapping
  const engineerConcepts = {
    mastering:  'precision calibration mark, diamond facets, technical instrument geometry',
    mixing:     'signal flow forms, waveform cross-sections, fader arc geometry',
    mixmaster:  'two interlocking mirror forms, duality of process, unified halves',
    production: 'rhythm made visible, creative spark, oscilloscope-inspired geometry',
  };
  const engineerConcept = engineerConcepts[engineerType] || 'audio engineering geometry';

  // Build the Recraft prompt directly — no need for a Haiku round-trip
  const imagePrompt = `Professional abstract logo mark for a recording studio. ${styleDesc}. Inspired by ${engineerConcept}. Primary color ${accent}, color scheme: ${themeName}. Pure symbol, no text or letters. Clean vector art on white background. Premium brand identity, sophisticated and distinctive.`;

  // Generate with Recraft v3 vector
  let recraftRes;
  try {
    recraftRes = await fetch('https://external.api.recraft.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RECRAFT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'recraftv3',
        prompt: imagePrompt,
        style: 'vector_illustration',
        size: '1024x1024',
        response_format: 'url'
      })
    });
  } catch (err) {
    return res.status(500).json({ error: `Recraft error: ${err?.message}` });
  }

  if (!recraftRes.ok) {
    const errBody = await recraftRes.text().catch(() => '');
    return res.status(500).json({ error: `Recraft ${recraftRes.status}: ${errBody}` });
  }

  const recraftData = await recraftRes.json();
  const imageUrl = recraftData?.data?.[0]?.url;
  if (!imageUrl) return res.status(500).json({ error: 'No image URL from Recraft.' });

  // Step 3: Fetch the content and return SVG or URL
  try {
    const imgRes = await fetch(imageUrl);
    const contentType = imgRes.headers.get('content-type') || '';
    const content = await imgRes.text();

    if (contentType.includes('svg') || content.trimStart().startsWith('<svg') || content.trimStart().startsWith('<?xml')) {
      let svg = content;
      const s = svg.indexOf('<svg'), e = svg.lastIndexOf('</svg>');
      if (s >= 0 && e > s) svg = svg.slice(s, e + 6);
      return res.status(200).json({ svg });
    }

    // Raster fallback — return the URL, frontend wraps it
    return res.status(200).json({ imageUrl });
  } catch (err) {
    // If we can't fetch the SVG, just return the URL
    return res.status(200).json({ imageUrl });
  }
}
