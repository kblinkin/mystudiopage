// site-template.js — ES module
// Generates a complete, self-contained HTML portfolio site for audio engineers.

const THEMES = {
  'dark-gold':  { bg:'#0c0c0c', bg2:'#141414', bg3:'#1c1c1c', accent:'#c8a96e', accent2:'#e8c98e', accentDim:'rgba(200,169,110,0.12)', text:'#f0ece4', muted:'#686460', muted2:'#908c88', border:'rgba(200,169,110,0.2)', border2:'rgba(240,236,228,0.07)' },
  'dark-blue':  { bg:'#080c12', bg2:'#0d1520', bg3:'#131d2e', accent:'#5b9cf6', accent2:'#7db5ff', accentDim:'rgba(91,156,246,0.12)', text:'#e8f0ff', muted:'#4a5a70', muted2:'#6a8090', border:'rgba(91,156,246,0.25)', border2:'rgba(232,240,255,0.07)' },
  'warm-cream': { bg:'#f5f0e8', bg2:'#ede8e0', bg3:'#e4ddd4', accent:'#8b6f4e', accent2:'#a07f5e', accentDim:'rgba(139,111,78,0.1)', text:'#2c2420', muted:'#9a8880', muted2:'#7a6860', border:'rgba(139,111,78,0.25)', border2:'rgba(44,36,32,0.1)' },
  'deep-green': { bg:'#080f0b', bg2:'#0e1a12', bg3:'#14261a', accent:'#4caf7d', accent2:'#62c48f', accentDim:'rgba(76,175,125,0.12)', text:'#e8f5ee', muted:'#3a5040', muted2:'#508060', border:'rgba(76,175,125,0.25)', border2:'rgba(232,245,238,0.07)' },
  'monochrome': { bg:'#0a0a0a', bg2:'#121212', bg3:'#1a1a1a', accent:'#f0ece4', accent2:'#ffffff', accentDim:'rgba(240,236,228,0.08)', text:'#f0ece4', muted:'#525252', muted2:'#888888', border:'rgba(240,236,228,0.2)', border2:'rgba(240,236,228,0.07)' }
};

const TYPE_LABELS = {
  mastering:  'Mastering Engineer',
  mixing:     'Mixing Engineer',
  mixmaster:  'Mix + Master Engineer',
  production: 'Music Producer'
};

const SERVICES_TITLE = {
  mastering:  'Rates & Services',
  mixing:     'Mixing Prices',
  mixmaster:  'Prices',
  production: 'Working Together'
};

