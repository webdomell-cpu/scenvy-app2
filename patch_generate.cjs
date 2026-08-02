const fs = require('fs');
let content = fs.readFileSync('api/ai/generate.js', 'utf-8');

// Add import
if (!content.includes('GenerateVideosOperation')) {
  content = content.replace(
    "import { checkRateLimitAndAuth } from './ai-guard.js'",
    "import { checkRateLimitAndAuth } from './ai-guard.js'\nimport { GenerateVideosOperation } from '@google/genai'"
  );
}

const targetImageGen = `    if (isVideo) {
      const videoPool = [
        'https://assets.mixkit.co/videos/preview/mixkit-barman-preparing-a-cocktail-in-a-glass-42867-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-pouring-a-cocktail-into-a-glass-42866-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-chef-decorating-a-dish-42875-large.mp4'
      ]
      imageUrl = videoPool[Math.floor(Math.random() * videoPool.length)]
    } else {
      // Try Imagen 3 image generation with Round-Robin key failover
      try {
        const imgPrompt = parsed.imagePrompt || \`Atmospheric vertical portrait photo of \${venue || 'a venue'}, \${offer}\`
        imageUrl = await executeAiTask(async (ai) => {
          const imgRes = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: \`\${imgPrompt}, vertical 9:16 aspect ratio, 8k resolution, professional food photography\`,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '9:16'
            }
          })
          const b64 = imgRes.generatedImages?.[0]?.image?.imageBytes
          if (b64) return \`data:image/jpeg;base64,\${b64}\`
          return null
        })
      } catch (imgErr) {
        console.warn('⚠️ [Multi-AI] Imagen generation notice, switching to smart imagery:', imgErr.message)
      }

      if (!imageUrl) {
        imageUrl = getSmartImageForPrompt(offer + ' ' + (parsed.imagePrompt || ''), type)
      }
    }`;

const replacementImageGen = `    if (isVideo) {
      try {
        const imgPrompt = parsed.imagePrompt || \`Atmospheric vertical portrait of \${venue || 'a venue'}, \${offer}\`
        imageUrl = await executeAiTask(async (ai) => {
          const operation = await ai.models.generateVideos({
            model: 'veo-3.1-lite-generate-preview',
            prompt: \`\${imgPrompt}, cinematic vertical video, 4k quality, highly detailed\`,
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
             const videoRes = await fetch(uri, { headers: { 'x-goog-api-key': ai.apiKey || process.env.GEMINI_API_KEY } });
             const arrayBuffer = await videoRes.arrayBuffer();
             const b64 = Buffer.from(arrayBuffer).toString('base64');
             return \`data:video/mp4;base64,\${b64}\`;
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
        const imgPrompt = parsed.imagePrompt || \`Atmospheric vertical portrait photo of \${venue || 'a venue'}, \${offer}\`
        imageUrl = await executeAiTask(async (ai) => {
          const imgRes = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image',
            contents: { parts: [{ text: \`\${imgPrompt}, vertical 9:16 aspect ratio, 8k resolution, professional food photography\` }] },
            config: {
              imageConfig: {
                aspectRatio: "9:16",
                imageSize: "1K"
              }
            }
          })
          for (const part of imgRes.candidates[0].content.parts) {
            if (part.inlineData) {
              return \`data:image/png;base64,\${part.inlineData.data}\`;
            }
          }
          return null
        })
      } catch (imgErr) {
        console.warn('⚠️ [Multi-AI] Imagen generation notice, switching to smart imagery:', imgErr.message)
      }

      if (!imageUrl) {
        imageUrl = getSmartImageForPrompt(offer + ' ' + (parsed.imagePrompt || ''), type)
      }
    }`;

content = content.replace(targetImageGen, replacementImageGen);
fs.writeFileSync('api/ai/generate.js', content);
