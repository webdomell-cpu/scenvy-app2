import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { C, grad } from '@/tokens'
import { ScenvyLogoFull, ScenvyLogoIcon, ScenvyLogoBadge } from '@/components/ScenvyLogo'
import { ScenvyAppIcon, ScenvyPhoneMockup, ScenvyHeroShowcase, MODULE_COLORS } from '@/components/ScenvyBrandShowcase'
import { Check, Clock, Star, Play, Video, Zap, Sparkles, MapPin, BarChart2, QrCode, X, Send, Menu, Film, Utensils, Tv, Building, ShoppingBag, Tag, Heart, MessageCircle, Share2 } from 'lucide-react'

// i18n inline
const T = {
  de: {
    nav:{ features:'Features', how:"So geht's", pricing:'Preise', demo:'Demo', login:'Einloggen', cta:'Kostenlos starten →' },
    kicker:'DIE ZUKUNFT DES VENUE-MARKETINGS',
    h1:'Verwandle jeden Ort in ein', scrollable:'scrollbares', h1b:'Erlebnis.',
    sub:'SCENVY verwandelt QR-Codes in TikTok-artige vertikale Reels. Echtzeit-Angebote, KI-Inhalte — kein App-Download nötig.',
    cta1:'Kostenlos starten →', cta2:'Demo ansehen',
    trust:'Vertrauen von 2.000+ Venues in 40 Ländern',
    stats:[{v:'3.4×',l:'Mehr Engagement'},{v:'80%',l:'Ø Watch-Rate'},{v:'5 Min',l:'Setup-Zeit'},{v:'€0',l:'Setup-Kosten'}],
    fKicker:'FEATURES', fTitle:'Alles was dein Venue braucht',
    fSub:'Eine Plattform. Alle Tools um passive Gäste in aktive Kunden zu verwandeln.',
    features:[
      {t:'Reel-Erlebnis',d:'TikTok-artige Stories die automatisch starten. Gäste swipen, entdecken, handeln.'},
      {t:'Live-Angebote',d:'Push Deals mit Countdown. Happy Hour? Event? In unter 60 Sekunden live.'},
      {t:'KI-Generator',d:'Beschreibe dein Angebot oder lade ein Foto hoch — Claude KI erstellt den Reel.'},
      {t:'Multi-Standort',d:'Alle Venues in einem Dashboard. Jeder Standort bekommt seinen eigenen QR-Code.'},
      {t:'Analytics',d:'Scans, Watch-Time und CTR. Wisse genau welcher Content Umsatz bringt.'},
      {t:'QR-Code-System',d:'app.scenvy.de/l/{id} — drucken, aufstellen, scannen. Fertig.'},
    ],
    howKicker:"SO GEHT'S", howTitle:'In 5 Minuten live', howSub:'Drei Schritte. Kein Entwickler nötig.',
    steps:[{n:'01',t:'QR-Code holen',d:'Registriere dich, erstelle einen Standort, SCENVY generiert deinen QR sofort.'},{n:'02',t:'Reels erstellen',d:'Lade Videos oder Fotos hoch oder lass die KI Reels aus Text erstellen.'},{n:'03',t:'Gäste scannen',d:'Gäste scannen und bekommen ein Vollbild-Erlebnis. Swipen, entdecken, handeln.'}],
    pKicker:'PREISE', pTitle:'Einfache, transparente Preise', pSub:'Keine Setup-Gebühren. Keine versteckten Kosten. Jederzeit kündbar.',
    plans:[
      {n:'Starter',p:'€0',per:'/ 30 Tage',d:'Perfekt um SCENVY risikofrei auszuprobieren.',cta:'Kostenlos starten',feat:['1 Standort','3 Reels','Basic Analytics','QR-Code-Generator','E-Mail-Support'],pop:false,color:C.muted},
      {n:'Pro',p:'€29',per:'/Monat',d:'Für wachsende Venues die mehr Engagement wollen.',cta:'Jetzt starten',feat:['5 Standorte','Unbegrenzte Reels','KI-Reel-Generator','Volle Analytics + CTR','Social Import','Prioritäts-Support'],pop:true,color:C.purple},
      {n:'Enterprise',p:'Individuell',per:'',d:'Für Gruppen und Ketten über meherere Städte.',cta:'Kontaktieren',feat:['Unbegrenzte Standorte','Unbegrenzte Reels','KI + Scheduling','White Label Branding','API-Zugang','Dedicated Account Manager'],pop:false,color:C.pink,contact:true},
    ],
    tKicker:'KUNDENMEINUNGEN', tTitle:'Venues lieben SCENVY',
    testimonials:[
      {q:'Unsere Scan-to-Order-Rate hat sich verdreifacht. Gäste lieben das Reel-Format — es fühlt sich genau wie TikTok an.',n:'Khalid Al-Rashid',r:'GM, Marina Walk Restaurant Group'},
      {q:'Der KI-Generator ist unglaublich. Ich tippe "Happy Hour heute" und er erstellt einen kompletten Reel in Sekunden.',n:'Sophie Laurent',r:'Inhaberin, Rooftop Bar 21'},
      {q:'6 Venues in Dubai. Ein Dashboard, ein Login, volle Kontrolle. SCENVY ist das fehlende Stück in unserem Tech-Stack.',n:'Marcus Webb',r:'Director, The Palm Events Group'},
    ],
    ctaKicker:'LOSLEGEN', ctaT1:'Bereit scrollbar', ctaT2:'zu werden?',
    ctaSub:'Schließe dich 2.000+ Venues an die SCENVY nutzen.',
    ctaBtn:'Kostenlose Testphase starten →', ctaNote:'Keine Kreditkarte · Setup in 5 Minuten · Jederzeit kündbar',
    footerTag:'Verwandle jeden Ort in ein scrollbares Erlebnis.',
    footerCopy:'© 2026 SCENVY. Alle Rechte vorbehalten.',
    footerMade:'Gemacht mit ❤️ für Hospitality',
  },
  en:{
    nav:{features:'Features',how:'How it works',pricing:'Pricing',demo:'Demo',login:'Log in',cta:'Get Started Free →'},
    kicker:'THE FUTURE OF VENUE MARKETING',
    h1:'Turn every place into a',scrollable:'scrollable',h1b:'experience.',
    sub:"SCENVY transforms QR codes into TikTok-style vertical reels. Real-time offers, AI content — no app download needed.",
    cta1:'Start for free →',cta2:'See demo',
    trust:'Trusted by 2,000+ venues in 40 countries',
    stats:[{v:'3.4×',l:'More engagement'},{v:'80%',l:'Avg watch rate'},{v:'5 min',l:'Setup time'},{v:'€0',l:'Setup cost'}],
    fKicker:'FEATURES',fTitle:'Everything your venue needs',fSub:'One platform. All the tools to turn passive guests into active customers.',
    features:[
      {t:'Reel Experience',d:'TikTok-style stories that auto-play. Guests swipe, discover, and act.'},
      {t:'Live Offers',d:'Push deals with countdown timers. Happy hour? Event? Live in under 60 seconds.'},
      {t:'AI Generator',d:'Describe your offer or upload a photo — Claude AI creates a complete reel.'},
      {t:'Multi-Location',d:'All venues in one dashboard. Every location gets its own QR code.'},
      {t:'Analytics',d:'Scans, watch time, and CTR. Know exactly which content drives revenue.'},
      {t:'QR Code System',d:'app.scenvy.de/l/{id} — print it, display it, start scanning.'},
    ],
    howKicker:'HOW IT WORKS',howTitle:'Up and running in 5 minutes',howSub:'Three steps. No developer needed.',
    steps:[{n:'01',t:'Get your QR code',d:'Sign up, create a location, SCENVY generates your QR code instantly.'},{n:'02',t:'Create reels',d:'Upload videos or photos, or let AI generate reels from a text description.'},{n:'03',t:'Guests scan & engage',d:'Guests scan and get a full-screen experience. Swipe, discover, act.'}],
    pKicker:'PRICING',pTitle:'Simple, transparent pricing',pSub:'No setup fees. No hidden costs. Cancel anytime.',
    plans:[
      {n:'Starter',p:'€0',per:'/ 30 days',d:'Perfect to try SCENVY risk-free.',cta:'Start for free',feat:['1 location','3 reels','Basic analytics','QR code generator','Email support'],pop:false,color:C.muted},
      {n:'Pro',p:'€29',per:'/month',d:'For growing venues serious about engagement.',cta:'Get started',feat:['5 locations','Unlimited reels','AI Reel Generator','Full analytics + CTR','Social import','Priority support'],pop:true,color:C.purple},
      {n:'Enterprise',p:'Individual',per:'',d:'For groups and chains across multiple cities.',cta:'Contact us',feat:['Unlimited locations','Unlimited reels','AI + scheduling','White label branding','API access','Dedicated account manager'],pop:false,color:C.pink,contact:true},
    ],
    tKicker:'TESTIMONIALS',tTitle:'Venues love SCENVY',
    testimonials:[
      {q:'Our scan-to-order rate tripled in the first week. Guests love the reel format — it feels exactly like TikTok.',n:'Khalid Al-Rashid',r:'GM, Marina Walk Restaurant Group'},
      {q:"The AI generator is insane. I type 'happy hour tonight' and it creates a full reel in seconds.",n:'Sophie Laurent',r:'Owner, Rooftop Bar 21'},
      {q:'We run 6 venues in Dubai. One dashboard, one login, full control. SCENVY is the missing piece.',n:'Marcus Webb',r:'Director, The Palm Events Group'},
    ],
    ctaKicker:'GET STARTED',ctaT1:'Ready to go',ctaT2:'scrollable?',
    ctaSub:'Join 2,000+ venues already using SCENVY.',
    ctaBtn:'Start your free trial →',ctaNote:'No credit card · Setup in 5 minutes · Cancel anytime',
    footerTag:'Turn every place into a scrollable experience.',
    footerCopy:'© 2026 SCENVY. All rights reserved.',
    footerMade:'Made with ❤️ for hospitality',
  }
}

