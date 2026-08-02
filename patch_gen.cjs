const fs = require('fs');
let content = fs.readFileSync('api/ai/generate.js', 'utf-8');

content = content.replace(
  /imageSize:\s*"1K"/,
  "/* imageSize removed */"
);

fs.writeFileSync('api/ai/generate.js', content);
