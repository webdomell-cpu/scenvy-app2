const fs = require('fs');
let text = fs.readFileSync('src/pages/GuestMenuReel.jsx', 'utf8');

const target = `  const updateCategoryName = (catIndex, value) => {
    const updated = JSON.parse(JSON.stringify(menu))
    updated.categories[catIndex].name[lang] = value
    setMenu(updated)
    if (onSaveMenu) onSaveMenu(updated)
  }`;

const replacement = `  const updateCategoryName = (catIndex, value) => {
    const updated = JSON.parse(JSON.stringify(menu))
    if (typeof updated.categories[catIndex].name === 'object') {
      updated.categories[catIndex].name[lang] = value
    } else {
      updated.categories[catIndex].name = value
    }
    setMenu(updated)
    if (onSaveMenu) onSaveMenu(updated)
  }`;

text = text.replace(target, replacement);

fs.writeFileSync('src/pages/GuestMenuReel.jsx', text);
