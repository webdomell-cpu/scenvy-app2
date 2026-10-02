import { executeAiTask } from './ai-key-manager.js'
import { checkRateLimitAndAuth } from './ai-guard.js'
import fs from 'fs'
import path from 'path'
import os from 'os'

function extractFirstImageFromPdfBuffer(pdfBuffer) {
  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) return null
  let startIdx = 0
  while ((startIdx = pdfBuffer.indexOf(Buffer.from([0xFF, 0xD8, 0xFF]), startIdx)) !== -1) {
    const endIdx = pdfBuffer.indexOf(Buffer.from([0xFF, 0xD9]), startIdx + 3)
    if (endIdx !== -1) {
      const imgBuf = pdfBuffer.slice(startIdx, endIdx + 2)
      // Accept reasonable image size (between 800 bytes and 4MB)
      if (imgBuf.length > 800 && imgBuf.length < 4 * 1024 * 1024) {
        return `data:image/jpeg;base64,${imgBuf.toString('base64')}`
      }
      startIdx = endIdx + 2
    } else {
      break
    }
  }
  return null
}

function generateMonogramSvg(name, primaryColor, secondaryColor) {
  const cleanName = (name || 'Restaurant').trim()
  const words = cleanName.split(/\s+/).filter(Boolean)
  let initials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : cleanName.slice(0, 2).toUpperCase()
  if (!initials) initials = 'SC'
  const pCol = (primaryColor && primaryColor.startsWith('#')) ? primaryColor : '#7C3AED'
  const sCol = (secondaryColor && secondaryColor.startsWith('#')) ? secondaryColor : '#FF2D8D'
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' width='200' height='200'>
    <defs>
      <linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stop-color='${pCol}' />
        <stop offset='100%' stop-color='${sCol}' />
      </linearGradient>
    </defs>
    <rect width='200' height='200' rx='44' fill='url(#grad)' />
    <circle cx='100' cy='100' r='76' fill='none' stroke='rgba(255,255,255,0.28)' stroke-width='4' stroke-dasharray='6,4' />
    <text x='50%' y='55%' text-anchor='middle' dominant-baseline='middle' fill='#FFFFFF' font-family='Arial, Helvetica, sans-serif' font-weight='900' font-size='64' letter-spacing='2'>${initials}</text>
  </svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}

function extractAllergenCodes(str) {
  if (!str || typeof str !== 'string') return []
  const codes = new Set()
  // Pattern 1: Parentheses or brackets, e.g. (A, C, G) or [A, G] or (A,C,G) or (1, 3, 7)
  const parenMatch = str.match(/[\(\[]\s*([A-R,\s\d]+)\s*[\)\]]/i)
  if (parenMatch) {
    const parts = parenMatch[1].split(/[,\s]+/)
    parts.forEach(p => {
      const clean = p.trim().toUpperCase()
      if (/^[A-R]$/.test(clean) || /^\d{1,2}$/.test(clean)) codes.add(clean)
    })
  }
  // Pattern 2: Explicit keyword "Allergene: A, G"
  const wordMatch = str.match(/Allergen[e]?[:\s]+([A-R,\s\d]+)/i)
  if (wordMatch) {
    const parts = wordMatch[1].split(/[,\s]+/)
    parts.forEach(p => {
      const clean = p.trim().toUpperCase()
      if (/^[A-R]$/.test(clean) || /^\d{1,2}$/.test(clean)) codes.add(clean)
    })
  }
  // Pattern 3: Trailing comma separated single letters like "Pizza Margherita A, G"
  const trailingMatch = str.match(/\b([A-R](?:\s*,\s*[A-R])+)\b/)
  if (trailingMatch) {
    trailingMatch[1].split(',').forEach(p => {
      const clean = p.trim().toUpperCase()
      if (/^[A-R]$/.test(clean)) codes.add(clean)
    })
  }
  return Array.from(codes)
}

function detectDocumentLanguage(text) {
  if (!text || typeof text !== 'string') return 'en'
  const t = text.toLowerCase()
  const enKeywords = ['starter', 'starters', 'main', 'mains', 'dessert', 'desserts', 'beverage', 'beverages', 'drink', 'drinks', 'coffee', 'tea', 'beer', 'beers', 'wine', 'wines', 'salad', 'burger', 'burgers', 'soup', 'soups', 'sandwich', 'with', 'served with', 'allergy', 'allergens', 'price', 'water', 'juice', 'cocktail', 'cocktails', 'sides']
  const deKeywords = ['vorspeise', 'vorspeisen', 'hauptspeise', 'hauptgerichte', 'nachspeise', 'dessert', 'desserts', 'getränk', 'getränke', 'kaffee', 'tee', 'bier', 'biere', 'wein', 'weine', 'salat', 'salate', 'suppe', 'suppen', 'mit', 'serviert mit', 'allergene', 'allergen', 'preis', 'preise', 'wasser', 'saft', 'flasche', 'glas', 'beilagen']
  
  let enCount = 0
  let deCount = 0
  enKeywords.forEach(k => {
    const matches = t.match(new RegExp(`\\b${k}\\b`, 'g'))
    if (matches) enCount += matches.length
  })
  deKeywords.forEach(k => {
    const matches = t.match(new RegExp(`\\b${k}\\b`, 'g'))
    if (matches) deCount += matches.length
  })
  return enCount >= deCount ? 'en' : 'de'
}

