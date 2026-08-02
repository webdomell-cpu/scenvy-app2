const fs = require('fs');
let text = fs.readFileSync('api/ai/parse-menu.js', 'utf8');

const target1 = `1. Complete Extraction: Extract EVERY SINGLE category, dish item, description, price, multi-size option, variant box, allergen, and dietary indicator present in the PDF/image. DO NOT omit or skip items. Take your time and extract all dishes.`;
const replacement1 = `1. Complete Extraction: This document may contain multiple pages (e.g. 20+ pages). You MUST process the ENTIRE document from start to finish. Extract EVERY SINGLE category, EVERY SINGLE dish item, description, price, multi-size option, variant box, allergen, and dietary indicator. DO NOT omit, skip, or group items. DO NOT truncate the output. If there are 150 items, you must output exactly 150 items.`;

text = text.replace(target1, replacement1);

// Add maxOutputTokens and systemInstruction
const target2 = `        model: 'gemini-1.5-pro',
        contents,
        config: { responseMimeType: 'application/json' }`;
const replacement2 = `        model: 'gemini-1.5-pro',
        contents,
        config: { 
          responseMimeType: 'application/json',
          maxOutputTokens: 8192
        }`;

text = text.replace(target2, replacement2);

fs.writeFileSync('api/ai/parse-menu.js', text);
