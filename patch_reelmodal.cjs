const fs = require('fs');
let text = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

// Add mediaItems to props
const target1 = `function ReelModal({ reel, locs, tenantId, onClose, onSave, notify }) {`;
const replacement1 = `function ReelModal({ reel, locs, tenantId, onClose, onSave, notify, mediaItems }) {
  const [showMediathek, setShowMediathek] = useState(false)
`;
text = text.replace(target1, replacement1);

// Add button to open Mediathek and the Modal itself
const target2 = `                  : <div style={{textAlign:'center',padding:20}}><Upload size={26} color={C.purple} style={{marginBottom:8}}/><div style={{fontSize:13,color:C.muted}}>Hier klicken oder reinziehen</div><div style={{fontSize:11,color:C.dim,marginTop:3}}>MP4, MOV, JPG, PNG</div></div>
                }
                <input ref={fileRef} type="file" accept="video/*,image/*" onChange={handleFile} style={{display:'none'}}/>
              </div>
            </div>`;

const replacement2 = `                  : <div style={{textAlign:'center',padding:20}}><Upload size={26} color={C.purple} style={{marginBottom:8}}/><div style={{fontSize:13,color:C.muted}}>Hier klicken oder reinziehen</div><div style={{fontSize:11,color:C.dim,marginTop:3}}>MP4, MOV, JPG, PNG</div></div>
                }
                <input ref={fileRef} type="file" accept="video/*,image/*" onChange={handleFile} style={{display:'none'}}/>
              </div>
              <button onClick={() => setShowMediathek(true)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: \`1px solid \${C.purple}\`, background: \`\${C.purple}22\`, color: C.purple, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                🖼️ Aus Mediathek wählen
              </button>
            </div>

            {/* Sub Modal: Mediathek Select */}
            {showMediathek && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <div style={{ background: C.card, borderRadius: 24, width: '100%', maxWidth: 800, maxHeight: '80vh', border: \`1px solid \${C.border}\`, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '20px 24px', borderBottom: \`1px solid \${C.border}\`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>🖼️ Mediathek durchsuchen</div>
                    <button onClick={() => setShowMediathek(false)} style={{ background: 'none', border: 'none', color: C.white, cursor: 'pointer' }}><X size={24} /></button>
                  </div>
                  <div style={{ padding: 24, overflowY: 'auto' }}>
                    {(!mediaItems || mediaItems.length === 0) ? (
                      <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
                        Keine Medien in deiner Mediathek vorhanden. Lade zuerst in der Mediathek hoch.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
                        {mediaItems.map(m => (
                          <div key={m.id} onClick={() => { setPreview(m.url); setShowMediathek(false); notify('✅ Medium aus Mediathek übernommen!'); }} style={{ cursor: 'pointer', borderRadius: 12, overflow: 'hidden', border: \`2px solid transparent\`, background: C.card2, position: 'relative' }}>
                            {m.type === 'video' ? (
                              <video src={m.url} style={{ width: '100%', height: 120, objectFit: 'cover' }} muted />
                            ) : (
                              <img src={m.url} style={{ width: '100%', height: 120, objectFit: 'cover' }} alt="" />
                            )}
                            <div style={{ padding: '6px 8px', fontSize: 10, background: 'rgba(0,0,0,0.8)', color: '#FFF', position: 'absolute', bottom: 0, left: 0, right: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {m.name || 'Unbenannt'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}`;
text = text.replace(target2, replacement2);

// Add mediaItems to ReelModal component usages
text = text.replace(/<ReelModal reel=\{Object\.keys\(editReel\)\.length\?editReel:null\} locs=\{locs\} tenantId=\{tenantId\} onClose=\{\(\)=>setEditReel\(null\)\} onSave=\{handleSave\} notify=\{notify\}\/>/g, 
"<ReelModal reel={Object.keys(editReel).length?editReel:null} locs={locs} tenantId={tenantId} mediaItems={mediaItems} onClose={()=>setEditReel(null)} onSave={handleSave} notify={notify}/>");

fs.writeFileSync('src/pages/Dashboard.jsx', text);
