const fs = require('fs');
let text = fs.readFileSync('src/pages/GuestMenuReel.jsx', 'utf8');

const targetStr = `            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: 4, gap: 4 }}>
              <button onClick={() => setLang('de')} style={{ background: lang === 'de' ? primaryColor : 'transparent', color: lang === 'de' ? '#FFF' : '#A1A1AA', border: 'none', padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                🇩🇪 DE
              </button>
              <button onClick={() => setLang('en')} style={{ background: lang === 'en' ? primaryColor : 'transparent', color: lang === 'en' ? '#FFF' : '#A1A1AA', border: 'none', padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                🇬🇧 EN
              </button>
            </div>`;

text = text.replace(targetStr, "");

fs.writeFileSync('src/pages/GuestMenuReel.jsx', text);
