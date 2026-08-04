import { executeAiTask } from './ai-key-manager.js'
import { checkRateLimitAndAuth } from './ai-guard.js'
import fs from 'fs'
import path from 'path'
import os from 'os'

function repairAndParseJson(raw) {
  if (!raw || typeof raw !== 'string') return null
  let text = raw.trim()

  // Remove markdown code blocks
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  try {
    return JSON.parse(text)
  } catch (e) {
    // Continue to repair
  }

  const firstBrace = text.indexOf('{')
  const firstBracket = text.indexOf('[')
  let startIndex = -1
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIndex = Math.min(firstBrace, firstBracket)
  } else if (firstBrace !== -1) {
    startIndex = firstBrace
  } else if (firstBracket !== -1) {
    startIndex = firstBracket
  }

  if (startIndex === -1) return null
  text = text.slice(startIndex)

  const lastBrace = text.lastIndexOf('}')
  const lastBracket = text.lastIndexOf(']')
  const endIndex = Math.max(lastBrace, lastBracket)
  if (endIndex > 0) {
    const sub = text.slice(0, endIndex + 1)
    try {
      return JSON.parse(sub)
    } catch (e) {}
  }

  // Auto-repair unclosed structures if truncated
  let openBraces = 0
  let openBrackets = 0
  let inString = false
  let escaped = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (escaped) {
      escaped = false
      continue
    }
    if (ch === '\\') {
      escaped = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (!inString) {
      if (ch === '{') openBraces++
      else if (ch === '}') openBraces = Math.max(0, openBraces - 1)
      else if (ch === '[') openBrackets++
      else if (ch === ']') openBrackets = Math.max(0, openBrackets - 1)
    }
  }

  let repaired = text
  if (inString) repaired += '"'
  repaired = repaired.replace(/,\s*$/, '')

  while (openBrackets > 0) {
    repaired += ']'
    openBrackets--
  }
  while (openBraces > 0) {
    repaired += '}'
    openBraces--
  }

  try {
    return JSON.parse(repaired)
  } catch (e) {
    console.error('Failed to repair JSON output:', e)
    return null
  }
}

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
CRITICAL CONVERSION MANDATORY REQUIREMENTS:
1. Complete Extraction: This document contains a full menu. You MUST extract EVERY SINGLE category, EVERY SINGLE dish item, description, price, multi-size option, variant box, allergen, and dietary indicator. DO NOT omit, skip, summarize, truncate, or stop early! If the document contains 30, 50, or 100 dishes, you MUST list all 30, 50, or 100 dishes in the JSON output!
2. Contact & Branding Extraction: Extract venue contact details AND brand colors ONLY from the document if present. DO NOT make up fake emails or numbers.
   - Restaurant Name -> "branding.name"
   - Email -> "branding.email"
   - Phone -> "branding.phone"
   - WhatsApp -> "branding.whatsapp"
   - Address -> "branding.address"
   - Instagram handle -> "branding.instagram"
3. Pricing & Variants:
   - Extract standard prices (e.g. "12.50 €").
   - Extract variant option boxes into the "variants" array: [{ "name": "Option", "price": "..." }].
4. Group dishes logically into categories with appropriate emojis.
5. Provide names and descriptions as strings.
6. Provide a complete "allergensLegend" dictionary for all extracted allergen codes.

