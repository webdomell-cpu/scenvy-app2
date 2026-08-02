const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.jsx', 'utf-8');

content = content.replace(
  "{landingConfig.hero_btn_primary_text}",
  "{getLangText('hero_btn_primary_text', 'Demo buchen', 'Book Demo')}"
);
content = content.replace(
  "{landingConfig.hero_btn_secondary_text}",
  "{getLangText('hero_btn_secondary_text', 'Live Vorschau', 'Live Preview')}"
);

fs.writeFileSync('src/pages/Landing.jsx', content);
