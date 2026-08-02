const fs = require('fs');

const apps = [
  { id: 'board', color: '#38BDF8', icon: 'M4 6h16v12H4z M9 22h6 M12 18v4' },
  { id: 'flow', color: '#818CF8', icon: 'M12 4v16 M4 12h16 M5 5l14 14 M5 19L19 5' }, // simple abstract
  { id: 'host', color: '#FB7185', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' }, // user
  { id: 'link', color: '#34D399', icon: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' }, // link
  { id: 'magic', color: '#C084FC', icon: 'M21 16.05A7 7 0 0 1 12 3 M21 16.05A7 7 0 0 0 12 21 M12 21a7 7 0 0 1-9-4.95 M12 3a7 7 0 0 0-9 4.95 M12 12l.01.01' }, // magic
  { id: 'menu', color: '#FBBF24', icon: 'M4 6h16 M4 12h16 M4 18h16' }, // menu
  { id: 'store', color: '#38BDF8', icon: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0' }, // bag
];

apps.forEach(a => {
  const content = `<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" rx="64" fill="${a.color}" />
  <rect x="12" y="12" width="232" height="232" rx="52" stroke="white" stroke-opacity="0.2" stroke-width="2" />
  <path d="${a.icon}" stroke="white" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" transform="scale(5) translate(13, 13)" />
</svg>`;
  fs.writeFileSync('public/scenvy_' + a.id + '.svg', content);
});

console.log('Done');