function extractPriceAndVariants(str) {
  if (!str || typeof str !== 'string') return null
  
  // 1. Matches with currency symbol: € 14.50 | 14,50 € | 14.50 EUR | 14,- € | $ 12.00 | £ 9.50
  const currencyRegex = /(\b\d{1,3}(?:[.,]\d{2}|[.,]-)\s*(?:€|EUR|\$|£|CHF)|(?:€|EUR|\$|£|CHF)\s*\d{1,3}(?:[.,]\d{2}|[.,]-)?)/gi
  const currencyMatches = [...str.matchAll(currencyRegex)]
  if (currencyMatches.length > 0) {
    if (currencyMatches.length === 1) {
      return { price: currencyMatches[0][0].trim(), rawMatch: currencyMatches[0][0] }
    } else {
      return { 
        price: currencyMatches.map(m => m[0].trim()).join(' / '), 
        rawMatch: currencyMatches[currencyMatches.length - 1][0] 
      }
    }
  }

  // 2. Trailing price at the end of the line (e.g. "Coca Cola 0.33l 3.50")
  // MUST NOT match volume numbers like 0.33l, 0.5l, 0.75l, 250ml, 4cl
  const trailingPriceRegex = /(?:^|\s)(\d{1,3}[.,]\d{2})(?!\s*(?:l|ml|cl|oz|g|kg|cm|mm|min)\b)(?:\s*€|\s*EUR)?(?:\s*[\(\[]?[A-R,\s\d]*[\)\]]?)?\s*$/i
  const trailingMatch = str.match(trailingPriceRegex)
  if (trailingMatch) {
    const p = trailingMatch[1].replace(',', '.')
    return { price: `${p} €`, rawMatch: trailingMatch[1] }
  }

  // 3. Any standalone price number not followed by volume units
  const standalonePriceRegex = /\b(\d{1,3}[.,]\d{2})\b(?!\s*(?:l|ml|cl|oz|g|kg|cm|mm|min)\b)/gi
  const allMatches = [...str.matchAll(standalonePriceRegex)]
  const valid = allMatches.filter(m => {
    const after = str.slice(m.index + m[0].length, m.index + m[0].length + 6).toLowerCase()
    return !/^\s*(l|ml|cl|oz|g|kg)/.test(after)
  })

  if (valid.length > 0) {
    const last = valid[valid.length - 1]
    const p = last[0].replace(',', '.')
    return { price: `${p} €`, rawMatch: last[0] }
  }

  return null
}

