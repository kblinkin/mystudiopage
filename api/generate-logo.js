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

  // --- GRAPHIC MARK: Claude Haiku crafts prompt → Recraft v3 vector generates SVG ---

  // Convert hex accent to RGB for Recraft's colors param
  const hexToRgb = hex => {
    const h = hex.replace('#', '');
    return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) };
  };

  // Is this a dark or light theme?
  const isDark = bg && (bg === '#0c0c0c' || bg === '#080c12' || bg === '#080f0b' || bg === '#0a0a0a' || bg.startsWith('#0') || bg.startsWith('#1'));

  // Style direction → visual language
  const styleGuide = {
    organic:      'flowing organic curves, natural fluid forms, soft rounded biomorphic shapes',
    geometric:    'precise geometric forms, sharp angles, clean lines, mathematical symmetry',
    minimal:      'single bold minimal shape, extreme negative space, pure and restrained',
    industrial:   'angular industrial forms, mechanical precision, hard edges, structural weight',
    brutalist:    'raw bold shapes, heavy mass, stark high-contrast geometry',
    retro:        'vintage-inspired mark, classic proportions, timeless craft feel',
    futuristic:   'sleek futuristic forms, dynamic angles, forward motion, tech precision',
    elegant:      'refined elegant curves, graceful balance, sophisticated restraint',
  };
  const styleDesc = styleGuide[styleDirection?.toLowerCase()] || (styleDirection ? `${styleDirection} style` : 'sophisticated abstract geometry');

  // Engineer type → core visual concept
  const engineerConcepts = {
    mastering:  'precision calibration instrument, diamond facets, technical drawing geometry',
    mixing:     'signal flow, waveform cross-section, fader arc as architectural form',
    mixmaster:  'two interlocking mirror forms representing the full mix-to-master journey',
    production: 'rhythm made visible, the geometry of a kick drum or oscilloscope pulse',
  };
  const engineerConcept = engineerConcepts[engineerType] || 'audio engineering precision';

  // Use Claude Haiku to craft a vivid, specific visual prompt
  let imagePrompt;
  try {
    const promptMsg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 180,
      system: `You write image generation prompts for a professional AI logo tool. Write one vivid visual description (under 100 words) of an abstract logo mark. Be specific about exact shapes, forms, and composition. No text or letters. No background description. Pure visual form only — no instructions or meta-commentary.`,
      messages: [{
        role: 'user',
        content: `Create a logo mark for:
Studio: "${studioName}"
Core concept: ${engineerConcept}
Visual style: ${styleDesc}
Color: ${accent} (${themeName})

Be creative and specific. Make it feel like a $10,000 brand identity, not clip art.`
      }]
    });
    imagePrompt = promptMsg.content[0].text.trim();
  } catch (err) {
    // Fallback to a direct prompt if Haiku fails
    imagePrompt = `Professional abstract logo mark. ${styleDesc}. ${engineerConcept}. Color ${accent}. Pure symbol, no text.`;
  }

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
        colors: [{ rgb: hexToRgb(accent) }],
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
