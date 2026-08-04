import { GoogleGenAI } from '@google/genai';
const files = new GoogleGenAI({apiKey:'dummy'}).files;
let props = [];
for (let p in files) props.push(p);
console.log(props);
