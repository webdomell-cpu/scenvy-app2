const fs = require('fs');
const svgs = [
  { name: 'board', color: '#38BDF8' },
  { name: 'flow', color: '#818CF8' },
  { name: 'host', color: '#FB7185' },
  { name: 'link', color: '#34D399' },
  { name: 'magic', color: '#C084FC' },
  { name: 'menu', color: '#FBBF24' },
  { name: 'store', color: '#38BDF8' },
];

svgs.forEach(s => {
  const content = `<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" rx="64" fill="${s.color}" />
</svg>`;
  fs.writeFileSync(`/app/applet/public/scenvy_${s.name}.svg`, content);
});
console.log('Square SVGs generated!');
