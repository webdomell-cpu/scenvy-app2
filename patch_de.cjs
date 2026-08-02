const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.jsx', 'utf-8');

content = content.replace(
  "{getLangText('hero_kicker', 'The Operating System for', 'The Operating System for')}",
  "{getLangText('hero_kicker', 'DAS BETRIEBSSYSTEM FÜR', 'THE OPERATING SYSTEM FOR')}"
);
content = content.replace(
  "{getLangText('hero_title_highlight', 'Modern Hospitality', 'Modern Hospitality')}",
  "{getLangText('hero_title_highlight', 'Moderne Gastronomie', 'Modern Hospitality')}"
);
content = content.replace(
  "{getLangText('hero_subtitle', 'Create, manage and distribute digital experiences across every touchpoint.', 'Create, manage and distribute digital experiences across every touchpoint.')}",
  "{getLangText('hero_subtitle', 'Erstelle, verwalte und verteile digitale Erlebnisse an jedem Berührungspunkt.', 'Create, manage and distribute digital experiences across every touchpoint.')}"
);

// Also remove Scenvy Main from the bottom App Icons Grid as requested by the user
const oldGrid = `                {[
                  { id: 'scenvy', name: 'Scenvy Main' },
                  { id: 'flow', name: 'Flow' },
                  { id: 'menu', name: 'Menu' },
                  { id: 'board', name: 'Board' },
                  { id: 'host', name: 'Host' },
                  { id: 'link', name: 'Link' },
                  { id: 'store', name: 'Store' },
                  { id: 'magic', name: 'Magic' }
                ].map((m) => (`;

const newGrid = `                {[
                  { id: 'flow', name: 'Flow' },
                  { id: 'menu', name: 'Menu' },
                  { id: 'board', name: 'Board' },
                  { id: 'host', name: 'Host' },
                  { id: 'link', name: 'Link' },
                  { id: 'store', name: 'Store' },
                  { id: 'magic', name: 'Magic' }
                ].map((m) => (`;

content = content.replace(oldGrid, newGrid);

fs.writeFileSync('src/pages/Landing.jsx', content);
