const fs = require('fs');
let text = fs.readFileSync('src/pages/GuestMenuReel.jsx', 'utf8');

const target1 = `  const updateItemField = (catIndex, itemIndex, field, value) => {
    const updated = JSON.parse(JSON.stringify(menu))
    if (field === 'name' || field === 'description') {
      updated.categories[catIndex].items[itemIndex][field][lang] = value
    } else {
      updated.categories[catIndex].items[itemIndex][field] = value
    }
    setMenu(updated)
    if (onSaveMenu) onSaveMenu(updated)
  }`;

const replacement1 = `  const updateItemField = (catIndex, itemIndex, field, value) => {
    const updated = JSON.parse(JSON.stringify(menu))
    if (field === 'name' || field === 'description') {
      if (typeof updated.categories[catIndex].items[itemIndex][field] === 'object') {
        updated.categories[catIndex].items[itemIndex][field][lang] = value
      } else {
        updated.categories[catIndex].items[itemIndex][field] = value
      }
    } else {
      updated.categories[catIndex].items[itemIndex][field] = value
    }
    setMenu(updated)
    if (onSaveMenu) onSaveMenu(updated)
  }`;

text = text.replace(target1, replacement1);

const target2 = `  const updateCatName = (catIndex, value) => {
    const updated = JSON.parse(JSON.stringify(menu))
    updated.categories[catIndex].name[lang] = value
    setMenu(updated)
    if (onSaveMenu) onSaveMenu(updated)
  }`;

const replacement2 = `  const updateCatName = (catIndex, value) => {
    const updated = JSON.parse(JSON.stringify(menu))
    if (typeof updated.categories[catIndex].name === 'object') {
      updated.categories[catIndex].name[lang] = value
    } else {
      updated.categories[catIndex].name = value
    }
    setMenu(updated)
    if (onSaveMenu) onSaveMenu(updated)
  }`;

text = text.replace(target2, replacement2);

fs.writeFileSync('src/pages/GuestMenuReel.jsx', text);
