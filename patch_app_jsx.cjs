const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf-8');

content = content.replace(
  "userEmail === 'web.domell@gmail.com'",
  "userEmail === 'web.domell@gmail.com' || userEmail === 'web.domain@gmail.com'"
);

fs.writeFileSync('src/App.jsx', content);
