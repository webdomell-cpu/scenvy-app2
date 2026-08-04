import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({apiKey:'dummy'});
let props = [];
for (let p in ai) props.push(p);
console.log("ai props:", props);
let opProps = [];
if (ai.operations) for (let p in ai.operations) opProps.push(p);
console.log("operations props:", opProps);
