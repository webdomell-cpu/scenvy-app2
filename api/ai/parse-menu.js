import { executeAiTask } from './ai-key-manager.js'
import { checkRateLimitAndAuth } from './ai-guard.js'
import fs from 'fs'
import path from 'path'
import os from 'os'

function parsePdfTextFallback(text, venue, style, primaryColor, secondaryColor) {
  if (!text || typeof text !== 'string') return null
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  if (lines.length === 0) return null

  const categories = []
  let currentCategory = {
    id: 'cat_extracted_1',
    name: 'Speisen & Getränke',
    icon: '🍽️',
    items: []
  }

  const priceRegex = /(\d+[,.]\d{2}\s*€?|€\s*\d+[,.]\d{2}|\d+\s*€)/i

  lines.forEach((line, idx) => {
    // Check if line looks like a category header (ALL CAPS, short, no price)
    if (line.length < 35 && line === line.toUpperCase() && !priceRegex.test(line) && line.length > 3) {
      if (currentCategory.items.length > 0) {
        categories.push(currentCategory)
      }
      currentCategory = {
        id: `cat_extracted_${categories.length + 1}`,
        name: line.charAt(0) + line.slice(1).toLowerCase(),
        icon: '📋',
        items: []
      }
      return
    }

    const priceMatch = line.match(priceRegex)
    if (priceMatch) {
      const priceStr = priceMatch[0].includes('€') ? priceMatch[0] : `${priceMatch[0]} €`
      const dishName = line.replace(priceRegex, '').trim() || `Gericht ${currentCategory.items.length + 1}`
      
      currentCategory.items.push({
        id: `item_pdf_${idx + 1}`,
        name: dishName,
        description: 'Aus PDF-Dokument ausgelesen',
        price: priceStr,
        allergens: [],
        highlight: currentCategory.items.length === 0
      })
    } else if (line.length > 3 && !line.startsWith('[') && !line.startsWith('http')) {
      // Line without price (might be dish description or item name)
      if (currentCategory.items.length > 0) {
        const lastItem = currentCategory.items[currentCategory.items.length - 1]
        if (lastItem.description === 'Aus PDF-Dokument ausgelesen') {
          lastItem.description = line
        }
      } else {
        currentCategory.items.push({
          id: `item_pdf_${idx + 1}`,
          name: line,
          description: '',
          price: '—',
          highlight: false
        })
      }
    }
  })

  if (currentCategory.items.length > 0) {
    categories.push(currentCategory)
  }

  if (categories.length === 0) return null

  return {
    branding: {
      name: venue || 'Extrahierte Speisekarte (PDF)',
      style: style || 'modern',
      primaryColor: primaryColor || '#7C3AED',
      secondaryColor: secondaryColor || '#FF2D8D',
    },
    categories
  }
}

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

  let rawInput = (documentText || '') + '\n' + (menuItemsText || '')

  // Extract raw text from PDF if fileBase64 is provided
  let extractedPdfText = ''
  let cleanBase64 = ''
  let cleanMime = fileMimeType || 'application/pdf'

  if (fileBase64 && typeof fileBase64 === 'string') {
    cleanBase64 = fileBase64
    if (cleanBase64.includes(';base64,')) {
      cleanBase64 = cleanBase64.split(';base64,')[1]
    }

    if (fileBase64.startsWith('data:application/pdf') || (fileMimeType && fileMimeType.includes('pdf'))) {
      cleanMime = 'application/pdf'
      try {
        const pdfBuffer = Buffer.from(cleanBase64, 'base64')
        const { createRequire } = await import('module')
        const req = createRequire(import.meta.url)
        const pdfParse = req('pdf-parse')
        const pdfData = await pdfParse(pdfBuffer)
        if (pdfData && pdfData.text) {
          extractedPdfText = pdfData.text.trim()
          console.log(`📄 PDF parsed via pdf-parse: ${pdfData.numpages || '?'} pages, ${extractedPdfText.length} characters extracted.`)
        }
      } catch (pdfErr) {
        console.warn('pdf-parse extraction notice:', pdfErr?.message || pdfErr)
      }
    } else if (fileBase64.startsWith('data:image/png')) {
      cleanMime = 'image/png'
    } else if (fileBase64.startsWith('data:image/jpeg') || fileBase64.startsWith('data:image/jpg')) {
      cleanMime = 'image/jpeg'
    } else if (fileBase64.startsWith('data:image/webp')) {
      cleanMime = 'image/webp'
    }
  }

  if (extractedPdfText) {
    rawInput = `--- EXTRAHIERTER PDF TEXT (pdf-parse) ---\n${extractedPdfText}\n\n--- MANUELLE EINGABEN ---\n${rawInput}`
  }

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
          }
        ]
      }
    ]
  }

  if (!rawInput.trim() && !cleanBase64) {
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
    "email": "",
    "style": "${style || 'fine_dining'}",
    "primaryColor": "${primaryColor || '#7C3AED'}",
    "secondaryColor": "${secondaryColor || '#FF2D8D'}",
    "phone": "${phone || ''}",
    "whatsapp": "${whatsapp || ''}",
    "address": "${address || ''}",
    "instagram": "${instagram || ''}"
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

Raw Input Document Text:
"""${rawInput.slice(0, 80000)}"""`

    const parsed = await executeAiTask(async (ai) => {
      const contents = []

      // If we have a Base64 file (PDF or Image), pass it directly via inlineData!
      if (cleanBase64) {
        contents.push({
          inlineData: {
            data: cleanBase64,
            mimeType: cleanMime
          }
        })
      }

      contents.push(promptText)

      const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
      let lastErr = null
      let rawText = null

      for (const m of modelsToTry) {
        try {
          console.log(`🤖 Requesting Gemini model [${m}] for menu extraction...`)
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
            console.log(`✅ Gemini model [${m}] responded successfully (${rawText.length} chars).`)
            break
          }
        } catch (mErr) {
          console.warn(`Model ${m} failed in parse-menu:`, mErr?.message)
          lastErr = mErr
        }
      }

      if (!rawText) {
        console.warn('All AI models failed in parse-menu.js. Trying extractedPdfText fallback parser...')
        if (extractedPdfText) {
          return parsePdfTextFallback(extractedPdfText, venue, style, primaryColor, secondaryColor)
        }
        return null
      }
      return repairAndParseJson(rawText)
    })

    let finalMenu = parsed

    // If Gemini returned empty or invalid structure, check fallback
    if (!finalMenu || !finalMenu.categories || !Array.isArray(finalMenu.categories) || finalMenu.categories.length === 0) {
      console.warn('AI parse returned empty categories. Checking pdf-parse fallback text...')
      if (extractedPdfText) {
        finalMenu = parsePdfTextFallback(extractedPdfText, venue, style, primaryColor, secondaryColor)
      } else if (rawInput.trim()) {
        finalMenu = parsePdfTextFallback(rawInput, venue, style, primaryColor, secondaryColor)
      }
    }

    if (!finalMenu || !finalMenu.categories || finalMenu.categories.length === 0) {
      if (cleanBase64 || rawInput.trim()) {
        return res.status(200).json({
          branding: {
            name: venue || 'Speisekarte',
            style: style || 'fine_dining',
            primaryColor: primaryColor || '#7C3AED',
            secondaryColor: secondaryColor || '#FF2D8D',
            phone: phone || '',
            address: address || ''
          },
          categories: [],
          warning: 'Keine Speisen oder Kategorien im hochgeladenen Dokument erkannt. Bitte prüfe die Datei oder erstelle Artikel manuell im Artikelstamm-Editor.'
        })
      }
      return res.status(200).json(defaultSample)
    }

    // Standardize branding fallback
    if (!finalMenu.branding) finalMenu.branding = {}
    if (venue && !finalMenu.branding.name) finalMenu.branding.name = venue
    if (primaryColor) finalMenu.branding.primaryColor = primaryColor
    if (secondaryColor) finalMenu.branding.secondaryColor = secondaryColor

    // Enrich items with IDs and stock images if missing
    const foodStock = [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop'
    ]

    let imgIdx = 0
    finalMenu.categories.forEach((cat, cIdx) => {
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

    return res.status(200).json(finalMenu)
  } catch (err) {
    console.error('AI parse-menu error:', err)
    if (extractedPdfText) {
      const fallback = parsePdfTextFallback(extractedPdfText, venue, style, primaryColor, secondaryColor)
      if (fallback) return res.status(200).json(fallback)
    }
    return res.status(500).json({ error: 'AI processing failed', message: err.message })
  }
}


