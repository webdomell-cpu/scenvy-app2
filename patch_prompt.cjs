const fs = require('fs');
let content = fs.readFileSync('api/ai/parse-menu.js', 'utf-8');

const oldPrompt = "    const promptText = `You are an expert AI Restaurant Menu Specialist for SCENVY.";
const newPrompt = "    const promptText = `You are an expert AI Restaurant Menu Specialist for SCENVY.";

// Just rewrite the whole try block
const oldTryBlock = content.substring(content.indexOf('try {'), content.indexOf('    const parsed = await executeAiTask(async (ai) => {'));

const newTryBlock = \`try {
    const promptText = \\\`You are an expert AI Restaurant Menu Specialist for SCENVY.
Convert the provided restaurant menu document (PDF, image, or text) into a complete, high-quality structured JSON menu package.

CRITICAL CONVERSION MINIMUM STANDARD REQUIREMENTS:
1. Complete Extraction: Extract EVERY SINGLE category, dish item, description, price, multi-size option, variant box, allergen, and dietary indicator present in the PDF/image. DO NOT omit or skip items. Take your time and be exhaustive.
2. Contact & Branding Extraction: Extract venue contact details from the header or footer of the document if present. If you cannot find them in the document, leave them EMPTY (do not make them up). Only use the provided hints if they are present in the document.
   - Restaurant Name -> "branding.name"
   - Email -> "branding.email" 
   - Phone -> "branding.phone"
   - WhatsApp -> "branding.whatsapp"
   - Address -> "branding.address"
   - Instagram handle -> "branding.instagram"
3. Pricing & Variants (Multi-Column & Sizes):
   - Extract standard prices (e.g. "12.50 €").
   - Extract 2-Column / Multi-Size pricing (e.g. 8oz / 12oz, S / L) or variant option boxes into the "variants" array.
4. Allergens & Dietary Indicators:
   - "allergens": Array of allergen codes [A, B, C, D, E, F, G, H, L, M, N, O, P, R]
   - "diet": Array of diet tags ["vegan", "vegetarian", "glutenfree", "halal"]
5. Group dishes logically into categories with appropriate emojis.
6. Single Language: Extract names and descriptions EXACTLY in the language they appear in the document. DO NOT translate to a second language. 
7. Provide a complete "allergensLegend" dictionary for all extracted allergen codes.

Return strictly JSON matching this structure:
{
  "branding": {
    "name": "Restaurant Name from PDF",
    "email": "email from PDF or empty string",
    "style": "fine_dining",
    "primaryColor": "#7C3AED",
    "secondaryColor": "#FF2D8D",
    "phone": "phone from PDF or empty string",
    "whatsapp": "whatsapp from PDF or empty string",
    "address": "address from PDF or empty string",
    "instagram": "instagram from PDF or empty string"
  },
  "categories": [
    {
      "id": "cat_1",
      "name": "Category Name",
      "icon": "emoji",
      "items": [
        {
          "id": "item_1",
          "name": "Dish Name",
          "description": "Dish Description",
          "price": "12.50 €",
          "variants": [
            { "name": "8oz", "price": "4.50 €" }
          ],
          "allergens": ["A", "G"],
          "diet": ["vegan", "vegetarian"],
          "highlight": true,
          "imageUrl": ""
        }
      ]
    }
  ],
  "allergensLegend": {
    "A": "Glutenhaltiges Getreide / Cereals containing gluten",
    "G": "Milch & Laktose / Milk & Lactose"
  }
}

Raw Input Context:
"""\${rawInput.slice(0, 15000)}"""\\\`
\`;

content = content.replace(oldTryBlock, newTryBlock);

// Replace model gemini-3.6-flash with gemini-1.5-pro
content = content.replace(/model: 'gemini-3\.6-flash'/g, "model: 'gemini-1.5-pro'");

fs.writeFileSync('api/ai/parse-menu.js', content);
