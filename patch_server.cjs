const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf8');

text = text.replace(/const PORT = process.env.PORT \? parseInt\(process.env.PORT, 10\) : 3000/g, 'const PORT = 3000');
text = text.replace(/const PORT = process\.env\.PORT \|\| 3000/g, 'const PORT = 3000');

fs.writeFileSync('server.ts', text);
