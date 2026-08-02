const fs = require('fs');

const svgs = [
  { name: 'board', title: 'SCENVY BOARD', sub: 'Digital Signage', color: '#38BDF8' },
  { name: 'flow', title: 'SCENVY FLOW', sub: 'Workflow Automation', color: '#818CF8' },
  { name: 'host', title: 'SCENVY HOST', sub: 'Guest Experience', color: '#FB7185' },
  { name: 'link', title: 'SCENVY LINK', sub: 'Smart Links', color: '#34D399' },
  { name: 'magic', title: 'SCENVY MAGIC', sub: 'AI Automation', color: '#C084FC' },
  { name: 'menu', title: 'SCENVY MENU', sub: 'Digital Menu', color: '#FBBF24' },
  { name: 'store', title: 'SCENVY STORE', sub: 'Digital Storefront', color: '#38BDF8' },
];

svgs.forEach(s => {
  const content = `<svg width="800" height="240" viewBox="0 0 800 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="800" height="240" fill="#0B0F14" />
  <rect x="64" y="64" width="112" height="112" rx="28" fill="${s.color}" />
  <text x="210" y="124" font-family="'Inter', sans-serif, system-ui" font-weight="900" font-size="52" fill="#FFFFFF" letter-spacing="1">${s.title}</text>
  <text x="210" y="168" font-family="'Inter', sans-serif, system-ui" font-weight="400" font-size="28" fill="#94A3B8">${s.sub}</text>
</svg>`;
  fs.writeFileSync(`/app/applet/public/scenvy_${s.name}.svg`, content);
});
console.log('SVGs generated!');
