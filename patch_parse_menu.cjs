const fs = require('fs');
let content = fs.readFileSync('api/ai/parse-menu.js', 'utf-8');

const badLogic = `    // Enrich with default image URLs if missing
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
    }`;

const goodLogic = `    // Enrich with AI generated images for up to 4 items sequentially
    if (parsed.categories && Array.isArray(parsed.categories)) {
      let generatedCount = 0;
      for (const cat of parsed.categories) {
        if (cat.items && Array.isArray(cat.items)) {
          for (const item of cat.items) {
            if (!item.imageUrl && generatedCount < 4) {
              try {
                item.imageUrl = await executeAiTask(async (ai) => {
                  const imgRes = await ai.models.generateContent({
                    model: 'gemini-3.1-flash-image',
                    contents: { parts: [{ text: \`Atmospheric professional food photography of \${item.name.en || item.name.de}, \${item.description.en || ''}, highly detailed, cinematic lighting, 8k resolution\` }] },
                  });
                  for (const part of imgRes.candidates[0].content.parts) {
                    if (part.inlineData) {
                      return \`data:image/jpeg;base64,\${part.inlineData.data}\`;
                    }
                  }
                  return null;
                });
                if (item.imageUrl) {
                  generatedCount++;
                }
              } catch (e) {
                console.error("Failed to generate image for", item.name.en, e);
              }
            }
          }
        }
      }
    }`;

content = content.replace(badLogic, goodLogic);
fs.writeFileSync('api/ai/parse-menu.js', content);
