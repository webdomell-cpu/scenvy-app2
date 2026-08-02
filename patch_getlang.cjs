const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.jsx', 'utf-8');

// Remove ScenvyHeroShowcase from Landing.jsx
content = content.replace("<ScenvyHeroShowcase />", "");

// Increase size of module icons
content = content.replace("size={126}", "size={189}");

// Fix getLangText implementation
const badGetLang = `  const getLangText = (key, defaultDe, defaultEn) => {
    let raw = landingConfig[key] || defaultDe;
    // Handle old localstorage caching english by default
    const enToDeMap = {
      '🔥 New: AI Menu Reel Generator v2 is live!': '🔥 Neu: AI Speisekarten-Reel Generator v2 ist live!',
      '🚀 The New Standard for Digital Hospitality is Live!': '🚀 Der neue Standard für digitale Gastronomie ist live!',
      'Book Demo': 'Demo buchen',
      'THE OPERATING SYSTEM FOR': 'DAS BETRIEBSSYSTEM FÜR',
      'Modern Hospitality': 'Moderne Gastronomie',
      'Create, manage and distribute digital experiences across every touchpoint.': 'Erstelle, verwalte und verteile digitale Erlebnisse an jedem Berührungspunkt.',
      'Live Preview': 'Live Vorschau',
      'Start for free': 'Kostenlos starten',
      'See demo': 'Demo ansehen'
    }
    if (lang === 'de' && enToDeMap[raw]) {
      raw = enToDeMap[raw];
    }

    if (lang === 'en') {
      if (landingConfig[\`\${key}_en\`]) return landingConfig[\`\${key}_en\`]
      const deToEnMap = {
        '🔥 Neu: AI Speisekarten-Reel Generator v2 ist live!': '🔥 New: AI Menu Reel Generator v2 is live!',
        '🚀 Der neue Standard für digitale Gastronomie ist live!': '🚀 The New Standard for Digital Hospitality is Live!',
        'Demo buchen': 'Book Demo',
        'DAS BETRIEBSSYSTEM FÜR': 'THE OPERATING SYSTEM FOR',
        'Moderne Gastronomie': 'Modern Hospitality',
        'Erstelle, verwalte und verteile digitale Erlebnisse an jedem Berührungspunkt.': 'Create, manage and distribute digital experiences across every touchpoint.',
        'Live Vorschau': 'Live Preview',
        'Kostenlos starten': 'Start for free',
        'Demo ansehen': 'See demo'
      }
      return deToEnMap[raw] || defaultEn || raw
    }
    return raw || defaultDe
  }`;

const goodGetLang = `  const getLangText = (key, defaultDe, defaultEn) => {
    // Determine the desired string based on language
    let text = lang === 'en' ? defaultEn : defaultDe;
    
    // Check if the user has overridden it in landingConfig
    if (lang === 'de' && landingConfig[key] && landingConfig[key] !== defaultEn && landingConfig[key] !== 'The Operating System for') {
       text = landingConfig[key];
    } else if (lang === 'en' && landingConfig[\`\${key}_en\`]) {
       text = landingConfig[\`\${key}_en\`];
    }
    
    return text;
  }`;

content = content.replace(badGetLang, goodGetLang);

fs.writeFileSync('src/pages/Landing.jsx', content);