Return strictly JSON matching this structure:
{
  "branding": {
    "name": "${venue || 'Extracted Restaurant Name'}",
    "email": "Extracted email or empty",
    "style": "${style || 'fine_dining'}",
    "primaryColor": "${primaryColor || '#7C3AED'}",
    "secondaryColor": "${secondaryColor || '#FF2D8D'}",
    "phone": "${phone || 'Extracted phone or empty'}",
    "whatsapp": "${whatsapp || 'Extracted whatsapp or empty'}",
    "address": "${address || 'Extracted address or empty'}",
    "instagram": "${instagram || 'Extracted instagram or empty'}"
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
            { "name": "Option / Size", "price": "4.50 €" }
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
"""${rawInput.slice(0, 50000)}"""`

    let tmpFilePath = null
    let cleanMime = fileMimeType

    if (fileBase64 && typeof fileBase64 === 'string') {
      let cleanBase64 = fileBase64
      if (cleanBase64.includes(';base64,')) {
        cleanBase64 = cleanBase64.split(';base64,')[1]
      }
      if (!cleanMime || cleanMime === 'application/octet-stream' || cleanMime === '') {
        if (fileBase64.startsWith('data:application/pdf') || fileBase64.toLowerCase().includes('pdf')) {
          cleanMime = 'application/pdf'
        } else if (fileBase64.startsWith('data:image/png')) {
          cleanMime = 'image/png'
        } else if (fileBase64.startsWith('data:image/jpeg') || fileBase64.startsWith('data:image/jpg')) {
          cleanMime = 'image/jpeg'
        } else if (fileBase64.startsWith('data:image/webp')) {
          cleanMime = 'image/webp'
        } else {
          cleanMime = 'application/pdf'
        }
      }
      if (cleanMime === 'image/jpg') cleanMime = 'image/jpeg'

      try {
        tmpFilePath = path.join(os.tmpdir(), `menu_${Date.now()}_${Math.floor(Math.random()*10000)}.bin`)
        fs.writeFileSync(tmpFilePath, Buffer.from(cleanBase64, 'base64'))
      } catch(e) {
        console.error("Failed to write tmp file for AI upload", e)
      }
    }

    const parsed = await executeAiTask(async (ai) => {
      let contents = []
      if (tmpFilePath) {
          try {
            console.log(`Uploading file ${tmpFilePath} to Gemini File API (${cleanMime})...`)
            const uploadResult = await ai.files.upload({ file: tmpFilePath, mimeType: cleanMime })
            contents.push({
              fileData: {
                fileUri: uploadResult.uri,
                mimeType: uploadResult.mimeType
              }
            })
            // Brief wait for processing
            await new Promise(r => setTimeout(r, 2000))
          } catch(err) {
            console.warn("File API upload failed, falling back to inlineData", err.message)
            contents.push({
              inlineData: {
                data: fs.readFileSync(tmpFilePath).toString('base64'),
                mimeType: cleanMime
              }
            })
          }
        }

        contents.push(promptText)

        const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash']
      let lastErr = null
      let rawText = null

      for (const m of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents,
            config: { 
              responseMimeType: 'application/json',
              maxOutputTokens: 16384
            }
          })
          if (response?.text) {
            rawText = response.text
            break
          }
        } catch (mErr) {
          console.warn(`Model ${m} failed in parse-menu:`, mErr?.message)
          lastErr = mErr
        }
      }

      if (!rawText) {
        console.warn('AI models failed or rate-limited in parse-menu.js')
        // Extract raw text lines if available instead of hardcoded sample
        const lines = (rawInput || '').split('\n').map(l => l.trim()).filter(l => l.length > 2)
        if (lines.length > 0) {
          const items = lines.slice(0, 10).map((line, idx) => ({
            id: `extracted_${idx + 1}`,
            name: { de: line, en: line },
            description: { de: 'Aus Dokument extrahiert', en: 'Extracted from document' },
            price: '—',
            highlight: idx === 0
          }))
          return {
            branding: {
              name: venue || 'Hochgeladene Speisekarte',
              style: style || 'modern',
              primaryColor: primaryColor || '#7C3AED',
              secondaryColor: secondaryColor || '#FF2D8D',
            },
            categories: [
              {
                id: 'cat_extracted',
                name: { de: 'Extrahierte Positionen', en: 'Extracted Items' },
                icon: '📋',
                items
              }
            ]
          }
        }
        return null
      }
      return repairAndParseJson(rawText)
    })

    if (!parsed || !parsed.categories || !Array.isArray(parsed.categories) || parsed.categories.length === 0) {
      console.warn('AI parse returned empty categories for user uploaded document')
      if (fileBase64 || rawInput.trim()) {
        const lines = (rawInput || '').split('\n').map(l => l.trim()).filter(l => l.length > 2 && !l.startsWith('['))
        const items = lines.length > 0 ? lines.slice(0, 10).map((line, idx) => ({
          id: `item_doc_${idx + 1}`,
          name: { de: line, en: line },
          description: { de: 'Aus Ihrem Dokument erfasst', en: 'Extracted from your document' },
          price: '0.00 €',
          highlight: idx === 0
        })) : [
          {
            id: 'item_pdf_1',
            name: { de: `Dokument: ${venue || 'PDF Speisekarte'}`, en: `Document: ${venue || 'PDF Menu'}` },
            description: { de: 'Die KI konnte keinen lesbaren Text im PDF finden. Bitte stellen Sie sicher, dass es sich um ein Text-PDF oder ein scharfes Foto handelt.', en: 'No readable text found. Please verify PDF clarity.' },
            price: '0.00 €',
            highlight: true
          }
        ]

        return res.status(200).json({
          branding: {
            name: venue || 'Hochgeladene Speisekarte',
            style: style || 'modern',
            primaryColor: primaryColor || '#7C3AED',
            secondaryColor: secondaryColor || '#FF2D8D',
          },
          categories: [
            {
              id: 'cat_uploaded',
              name: { de: 'Inhalte aus Ihrem Dokument', en: 'Extracted Document Content' },
              icon: '📋',
              items
            }
          ]
        })
      }
      return res.status(200).json(defaultSample)
    }

    // Standardize branding fallback
    if (!parsed.branding) parsed.branding = {}
    if (venue && !parsed.branding.name) parsed.branding.name = venue
    if (primaryColor) parsed.branding.primaryColor = primaryColor
    if (secondaryColor) parsed.branding.secondaryColor = secondaryColor

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
    parsed.categories.forEach((cat, cIdx) => {
      if (!cat.id) cat.id = `cat_${cIdx + 1}`
      if (!cat.items || !Array.isArray(cat.items)) cat.items = []
      
      cat.items.forEach((item, iIdx) => {
        if (!item.id) item.id = `item_${cIdx + 1}_${iIdx + 1}`
        if (!item.imageUrl) {
          item.imageUrl = foodStock[imgIdx % foodStock.length]
          imgIdx++
        }
      })
    })

    return res.status(200).json(parsed)
  } catch (err) {
    console.error('AI parse-menu error:', err)
    return res.status(500).json({ error: 'AI processing failed', message: err.message })
  } finally {
    if (tmpFilePath && fs.existsSync(tmpFilePath)) {
      try {
        fs.unlinkSync(tmpFilePath)
      } catch(e) {
        console.error("Failed to delete tmp file", e)
      }
    }
  }
}

