import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
const ai = new GoogleGenAI();
fs.writeFileSync('/tmp/test.txt', 'hello world');
async function run() {
  try {
    const file = await ai.files.upload({ file: '/tmp/test.txt', mimeType: 'text/plain' });
    console.log("Success:", file.name);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
