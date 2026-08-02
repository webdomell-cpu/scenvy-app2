const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.jsx', 'utf-8');

const target = `  const getLangText = (key, defaultDe, defaultEn) => {
    if (lang === 'en') {
      if (landingConfig[\`\${key}_en\`]) return landingConfig[\`\${key}_en\`]
      const deToEnMap = {
        '🔥 Neu: AI Speisekarten-Reel Generator v2 ist live!': '🔥 New: AI Menu Reel Generator v2 is live!',
        '🚀 The New Standard for Digital Hospitality is Live!': '🚀 The New Standard for Digital Hospitality is Live!',
        'Book Demo': 'Book Demo',
        'THE OPERATING SYSTEM FOR': 'THE OPERATING SYSTEM FOR',
        'Modern Hospitality': 'Modern Hospitality',
        'Create, manage and distribute digital experiences across every touchpoint.': 'Create, manage and distribute digital experiences across every touchpoint.',
        'Live Preview': 'Live Preview'
      }
      const raw = landingConfig[key] || defaultDe
      return deToEnMap[raw] || defaultEn || raw
    }
    return landingConfig[key] || defaultDe
  }`;

const replacement = `  const getLangText = (key, defaultDe, defaultEn) => {
    if (lang === 'en') {
      if (landingConfig[\`\${key}_en\`]) return landingConfig[\`\${key}_en\`]
      const deToEnMap = {
        '🔥 Neu: AI Speisekarten-Reel Generator v2 ist live!': '🔥 New: AI Menu Reel Generator v2 is live!',
        '🚀 Der neue Standard für digitale Gastronomie ist live!': '🚀 The New Standard for Digital Hospitality is Live!',
        'Demo buchen': 'Book Demo',
        'DAS BETRIEBSSYSTEM FÜR': 'THE OPERATING SYSTEM FOR',
        'Moderne Gastronomie': 'Modern Hospitality',
        'Erstelle, verwalte und verteile digitale Erlebnisse an jedem Berührungspunkt.': 'Create, manage and distribute digital experiences across every touchpoint.',
        'Live Vorschau': 'Live Preview'
      }
      const raw = landingConfig[key] || defaultDe
      return deToEnMap[raw] || defaultEn || raw
    }
    return landingConfig[key] || defaultDe
  }`;

content = content.replace(target, replacement);

const target2 = `              {getLangText('hero_kicker', 'The Operating System for', 'The Operating System for')}<br/>
              <span style={{background:'linear-gradient(135deg, #8B5CF6, #EC4899)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{getLangText('hero_title_highlight', 'Modern Hospitality', 'Modern Hospitality')}</span>
            </h1>
            <p style={{fontSize:'clamp(16px,2vw,20px)',color:C.muted,lineHeight:1.6,marginBottom:32,maxWidth:740,margin:'0 auto 32px'}}>
              {getLangText('hero_subtitle', 'Create, manage and distribute digital experiences across every touchpoint.', 'Create, manage and distribute digital experiences across every touchpoint.')}
            </p>
            <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap',alignItems:'center',marginBottom:32}}>
              <Btn onClick={() => handleCtaClick(landingConfig.hero_btn_primary_action, landingConfig.hero_btn_primary_url)} style={{padding:'14px 32px',fontSize:15,background:'linear-gradient(135deg, #7C3AED, #DB2777)',boxShadow:'0 8px 28px rgba(124,58,237,0.4)'}}>
                {landingConfig.hero_btn_primary_text}
              </Btn>
              <Btn variant="outline" onClick={() => handleCtaClick(landingConfig.hero_btn_secondary_action, landingConfig.hero_btn_secondary_url)} style={{padding:'14px 28px',fontSize:15,display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.2)'}}>
                <Play size={14} fill={C.white}/> {landingConfig.hero_btn_secondary_text}
              </Btn>
            </div>`;

const replacement2 = `              {getLangText('hero_kicker', 'DAS BETRIEBSSYSTEM FÜR', 'THE OPERATING SYSTEM FOR')}<br/>
              <span style={{background:'linear-gradient(135deg, #8B5CF6, #EC4899)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{getLangText('hero_title_highlight', 'Moderne Gastronomie', 'Modern Hospitality')}</span>
            </h1>
            <p style={{fontSize:'clamp(16px,2vw,20px)',color:C.muted,lineHeight:1.6,marginBottom:32,maxWidth:740,margin:'0 auto 32px'}}>
              {getLangText('hero_subtitle', 'Erstelle, verwalte und verteile digitale Erlebnisse an jedem Berührungspunkt.', 'Create, manage and distribute digital experiences across every touchpoint.')}
            </p>
            <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap',alignItems:'center',marginBottom:32}}>
              <Btn onClick={() => handleCtaClick(landingConfig.hero_btn_primary_action, landingConfig.hero_btn_primary_url)} style={{padding:'14px 32px',fontSize:15,background:'linear-gradient(135deg, #7C3AED, #DB2777)',boxShadow:'0 8px 28px rgba(124,58,237,0.4)'}}>
                {lang === 'en' ? (landingConfig.hero_btn_primary_text_en || landingConfig.hero_btn_primary_text || 'Start for free') : (landingConfig.hero_btn_primary_text || 'Kostenlos starten')}
              </Btn>
              <Btn variant="outline" onClick={() => handleCtaClick(landingConfig.hero_btn_secondary_action, landingConfig.hero_btn_secondary_url)} style={{padding:'14px 28px',fontSize:15,display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.2)'}}>
                <Play size={14} fill={C.white}/> {lang === 'en' ? (landingConfig.hero_btn_secondary_text_en || landingConfig.hero_btn_secondary_text || 'See demo') : (landingConfig.hero_btn_secondary_text || 'Demo ansehen')}
              </Btn>
            </div>`;

content = content.replace(target2, replacement2);

fs.writeFileSync('src/pages/Landing.jsx', content);
