import { executeAiTask, getKeyPoolStatus } from './ai-key-manager.js'
import { checkRateLimitAndAuth } from './ai-guard.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-user-id')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    // Expose AI pool status for monitoring
    return res.status(200).json({ status: 'ok', pool: getKeyPoolStatus() })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const guard = checkRateLimitAndAuth(req, 30)
  if (!guard.allowed) {
    return res.status(guard.status).json({ error: guard.error })
  }

  const { venue, offer, type, tone, isVideo, userImage, duration = 5, motionEffect = 'zoom' } = req.body || {}
  if (!offer && !userImage) return res.status(400).json({ error: 'offer or userImage is required' })

  const sanitizedOffer = offer || 'Exklusives Special'
  const textPrompt = `You are the creative director for SCENVY, a premier TikTok-style vertical reel and hospitality video story platform.

Create an engaging vertical reel / story package for:
- Venue: ${venue || 'das Venue'}
- Message/Offer/Prompt: ${sanitizedOffer}
- Content Type: ${type || 'offer'} (offer, event, menu, promo)
- Tone: ${tone || 'exciting'}

Respond ONLY with valid, compact JSON:
{
  "hook": "ATTENTION-GRABBING HOOK MAX 5 WORDS ALL CAPS",
  "headline": "compelling main title max 7 words",
  "subtext": "one enticing supporting sentence for guests",
  "cta": "2-3 word button text (e.g. Jetzt reservieren, Tisch sichern, Bestellen)",
  "hashtags": ["tag1", "tag2", "tag3"],
  "emoji": "single relevant emoji",
  "urgency": "short scarcity or time line",
  "colorMood": "purple|pink|blue|orange|green",
  "imagePrompt": "A detailed English prompt for a photorealistic, stunning 9:16 vertical smartphone photo of this food/drink/venue",
  "videoConcept": "Description of the 5-second dynamic motion story"
}`

  // 1. Generate text package with Gemini AI (fallback-safe)
  let parsed = null
  try {
    parsed = await executeAiTask(async (ai) => {
      let textRes = null
      const modelsToTry = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.7-flash', 'gemini-3.8-flash']
      
      for (const m of modelsToTry) {
        try {
          textRes = await ai.models.generateContent({
            model: m,
            contents: textPrompt,
            config: {
              responseMimeType: 'application/json'
            }
          })
          if (textRes?.text) break
        } catch (e) {
          const msg = e?.message || ''
          if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand')) {
            console.log(`[AI Engine] Model ${m} is temporarily busy (503), trying next model...`)
          } else {
            console.warn(`[AI Engine] Model ${m} retry notice:`, msg)
          }
        }
      }

      const rawText = textRes?.text || '{}'
      return JSON.parse(rawText.replace(/```json|```/g, '').trim())
    })
  } catch (err) {
    console.warn('⚠️ [AI Engine] Text generation fallback triggered:', err?.message)
    const moodMap = { offer: 'purple', event: 'pink', menu: 'blue', promo: 'orange' }
    parsed = {
      hook: 'JETZT ENTDECKEN 🔥',
      headline: sanitizedOffer.length > 40 ? sanitizedOffer.slice(0, 40) + '…' : sanitizedOffer,
      subtext: `Exklusiv bei ${venue || 'deinem Venue'} — nur für kurze Zeit genießen!`,
      cta: 'Jetzt reservieren',
      hashtags: ['scenvy', type || 'offer', 'gourmet', 'lifestyle'],
      emoji: type === 'event' ? '🎉' : type === 'menu' ? '🍽️' : isVideo ? '🎥' : '🍹',
      urgency: 'Nur heute & solange der Vorrat reicht',
      colorMood: moodMap[type] || 'purple',
      imagePrompt: `Stunning 9:16 vertical photo of ${venue || 'luxury restaurant'}, ${sanitizedOffer}, gourmet food photography, warm ambient lighting`,
      videoConcept: '5-second dynamic cinematic hospitality story'
    }
  }

  // 2. Video Match / 5-Second Video Story Clips pool
  const getSmartVideoForPrompt = (promptText) => {
    const text = (promptText + ' ' + sanitizedOffer + ' ' + (venue || '')).toLowerCase()
    const r = (arr) => arr[Math.floor(Math.random() * arr.length)]

    if (text.includes('cocktail') || text.includes('bar') || text.includes('drink') || text.includes('aperol') || text.includes('gin') || text.includes('wine')) {
      return r([
        'https://assets.mixkit.co/videos/preview/mixkit-barman-preparing-a-cocktail-in-a-glass-42867-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-pouring-a-cocktail-into-a-glass-42866-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-bartender-making-a-drink-at-a-bar-42869-large.mp4'
      ])
    }
    if (text.includes('champagne') || text.includes('prosecco') || text.includes('toast') || text.includes('cheers') || text.includes('vip')) {
      return r([
        'https://assets.mixkit.co/videos/preview/mixkit-champagne-glasses-toast-at-a-celebration-42880-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-toast-with-beer-glasses-in-a-bar-42871-large.mp4'
      ])
    }
    if (text.includes('steak') || text.includes('meat') || text.includes('grill') || text.includes('bbq') || text.includes('ribeye')) {
      return r([
        'https://assets.mixkit.co/videos/preview/mixkit-cutting-a-piece-of-grilled-meat-42876-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-chef-decorating-a-dish-42875-large.mp4'
      ])
    }
    if (text.includes('burger') || text.includes('fries') || text.includes('fast food') || text.includes('snack')) {
      return r([
        'https://assets.mixkit.co/videos/preview/mixkit-placing-ingredients-on-a-hamburger-42878-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-taking-french-fries-out-of-the-fryer-42879-large.mp4'
      ])
    }
    if (text.includes('coffee') || text.includes('cafe') || text.includes('cappuccino') || text.includes('brunch') || text.includes('latte') || text.includes('bakery')) {
      return r([
        'https://assets.mixkit.co/videos/preview/mixkit-pouring-milk-to-make-a-coffee-with-foam-42868-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-coffee-being-poured-into-a-cup-42870-large.mp4'
      ])
    }
    if (text.includes('party') || text.includes('event') || text.includes('dj') || text.includes('club') || text.includes('rooftop') || text.includes('night')) {
      return r([
        'https://assets.mixkit.co/videos/preview/mixkit-people-dancing-at-a-party-with-lights-42881-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-toast-with-beer-glasses-in-a-bar-42871-large.mp4'
      ])
    }
    if (text.includes('dessert') || text.includes('cake') || text.includes('sweet') || text.includes('chocolate') || text.includes('ice cream')) {
      return r([
        'https://assets.mixkit.co/videos/preview/mixkit-chef-plating-a-delicious-dessert-42882-large.mp4'
      ])
    }

    // Default 5-second vertical culinary & bar video loops
    return r([
      'https://assets.mixkit.co/videos/preview/mixkit-barman-preparing-a-cocktail-in-a-glass-42867-large.mp4',
      'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-chef-decorating-a-dish-42875-large.mp4',
      'https://assets.mixkit.co/videos/preview/mixkit-pouring-milk-to-make-a-coffee-with-foam-42868-large.mp4',
      'https://assets.mixkit.co/videos/preview/mixkit-pouring-a-cocktail-into-a-glass-42866-large.mp4'
    ])
  }

  // 3. Smart Keyword Unsplash Curated 4K Vertical Image Match
  const getSmartImageForPrompt = (promptText) => {
    const text = (promptText + ' ' + sanitizedOffer + ' ' + (venue || '')).toLowerCase()
    const r = (arr) => arr[Math.floor(Math.random() * arr.length)]
    
    if (text.includes('sushi') || text.includes('japan') || text.includes('sashimi') || text.includes('maki')) {
      return r([
        'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=720&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=720&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1611143669185-af224c5e3252?q=80&w=720&auto=format&fit=crop'
      ])
    }
    if (text.includes('burger') || text.includes('smash') || text.includes('fries') || text.includes('beef')) {
      return r([
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=720&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=720&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1594212202875-86ac5a40dbcc?q=80&w=720&auto=format&fit=crop'
      ])
    }
    if (text.includes('pizza') || text.includes('pasta') || text.includes('italy') || text.includes('burrata')) {
      return r([
        'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=720&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=720&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=720&auto=format&fit=crop'
      ])
    }
    if (text.includes('steak') || text.includes('grill') || text.includes('meat') || text.includes('bbq')) {
      return r([
        'https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=720&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=720&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=720&auto=format&fit=crop'
      ])
    }
    if (text.includes('salad') || text.includes('vegan') || text.includes('bowl') || text.includes('avocado')) {
      return r([
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=720&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=720&auto=format&fit=crop'
      ])
    }
    if (text.includes('dessert') || text.includes('cake') || text.includes('tiramisu') || text.includes('chocolate')) {
      return r([
        'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=720&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=720&auto=format&fit=crop'
      ])
    }
    if (text.includes('coffee') || text.includes('cafe') || text.includes('cappuccino') || text.includes('brunch')) {
      return r([
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=720&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=720&auto=format&fit=crop'
      ])
    }
    if (text.includes('cocktail') || text.includes('bar') || text.includes('drink') || text.includes('wine')) {
      return r([
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=720&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=720&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=720&auto=format&fit=crop'
      ])
    }

    return r([
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=720&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=720&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=720&auto=format&fit=crop'
    ])
  }

  // 4. Media Resolution (Image or 5s Video)
  let generatedMediaUrl = userImage || null
  const isVideoMode = Boolean(isVideo)

  if (!generatedMediaUrl) {
    if (isVideoMode) {
      // Return 5-second vertical HD motion video clip matching the prompt
      generatedMediaUrl = getSmartVideoForPrompt(sanitizedOffer + ' ' + (parsed.imagePrompt || ''))
    } else {
      // Image Generation Workflow:
      // Step A: Try Google GenAI Image Models (e.g. gemini-3.1-flash-lite-image or gemini-3.1-flash-image)
      const imgPrompt = parsed.imagePrompt || `Atmospheric 9:16 vertical food photography of ${venue || 'restaurant'}, ${sanitizedOffer}`
      
      try {
        generatedMediaUrl = await executeAiTask(async (ai) => {
          const imgModels = ['gemini-3.1-flash-lite-image', 'gemini-3.1-flash-image']
          for (const m of imgModels) {
            try {
              const imgRes = await ai.models.generateContent({
                model: m,
                contents: {
                  parts: [{ text: `${imgPrompt}, 9:16 vertical smartphone portrait, professional food photography, 8k resolution, cinematic warm lighting` }]
                },
                config: {
                  imageConfig: { aspectRatio: '9:16' }
                }
              })
              for (const part of (imgRes.candidates?.[0]?.content?.parts || [])) {
                if (part.inlineData?.data) {
                  return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`
                }
              }
            } catch (e) {
              // Paid image model not enabled or quota exceeded, proceed to next step
            }
          }
          return null
        })
      } catch (genErr) {
        // Fall through to reliable Flux AI generator
      }

      // Step B: If Google GenAI image quota is unavailable, generate via Pollinations Flux AI (fast, 9:16 portrait)
      if (!generatedMediaUrl) {
        const cleanPrompt = encodeURIComponent(`${imgPrompt}, 9:16 vertical aspect ratio, delicious food photography, 4k ultra-detailed, professional lighting`)
        const randomSeed = Math.floor(Math.random() * 999999)
        generatedMediaUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=720&height=1280&nologo=true&seed=${randomSeed}&model=flux`
      }

      // Step C: High-res Unsplash backup in case URL resolution fails
      if (!generatedMediaUrl) {
        generatedMediaUrl = getSmartImageForPrompt(sanitizedOffer + ' ' + (parsed.imagePrompt || ''))
      }
    }
  }

  return res.status(200).json({
    hook: parsed.hook || 'JETZT ENTDECKEN 🔥',
    headline: parsed.headline || sanitizedOffer,
    subtext: parsed.subtext || `Exklusiv bei ${venue || 'deinem Venue'}.`,
    cta: parsed.cta || 'Jetzt ansehen',
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ['scenvy', 'flow', 'gourmet'],
    emoji: parsed.emoji || (isVideoMode ? '🎥' : '✨'),
    urgency: parsed.urgency || '',
    colorMood: parsed.colorMood || 'purple',
    imageUrl: generatedMediaUrl,
    mediaUrl: generatedMediaUrl,
    mediaType: isVideoMode ? 'video' : 'image',
    duration: Number(duration) || 5,
    motionEffect: motionEffect || 'zoom',
    videoConcept: parsed.videoConcept || '5-Sekunden Video Story'
  })
}
