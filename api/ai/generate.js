import { executeAiTask, getKeyPoolStatus } from './ai-key-manager.js'
import { checkRateLimitAndAuth } from './ai-guard.js'
import { GenerateVideosOperation } from '@google/genai'

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

  const guard = checkRateLimitAndAuth(req, 15)
  if (!guard.allowed) {
    return res.status(guard.status).json({ error: guard.error })
  }

  const { venue, offer, type, tone, isVideo, userImage } = req.body || {}
  if (!offer) return res.status(400).json({ error: 'offer is required' })

  // Smart prompt-to-image match helper with expanded HD Unsplash food & venue collection
  const getSmartImageForPrompt = (promptText, type) => {
    const text = (promptText + ' ' + (offer || '') + ' ' + (venue || '')).toLowerCase()
    const r = (arr) => arr[Math.floor(Math.random() * arr.length)]
    
    if (text.includes('sushi') || text.includes('roll') || text.includes('japan') || text.includes('sashimi') || text.includes('maki')) {
      return r([
        'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1611143669185-af224c5e3252?q=80&w=600&auto=format&fit=crop'
      ])
    }
    if (text.includes('burger') || text.includes('smash') || text.includes('fries') || text.includes('beef') || text.includes('cheeseburger')) {
      return r([
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1594212202875-86ac5a40dbcc?q=80&w=600&auto=format&fit=crop'
      ])
    }
    if (text.includes('pizza') || text.includes('trattoria') || text.includes('pasta') || text.includes('italy') || text.includes('burrata')) {
      return r([
        'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=600&auto=format&fit=crop'
      ])
    }
    if (text.includes('steak') || text.includes('grill') || text.includes('ribeye') || text.includes('meat') || text.includes('bbq')) {
      return r([
        'https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=600&auto=format&fit=crop'
      ])
    }
    if (text.includes('salad') || text.includes('vegan') || text.includes('bowl') || text.includes('healthy') || text.includes('avocado')) {
      return r([
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=600&auto=format&fit=crop'
      ])
    }
    if (text.includes('dessert') || text.includes('cake') || text.includes('tiramisu') || text.includes('sweet') || text.includes('ice') || text.includes('chocolate')) {
      return r([
        'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=600&auto=format&fit=crop'
      ])
    }
    if (text.includes('coffee') || text.includes('cafe') || text.includes('cappuccino') || text.includes('brunch') || text.includes('bakery') || text.includes('croissant')) {
      return r([
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=600&auto=format&fit=crop'
      ])
    }
    if (text.includes('event') || text.includes('party') || text.includes('dj') || text.includes('night') || text.includes('club') || text.includes('festival')) {
      return r([
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1533174000253-1d5b4a091040?q=80&w=600&auto=format&fit=crop'
      ])
    }
    if (text.includes('cocktail') || text.includes('bar') || text.includes('drink') || text.includes('aperol') || text.includes('wine') || text.includes('gin')) {
      return r([
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=600&auto=format&fit=crop'
      ])
    }
    if (text.includes('rooftop') || text.includes('lounge') || text.includes('terrace') || text.includes('view') || text.includes('dubai')) {
      return r([
        'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1521017430055-16fb194917dc?q=80&w=600&auto=format&fit=crop'
      ])
    }

    const fallbacks = {
      offer: r(['https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1414235077428-338988692286?q=80&w=600&auto=format&fit=crop']),
      event: r(['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1533174000253-1d5b4a091040?q=80&w=600&auto=format&fit=crop']),
      menu: r(['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop']),
      promo: r(['https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=600&auto=format&fit=crop'])
    }
    return fallbacks[type] || fallbacks.offer
  }

  // 1. Generate text with Round-Robin AI execute task
  let parsed = null
  const textPrompt = `You are the creative director for SCENVY, a TikTok-style reel platform for hospitality venues.

Create a reel content package for:
- Venue: ${venue || 'the venue'}
- Message/Offer: ${offer}
- Type: ${type || 'offer'}
- Tone: ${tone || 'exciting'}

Reply ONLY with compact valid JSON:
{
  "hook": "ATTENTION MAX 6 WORDS ALL CAPS",
  "headline": "compelling main message max 8 words",
  "subtext": "one short supporting sentence",
  "cta": "2-3 word button text",
  "hashtags": ["tag1", "tag2", "tag3"],
  "emoji": "single emoji",
  "urgency": "short scarcity line or empty string",
  "colorMood": "purple|pink|blue|orange|green",
  "imagePrompt": "English prompt describing a photorealistic, atmospheric vertical portrait photo for this venue offer"
}`

  try {
    parsed = await executeAiTask(async (ai) => {
      let textRes = null
      const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash']
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
          console.warn(`Model ${m} failed in generate.js:`, e?.message)
        }
      }

      const rawText = textRes?.text || '{}'
      return JSON.parse(rawText.replace(/```json|```/g, '').trim())
    })
  } catch (err) {
    console.warn('⚠️ [Multi-AI] Text generation fallback triggered:', err.message)
    const moodMap = { offer: 'purple', event: 'pink', menu: 'blue', promo: 'orange' }
    parsed = {
      hook: 'JETZT ENTDECKEN 🔥',
      headline: offer.length > 50 ? offer.slice(0, 50) + '…' : offer,
      subtext: `Exklusiv bei ${venue || 'deinem Venue'} — nicht verpassen!`,
      cta: 'Jetzt ansehen',
      hashtags: ['scenvy', type || 'offer', 'gourmet'],
      emoji: type === 'event' ? '🎉' : type === 'menu' ? '🍽️' : '🍹',
      urgency: 'Nur für begrenzte Zeit',
      colorMood: moodMap[type] || 'purple',
      imagePrompt: `Atmospheric photo of ${venue || 'venue'}, ${offer}`
    }
  }

  // 2. Image Selection: User Image > Imagen 3 AI Image > Smart Keyword Stock Match
  let imageUrl = userImage || null

  if (!imageUrl) {
    if (isVideo) {
      try {
        const imgPrompt = parsed.imagePrompt || `Atmospheric vertical portrait of ${venue || 'a venue'}, ${offer}`
        imageUrl = await executeAiTask(async (ai, currentKeyObj) => {
          const operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-preview',
            prompt: `${imgPrompt}, cinematic vertical video, 4k quality, highly detailed`,
            config: {
              numberOfVideos: 1,
              resolution: '1080p',
              aspectRatio: '9:16'
            }
          });

          let op = new GenerateVideosOperation();
          op.name = operation.name;
          let updated = await ai.operations.getVideosOperation({ operation: op });
          let retries = 0;
          while (!updated.done && retries < 40) {
             await new Promise(resolve => setTimeout(resolve, 5000));
             updated = await ai.operations.getVideosOperation({ operation: op });
             retries++;
          }
          
          const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
          if (uri) {
             const videoRes = await fetch(uri, { headers: { 'x-goog-api-key': currentKeyObj.apiKey || process.env.GEMINI_API_KEY } });
             const arrayBuffer = await videoRes.arrayBuffer();
             const b64 = Buffer.from(arrayBuffer).toString('base64');
             return `data:video/mp4;base64,${b64}`;
          }
          return null;
        });
      } catch (vidErr) {
        console.warn('⚠️ [Multi-AI] Veo generation notice, switching to fallback:', vidErr.message);
      }
      if (!imageUrl) {
        const videoPool = [
          'https://assets.mixkit.co/videos/preview/mixkit-barman-preparing-a-cocktail-in-a-glass-42867-large.mp4',
          'https://assets.mixkit.co/videos/preview/mixkit-pouring-a-cocktail-into-a-glass-42866-large.mp4',
          'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-chef-decorating-a-dish-42875-large.mp4'
        ];
        imageUrl = videoPool[Math.floor(Math.random() * videoPool.length)];
      }
    } else {
      // Try Imagen 3 image generation with Round-Robin key failover
      try {
        const imgPrompt = parsed.imagePrompt || `Atmospheric vertical portrait photo of ${venue || 'a venue'}, ${offer}`
        imageUrl = await executeAiTask(async (ai) => {
          const imgRes = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: `${imgPrompt}, vertical 9:16 aspect ratio, 8k resolution, professional food photography`,
            config: {
              numberOfImages: 1,
              aspectRatio: '9:16',
              outputMimeType: 'image/jpeg'
            }
          })
          if (imgRes?.generatedImages?.[0]?.image?.imageBytes) {
            return `data:image/jpeg;base64,${imgRes.generatedImages[0].image.imageBytes}`;
          }
          return null
        })
      } catch (imgErr) {
        console.warn('⚠️ [Multi-AI] Imagen generation notice, switching to smart imagery:', imgErr.message)
      }

      if (!imageUrl) {
        imageUrl = getSmartImageForPrompt(offer + ' ' + (parsed.imagePrompt || ''), type)
      }
    }
  }

  return res.status(200).json({
    hook: parsed.hook || 'JETZT ENTDECKEN 🔥',
    headline: parsed.headline || offer,
    subtext: parsed.subtext || `Exklusiv bei ${venue || 'deinem Venue'}.`,
    cta: parsed.cta || 'Jetzt ansehen',
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ['scenvy', 'dubai'],
    emoji: parsed.emoji || (isVideo ? '🎥' : '✨'),
    urgency: parsed.urgency || '',
    colorMood: parsed.colorMood || 'purple',
    imageUrl,
    mediaUrl: imageUrl,
    mediaType: isVideo ? 'video' : 'image'
  })
}
