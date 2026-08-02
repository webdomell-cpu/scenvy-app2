const fs = require('fs');

let index = fs.readFileSync('index.html', 'utf8');
const pwaTags = '    <meta name="theme-color" content="#0D0D14" />\n' +
'    <meta name="apple-mobile-web-app-capable" content="yes">\n' +
'    <meta name="mobile-web-app-capable" content="yes">\n' +
'    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n' +
'    <meta name="display" content="standalone">';
index = index.replace('<meta name="theme-color" content="#0D0D14" />', pwaTags);
fs.writeFileSync('index.html', index);

let guest = fs.readFileSync('src/pages/GuestMenuReel.jsx', 'utf8');
const guestTags = '  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />\n' +
'  <meta name="apple-mobile-web-app-capable" content="yes">\n' +
'  <meta name="mobile-web-app-capable" content="yes">\n' +
'  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n' +
'  <meta name="display" content="standalone">\n' +
'  <title>';
guest = guest.replace(/<meta name="viewport" content="width=device-width, initial-scale=1\.0, maximum-scale=1\.0, user-scalable=no" \/>\s*<title>/g, guestTags);
fs.writeFileSync('src/pages/GuestMenuReel.jsx', guest);
