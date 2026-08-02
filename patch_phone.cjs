const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.jsx', 'utf-8');

content = content.replace(
  "<Phone size=\"small\"/>",
  "<Phone size=\"small\" lang={lang}/>"
);

fs.writeFileSync('src/pages/Landing.jsx', content);
