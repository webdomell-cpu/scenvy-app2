const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.jsx', 'utf-8');

const target = `  const [landingConfig, setLandingConfig] = useState(() => {
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
      hero_btn_primary_text: 'Live Preview',
      hero_btn_primary_action: 'url',
      hero_btn_primary_url: '/demo',
      hero_btn_secondary_text: 'Book Demo',
      hero_btn_secondary_action: 'url',
      hero_btn_secondary_url: 'https://cal.com'
    }
  })`;

const replacement = `  const [landingConfig, setLandingConfig] = useState(() => {
    const saved = localStorage.getItem('scenvy_landing_config')
    return saved ? JSON.parse(saved) : {
      show_flow_page: true,
      show_menu_page: true,
      show_board_page: true,
      show_host_page: true,
      show_store_page: true,
      show_pricing_section: true,
      show_top_banner: true,
      top_banner_text: '🚀 Der neue Standard für digitale Gastronomie ist live!',
      top_banner_link: '/auth?mode=register',
      show_login_btn: true,
      show_register_btn: true,
      header_cta_text: 'Demo buchen',
      hero_kicker: 'DAS BETRIEBSSYSTEM FÜR',
      hero_title_highlight: 'Moderne Gastronomie',
      hero_subtitle: 'Erstelle, verwalte und verteile digitale Erlebnisse an jedem Berührungspunkt.',
      hero_btn_primary_text: 'Kostenlos starten',
      hero_btn_primary_action: 'url',
      hero_btn_primary_url: '/demo',
      hero_btn_secondary_text: 'Demo ansehen',
      hero_btn_secondary_action: 'url',
      hero_btn_secondary_url: 'https://cal.com'
    }
  })`;

content = content.replace(target, replacement);

const langTarget = `  const[lang,setLang]=useState(()=>localStorage.getItem('scenvy_lang')||(navigator.language?.startsWith('de')?'de':'en'))`;
const langReplacement = `  const[lang,setLang]=useState(() => {
    const saved = localStorage.getItem('scenvy_lang')
    if (saved) return saved
    const userLang = navigator.language || navigator.userLanguage || ''
    if (userLang.toLowerCase().startsWith('de')) return 'de'
    return 'en'
  })`;

content = content.replace(langTarget, langReplacement);

fs.writeFileSync('src/pages/Landing.jsx', content);