const WORK_TITLE = {
  mastering:  'Mastering Samples',
  mixing:     'Mixing Samples',
  mixmaster:  'Mix + Master Samples',
  production: 'Production Work'
};

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function accentHex(color) {
  // Strip leading # for use in URLs
  return (color || '#c8a96e').replace(/^#/, '');
}

function getLayoutCss(style, t) {
  if (style === 'editorial') return `
    /* Editorial layout — Playfair Display + Source Sans 3 */
    .hero-inner { text-align: left; }
    .hero-pre-logo { justify-content: flex-start; }
    .hero-tagline { margin-left: 0; }
    .section-eyebrow { justify-content: flex-start; }
    .contact-inner { text-align: left; max-width: 1100px; }
    .contact-inner .section-eyebrow { justify-content: flex-start; }
    .contact-inner .section-eyebrow::before { display: block; }
    .stats-inner { justify-content: flex-start; padding-left: 60px; }
    .hero-title { font-family: 'Playfair Display', serif; font-size: 110px; letter-spacing: -0.01em; font-weight: 700; }
    .section-heading { font-family: 'Playfair Display', serif; font-weight: 700; letter-spacing: 0; }
    .credits-section-label { font-family: 'Playfair Display', serif; }
    .about-studio-name { font-family: 'Playfair Display', serif; }
    body, .hero-tagline, .about-bio, .service-desc, .contact-sub { font-family: 'Source Sans 3', sans-serif; font-weight: 300; }
    .section-eyebrow, .nav-link, .service-tier, .stat-text { font-family: 'Source Sans 3', sans-serif; font-weight: 600; letter-spacing: 0.15em; }
    @media (max-width: 768px) { .hero-title { font-size: 64px; } }
  `;
  if (style === 'minimal') return `
    /* Minimal layout — Space Grotesk */
    .hero { min-height: 75vh; }
    .hero-title { font-family: 'Space Grotesk', sans-serif; font-size: 88px; letter-spacing: -0.02em; font-weight: 700; }
    .section-eyebrow::before { display: none; }
    .section-eyebrow { font-family: 'Space Mono', monospace; letter-spacing: 0.2em; }
    .section-heading { font-family: 'Space Grotesk', sans-serif; font-size: 40px; letter-spacing: -0.01em; font-weight: 700; }
    .credits-section-label { font-family: 'Space Grotesk', sans-serif; font-weight: 700; }
    .about-studio-name { font-family: 'Space Grotesk', sans-serif; font-weight: 700; }
    body, .hero-tagline, .about-bio, .service-desc { font-family: 'Space Grotesk', sans-serif; font-weight: 300; }
    .stat-text { font-family: 'Space Mono', monospace; font-size: 22px; letter-spacing: 0.05em; }
    .about, .services, .work, .contact { padding: 130px 0; }
    .stats-band { padding: 60px 0; }
    .stat-sep { height: 28px; }
    .nav { border-bottom: none; background: transparent; position: absolute; }
    .hero { padding-top: 100px; }
    @media (max-width: 768px) { .hero-title { font-size: 56px; } }
  `;
  if (style === 'bold') return `
    /* Bold layout — Anton headlines */
    .hero { border-bottom: 3px solid ${t.text}; min-height: auto; padding: 130px 0 100px; }
    .hero-title { font-family: 'Anton', sans-serif; font-size: 160px; letter-spacing: 0.02em; font-weight: 400; }
    .section-heading { font-family: 'Anton', sans-serif; font-size: 64px; letter-spacing: 0.02em; font-weight: 400; }
    .credits-section-label { font-family: 'Anton', sans-serif; letter-spacing: 0.02em; }
    .about-studio-name { font-family: 'Anton', sans-serif; letter-spacing: 0.02em; }
    .stats-band { border-top: 3px solid ${t.text}; border-bottom: 3px solid ${t.text}; background: ${t.bg}; }
    .section-eyebrow::before { display: none; }
    .section-eyebrow { border-left: 3px solid ${t.accent}; padding-left: 14px; letter-spacing: 0.25em; }
    .about { border-bottom: 1px solid ${t.border2}; }
    .work { border-bottom: 1px solid ${t.border2}; }
    .service-card { border-color: ${t.border}; }
    @media (max-width: 768px) { .hero-title { font-size: 80px; } .section-heading { font-size: 44px; } }
  `;
  return ''; // default
}

export function renderSite(data) {
  const theme = THEMES[data.theme] || THEMES['dark-gold'];
  const t = theme;

  const typeLabel   = TYPE_LABELS[data.engineerType] || 'Audio Engineer';
  const studioName  = data.studioName || data.name || 'Studio';
  const tracks      = Array.isArray(data.tracks)   ? data.tracks.filter(tr => tr && tr.url)   : [];
  const services    = Array.isArray(data.services) ? data.services.filter(s => s && (s.name || s.desc)) : [];
  const stats       = Array.isArray(data.stats)    ? data.stats.filter(s => s && s.value)     : [];
  const credits     = Array.isArray(data.credits)  ? data.credits.filter(Boolean)              : [];
  const socials     = data.socials || {};
  const hasPhoto    = !!data.photoDataUrl;
  const hasLogo     = !!data.logoSvg;
  const formId      = data.formspreeId || '';

  // Recolor logo SVG to match current theme — white on dark bg, dark text on light bg
  const themeBg = t.bg || '#0c0c0c';
  const themeIsDark = themeBg.startsWith('#0') || themeBg.startsWith('#1');
  const logoFill = themeIsDark ? '#ffffff' : '#280F61';
  const logoSvg = hasLogo ? data.logoSvg
    .replace(/\bfill=["'](?!none|transparent)[^"']+["']/gi, `fill="${logoFill}"`)
    .replace(/\bfill\s*:\s*(?!none|transparent)[^;}"']+/gi, `fill:${logoFill}`)
    : null;
  const isProduction = data.engineerType === 'production';

  // Social link labels
  const socialLinks = [
    { key: 'instagram',  label: 'Instagram' },
    { key: 'soundcloud', label: 'SoundCloud' },
    { key: 'youtube',    label: 'YouTube' },
    { key: 'twitter',    label: 'Twitter/X' },
    { key: 'facebook',   label: 'Facebook' },
    { key: 'linkedin',   label: 'LinkedIn' },
  ].filter(s => socials[s.key]);

  // ── NAV ───────────────────────────────────────────────────────────────────
  const navHtml = `
  <nav class="site-nav" role="navigation">
    <div class="nav-inner">
      <div class="nav-studio-name">${escHtml(studioName)}</div>
      <a href="#contact" class="nav-cta">Get In Touch</a>
    </div>
  </nav>`;

  // ── HERO ──────────────────────────────────────────────────────────────────
  const isWordmark = hasLogo && data.logoMode === 'wordmark';
  const heroHtml = `
  <section class="hero" id="hero">
    <div class="hero-inner">
      ${hasLogo && !isWordmark ? `<div class="hero-pre-logo">${logoSvg}</div>` : ''}
      <div class="hero-eyebrow">${escHtml(typeLabel)}</div>
      ${isWordmark
        ? `<div class="hero-wordmark">${logoSvg}</div>`
        : `<h1 class="hero-title">${escHtml(studioName)}</h1>`}
      ${data.tagline ? `<p class="hero-tagline">${escHtml(data.tagline)}</p>` : ''}
      <a href="#contact" class="hero-cta">Work With Me</a>
    </div>
  </section>`;

  // ── CREDITS ───────────────────────────────────────────────────────────────
  let creditsHtml = '';
  if (credits.length > 0) {
    const items = credits.map(c =>
      `<span class="credit-name">${escHtml(c)}</span>`
    ).join('<span class="credit-dot" aria-hidden="true">·</span>');
    creditsHtml = `
  <section class="credits" id="credits">
    <div class="credits-inner">
      <details class="credits-details">
        <summary class="credits-summary">
          <h2 class="section-heading credits-heading">Credits</h2>
          <span class="credits-toggle" aria-hidden="true">+</span>
        </summary>
        <div class="credits-list">${items}</div>
      </details>
    </div>
  </section>`;
  }

  // ── STATS ─────────────────────────────────────────────────────────────────
  let statsHtml = '';
  if (stats.length > 0) {
    const statItems = stats.map((s, i) => {
      // Support both old {value, label} format and new single {value} format
      const text = s.label ? `${s.value} ${s.label}` : s.value;
      const sep = i < stats.length - 1 ? '<div class="stat-sep" aria-hidden="true"></div>' : '';
      return `<div class="stat-block"><div class="stat-text">${escHtml(text)}</div></div>${sep}`;
    }).join('');
    statsHtml = `
  <section class="stats-band" id="stats" aria-label="Quick stats">
    <div class="stats-inner">${statItems}</div>
  </section>`;
  }

  // ── ABOUT ─────────────────────────────────────────────────────────────────
  const photoEl = hasPhoto
    ? `<div class="about-photo-wrap"><img class="about-photo" src="${data.photoDataUrl}" alt="${escHtml(data.name || studioName)}" loading="lazy"></div>`
    : '';

  const aboutHtml = `
  <section class="about" id="about">
    <div class="about-inner">
      <div class="section-eyebrow">About</div>
      <div class="about-grid${hasPhoto ? ' has-photo' : ''}">
        ${photoEl}
        <div class="about-text">
          <h2 class="about-studio-name">${escHtml(studioName)}</h2>
          <p class="about-bio">${escHtml(data.bio || '')}</p>
          <div class="about-badge">${escHtml(typeLabel)}</div>
        </div>
      </div>
    </div>
  </section>`;

  // ── WORK ──────────────────────────────────────────────────────────────────
  let workHtml = '';
  if (tracks.length > 0) {
    const acHex = accentHex(t.accent);
    const trackCards = tracks.map(tr => {
      // If the user pasted a full player URL from the Embed tab, use it directly to avoid double-wrapping
      const iframeSrc = tr.url.startsWith('https://w.soundcloud.com/player/')
        ? tr.url
        : `https://w.soundcloud.com/player/?url=${encodeURIComponent(tr.url)}&color=%23${acHex}&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true`;
      return `<div class="track-card">
        <div class="track-embed">
          <iframe
            class="sc-iframe"
            scrolling="no"
            frameborder="no"
            allow="autoplay"
            src="${escHtml(iframeSrc)}"
            title="${escHtml(tr.title || 'Audio track')}"></iframe>
        </div>
        ${tr.title ? `<div class="track-title">${escHtml(tr.title)}</div>` : ''}
        ${tr.genre ? `<div class="track-genre">${escHtml(tr.genre)}</div>` : ''}
      </div>`;
    }).join('');
    workHtml = `
  <section class="work" id="work">
    <div class="work-inner">
      <div class="section-eyebrow">Samples</div>
      <h2 class="section-heading">${WORK_TITLE[data.engineerType] || 'Selected Work'}</h2>
      <div class="tracks-grid">${trackCards}</div>
    </div>
  </section>`;
  }

  // ── SERVICES ──────────────────────────────────────────────────────────────
  let servicesHtml = '';
  const servicesTitle = SERVICES_TITLE[data.engineerType] || 'Services';

  if (isProduction) {
    const productionSvc = services[0] || {};
    const bookingUrl = productionSvc.bookingUrl || data.bookingUrl || '#contact';
    servicesHtml = `
  <section class="services" id="services">
    <div class="services-inner">
      <div class="section-eyebrow">Services</div>
      <h2 class="section-heading">${escHtml(servicesTitle)}</h2>
      <div class="production-card">
        <div class="production-card-inner">
          <h3 class="production-card-title">Project-Based Pricing</h3>
          <p class="production-card-body">Every production is different — the scope, the timeline, what's needed. Rather than a fixed price list, I work with each artist to scope out the project and quote based on what it actually requires.</p>
          <p class="production-card-body">The best way to start is a free consultation. We talk through your project, see if it's a good fit, and go from there. No commitment needed.</p>
          <a href="${escHtml(bookingUrl)}" class="production-cta">Book a Free Call</a>
        </div>
      </div>
    </div>
  </section>`;
  } else if (services.length > 0) {
    const compact = services.length > 3;
    const serviceCards = services.map(s => `
      <div class="service-card${compact ? ' compact' : ''}">
        <div class="service-name">${escHtml(s.name)}</div>
        ${s.price ? `<div class="service-price">${escHtml(s.price)}</div>` : ''}
        ${s.desc  ? `<p class="service-desc">${escHtml(s.desc)}</p>` : ''}
      </div>`).join('');
    const ethosHtml = data.ethos ? `<p class="services-ethos-text">${escHtml(data.ethos)}</p>` : '';
    servicesHtml = `
  <section class="services" id="services">
    <div class="services-inner">
      <div class="section-eyebrow">Services</div>
      <div class="services-layout">
        <div class="services-cards">${serviceCards}</div>
        <div class="services-ethos-col">
          <h2 class="section-heading">My Ethos</h2>
          ${ethosHtml}
        </div>
      </div>
    </div>
  </section>`;
  }

  // ── CONTACT ───────────────────────────────────────────────────────────────
  let contactBody = '';
  if (formId) {
    contactBody = `
      <form class="contact-form" action="https://formspree.io/f/${escHtml(formId)}" method="POST">
        <div class="form-group">
          <label class="form-label" for="cf-name">Your Name</label>
          <input class="form-input" type="text" id="cf-name" name="name" placeholder="e.g. Alex Rivera" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="cf-email">Your Email</label>
          <input class="form-input" type="email" id="cf-email" name="email" placeholder="your@email.com" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="cf-message">Message</label>
          <textarea class="form-input form-textarea" id="cf-message" name="message" placeholder="Tell me about your project..." required></textarea>
        </div>
        <button class="form-submit" type="submit">Send Message</button>
      </form>`;
  } else if (data.email) {
    contactBody = `
      <div class="contact-email-display">
        <div class="contact-email-address">${escHtml(data.email)}</div>
        <a class="contact-mailto-btn" href="mailto:${escHtml(data.email)}">Send an Email</a>
      </div>`;
  }

  const socialRow = socialLinks.length > 0
    ? `<div class="contact-socials" role="list">
        ${socialLinks.map((s, i) => `<a class="contact-social-link" href="${escHtml(socials[s.key])}" target="_blank" rel="noopener noreferrer" role="listitem">${escHtml(s.label)}</a>${i < socialLinks.length - 1 ? '<span class="social-sep" aria-hidden="true"> · </span>' : ''}`).join('')}
      </div>`
    : '';

  const contactHtml = `
  <section class="contact" id="contact">
    <div class="contact-inner">
      <div class="section-eyebrow">Contact</div>
      <h2 class="section-heading">Let's Work</h2>
      ${contactBody}
      ${socialRow}
    </div>
  </section>`;

  // ── FOOTER ────────────────────────────────────────────────────────────────
  const footerHtml = `
  <footer class="site-footer" role="contentinfo">
    <div class="footer-inner">
      <div class="footer-studio">${escHtml(studioName)}</div>
      <div class="footer-credit"><a href="https://mystudiopage.com" target="_blank" rel="noopener noreferrer">Built with mystudiopage.com</a></div>
    </div>
  </footer>`;

  // ── CSS ───────────────────────────────────────────────────────────────────
  const css = `
    /* ── Reset ─────────────────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; font-size: 16px; }

    /* ── Theme Variables ────────────────────────────────────────────────── */
    :root {
      --bg:         ${t.bg};
      --bg2:        ${t.bg2};
      --bg3:        ${t.bg3};
      --accent:     ${t.accent};
      --accent2:    ${t.accent2};
      --accent-dim: ${t.accentDim};
      --text:       ${t.text};
      --muted:      ${t.muted};
      --muted2:     ${t.muted2};
      --border:     ${t.border};
      --border2:    ${t.border2};
    }

    /* ── Base ───────────────────────────────────────────────────────────── */
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'DM Sans', sans-serif;
      font-weight: 300;
      min-height: 100vh;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* ── Grain texture ──────────────────────────────────────────────────── */
    body::after {
      content: '';
      position: fixed;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      pointer-events: none;
      z-index: 9999;
      opacity: 0.03;
    }

    img { max-width: 100%; display: block; }
    a { color: inherit; text-decoration: none; }

    /* ── Nav ────────────────────────────────────────────────────────────── */
    .site-nav {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 100;
      height: 56px;
      background: ${t.bg};
      border-bottom: 1px solid var(--border2);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    .nav-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 40px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .nav-studio-name {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 20px;
      letter-spacing: 0.1em;
      color: var(--accent);
      line-height: 1;
    }

    .nav-cta {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted2);
      transition: color 0.2s;
      padding: 8px 0;
    }

    .nav-cta:hover { color: var(--accent); }

    @media (max-width: 640px) {
      .nav-cta { display: none; }
      .nav-inner { padding: 0 24px; }
    }

    /* ── Section shared ─────────────────────────────────────────────────── */
    .section-eyebrow {
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .section-eyebrow::before {
      content: '';
      display: block;
      width: 28px;
      height: 1px;
      background: var(--accent);
      flex-shrink: 0;
    }

    .section-heading {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 52px;
      letter-spacing: 0.03em;
      line-height: 1;
      color: var(--text);
      margin-bottom: 48px;
    }

    @media (max-width: 768px) {
      .section-heading { font-size: 40px; margin-bottom: 32px; }
    }

    /* ── Hero ───────────────────────────────────────────────────────────── */
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg);
      padding: 56px 0 80px;
    }

    .hero-inner {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 40px;
      width: 100%;
      text-align: center;
    }

    .hero-eyebrow {
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .hero-eyebrow::before,
    .hero-eyebrow::after {
      content: '';
      display: block;
      width: 24px;
      height: 1px;
      background: var(--accent);
      flex-shrink: 0;
    }

    /* Traditional logo mark above the hero text */
    .hero-pre-logo {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 32px;
      color: var(--text);
    }

    .hero-pre-logo svg {
      width: 120px;
      height: 120px;
    }

    @media (max-width: 768px) {
      .hero-pre-logo svg { width: 88px; height: 88px; }
    }

    .hero-wordmark {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 28px;
    }

    .hero-wordmark svg {
      max-width: min(600px, 90vw);
      height: auto;
    }

    /* Studio name as large hero text (always rendered) */
    .hero-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 140px;
      letter-spacing: 0.02em;
      line-height: 0.9;
      color: var(--text);
      margin: 0 auto 28px;
    }

    .hero-tagline {
      font-family: 'DM Sans', sans-serif;
      font-weight: 300;
      font-size: 22px;
      color: var(--muted2);
      line-height: 1.6;
      white-space: nowrap;
      max-width: 90vw;
      overflow: hidden;
      text-overflow: ellipsis;
      margin: 0 auto 40px;
    }

    .hero-cta {
      display: inline-flex;
      align-items: center;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 14px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      background: var(--accent);
      color: ${t.bg};
      padding: 14px 36px;
      transition: background 0.2s, transform 0.2s;
    }

    .hero-cta:hover {
      background: var(--accent2);
      transform: translateY(-1px);
    }

    @media (max-width: 768px) {
      .hero-title { font-size: 72px; }
      .hero-tagline { font-size: 18px; white-space: normal; text-overflow: clip; }
      .hero-inner { padding: 0 24px; }
    }

    /* ── Credits ────────────────────────────────────────────────────────── */
    .credits {
      padding: 100px 0;
      background: var(--bg);
    }

    .credits-inner {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 40px;
    }

    .credits-details { list-style: none; }
    .credits-details::marker,
    .credits-details summary::marker,
    .credits-details summary::-webkit-details-marker { display: none; }

    .credits-summary {
      display: flex;
      align-items: center;
      gap: 20px;
      cursor: pointer;
      user-select: none;
      list-style: none;
    }

    .credits-heading {
      margin-bottom: 0;
      color: var(--text);
    }

    .credits-toggle {
      font-family: 'DM Mono', monospace;
      font-size: 20px;
      color: var(--muted);
      line-height: 1;
      transition: color 0.2s, transform 0.2s;
      flex-shrink: 0;
    }

    .credits-details[open] .credits-toggle {
      transform: rotate(45deg);
      color: var(--accent);
    }

    .credits-list {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      margin-top: 32px;
    }

    .credit-name {
      font-family: 'DM Sans', sans-serif;
      font-weight: 300;
      font-size: 15px;
      color: var(--muted);
      letter-spacing: 0.03em;
    }

    .credit-dot {
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      color: var(--muted);
      opacity: 0.4;
    }

    @media (max-width: 768px) {
      .credits { padding: 64px 0; }
      .credits-inner { padding: 0 24px; }
    }

    /* ── Stats ──────────────────────────────────────────────────────────── */
    .stats-band {
      background: var(--bg2);
      border-top: 1px solid var(--border2);
      border-bottom: 1px solid var(--border2);
      padding: 40px 0;
    }

    .stats-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0;
    }

    .stat-block {
      text-align: center;
      padding: 0 48px;
    }

    .stat-text {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 32px;
      line-height: 1;
      color: var(--text);
      letter-spacing: 0.05em;
    }

    .stat-sep {
      width: 1px;
      height: 56px;
      background: var(--border2);
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      .stats-inner { gap: 0; }
      .stat-block { padding: 16px 24px; }
      .stat-sep { display: none; }
    }

    /* ── About ──────────────────────────────────────────────────────────── */
    .about {
      padding: 100px 0;
      background: var(--bg);
    }

    .about-inner {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 40px;
    }

    .about-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 48px;
    }

    .about-grid.has-photo {
      grid-template-columns: 400px 1fr;
      gap: 72px;
      align-items: start;
    }

    .about-text {
      align-self: start;
    }

    .about-photo-wrap {
      position: sticky;
      top: 80px;
    }

    .about-photo {
      width: 100%;
      aspect-ratio: 1 / 1;
      object-fit: cover;
      display: block;
    }

    .about-studio-name {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 48px;
      letter-spacing: 0.03em;
      line-height: 1;
      color: var(--text);
      margin-top: 0;
      margin-bottom: 20px;
    }

    .about-bio {
      font-family: 'DM Sans', sans-serif;
      font-weight: 300;
      font-size: 18px;
      color: var(--text);
      opacity: 0.85;
      line-height: 1.85;
      margin-bottom: 28px;
    }

    .about-badge {
      display: inline-flex;
      align-items: center;
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--accent);
      background: var(--accent-dim);
      border: 1px solid var(--border);
      padding: 6px 14px;
    }

    @media (max-width: 900px) {
      .about-grid.has-photo {
        grid-template-columns: 1fr;
      }
      .about-photo-wrap { position: static; }
      .about-photo { max-width: 340px; }
    }

    @media (max-width: 768px) {
      .about { padding: 64px 0; }
      .about-inner { padding: 0 24px; }
      .about-studio-name { font-size: 36px; }
      .about-bio { font-size: 16px; }
      .about-photo { max-width: 100%; }
    }

    /* ── Work ───────────────────────────────────────────────────────────── */
    .work {
      padding: 100px 0;
      background: var(--bg2);
    }

    .work-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 40px;
    }

    .tracks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .track-card {
      display: flex;
      flex-direction: column;
    }

    .track-embed {
      width: 100%;
      position: relative;
    }

    .sc-iframe {
      width: 100%;
      height: 166px;
      display: block;
      border: 0;
      background: var(--bg3);
    }

    .track-title {
      font-family: 'DM Sans', sans-serif;
      font-weight: 500;
      font-size: 14px;
      color: var(--text);
      margin-top: 12px;
      line-height: 1.4;
    }

    .track-genre {
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--muted);
      margin-top: 4px;
    }

    @media (max-width: 768px) {
      .work { padding: 64px 0; }
      .work-inner { padding: 0 24px; }
      .tracks-grid { grid-template-columns: 1fr; }
    }

    /* ── Services ───────────────────────────────────────────────────────── */
    .services {
      padding: 100px 0;
      background: var(--bg);
    }

    .services-inner {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 40px;
    }

    .services-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 64px;
      align-items: start;
    }

    .services-cards {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .service-card {
      background: var(--bg2);
      border: 1px solid var(--border2);
      padding: 24px 28px;
      transition: border-color 0.2s;
    }

    .service-card.compact {
      padding: 16px 20px;
    }

    .service-card:hover { border-color: var(--border); }

    .service-name {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 26px;
      letter-spacing: 0.04em;
      color: var(--text);
      margin-bottom: 6px;
      line-height: 1;
    }

    .service-card.compact .service-name {
      font-size: 20px;
    }

    .service-price {
      font-family: 'DM Mono', monospace;
      font-size: 13px;
      font-weight: 500;
      color: var(--accent);
      margin-bottom: 10px;
      letter-spacing: 0.05em;
    }

    .service-desc {
      font-family: 'DM Sans', sans-serif;
      font-weight: 300;
      font-size: 13px;
      color: var(--text);
      line-height: 1.75;
      opacity: 0.75;
    }

    .service-card.compact .service-desc {
      font-size: 12px;
    }

    .services-ethos-col {
      position: sticky;
      top: 80px;
    }

    .services-ethos-text {
      font-family: 'DM Sans', sans-serif;
      font-weight: 300;
      font-size: 17px;
      color: var(--text);
      line-height: 1.9;
      white-space: pre-line;
    }

    /* Production card */
    .production-card {
      border-left: 3px solid var(--accent);
    }

    .production-card-inner {
      background: var(--bg2);
      padding: 40px;
    }

    .production-card-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 36px;
      letter-spacing: 0.04em;
      color: var(--accent);
      margin-bottom: 16px;
      line-height: 1;
    }

    .production-card-body {
      font-family: 'DM Sans', sans-serif;
      font-weight: 300;
      font-size: 15px;
      color: var(--muted2);
      line-height: 1.8;
      margin-bottom: 16px;
      max-width: 600px;
    }

    .production-card-body:last-of-type { margin-bottom: 32px; }

    .production-cta {
      display: inline-flex;
      align-items: center;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 14px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      background: var(--accent);
      color: ${t.bg};
      padding: 14px 32px;
      transition: background 0.2s;
    }

    .production-cta:hover { background: var(--accent2); }

    @media (max-width: 768px) {
      .services { padding: 64px 0; }
      .services-inner { padding: 0 24px; }
      .services-layout { grid-template-columns: 1fr; gap: 40px; }
      .services-ethos-col { position: static; }
      .production-card-inner { padding: 28px 24px; }
    }

    /* ── Contact ────────────────────────────────────────────────────────── */
    .contact {
      padding: 100px 0;
      background: var(--bg2);
    }

    .contact-inner {
      max-width: 640px;
      margin: 0 auto;
      padding: 0 40px;
      text-align: center;
    }

    .contact-inner .section-eyebrow {
      justify-content: center;
    }

    .contact-inner .section-eyebrow::before { display: none; }

    /* Contact form */
    .contact-form { text-align: left; }

    .form-group { margin-bottom: 20px; }

    .form-label {
      display: block;
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--muted2);
      margin-bottom: 8px;
    }

    .form-input {
      width: 100%;
      background: var(--bg3);
      border: 1px solid var(--border2);
      color: var(--text);
      font-family: 'DM Sans', sans-serif;
      font-size: 15px;
      font-weight: 300;
      padding: 14px 18px;
      outline: none;
      transition: border-color 0.2s, background 0.2s;
      -webkit-appearance: none;
      border-radius: 0;
    }

    .form-input:focus {
      border-color: var(--accent);
      background: var(--bg);
    }

    .form-input::placeholder { color: var(--muted); font-style: italic; }

    .form-textarea { height: 140px; resize: vertical; }

    .form-submit {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 15px;
      letter-spacing: 0.18em;
      background: var(--accent);
      color: ${t.bg};
      border: none;
      padding: 14px 40px;
      cursor: pointer;
      transition: background 0.2s;
      display: inline-flex;
      align-items: center;
      margin-top: 8px;
    }

    .form-submit:hover { background: var(--accent2); }

    /* Email display */
    .contact-email-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      margin-bottom: 40px;
    }

    .contact-email-address {
      font-family: 'DM Mono', monospace;
      font-size: clamp(14px, 3vw, 22px);
      color: var(--text);
      letter-spacing: 0.05em;
      word-break: break-all;
    }

    .contact-mailto-btn {
      display: inline-flex;
      align-items: center;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 14px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      background: var(--accent);
      color: ${t.bg};
      padding: 14px 32px;
      transition: background 0.2s;
    }

    .contact-mailto-btn:hover { background: var(--accent2); }

    /* Social links */
    .contact-socials {
      margin-top: 40px;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 4px;
    }

    .contact-social-link {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--accent);
      transition: opacity 0.2s;
      padding: 4px 0;
    }

    .contact-social-link:hover { opacity: 0.7; }

    .social-sep {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      color: var(--muted);
      user-select: none;
    }

    @media (max-width: 768px) {
      .contact { padding: 64px 0; }
      .contact-inner { padding: 0 24px; }
    }

    /* ── Footer ─────────────────────────────────────────────────────────── */
    .site-footer {
      height: 60px;
      background: var(--bg2);
      border-top: 1px solid var(--border2);
      display: flex;
      align-items: center;
    }

    .footer-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 40px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .footer-studio {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.1em;
      color: var(--muted);
    }

    .footer-credit {
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.08em;
      color: var(--muted);
    }

    .footer-credit a {
      color: var(--muted);
      transition: color 0.2s;
    }

    .footer-credit a:hover { color: var(--accent); }

    @media (max-width: 640px) {
      .footer-inner { padding: 0 24px; }
      .footer-studio { display: none; }
    }
  `;

  // ── HTML Injections ───────────────────────────────────────────────────────
  const htmlInjections = Array.isArray(data.htmlInjections) ? data.htmlInjections : [];
  function withInjections(sectionHtml, sectionId) {
    if (!sectionHtml) return sectionHtml;
    const matches = htmlInjections.filter(inj => inj.insertAfter === sectionId);
    return sectionHtml + matches.map(inj => inj.html).join('');
  }

  // ── Full document ─────────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(studioName)}${data.tagline ? ' — ' + escHtml(data.tagline) : ''}</title>
<meta name="description" content="${escHtml(data.tagline || typeLabel + ' — ' + studioName)}">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='${encodeURIComponent(t.bg)}'/%3E%3Ccircle cx='16' cy='16' r='8' fill='none' stroke='${encodeURIComponent(t.accent)}' stroke-width='2.5'/%3E%3Ccircle cx='16' cy='16' r='3' fill='${encodeURIComponent(t.accent)}'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&family=DM+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:wght@300;400;600&family=Space+Grotesk:wght@300;400;500;700&family=Space+Mono:wght@400;700&family=Anton&display=swap" rel="stylesheet">
<style>${css}${getLayoutCss(data.layoutStyle, t)}${data.customCss ? '\n/* Custom Tweaks */\n' + data.customCss : ''}</style>
</head>
<body>
${navHtml}
${withInjections(heroHtml, '#hero')}
${withInjections(aboutHtml, '#about')}
${withInjections(creditsHtml, '#credits')}
${withInjections(workHtml, '#work')}
${withInjections(servicesHtml, '#services')}
${withInjections(statsHtml, '#stats')}
${withInjections(contactHtml, '#contact')}
${footerHtml}
</body>
</html>`;
}
