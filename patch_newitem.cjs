const fs = require('fs');
let text = fs.readFileSync('src/pages/GuestMenuReel.jsx', 'utf8');

const target1 = `      name: { de: 'Neues Gericht', en: 'New Dish' },
      description: { de: 'Zutaten und Beschreibung hier eingeben', en: 'Enter ingredients and description here' },`;
const replacement1 = `      name: 'Neues Gericht / New Dish',
      description: 'Zutaten und Beschreibung hier eingeben / Enter ingredients and description here',`;

text = text.replace(target1, replacement1);

const target2 = `    const newCat = {
      id: \`cat_\${Date.now()}\`,
      name: { de: 'Neue Kategorie', en: 'New Category' },
      icon: '✨',
      items: []
    }`;
const replacement2 = `    const newCat = {
      id: \`cat_\${Date.now()}\`,
      name: 'Neue Kategorie / New Category',
      icon: '✨',
      items: []
    }`;

text = text.replace(target2, replacement2);

fs.writeFileSync('src/pages/GuestMenuReel.jsx', text);
