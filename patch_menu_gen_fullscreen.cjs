const fs = require('fs');
let text = fs.readFileSync('src/pages/MenuGenerator.jsx', 'utf8');

// Add state
const targetState = `  const [aiLoading, setAiLoading] = useState(false)`;
const replacementState = `  const [aiLoading, setAiLoading] = useState(false)
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false)`;
text = text.replace(targetState, replacementState);

// Add Icon
const targetIcon = `import { Sparkles, FileText, Upload, Edit3, Palette, Phone, Instagram, QrCode, Download, Share2, Copy, Trash2, Eye, Plus, ArrowRight, CheckCircle2, Lock, ShieldAlert, ArrowLeft } from 'lucide-react'`;
const replacementIcon = `import { Sparkles, FileText, Upload, Edit3, Palette, Phone, Instagram, QrCode, Download, Share2, Copy, Trash2, Eye, Plus, ArrowRight, CheckCircle2, Lock, ShieldAlert, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react'`;
text = text.replace(targetIcon, replacementIcon);

// Add button to header of preview
const targetHeader = `                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  📱 LIVE MOBIL-PREVIEW (WYSIWYG)
                </div>`;
const replacementHeader = `                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 20px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                    📱 LIVE MOBIL-PREVIEW
                  </div>
                  {currentMenu && (
                    <button onClick={() => setIsEditorFullscreen(true)} style={{ background: C.purple, color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Maximize2 size={12} /> Großer Editor
                    </button>
                  )}
                </div>`;
text = text.replace(targetHeader, replacementHeader);

// Add Fullscreen Modal Modal to the end of return statement
const targetEnd = `      {/* Select From Mediathek Modal */}`;
const replacementEnd = `      {/* Fullscreen Editor Modal */}
      {isEditorFullscreen && currentMenu && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 100000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 60, background: '#181824', borderBottom: \`1px solid \${C.border}\`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Edit3 size={18} color={C.purple} /> Grosser Editor (WYSIWYG)
            </div>
            <button onClick={() => setIsEditorFullscreen(false)} style={{ background: C.card, color: '#FFF', border: \`1px solid \${C.border}\`, padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color={C.green} /> Schließen & Übernehmen
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <div style={{ width: '100%', maxWidth: 700, background: '#000', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: \`1px solid \${C.border}\` }}>
              <GuestMenuReel initialMenu={currentMenu} isPreview={true} onSaveMenu={handleSaveEditedMenu} />
            </div>
          </div>
        </div>
      )}

      {/* Select From Mediathek Modal */}`;
text = text.replace(targetEnd, replacementEnd);

fs.writeFileSync('src/pages/MenuGenerator.jsx', text);
