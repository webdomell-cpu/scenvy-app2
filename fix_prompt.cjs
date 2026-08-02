const fs = require('fs');
let text = fs.readFileSync('api/ai/parse-menu.js', 'utf8');

const start = text.indexOf('    const promptText = `') + 24;
const end = text.indexOf('`', start);

const newPrompt = "You are an expert AI Restaurant Menu Specialist for SCENVY.\n" +
"Convert the provided restaurant menu document (PDF, image, or text) into a complete, high-quality structured JSON menu package.\n" +
"CRITICAL CONVERSION MINIMUM STANDARD REQUIREMENTS:\n" +
"1. Complete Extraction: Extract EVERY SINGLE category, dish item, description, price, multi-size option, variant box, allergen, and dietary indicator present in the PDF/image. DO NOT omit or skip items. Take your time and extract all dishes.\n" +
"2. Contact & Branding Extraction: Extract venue contact details ONLY from the document. DO NOT make up random emails, numbers or instagram handles. If not present, leave as empty strings \"\".\n" +
"   - Restaurant Name -> \"branding.name\"\n" +
"   - Email -> \"branding.email\"\n" +
"   - Phone -> \"branding.phone\"\n" +
"   - WhatsApp -> \"branding.whatsapp\"\n" +
"   - Address -> \"branding.address\"\n" +
"   - Instagram handle -> \"branding.instagram\"\n" +
"3. Pricing & Variants (Multi-Column & Sizes):\n" +
"   - Extract standard prices (e.g. \"12.50 €\").\n" +
"   - Extract variant option boxes into the \"variants\" array: [{ \"name\": \"Option\", \"price\": \"...\" }].\n" +
"4. Allergens & Dietary Indicators:\n" +
"   - \"allergens\": Array of allergen codes\n" +
"   - \"diet\": Array of diet tags [\"vegan\", \"vegetarian\", \"glutenfree\", \"halal\"]\n" +
"5. Group dishes logically into categories with appropriate emojis.\n" +
"6. Original Language Only: Extract names and descriptions EXACTLY in the language they appear in the document (e.g., German if the PDF is German). Produce simple strings for names and descriptions, not objects.\n" +
"7. Provide a complete \"allergensLegend\" dictionary for all extracted allergen codes.\n" +
"\n" +
"Return strictly JSON matching this structure:\n" +
"{\n" +
"  \"branding\": {\n" +
"    \"name\": \"Extracted Restaurant Name or empty\",\n" +
"    \"email\": \"Extracted email or empty\",\n" +
"    \"style\": \"fine_dining\",\n" +
"    \"primaryColor\": \"${primaryColor || '#7C3AED'}\",\n" +
"    \"secondaryColor\": \"${secondaryColor || '#FF2D8D'}\",\n" +
"    \"phone\": \"Extracted phone or empty\",\n" +
"    \"whatsapp\": \"Extracted whatsapp or empty\",\n" +
"    \"address\": \"Extracted address or empty\",\n" +
"    \"instagram\": \"Extracted instagram or empty\"\n" +
"  },\n" +
"  \"categories\": [\n" +
"    {\n" +
"      \"id\": \"cat_1\",\n" +
"      \"name\": \"Category Name\",\n" +
"      \"icon\": \"emoji\",\n" +
"      \"items\": [\n" +
"        {\n" +
"          \"id\": \"item_1\",\n" +
"          \"name\": \"Dish Name\",\n" +
"          \"description\": \"Dish Description\",\n" +
"          \"price\": \"12.50 €\",\n" +
"          \"variants\": [\n" +
"            { \"name\": \"8oz / Veg\", \"price\": \"4.50 €\" }\n" +
"          ],\n" +
"          \"allergens\": [\"A\", \"G\"],\n" +
"          \"diet\": [\"vegan\", \"vegetarian\"],\n" +
"          \"highlight\": true,\n" +
"          \"imageUrl\": \"\"\n" +
"        }\n" +
"      ]\n" +
"    }\n" +
"  ],\n" +
"  \"allergensLegend\": {\n" +
"    \"A\": \"Glutenhaltiges Getreide / Cereals containing gluten\",\n" +
"    \"G\": \"Milch & Laktose / Milk & Lactose\"\n" +
"  }\n" +
"}\n" +
"Raw Input Context:\n" +
"\"\"\"${rawInput.slice(0, 15000)}\"\"\"";

text = text.substring(0, start) + newPrompt + text.substring(end);
fs.writeFileSync('api/ai/parse-menu.js', text);
