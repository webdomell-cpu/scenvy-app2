const fs = require('fs');

let content = fs.readFileSync('api/ai/ai-key-manager.js', 'utf-8');

const target = `// Ensure pool initialized
initKeyPool()

export function getKeyPoolStatus() {
  if (keyPool.length === 0) initKeyPool()`;

const replacement = `import fs from 'fs'
const KEYS_FILE = 'scenvy_ai_keys.json'

function loadSavedKeys() {
  try {
    if (fs.existsSync(KEYS_FILE)) {
      const saved = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf-8'))
      saved.forEach(k => {
        if (!keyPool.find(existing => existing.apiKey === k.apiKey)) {
          keyPool.push(k)
        }
      })
    }
  } catch (e) {
    console.error('Error loading saved keys', e)
  }
}

function saveKeys() {
  try {
    const toSave = keyPool.filter(k => k.id && !k.id.includes('primary') && !k.id.includes('gemini-extra'))
    fs.writeFileSync(KEYS_FILE, JSON.stringify(toSave, null, 2))
  } catch (e) {
    console.error('Error saving keys', e)
  }
}

// Ensure pool initialized
initKeyPool()
loadSavedKeys()

export function getKeyPoolStatus() {
  if (keyPool.length === 0) {
    initKeyPool()
    loadSavedKeys()
  }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  content = content.replace(
    `    priority\n  })\n  return true`,
    `    priority\n  })\n  saveKeys()\n  return true`
  );
  content = content.replace(
    `  if (keyPool.length === 0) {\n    initKeyPool()\n  }`,
    `  if (keyPool.length === 0) {\n    initKeyPool()\n    loadSavedKeys()\n  }`
  );
  fs.writeFileSync('api/ai/ai-key-manager.js', content);
  console.log('patched ai-key-manager.js');
} else {
  console.log('target not found in ai-key-manager.js');
}
