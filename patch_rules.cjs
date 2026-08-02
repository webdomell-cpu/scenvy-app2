const fs = require('fs');
let content = fs.readFileSync('firestore.rules', 'utf-8');

content = content.replace(
  "request.auth.token.email == 'web.domell@gmail.com'",
  "request.auth.token.email == 'web.domell@gmail.com' || request.auth.token.email == 'web.domain@gmail.com'"
);

fs.writeFileSync('firestore.rules', content);
