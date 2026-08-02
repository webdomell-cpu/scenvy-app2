const fs = require('fs');
let content = fs.readFileSync('src/components/ScenvyBrandShowcase.jsx', 'utf-8');
const target = `  if (m === 'scenvy') {
    return (
      <img 
        src="/scenvy-icon.png"
        alt="SCENVY"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          display: 'inline-block',
          verticalAlign: 'middle',
          flexShrink: 0,
          borderRadius: roundedSize,
          mixBlendMode: 'screen',
          filter: 'contrast(1.15) brightness(1.2)',
          ...style
        }}
        className={className}
      />
    )
  }`;
if (content.includes(target)) {
  content = content.replace(target, '');
  fs.writeFileSync('src/components/ScenvyBrandShowcase.jsx', content);
  console.log('patched');
} else {
  console.log('not found');
}
