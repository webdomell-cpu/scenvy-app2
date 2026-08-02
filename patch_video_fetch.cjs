const fs = require('fs');
let content = fs.readFileSync('api/ai/generate.js', 'utf-8');

content = content.replace(
  "imageUrl = await executeAiTask(async (ai) => {",
  "imageUrl = await executeAiTask(async (ai, currentKeyObj) => {"
);

content = content.replace(
  "const videoRes = await fetch(uri, { headers: { 'x-goog-api-key': ai.apiKey || process.env.GEMINI_API_KEY } });",
  "const videoRes = await fetch(uri, { headers: { 'x-goog-api-key': currentKeyObj.apiKey || process.env.GEMINI_API_KEY } });"
);

fs.writeFileSync('api/ai/generate.js', content);
