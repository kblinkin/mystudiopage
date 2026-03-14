import Anthropic from '@anthropic-ai/sdk';

export const config = { maxDuration: 120 };

const client = new Anthropic();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { studioName, engineerType, typeDesc, themeName, accent, bg, textColor, styleDirection, layoutStyle, keywords, logoMode } = req.body;

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

  // Use Claude Sonnet + web search to research references, then craft the image prompt
  const logoColor = isDark ? '#ffffff' : '#280F61';
  let imagePrompt;
  try {
    const systemPrompt = `You are a world-class brand identity designer. Your job is to:
1. Do ONE web search to find visual design references, logo inspiration, or mood imagery related to the studio's name, keywords, and aesthetic.
2. Use those references to craft ONE image generation prompt for a professional logo mark.

After searching, output ONLY the image generation prompt — no preamble, no explanation.

Prompt rules:
- Describe ONLY solid filled flat shapes — no outlines, no thin lines, no sketches, no gradients
- 1-2 shapes maximum, forming a single unified bold silhouette
- No text, no letters, no faces, no realistic imagery, no ornate detail
- Be hyper-specific: exact angles, proportions, how shapes relate
- 60-90 words
- End with: "Single solid color fills only, no outlines, transparent background, no background rect, SVG logo mark"`;
    const userMessage = `Studio name: "${studioName}"
Engineer type: ${typeDesc}
Style direction: ${styleDesc}
Color palette: ${themeName} (primary: ${accent})${keywords ? `\nKeywords: "${keywords}"` : ''}

Search for visual references that fit this studio's aesthetic, then design a logo mark concept.`;

    // web_search is a server-side tool — Anthropic runs the search internally,
    // no client-side loop needed. Response arrives with stop_reason: 'end_turn'.
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: systemPrompt,
      tools: [{ type: 'web_search_20260209', name: 'web_search' }],
      messages: [{ role: 'user', content: userMessage }],
    });

    const rawPrompt = response.content.find(b => b.type === 'text')?.text?.trim()
      || `Minimal flat logo mark, solid geometric shapes, ${styleDesc}, ${engineerConcept}. Single bold silhouette.`;
    imagePrompt = `${rawPrompt} All shapes filled with ${logoColor}, single solid color only, transparent background, no background rect, SVG logo mark.`;
  } catch (err) {
    imagePrompt = `Minimal flat logo mark, solid geometric shapes, ${styleDesc}, ${engineerConcept}. Single bold silhouette. All shapes filled with ${logoColor}, single solid color only, transparent background, no background rect, SVG logo mark.`;
  }

  // Generate with Recraft v3 vector — 'icon' style with 'colored_shapes' substyle
  // gives clean single-color flat fills, ideal for logo marks
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

      // 1. Remove background rects — any large rect at canvas origin, any fill color
      svg = svg.replace(/<rect\b[^>]*(?:\/>|><\/rect>)/gi, (match) => {
        const hasLargeWidth = /width=["'](?:100%|[2-9]\d{2,}|\d{4,})["']/.test(match);
        const hasLargeHeight = /height=["'](?:100%|[2-9]\d{2,}|\d{4,})["']/.test(match);
        const hasOffsetX = /\bx=["'][1-9]/.test(match);
        const hasOffsetY = /\by=["'][1-9]/.test(match);
        if ((hasLargeWidth || hasLargeHeight) && !hasOffsetX && !hasOffsetY) return '';
        return match;
      });

      // 2. Force single-color: white on dark themes, black on light themes
      const c = logoColor;
      // CSS inside <style> blocks
      svg = svg.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, open, css, close) => {
        let newCss = css.replace(/\bfill\s*:\s*(?!none|transparent)[^;}"']+/gi, `fill:${c}`);
        newCss = newCss.replace(/\bstroke\s*:\s*(?!none|transparent)[^;}"']+/gi, `stroke:none`);
        return `${open}${newCss}${close}`;
      });
      // Attribute fills/strokes
      svg = svg.replace(/\bfill=["'](?!none|transparent)[^"']*["']/gi, `fill="${c}"`);
      svg = svg.replace(/\bstroke=["'](?!none|transparent)[^"']*["']/gi, `stroke="none"`);
      // Inline style attribute fills/strokes
      svg = svg.replace(/\bfill\s*:\s*(?!none|transparent)[^;}"']+/gi, `fill:${c}`);
      svg = svg.replace(/\bstroke\s*:\s*(?!none|transparent)[^;}"']+/gi, `stroke:none`);
      // Remove fill-opacity and opacity that create gray/semi-transparent artifacts
      svg = svg.replace(/\bfill-opacity=["'][^"']*["']/gi, 'fill-opacity="1"');
      svg = svg.replace(/\bfill-opacity\s*:\s*[^;}"']+/gi, 'fill-opacity:1');
      svg = svg.replace(/\bopacity=["'](?!1["'])[^"']*["']/gi, 'opacity="1"');
      svg = svg.replace(/\bopacity\s*:\s*(?!1)[^;}"']+/gi, 'opacity:1');
      // Remove fill from root <svg> (prevents inherited background color)
      svg = svg.replace(/(<svg\b[^>]*?)\s+fill=["'][^"']*["']/i, '$1');
      // Allow artwork that extends past the viewBox to show (fixes clipped bottom)
      if (!svg.includes('overflow=')) {
        svg = svg.replace(/(<svg\b[^>]*)>/, '$1 overflow="visible">');
      }

      return res.status(200).json({ svg });
    }

    // Raster fallback — return the URL, frontend wraps it
    return res.status(200).json({ imageUrl });
  } catch (err) {
    // If we can't fetch the SVG, just return the URL
    return res.status(200).json({ imageUrl });
  }
}
