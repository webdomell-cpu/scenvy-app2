const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.jsx', 'utf-8');

const target1 = `const IMGS=[
  {url:'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80',accent:'#7C3AED',tag:'HAPPY HOUR',title:'50% Off Cocktails',cta:'Order Now'},
  {url:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',accent:'#FF2D8D',tag:'NEW MENU',title:"Chef's Special",cta:'View Menu'},
  {url:'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&q=80',accent:'#00D4FF',tag:'THIS WEEK',title:'Ladies Night ✨',cta:'RSVP Free'},
  {url:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',accent:'#FF9500',tag:'FEATURED',title:'Sunset Terrace',cta:'Book Table'},
]`;

const replacement1 = `const getImgs = (lang) => {
  const de = [
    {url:'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80',accent:'#7C3AED',tag:'HAPPY HOUR',title:'50% auf Cocktails',cta:'Jetzt bestellen'},
    {url:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',accent:'#FF2D8D',tag:'NEUES MENÜ',title:"Chef's Special",cta:'Menü ansehen'},
    {url:'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&q=80',accent:'#00D4FF',tag:'DIESE WOCHE',title:'Ladies Night ✨',cta:'Kostenlos RSVP'},
    {url:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',accent:'#FF9500',tag:'HIGHLIGHT',title:'Sunset Terrace',cta:'Tisch reservieren'}
  ];
  const en = [
    {url:'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80',accent:'#7C3AED',tag:'HAPPY HOUR',title:'50% Off Cocktails',cta:'Order Now'},
    {url:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',accent:'#FF2D8D',tag:'NEW MENU',title:"Chef's Special",cta:'View Menu'},
    {url:'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&q=80',accent:'#00D4FF',tag:'THIS WEEK',title:'Ladies Night ✨',cta:'RSVP Free'},
    {url:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',accent:'#FF9500',tag:'FEATURED',title:'Sunset Terrace',cta:'Book Table'}
  ];
  return lang === 'de' ? de : en;
}`;

content = content.replace(target1, replacement1);
fs.writeFileSync('src/pages/Landing.jsx', content);
