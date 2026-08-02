const fs = require('fs');
let text = fs.readFileSync('api/ai/parse-menu.js', 'utf8');

const targetStr = \`    const promptText = \\\`You are an expert AI Restaurant Menu Specialist for SCENVY.
Convert the provided restaurant menu document (PDF, image, or text) into a complete, high-quality structured JSON menu package.
CRITICAL CONVERSION MINIMUM STANDARD REQUIREMENTS:
1. Complete Extraction: Extract EVERY SINGLE category, dish item, description, price, multi-size option, variant box, allergen, and dietary indicator present in the PDF/image. DO NOT omit or skip items.
2. Contact & Branding Extraction: Extract or infer venue contact details from the header or footer of the document if present:
   - Restaurant Name -> "branding.name"
   - Email -> "branding.email" (e.g. "info@restaurant.com")
   - Phone -> "branding.phone"
   - WhatsApp -> "branding.whatsapp"
   - Address -> "branding.address"
   - Instagram handle -> "branding.instagram"
3. Pricing & Variants (Multi-Column & Sizes):
   - Extract standard prices (e.g. "12.50 €").
   - Extract 2-Column / Multi-Size pricing (e.g. 8oz / 12oz, S / L) or variant option boxes (e.g. Non-Veg / Veg, Pasta choices, Bread selection, Add-Ons) into the "variants" array: [{ "name": { "de": "Option", "en": "Option" }, "price": "..." }].
4. Allergens & Dietary Indicators:
   - "allergens": Array of allergen codes [A, B, C, D, E, F, G, H, L, M, N, O, P, R]
   - "diet": Array of diet tags ["vegan", "vegetarian", "glutenfree", "halal"]
5. Group dishes logically into categories with appropriate emojis.
6. Provide bilingual German ("de") and English ("en") names & descriptions.
7. Provide a complete "allergensLegend" dictionary for all extracted allergen codes.
Return strictly JSON matching this structure:
{
  "branding": {
    "name": "\${venue || 'Restaurant'}",
    "email": "\${email || ''}",
    "style": "\${style || 'fine_dining'}",
    "primaryColor": "\${primaryColor || '#7C3AED'}",
    "secondaryColor": "\${secondaryColor || '#FF2D8D'}",
    "phone": "\${phone || ''}",
    "whatsapp": "\${whatsapp || ''}",
    "address": "\${address || ''}",
    "instagram": "\${instagram || ''}"
  },
  "categories": [
    {
      "id": "cat_1",
      "name": { "de": "Kategorie Name DE", "en": "Category Name EN" },
      "icon": "emoji",
      "items": [
        {
          "id": "item_1",
          "name": { "de": "Gericht DE", "en": "Dish EN" },
          "description": { "de": "Beschreibung DE", "en": "Description EN" },
          "price": "12.50 €",
          "variants": [
            { "name": { "de": "8oz / Veg", "en": "8oz / Veg" }, "price": "4.50 €" },
            { "name": { "de": "12oz / Non-Veg", "en": "12oz / Non-Veg" }, "price": "5.80 €" }
          ],
          "allergens": ["A", "G"],
          "diet": ["vegan", "vegetarian"],
          "highlight": true,
          "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop"
        }
      ]
    }
  ],
  "allergensLegend": {
    "A": { "de": "Glutenhaltiges Getreide", "en": "Cereals containing gluten" },
    "G": { "de": "Milch & Laktose", "en": "Milk & Lactose" },
    "C": { "de": "Eier", "en": "Eggs" },
    "H": { "de": "Schalenfrüchte / Nüsse", "en": "Nuts" }
  }
}
Raw Input Context:
"""\${rawInput.slice(0, 15000)}"""\\\`\`;

const replaceStr = \`    const promptText = \\\`You are an expert AI Restaurant Menu Specialist for SCENVY.
Convert the provided restaurant menu document (PDF, image, or text) into a complete, high-quality structured JSON menu package.
CRITICAL CONVERSION MINIMUM STANDARD REQUIREMENTS:
1. Complete Extraction: Extract EVERY SINGLE category, dish item, description, price, multi-size option, variant box, allergen, and dietary indicator present in the PDF/image. DO NOT omit or skip items. DO NOT hallucinate dishes that aren't there. If the PDF contains 40 items, extract all 40.
2. Contact & Branding Extraction: Extract venue contact details ONLY from the header or footer of the document if present. DO NOT invent phone numbers, addresses, emails, or names. If they are missing from the document, leave them as empty strings ("").
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
6. Original Language Only: Extract names and descriptions EXACTLY in the language they appear in the document (e.g., German if the PDF is German). DO NOT translate to a second language. Produce simple strings for names and descriptions.
7. Provide a complete "allergensLegend" dictionary for all extracted allergen codes.

Return strictly JSON matching this structure:
{
  "branding": {
    "name": "Extracted Restaurant Name or Empty String",
    "email": "Extracted email or Empty String",
    "style": "fine_dining",
    "primaryColor": "\${primaryColor || '#7C3AED'}",
    "secondaryColor": "\${secondaryColor || '#FF2D8D'}",
    "phone": "Extracted phone or Empty String",
    "whatsapp": "Extracted whatsapp or Empty String",
    "address": "Extracted address or Empty String",
    "instagram": "Extracted instagram or Empty String"
  },
  "categories": [
    {
      "id": "cat_1",
      "name": "Extracted Category Name",
      "icon": "emoji",
      "items": [
        {
          "id": "item_1",
          "name": "Extracted Dish Name",
          "description": "Extracted Dish Description",
          "price": "12.50 €",
          "variants": [
            { "name": "8oz / Veg", "price": "4.50 €" }
          ],
          "allergens": ["A", "G"],
          "diet": ["vegan", "vegetarian"],
          "highlight": true,
          "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop"
        }
      ]
    }
  ],
  "allergensLegend": {
    "A": "Glutenhaltiges Getreide",
    "G": "Milch & Laktose"
  }
}
Raw Input Context:
"""\${rawInput.slice(0, 15000)}"""\\\`\`;

text = text.replace(targetStr, replaceStr);
text = text.replace(/model: 'gemini-3\.6-flash'/g, "model: 'gemini-1.5-pro'");

fs.writeFileSync('api/ai/parse-menu.js', text);
