const fs = require('fs');

const modules = [
  { id: 'flow', name: 'FLOW', sub: 'Content Feed', p: '#8B5CF6', s: '#6366F1', bg: '#0F172A', icon: 'M85 65 L140 100 L85 135 Z' },
  { id: 'menu', name: 'MENU', sub: 'Digital Menus', p: '#F97316', s: '#EA580C', bg: '#180B04', icon: 'M50 70 L150 70 M50 100 L150 100 M50 130 L150 130' },
  { id: 'board', name: 'BOARD', sub: 'Digital Signage', p: '#3B82F6', s: '#1D4ED8', bg: '#0A1220', icon: 'M40 60 H160 V140 H40 Z' },
  { id: 'host', name: 'HOST', sub: 'Guest Experience', p: '#10B981', s: '#047857', bg: '#051810', icon: 'M100 50 A 25 25 0 1 0 100 100 A 25 25 0 1 0 100 50 M40 160 Q 100 90 160 160' },
  { id: 'link', name: 'LINK', sub: 'NFC & QR Solutions', p: '#06B6D4', s: '#0284C7', bg: '#05161E', icon: 'M70 100 A 30 30 0 1 1 70 160 M130 100 A 30 30 0 1 0 130 160 M80 130 H120' },
  { id: 'store', name: 'STORE', sub: 'Hardware & More', p: '#64748B', s: '#334155', bg: '#0A0E15', icon: 'M60 70 H140 L160 160 H40 Z M80 70 A 20 20 0 0 1 120 70' },
  { id: 'magic', name: 'MAGIC', sub: 'AI Automation', p: '#A855F7', s: '#C026D3', bg: '#16051D', icon: 'M100 40 L110 74 L146 74 L116 96 L128 130 L100 110 L72 130 L84 96 L54 74 L90 74 Z' }
];

modules.forEach(m => {
  const content = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="scenvy${m.id}Title">
  <title id="scenvy${m.id}Title">SCENVY ${m.name}</title>
  <defs>
    <linearGradient id="scenvy_${m.id}_bgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${m.bg}"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="scenvy_${m.id}_accentGrad" x1="60" y1="60" x2="452" y2="452" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${m.p}"/>
      <stop offset="100%" stop-color="${m.s}"/>
    </linearGradient>
    <filter id="scenvy_${m.id}_glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <rect width="512" height="512" rx="96" fill="url(#scenvy_${m.id}_bgGrad)"/>
  <rect x="2" y="2" width="508" height="508" rx="94" stroke="url(#scenvy_${m.id}_accentGrad)" stroke-width="3" stroke-opacity="0.4" fill="none"/>
  
  <circle cx="256" cy="180" r="140" fill="url(#scenvy_${m.id}_accentGrad)" opacity="0.22" filter="url(#scenvy_${m.id}_glow)"/>
  
  <g transform="translate(156, 80)">
    <rect x="0" y="0" width="200" height="200" rx="48" fill="url(#scenvy_${m.id}_accentGrad)"/>
    <rect x="6" y="6" width="188" height="188" rx="42" fill="${m.bg}" fill-opacity="0.85"/>
    <path d="${m.icon}" fill="none" stroke="url(#scenvy_${m.id}_accentGrad)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  
  <text x="256" y="370" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="64" fill="#FFFFFF" letter-spacing="3">
    SCENVY
  </text>
  <text x="256" y="425" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="44" fill="${m.s}" letter-spacing="6">
    ${m.name}
  </text>
  <text x="256" y="465" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="24" fill="#94A3B8" letter-spacing="2">
    ${m.sub.replace('&', '&amp;')}
  </text>
</svg>`;
  fs.writeFileSync('public/scenvy_' + m.id + '.svg', content);
});

console.log('Done SVG generation');
