const fs = require('fs');
let content = fs.readFileSync('firestore.rules', 'utf-8');

content = content.replace(
  "request.auth.token.email == 'web.domell@gmail.com' || request.auth.token.email == 'web.domain@gmail.com'",
  "request.auth.token.email.lower() == 'web.domell@gmail.com' || request.auth.token.email.lower() == 'web.domain@gmail.com'"
);
content = content.replace(
  "request.auth.token.email == 'admin@scenvy.de'",
  "request.auth.token.email.lower() == 'admin@scenvy.de'"
);

fs.writeFileSync('firestore.rules', content);
