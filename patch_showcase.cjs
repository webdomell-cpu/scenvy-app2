const fs = require('fs');
let content = fs.readFileSync('src/components/ScenvyBrandShowcase.jsx', 'utf-8');

content = content.replace(
  "export function ScenvyPhoneMockup({ module = 'flow', size = 'normal', active = false }) {",
  "export function ScenvyPhoneMockup({ module = 'flow', size = 'normal', active = false, lang = 'de' }) {"
);

const oldGetSubtext = `  const getSubtext = () => {
    switch (module) {
      case 'scenvy': return 'Connect. Engage. Elevate.'
      case 'flow': return 'VERTICAL CONTENT REELS'
      case 'menu': return 'INTERACTIVE DIGITAL MENU'
      case 'board': return 'SMART DIGITAL SIGNAGE'
      case 'host': return 'GUEST EXPERIENCE & STAY'
      case 'link': return 'NFC & SMART QR CONNECT'
      case 'store': return 'HARDWARE & KIOSKS'
      case 'magic': return 'AI CONTENT AUTOMATION'
      default: return 'HOSPITALITY ECOSYSTEM'
    }
  }`;

const newGetSubtext = `  const getSubtext = () => {
    const isDe = lang === 'de';
    switch (module) {
      case 'scenvy': return isDe ? 'Verbinden. Binden. Bereichern.' : 'Connect. Engage. Elevate.'
      case 'flow': return isDe ? 'VERTIKALE CONTENT REELS' : 'VERTICAL CONTENT REELS'
      case 'menu': return isDe ? 'INTERAKTIVE DIGITALE MENÜS' : 'INTERACTIVE DIGITAL MENU'
      case 'board': return isDe ? 'SMART DIGITAL SIGNAGE' : 'SMART DIGITAL SIGNAGE'
      case 'host': return isDe ? 'GÄSTEERLEBNIS & STAY' : 'GUEST EXPERIENCE & STAY'
      case 'link': return isDe ? 'NFC & SMART QR CONNECT' : 'NFC & SMART QR CONNECT'
      case 'store': return isDe ? 'HARDWARE & KIOSKE' : 'HARDWARE & KIOSKS'
      case 'magic': return isDe ? 'KI CONTENT AUTOMATISIERUNG' : 'AI CONTENT AUTOMATION'
      default: return isDe ? 'HOSPITALITY ÖKOSYSTEM' : 'HOSPITALITY ECOSYSTEM'
    }
  }`;

content = content.replace(oldGetSubtext, newGetSubtext);
fs.writeFileSync('src/components/ScenvyBrandShowcase.jsx', content);

let landingContent = fs.readFileSync('src/pages/Landing.jsx', 'utf-8');
landingContent = landingContent.replace(
  /<ScenvyPhoneMockup module={mod} size="normal" \/>/g,
  "<ScenvyPhoneMockup module={mod} size=\"normal\" lang={lang} />"
);
fs.writeFileSync('src/pages/Landing.jsx', landingContent);