const getImgs = (lang) => {
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
}

function Glow({color,x,y,size=600}){ return <div style={{position:'absolute',width:size,height:size,borderRadius:'50%',pointerEvents:'none',background:`radial-gradient(circle,${color}33 0%,transparent 70%)`,left:x,top:y,transform:'translate(-50%,-50%)'}}/>}
function Btn({children,onClick,variant='primary',style={}}){ return <button onClick={onClick} style={{padding:'13px 28px',borderRadius:12,border:'none',cursor:'pointer',fontWeight:700,fontSize:15,transition:'all .2s',fontFamily:'inherit',...(variant==='primary'?{background:grad(C.purple,C.pink),color:C.white,boxShadow:`0 4px 24px ${C.purple}55`}:{}),...(variant==='outline'?{background:'transparent',color:C.white,border:`1px solid ${C.border}`}:{}),...(variant==='ghost'?{background:'transparent',color:C.muted}:{}),...style}}>{children}</button>}

function Phone({size='large', lang='de'}){
  const [idx,setIdx]=useState(0);const[prog,setProg]=useState(0);const[fade,setFade]=useState(true)
  const IMGS = getImgs(lang);
  useEffect(()=>{setProg(0);const iv=setInterval(()=>setProg(p=>{if(p>=100){setFade(false);setTimeout(()=>{setIdx(i=>(i+1)%IMGS.length);setFade(true)},300);return 0}return p+0.4}),40);return()=>clearInterval(iv)},[idx, lang])
  const r=IMGS[idx];const L=size==='large';const w=L?300:160,h=L?560:320
  return(
    <div style={{width:w,height:h,borderRadius:L?38:26,overflow:'hidden',border:`2px solid ${C.border}`,position:'relative',boxShadow:`0 0 ${L?70:40}px ${r.accent}55,0 ${L?40:20}px ${L?80:40}px rgba(0,0,0,.7)`,flexShrink:0}}>
      <img src={r.url} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:fade?1:0,transition:'opacity .3s'}}/>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(0,0,0,.3) 0%,rgba(0,0,0,.1) 40%,rgba(0,0,0,.7) 100%)'}}/>
      <div style={{position:'absolute',top:12,left:10,right:10,display:'flex',gap:3,zIndex:5}}>
        {IMGS.map((_,i)=><div key={i} style={{flex:1,height:2.5,borderRadius:2,background:'rgba(255,255,255,.3)',overflow:'hidden'}}><div style={{height:'100%',background:C.white,borderRadius:2,width:i<idx?'100%':i===idx?`${prog}%`:'0%',transition:i===idx?'none':'width .2s'}}/></div>)}
      </div>
      <div style={{position:'absolute',top:22,left:10,right:10,display:'flex',justifyContent:'space-between',alignItems:'center',zIndex:5}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}><ScenvyLogoIcon size={L?26:20}/><div style={{fontSize:L?11:9,fontWeight:700}}>Marina Group</div></div>
        <div style={{background:r.accent,borderRadius:5,padding:'2px 7px',fontSize:L?9:8,fontWeight:700,opacity:fade?1:0,transition:'opacity .3s'}}>{r.tag}</div>
      </div>
      <div style={{position:'absolute',bottom:L?90:60,left:12,right:L?56:44,opacity:fade?1:0,transition:'opacity .3s'}}>
        <div style={{fontSize:L?20:13,fontWeight:800,lineHeight:1.25,marginBottom:L?6:4,textShadow:'0 2px 8px rgba(0,0,0,.8)'}}>{r.title}</div>
        <div style={{fontSize:L?11:9,color:'rgba(255,255,255,.7)'}}>{lang === "en" ? "Dubai Marina · Tonight" : "Dubai Marina · Heute Abend"}</div>
      </div>
      {L&&<div style={{position:'absolute',right:10,bottom:100,display:'flex',flexDirection:'column',gap:14,alignItems:'center'}}>{[<Heart size={18} fill="#fff"/>, <MessageCircle size={18}/>, <Share2 size={18}/>, <QrCode size={18}/>].map((ic,i)=><div key={i} style={{width:38,height:38,borderRadius:'50%',background:'rgba(255,255,255,.2)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>{ic}</div>)}</div>}
      <div style={{position:'absolute',bottom:L?20:12,left:10,right:10}}><div style={{padding:`${L?12:8}px 0`,borderRadius:L?14:10,textAlign:'center',background:grad(r.accent,C.pink),fontWeight:700,fontSize:L?14:11,opacity:fade?1:0,transition:'background .8s, opacity .3s'}}>{r.cta} →</div></div>
    </div>
  )
}

function ContactModal({onClose,lang}){
  const de=lang==='de'
  const[form,setForm]=useState({name:'',company:'',locations:'',contact:'',email:'',phone:'',message:''})
  const[sent,setSent]=useState(false);const[loading,setLoading]=useState(false)
  const submit=async()=>{
    if(!form.name||!form.email)return;setLoading(true)
    try{await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,type:'enterprise'})})}catch{}
    setSent(true);setLoading(false)
  }
  const fld=(label,key,ph,type='text')=>(
    <div style={{marginBottom:14}}><label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:600,letterSpacing:1}}>{label}</label>
    <input value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder={ph} type={type} style={{width:'100%',padding:'10px 14px',borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:13,outline:'none',fontFamily:'inherit'}}/></div>
  )
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.8)',backdropFilter:'blur(14px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:24,width:'100%',maxWidth:560,maxHeight:'90vh',overflow:'auto'}}>
        <div style={{padding:'22px 28px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div><div style={{fontWeight:800,fontSize:18}}>Enterprise {de?'anfragen':'Contact'}</div><div style={{fontSize:13,color:C.muted,marginTop:3}}>{de?'Wir melden uns innerhalb von 24 Stunden.':'We\'ll get back to you within 24 hours.'}</div></div>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.muted,cursor:'pointer'}}><X size={20}/></button>
        </div>
        {sent?(
          <div style={{padding:40,textAlign:'center'}}>
            <div style={{fontSize:56,marginBottom:16}}>✅</div>
            <div style={{fontSize:20,fontWeight:800,marginBottom:8}}>{de?'Anfrage gesendet!':'Request sent!'}</div>
            <div style={{fontSize:14,color:C.muted,marginBottom:24}}>{de?'Wir melden uns innerhalb von 24 Stunden.':'We\'ll be in touch within 24 hours.'}</div>
            <button onClick={onClose} style={{padding:'11px 28px',borderRadius:12,border:'none',background:grad(C.purple,C.pink),color:C.white,cursor:'pointer',fontWeight:700,fontSize:14,fontFamily:'inherit'}}>{de?'Schließen':'Close'}</button>
          </div>
        ):(
          <div style={{padding:28}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><div>{fld(de?'NAME *':'NAME *','name',de?'Max Mustermann':'Your name')}</div><div>{fld(de?'UNTERNEHMEN *':'COMPANY *','company',de?'Mein Restaurant':'My Company')}</div></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><div>{fld(de?'ANZAHL STANDORTE':'LOCATIONS','locations',de?'z.B. 5':'e.g. 5')}</div><div>{fld(de?'ANSPRECHPARTNER':'CONTACT PERSON','contact',de?'Name':'Contact')}</div></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><div>{fld('E-MAIL *','email','deine@email.de','email')}</div><div>{fld(de?'TELEFON':'PHONE','phone','+49 123 456789','tel')}</div></div>
            <div style={{marginBottom:22}}><label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:600,letterSpacing:1}}>{de?'NACHRICHT':'MESSAGE'}</label><textarea value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} rows={3} placeholder={de?'Erzähl uns von deinen Anforderungen...':'Tell us about your requirements...'} style={{width:'100%',padding:'10px 14px',borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:13,outline:'none',resize:'vertical',fontFamily:'inherit'}}/></div>
            <button onClick={submit} disabled={loading||!form.name||!form.email} style={{width:'100%',padding:'13px 0',borderRadius:12,border:'none',cursor:loading||!form.name||!form.email?'default':'pointer',background:loading||!form.name||!form.email?C.dim:grad(C.purple,C.pink),color:C.white,fontWeight:700,fontSize:15,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
              <Send size={16}/>{loading?(de?'Wird gesendet...':'Sending...'):(de?'Anfrage senden →':'Send Request →')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Landing(){
  const nav=useNavigate()
  const[lang,setLang]=useState(() => {
    const saved = localStorage.getItem('scenvy_lang')
    if (saved) return saved
    const userLang = navigator.language || navigator.userLanguage || ''
    if (userLang.toLowerCase().startsWith('de')) return 'de'
    return 'en'
  })
  const[showContact,setShowContact]=useState(false)
  const[mobileMenuOpen,setMobileMenuOpen]=useState(false)

  const [landingConfig, setLandingConfig] = useState(() => {
    const saved = localStorage.getItem('scenvy_landing_config')
    return saved ? JSON.parse(saved) : {
      show_flow_page: true,
      show_menu_page: true,
      show_board_page: true,
      show_host_page: true,
      show_store_page: true,
      show_pricing_section: true,
      show_top_banner: true,
      top_banner_text: '🚀 The New Standard for Digital Hospitality is Live!',
      top_banner_link: '/auth?mode=register',
      show_login_btn: true,
      show_register_btn: true,
      header_cta_text: 'Book Demo',
      hero_kicker: 'THE OPERATING SYSTEM FOR',
      hero_title_highlight: 'Modern Hospitality',
      hero_subtitle: 'Create, manage and distribute digital experiences across every touchpoint.',
      hero_btn_primary_text: 'Book Demo',
      hero_btn_primary_action: 'contact',
      hero_btn_secondary_text: 'Live Preview',
      hero_btn_secondary_action: 'demo',
    }
  })

  const [pricingConfig, setPricingConfig] = useState(() => {
    const saved = localStorage.getItem('scenvy_pricing_config')
    return saved ? JSON.parse(saved) : {
      starter_price: 0,
      pro_price: 29,
      enterprise_price: 299,
      starter_cta_text: 'Kostenlos starten',
      pro_cta_text: 'Jetzt starten',
      enterprise_cta_text: 'Kontaktieren',
    }
  })

  useEffect(() => {
    const reloadConfigs = () => {
      const l = localStorage.getItem('scenvy_landing_config')
      if (l) setLandingConfig(JSON.parse(l))
      const p = localStorage.getItem('scenvy_pricing_config')
      if (p) setPricingConfig(JSON.parse(p))
    }
    window.addEventListener('scenvy_config_updated', reloadConfigs)
    return () => window.removeEventListener('scenvy_config_updated', reloadConfigs)
  }, [])

  useEffect(()=>localStorage.setItem('scenvy_lang',lang),[lang])
  const t=T[lang]

  const getLangText = (key, defaultDe, defaultEn) => {
    // Determine the desired string based on language
    let text = lang === 'en' ? defaultEn : defaultDe;
    
    // Check if the user has overridden it in landingConfig
    if (lang === 'de' && landingConfig[key] && landingConfig[key] !== defaultEn && landingConfig[key] !== 'The Operating System for') {
       text = landingConfig[key];
    } else if (lang === 'en' && landingConfig[`${key}_en`]) {
       text = landingConfig[`${key}_en`];
    }
    
    return text;
  }
  const icons=[<Video size={24} color={C.purple}/>,<Zap size={24} color={C.pink}/>,<Sparkles size={24} color={C.blue}/>,<MapPin size={24} color="#00E676"/>,<BarChart2 size={24} color="#FF9500"/>,<QrCode size={24} color={C.purple}/>]
  const fcolors=[C.purple,C.pink,C.blue,'#00E676','#FF9500',C.purple]
  const stepColors=[C.purple,C.pink,C.blue]

  const handleCtaClick = (action, url) => {
    if (action === 'register') nav('/auth?mode=register')
    else if (action === 'demo') {
      const el = document.getElementById('demo')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
      else nav('/l/demo')
    }
    else if (action === 'contact') setShowContact(true)
    else if (action === 'custom' && url) window.open(url, '_blank')
    else nav('/auth?mode=register')
  }

  return(
    <div style={{background:C.bg,color:C.white,fontFamily:"'Inter','Segoe UI',sans-serif",overflowX:'hidden',paddingBottom:70}}>
      <style>{`
        *{box-sizing:border-box} 
        a{text-decoration:none} 
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}

        @media (max-width: 900px) {
          .desktop-nav-links { display: none !important; }
          .desktop-nav-right { display: none !important; }
          .mobile-hamburger-btn { display: flex !important; }
          .hero-container { flex-direction: column !important; text-align: center !important; gap: 40px !important; }
          .hero-text { display: flex; flex-direction: column; align-items: center; }
          .hero-cta-btns { justify-content: center !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .stats-item { border-right: none !important; border-bottom: 1px solid ${C.border}; }
          .features-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .step-line { display: none !important; }
          .demo-container { flex-direction: column !important; text-align: center !important; gap: 40px !important; }
          .demo-text-list { display: inline-flex; flex-direction: column; align-items: flex-start; text-align: left; }
          .demo-phones { justify-content: center !important; flex-wrap: wrap !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .pricing-card-pop { transform: none !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 28px !important; }
          .mobile-bottom-bar { display: flex !important; }
        }

        @media (min-width: 901px) {
          .mobile-hamburger-btn { display: none !important; }
          .mobile-bottom-bar { display: none !important; }
        }

        @media (max-width: 500px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
        }

        /* Subtle Noise Overlay */
        .noise-bg {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          pointer-events: none;
          z-index: 1;
          opacity: 0.04;
          background: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E');
        }
      `}</style>

      <div className="noise-bg"></div>

      {/* TOP ANNOUNCEMENT BANNER */}
      {landingConfig.show_top_banner && (
        <div style={{background:'linear-gradient(90deg, #7C3AED, #DB2777)',color:C.white,padding:'8px 16px',textAlign:'center',fontSize:12,fontWeight:700,letterSpacing:0.5,display:'flex',alignItems:'center',justifyContent:'center',gap:8,cursor:'pointer'}} onClick={() => nav(landingConfig.top_banner_link || '/menu-addon')}>
          <span>{getLangText('top_banner_text', '🔥 Neu: AI Speisekarten-Reel Generator v2 ist live!', '🔥 New: AI Menu Reel Generator v2 is live!')}</span>
          <span style={{background:'rgba(255,255,255,0.2)',padding:'2px 8px',borderRadius:10,fontSize:10}}>{lang==='en'?'View →':'Ansehen →'}</span>
        </div>
      )}

      {/* NAV */}
      <nav style={{position:'fixed',top:landingConfig.show_top_banner?34:0,left:0,right:0,zIndex:100,height:90,background:'rgba(13,13,20,.95)',backdropFilter:'blur(20px)',borderBottom:`1px solid ${C.border}`,padding:'0 5%',display:'flex',alignItems:'center',justifyContent:'space-between',transition:'top .2s'}}>
        <div style={{display:'flex',alignItems:'center',cursor:'pointer'}} onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>
          <ScenvyLogoFull height={80} />
        </div>

        {/* Desktop Navigation Links */}
        <div className="desktop-nav-links" style={{display:'flex',gap:16,alignItems:'center'}}>
          {landingConfig.show_flow_page && (
            <Link to="/reels-addon" style={{color:'#8B5CF6',fontSize:13,fontWeight:700,background:'rgba(139,92,246,0.12)',border:'1px solid rgba(139,92,246,0.3)',padding:'6px 12px',borderRadius:20,display:'inline-flex',alignItems:'center',gap:6}}>
              <Film size={14} color="#8B5CF6"/> SCENVY FLOW
            </Link>
          )}
          {landingConfig.show_menu_page && (
            <Link to="/menu-addon" style={{color:'#F97316',fontSize:13,fontWeight:700,background:'rgba(249,115,22,0.12)',border:'1px solid rgba(249,115,22,0.3)',padding:'6px 12px',borderRadius:20,display:'inline-flex',alignItems:'center',gap:6}}>
              <Utensils size={14} color="#F97316"/> SCENVY MENU
            </Link>
          )}
        </div>

        {/* Desktop Navigation Right Actions */}
        <div className="desktop-nav-right" style={{display:'flex',gap:8,alignItems:'center'}}>
          <div style={{display:'flex',background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:3}}>
            {[['de','🇩🇪'],['en','🇬🇧']].map(([l,f])=><button key={l} onClick={()=>setLang(l)} style={{padding:'4px 8px',borderRadius:6,border:'none',cursor:'pointer',background:lang===l?C.purple:'transparent',fontSize:16,fontFamily:'inherit'}}>{f}</button>)}
          </div>
          {landingConfig.show_login_btn && (
            <Btn variant="ghost" onClick={()=>nav('/auth')} style={{fontSize:14,padding:'9px 16px'}}>{t.nav.login}</Btn>
          )}
          {landingConfig.show_register_btn && (
            <Btn onClick={()=>nav('/auth?mode=register')} style={{fontSize:14,padding:'9px 18px'}}>{landingConfig.header_cta_text || t.nav.cta}</Btn>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="mobile-hamburger-btn" style={{display:'none',alignItems:'center',gap:10}}>
          <div style={{display:'flex',background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:2}}>
            {[['de','🇩🇪'],['en','🇬🇧']].map(([l,f])=><button key={l} onClick={()=>setLang(l)} style={{padding:'3px 6px',borderRadius:5,border:'none',cursor:'pointer',background:lang===l?C.purple:'transparent',fontSize:14,fontFamily:'inherit'}}>{f}</button>)}
          </div>
          <button onClick={()=>setMobileMenuOpen(!mobileMenuOpen)} style={{background:'none',border:'none',color:C.white,cursor:'pointer',padding:6,display:'flex',alignItems:'center',justifyContent:'center'}}>
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div style={{position:'fixed',top:66,left:0,right:0,bottom:0,background:'rgba(15,23,42,0.98)',backdropFilter:'blur(20px)',zIndex:995,padding:'24px 20px',display:'flex',flexDirection:'column',gap:16,overflowY:'auto'}}>
          <Link to="/reels-addon" onClick={()=>setMobileMenuOpen(false)} style={{color:'#8B5CF6',fontSize:18,fontWeight:700,padding:'12px 0',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:10}}>
            <Film size={20} color="#8B5CF6"/> SCENVY FLOW (flow.scenvy.de)
          </Link>
          <Link to="/menu-addon" onClick={()=>setMobileMenuOpen(false)} style={{color:'#F97316',fontSize:18,fontWeight:700,padding:'12px 0',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:10}}>
            <Utensils size={20} color="#F97316"/> SCENVY MENU (menu.scenvy.de)
          </Link>
          <div style={{display:'flex',flexDirection:'column',gap:12,marginTop:20}}>
            <Btn variant="outline" onClick={()=>{setMobileMenuOpen(false);nav('/auth')}} style={{width:'100%',textAlign:'center',padding:'12px 0'}}>{t.nav.login}</Btn>
            <Btn onClick={()=>{setMobileMenuOpen(false);nav('/auth?mode=register')}} style={{width:'100%',textAlign:'center',padding:'12px 0'}}>{t.nav.cta}</Btn>
          </div>
        </div>
      )}

      {/* HERO */}
      <section style={{minHeight:'85vh',display:'flex',flexDirection:'column',alignItems:'center',padding:'110px 5% 40px',position:'relative',overflow:'hidden'}}>
        <Glow color={C.purple} x="-5%" y="20%" size={700}/><Glow color={C.pink} x="105%" y="50%" size={600}/>
        
        <div style={{width:'100%',maxWidth:1200,margin:'0 auto'}}>
          {/* Top Headline & Copy */}
          <div style={{textAlign:'center',maxWidth:920,margin:'0 auto',marginBottom:32,position:'relative',zIndex:2}}>
            
            <h1 style={{fontSize:'clamp(36px,6vw,68px)',fontWeight:900,lineHeight:1.1,marginBottom:24,letterSpacing:'-1px'}}>
              {getLangText('hero_kicker', 'DAS BETRIEBSSYSTEM FÜR', 'THE OPERATING SYSTEM FOR')}<br/>
              <span style={{background:'linear-gradient(135deg, #8B5CF6, #EC4899)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{getLangText('hero_title_highlight', 'Moderne Gastronomie', 'Modern Hospitality')}</span>
            </h1>

            <p style={{fontSize:'clamp(16px,2vw,20px)',color:C.muted,lineHeight:1.6,marginBottom:32,maxWidth:740,margin:'0 auto 32px'}}>
              {getLangText('hero_subtitle', 'Erstelle, verwalte und verteile digitale Erlebnisse an jedem Berührungspunkt.', 'Create, manage and distribute digital experiences across every touchpoint.')}
            </p>

            <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap',alignItems:'center',marginBottom:32}}>
              <Btn onClick={() => handleCtaClick(landingConfig.hero_btn_primary_action, landingConfig.hero_btn_primary_url)} style={{padding:'14px 32px',fontSize:15,background:'linear-gradient(135deg, #7C3AED, #DB2777)',boxShadow:'0 8px 28px rgba(124,58,237,0.4)'}}>
                {getLangText('hero_btn_primary_text', 'Demo buchen', 'Book Demo')}
              </Btn>
              <Btn variant="outline" onClick={() => handleCtaClick(landingConfig.hero_btn_secondary_action, landingConfig.hero_btn_secondary_url)} style={{padding:'14px 28px',fontSize:15,display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.2)'}}>
                <Play size={14} fill={C.white}/> {getLangText('hero_btn_secondary_text', 'Live Vorschau', 'Live Preview')}
              </Btn>
            </div>

            {/* 7 OFFICIAL APP ICONS ROW */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:24,flexWrap:'wrap',padding:'32px',borderRadius:28,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',maxWidth:1000,margin:'0 auto'}}>
              {[
                { id: 'flow', name: 'Flow', status: 'active' },
                { id: 'menu', name: 'Menu', status: 'active' },
                { id: 'board', name: 'Board', status: 'planned' },
                { id: 'host', name: 'Host', status: 'planned' },
                { id: 'link', name: 'Link', status: 'planned' },
                { id: 'store', name: 'Store', status: 'planned' },
                { id: 'magic', name: 'Magic', status: 'planned' }
              ].map((item) => (
                <div key={item.id} style={{display:'flex',flexDirection:'column',alignItems:'center',position:'relative'}}>
                  <div style={{position:'relative', transition: 'transform 0.2s', cursor: 'pointer'}} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <ScenvyAppIcon module={item.id} size={189} style={{opacity: item.status === 'planned' ? 0.6 : 1, filter: item.status === 'planned' ? 'grayscale(0.6)' : 'none' }} />
                    {item.status === 'active' ? (
                      <div style={{position:'absolute',bottom:2,right:2,background:C.green,borderRadius:'50%',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',border:`3px solid #0F172A`,boxShadow:'0 4px 12px rgba(0,0,0,0.5)'}} title="Aktiv">
                        <Check size={16} color={C.white} strokeWidth={3} />
                      </div>
                    ) : (
                      <div style={{position:'absolute',bottom:2,right:2,background:C.orange,borderRadius:'50%',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',border:`3px solid #0F172A`,boxShadow:'0 4px 12px rgba(0,0,0,0.5)'}} title="Geplant">
                        <Clock size={16} color={C.white} strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FULL SCENVY HERO SHOWCASE COMPOSITION (Laptop + Kiosk + Phone + 7-Module Bar) */}
          
        </div>
      </section>

      {/* PROBLEM / SOLUTION SECTION */}
      <section style={{padding:'100px 5%',position:'relative',zIndex:2}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(400px, 1fr))',gap:40,alignItems:'center'}}>
            {/* Left: Chaos */}
            <div style={{background:'rgba(255,255,255,0.02)',border:`1px solid rgba(255,255,255,0.05)`,borderRadius:24,padding:48,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,width:'100%',height:4,background:'#333'}}></div>
              <h3 style={{fontSize:32,fontWeight:900,color:C.muted,marginBottom:20}}>Hospitality is stuck in the past.</h3>
              <ul style={{listStyle:'none',padding:0,margin:0,color:C.dim,fontSize:16,lineHeight:1.8}}>
                <li style={{marginBottom:12,display:'flex',gap:12}}><X size={20} color="#666" style={{flexShrink:0,marginTop:4}}/> Printed menus that are immediately outdated</li>
                <li style={{marginBottom:12,display:'flex',gap:12}}><X size={20} color="#666" style={{flexShrink:0,marginTop:4}}/> Static digital screens displaying irrelevant content</li>
                <li style={{marginBottom:12,display:'flex',gap:12}}><X size={20} color="#666" style={{flexShrink:0,marginTop:4}}/> Fragmented marketing tools that don't talk to each other</li>
                <li style={{marginBottom:12,display:'flex',gap:12}}><X size={20} color="#666" style={{flexShrink:0,marginTop:4}}/> Missing guest data and engagement analytics</li>
              </ul>
            </div>
            
            {/* Right: Impact */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:24,padding:48,position:'relative',overflow:'hidden',boxShadow:'0 20px 40px rgba(0,0,0,0.4)'}}>
              <div style={{position:'absolute',top:0,left:0,width:'100%',height:4,background:'linear-gradient(90deg, #8B5CF6, #EC4899)'}}></div>
              <h3 style={{fontSize:32,fontWeight:900,color:C.white,marginBottom:20}}>The SCENVY Impact.</h3>
              <ul style={{listStyle:'none',padding:0,margin:0,color:C.white,fontSize:16,lineHeight:1.8}}>
                <li style={{marginBottom:12,display:'flex',gap:12}}><Check size={20} color="#10B981" style={{flexShrink:0,marginTop:4}}/> One login, one system, infinite touchpoints</li>
                <li style={{marginBottom:12,display:'flex',gap:12}}><Check size={20} color="#10B981" style={{flexShrink:0,marginTop:4}}/> Dynamic Reels and digital menus updated in real-time</li>
                <li style={{marginBottom:12,display:'flex',gap:12}}><Check size={20} color="#10B981" style={{flexShrink:0,marginTop:4}}/> AI-powered content creation across all screens</li>
                <li style={{marginBottom:12,display:'flex',gap:12}}><Check size={20} color="#10B981" style={{flexShrink:0,marginTop:4}}/> Centralized control turning passive guests into active customers</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{padding:'0 5%'}}>
        <div className="stats-grid" style={{maxWidth:1200,margin:'0 auto',background:C.card,borderRadius:20,border:`1px solid ${C.border}`,display:'grid',gridTemplateColumns:'repeat(4,1fr)'}}>
          {t.stats.map((s,i)=>(
            <div key={i} className="stats-item" style={{padding:'28px 20px',textAlign:'center',borderRight:i<3?`1px solid ${C.border}`:'none'}}>
              <div style={{fontSize:36,fontWeight:900,background:grad(C.purple,C.pink),WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:6}}>{s.v}</div>
              <div style={{fontSize:13,color:C.muted}}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MODULES & ROADMAP SECTION */}
      <section id="modules" style={{padding:'80px 5%',position:'relative',zIndex:2}}>
        <Glow color="#8B5CF6" x="20%" y="30%" size={700}/>
        <Glow color="#F97316" x="80%" y="70%" size={600}/>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:60}}>
            <div style={{fontSize:11,color:'#8B5CF6',fontWeight:800,letterSpacing:2,marginBottom:12}}>THE ECOSYSTEM</div>
            <h2 style={{fontSize:'clamp(32px, 4vw, 48px)',fontWeight:900,marginBottom:16}}>
              <span style={{background:grad('#8B5CF6','#F97316'),WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Three Core Pillars</span>
            </h2>
            <p style={{fontSize:18,color:C.muted,maxWidth:650,margin:'0 auto'}}>
              Everything you need to control the digital experience of your venue from one central dashboard.
            </p>
          </div>

          {/* MASTER BLUEPRINT MODULES GRID */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(340px, 1fr))',gap:32,marginBottom:48}}>
            
            {/* MODULE 1: FLOW (Lila #8B5CF6) */}
            <div style={{background:C.card,border:'2px solid rgba(139,92,246,0.6)',borderRadius:24,padding:32,position:'relative',display:'flex',flexDirection:'column',justify:'space-between',boxShadow:'0 10px 40px rgba(139,92,246,0.15)'}}>
              <div>
                <div style={{display:'flex',justify:'space-between',alignItems:'center',marginBottom:16}}>
                  <span style={{fontSize:11,fontWeight:800,color:'#8B5CF6',background:'rgba(139,92,246,0.15)',padding:'4px 12px',borderRadius:20,border:'1px solid rgba(139,92,246,0.3)',letterSpacing:1}}>
                    MODUL 01 · AKTIV (flow.scenvy.de)
                  </span>
                  <ScenvyAppIcon module="flow" size={48} style={{borderRadius:12,boxShadow:'0 4px 12px rgba(139,92,246,0.3)'}} />
                </div>
                <h3 style={{fontSize:24,fontWeight:900,color:C.white,marginBottom:10}}>SCENVY FLOW</h3>
                <p style={{fontSize:15,color:C.muted,lineHeight:1.6,marginBottom:20}}>
                  Turn every scan into an experience. TikTok-style 9:16 vertical video reels, flash sales, and AI video generation.
                </p>
                <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:32}}>
                  {['TikTok-style 9:16 video feed','Live flash-sales in <60 sec','Interactive CTA buttons & timers','Full scan & conversion analytics'].map((feat,idx)=>(
                    <div key={idx} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:C.white}}>
                      <div style={{width:16,height:16,borderRadius:'50%',background:'rgba(139,92,246,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#8B5CF6',fontSize:10,fontWeight:900}}>✓</div>
                      {feat}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{display:'flex',gap:12}}>
                <button onClick={()=>nav('/reels-addon')} style={{flex:1,padding:'12px 0',borderRadius:12,border:'1px solid rgba(139,92,246,0.5)',background:'rgba(139,92,246,0.15)',color:C.white,fontWeight:700,fontSize:13,cursor:'pointer',textAlign:'center'}}>
                  Details ansehen →
                </button>
                <button onClick={()=>nav('/auth?mode=register')} style={{flex:1.2,padding:'12px 0',borderRadius:12,border:'none',background:'linear-gradient(135deg, #8B5CF6, #EC4899)',color:C.white,fontWeight:700,fontSize:13,cursor:'pointer',textAlign:'center'}}>
                  Jetzt starten
                </button>
              </div>
            </div>

            {/* MODULE 2: MENU & SNAP (Orange #F97316) */}
            <div style={{background:C.card,border:'2px solid rgba(249,115,22,0.6)',borderRadius:24,padding:32,position:'relative',display:'flex',flexDirection:'column',justify:'space-between',boxShadow:'0 10px 40px rgba(249,115,22,0.15)'}}>
              <div>
                <div style={{display:'flex',justify:'space-between',alignItems:'center',marginBottom:16}}>
                  <span style={{fontSize:11,fontWeight:800,color:'#F97316',background:'rgba(249,115,22,0.15)',padding:'4px 12px',borderRadius:20,border:'1px solid rgba(249,115,22,0.3)',letterSpacing:1}}>
                    MODUL 02 · AKTIV (menu.scenvy.de)
                  </span>
                  <ScenvyAppIcon module="menu" size={48} style={{borderRadius:12,boxShadow:'0 4px 12px rgba(249,115,22,0.3)'}} />
                </div>
                <h3 style={{fontSize:24,fontWeight:900,color:C.white,marginBottom:6}}>SCENVY MENU</h3>
                <div style={{fontSize:12,fontWeight:700,color:'#F97316',marginBottom:12,display:'flex',alignItems:'center',gap:4}}>
                  <span>✨ Inklusive SCENVY SNAP (KI Import)</span>
                </div>
                <p style={{fontSize:15,color:C.muted,lineHeight:1.6,marginBottom:20}}>
                  From PDF to digital menu in seconds. Upload a file or photo — categories, products & prices are extracted instantly by AI.
                </p>
                <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:32}}>
                  {['SCENVY SNAP: PDF & Photo AI Import','Interactive Web Menu & Food Reels','Allergens, Tags & Categories','Print-ready Table QR Templates'].map((feat,idx)=>(
                    <div key={idx} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:C.white}}>
                      <div style={{width:16,height:16,borderRadius:'50%',background:'rgba(249,115,22,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#F97316',fontSize:10,fontWeight:900}}>✓</div>
                      {feat}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{display:'flex',gap:12}}>
                <button onClick={()=>nav('/menu-addon')} style={{flex:1,padding:'12px 0',borderRadius:12,border:'1px solid rgba(249,115,22,0.5)',background:'rgba(249,115,22,0.15)',color:C.white,fontWeight:700,fontSize:13,cursor:'pointer',textAlign:'center'}}>
                  Details ansehen →
                </button>
                <button onClick={()=>nav('/auth?mode=register')} style={{flex:1.2,padding:'12px 0',borderRadius:12,border:'none',background:'linear-gradient(135deg, #F97316, #8B5CF6)',color:C.white,fontWeight:700,fontSize:13,cursor:'pointer',textAlign:'center'}}>
                  Jetzt starten
                </button>
              </div>
            </div>

            {/* MODULE 3: BOARD (Blau #3B82F6) */}
            <div style={{background:C.card,border:'1px solid rgba(59,130,246,0.3)',borderRadius:24,padding:32,position:'relative',display:'flex',flexDirection:'column',justify:'space-between'}}>
              <div>
                <div style={{display:'flex',justify:'space-between',alignItems:'center',marginBottom:16}}>
                  <span style={{fontSize:11,fontWeight:800,color:'#3B82F6',background:'rgba(59,130,246,0.15)',padding:'4px 12px',borderRadius:20,border:'1px solid rgba(59,130,246,0.3)',letterSpacing:1}}>
                    MODUL 03 · IN VORBEREITUNG (board.scenvy.de)
                  </span>
                  <ScenvyAppIcon module="board" size={48} style={{borderRadius:12,boxShadow:'0 4px 12px rgba(59,130,246,0.3)'}} />
                </div>
                <h3 style={{fontSize:24,fontWeight:900,color:C.white,marginBottom:10}}>SCENVY BOARD</h3>
                <p style={{fontSize:15,color:C.muted,lineHeight:1.6,marginBottom:20}}>
                  Control every screen from one place. Manage digital signage in restaurants, hotels and retail with dynamic playlists.
                </p>
                <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:32}}>
                  {['Multi-Screen CMS Management','Drag & Drop Playlist Builder','Time-based Content Scheduling','Hardware & Player Integration'].map((feat,idx)=>(
                    <div key={idx} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:C.muted}}>
                      <div style={{width:16,height:16,borderRadius:'50%',background:'rgba(59,130,246,0.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'#3B82F6',fontSize:10,fontWeight:900}}>•</div>
                      {feat}
                    </div>
                  ))}
                </div>
              </div>

              <button disabled style={{width:'100%',padding:'12px 0',borderRadius:12,border:'1px solid rgba(59,130,246,0.3)',background:'rgba(59,130,246,0.08)',color:'#3B82F6',fontWeight:700,fontSize:13,cursor:'not-allowed',textAlign:'center'}}>
                Coming Q3 2026 (board.scenvy.de)
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* USE CASES SECTION */}
      <section style={{padding:'100px 5%',background:'rgba(255,255,255,0.02)',borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,position:'relative',zIndex:2}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:60}}>
            <h2 style={{fontSize:'clamp(32px, 4vw, 48px)',fontWeight:900,marginBottom:16}}>Built for every venue.</h2>
            <p style={{fontSize:18,color:C.muted,maxWidth:650,margin:'0 auto'}}>
              Adapt SCENVY to your industry's specific needs.
            </p>
          </div>
          
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))',gap:24}}>
            {/* Restaurants */}
            <div style={{background:C.bg,borderRadius:20,padding:40,border:`1px solid ${C.border}`,boxShadow:'0 8px 30px rgba(0,0,0,0.3)',transition:'transform .2s',cursor:'default'}} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-4px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
              <div style={{width:56,height:56,borderRadius:16,background:'rgba(249,115,22,0.1)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:24}}><Utensils size={28} color="#F97316"/></div>
              <h3 style={{fontSize:22,fontWeight:800,marginBottom:12}}>Restaurants & Cafés</h3>
              <p style={{color:C.muted,lineHeight:1.7,fontSize:15}}>Drive more revenue with interactive food reels, effortless digital menus, and instant happy hour promotions across your tables and screens.</p>
            </div>
            {/* Hotels */}
            <div style={{background:C.bg,borderRadius:20,padding:40,border:`1px solid ${C.border}`,boxShadow:'0 8px 30px rgba(0,0,0,0.3)',transition:'transform .2s',cursor:'default'}} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-4px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
              <div style={{width:56,height:56,borderRadius:16,background:'rgba(16,185,129,0.1)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:24}}><Building size={28} color="#10B981"/></div>
              <h3 style={{fontSize:22,fontWeight:800,marginBottom:12}}>Hotels & Resorts</h3>
              <p style={{color:C.muted,lineHeight:1.7,fontSize:15}}>Engage guests from lobby to room. Display local recommendations on lobby screens and offer seamless digital room service via QR codes.</p>
            </div>
            {/* Retail */}
            <div style={{background:C.bg,borderRadius:20,padding:40,border:`1px solid ${C.border}`,boxShadow:'0 8px 30px rgba(0,0,0,0.3)',transition:'transform .2s',cursor:'default'}} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-4px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
              <div style={{width:56,height:56,borderRadius:16,background:'rgba(139,92,246,0.1)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:24}}><ShoppingBag size={28} color="#8B5CF6"/></div>
              <h3 style={{fontSize:22,fontWeight:800,marginBottom:12}}>Retail & Lifestyle</h3>
              <p style={{color:C.muted,lineHeight:1.7,fontSize:15}}>Bring static displays to life. Highlight new collections on screens and allow customers to scan and shop exclusive offers directly.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{padding:'80px 5%',position:'relative'}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          {/* ALL 8 APP ICONS & SPLASH SCREENS (MOBILE) SHOWCASE */}
          <div style={{background:C.card,border:`1px solid ${C.purple}44`,borderRadius:28,padding:32,marginBottom:48}}>
            <div style={{textAlign:'center',marginBottom:32}}>
              <div style={{fontSize:11,fontWeight:800,color:C.purple,letterSpacing:2,textTransform:'uppercase',marginBottom:6}}>SPLASH SCREENS & APP ICONS (MOBILE)</div>
              <h3 style={{fontSize:26,fontWeight:900,color:C.white}}>Die 8 nativen Smartphone-Erlebnisse</h3>
              <p style={{fontSize:14,color:C.muted,marginTop:6,maxWidth:600,margin:'6px auto 0'}}>Jedes Modul besitzt sein eigenes visuelles Thema, Icon-Branding und mobilen Splash-Screen.</p>
            </div>
            
            {/* 8 Phone Mockups Horizontal Row */}
            <div style={{display:'flex',gap:16,overflowX:'auto',paddingBottom:20,paddingTop:10,scrollbarWidth:'thin'}}>
              {[
                'scenvy',
                'flow',
                'menu',
                'board',
                'host',
                'link',
                'store',
                'magic'
              ].map((mod) => (
                <div key={mod} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
                  <ScenvyPhoneMockup module={mod} size="normal" lang={lang} />
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:12,fontWeight:800,color:C.white,textTransform:'uppercase'}}>{mod}</div>
                    <div style={{fontSize:10,fontFamily:'monospace',color:MODULE_COLORS[mod]?.primary || C.purple}}>{MODULE_COLORS[mod]?.domain}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* App Icons Grid */}
            <div style={{borderTop:`1px solid ${C.border}`,paddingTop:24,marginTop:12}}>
              <div style={{fontSize:11,fontWeight:800,color:C.muted,letterSpacing:1.5,textAlign:'center',textTransform:'uppercase',marginBottom:16}}>APP ICONS (SQUIRCLE FORMAT)</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(110px, 1fr))',gap:16}}>
                {[
                  { id: 'flow', name: 'Flow' },
                  { id: 'menu', name: 'Menu' },
                  { id: 'board', name: 'Board' },
                  { id: 'host', name: 'Host' },
                  { id: 'link', name: 'Link' },
                  { id: 'store', name: 'Store' },
                  { id: 'magic', name: 'Magic' }
                ].map((m) => (
                  <div key={m.id} style={{background:C.bg,border:`1px solid ${MODULE_COLORS[m.id]?.primary || C.purple}33`,borderRadius:16,padding:14,textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
                    <ScenvyAppIcon module={m.id} size={56} />
                    <div style={{fontSize:12,fontWeight:800,color:C.white}}>{m.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* HARDWARE & STORE BANNER */}
          <div id="store" style={{background:`${C.card}88`,border:`1px solid ${C.border}`,borderRadius:20,padding:32,display:'flex',flexDirection:'column',gap:20}}>
            <div style={{display:'flex',justify:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
              <div>
                <div style={{fontSize:11,color:C.white,fontWeight:800,letterSpacing:1.5,marginBottom:6,textTransform:'uppercase',display:'flex',alignItems:'center',gap:8}}>
                  <ShoppingBag size={14} color={C.white}/>
                  <span>SCENVY STORE & TAGS</span>
                  <span style={{background:'rgba(255,255,255,0.1)',fontSize:10,padding:'2px 8px',borderRadius:10}}>store.scenvy.de</span>
                </div>
                <h3 style={{fontSize:20,fontWeight:800,color:C.white}}>Physische Trigger & Digital Signage Hardware</h3>
                <p style={{fontSize:13,color:C.muted,marginTop:4}}>Verbinde deine physischen Tische, Theken & Räume nahtlos mit deinen SCENVY Apps.</p>
              </div>

              <button onClick={()=>nav('/auth?mode=register')} style={{padding:'12px 24px',borderRadius:12,border:`1px solid ${C.border}`,background:C.card,color:C.white,fontWeight:700,fontSize:13,cursor:'pointer'}}>
                Hardware Katalog anfragen →
              </button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:16,marginTop:8}}>
              {[
                { icon: <Tag size={16} color={C.purple}/>, title: 'SCENVY TAGS (NFC & QR)', desc: 'Hochwertige Acryl Tischaufsteller & Metal-NFC Tags für blitzschnellen Kontakt.' },
                { icon: <Tv size={16} color={C.blue}/>, title: 'Digital Signage Displays', desc: 'Professionelle 4K Displays für den Dauerbetrieb in Gastronomie & Retail.' },
                { icon: <Zap size={16} color={C.pink}/>, title: 'Signage Player Hardware', desc: 'Kompakte Plug-and-Play Mediaplayer für SCENVY BOARD.' }
              ].map((item, idx) => (
                <div key={idx} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,padding:16}}>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:4,display:'flex',alignItems:'center',gap:8}}>
                    {item.icon}
                    <span>{item.title}</span>
                  </div>
                  <div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{padding:'80px 5%',position:'relative'}}>
        <Glow color={C.purple} x="50%" y="50%" size={800}/>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <div style={{fontSize:11,color:C.pink,fontWeight:700,letterSpacing:2,marginBottom:12}}>{t.fKicker}</div>
            <h2 style={{fontSize:'clamp(28px, 3.5vw, 42px)',fontWeight:900,marginBottom:16}}>{t.fTitle}</h2>
            <p style={{fontSize:16,color:C.muted,maxWidth:500,margin:'0 auto'}}>{t.fSub}</p>
          </div>
          <div className="features-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
            {t.features.map((f,i)=>(
              <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:28,transition:'border-color .2s,transform .2s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=fcolors[i];e.currentTarget.style.transform='translateY(-3px)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform='none'}}>
                <div style={{height:48,borderRadius:14,background:`${fcolors[i]}22`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:18}}>{icons[i]}</div>
                <div style={{fontSize:18,fontWeight:700,marginBottom:10}}>{f.t}</div>
                <div style={{fontSize:14,color:C.muted,lineHeight:1.65}}>{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{padding:'80px 5%',background:`${C.card}66`}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <div style={{fontSize:11,color:C.pink,fontWeight:700,letterSpacing:2,marginBottom:12}}>{t.howKicker}</div>
            <h2 style={{fontSize:'clamp(28px, 3.5vw, 42px)',fontWeight:900,marginBottom:16}}>{t.howTitle}</h2>
            <p style={{fontSize:16,color:C.muted}}>{t.howSub}</p>
          </div>
          <div className="steps-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,position:'relative'}}>
            <div className="step-line" style={{position:'absolute',top:56,left:'16.67%',right:'16.67%',height:1,background:`linear-gradient(90deg,${C.purple},${C.blue})`,opacity:.3}}/>
            {t.steps.map((s,i)=>(
              <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:32}}>
                <div style={{width:56,height:56,borderRadius:'50%',background:grad(stepColors[i],i===2?C.purple:C.pink),display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:900,marginBottom:24,boxShadow:`0 4px 20px ${stepColors[i]}44`}}>{s.n}</div>
                <div style={{fontSize:20,fontWeight:700,marginBottom:12}}>{s.t}</div>
                <div style={{fontSize:14,color:C.muted,lineHeight:1.65}}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section id="demo" style={{padding:'80px 5%',position:'relative',overflow:'hidden'}}>
        <Glow color={C.pink} x="20%" y="50%" size={700}/>
        <div className="demo-container" style={{maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',gap:60}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:C.pink,fontWeight:700,letterSpacing:2,marginBottom:12}}>LIVE DEMO</div>
            <h2 style={{fontSize:'clamp(28px, 3.5vw, 42px)',fontWeight:900,marginBottom:20,lineHeight:1.15}}>
              {lang==='de'?'Was deine Gäste':'What your guests'}<br/>
              <span style={{background:grad(C.purple,C.pink),WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{lang==='de'?'sehen werden.':'will see.'}</span>
            </h2>
            <div className="demo-text-list">
              {(lang==='de'?['Kein App-Download nötig','Läuft auf jedem Smartphone','Lädt in unter 1 Sekunde','Vollständig gebrandet']:['No app download needed','Works on any smartphone','Loads in under 1 second','Fully branded']).map((f,i)=>(
                <div key={i} style={{display:'flex',gap:12,alignItems:'center',marginBottom:14}}>
                  <div style={{width:20,height:20,borderRadius:'50%',background:`${C.green}22`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Check size={12} color="#00E676"/></div>
                  <span style={{fontSize:14,color:C.muted}}>{f}</span>
                </div>
              ))}
            </div>
            <Btn onClick={()=>nav('/l/demo')} style={{marginTop:20}}>{lang==='de'?'Live-Demo ausprobieren →':'Try live demo →'}</Btn>
          </div>
          <div className="demo-phones" style={{display:'flex',gap:14,alignItems:'center',flexShrink:0}}>
            {[0,1,2].map(o=><div key={o} style={{transform:o===1?'scale(1.06)':'none',marginTop:o===1?0:20}}><Phone size="small" lang={lang}/></div>)}
          </div>
        </div>
      </section>

      {/* PRICING */}
      {landingConfig.show_pricing_section && (
        <section id="pricing" style={{padding:'80px 5%',position:'relative'}}>
          <Glow color={C.blue} x="80%" y="40%" size={600}/>
          <div style={{maxWidth:1200,margin:'0 auto'}}>
            <div style={{textAlign:'center',marginBottom:48}}>
              <div style={{fontSize:11,color:C.pink,fontWeight:700,letterSpacing:2,marginBottom:12}}>{t.pKicker}</div>
              <h2 style={{fontSize:'clamp(28px, 3.5vw, 42px)',fontWeight:900,marginBottom:16}}>{t.pTitle}</h2>
              <p style={{fontSize:16,color:C.muted}}>{t.pSub}</p>
            </div>
            <div className="pricing-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
              {[
                {
                  n: 'STARTER',
                  p: '€0',
                  per: lang === 'en' ? '/ 30 days' : '/ 30 Tage',
                  d: lang === 'en' ? 'Perfect for single locations & quick tests.' : 'Perfekt für einzelne Standorte & schnelle Tests.',
                  color: C.muted,
                  cta: lang === 'en' ? 'Start for free' : 'Kostenlos starten',
                  act: 'register',
                  feat: lang === 'en' 
                    ? ['30 days all modules', 'Unlimited locations', 'No automatic subscription', 'Manual activation by support']
                    : ['30 Tage alle Module testen', 'Unlimitierte Standorte', 'Kein Auto-Abo', 'Manuelle Aktivierung via Support']
                },
                {
                  n: 'PRO',
                  p: `€19`,
                  per: lang === 'en' ? '/ mo.' : '/ mtl.',
                  d: lang === 'en' ? 'For active venues & high guest volume.' : 'Für aktive Gastronomen & Locations mit vielen Gästen.',
                  color: C.blue,
                  pop: true,
                  cta: lang === 'en' ? 'Get started' : 'Jetzt starten',
                  act: 'register',
                  feat: lang === 'en'
                    ? ['Unlimited locations', '1 Module included (e.g. FLOW)', 'Each additional module +€9 / mo*', 'In-App purchases available']
                    : ['Unlimitierte Standorte', '1 Modul inklusive (z.B. FLOW)', 'Jedes weitere Modul +9 € / Monat*', 'In-App Käufe möglich']
                },
                {
                  n: 'ENTERPRISE',
                  p: lang === 'en' ? 'Individual' : 'Individuell',
                  per: '',
                  d: lang === 'en' ? 'For franchises, chains, and agencies.' : 'Für Franchise, Ketten, Hotelgruppen & Agenturen.',
                  color: C.purple,
                  contact: true,
                  cta: lang === 'en' ? 'Contact us' : 'Kontaktieren',
                  act: 'contact',
                  feat: lang === 'en'
                    ? ['Custom terms', 'White-Label Branding & Custom Domain', 'API Integration', 'Dedicated Account Manager']
                    : ['Individuelle Konditionen', 'White-Label Branding & Eigene Domain', 'API-Anbindung an bestehende Systeme', 'Dedizierter Account Manager']
                }
              ].map((p,i)=>(
                <div key={i} className={p.pop?'pricing-card-pop':''} style={{background:C.card,border:`2px solid ${p.pop?p.color:C.border}`,borderRadius:24,padding:'32px 24px',position:'relative',transform:p.pop?'scale(1.03)':'none',boxShadow:p.pop?`0 0 40px ${p.color}33`:'none'}}>
                  {p.pop&&<div style={{position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',background:grad(C.purple,C.pink),borderRadius:20,padding:'5px 16px',fontSize:11,fontWeight:700,whiteSpace:'nowrap'}}>{lang === 'en' ? '⭐ Recommended' : '⭐ Empfohlen'}</div>}
                  <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>{p.n}</div>
                  <div style={{marginBottom:8}}>
                    <span style={{fontSize:p.p==='Individuell'||p.p==='Individual'?28:42,fontWeight:900,color:p.color}}>{p.p}</span>
                    {p.per&&<span style={{fontSize:14,color:C.muted}}> {p.per}</span>}
                  </div>
                  <div style={{fontSize:13,color:C.muted,marginBottom:24,lineHeight:1.5}}>{p.d}</div>
                  <button onClick={() => handleCtaClick(p.act, '')}
                    style={{width:'100%',padding:'13px 0',borderRadius:12,border:'none',cursor:'pointer',background:p.pop?grad(C.purple,C.pink):`${p.color}22`,color:p.pop?C.white:p.color,fontWeight:700,fontSize:14,fontFamily:'inherit',marginBottom:24,boxShadow:p.pop?`0 4px 20px ${C.purple}44`:'none'}}>
                    {p.cta} →
                  </button>
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    {p.feat.map((f,j)=>(
                      <div key={j} style={{display:'flex',gap:10,alignItems:'center'}}>
                        <div style={{width:18,height:18,borderRadius:'50%',background:`${p.color}22`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Check size={11} color={p.color}/></div>
                        <span style={{fontSize:13,color:C.muted}}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{textAlign:'center',marginTop:32,fontSize:13,color:C.muted}}>
              {lang === 'en' 
                ? '* SCENVY HOST has custom pricing (billing based on number of rooms/size). After the 30-day trial period, manual activation is performed by our team.'
                : '* SCENVY HOST hat abweichende Preise (Abrechnung je nach Zimmeranzahl/Größe der Einrichtung). Nach Ablauf der 30-tägigen Testphase erfolgt die manuelle Aktivierung durch unser Team.'}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <section style={{padding:'80px 5%',background:`${C.card}44`}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <div style={{fontSize:11,color:C.pink,fontWeight:700,letterSpacing:2,marginBottom:12}}>{t.tKicker}</div>
            <h2 style={{fontSize:'clamp(26px, 3vw, 36px)',fontWeight:900}}>{t.tTitle}</h2>
          </div>
          <div className="testimonials-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
            {t.testimonials.map((q,i)=>(
              <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:28}}>
                <div style={{display:'flex',gap:2,marginBottom:18}}>{[...Array(5)].map((_,j)=><Star key={j} size={14} fill="#FF9500" color="#FF9500"/>)}</div>
                <p style={{fontSize:14,color:C.muted,lineHeight:1.7,marginBottom:24,fontStyle:'italic'}}>"{q.q}"</p>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:40,height:40,borderRadius:'50%',background:grad(C.purple,C.pink),display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:16}}>{q.n[0]}</div>
                  <div><div style={{fontSize:14,fontWeight:700}}>{q.n}</div><div style={{fontSize:12,color:C.muted}}>{q.r}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{padding:'120px 5%',position:'relative',overflow:'hidden',zIndex:2}}>
        <Glow color={C.purple} x="30%" y="50%" size={700}/><Glow color={C.pink} x="70%" y="50%" size={600}/>
        <div style={{maxWidth:700,margin:'0 auto',textAlign:'center',position:'relative',background:'rgba(22,29,39,0.5)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:32,padding:60,boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}}>
          <h2 style={{fontSize:'clamp(32px,5vw,56px)',fontWeight:900,lineHeight:1.15,marginBottom:24}}>
            Ready to transform<br/><span style={{background:'linear-gradient(135deg, #8B5CF6, #EC4899)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>your business?</span>
          </h2>
          <Btn onClick={()=>setShowContact(true)} style={{fontSize:18,padding:'18px 48px',borderRadius:16}}>{lang==='en'?'Book Demo':'Demo buchen'}</Btn>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{padding:'60px 5% 32px',borderTop:`1px solid ${C.border}`}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <div className="footer-grid" style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:40,marginBottom:48}}>
            <div>
              <div style={{marginBottom:16}}>
                <ScenvyLogoFull height={40} />
              </div>
              <p style={{fontSize:13,color:C.muted,lineHeight:1.65,marginBottom:12}}>{t.footerTag}</p>
              <div style={{fontSize:12,color:C.dim}}>app.scenvy.de</div>
            </div>
            {[['Product',['Features','Pricing','Changelog','Demo']],['Company',['About','Blog','Careers','Press']],['Legal',['Privacy','Terms','GDPR','Imprint']]].map(([title,links])=>(
              <div key={title}>
                <div style={{fontSize:11,fontWeight:700,color:C.white,letterSpacing:1,marginBottom:14}}>{title.toUpperCase()}</div>
                {links.map(l=><div key={l} style={{fontSize:13,color:C.muted,marginBottom:10,cursor:'pointer'}} onMouseEnter={e=>e.target.style.color=C.white} onMouseLeave={e=>e.target.style.color=C.muted}>{l}</div>)}
              </div>
            ))}
          </div>
          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:24,display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
            <div style={{fontSize:13,color:C.dim}}>{t.footerCopy}</div>
            <div style={{fontSize:13,color:C.dim}}>{t.footerMade}</div>
          </div>
        </div>
      </footer>

      {/* STICKY MOBILE BOTTOM CTA BAR */}
      <div className="mobile-bottom-bar" style={{display:'none',position:'fixed',bottom:0,left:0,right:0,zIndex:990,background:'rgba(13,13,20,0.95)',backdropFilter:'blur(16px)',borderTop:`1px solid ${C.border}`,padding:'10px 16px',gap:10,alignItems:'center',boxShadow:'0 -10px 30px rgba(0,0,0,0.8)'}}>
        <button onClick={()=>nav('/auth')} style={{flex:1,padding:'12px 0',borderRadius:10,border:`1px solid ${C.border}`,background:C.card,color:C.white,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',textAlign:'center'}}>
          {t.nav.login}
        </button>
        <button onClick={()=>nav('/auth?mode=register')} style={{flex:1.5,padding:'12px 0',borderRadius:10,border:'none',background:grad(C.purple,C.pink),color:C.white,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',textAlign:'center',boxShadow:`0 4px 15px ${C.purple}55`}}>
          {t.nav.cta}
        </button>
      </div>

      {showContact&&<ContactModal onClose={()=>setShowContact(false)} lang={lang}/>}
    </div>
  )
}

