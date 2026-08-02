const fs = require('fs');
let text = fs.readFileSync('src/pages/MenuGenerator.jsx', 'utf8');

const target1 = `          venue: venue || tenant?.name || 'Gourmet Bistro',`;
const replacement1 = `          venue: venue || tenant?.name || '',`;
text = text.replace(target1, replacement1);

const target2 = `      if (parsedMenu.branding) {
        if (parsedMenu.branding.name && parsedMenu.branding.name !== 'Gourmet Bistro & Bar') setVenue(parsedMenu.branding.name)
        if (parsedMenu.branding.phone) setPhone(parsedMenu.branding.phone)
        if (parsedMenu.branding.address) setAddress(parsedMenu.branding.address)
        if (parsedMenu.branding.whatsapp) setWhatsapp(parsedMenu.branding.whatsapp)
        if (parsedMenu.branding.instagram) setInstagram(parsedMenu.branding.instagram)
      }`;

const replacement2 = `      if (parsedMenu.branding) {
        if (!venue && parsedMenu.branding.name && parsedMenu.branding.name !== 'Gourmet Bistro & Bar') setVenue(parsedMenu.branding.name)
        if (!phone && parsedMenu.branding.phone) setPhone(parsedMenu.branding.phone)
        if (!address && parsedMenu.branding.address) setAddress(parsedMenu.branding.address)
        if (!whatsapp && parsedMenu.branding.whatsapp) setWhatsapp(parsedMenu.branding.whatsapp)
        if (!instagram && parsedMenu.branding.instagram) setInstagram(parsedMenu.branding.instagram)
        if (parsedMenu.branding.primaryColor && parsedMenu.branding.primaryColor !== '#7C3AED') setPrimaryColor(parsedMenu.branding.primaryColor)
        if (parsedMenu.branding.secondaryColor && parsedMenu.branding.secondaryColor !== '#FF2D8D') setSecondaryColor(parsedMenu.branding.secondaryColor)
      }`;

text = text.replace(target2, replacement2);

fs.writeFileSync('src/pages/MenuGenerator.jsx', text);
