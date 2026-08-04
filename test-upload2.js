import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
fs.writeFileSync('/tmp/test.txt', 'hello world');
async function run() {
  const ai = new GoogleGenAI({ apiKey: 'YOUR_KEY_HERE' });
  try {
    const file = await ai.files.upload({ file: '/tmp/test.txt', mimeType: 'text/plain' });
    console.log("Success:", file.name);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();
