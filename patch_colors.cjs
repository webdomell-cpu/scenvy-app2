const fs = require('fs');
let text = fs.readFileSync('api/ai/parse-menu.js', 'utf8');

const targetColors = '"primaryColor": "${primaryColor || \'#7C3AED\'}",\n' +
'    "secondaryColor": "${secondaryColor || \'#FF2D8D\'}",';

const replacementColors = '"primaryColor": "${primaryColor ? primaryColor : \'Extracted primary brand hex color from document or #7C3AED\'}",\n' +
'    "secondaryColor": "${secondaryColor ? secondaryColor : \'Extracted secondary brand hex color from document or #FF2D8D\'}",';

text = text.replace(targetColors, replacementColors);

const targetInst = '2. Contact & Branding Extraction: Extract venue contact details ONLY from the document. DO NOT make up random emails, numbers or instagram handles. If not present, leave as empty strings "".';
const replacementInst = '2. Contact & Branding Extraction: Extract venue contact details AND brand colors ONLY from the document. DO NOT make up random emails, numbers or instagram handles. If not present, leave as empty strings "". If brand colors are visually present, extract them as HEX codes.';

text = text.replace(targetInst, replacementInst);

fs.writeFileSync('api/ai/parse-menu.js', text);
