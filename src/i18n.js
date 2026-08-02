// src/i18n.js — All UI translations

export const T = {
  de: {
    nav: {
      features: 'Features', howItWorks: "So geht's", pricing: 'Preise',
      demo: 'Demo', login: 'Einloggen', cta: 'Kostenlos starten →'
    },
    hero: {
      kicker: 'DIE ZUKUNFT DES VENUE-MARKETINGS',
      h1a: 'Verwandle jeden Ort',
      h1b: 'in ein',
      scrollable: 'scrollbares',
      h1c: 'Erlebnis.',
      sub: 'SCENVY verwandelt deine QR-Codes in TikTok-artige vertikale Reels. Echtzeit-Angebote, KI-generierte Inhalte — kein App-Download nötig.',
      cta1: 'Kostenlos starten →',
      cta2: 'Demo ansehen',
      trust: 'Vertrauen von über 2.000+ Venues in 40 Ländern'
    },
    stats: [
      { value: '3.4×', label: 'Mehr Engagement' },
      { value: '80%',  label: 'Ø Watch-Rate'    },
      { value: '5 Min',label: 'Setup-Zeit'      },
      { value: '€0',   label: 'Setup-Kosten'    },
    ],
    features: {
      kicker: 'FEATURES',
      title: 'Alles was dein Venue braucht',
      sub: 'Eine Plattform. Alle Tools um passive Gäste in aktive Kunden zu verwandeln.',
      items: [
        { title: 'Reel-Erlebnis',    desc: 'TikTok-artige vertikale Stories die automatisch starten. Gäste swipen, entdecken und handeln — genau wie in Social Media.' },
        { title: 'Live-Angebote',    desc: 'Schiebe Echtzeit-Deals mit Countdown-Timer raus. Happy Hour? Event? Tagesangebot? In unter 60 Sekunden live.' },
        { title: 'KI-Generator',     desc: 'Beschreibe dein Angebot oder lade ein Foto hoch — Claude KI erstellt einen kompletten Reel mit Text, CTA und Hashtags.' },
        { title: 'Multi-Standort',   desc: 'Alle deine Venues in einem Dashboard. Jeder Standort bekommt einen eigenen QR-Code und Reel-Feed.' },
        { title: 'Analytics',        desc: 'Verfolge Scans, Watch-Time und CTA-Klickraten. Wisse genau welcher Content Umsatz bringt.' },
        { title: 'QR-Code-System',   desc: 'Jeder Standort bekommt eine eigene URL: app.scenvy.de/l/{id}. Drucken, aufstellen, scannen.' },
      ]
    },
    how: {
      kicker: 'SO GEHT\'S',
      title: 'In 5 Minuten live',
      sub: 'Drei Schritte. Kein Entwickler nötig.',
      steps: [
        { n: '01', title: 'QR-Code holen',      desc: 'Registriere dich, erstelle einen Standort und SCENVY generiert deinen QR-Code sofort. Drucken und aufstellen.' },
        { n: '02', title: 'Reels erstellen',     desc: 'Lade Videos oder Fotos hoch oder lass unsere KI Reels aus einer Textbeschreibung erstellen. Sofort live schalten.' },
        { n: '03', title: 'Gäste scannen',       desc: 'Gäste scannen und bekommen ein Vollbild-Reel-Erlebnis. Swipen, Angebote entdecken, CTA antippen.' },
      ]
    },
    demo: {
      kicker: 'LIVE DEMO',
      title1: 'Was deine Gäste',
      title2: 'sehen werden.',
      sub: 'Drei Reels. Drei Touchpoints. Ein durchgängiges Markenerlebnis vom ersten Scan bis zur Bestellung.',
      checks: ['Kein App-Download nötig', 'Läuft auf jedem Smartphone', 'Lädt in unter 1 Sekunde', 'Vollständig gebrandet für dein Venue'],
      cta: 'Live-Demo ausprobieren →'
    },
    pricing: {
      kicker: 'PREISE',
      title: 'Einfache, transparente Preise',
      sub: 'Keine Setup-Gebühren. Keine versteckten Kosten. Jederzeit kündbar.',
      plans: [
        { name: 'Starter', price: '€0', period: 'für immer', desc: 'Perfekt um SCENVY risikofrei auszuprobieren.', cta: 'Kostenlos starten', features: ['1 Standort', '5 Reels', 'Basis-Analytics', 'QR-Code-Generator', 'E-Mail-Support'] },
        { name: 'Pro',     price: '€79',  period: '/Monat', desc: 'Für wachsende Venues die mehr Engagement wollen.', cta: 'Jetzt starten', features: ['5 Standorte', 'Unbegrenzte Reels', 'KI-Reel-Generator', 'Volle Analytics + CTR', 'Social Import (IG, TikTok)', 'Prioritäts-Support'] },
        { name: 'Enterprise', price: '€299', period: '/Monat', desc: 'Für Gruppen und Ketten über mehrere Städte.', cta: 'Kontaktieren', features: ['Unbegrenzte Standorte', 'Unbegrenzte Reels', 'KI + Scheduling', 'White Label Branding', 'API-Zugang', 'Dedicated Account Manager'] },
      ]
    },
    testimonials: {
      kicker: 'KUNDENMEINUNGEN',
      title: 'Venues lieben SCENVY',
      items: [
        { quote: 'Unsere Scan-to-Order-Rate hat sich in der ersten Woche verdreifacht. Gäste lieben das Reel-Format — es fühlt sich genau wie TikTok an.', name: 'Khalid Al-Rashid', role: 'GM, Marina Walk Restaurant Group' },
        { quote: 'Der KI-Generator ist unglaublich. Ich tippe "Happy Hour heute" und er erstellt einen kompletten Reel mit Text, Emoji, Hashtags — in Sekunden.', name: 'Sophie Laurent', role: 'Inhaberin, Rooftop Bar 21' },
        { quote: 'Wir betreiben 6 Venues in Dubai. Ein Dashboard, ein Login, volle Kontrolle. SCENVY ist das fehlende Stück in unserem Tech-Stack.', name: 'Marcus Webb', role: 'Director, The Palm Events Group' },
      ]
    },
    cta: {
      kicker: 'LOSLEGEN',
      title1: 'Bereit scrollbar',
      title2: 'zu werden?',
      sub: 'Schließe dich 2.000+ Venues an die SCENVY nutzen um Gäste zu begeistern und mehr Umsatz zu machen.',
      btn: 'Kostenlose Testphase starten →',
      note: 'Keine Kreditkarte nötig · Setup in 5 Minuten · Jederzeit kündbar'
    },
    footer: {
      tagline: 'Verwandle jeden Ort in ein scrollbares Erlebnis.',
      copy: '© 2026 SCENVY. Alle Rechte vorbehalten.',
      made: 'Gemacht mit ❤️ für die Hospitality-Branche'
    }
  },

  en: {
    nav: {
      features: 'Features', howItWorks: 'How it works', pricing: 'Pricing',
      demo: 'Demo', login: 'Log in', cta: 'Get Started Free →'
    },
    hero: {
      kicker: 'THE FUTURE OF VENUE MARKETING',
      h1a: 'Turn every place',
      h1b: 'into a',
      scrollable: 'scrollable',
      h1c: 'experience.',
      sub: 'SCENVY transforms your QR codes into TikTok-style vertical reels. Real-time offers, AI-generated content — no app download needed.',
      cta1: 'Start for free →',
      cta2: 'See demo',
      trust: 'Trusted by 2,000+ venues in 40 countries'
    },
    stats: [
      { value: '3.4×', label: 'More engagement' },
      { value: '80%',  label: 'Avg watch rate'  },
      { value: '5 min',label: 'Setup time'      },
      { value: '€0',   label: 'Setup cost'      },
    ],
    features: {
      kicker: 'FEATURES',
      title: 'Everything your venue needs',
      sub: 'One platform. All the tools to turn passive guests into active customers.',
      items: [
        { title: 'Reel Experience',  desc: 'TikTok-style vertical stories that auto-play and loop. Guests swipe, engage, and act — just like social media.' },
        { title: 'Live Offers',      desc: 'Push real-time deals with countdown timers. Happy hour? Event? Daily special? Live in under 60 seconds.' },
        { title: 'AI Generator',     desc: 'Describe your offer or upload a photo — Claude AI creates a complete reel with copy, CTA, and hashtags.' },
        { title: 'Multi-Location',   desc: 'Manage all your venues from one dashboard. Each location gets its own QR code and reel feed.' },
        { title: 'Analytics',        desc: 'Track scans, watch time, and CTA click-through rates. Know exactly which content drives revenue.' },
        { title: 'QR Code System',   desc: 'Every location gets a unique URL: app.scenvy.de/l/{id}. Print it, display it, start scanning.' },
      ]
    },
    how: {
      kicker: 'HOW IT WORKS',
      title: 'Up and running in 5 minutes',
      sub: 'Three steps. No developer needed.',
      steps: [
        { n: '01', title: 'Get your QR code',     desc: 'Sign up, create a location, and SCENVY generates your unique QR code instantly. Print it and display it anywhere.' },
        { n: '02', title: 'Create your reels',    desc: 'Upload videos or photos, or let our AI generate reels from a text description. Schedule them or push them live instantly.' },
        { n: '03', title: 'Guests scan & engage', desc: 'Guests scan and get a full-screen reel experience. They swipe, discover offers, and tap your CTA to order or reserve.' },
      ]
    },
    demo: {
      kicker: 'LIVE DEMO',
      title1: 'What your guests',
      title2: 'will see.',
      sub: 'Three reels. Three touchpoints. One seamless brand experience from first scan to order.',
      checks: ['No app download needed', 'Works on any smartphone', 'Loads in under 1 second', 'Fully branded to your venue'],
      cta: 'Try live demo →'
    },
    pricing: {
      kicker: 'PRICING',
      title: 'Simple, transparent pricing',
      sub: 'No setup fees. No hidden costs. Cancel anytime.',
      plans: [
        { name: 'Starter', price: '€0',   period: 'forever',  desc: 'Perfect to try SCENVY risk-free.',                          cta: 'Start for free', features: ['1 location', '5 reels', 'Basic analytics', 'QR code generator', 'Email support'] },
        { name: 'Pro',     price: '€79',  period: '/month',   desc: 'For growing venues serious about engagement.',               cta: 'Get started',    features: ['5 locations', 'Unlimited reels', 'AI Reel Generator', 'Full analytics + CTR', 'Social import (IG, TikTok)', 'Priority support'] },
        { name: 'Enterprise', price: '€299', period: '/month', desc: 'For groups and chains across multiple cities.',             cta: 'Contact us',     features: ['Unlimited locations', 'Unlimited reels', 'AI Generator + scheduling', 'White label branding', 'API access', 'Dedicated account manager'] },
      ]
    },
    testimonials: {
      kicker: 'TESTIMONIALS',
      title: 'Venues love SCENVY',
      items: [
        { quote: 'Our scan-to-order rate tripled in the first week. Guests love the reel format — it feels exactly like TikTok.', name: 'Khalid Al-Rashid', role: 'GM, Marina Walk Restaurant Group' },
        { quote: "The AI generator is insane. I type 'happy hour tonight' and it creates a full reel with copy, emoji, hashtags — in seconds.", name: 'Sophie Laurent', role: 'Owner, Rooftop Bar 21' },
        { quote: 'We run 6 venues across Dubai. One dashboard, one login, full control. SCENVY is the missing piece in our tech stack.', name: 'Marcus Webb', role: 'Director, The Palm Events Group' },
      ]
    },
    cta: {
      kicker: 'GET STARTED',
      title1: 'Ready to go',
      title2: 'scrollable?',
      sub: 'Join 2,000+ venues already using SCENVY to engage guests and drive more revenue.',
      btn: 'Start your free trial →',
      note: 'No credit card required · Setup in 5 minutes · Cancel anytime'
    },
    footer: {
      tagline: 'Turn every place into a scrollable experience.',
      copy: '© 2026 SCENVY. All rights reserved.',
      made: 'Made with ❤️ for hospitality'
    }
  }
}
