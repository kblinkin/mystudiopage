import Anthropic from '@anthropic-ai/sdk';

export const config = { maxDuration: 60 };

const client = new Anthropic();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { studioName, engineerType, typeDesc, themeName, accent, bg, textColor, styleDirection, layoutStyle, logoMode } = req.body;

  if (!studioName) {
    return res.status(400).json({ error: 'studioName is required' });
  }

  const isWordmark = logoMode === 'wordmark';

  // --- WORDMARK: matches site layout font ---
  if (isWordmark) {
    // Map layout style → font family + letter spacing + weight guidance
    const layoutFonts = {
      default:   { family: "'Bebas Neue', 'Impact', sans-serif",          letterSpacing: '0.12em', style: 'condensed display, all caps feel' },
      editorial: { family: "'Playfair Display', 'Georgia', serif",         letterSpacing: '0.04em', style: 'elegant serif, mixed case, refined' },
      minimal:   { family: "'Space Grotesk', 'Arial', sans-serif",         letterSpacing: '0.08em', style: 'clean geometric sans, modern' },
      bold:      { family: "'Anton', 'Impact', 'Arial Black', sans-serif", letterSpacing: '0.03em', style: 'ultra bold, high impact, condensed' },
    };
    const fontDef = layoutFonts[layoutStyle] || layoutFonts.default;

    let message;
    try {
      message = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 2048,
        system: `You are a world-class typographic brand designer. You create SVG wordmarks with the craft of a $15,000 commission. Return ONLY valid SVG markup. No markdown, no explanation. Output must start with <svg and end with </svg>.`,
        messages: [{
          role: 'user',
          content: `Design a professional wordmark SVG for this recording studio:

Studio name: "${studioName}"
Color: ${accent} on transparent background
Site layout style: ${layoutStyle || 'default'} — ${fontDef.style}

Specifications:
- viewBox="0 0 600 200" width="600" height="200"
- No background fill
- Render the name as a single <text> element, centered in the viewBox (x="300" y="120" text-anchor="middle")
- font-family: ${fontDef.family}
- font-size: typically 72–96px for short names, 48–64px for longer ones
- letter-spacing: ${fontDef.letterSpacing}
- fill: ${accent}
- You may add ONE secondary design element — a thin rule, bracket marks, or a geometric accent — using ${textColor} at low opacity
- The result must match the ${layoutStyle || 'default'} layout's typographic personality

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

  // Style direction → prompt description for Haiku
  const styleGuide = {
    organic:    'flowing organic curves, natural fluid forms, soft rounded biomorphic shapes',
    geometric:  'precise geometric forms, sharp angles, clean lines, mathematical symmetry',
    minimal:    'single bold minimal shape, extreme negative space, pure and restrained',
    industrial: 'angular industrial forms, mechanical precision, hard edges, structural weight',
    brutalist:  'raw bold shapes, heavy mass, stark high-contrast geometry',
    retro:      'vintage-inspired mark, handcrafted feel, timeless print quality',
    futuristic: 'sleek precise lines, dynamic angles, technical forward-motion geometry',
    elegant:    'refined curves, graceful balance, sophisticated restraint',
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
      system: `You write image generation prompts for a professional logo designer. Describe a single iconic brand mark using ONLY solid filled shapes — no outlines, no thin lines, no sketches. Think Nike swoosh, Apple logo, Mercedes star: bold, flat, immediate. Describe exact shapes and how they form one unified silhouette. Under 80 words. No meta-commentary.`,
      messages: [{
        role: 'user',
        content: `Brand mark for a recording studio.
Concept: ${engineerConcept}
Style: ${styleDesc}
Color: ${accent} on transparent background

One strong geometric symbol. Solid filled shapes only. Must read instantly as a logo, not an illustration.`
      }]
    });
    imagePrompt = promptMsg.content[0].text.trim();
  } catch (err) {
    imagePrompt = `Minimal flat logo mark, solid geometric shapes, ${styleDesc}, ${engineerConcept}, bold silhouette, color ${accent}, isolated on transparent background.`;
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
        style: 'Bold stroke',
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

      // Remove Recraft's background rect — catches all fill formats and positions
      // 1. White/light fill in fill attribute
      svg = svg.replace(/<rect[^>]*fill=["'](?:white|#[Ff]{3}|#[Ff]{6}|rgb\(255[^)]*\))["'][^>]*(?:\/>|><\/rect>)/gi, '');
      // 2. White/light fill in style attribute
      svg = svg.replace(/<rect[^>]*style=["'][^"']*fill\s*:\s*(?:white|#[Ff]{3,6}|rgb\(255[^)]*\))[^"']*["'][^>]*(?:\/>|><\/rect>)/gi, '');
      // 3. Full-canvas rect at origin (width/height = 100% or matches viewBox)
      svg = svg.replace(/<rect\b(?=[^>]*width=["'](?:100%|1024|512|800)["'])[^>]*(?:\/>|><\/rect>)/gi, '');
      // 4. Nuclear option: remove any rect with no x/y (implicitly 0,0) that is very large
      svg = svg.replace(/<rect\b(?![^>]*\bx=["'][1-9])(?=[^>]*width=["']\d{3,}["'])[^>]*(?:\/>|><\/rect>)/gi, '');

      return res.status(200).json({ svg });
    }

    // Raster fallback — return the URL, frontend wraps it
    return res.status(200).json({ imageUrl });
  } catch (err) {
    // If we can't fetch the SVG, just return the URL
    return res.status(200).json({ imageUrl });
  }
}
