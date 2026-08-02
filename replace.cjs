const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.jsx', 'utf-8');
const target = `            {/* 8 OFFICIAL APP ICONS ROW */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,flexWrap:'wrap',padding:'12px 16px',borderRadius:20,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',maxWidth:720,margin:'0 auto'}}>
              {[
                { id: 'scenvy', name: 'Scenvy' },
                { id: 'flow', name: 'Flow' },
                { id: 'menu', name: 'Menu' },
                { id: 'board', name: 'Board' },
                { id: 'host', name: 'Host' },
                { id: 'link', name: 'Link' },
                { id: 'store', name: 'Store' },
                { id: 'magic', name: 'Magic' }
              ].map((item) => (
                <div key={item.id} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                  <ScenvyAppIcon module={item.id} size={42} />
                  <span style={{fontSize:9,fontWeight:700,color:C.muted}}>{item.name}</span>
                </div>
              ))}
            </div>`;
const replacement = `            {/* 8 OFFICIAL APP ICONS ROW */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16,flexWrap:'wrap',padding:'24px',borderRadius:24,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',maxWidth:900,margin:'0 auto'}}>
              {[
                { id: 'scenvy', name: 'Scenvy Main', status: 'active' },
                { id: 'flow', name: 'Flow', status: 'active' },
                { id: 'menu', name: 'Menu', status: 'active' },
                { id: 'board', name: 'Board', status: 'planned' },
                { id: 'host', name: 'Host', status: 'planned' },
                { id: 'link', name: 'Link', status: 'planned' },
                { id: 'store', name: 'Store', status: 'planned' },
                { id: 'magic', name: 'Magic', status: 'planned' }
              ].map((item) => (
                <div key={item.id} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,position:'relative',width:90}}>
                  <div style={{position:'relative'}}>
                    <ScenvyAppIcon module={item.id} size={84} style={{opacity: item.status === 'planned' ? 0.6 : 1, filter: item.status === 'planned' ? 'grayscale(0.6)' : 'none' }} />
                    {item.status === 'active' ? (
                      <div style={{position:'absolute',bottom:-2,right:-2,background:C.green,borderRadius:'50%',width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',border:\`2px solid #0F172A\`,boxShadow:'0 2px 8px rgba(0,0,0,0.4)'}} title="Aktiv">
                        <Check size={14} color={C.white} strokeWidth={3} />
                      </div>
                    ) : (
                      <div style={{position:'absolute',bottom:-2,right:-2,background:C.orange,borderRadius:'50%',width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',border:\`2px solid #0F172A\`,boxShadow:'0 2px 8px rgba(0,0,0,0.4)'}} title="Geplant">
                        <Clock size={14} color={C.white} strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                  <div style={{textAlign:'center'}}>
                    <span style={{fontSize:12,fontWeight:800,color: item.status === 'planned' ? C.dim : C.white, display:'block'}}>{item.name}</span>
                    <span style={{fontSize:9,fontWeight:700,color: item.status === 'active' ? C.green : C.orange, marginTop: 2, display:'block'}}>
                      {item.status === 'active' ? 'AKTIV' : 'GEPLANT'}
                    </span>
                  </div>
                </div>
              ))}
            </div>`;
if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/pages/Landing.jsx', content);
  console.log('Replaced successfully');
} else {
  console.log('Target not found');
}
