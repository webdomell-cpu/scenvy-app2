const fs = require('fs');

const apps = [
  { id: 'scenvy', color: '#8B5CF6', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' }, // shield
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