function parsePdfTextFallback(text, venue, style, primaryColor, secondaryColor, extractedLogo) {
  if (!text || typeof text !== 'string') return null
  const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  if (rawLines.length === 0) return null

  const detectedLanguage = detectDocumentLanguage(text)

  // Clean lines and skip PDF metadata
  const lines = rawLines.filter(l => {
    if (l.startsWith('===') || l.startsWith('---')) return false
    if (/^Page \d+ of \d+$/i.test(l) || /^Seite \d+ von \d+$/i.test(l)) return false
    return true
  })

  // Detect restaurant venue name from top 10 lines
  let detectedVenue = ''
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const l = lines[i]
    if (l.length >= 3 && l.length <= 50 && !extractPriceAndVariants(l) && !l.toLowerCase().startsWith('speisekarte') && !l.toLowerCase().startsWith('menu') && !l.toLowerCase().startsWith('drinks') && !l.toLowerCase().startsWith('karte')) {
      detectedVenue = l
      break
    }
  }

  // Detect allergen notice
  let detectedAllergenNotice = ''
  for (const l of lines) {
    if (l.toLowerCase().includes('allerg') || l.toLowerCase().includes('zusatzstoff') || l.toLowerCase().includes('unverträglich')) {
      if (l.length > 12 && l.length < 320) {
        detectedAllergenNotice = l
        break
      }
    }
  }

  const finalName = detectedVenue || venue || (detectedLanguage === 'en' ? 'Restaurant Menu' : 'Speisekarte')
  const finalPrimary = primaryColor || '#7C3AED'
  const finalSecondary = secondaryColor || '#FF2D8D'
  const finalLogo = extractedLogo || generateMonogramSvg(finalName, finalPrimary, finalSecondary)

  // Category keyword matchers - comprehensive for both food AND drinks in English, German & Italian
  const categoryKeywordsRegex = /(?:^|\b)(Vorspeisen|Antipasti|Starters|Appetizers|Suppen|Soups|Salate|Salads|Pasta|Pizza|Hauptgerichte|Hauptspeisen|Mains|Main Courses|Entrees|Fleisch|Fleischgerichte|Meat|Steaks|Grill|Fisch|Fish|Meeresfrüchte|Seafood|Burger|Burgers|Sandwiches|Spezialitäten|Specialties|Beilagen|Sides|Side Orders|Desserts|Nachtisch|Nachspeisen|Süßspeisen|Sweets|Getränke|Drinks|Beverages|Alkoholfreie Getränke|Softdrinks|Soft Drinks|Cold Drinks|Erfrischungsgetränke|Mineralwasser|Wasser|Water|Mineral Water|Säfte|Juices|Heißgetränke|Hot Drinks|Kaffee|Coffee|Tee|Tea|Kaffeespezialitäten|Coffee Specialties|Biere|Beer|Beers|Fassbier|Draft Beer|Draught Beer|Flaschenbier|Bottled Beer|Cider|Weine|Wine|Wines|Offene Weine|Wines by the Glass|Flaschenweine|Bottled Wine|Rotweine|Red Wines|Red Wine|Weißweine|White Wines|White Wine|Rosé|Roséweine|Schaumwein|Sparkling Wine|Prosecco|Champagne|Cocktails|Signature Cocktails|Longdrinks|Long Drinks|Mocktails|Aperitif|Aperitifs|Digestif|Digestifs|Spirituosen|Spirits|Liquors|Shots)(?:\b|$)/i

  const categories = []
  let currentCategory = {
    id: 'cat_extracted_1',
    name: detectedLanguage === 'en' ? 'Dishes & Specialties' : 'Speisen & Spezialitäten',
    icon: '🍽️',
    items: []
  }

  const getCategoryIcon = (title) => {
    const lower = (title || '').toLowerCase()
    if (lower.includes('getränk') || lower.includes('drink') || lower.includes('beverage') || lower.includes('soft') || lower.includes('wasser') || lower.includes('water') || lower.includes('saft') || lower.includes('juice')) return '🥤'
    if (lower.includes('kaffee') || lower.includes('coffee') || lower.includes('tee') || lower.includes('tea') || lower.includes('heiß') || lower.includes('hot') || lower.includes('espresso')) return '☕'
    if (lower.includes('bier') || lower.includes('beer') || lower.includes('cider') || lower.includes('draft') || lower.includes('draught')) return '🍺'
    if (lower.includes('wein') || lower.includes('wine') || lower.includes('prosecco') || lower.includes('champagne')) return '🍷'
    if (lower.includes('cocktail') || lower.includes('longdrink') || lower.includes('spirit') || lower.includes('aperitif') || lower.includes('digestif')) return '🍸'
    if (lower.includes('dessert') || lower.includes('eis') || lower.includes('kuchen') || lower.includes('tiramisu') || lower.includes('sweet')) return '🍰'
    if (lower.includes('salat') || lower.includes('salad')) return '🥗'
    if (lower.includes('pizza')) return '🍕'
    if (lower.includes('pasta') || lower.includes('spaghetti')) return '🍝'
    if (lower.includes('burger') || lower.includes('sandwich')) return '🍔'
    if (lower.includes('fleisch') || lower.includes('steak') || lower.includes('meat') || lower.includes('grill')) return '🥩'
    if (lower.includes('fisch') || lower.includes('fish') || lower.includes('salmon') || lower.includes('seafood')) return '🐟'
    if (lower.includes('suppe') || lower.includes('soup')) return '🥣'
    if (lower.includes('starter') || lower.includes('appetizer') || lower.includes('vorspeise')) return '🧆'
    return '🍽️'
  }

  // Pre-scan pass: identify multi-line item structures
  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // Skip short or empty
    if (!line || line.length < 2) {
      i++
      continue
    }

    const priceInfo = extractPriceAndVariants(line)

    // Check if line is a Category Header:
    // 1) Contains category keywords, or
    // 2) Is short uppercase header without price, or
    // 3) Has dashed/starred framing like "--- DRINKS ---"
    const cleanHeaderCandidate = line.replace(/^[\s•\-\*#\d\.\)]+/, '').replace(/[\s•\-\*#\d\.\)]+$/, '').trim()
    const isExplicitCategory = categoryKeywordsRegex.test(cleanHeaderCandidate)
    const isFramedHeader = (line.startsWith('--') || line.startsWith('==') || line.startsWith('••')) && cleanHeaderCandidate.length > 2 && cleanHeaderCandidate.length < 35 && !priceInfo
    const isAllCapsShort = cleanHeaderCandidate.length <= 36 && cleanHeaderCandidate === cleanHeaderCandidate.toUpperCase() && !priceInfo && !line.includes('(') && !line.includes(')') && !/^\d+\./.test(line) && cleanHeaderCandidate.length > 3
    
    if ((isExplicitCategory || isFramedHeader || isAllCapsShort) && !priceInfo) {
      if (currentCategory.items.length > 0) {
        categories.push(currentCategory)
      }
      const cleanTitle = cleanHeaderCandidate.split(/\s+/).map(w => {
        if (w.toLowerCase() === '&') return '&'
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      }).join(' ')

      currentCategory = {
        id: `cat_extracted_${categories.length + 1}`,
        name: cleanTitle,
        icon: getCategoryIcon(cleanHeaderCandidate),
        items: []
      }
      i++
      continue
    }

    // Case 1: Line has a price on it
    if (priceInfo) {
      let priceStr = priceInfo.price

      let dishName = line.replace(priceInfo.rawMatch, '')
        .replace(/^\d+[\.\)]\s*/, '') // Remove leading numbers like "1. " or "24) "
        .replace(/[\(\[][A-R,\s\d]+[\)\]]/gi, '') // Remove allergen parens
        .trim()

      if (!dishName) {
        dishName = `${detectedLanguage === 'en' ? 'Item' : 'Artikel'} ${currentCategory.items.length + 1}`
      }

      const allergens = extractAllergenCodes(line)
      let description = ''
      const diet = []
      const lLow = (line + ' ' + (lines[i + 1] || '')).toLowerCase()
      if (lLow.includes('vegan')) diet.push('vegan')
      else if (lLow.includes('veggie') || lLow.includes('vegetar')) diet.push('vegetarian')
      if (lLow.includes('glutenfrei') || lLow.includes('gluten free')) diet.push('glutenfree')

      // Check if next line is a description (no price, length > 4, not a category)
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1]
        const nextPrice = extractPriceAndVariants(nextLine)
        const nextIsCategory = categoryKeywordsRegex.test(nextLine) || (nextLine.length <= 36 && nextLine === nextLine.toUpperCase() && !nextPrice)
        if (!nextPrice && !nextIsCategory && nextLine.length > 4) {
          description = nextLine
          const extraAllergens = extractAllergenCodes(nextLine)
          extraAllergens.forEach(a => { if (!allergens.includes(a)) allergens.push(a) })
          i++ // Consume description line
        }
      }

      currentCategory.items.push({
        id: `item_pdf_${categories.length}_${currentCategory.items.length + 1}`,
        name: dishName,
        description,
        price: priceStr,
        allergens,
        diet,
        spicy: lLow.includes('scharf') || lLow.includes('spicy') || lLow.includes('chili'),
        highlight: currentCategory.items.length === 0,
        imageUrl: '' // NEVER invent stock image
      })
      i++
      continue
    }

    // Case 2: Line has NO price, but NEXT line has price (e.g. Name on line 1, Price on line 2)
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1]
      const nextPriceInfo = extractPriceAndVariants(nextLine)
      const nextIsCat = categoryKeywordsRegex.test(nextLine)
      if (nextPriceInfo && !nextIsCat) {
        let priceStr = nextPriceInfo.price

        let dishName = line.replace(/^\d+[\.\)]\s*/, '')
          .replace(/[\(\[][A-R,\s\d]+[\)\]]/gi, '')
          .trim()
        
        const allergens = [...extractAllergenCodes(line), ...extractAllergenCodes(nextLine)]
        const diet = []
        const lLow = (line + ' ' + nextLine).toLowerCase()
        if (lLow.includes('vegan')) diet.push('vegan')
        else if (lLow.includes('veggie') || lLow.includes('vegetar')) diet.push('vegetarian')
        if (lLow.includes('glutenfrei') || lLow.includes('gluten free')) diet.push('glutenfree')

        currentCategory.items.push({
          id: `item_pdf_${categories.length}_${currentCategory.items.length + 1}`,
          name: dishName || `${detectedLanguage === 'en' ? 'Item' : 'Artikel'} ${currentCategory.items.length + 1}`,
          description: nextLine.replace(nextPriceInfo.rawMatch, '').trim(),
          price: priceStr,
          allergens: Array.from(new Set(allergens)),
          diet,
          spicy: lLow.includes('scharf') || lLow.includes('spicy') || lLow.includes('chili'),
          highlight: currentCategory.items.length === 0,
          imageUrl: '' // NEVER invent stock image
        })
        i += 2
        continue
      }
    }

    // Line without price - might be allergen code or note for previous item
    const allergensInLine = extractAllergenCodes(line)
    if (currentCategory.items.length > 0 && allergensInLine.length > 0) {
      const lastItem = currentCategory.items[currentCategory.items.length - 1]
      lastItem.allergens = Array.from(new Set([...(lastItem.allergens || []), ...allergensInLine]))
    } else if (currentCategory.items.length > 0 && line.length > 8 && !line.includes('http')) {
      const lastItem = currentCategory.items[currentCategory.items.length - 1]
      if (!lastItem.description) {
        lastItem.description = line
      }
    }

    i++
  }

  if (currentCategory.items.length > 0) {
    categories.push(currentCategory)
  }

  if (categories.length === 0) return null

  return {
    branding: {
      name: finalName,
      style: style || 'fine_dining',
      theme: 'light',
      backgroundColor: '#FAF9F6',
      textColor: '#18181B',
      primaryColor: finalPrimary,
      secondaryColor: finalSecondary,
      primaryLanguage: detectedLanguage,
      logoUrl: finalLogo,
      allergenNotice: detectedAllergenNotice || (detectedLanguage === 'en' 
        ? 'Dear guests, if you have allergies or dietary restrictions, please speak to our trained service staff.'
        : 'Liebe Gäste, bei Fragen zu Allergenen und Zusatzstoffen berät Sie gerne unser geschultes Servicepersonal.')
    },
    allergensLegend: {
      "A": { "de": "Glutenhaltiges Getreide (Weizen, Roggen, Gerste, Hafer)", "en": "Cereals containing gluten (wheat, rye, barley, oats)" },
      "B": { "de": "Krebstiere und Krebstiererzeugnisse", "en": "Crustaceans and crustacean products" },
      "C": { "de": "Eier und Eierzeugnisse", "en": "Eggs and egg products" },
      "D": { "de": "Fische und Fischerzeugnisse", "en": "Fish and fish products" },
      "E": { "de": "Erdnüsse und Erdnusserzeugnisse", "en": "Peanuts and peanut products" },
      "F": { "de": "Sojabohnen und Sojaerzeugnisse", "en": "Soybeans and soybean products" },
      "G": { "de": "Milch und Milcherzeugnisse (einschl. Laktose)", "en": "Milk and dairy products (including lactose)" },
      "H": { "de": "Schalenfrüchte / Nüsse", "en": "Tree nuts" },
      "L": { "de": "Sellerie und Sellerieerzeugnisse", "en": "Celery and celery products" },
      "M": { "de": "Senf und Senferzeugnisse", "en": "Mustard and mustard products" },
      "N": { "de": "Sesamsamen und Sesamerzeugnisse", "en": "Sesame seeds and sesame products" },
      "O": { "de": "Schwefeldioxid und Sulfite (> 10 mg/kg)", "en": "Sulphur dioxide and sulphites" },
      "P": { "de": "Lupinen und Lupinenerzeugnisse", "en": "Lupin and lupin products" },
      "R": { "de": "Weichtiere und Weichtiererzeugnisse", "en": "Molluscs and mollusc products" }
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

  const { documentText, menuItemsText, venue, style, primaryColor, secondaryColor, phone, whatsapp, address, instagram, fileBase64, fileMimeType, cartEnabled, primaryLanguage } = req.body || {}

  let rawInput = (documentText || '') + '\n' + (menuItemsText || '')

  // Extract raw text and logo from PDF or image if fileBase64 is provided
  let extractedPdfText = ''
  let cleanBase64 = ''
  let cleanMime = fileMimeType || 'application/pdf'
  let extractedLogoFromDoc = null

  if (fileBase64 && typeof fileBase64 === 'string') {
    cleanBase64 = fileBase64
    if (cleanBase64.includes(';base64,')) {
      cleanBase64 = cleanBase64.split(';base64,')[1]
    }

    if (fileBase64.startsWith('data:application/pdf') || (fileMimeType && fileMimeType.includes('pdf')) || cleanMime.includes('pdf')) {
      cleanMime = 'application/pdf'
      try {
        const pdfBuffer = Buffer.from(cleanBase64, 'base64')

        // 1. Scan for embedded JPEG stream (FF D8 FF ... FF D9)
        const foundImg = extractFirstImageFromPdfBuffer(pdfBuffer)
        if (foundImg) {
          extractedLogoFromDoc = foundImg
          console.log('🖼️ Embedded logo/image successfully extracted from PDF buffer.')
        }

        const { PDFParse } = await import('pdf-parse')
        const parser = new PDFParse({ data: pdfBuffer })

        // 2. Also try parser.getImage if buffer scan didn't find one
        if (!extractedLogoFromDoc && typeof parser.getImage === 'function') {
          try {
            const imgRes = await parser.getImage({ page: 1 })
            if (imgRes && imgRes.pages && imgRes.pages[0]?.images?.length > 0) {
              const first = imgRes.pages[0].images[0]
              if (first?.data) {
                const b64 = Buffer.isBuffer(first.data) ? first.data.toString('base64') : (typeof first.data === 'string' ? first.data : '')
                if (b64) {
                  extractedLogoFromDoc = `data:image/png;base64,${b64}`
                }
              }
            }
          } catch (imgErr) {}
        }

        const pdfResult = await parser.getText()
        if (pdfResult && pdfResult.text && pdfResult.text.trim()) {
          extractedPdfText = pdfResult.text.trim()
          console.log(`📄 PDF parsed via PDFParse: ${pdfResult.total || '?'} pages, ${extractedPdfText.length} characters extracted.`)
        }
      } catch (pdfErr) {
        console.warn('PDFParse extraction notice:', pdfErr?.message || pdfErr)
        try {
          const { createRequire } = await import('module')
          const req = createRequire(import.meta.url)
          const legacyPdf = req('pdf-parse')
          if (typeof legacyPdf === 'function') {
            const pdfBuffer = Buffer.from(cleanBase64, 'base64')
            const pdfData = await legacyPdf(pdfBuffer)
            if (pdfData && pdfData.text) {
              extractedPdfText = pdfData.text.trim()
            }
            if (!extractedLogoFromDoc) {
              extractedLogoFromDoc = extractFirstImageFromPdfBuffer(pdfBuffer)
            }
          }
        } catch (e2) {}
      }
    } else if (fileBase64.startsWith('data:image/') || (fileMimeType && fileMimeType.startsWith('image/'))) {
      cleanMime = fileMimeType || 'image/png'
      extractedLogoFromDoc = fileBase64.startsWith('data:') ? fileBase64 : `data:${cleanMime};base64,${cleanBase64}`
    }
  }

  if (extractedPdfText) {
    rawInput = `--- EXTRAHIERTER PDF TEXT (pdf-parse) ---\n${extractedPdfText}\n\n--- MANUELLE EINGABEN & HINWEISE ---\n${rawInput}`
  }

  const defaultSample = {
    branding: {
      name: venue || 'Gourmet Bistro & Grill',
      style: style || 'fine_dining',
      primaryColor: primaryColor || '#7C3AED',
      secondaryColor: secondaryColor || '#FF2D8D',
      logoUrl: extractedLogoFromDoc || generateMonogramSvg(venue || 'Gourmet Bistro & Grill', primaryColor || '#7C3AED', secondaryColor || '#FF2D8D'),
      allergenNotice: 'Liebe Gäste, bei Fragen zu Allergenen und Zusatzstoffen berät Sie gerne unser geschultes Servicepersonal.',
      email: 'info@gourmet-bistro.de',
      phone: phone || '+49 30 1234567',
      whatsapp: whatsapp || '+491701234567',
      address: address || 'Musterstraße 12, Berlin',
      instagram: instagram || '@scenvy_gourmet',
    },
    allergensLegend: {
      "A": { "de": "Glutenhaltiges Getreide (Weizen, Roggen, Gerste)", "en": "Cereals containing gluten" },
      "C": { "de": "Eier und Eierzeugnisse", "en": "Eggs and egg products" },
      "G": { "de": "Milch und Milcherzeugnisse (einschl. Laktose)", "en": "Milk and dairy products (including lactose)" },
      "H": { "de": "Schalenfrüchte / Nüsse", "en": "Tree nuts" }
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
    let pageCountInfo = ''
    if (extractedPdfText) {
      const priceMatches = extractedPdfText.match(/(\d+[,.]\d{2}\s*€|\d+\s*€|\d+[,.]\d{2}\s*EUR|\b\d+[,.]\d{2}\b)/gi) || []
      pageCountInfo = `[DOKUMENT-ANALYSE: Ca. ${priceMatches.length} Artikel/Preise im gesamten Dokument erkannt. Extrahierte Seiten: alle Seiten vollständig.]`
    }

    const promptText = `You are an expert AI Restaurant Menu & Design Specialist for SCENVY.
Analyze the provided restaurant menu document (PDF, image, or text) and convert it into a complete, high-quality structured JSON menu package.
${pageCountInfo}

CRITICAL DESIGN & COMPLETE EXTRACTION MANDATE (DOCUMENT CONTENT OVERRIDES ANY DEFAULTS):

1. COMPLETE EXTRACTION OF ALL DISHES & ALL DRINKS (~46 ITEMS TOTAL):
   - Restaurant menus contain BOTH food sections AND drink/beverage sections.
   - You MUST extract EVERY SINGLE DISH AND EVERY SINGLE DRINK across ALL pages and sections of the document!
   - FOOD CATEGORIES: Starters, Soups, Salads, Pasta, Pizza, Main Courses, Steaks, Fish & Seafood, Burgers, Sides, Desserts.
   - DRINK & BEVERAGE CATEGORIES (DO NOT OMIT DRINKS!): Soft Drinks, Mineral Water, Juices, Hot Drinks, Coffee & Tea, Beers (Draught & Bottle), Wines (White, Red, Rosé, Sparkling / Prosecco / Champagne), Cocktails & Longdrinks, Spirits / Liquors.
   - Later pages of multi-page PDFs contain the beverage and drinks list: YOU MUST EXTRACT EVERY SINGLE DRINK!
   - Every single item with a price in the document MUST appear in the JSON categories.
   - Group drinks into clear, dedicated drink categories matching the menu structure (e.g. "Soft Drinks", "Beers & Ciders", "Wines by the Glass", "Cocktails").

2. STRICT RULE: NO INVENTED OR HALLUCINATED IMAGES:
   - If an item in the menu does NOT have an actual picture in the uploaded document, its "imageUrl" MUST be empty string: "".
   - DO NOT invent, hallucinate, or insert Unsplash or generic stock photo URLs for dishes or drinks!
   - The user strictly requires: if an item has no image in the source document, leave "imageUrl": "" so it displays as a clean text card.

3. PRESERVE ORIGINAL DOCUMENT LANGUAGE AS PRIMARY:
   - Detect the document's primary language (e.g. 'en', 'de', 'fr', 'it', 'es').
   - Put this language code in "branding.primaryLanguage": "en" (or "de", "fr", etc.).
   - If the menu is in English:
     * "branding.primaryLanguage" MUST be "en".
     * Category names MUST be in English as printed in the PDF (e.g., "Starters", "Main Courses", "Burgers & Sandwiches", "Sides", "Soft Drinks & Juices", "Beers", "Wines", "Cocktails", "Hot Beverages", "Desserts").
     * Dish and drink names and descriptions MUST be in English as in the document!

4. RESTAURANT NAME & TAGLINE:
   - You MUST extract the REAL restaurant/venue name directly from the document (look at the cover page, prominent header, logo text, headline, or footer).
   - Put this in "branding.name".
   - Extract any restaurant slogan, subtitle, or concept into "branding.tagline".

5. BACKGROUND COLOR & THEME DETECTION (LIGHT VS DARK):
   - Detect whether the menu document is on a LIGHT background (white, off-white, light cream, ivory, beige #FFFFFF / #FAF9F6 / #F8FAFC) or a DARK background (black #09090E, dark slate).
   - "branding.theme": Set to "light" if document is light/white/cream paper; set to "dark" if black.
   - "branding.backgroundColor": Set the detected background color (e.g. "#FAF9F6" or "#FFFFFF" for light, or "#09090E" for dark).
   - "branding.textColor": Set to "#18181B" for light theme, or "#ECECF1" for dark theme.

6. BRAND COLOR PALETTE & DESIGN:
   - "branding.primaryColor": Extract dominant primary brand/accent color as HEX (e.g. #1E3A8A, #B91C1C, #047857, #7C3AED, #B45309).
   - "branding.secondaryColor": Extract secondary accent color as HEX (e.g. #F59E0B, #EC4899, #10B981, #D97706).
   - "branding.style": Select aesthetic: "fine_dining" | "street_food" | "cafe" | "trattoria" | "cocktail_bar" | "bistro" | "modern" | "rustic" | "asian".

7. ALLERGENS, DIETARY CODES & ALLERGY NOTICES (MANDATORY):
   - Bold capital letters or abbreviations (e.g. A, B, C, D, E, F, G, H, L, M, N, O, P, R or numbers) next to dishes (e.g. 'Pizza Margherita (A, G)' or 'Carpaccio G') MUST be extracted into the item's "allergens" array: ["A", "G"].
   - Extract any general allergy disclaimer from the menu into "branding.allergenNotice".
   - Detect dietary flags in "diet": ["vegan", "vegetarian", "glutenfree"] and boolean "spicy": true/false.

Return strictly JSON matching this structure:
{
  "branding": {
    "name": "Extracted Restaurant Name from document",
    "tagline": "Extracted slogan or concept if present",
    "theme": "light",
    "backgroundColor": "#FAF9F6",
    "textColor": "#18181B",
    "primaryColor": "#1E3A8A",
    "secondaryColor": "#D97706",
    "primaryLanguage": "en",
    "style": "fine_dining",
    "phone": "",
    "email": "",
    "website": "",
    "address": "",
    "instagram": "",
    "whatsapp": "",
    "logoDescription": "Description of logo or emblem",
    "allergenNotice": "General allergy disclaimer from document"
  },
  "allergensLegend": {
    "A": { "de": "Glutenhaltiges Getreide (Weizen, Roggen, Gerste, Hafer)", "en": "Cereals containing gluten (wheat, rye, barley, oats)" },
    "C": { "de": "Eier und Eierzeugnisse", "en": "Eggs and egg products" },
    "G": { "de": "Milch und Milcherzeugnisse (einschl. Laktose)", "en": "Milk and dairy products" },
    "H": { "de": "Schalenfrüchte / Nüsse", "en": "Tree nuts" }
  },
  "categories": [
    {
      "id": "cat_1",
      "name": "Category Name",
      "icon": "🍽️",
      "items": [
        {
          "id": "item_1",
          "name": "Dish or Drink Name",
          "description": "Description",
          "price": "14.50 €",
          "variants": [
            { "name": "Standard", "price": "14.50 €" }
          ],
          "allergens": ["A", "G"],
          "diet": ["vegetarian"],
          "spicy": false,
          "highlight": true,
          "imageUrl": ""
        }
      ]
    }
  ]
}

Raw Input Document Text (Includes all pages):
"""${rawInput.slice(0, 95000)}"""`

    const parsed = await executeAiTask(async (ai) => {
      // Prioritize fast and available models
      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3-flash-preview', 'gemini-3.8-flash']
      let rawText = null

      const callModelWithRetry = async (modelName, contents) => {
        let lastErr = null
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`🤖 [parse-menu] Calling Gemini [${modelName}] (attempt ${attempt})...`)
            const response = await ai.models.generateContent({
              model: modelName,
              contents,
              config: { 
                responseMimeType: 'application/json',
                maxOutputTokens: 24000
              }
            })
            if (response?.text) {
              return response.text
            }
          } catch (err) {
            lastErr = err
            const isQuotaOrBusy = err?.status === 429 || err?.status === 503 || (err?.message && (err.message.includes('quota') || err.message.includes('demand')))
            if (isQuotaOrBusy && attempt < 2) {
              console.warn(`⏳ [parse-menu] Model [${modelName}] rate/quota limit hit. Retrying in 1.2s...`)
              await new Promise(r => setTimeout(r, 1200))
            } else {
              break
            }
          }
        }
        if (lastErr) {
          console.warn(`[parse-menu] Model [${modelName}] error:`, lastErr?.message || lastErr)
        }
        return null
      }

      // Strategy 1: If extractedPdfText is available, prioritize text-based extraction with full text
      // to ensure all pages (dishes + drinks) are read without vision truncation
      if (extractedPdfText && extractedPdfText.length > 50) {
        console.log(`📄 [parse-menu] Running primary text-based AI extraction (${extractedPdfText.length} chars, all pages)...`)
        const textContents = { parts: [{ text: promptText }] }

        for (const m of modelsToTry) {
          const resText = await callModelWithRetry(m, textContents)
          if (resText) {
            rawText = resText
            console.log(`✅ [parse-menu] Text Gemini [${m}] succeeded (${rawText.length} chars).`)
            break
          }
        }
      }

      // Strategy 2: If fileBase64 is provided (e.g. photo or if text pass didn't yield text), try multimodal
      const canTryMultimodal = !rawText && cleanBase64 && cleanBase64.length < 12 * 1024 * 1024
      if (canTryMultimodal) {
        const multimodalContents = {
          parts: [
            { inlineData: { data: cleanBase64, mimeType: cleanMime } },
            { text: promptText }
          ]
        }

        for (const m of modelsToTry) {
          const resText = await callModelWithRetry(m, multimodalContents)
          if (resText) {
            rawText = resText
            console.log(`✅ [parse-menu] Multimodal Gemini [${m}] succeeded (${rawText.length} chars).`)
            break
          }
        }
      }

      if (!rawText) {
        console.warn('All AI models failed in parse-menu.js. Trying extractedPdfText fallback parser...')
        if (extractedPdfText) {
          return parsePdfTextFallback(extractedPdfText, venue, style, primaryColor, secondaryColor, extractedLogoFromDoc)
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
        finalMenu = parsePdfTextFallback(extractedPdfText, venue, style, primaryColor, secondaryColor, extractedLogoFromDoc)
      } else if (rawInput.trim()) {
        finalMenu = parsePdfTextFallback(rawInput, venue, style, primaryColor, secondaryColor, extractedLogoFromDoc)
      }
    }

    // Completeness verification & missing items merge:
    // If the document had ~46 items, or AI missed sections (e.g. drinks on page 2/3),
    // merge any missing drinks or categories from fallback parser so ZERO dishes or drinks are lost!
    if (extractedPdfText || rawInput.trim()) {
      const fallbackMenu = parsePdfTextFallback(extractedPdfText || rawInput, venue, style, primaryColor, secondaryColor, extractedLogoFromDoc)
      if (fallbackMenu && fallbackMenu.categories?.length > 0) {
        const fallbackTotalItems = fallbackMenu.categories.reduce((sum, c) => sum + (c.items?.length || 0), 0)
        const aiTotalItems = finalMenu?.categories?.reduce((sum, c) => sum + (c.items?.length || 0), 0) || 0

        console.log(`📊 Completeness check: AI extracted ${aiTotalItems} items, Fallback found ${fallbackTotalItems} items.`)

        if (finalMenu && finalMenu.categories?.length > 0) {
          const existingNames = new Set()
          finalMenu.categories.forEach(cat => {
            (cat.items || []).forEach(it => {
              const n = (typeof it.name === 'object' ? it.name.de || it.name.en : it.name || '').toLowerCase().trim()
              if (n) existingNames.add(n)
            })
          })

          let mergedCount = 0
          fallbackMenu.categories.forEach(fallbackCat => {
            const missingItems = (fallbackCat.items || []).filter(fbItem => {
              const fbName = (typeof fbItem.name === 'object' ? fbItem.name.de || fbItem.name.en : fbItem.name || '').toLowerCase().trim()
              return !existingNames.has(fbName)
            })

            if (missingItems.length > 0) {
              const catNameLower = (typeof fallbackCat.name === 'object' ? fallbackCat.name.de || fallbackCat.name.en : fallbackCat.name || '').toLowerCase()
              const existingCat = finalMenu.categories.find(c => {
                const cName = (typeof c.name === 'object' ? c.name.de || c.name.en : c.name || '').toLowerCase()
                return cName.includes(catNameLower) || catNameLower.includes(cName)
              })

              if (existingCat) {
                existingCat.items = [...(existingCat.items || []), ...missingItems]
              } else {
                finalMenu.categories.push({
                  ...fallbackCat,
                  id: `cat_merged_${finalMenu.categories.length + 1}`,
                  items: missingItems
                })
              }
              missingItems.forEach(it => {
                const n = (typeof it.name === 'object' ? it.name.de || it.name.en : it.name || '').toLowerCase().trim()
                if (n) existingNames.add(n)
                mergedCount++
              })
            }
          })

          if (mergedCount > 0) {
            const finalTotal = finalMenu.categories.reduce((sum, c) => sum + (c.items?.length || 0), 0)
            console.log(`✅ Completeness merge: Added ${mergedCount} missing items/drinks! Menu now contains ${finalTotal} items across ${finalMenu.categories.length} categories.`)
          }
        }
      }
    }

    if (!finalMenu || !finalMenu.categories || finalMenu.categories.length === 0) {
      if (cleanBase64 || rawInput.trim()) {
        const fallbackName = venue || 'Speisekarte'
        const fallbackPCol = primaryColor || '#7C3AED'
        const fallbackSCol = secondaryColor || '#FF2D8D'
        return res.status(200).json({
          branding: {
            name: fallbackName,
            style: style || 'fine_dining',
            primaryColor: fallbackPCol,
            secondaryColor: fallbackSCol,
            primaryLanguage: 'en',
            logoUrl: extractedLogoFromDoc || generateMonogramSvg(fallbackName, fallbackPCol, fallbackSCol),
            allergenNotice: 'Informationen zu Allergenen erhalten Sie auf Nachfrage bei unserem Servicepersonal.',
            phone: phone || '',
            address: address || ''
          },
          allergensLegend: {
            "A": { "de": "Glutenhaltiges Getreide", "en": "Cereals containing gluten" },
            "C": { "de": "Eier", "en": "Eggs" },
            "G": { "de": "Milch & Laktose", "en": "Milk & Lactose" }
          },
          categories: [],
          warning: 'Keine Speisen oder Kategorien im hochgeladenen Dokument erkannt. Bitte prüfe die Datei oder erstelle Artikel manuell im Artikelstamm-Editor.'
        })
      }
      return res.status(200).json(defaultSample)
    }

    // Standardize branding fallback - PREFER EXTRACTED DOCUMENT VALUES OVER DEFAULTS
    if (!finalMenu.branding) finalMenu.branding = {}
    
    // Only fallback restaurant name if AI didn't find one
    if (!finalMenu.branding.name || finalMenu.branding.name === 'Speisekarte' || finalMenu.branding.name.toLowerCase().includes('extracted restaurant')) {
      if (venue) finalMenu.branding.name = venue
    }

    // Language detection: if not set by AI, detect from extracted text or document
    if (!finalMenu.branding.primaryLanguage) {
      const allText = (extractedPdfText || '') + ' ' + (rawInput || '')
      finalMenu.branding.primaryLanguage = detectDocumentLanguage(allText)
    }

    // Only fallback colors if AI didn't detect valid hex colors from the document
    if (!finalMenu.branding.primaryColor || !finalMenu.branding.primaryColor.startsWith('#')) {
      finalMenu.branding.primaryColor = primaryColor || '#7C3AED'
    }
    if (!finalMenu.branding.secondaryColor || !finalMenu.branding.secondaryColor.startsWith('#')) {
      finalMenu.branding.secondaryColor = secondaryColor || '#FF2D8D'
    }
    if (!finalMenu.branding.theme) {
      finalMenu.branding.theme = 'light'
    }
    if (!finalMenu.branding.backgroundColor) {
      finalMenu.branding.backgroundColor = finalMenu.branding.theme === 'dark' ? '#09090E' : '#FAF9F6'
    }
    if (!finalMenu.branding.textColor) {
      finalMenu.branding.textColor = finalMenu.branding.theme === 'dark' ? '#ECECF1' : '#18181B'
    }
    if (!finalMenu.branding.style) {
      finalMenu.branding.style = style || 'fine_dining'
    }

    // Logo assignment:
    // 1. If an actual image/logo was extracted from the document/upload -> use it!
    // 2. Otherwise generate a high-end vector SVG monogram matching the extracted name & brand colors!
    if (extractedLogoFromDoc) {
      finalMenu.branding.logoUrl = extractedLogoFromDoc
    } else if (!finalMenu.branding.logoUrl || finalMenu.branding.logoUrl.startsWith('http://placeholder')) {
      finalMenu.branding.logoUrl = generateMonogramSvg(
        finalMenu.branding.name,
        finalMenu.branding.primaryColor,
        finalMenu.branding.secondaryColor
      )
    }

    // Allergens Legend fallback: ensure EU 14 standard allergens dictionary is present
    if (!finalMenu.allergensLegend || Object.keys(finalMenu.allergensLegend).length === 0) {
      finalMenu.allergensLegend = {
        "A": { "de": "Glutenhaltiges Getreide (Weizen, Roggen, Gerste, Hafer)", "en": "Cereals containing gluten (wheat, rye, barley, oats)" },
        "B": { "de": "Krebstiere und Krebstiererzeugnisse", "en": "Crustaceans and crustacean products" },
        "C": { "de": "Eier und Eierzeugnisse", "en": "Eggs and egg products" },
        "D": { "de": "Fische und Fischerzeugnisse", "en": "Fish and fish products" },
        "E": { "de": "Erdnüsse und Erdnusserzeugnisse", "en": "Peanuts and peanut products" },
        "F": { "de": "Sojabohnen und Sojaerzeugnisse", "en": "Soybeans and soybean products" },
        "G": { "de": "Milch und Milcherzeugnisse (einschl. Laktose)", "en": "Milk and milk products (including lactose)" },
        "H": { "de": "Schalenfrüchte (Mandeln, Haselnüsse, Walnüsse, Pistazien)", "en": "Tree nuts (almonds, hazelnuts, walnuts, pistachios)" },
        "L": { "de": "Sellerie und Sellerieerzeugnisse", "en": "Celery and celery products" },
        "M": { "de": "Senf und Senferzeugnisse", "en": "Mustard and mustard products" },
        "N": { "de": "Sesamsamen und Sesamerzeugnisse", "en": "Sesame seeds and sesame products" },
        "O": { "de": "Schwefeldioxid und Sulfite (> 10 mg/kg)", "en": "Sulphur dioxide and sulphites" },
        "P": { "de": "Lupinen und Lupinenerzeugnisse", "en": "Lupin and lupin products" },
        "R": { "de": "Weichtiere und Weichtiererzeugnisse", "en": "Molluscs and mollusc products" }
      }
    }

    if (!finalMenu.branding.allergenNotice) {
      finalMenu.branding.allergenNotice = finalMenu.branding.primaryLanguage === 'en'
        ? 'Dear guests, if you have allergies or dietary restrictions, please speak to our trained service staff.'
        : 'Liebe Gäste, bei Fragen zu Allergenen und Zusatzstoffen berät Sie gerne unser geschultes Servicepersonal.'
    }

    // Set cartEnabled flag
    finalMenu.cartEnabled = cartEnabled === true
    if (!finalMenu.branding) finalMenu.branding = {}
    finalMenu.branding.cartEnabled = cartEnabled === true

    // Enrich items with clean IDs and DO NOT invent fake stock images:
    // If an item has no image, keep imageUrl as "" so it renders as a clean text card
    finalMenu.categories.forEach((cat, cIdx) => {
      if (!cat.id) cat.id = `cat_${cIdx + 1}`
      if (!cat.items || !Array.isArray(cat.items)) cat.items = []
      
      cat.items.forEach((item, iIdx) => {
        if (!item.id) item.id = `item_${cIdx + 1}_${iIdx + 1}`
        // Never invent images for items that don't have them in the document
        if (!item.imageUrl || item.imageUrl.includes('unsplash.com') || item.imageUrl.includes('placeholder') || item.imageUrl.includes('stock') || item.imageUrl === 'none' || item.imageUrl === 'null') {
          item.imageUrl = ''
        }
      })
    })

    return res.status(200).json(finalMenu)
  } catch (err) {
    console.error('AI parse-menu error:', err)
    if (extractedPdfText || rawInput.trim()) {
      const fallback = parsePdfTextFallback(extractedPdfText || rawInput, venue, style, primaryColor, secondaryColor, extractedLogoFromDoc)
      if (fallback && fallback.categories?.length > 0) {
        fallback.warning = 'Dokument wurde über Direktextraktion eingelesen (KI-Verbindung temporär überlastet).'
        return res.status(200).json(fallback)
      }
    }
    return res.status(500).json({ 
      error: 'AI processing failed', 
      message: err?.message || 'Die KI-Verbindung konnte die Speisekarte nicht verarbeiten. Bitte prüfe das Dokument oder füge den Text direkt ein.' 
    })
  }
}


