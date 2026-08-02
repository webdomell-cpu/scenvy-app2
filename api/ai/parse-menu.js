import { executeAiTask } from './ai-key-manager.js'
import { checkRateLimitAndAuth } from './ai-guard.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-user-id')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const guard = checkRateLimitAndAuth(req, 10)
  if (!guard.allowed) {
    return res.status(guard.status).json({ error: guard.error })
  }

  const { documentText, menuItemsText, venue, style, primaryColor, secondaryColor, phone, whatsapp, address, instagram, fileBase64, fileMimeType } = req.body || {}

  const rawInput = (documentText || '') + '\n' + (menuItemsText || '')

  const defaultSample = {
    branding: {
      name: venue || 'Gourmet Bistro & Grill',
      style: style || 'fine_dining',
      primaryColor: primaryColor || '#7C3AED',
      secondaryColor: secondaryColor || '#FF2D8D',
      email: 'info@gourmet-bistro.de',
      phone: phone || '+49 30 1234567',
      whatsapp: whatsapp || '+491701234567',
      address: address || 'Musterstraße 12, Berlin',
      instagram: instagram || '@scenvy_gourmet',
    },
    categories: [
      {
        id: 'cat_kaffee_drinks',
        name: { de: 'Kaffee & Spezialitäten', en: 'Coffee & Drinks' },
        icon: '☕',
        items: [
          {
            id: 'item_k1',
            name: { de: 'Flat White & Specialty Coffee', en: 'Flat White & Specialty Coffee' },
            description: { de: 'Frisch gerösteter Arabica-Espresso mit samtigem Hafer- oder Vollmilchschaum', en: 'Freshly roasted Arabica espresso with velvety oat or whole milk' },
            price: '4.50 € / 5.80 €',
            variants: [
              { name: { de: '8oz (Standard)', en: '8oz (Standard)' }, price: '4.50 €' },
              { name: { de: '12oz (Large)', en: '12oz (Large)' }, price: '5.80 €' }
            ],
            allergens: ['G'],
            diet: ['vegetarian'],
            highlight: true,
            imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop'
          }
        ]
      },
      {
        id: 'cat_vorspeisen',
        name: { de: 'Vorspeisen & Antipasti', en: 'Starters & Antipasti' },
        icon: '🥗',
        items: [
          {
            id: 'item_1',
            name: { de: 'Trüffel Burrata', en: 'Truffle Burrata' },
            description: { de: 'Cremige Burrata auf wildem Rucola, getrockneten Kirschtomaten und frischem schwarzen Trüffel', en: 'Creamy burrata on wild arugula, sun-dried cherry tomatoes and fresh black truffle' },
            price: '14.50 €',
            variants: [
              { name: { de: 'Standard', en: 'Standard' }, price: '14.50 €' },
              { name: { de: 'mit 24 Monate Parma', en: 'with 24-Month Parma Ham' }, price: '18.90 €' }
            ],
            allergens: ['G'],
            diet: ['vegetarian'],
            highlight: true,
            imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb16655?w=600&auto=format&fit=crop'
          },
          {
            id: 'item_fritto',
            name: { de: 'Fritto Misto Speciale', en: 'Fritto Misto Special' },
            description: { de: 'Knusprig frittierte Meeresfrüchte oder mediterranes Saison-Gemüse mit Safran-Aioli', en: 'Crispy fried seafood or seasonal vegetables with saffron aioli' },
            price: '16.80 €',
            variants: [
              { name: { de: 'Veggie Option', en: 'Veggie Option' }, price: '13.50 €' },
              { name: { de: 'Non-Veg (Seafood)', en: 'Non-Veg (Seafood)' }, price: '16.80 €' }
            ],
            allergens: ['A', 'D', 'G'],
            diet: ['vegetarian'],
            highlight: true,
            imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop'
          }
        ]
      },
      {
        id: 'cat_hauptgerichte',
        name: { de: 'Pasta & Hauptgerichte', en: 'Pasta & Mains' },
        icon: '🍝',
        items: [
          {
            id: 'item_3',
            name: { de: 'Tagliolini al Tartufo', en: 'Truffle Tagliolini' },
            description: { de: 'Hausgemachte Eier-Pasta in cremiger Salbeibutter mit frisch geriebenem Sommer-Trüffel', en: 'Handmade egg pasta tossed in creamy sage butter and topped with freshly shaved summer truffle' },
            price: '21.00 €',
            variants: [
              { name: { de: 'Penne (Glutenfrei)', en: 'Penne (Glutenfree)' }, price: '21.00 €' },
              { name: { de: 'Gnocchi (Hausgemacht)', en: 'Gnocchi (Homemade)' }, price: '23.00 €' }
            ],
            allergens: ['A', 'C', 'G'],
            diet: ['vegetarian'],
            highlight: true,
            imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop'
          },
          {
            id: 'item_4',
            name: { de: 'Dry Aged Ribeye Steak', en: 'Dry-Aged Ribeye Steak' },
            description: { de: '300g Premium Steak gegrillt am Lavastein, serviert mit Trüffel-Fries und Kräuterbutter', en: '300g premium beef grilled over lava stone, served with truffle fries and herb butter' },
            price: '34.50 €',
            variants: [
              { name: { de: 'Pfeffersauce Add-On', en: 'Pepper Sauce Add-On' }, price: '+3.50 €' },
              { name: { de: 'Trüffel-Butter Extra', en: 'Extra Truffle Butter' }, price: '+2.50 €' }
            ],
            allergens: ['G'],
            diet: [],
            highlight: true,
            imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop'
          }
        ]
      }
    ],
    allergensLegend: {
      A: { de: 'Glutenhaltiges Getreide', en: 'Cereals containing gluten' },
      B: { de: 'Krebstiere', en: 'Crustaceans' },
      C: { de: 'Eier', en: 'Eggs' },
      D: { de: 'Fische', en: 'Fish' },
      G: { de: 'Milch & Laktose', en: 'Milk & Lactose' },
      H: { de: 'Schalenfrüchte / Nüsse', en: 'Nuts' },
      L: { de: 'Sellerie', en: 'Celery' },
      M: { de: 'Senf', en: 'Mustard' }
    }
  }

  if (!rawInput.trim() && !fileBase64) {
    return res.status(200).json(defaultSample)
  }

  try {
    const promptText = `You are an expert AI Restaurant Menu Specialist for SCENVY.
Convert the provided restaurant menu document (PDF, image, or text) into a complete, high-quality structured JSON menu package.
CRITICAL CONVERSION MINIMUM STANDARD REQUIREMENTS:
1. Complete Extraction: This document may contain multiple pages (e.g. 20+ pages). You MUST process the ENTIRE document from start to finish. Extract EVERY SINGLE category, EVERY SINGLE dish item, description, price, multi-size option, variant box, allergen, and dietary indicator. DO NOT omit, skip, or group items. DO NOT truncate the output. If there are 150 items, you must output exactly 150 items.
2. Contact & Branding Extraction: Extract venue contact details AND brand colors ONLY from the document. DO NOT make up random emails, numbers or instagram handles. If not present, leave as empty strings "". If brand colors are visually present, extract them as HEX codes.
   - Restaurant Name -> "branding.name"
   - Email -> "branding.email"
   - Phone -> "branding.phone"
   - WhatsApp -> "branding.whatsapp"
   - Address -> "branding.address"
   - Instagram handle -> "branding.instagram"
3. Pricing & Variants (Multi-Column & Sizes):
   - Extract standard prices (e.g. "12.50 €").
   - Extract variant option boxes into the "variants" array: [{ "name": "Option", "price": "..." }].
4. Allergens & Dietary Indicators:
   - "allergens": Array of allergen codes
   - "diet": Array of diet tags ["vegan", "vegetarian", "glutenfree", "halal"]
5. Group dishes logically into categories with appropriate emojis.
6. Original Language Only: Extract names and descriptions EXACTLY in the language they appear in the document (e.g., German if the PDF is German). Produce simple strings for names and descriptions, not objects.
7. Provide a complete "allergensLegend" dictionary for all extracted allergen codes.

Return strictly JSON matching this structure:
{
  "branding": {
    "name": "Extracted Restaurant Name or empty",
    "email": "Extracted email or empty",
    "style": "fine_dining",
    "primaryColor": "${primaryColor ? primaryColor : 'Extracted primary brand hex color from document or #7C3AED'}",
    "secondaryColor": "${secondaryColor ? secondaryColor : 'Extracted secondary brand hex color from document or #FF2D8D'}",
    "phone": "Extracted phone or empty",
    "whatsapp": "Extracted whatsapp or empty",
    "address": "Extracted address or empty",
    "instagram": "Extracted instagram or empty"
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
            { "name": "8oz / Veg", "price": "4.50 €" }
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
"""${rawInput.slice(0, 15000)}"""`

    const parsed = await executeAiTask(async (ai) => {
      let contents = []

      if (fileBase64) {
        let cleanBase64 = fileBase64
        if (cleanBase64.includes(';base64,')) {
          cleanBase64 = cleanBase64.split(';base64,')[1]
        }
        contents.push({
          inlineData: {
            data: cleanBase64,
            mimeType: fileMimeType || 'application/pdf'
          }
        })
      }

      contents.push(promptText)

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-pro',
        contents,
        config: { 
          responseMimeType: 'application/json',
          maxOutputTokens: 8192
        }
      })

      const raw = response.text || '{}'
      let jsonStr = raw
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) jsonStr = match[0]
      return JSON.parse(jsonStr)
    })

    if (!parsed || !parsed.categories || !Array.isArray(parsed.categories)) {
      return res.status(200).json(defaultSample)
    }

    // Enrich with default image URLs if missing
    const foodStock = [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop'
    ]

    let imgIdx = 0
    if (parsed.categories && Array.isArray(parsed.categories)) {
      parsed.categories.forEach(cat => {
        if (cat.items && Array.isArray(cat.items)) {
          cat.items.forEach(item => {
            if (!item.imageUrl) {
              item.imageUrl = foodStock[imgIdx % foodStock.length]
              imgIdx++
            }
          })
        }
      })
    }

    return res.status(200).json(parsed)
  } catch (err) {
    console.error('AI parse-menu error:', err)
    return res.status(200).json(defaultSample)
  }
}

