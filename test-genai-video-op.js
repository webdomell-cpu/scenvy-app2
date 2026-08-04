import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({apiKey:'dummy'});
const op = ai.models.generateVideos({model:'veo-2.0-generate-preview', prompt:'hello', config: { numberOfVideos:1 }});
console.log(Object.getPrototypeOf(op));
