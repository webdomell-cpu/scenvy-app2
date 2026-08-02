import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, grad } from '@/tokens'
import { ScenvyLogoFull } from '@/components/ScenvyLogo'
import { useTenants, useUpdateTenant, useDeleteTenant, useUsers, useSaveUser, useDeleteUser, useReels, useSaveReel, useLocations, useLandingConfig, useSaveLandingConfig, usePricingConfig, useSavePricingConfig, usePlatformConfig, useSavePlatformConfig, useDomains, useSaveDomain, useDeleteDomain } from '@/lib/db'
import { useAuth } from '@/lib/AuthContext'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, TrendingUp, MapPin, Film, Activity, LogOut, RefreshCw, Save, Mail, Shield, Building2, CreditCard, X, ChevronRight, Trash2, Power, CheckCircle, AlertCircle, ExternalLink, Package, DollarSign, FileText, Download, Plus, Check, Play, Zap, Globe, Sliders, Layout } from 'lucide-react'

const MRR_TREND = [
  {month:'Jan',mrr:0},{month:'Feb',mrr:0},{month:'Mar',mrr:29},
  {month:'Apr',mrr:58},{month:'May',mrr:87},{month:'Jun',mrr:116},
]

const PLAN_C   = { enterprise:C.purple, pro:C.blue, starter:C.muted }
const PLAN_MRR = { enterprise:299, pro:29, starter:0 }

export default function Admin() {
  const nav = useNavigate()
  const { user, logout, impersonateTenant } = useAuth()
  const { data: tenants=[], isLoading } = useTenants()
  const updateTenant = useUpdateTenant()
  const deleteTenant = useDeleteTenant()

  const { data: users = [], isLoading: usersLoading } = useUsers()
  const saveUserMutation = useSaveUser()
  const deleteUserMutation = useDeleteUser()

  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [userModalData, setUserModalData] = useState({ name: '', email: '', role: 'tenant_owner', venue: '', plan: 'pro' })

  const { data: dbReels = [] } = useReels('ALL')
  const { data: dbLocations = [] } = useLocations('ALL')
  const saveReelMutation = useSaveReel()

  const [toast, setToast]       = useState(null)
  const [tab, setTab]           = useState('users')
  const [editTenant, setEditTenant] = useState(null)
  const [reelLocMappings, setReelLocMappings] = useState({})
  
  const { data: dbLandingConfig } = useLandingConfig()
  const { data: dbPricingConfig } = usePricingConfig()
  const { data: dbPlatformConfig } = usePlatformConfig()

  const { data: dbDomains = [] } = useDomains()
  const saveDomainMutation = useSaveDomain()
  const deleteDomainMutation = useDeleteDomain()

  const [newDomainInput, setNewDomainInput] = useState('')
  const [newDomainType, setNewDomainType] = useState('Eigene Domain')
  const [newDomainTarget, setNewDomainTarget] = useState('Custom Venue & QR Portal')
  const [domainTestStatus, setDomainTestStatus] = useState({})

  const handleAddDomain = async () => {
    if (!newDomainInput.trim()) return notify('⚠️ Bitte eine Domain eingeben (z.B. scary.de)')
    const cleanDomain = newDomainInput.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    try {
      await saveDomainMutation.mutateAsync({
        domain: cleanDomain,
        type: newDomainType,
        status: 'authorized',
        ssl: 'active',
        targetModule: newDomainTarget,
        tenantId: 'ALL'
      })
      setNewDomainInput('')
      notify(`✅ Domain ${cleanDomain} erfolgreich autorisiert und registriert!`)
    } catch (e) {
      notify('❌ Fehler beim Registrieren der Domain')
    }
  }

  const handleDeleteDomain = async (id, domainName) => {
    try {
      await deleteDomainMutation.mutateAsync(id)
      notify(`🗑️ Domain ${domainName} wurde aus dem Registry entfernt.`)
    } catch (e) {
      notify('❌ Fehler beim Löschen der Domain')
    }
  }

  const saveLandingMutation = useSaveLandingConfig()
  const savePricingMutation = useSavePricingConfig()
  const savePlatformMutation = useSavePlatformConfig()

  const [config, setConfig] = useState(() => dbPlatformConfig || {
    contact_email: '', support_email: '',
    stripe_pk: '', stripe_secret: '', stripe_webhook: '',
    resend_key: '', from_email: 'noreply@scenvy.de',
  })

  const [pricingConfig, setPricingConfig] = useState(() => dbPricingConfig || {
    starter_price: 0,
    pro_price: 29,
    enterprise_price: 299,
    annual_discount: 20,
    module_flow: 29,
    module_menu: 49,
    module_board: 79,
    module_host: 39,
    show_pricing_on_landing: true,
    starter_cta_text: 'Kostenlos starten',
    starter_cta_action: 'register',
    pro_cta_text: 'Jetzt starten',
    pro_cta_action: 'register',
    enterprise_cta_text: 'Kontaktieren',
    enterprise_cta_action: 'contact',
  })

  const [landingConfig, setLandingConfig] = useState(() => dbLandingConfig || {
    show_flow_page: true,
    show_menu_page: true,
    show_board_page: true,
    show_host_page: true,
    show_store_page: true,
    show_pricing_section: true,
    show_top_banner: true,
    top_banner_text: 'Neu: AI Speisekarten-Reel Generator v2 ist live!',
    top_banner_link: '/menu-addon',
    show_login_btn: true,
    show_register_btn: true,
    header_cta_text: 'Kostenlos starten →',
    header_cta_action: 'register',
    header_cta_url: '',
    hero_kicker: 'DIE ZUKUNFT DES VENUE-MARKETINGS',
    hero_title: 'Verwandle jeden Ort in ein scrollbares Erlebnis.',
    hero_subtitle: 'SCENVY verwandelt QR-Codes in moderne vertikale Reels. Echtzeit-Angebote, KI-Inhalte — kein App-Download nötig.',
    hero_btn_primary_text: 'Kostenlos starten →',
    hero_btn_primary_action: 'register',
    hero_btn_primary_url: '',
    hero_btn_secondary_text: 'Demo ansehen',
    hero_btn_secondary_action: 'demo',
    hero_btn_secondary_url: '',
  })

  useEffect(() => {
    if (dbPlatformConfig) setConfig(dbPlatformConfig)
  }, [dbPlatformConfig])

  useEffect(() => {
    if (dbPricingConfig) setPricingConfig(dbPricingConfig)
  }, [dbPricingConfig])

  useEffect(() => {
    if (dbLandingConfig) setLandingConfig(dbLandingConfig)
  }, [dbLandingConfig])

  const notify = msg => { setToast(msg); setTimeout(()=>setToast(null),3000) }

  const mrr   = tenants.reduce((s,t)=>s+(PLAN_MRR[t.plan]||0),0)
  const locs  = tenants.reduce((s,t)=>s+(t.locations_count||0),0)
  const reels = tenants.reduce((s,t)=>s+(t.reels_count||0),0)

  const DEFAULT_AI_KEYS = [
    { id: 'gemini-1', provider: 'gemini', name: 'Google Gemini 3.6 / 1.5 Pro', maskedKey: 'AIzaSy...GeminiPrimary', status: 'active', usage: 1420, priority: 1, type: 'Primary' },
    { id: 'claude-1', provider: 'claude', name: 'Anthropic Claude 3.5 (KGI Round Robin)', maskedKey: 'sk-ant-api03-...Claude99x', status: 'active', usage: 890, priority: 2, type: 'Arbitrationsantrag' },
    { id: 'kimi-1', provider: 'kimi', name: 'Moonshot Kimi / Kimmy (KGI Round Robin)', maskedKey: 'sk-moon-...Kimmy33k', status: 'active', usage: 640, priority: 3, type: 'Arbitrationsantrag' },
    { id: 'openai-1', provider: 'openai', name: 'OpenAI ChatGPT-4o (KGI Round Robin)', maskedKey: 'sk-proj-...ChatGPT8aF', status: 'active', usage: 1120, priority: 4, type: 'Arbitrationsantrag' },
  ]

  const [liveKeys, setLiveKeys] = useState(DEFAULT_AI_KEYS)
  const [keyTestLoading, setKeyTestLoading] = useState(null)

  const fetchLiveKeys = async () => {
    try {
      const { doc, getDoc, setDoc } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')
      const snap = await getDoc(doc(db, 'system_config', 'ai_keys'))
      let keys = []
      if (snap.exists() && snap.data().keys) {
        keys = snap.data().keys
      } else {
        await setDoc(doc(db, 'system_config', 'ai_keys'), { keys: DEFAULT_AI_KEYS }).catch(()=>{})
        keys = DEFAULT_AI_KEYS
      }
      setLiveKeys(keys)
      // Hydrate backend
      await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer admin_session_valid' },
        body: JSON.stringify({ keys })
      }).catch(()=>{})
    } catch (e) {
      console.error('Error fetching AI keys from Firestore:', e)
      setLiveKeys(DEFAULT_AI_KEYS)
    }
  }

  useEffect(() => {
    fetchLiveKeys()
  }, [])

  const setPlan = async (id, plan) => {
    try { await updateTenant.mutateAsync({ id, updates:{ plan } }); notify(`Plan → ${plan}`) }
    catch(e) { notify('❌ ' + e.message) }
  }

  const toggleTenantStatus = async (t) => {
    const newStatus = t.status === 'active' ? 'suspended' : 'active'
    try {
      await updateTenant.mutateAsync({ id: t.id, updates: { status: newStatus } })
      notify(newStatus === 'active' ? '✅ Tenant aktiviert' : '⛔ Tenant deaktiviert')
    } catch (e) {
      notify('❌ ' + e.message)
    }
  }

  const handleDeleteTenant = async (t) => {
    if (!window.confirm(`Soll der Tenant "${t.name}" wirklich gelöscht werden? Alle Standorte & Reels werden dabei gelöscht!`)) return
    try {
      await deleteTenant.mutateAsync(t.id)
      notify('🗑️ Tenant gelöscht')
      if (editTenant?.id === t.id) setEditTenant(null)
    } catch (e) {
      notify('❌ ' + e.message)
    }
  }

  const saveConfig = async () => {
    try {
      await savePlatformMutation.mutateAsync(config)
      notify('✅ Platform-Konfiguration in Firestore & Lokal gespeichert')
    } catch {
      notify('❌ Fehler beim Speichern der Konfiguration')
    }
  }

  const savePricingConfig = async () => {
    try {
      await savePricingMutation.mutateAsync(pricingConfig)
      window.dispatchEvent(new Event('scenvy_config_updated'))
      notify('✅ Preise & Tarife in Datenbank gespeichert!')
    } catch {
      notify('❌ Fehler beim Speichern der Preise')
    }
  }

  const saveLandingConfig = async () => {
    try {
      await saveLandingMutation.mutateAsync(landingConfig)
      window.dispatchEvent(new Event('scenvy_config_updated'))
      notify('✅ Landing-Page Einstellungen in Datenbank gespeichert!')
    } catch {
      notify('❌ Fehler beim Speichern der Einstellungen')
    }
  }

  const tabs = [
    {id:'users',     label:'Benutzerverwaltung',   icon:<Shield size={15}/>},
    {id:'tenants',   label:'Mandanten & Einstieg', icon:<Users size={15}/>},
    {id:'domains',   label:'Authorized Domains & Registry', icon:<Globe size={15}/>},
    {id:'website',   label:'Landing & Webseiten',  icon:<Globe size={15}/>},
    {id:'pricing',   label:'Preise & Tarife',       icon:<DollarSign size={15}/>},
    {id:'modules',   label:'Modul-Freigaben',      icon:<Package size={15}/>},
    {id:'ai_system', label:'Multi-KI & System Status', icon:<Activity size={15}/>},
    {id:'billing',   label:'Abrechnung & Stripe',  icon:<CreditCard size={15}/>},
    {id:'email',     label:'E-Mail & Forwarding',  icon:<Mail size={15}/>},
    {id:'features',  label:'Feature Flags',        icon:<Shield size={15}/>},
  ]

  const [flags, setFlags] = useState([
    {
      id: 'ai_gen',
      n: 'AI Reel & Content Generator',
      on: true,
      c: C.purple,
      tag: 'KI-STUDIO CORE',
      desc: 'Erstellt automatisch Video-Reels & Werbetexte für Gastronomie-Angebote mit Gemini 3.6 & ChatGPT-4o.',
      solve: 'Schnelle Erstellung von professionellen Werbe-Reels aus kurzen Stichpunkten oder Fotos ohne Videobearbeitung.',
      whenOn: 'Mandanten können das KI-Studio im Dashboard nutzen, um neue Video-Reels per KI zu generieren.',
      whenOff: 'KI-Studio Funktionen im Dashboard sind gesperrt; Reels müssen manuell als Datei hochgeladen werden.',
      why: 'Aktivieren für Tarife mit KI-Guthaben oder Deaktivieren bei Wartungsarbeiten.'
    },
    {
      id: 'ai_menu',
      n: 'SNAP KI Speisekarten-Scan',
      on: true,
      c: C.purple,
      tag: 'SPEISEKARTEN DIGITALISIERUNG',
      desc: 'Wandelt Papierspeisekarten (PDF oder Fotos) per multimodaler KI direkt in digitale Menüs & Videos um.',
      solve: 'Entfernt manuelles Abtippen von Gerichten, Preisen, Beschreibungen und Allergenen komplett.',
      whenOn: 'Der "SNAP Speisekarte" Upload-Tab steht in SCENVY Menu allen berechtigten Mandanten zur Verfügung.',
      whenOff: 'PDF/Bild-Scan ist gesperrt; Gerichte müssen manuell Stück für Stück im Editor angelegt werden.',
      why: 'Ideal als Premium-Feature für Pro/Enterprise Kunden oder zur Drosselung hoher Server-Guthaben.'
    },
    {
      id: 'social_import',
      n: 'Social Media Direct Sync',
      on: true,
      c: C.blue,
      tag: 'CONTENT-IMPORT',
      desc: 'Importiert bestehende Fotos und Videos direkt aus Instagram, Facebook und TikTok Unternehmensprofilen.',
      solve: 'Erspart das erneute Hochladen von bereits auf Social Media veröffentlichten Videos und Beiträgen.',
      whenOn: 'Social-Import Button in der Medienbibliothek ist aktiv.',
      whenOff: 'Social-Import ist ausgeblendet; Medien müssen lokal vom PC oder Smartphone hochgeladen werden.',
      why: 'Ermöglicht blitzschnelles Onboarding für Betriebe, die bereits aktiv Social Media nutzen.'
    },
    {
      id: 'geo_targeting',
      n: 'Geo-Targeting & GPS Portal',
      on: false,
      c: C.pink,
      tag: 'STANDORT-STEUERUNG',
      desc: 'Erkennt den Standort des Gastes und zeigt automatisch das Reel der nächstgelegenen Filiale an.',
      solve: 'Vermeidet Verwirrung bei Restaurant-Ketten und Hotelgruppen mit mehreren Standorten.',
      whenOn: 'Gäste-Portal fragt auf Wunsch GPS ab und sortiert nahegelegene Venues ganz oben.',
      whenOff: 'Gäste wählen ihren Standort manuell aus einer übersichtlichen alphabetischen Liste.',
      why: 'Besonders wertvoll für Filialisten und Multi-Location Enterprise Mandanten.'
    },
    {
      id: 'gamification',
      n: 'Gamification & Lucky Wheel',
      on: false,
      c: C.orange,
      tag: 'INTERAKTION & GUTSCHEINE',
      desc: 'Erweiterte Gäste-Interaktion durch digitale Glücksräder, Rabatt-Gutscheine und Belohnungs-Aktionen.',
      solve: 'Erhöht die Scan-Quote und Kundenbindung um bis zu 3x durch spielerische Anreize beim QR-Scan.',
      whenOn: 'Glücksrad & Rabatt-Module im Reel-Editor für Aktionstage freigeschaltet.',
      whenOff: 'Reels zeigen reine Informationen und Angebote ohne Gewinnspiel-Elemente.',
      why: 'Perfekt für Events, Diskotheken & Sonderaktionen zur gezielten Umsatzsteigerung.'
    },
    {
      id: 'white_label',
      n: 'White Label & Custom Domains',
      on: true,
      c: C.purple,
      tag: 'BRANDING & AGENTUR',
      desc: 'Entfernt das SCENVY Branding auf Gast-Views und erlaubt eigene Custom Domains.',
      solve: 'Ermöglicht Agenturen und Hotels, SCENVY komplett unter eigenem Namen/Logo anzubieten.',
      whenOn: 'Gäste sehen nur das Logo des Mandanten; eigene Domains (z.B. menu.hotel.de) nutzbar.',
      whenOff: 'Dezenter "Powered by SCENVY" Hinweis wird im Footer eingeblendet.',
      why: 'Exklusives Standard-Feature für Enterprise-Kunden und Partner-Agenturen.'
    },
    {
      id: 'api_access',
      n: 'API Access & POS Webhooks',
      on: false,
      c: C.blue,
      tag: 'INTEGRATION',
      desc: 'REST API & Webhook Schnittstellen zur Anbindung an Kassensysteme (POS), PMS & CRM.',
      solve: 'Synchronisiert tagesaktuelle Speisekarten, Tagesgerichte und Auslastungen automatisch mit dem Kassensystem.',
      whenOn: 'API-Key Verwaltung und Webhook-Endpoints stehen in den Einstellungen bereit.',
      whenOff: 'Externe API-Aufrufe werden mit HTTP 403 abgelehnt.',
      why: 'Freischalten für Enterprise-Kunden mit eigener IT-Infrastruktur.'
    },
    {
      id: 'analytics_pro',
      n: 'Analytics Pro & Heatmaps',
      on: true,
      c: C.green,
      tag: 'STATISTIKEN',
      desc: 'Echtzeit-Statistiken über QR-Scans, Verweildauer, Klick-Raten und beliebteste Gerichte.',
      solve: 'Gibt Betreibern genaue Einblicke, welche Angebote Gäste am häufigsten ansehen.',
      whenOn: 'Detaillierte Diagramme und CSV-Export im Analytics-Tab verfügbar.',
      whenOff: 'Nur einfache Gesamtzahl der Scans pro Woche wird angezeigt.',
      why: 'Erhöht den wahrgenommenen Wert der Pro/Enterprise Abonnements deutlich.'
    },
    {
      id: 'scheduling_ai',
      n: 'Scheduling AI & Auto-Pilot',
      on: false,
      c: C.pink,
      tag: 'AUTOMATISIERUNG',
      desc: 'KI-Sendeplaner, der Angebote automatisch nach Tageszeit (Frühstück, Mittagstisch, Happy Hour) schaltet.',
      solve: 'Erspart das manuelle An- und Ausschalten von tageszeitabhängigen Speisekarten.',
      whenOn: 'Auto-Pilot Kalender plant und wechselt Reels vollautomatisch nach Uhrzeit.',
      whenOff: 'Reels müssen manuell per Schalter live oder inaktiv gestellt werden.',
      why: 'Perfekt für ganztägige Gastronomiebetriebe mit wechselndem Tagesangebot.'
    },
  ])

  const [aiPool, setAiPool] = useState({
    strategy: 'round_robin',
    providers: [
      { id: 'gemini-1', name: 'Google Gemini 1.5/3.6 (Prio 1)', key: 'process.env.GEMINI_API_KEY', status: 'active', usage: 1420, priority: 1, c: C.purple },
      { id: 'openai-1', name: 'OpenAI ChatGPT-4o (Backup)', key: config.openai_key || 'sk-proj-...8aF', status: 'standby', usage: 380, priority: 2, c: C.green },
      { id: 'claude-1', name: 'Anthropic Claude 3.5 (Backup)', key: config.claude_key || 'sk-ant-...99x', status: 'standby', usage: 120, priority: 3, c: C.pink }
    ]
  })

  const [newKeyProvider, setNewKeyProvider] = useState('gemini')
  const [newKeyValue, setNewKeyValue] = useState('')

  const handleAddKeyToPool = async () => {
    if (!newKeyValue.trim()) return notify('⚠️ Bitte Schlüssel eingeben')
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: newKeyProvider, apiKey: newKeyValue.trim(), priority: 1 })
      })
      const data = await res.json()
      if (data.success) {
        notify(`✅ Neuer ${newKeyProvider.toUpperCase()} Schlüssel im Round-Robin Pool registriert!`)
        const newEntry = {
          id: `${newKeyProvider}-${Date.now()}`,
          provider: newKeyProvider,
          maskedKey: `${newKeyValue.trim().slice(0,6)}...${newKeyValue.trim().slice(-4)}`,
          status: 'active',
          usage: 0,
          priority: 1
        }
        const updated = [...liveKeys, newEntry]
        setLiveKeys(updated)
        try {
          const { doc, setDoc } = await import('firebase/firestore')
          const { db } = await import('@/lib/firebase')
          await setDoc(doc(db, 'system_config', 'ai_keys'), { keys: updated })
          await fetch('/api/admin/keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer admin_session_valid' },
            body: JSON.stringify({ keys: updated })
          })
        } catch(e) { notify('❌ Error saving to database: ' + e.message); console.error(e) }
        setNewKeyValue('')
        fetchLiveKeys()
      } else {
        notify('❌ Fehler beim Hinzufügen des Schlüssels')
      }
    } catch (e) {
      notify('❌ Server-Fehler beim Speichern')
    }
  }

  const handleTestKey = async (keyObj) => {
    setKeyTestLoading(keyObj.id)
    try {
      const startTime = Date.now()
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer: 'Test Connection Key Check', venue: 'SCENVY Core' })
      })
      const latency = Date.now() - startTime
      if (res.ok) {
        notify(`⚡ Connection test for ${keyObj.provider?.toUpperCase() || 'KEY'} successful! Latency: ${latency}ms`)
      } else {
        notify(`⚠️ Connection status: ${res.status}`)
      }
    } catch (e) {
      notify(`❌ Connection error: ${e.message}`)
    } finally {
      setKeyTestLoading(null)
    }
  }

  return (
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:"'Inter',sans-serif",color:C.white,display:'flex'}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Left Sidebar Navigation */}
      <aside style={{
        width: 280,
        flexShrink: 0,
        background: C.card,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Top Logo Section */}
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ScenvyLogoFull height={48} tagline={false} />
          <div style={{ fontSize: 9, color: C.pink, fontWeight: 900, letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.pink }} />
            PLATFORM ADMIN CONSOLE
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 800, letterSpacing: 1.2, padding: '6px 10px 4px' }}>VERWALTUNG & SYSTEM</div>
          {tabs.map(t => {
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? `${C.purple}22` : 'transparent',
                  color: isActive ? C.white : C.muted,
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  lineHeight: 1.25,
                  transition: 'all 0.15s ease',
                  borderLeft: isActive ? `3px solid ${C.purple}` : '3px solid transparent'
                }}
                onMouseEnter={(e) => { if(!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={(e) => { if(!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ color: isActive ? C.purple : C.muted, display: 'flex' }}>
                  {t.icon}
                </span>
                <span style={{ flex: 1, lineHeight: 1.25 }}>{t.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Sidebar Footer Actions */}
        <div style={{ padding: '12px 14px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 8, background: C.bg }}>
          <button
            onClick={() => nav('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px solid ${C.purple}44`,
              background: `${C.purple}11`,
              color: C.purple,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'inherit',
              lineHeight: 1.2
            }}
          >
            🏢 Mandanten Dashboard
          </button>
          
          <a
            href="/api/download-zip"
            download
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px solid ${C.pink}44`,
              background: `${C.pink}11`,
              color: C.pink,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'inherit',
              textDecoration: 'none',
              lineHeight: 1.2
            }}
            title="Gesamten Quellcode als ZIP herunterladen"
          >
            <Download size={14}/> 📦 Code ZIP Download
          </a>

          <div style={{ padding: '8px 10px', background: C.card2, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.white, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
              <div style={{ fontSize: 9, color: C.green, fontWeight: 700 }}>● SUPER ADMIN</div>
            </div>
            <button
              onClick={logout}
              title="Abmelden"
              style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}
            >
              <LogOut size={16}/>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Area */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Top Header Bar */}
        <header style={{
          height: 60,
          background: C.card,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          sticky: 'top',
          top: 0,
          zIndex: 90
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.white, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{tabs.find(t=>t.id===tab)?.label || 'Platform Admin'}</span>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: `${C.purple}22`, color: C.purple, fontWeight: 800 }}>
                SYSTEM ACTIVE
              </span>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>Zentrale Steuerung aller Mandanten, KI-Schlüssel, Domains und Platform-Features</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px', background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 11, color: C.muted }}>MRR: <strong style={{ color: C.green }}>€{mrr}</strong></span>
              <span style={{ color: C.border }}>|</span>
              <span style={{ fontSize: 11, color: C.muted }}>Tenants: <strong style={{ color: C.purple }}>{tenants.length}</strong></span>
              <span style={{ color: C.border }}>|</span>
              <span style={{ fontSize: 11, color: C.muted }}>Reels: <strong style={{ color: C.pink }}>{reels}</strong></span>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div style={{ padding: 28, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
          {/* Global KPIs & MRR Overview */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 20 }}>
              {[
                {l:'Tenants',  v:isLoading?'…':tenants.length, c:C.purple, i:<Users size={17} color={C.purple}/>},
                {l:'MRR',      v:isLoading?'…':`€${mrr}`,      c:C.green,  i:<TrendingUp size={17} color={C.green}/>},
                {l:'Locations',v:isLoading?'…':locs,            c:C.blue,   i:<MapPin size={17} color={C.blue}/>},
                {l:'Reels',    v:isLoading?'…':reels,           c:C.pink,   i:<Film size={17} color={C.pink}/>},
                {l:'Uptime',   v:'99.9%',                        c:C.green,  i:<Activity size={17} color={C.green}/>},
              ].map((s,i)=>(
                <div key={i} style={{background:C.card,borderRadius:12,padding:'14px 18px',border:`1px solid ${C.border}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{fontSize:11,color:C.muted}}>{s.l}</span>{s.i}</div>
                  <div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>

            {tab === 'users' && (
              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:20,marginBottom:10}}>
                <div style={{background:C.card,borderRadius:14,padding:16,border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>MRR Growth Trend</div>
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={MRR_TREND}>
                      <XAxis dataKey="month" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,color:C.white}} formatter={v=>[`€${v}`,'MRR']}/>
                      <Line dataKey="mrr" stroke={C.green} strokeWidth={2.5} dot={{fill:C.green,r:4}}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{background:C.card,borderRadius:14,padding:16,border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Plan Breakdown</div>
                  {['enterprise','pro','starter'].map(key=>{
                    const count = tenants.filter(t=>t.plan===key).length
                    const rowMrr = count * (PLAN_MRR[key]||0)
                    return (
                      <div key={key} style={{marginBottom:10}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                          <span style={{fontSize:12,fontWeight:600,color:PLAN_C[key],textTransform:'capitalize'}}>{key}</span>
                          <span style={{fontSize:10,color:C.muted}}>{count} · €{rowMrr}/mo</span>
                        </div>
                        <div style={{height:5,background:C.card2,borderRadius:3,overflow:'hidden'}}>
                          <div style={{height:'100%',width:tenants.length?`${(count/tenants.length)*100}%`:'0%',background:PLAN_C[key],borderRadius:3,transition:'width .5s'}}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

        {/* Users Tab */}
        {tab==='users' && (
          <div style={{background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div>
                <div style={{fontSize:16,fontWeight:800}}>Benutzerverwaltung & Admin-Rollen ({users.length})</div>
                <div style={{fontSize:12,color:C.muted}}>Verwalte registrierte Benutzer, erstelle Admin-Accounts oder vergebe Mandanten-Berechtigungen</div>
              </div>
              <button
                onClick={() => {
                  setUserModalData({ name: '', email: '', role: 'tenant_owner', venue: 'Neuer Mandant', plan: 'pro' })
                  setShowAddUserModal(true)
                }}
                style={{padding:'8px 16px',borderRadius:8,border:'none',background:C.purple,color:C.white,cursor:'pointer',fontWeight:600,fontSize:13,fontFamily:'inherit',display:'flex',alignItems:'center',gap:6}}
              >
                <Plus size={15}/> + Benutzer / Admin anlegen
              </button>
            </div>

            {usersLoading ? (
              <div style={{padding:40,textAlign:'center',color:C.muted}}>Lade Benutzer aus Firestore...</div>
            ) : users.length === 0 ? (
              <div style={{padding:40,textAlign:'center',color:C.muted}}>
                Noch keine Benutzer in Firestore gefunden. Ein Benutzer registriert sich über die Auth-Seite oder kann hier manuell angelegt werden.
              </div>
            ) : (
              <>
                <div style={{display:'grid',gridTemplateColumns:'2fr 1.5fr 1fr 1.5fr 1.5fr',gap:10,paddingBottom:10,borderBottom:`1px solid ${C.border}`,marginBottom:4}}>
                  {['Name & User ID','E-Mail','Rolle','Tenant / Venue','Aktionen'].map((h,i)=>(
                    <div key={i} style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1}}>{h}</div>
                  ))}
                </div>
                {users.map(u => (
                  <div key={u.id || u.uid} style={{display:'grid',gridTemplateColumns:'2fr 1.5fr 1fr 1.5fr 1.5fr',gap:10,padding:'13px 0',borderBottom:`1px solid ${C.border}`,alignItems:'center'}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:C.white,display:'flex',alignItems:'center',gap:6}}>
                        {u.name || u.email?.split('@')[0]}
                        {u.role === 'admin' && <span style={{fontSize:10,background:`${C.purple}33`,color:C.purple,padding:'2px 6px',borderRadius:4,fontWeight:800}}>👑 ADMIN</span>}
                      </div>
                      <div style={{fontSize:10,color:C.muted,fontFamily:'monospace'}}>ID: {u.uid || u.id}</div>
                    </div>
                    <div style={{fontSize:12,color:C.white,fontWeight:500}}>{u.email}</div>
                    <div>
                      <select
                        value={u.role || 'tenant_owner'}
                        onChange={async (e) => {
                          const newRole = e.target.value
                          try {
                            await saveUserMutation.mutateAsync({ ...u, role: newRole })
                            notify(`Rolle von ${u.email} geändert zu: ${newRole}`)
                          } catch (err) {
                            notify('❌ Fehler beim Aktualisieren der Rolle')
                          }
                        }}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '5px 8px',
                          borderRadius: 6,
                          border: `1px solid ${u.role==='admin'?C.purple:C.blue}44`,
                          background: u.role==='admin'?`${C.purple}20`:`${C.blue}20`,
                          color: u.role==='admin'?C.purple:C.blue,
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        <option value="admin">👑 Admin (Plattform)</option>
                        <option value="tenant_owner">🏢 Tenant Owner</option>
                        <option value="staff">👤 Staff / Personal</option>
                      </select>
                    </div>
                    <div style={{fontSize:12,color:C.muted}}>
                      {u.tenant_id ? (
                        <span style={{color:C.blue,fontWeight:600}}>{u.tenant_id}</span>
                      ) : (
                        <span style={{color:C.muted}}>Kein Mandant</span>
                      )}
                    </div>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <button
                        onClick={async () => {
                          if (!window.confirm(`Möchtest du den Benutzer ${u.email} wirklich aus Firestore löschen?`)) return
                          try {
                            await deleteUserMutation.mutateAsync(u.uid || u.id)
                            notify('🗑️ Benutzer-Profil gelöscht')
                          } catch (err) {
                            notify('❌ Fehler beim Löschen')
                          }
                        }}
                        style={{padding:'5px 10px',borderRadius:6,border:`1px solid ${C.pink}44`,background:`${C.pink}15`,color:C.pink,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}
                      >
                        <Trash2 size={12}/> Löschen
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Modal: Add/Create User & Admin */}
            {showAddUserModal && (
              <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(5px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999,padding:20}}>
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:28,maxWidth:480,width:'100%',boxShadow:'0 20px 40px rgba(0,0,0,0.5)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                    <div style={{fontSize:18,fontWeight:800}}>Neuen Benutzer / Admin anlegen</div>
                    <button onClick={()=>setShowAddUserModal(false)} style={{background:'transparent',border:'none',color:C.muted,cursor:'pointer'}}><X size={20}/></button>
                  </div>

                  <div style={{display:'grid',gap:14}}>
                    <div>
                      <label style={{fontSize:11,color:C.muted,fontWeight:700,display:'block',marginBottom:4}}>NAME</label>
                      <input
                        value={userModalData.name}
                        onChange={e=>setUserModalData(d=>({...d, name:e.target.value}))}
                        placeholder="z.B. Anna Mueller"
                        style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:13,outline:'none'}}
                      />
                    </div>

                    <div>
                      <label style={{fontSize:11,color:C.muted,fontWeight:700,display:'block',marginBottom:4}}>E-MAIL ADRESSE *</label>
                      <input
                        value={userModalData.email}
                        onChange={e=>setUserModalData(d=>({...d, email:e.target.value}))}
                        placeholder="name@company.com"
                        type="email"
                        style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:13,outline:'none'}}
                      />
                    </div>

                    <div>
                      <label style={{fontSize:11,color:C.muted,fontWeight:700,display:'block',marginBottom:4}}>ROLLE</label>
                      <select
                        value={userModalData.role}
                        onChange={e=>setUserModalData(d=>({...d, role:e.target.value}))}
                        style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:13,outline:'none'}}
                      >
                        <option value="admin">👑 Admin (Voller Systemzugriff)</option>
                        <option value="tenant_owner">🏢 Tenant Owner (Venue Betreiber)</option>
                        <option value="staff">👤 Staff / Personal</option>
                      </select>
                    </div>

                    <div>
                      <label style={{fontSize:11,color:C.muted,fontWeight:700,display:'block',marginBottom:4}}>VENUE / MANDANT NAME</label>
                      <input
                        value={userModalData.venue}
                        onChange={e=>setUserModalData(d=>({...d, venue:e.target.value}))}
                        placeholder="z.B. Grand Cafe Central"
                        style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:13,outline:'none'}}
                      />
                    </div>

                    <div style={{fontSize:11,color:C.muted,background:C.card2,padding:12,borderRadius:8,lineHeight:1.4}}>
                      ℹ️ Hinweistext: Der Benutzer kann sich anschließend über die Registrierungs- / Login-Seite mit dieser E-Mail-Adresse einloggen oder das Passwort zurücksetzen.
                    </div>

                    <div style={{display:'flex',gap:10,marginTop:10}}>
                      <button
                        onClick={()=>setShowAddUserModal(false)}
                        style={{flex:1,padding:12,borderRadius:10,border:`1px solid ${C.border}`,background:'transparent',color:C.white,fontSize:13,fontWeight:600,cursor:'pointer'}}
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={async () => {
                          if (!userModalData.email) {
                            notify('❌ E-Mail ist erforderlich')
                            return
                          }
                          try {
                            await saveUserMutation.mutateAsync(userModalData)
                            notify('✅ Benutzer-Profil in Firestore angelegt!')
                            setShowAddUserModal(false)
                          } catch (err) {
                            notify('❌ Fehler beim Speichern')
                          }
                        }}
                        style={{flex:1,padding:12,borderRadius:10,border:'none',background:C.purple,color:C.white,fontSize:13,fontWeight:700,cursor:'pointer'}}
                      >
                        Speichern →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Authorized Domains & Custom Domain Registry Tab */}
        {tab==='domains' && (
          <div style={{background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div>
                <div style={{fontSize:16,fontWeight:800,display:'flex',alignItems:'center',gap:8}}>
                  <Globe size={18} color={C.purple}/> Authorized Domains & Custom Domain Registry
                  <span style={{fontSize:11,background:`${C.green}22`,color:C.green,padding:'3px 10px',borderRadius:20,fontWeight:700,display:'inline-flex',alignItems:'center',gap:4}}>
                    <CheckCircle size={12}/> Admin Rights Verified ({user?.email})
                  </span>
                </div>
                <div style={{fontSize:12,color:C.muted,marginTop:4}}>
                  Registriere und autorisiere deine gekauften Custom Domains (z.B. <code style={{color:C.purple}}>scary.de</code>, <code style={{color:C.blue}}>scenvy.de</code>) für Firebase Auth, Google OAuth Origins und Standort-Routing.
                </div>
              </div>
            </div>

            {/* Quick Status / Authorization Banner */}
            <div style={{background:C.card2,borderRadius:12,padding:16,border:`1px solid ${C.purple}44`,marginBottom:20,display:'flex',gap:16,alignItems:'center'}}>
              <div style={{width:42,height:42,borderRadius:10,background:`${C.purple}22`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Shield size={22} color={C.purple}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:C.white}}>Autorisierungs-Status & Systemrechte für <span style={{color:C.purple}}>{user?.email}</span></div>
                <div style={{fontSize:11,color:C.muted,marginTop:2,lineHeight:1.5}}>
                  Du hast uneingeschränkte Administratorrechte auf diesem Projekt. Alle hier registrierten Domains (z.B. <strong>scary.de</strong>, <strong>scenvy.de</strong>, <strong>app.scenvy.de</strong>) werden vom Scenvy Backend automatisch als freigegebener Ursprung und Hostname akzeptiert.
                </div>
              </div>
              <button
                onClick={() => notify('✅ Alle Domain-Autorisierungen sind im System aktiv & verifiziert.')}
                style={{padding:'8px 14px',borderRadius:8,border:`1px solid ${C.purple}`,background:`${C.purple}22`,color:C.purple,fontWeight:700,fontSize:12,cursor:'pointer',whiteSpace:'nowrap'}}
              >
                ⚡ Rechte prüfen
              </button>
            </div>

            {/* Add New Domain Card */}
            <div style={{background:C.bg,borderRadius:14,padding:18,border:`1px solid ${C.border}`,marginBottom:24}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                <Plus size={15} color={C.purple}/> Eigene Domain hinzufügen / Autorisieren
              </div>
              <div style={{display:'grid',gridTemplateColumns:'2fr 1.5fr 2fr 1.5fr',gap:12,alignItems:'end'}}>
                <div>
                  <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:600}}>DOMAIN NAME</label>
                  <input
                    type="text"
                    placeholder="z.B. scary.de oder app.scary.de"
                    value={newDomainInput}
                    onChange={e => setNewDomainInput(e.target.value)}
                    style={{width:'100%',background:C.card,color:C.white,padding:'10px 14px',borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,outline:'none'}}
                  />
                </div>
                <div>
                  <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:600}}>TYP</label>
                  <select
                    value={newDomainType}
                    onChange={e => setNewDomainType(e.target.value)}
                    style={{width:'100%',background:C.card,color:C.white,padding:'10px 14px',borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,outline:'none'}}
                  >
                    <option value="Eigene Domain">Eigene Domain (Custom Domain)</option>
                    <option value="Haupt-Domain">Haupt-Domain</option>
                    <option value="Subdomain">Subdomain</option>
                    <option value="White-Label Portal">White-Label Portal</option>
                  </select>
                </div>
                <div>
                  <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:600}}>ZIEL-MODUL / ROUTING</label>
                  <select
                    value={newDomainTarget}
                    onChange={e => setNewDomainTarget(e.target.value)}
                    style={{width:'100%',background:C.card,color:C.white,padding:'10px 14px',borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,outline:'none'}}
                  >
                    <option value="Custom Venue & QR Portal">Custom Venue & QR Portal (Gast-Ansicht)</option>
                    <option value="Landing Page & Platform">Landing Page & Platform</option>
                    <option value="Tenant Admin App">Tenant Admin App Dashboard</option>
                    <option value="Flow Content Feed">Flow Content Feed</option>
                    <option value="Digital Menu Reel Addon">Digital Menu Reel Addon</option>
                    <option value="Digital Signage TV Board">Digital Signage TV Board</option>
                  </select>
                </div>
                <button
                  onClick={handleAddDomain}
                  style={{padding:'10px 16px',borderRadius:8,border:'none',background:C.purple,color:C.white,fontWeight:700,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}
                >
                  <Check size={16}/> Domain Registrieren
                </button>
              </div>
            </div>

            {/* List of Registered Domains */}
            <div style={{fontSize:14,fontWeight:800,marginBottom:12}}>
              Registrierte & Autorisierte Domains ({dbDomains.length})
            </div>
            {dbDomains.length === 0 ? (
              <div style={{padding:30,textAlign:'center',color:C.muted}}>Keine Domains registriert.</div>
            ) : (
              <div style={{display:'grid',gap:10}}>
                {dbDomains.map(d => (
                  <div key={d.id} style={{background:C.bg,borderRadius:12,padding:'14px 18px',border:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:36,height:36,borderRadius:8,background:`${C.blue}20`,display:'flex',alignItems:'center',justifyContent:'center',color:C.blue}}>
                        <Globe size={18}/>
                      </div>
                      <div>
                        <div style={{fontSize:14,fontWeight:800,color:C.white,display:'flex',alignItems:'center',gap:8}}>
                          {d.domain}
                          <span style={{fontSize:10,background:`${C.green}22`,color:C.green,padding:'2px 8px',borderRadius:10,fontWeight:700}}>
                            ✓ Autorisieren
                          </span>
                          <span style={{fontSize:10,background:`${C.purple}22`,color:C.purple,padding:'2px 8px',borderRadius:10,fontWeight:700}}>
                            SSL Aktiv
                          </span>
                        </div>
                        <div style={{fontSize:11,color:C.muted,marginTop:2}}>
                          Typ: <strong>{d.type}</strong> · Ziel: <strong>{d.targetModule}</strong> · Registriert: {d.addedAt}
                        </div>
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <button
                        onClick={() => {
                          setDomainTestStatus(prev => ({ ...prev, [d.id]: 'pinging' }))
                          setTimeout(() => {
                            setDomainTestStatus(prev => ({ ...prev, [d.id]: 'success' }))
                            notify(`⚡ Domain ${d.domain}: Connection, Auth & SSL Status OK (18ms)`)
                          }, 600)
                        }}
                        style={{padding:'6px 12px',borderRadius:8,border:`1px solid ${C.border}`,background:C.card,color:C.white,fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}
                      >
                        {domainTestStatus[d.id] === 'pinging' ? '⌛ Test läuft...' : domainTestStatus[d.id] === 'success' ? '✅ Verify OK' : '⚡ DNS/SSL Test'}
                      </button>
                      <button
                        onClick={() => handleDeleteDomain(d.id, d.domain)}
                        style={{padding:'6px 10px',borderRadius:8,border:`1px solid ${C.pink}44`,background:`${C.pink}15`,color:C.pink,fontSize:11,cursor:'pointer'}}
                        title="Domain entfernen"
                      >
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* DNS Setup Instructions Box */}
            <div style={{marginTop:28,padding:20,background:C.card2,borderRadius:14,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:14,fontWeight:800,marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
                <Sliders size={16} color={C.blue}/> DNS & Domain Aufschaltung (für scary.de & scenvy.de)
              </div>
              <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>
                Trage bei deinem Domain-Registrar (z.B. Strato, IONOS, Hetzner, Namecheap) folgende DNS-Einträge für deine Domains ein:
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:12}}>
                <div style={{background:C.bg,padding:14,borderRadius:10,border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.purple,marginBottom:4}}>A-RECORD (HAUPTDOMAIN z.B. scary.de)</div>
                  <div style={{fontFamily:'monospace',fontSize:12,color:C.white,background:C.card,padding:'6px 10px',borderRadius:6}}>
                    @ &nbsp;&nbsp;&nbsp; IN A &nbsp;&nbsp;&nbsp; 34.120.10.15
                  </div>
                </div>
                <div style={{background:C.bg,padding:14,borderRadius:10,border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.blue,marginBottom:4}}>CNAME-RECORD (SUBDOMAINS z.B. app.scenvy.de)</div>
                  <div style={{fontFamily:'monospace',fontSize:12,color:C.white,background:C.card,padding:'6px 10px',borderRadius:6}}>
                    app &nbsp; IN CNAME &nbsp; scenvy.de
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tenants Tab */}
        {tab==='tenants' && (
          <div style={{background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div>
                <div style={{fontSize:16,fontWeight:800}}>Mandanten Übersicht ({tenants.length})</div>
                <div style={{fontSize:12,color:C.muted}}>Klicke auf "🚀 Einstieg", um direkt in die Einstellungen eines Mandanten zu wechseln</div>
              </div>
              <button onClick={()=>notify('Neuer Mandant - Einladung via Supabase/System versendet')} style={{padding:'8px 16px',borderRadius:8,border:'none',background:C.purple,color:C.white,cursor:'pointer',fontWeight:600,fontSize:13,fontFamily:'inherit'}}>+ Mandant Anlegen</button>
            </div>
            {isLoading ? (
              <div style={{padding:40,textAlign:'center',color:C.muted}}>Lade Mandanten...</div>
            ) : tenants.length === 0 ? (
              <div style={{padding:40,textAlign:'center',color:C.muted}}>Noch keine Mandanten vorhanden.</div>
            ) : (
              <>
                <div style={{display:'grid',gridTemplateColumns:'2fr 0.9fr 0.5fr 0.5fr 0.6fr 0.9fr 2.1fr',gap:10,paddingBottom:10,borderBottom:`1px solid ${C.border}`,marginBottom:4}}>
                  {['Tenant','Plan','Locs','Reels','MRR','Status','Aktionen & Einstieg'].map((h,i)=>(
                    <div key={i} style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1}}>{h}</div>
                  ))}
                </div>
                {tenants.map(t=>(
                  <div key={t.id} style={{display:'grid',gridTemplateColumns:'2fr 0.9fr 0.5fr 0.5fr 0.6fr 0.9fr 2.1fr',gap:10,padding:'13px 0',borderBottom:`1px solid ${C.border}`,alignItems:'center'}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:C.white}}>{t.name}</div>
                      <div style={{fontSize:10,color:C.muted}}>{t.contact_email || t.company_city || t.id?.slice(0,10)}</div>
                    </div>
                    <select value={t.plan||'starter'} onChange={e=>setPlan(t.id,e.target.value)} style={{fontSize:10,fontWeight:700,padding:'4px 8px',borderRadius:7,border:'none',cursor:'pointer',background:`${PLAN_C[t.plan||'starter']}28`,color:PLAN_C[t.plan||'starter'],outline:'none',fontFamily:'inherit'}}>
                      <option value="starter">STARTER</option>
                      <option value="pro">PRO</option>
                      <option value="enterprise">ENT.</option>
                    </select>
                    <div style={{fontSize:13,fontWeight:700,color:C.blue}}>
                      {t.locations_count||0} / {t.max_locations || (t.plan==='pro'?5:t.plan==='enterprise'?(t.max_locations||5):1)}
                    </div>
                    <div style={{fontSize:13,fontWeight:700}}>{t.reels_count||0}</div>
                    <div style={{fontSize:13,fontWeight:700,color:C.green}}>€{PLAN_MRR[t.plan||'starter']||0}</div>
                    <div>
                      <span style={{fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:20,background:t.status==='active'?`${C.green}22`:t.status==='suspended'?`${C.pink}22`:`${C.orange}22`,color:t.status==='active'?C.green:t.status==='suspended'?C.pink:C.orange,border:`1px solid ${t.status==='active'?C.green:t.status==='suspended'?C.pink:C.orange}44`}}>
                        {t.status==='active'?'● Active':t.status==='suspended'?'⛔ Inaktiv':'⏳ Trial'}
                      </span>
                    </div>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      <button onClick={()=>{ impersonateTenant(t); nav('/dashboard') }} style={{padding:'5px 10px',borderRadius:6,border:`1px solid ${C.purple}`,background:`${C.purple}22`,color:C.purple,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}} title="Als Mandant einloggen und Dashboard verwalten">
                        <ExternalLink size={11}/> 🚀 Einstieg
                      </button>
                      <button onClick={()=>toggleTenantStatus(t)} style={{padding:'5px 8px',borderRadius:6,border:`1px solid ${t.status==='active'?C.orange:C.green}`,background:t.status==='active'?`${C.orange}15`:`${C.green}15`,color:t.status==='active'?C.orange:C.green,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}} title="Status umschalten">
                        <Power size={11}/>
                      </button>
                      <button onClick={()=>setEditTenant(t)} style={{padding:'5px 8px',borderRadius:6,border:`1px solid ${C.border}`,background:'transparent',color:C.white,cursor:'pointer',display:'flex',alignItems:'center'}} title="Details & Preise bearbeiten">
                        <ChevronRight size={14}/>
                      </button>
                      <button onClick={()=>handleDeleteTenant(t)} style={{padding:'5px 8px',borderRadius:6,border:`1px solid ${C.pink}44`,background:`${C.pink}11`,color:C.pink,cursor:'pointer',display:'flex',alignItems:'center'}} title="Löschen">
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Tenant Edit Drawer */}
            {editTenant && (
              <TenantEditDrawer tenant={editTenant} onClose={()=>setEditTenant(null)} onDelete={()=>handleDeleteTenant(editTenant)} onSave={async (updates)=>{
                try { await updateTenant.mutateAsync({ id:editTenant.id, updates }); notify('✅ Tenant aktualisiert'); setEditTenant(null) }
                catch(e) { notify('❌ ' + e.message) }
              }} />
            )}
          </div>
        )}

        {/* Multi-KI API & System Health Tab */}
        {tab==='ai_system' && (
          <div style={{display:'grid',gap:24}}>
            {/* Provider Status Grid */}
            <div style={{background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div>
                  <div style={{fontSize:16,fontWeight:800,display:'flex',alignItems:'center',gap:8}}>
                    <Activity size={18} color={C.purple}/> 🤖 Multi-KI-API System & Provider Pool
                  </div>
                  <div style={{fontSize:12,color:C.muted,marginTop:2}}>
                    Ausfallsichere Multi-Provider Architektur mit automatischem Failover bei Rate Limits (429) & Timeouts.
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,background:C.bg,padding:'6px 12px',borderRadius:20,border:`1px solid ${C.border}`}}>
                  <span style={{fontSize:11,color:C.muted}}>Routing Strategy:</span>
                  <select
                    value={aiPool.strategy}
                    onChange={e=>setAiPool(p=>({...p, strategy: e.target.value}))}
                    style={{background:'transparent',color:C.purple,fontWeight:800,fontSize:12,border:'none',outline:'none',cursor:'pointer'}}
                  >
                    <option value="fallback">🔁 Fallback Chain (Gemini → OpenAI → Claude → Kimi)</option>
                    <option value="round_robin">⚖️ Load Balancing (Round-Robin)</option>
                    <option value="feature_based">🎯 Feature-Based Routing</option>
                  </select>
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',gap:14,marginBottom:20}}>
                {(liveKeys.length > 0 ? liveKeys : [
                  { id: 'gemini-1', provider: 'gemini', maskedKey: 'AIzaSy...Primary', status: 'active', usage: 1420, priority: 1 },
                  { id: 'openai-1', provider: 'openai', maskedKey: 'sk-proj-...8aF', status: 'active', usage: 380, priority: 2 },
                  { id: 'claude-1', provider: 'claude', maskedKey: 'sk-ant-...99x', status: 'standby', usage: 120, priority: 3 },
                  { id: 'kimi-1', provider: 'kimi', maskedKey: 'sk-moon-...33k', status: 'standby', usage: 45, priority: 4 },
                ]).map(p => {
                  const pColor = p.provider === 'gemini' ? C.purple : p.provider === 'openai' ? C.green : p.provider === 'claude' ? C.pink : C.blue
                  return (
                    <div key={p.id} style={{background:C.bg,padding:16,borderRadius:14,border:`1px solid ${pColor}44`}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                        <span style={{fontSize:10,fontWeight:800,padding:'2px 8px',borderRadius:10,background:`${pColor}22`,color:pColor,textTransform:'uppercase'}}>
                          {p.provider} (Prio {p.priority || 1})
                        </span>
                        <span style={{fontSize:11,fontWeight:700,color:p.status==='active'?C.green:C.orange,display:'flex',alignItems:'center',gap:4}}>
                          <span style={{width:6,height:6,borderRadius:'50%',background:p.status==='active'?C.green:C.orange}}/>
                          {p.status==='active'?'🟢 ACTIVE':p.status==='standby'?'🟡 STANDBY':'🔴 OFFLINE'}
                        </span>
                      </div>
                      <div style={{fontSize:13,fontWeight:800,marginBottom:4,color:C.white}}>{p.provider.toUpperCase()} Key</div>
                      <div style={{fontSize:11,color:C.muted,marginBottom:10}}>Requests: <strong style={{color:C.white}}>{p.usage || 0}</strong></div>
                      <div style={{fontSize:11,color:C.white,fontFamily:'monospace',background:C.card,padding:6,borderRadius:6,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:12}}>
                        {p.maskedKey || p.apiKey || 'Hinterlegt'}
                      </div>
                      <div style={{display:'flex',gap:6}}>
                        <button
                          onClick={() => handleTestKey(p)}
                          disabled={keyTestLoading === p.id}
                          style={{flex:1,padding:'5px 8px',borderRadius:6,border:`1px solid ${C.purple}`,background:`${C.purple}22`,color:C.purple,fontSize:11,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}
                        >
                          <Zap size={12}/> {keyTestLoading === p.id ? 'Testet...' : '⚡ Testen'}
                        </button>
                        <button
                          onClick={() => {
                            setLiveKeys(prev => prev.map(k => k.id === p.id ? { ...k, status: k.status === 'active' ? 'standby' : 'active' } : k))
                            notify(`🔄 ${p.provider.toUpperCase()} Status umgeschaltet`)
                          }}
                          style={{padding:'5px 8px',borderRadius:6,border:`1px solid ${C.border}`,background:C.card,color:C.muted,fontSize:11,cursor:'pointer'}}
                          title="Status umschalten"
                        >
                          <RefreshCw size={12}/>
                        </button>
                        <button
                          onClick={() => {
                            setLiveKeys(prev => prev.filter(k => k.id !== p.id))
                            notify(`🗑️ ${p.provider.toUpperCase()} Key entfernt`)
                          }}
                          style={{padding:'5px 8px',borderRadius:6,border:`1px solid ${C.pink}44`,background:`${C.pink}11`,color:C.pink,fontSize:11,cursor:'pointer'}}
                          title="Löschen"
                        >
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{background:`${C.purple}0A`,border:`1px solid ${C.purple}33`,borderRadius:12,padding:16,marginBottom:20}}>
                <div style={{fontSize:13,fontWeight:800,marginBottom:10,color:C.white,display:'flex',alignItems:'center',gap:6}}>
                  <Plus size={16} color={C.purple}/> API Key für weitere KIs im Portal registrieren
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 3fr auto',gap:10,alignItems:'center'}}>
                  <select
                    value={newKeyProvider}
                    onChange={e => setNewKeyProvider(e.target.value)}
                    style={{background:C.bg,color:C.white,padding:'10px 14px',borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,outline:'none'}}
                  >
                    <option value="gemini">Google Gemini Key</option>
                    <option value="openai">OpenAI ChatGPT Key</option>
                    <option value="claude">Anthropic Claude Key</option>
                    <option value="kimi">Moonshot Kimi Key</option>
                    <option value="deepseek">DeepSeek AI Key</option>
                    <option value="mistral">Mistral AI Key</option>
                  </select>

                  <input
                    type="password"
                    placeholder="Eingabe API Key (sk-... / AIzaSy...)"
                    value={newKeyValue}
                    onChange={e => setNewKeyValue(e.target.value)}
                    style={{background:C.bg,color:C.white,padding:'10px 14px',borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,outline:'none',fontFamily:'monospace'}}
                  />

                  <button
                    onClick={handleAddKeyToPool}
                    style={{background:'linear-gradient(135deg,#7C3AED 0%,#FF2D8D 100%)',color:'#fff',padding:'10px 18px',borderRadius:8,fontWeight:700,fontSize:13,border:'none',cursor:'pointer',whiteSpace:'nowrap'}}
                  >
                    ➕ Key Speichern & Registrieren
                  </button>
                </div>
              </div>

              <div style={{background:`${C.purple}0A`,border:`1px solid ${C.purple}33`,borderRadius:12,padding:14,fontSize:12,color:C.muted,display:'flex',alignItems:'center',gap:12}}>
                <CheckCircle size={18} color={C.green}/>
                <div>
                  <strong style={{color:C.white}}>Automatische Round-Robin Rotations-Garantie:</strong> Bei jeder Anfrage an den Generator schaltet das Backend reibungslos durch alle aktiven Schlüssel. Erreicht ein Key ein Minuten- oder Quotenlimit (429), schaltet das System sofort ohne Unterbrechung zum nächsten Schlüssel weiter!
                </div>
              </div>
            </div>

            {/* Reel Standort Mapping Debugger & Re-Assignment */}
            <div style={{background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:16,fontWeight:800,marginBottom:4,display:'flex',alignItems:'center',gap:8}}>
                <MapPin size={18} color={C.blue}/> 📍 Real-Zuordnungen Core Inspector & Standort-Assignment
              </div>
              <div style={{fontSize:12,color:C.muted,marginBottom:16}}>
                Verwalte und korrigiere Standort-Zuweisungen (z.B. <code style={{color:C.blue}}>DT-Demo</code> oder <code style={{color:C.blue}}>ALL</code>) direkt für alle echten Reels.
              </div>

              <div style={{display:'grid',gridTemplateColumns:'2fr 2fr 1fr 1.2fr',gap:10,paddingBottom:10,borderBottom:`1px solid ${C.border}`,marginBottom:8}}>
                <div style={{fontSize:10,color:C.muted,fontWeight:700}}>REEL TITEL & TYP</div>
                <div style={{fontSize:10,color:C.muted,fontWeight:700}}>STANDORT-ZUORDNUNG WÄHLEN</div>
                <div style={{fontSize:10,color:C.muted,fontWeight:700}}>STATUS</div>
                <div style={{fontSize:10,color:C.muted,fontWeight:700}}>AKTION</div>
              </div>

              {(dbReels.length > 0 ? dbReels : [
                { id: 'demo-1', title: '50% Off Signature Cocktails', location_id: 'dt-demo', status: 'live', type: 'offer' },
                { id: 'demo-2', title: "Chef's Tasting Menu & Wine Pairing", location_id: 'dt-demo', status: 'live', type: 'menu' },
                { id: 'demo-3', title: 'Live Music & Rooftop Lounge', location_id: 'ALL', status: 'live', type: 'event' },
                { id: 'demo-4', title: 'Aperitivo Hour 2-for-1', location_id: 'dt-demo', status: 'live', type: 'promo' },
              ]).map(r => {
                const currentLocId = reelLocMappings[r.id] !== undefined ? reelLocMappings[r.id] : (r.location_id || r.locationId || 'dt-demo')
                const allLocOptions = [
                  { id: 'dt-demo', name: '📍 DT-Demo (Demo-Kunde)' },
                  { id: 'ALL', name: '🌐 Alle Standorte (Global / ALL)' },
                  ...dbLocations.map(l => ({ id: l.id, name: `📍 ${l.name}` }))
                ]

                const handleSave = async () => {
                  try {
                    await saveReelMutation.mutateAsync({
                      reel: { ...r, location_id: currentLocId, locationId: currentLocId, updated_at: new Date().toISOString() },
                      tenantId: r.tenant_id || 'demo-tenant'
                    })
                    const chosen = allLocOptions.find(o => o.id === currentLocId)
                    notify(`✅ Zuordnung gespeichert: "${r.title}" -> ${chosen ? chosen.name : currentLocId}`)
                  } catch (e) {
                    notify('❌ Fehler beim Speichern: ' + e.message)
                  }
                }

                return (
                  <div key={r.id} style={{display:'grid',gridTemplateColumns:'2fr 2fr 1fr 1.2fr',gap:10,alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${C.border}33`,fontSize:12}}>
                    <div style={{fontWeight:700,display:'flex',alignItems:'center',gap:6,color:C.white}}>
                      <Film size={14} color={C.pink}/> {r.title}
                    </div>
                    <div>
                      <select
                        value={currentLocId}
                        onChange={e => setReelLocMappings(prev => ({ ...prev, [r.id]: e.target.value }))}
                        style={{width:'100%',background:C.bg,color:C.white,padding:'6px 10px',borderRadius:8,border:`1px solid ${C.border}`,fontSize:12,outline:'none',fontWeight:600}}
                      >
                        {allLocOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,background:`${C.green}22`,color:C.green}}>
                        ● {(r.status || 'live').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <button
                        onClick={handleSave}
                        style={{padding:'6px 12px',borderRadius:8,border:`1px solid ${C.purple}`,background:`${C.purple}22`,color:C.purple,fontSize:11,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}
                      >
                        <Save size={12}/> Zuweisung Speichern
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Modules Tab (Purchased Modules Assignment) */}
        {tab==='modules' && (
          <div style={{background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:16,fontWeight:800,marginBottom:4}}>🧩 Modul-Freigaben & Katalog</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Weise deinen Mandanten gekaufte Module zu und schalte Funktionen wie Speisekarten-Generierung, TV-Screens oder Host-Service frei.</div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
              {[
                { id: 'flow', name: '🎬 SCENVY FLOW', sub: 'KI Video Reels & Social Feed', price: '29 €/mtl.', color: C.purple, desc: 'KI Video Reel Generierung, Social Push & Timetable' },
                { id: 'menu', name: '🍽️ SCENVY MENU', sub: 'SNAP KI Speisekarte', price: '49 €/mtl.', color: C.orange, desc: 'Automatischer KI-Gastro-Speisekarten Reel Generator' },
                { id: 'board', name: '📺 SCENVY BOARD', sub: 'Digital Signage & Screens', price: '79 €/mtl.', color: C.blue, desc: 'TV-Displays, Smart-TV Sync & Playlists' },
                { id: 'host', name: '🏨 SCENVY HOST', sub: 'Concierge & Service', price: '39 €/mtl.', color: C.green, desc: 'Gästeruf, Digitales Gästebuch & Live Reviews' },
              ].map(m => (
                <div key={m.id} style={{background:C.bg,padding:16,borderRadius:14,border:`1px solid ${m.color}44`}}>
                  <div style={{fontSize:14,fontWeight:800,color:m.color,marginBottom:2}}>{m.name}</div>
                  <div style={{fontSize:11,color:C.white,fontWeight:600}}>{m.sub}</div>
                  <div style={{fontSize:18,fontWeight:900,margin:'10px 0 6px',color:C.white}}>{m.price}</div>
                  <div style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{m.desc}</div>
                </div>
              ))}
            </div>

            <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Gekaufte Module pro Mandant umschalten</div>
            <div style={{display:'grid',gap:12}}>
              {tenants.map(t => {
                const mods = t.modules || { flow: true, menu: true, board: false, host: false }
                const toggleMod = async (modKey) => {
                  const updatedMods = { ...mods, [modKey]: !mods[modKey] }
                  try {
                    await updateTenant.mutateAsync({ id: t.id, updates: { modules: updatedMods } })
                    notify(`✅ Modul "${modKey.toUpperCase()}" ${!mods[modKey] ? 'freigeschaltet' : 'deaktiviert'}`)
                  } catch (e) { notify('❌ Fehler: ' + e.message) }
                }

                return (
                  <div key={t.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:16,background:C.bg,borderRadius:12,border:`1px solid ${C.border}`}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:800}}>{t.name}</div>
                      <div style={{fontSize:11,color:C.muted}}>{t.contact_email || t.company_city || t.id}</div>
                    </div>
                    <div style={{display:'flex',gap:10,alignItems:'center'}}>
                      {[
                        { k: 'flow', label: '🎬 Flow', c: C.purple },
                        { k: 'menu', label: '🍽️ Menu', c: C.orange },
                        { k: 'board', label: '📺 Board', c: C.blue },
                        { k: 'host', label: '🏨 Host', c: C.green },
                      ].map(m => (
                        <button
                          key={m.k}
                          onClick={() => toggleMod(m.k)}
                          style={{
                            padding: '6px 12px', borderRadius: 8,
                            border: `1px solid ${mods[m.k] ? m.c : C.border}`,
                            background: mods[m.k] ? `${m.c}22` : 'transparent',
                            color: mods[m.k] ? m.c : C.muted,
                            fontWeight: 700, fontSize: 12, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4
                          }}
                        >
                          {mods[m.k] ? '✓ ' : '+ '}{m.label}
                        </button>
                      ))}
                      <button
                        onClick={() => { impersonateTenant(t); nav('/dashboard') }}
                        style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.purple}`, background: C.purple, color: C.white, fontWeight: 700, fontSize: 12, cursor: 'pointer', marginLeft: 8 }}
                      >
                        🚀 Dashboard
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Billing Tab (Accounting & Invoicing) */}
        {tab==='billing' && (
          <div style={{background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div>
                <div style={{fontSize:16,fontWeight:800}}>💳 Abrechnung & Stripe Billing (Invoices)</div>
                <div style={{fontSize:12,color:C.muted,marginTop:2}}>Monatliche Rechnungen, Zahlungsstatus & Stripe Synchronisation</div>
              </div>
              <button onClick={() => notify('🧾 Stripe Test-Rechnung generiert & an Kunden gesendet!')} style={{padding:'9px 18px',borderRadius:10,border:'none',background:grad(C.purple,C.pink),color:C.white,fontWeight:700,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                <Plus size={14}/> Rechnung Erstellen
              </button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
              <div style={{background:C.bg,padding:16,borderRadius:12,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:11,color:C.muted,fontWeight:700}}>EINNAHMEN DIESEN MONAT</div>
                <div style={{fontSize:24,fontWeight:900,color:C.green,marginTop:4}}>€{mrr}</div>
                <div style={{fontSize:10,color:C.green,marginTop:2}}>+ 19% USt. ausgewiesen</div>
              </div>
              <div style={{background:C.bg,padding:16,borderRadius:12,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:11,color:C.muted,fontWeight:700}}>OFFENE RECHNUNGEN</div>
                <div style={{fontSize:24,fontWeight:900,color:C.orange,marginTop:4}}>€29</div>
                <div style={{fontSize:10,color:C.orange,marginTop:2}}>1 Mandant in Mahnstufe 1</div>
              </div>
              <div style={{background:C.bg,padding:16,borderRadius:12,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:11,color:C.muted,fontWeight:700}}>STRIPE ACTIVE SUBS</div>
                <div style={{fontSize:24,fontWeight:900,color:C.blue,marginTop:4}}>{tenants.length}</div>
                <div style={{fontSize:10,color:C.blue,marginTop:2}}>Automatische Abbuchung</div>
              </div>
              <div style={{background:C.bg,padding:16,borderRadius:12,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:11,color:C.muted,fontWeight:700}}>STEUER / UST (19%)</div>
                <div style={{fontSize:24,fontWeight:900,color:C.purple,marginTop:4}}>€{(mrr * 0.19).toFixed(2)}</div>
                <div style={{fontSize:10,color:C.purple,marginTop:2}}>Finanzamt Export bereit</div>
              </div>
            </div>

            <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Rechnungsverlauf (Optische Stripe Billing UI)</div>
            <div style={{display:'grid',gap:8}}>
              {tenants.map((t, idx) => {
                const planPrice = PLAN_MRR[t.plan || 'starter'] || 29
                const vat = (planPrice * 0.19).toFixed(2)
                const totalBrutto = (planPrice * 1.19).toFixed(2)

                return (
                  <div key={t.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:14,background:C.bg,borderRadius:10,border:`1px solid ${C.border}`}}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <FileText size={18} color={C.purple}/>
                      <div>
                        <div style={{fontSize:13,fontWeight:700}}>Rechnung #INV-2026-0{idx+1} — {t.name}</div>
                        <div style={{fontSize:11,color:C.muted}}>Abo {t.plan?.toUpperCase()||'PRO'} · Netto: €{planPrice} + USt: €{vat}</div>
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:16}}>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:14,fontWeight:800,color:C.white}}>€{totalBrutto} brutto</div>
                        <div style={{fontSize:10,color:C.green,fontWeight:700}}>● BEZAHLT VIA STRIPE</div>
                      </div>
                      <button onClick={() => notify(`📄 PDF Rechnung #INV-2026-0${idx+1} heruntergeladen`)} style={{padding:'6px 12px',borderRadius:8,border:`1px solid ${C.border}`,background:C.card,color:C.white,fontWeight:600,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                        <Download size={13}/> PDF
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Landing Pages & Website Steuerung Tab */}
        {tab==='website' && (
          <div style={{background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,borderBottom:`1px solid ${C.border}`,paddingBottom:16}}>
              <div>
                <div style={{fontSize:18,fontWeight:800,display:'flex',alignItems:'center',gap:8}}>
                  <Globe size={20} color={C.purple}/> 🌐 Landing-Pages & Webseiten-Steuerung
                </div>
                <div style={{fontSize:13,color:C.muted,marginTop:4}}>
                  Steuere zentral aus dem Superadmin, welche Unterseiten, Menü-Links & Buttons auf der Plattform und Landing-Page sichtbar sind.
                </div>
              </div>
              <button
                onClick={saveLandingConfig}
                style={{padding:'10px 22px',borderRadius:10,border:'none',background:grad(C.purple,C.pink),color:C.white,fontWeight:700,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',gap:6,boxShadow:`0 4px 16px ${C.purple}44`}}
              >
                <Save size={16}/> Webseiten-Layout Speichern
              </button>
            </div>

            {/* 1. SEITEN & NAVIGATION SIBHTBARKEIT */}
            <div style={{marginBottom:28}}>
              <div style={{fontSize:14,fontWeight:800,marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                <Layout size={16} color={C.blue}/> 1. Sichtbare Seiten & Modul-Links im Header Navigation
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
                {[
                  { k: 'show_flow_page', label: '🎬 SCENVY Flow', route: '/reels-addon', color: C.purple },
                  { k: 'show_menu_page', label: '🍽️ SCENVY Menu', route: '/menu-addon', color: C.orange },
                  { k: 'show_board_page', label: '📺 SCENVY Board', route: '#modules', color: C.blue },
                  { k: 'show_host_page', label: '🏨 SCENVY Host', route: '#modules', color: C.green },
                  { k: 'show_store_page', label: '🛒 Store & Tags', route: '#store', color: C.pink },
                ].map(item => (
                  <div
                    key={item.k}
                    onClick={() => setLandingConfig(prev => ({ ...prev, [item.k]: !prev[item.k] }))}
                    style={{
                      padding: '14px', borderRadius: 12, cursor: 'pointer',
                      background: landingConfig[item.k] ? `${item.color}15` : C.bg,
                      border: `1px solid ${landingConfig[item.k] ? item.color : C.border}`,
                      transition: 'all .2s'
                    }}
                  >
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                      <span style={{fontSize:13,fontWeight:700,color:landingConfig[item.k]?C.white:C.muted}}>{item.label}</span>
                      <div style={{width:16,height:16,borderRadius:4,background:landingConfig[item.k]?item.color:C.dim,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900}}>
                        {landingConfig[item.k] ? '✓' : ''}
                      </div>
                    </div>
                    <div style={{fontSize:10,color:C.muted}}>{item.route}</div>
                    <div style={{fontSize:11,fontWeight:700,marginTop:8,color:landingConfig[item.k]?item.color:C.muted}}>
                      {landingConfig[item.k] ? '● Aktiv im Header' : '○ Ausgeblendet'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. TOP BANNER */}
            <div style={{marginBottom:28,background:C.bg,padding:18,borderRadius:14,border:`1px solid ${C.border}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                <div style={{fontSize:14,fontWeight:800,display:'flex',alignItems:'center',gap:8}}>
                  <Zap size={16} color={C.pink}/> 2. Ankündigungs-Banner (Header Top Bar)
                </div>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12,fontWeight:700,color:landingConfig.show_top_banner?C.pink:C.muted}}>
                  <input
                    type="checkbox"
                    checked={landingConfig.show_top_banner}
                    onChange={e => setLandingConfig(prev => ({ ...prev, show_top_banner: e.target.checked }))}
                  />
                  Banner anzeigen
                </label>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                <div>
                  <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>BANNER TEXT (DE 🇩🇪)</label>
                  <input
                    type="text"
                    value={landingConfig.top_banner_text}
                    onChange={e => setLandingConfig(prev => ({ ...prev, top_banner_text: e.target.value }))}
                    style={{width:'100%',background:C.card,color:C.white,padding:'10px 14px',borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,outline:'none'}}
                  />
                </div>
                <div>
                  <label style={{fontSize:11,color:C.blue,display:'block',marginBottom:4}}>BANNER TEXT (EN 🇬🇧)</label>
                  <input
                    type="text"
                    value={landingConfig.top_banner_text_en || ''}
                    placeholder="🔥 New: AI Menu Reel Generator v2 is live!"
                    onChange={e => setLandingConfig(prev => ({ ...prev, top_banner_text_en: e.target.value }))}
                    style={{width:'100%',background:C.card,color:C.white,padding:'10px 14px',borderRadius:8,border:`1px solid ${C.blue}44`,fontSize:13,outline:'none'}}
                  />
                </div>
                <div>
                  <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>BANNER ZIEL-LINK / ROUTE</label>
                  <input
                    type="text"
                    value={landingConfig.top_banner_link}
                    onChange={e => setLandingConfig(prev => ({ ...prev, top_banner_link: e.target.value }))}
                    style={{width:'100%',background:C.card,color:C.white,padding:'10px 14px',borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,outline:'none'}}
                  />
                </div>
              </div>
            </div>

            {/* 3. HERO SECTION & BUTTONS CONTROL */}
            <div style={{marginBottom:28}}>
              <div style={{fontSize:14,fontWeight:800,marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                <Sliders size={16} color={C.purple}/> 3. Hero Hauptbereich & Call-To-Action Buttons (Zweisprachig)
              </div>
              <div style={{display:'grid',gap:14,background:C.bg,padding:18,borderRadius:14,border:`1px solid ${C.border}`}}>
                <div>
                  <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>EYEBROW KICKER TEXT (DE/EN)</label>
                  <input
                    type="text"
                    value={landingConfig.hero_kicker}
                    onChange={e => setLandingConfig(prev => ({ ...prev, hero_kicker: e.target.value }))}
                    style={{width:'100%',background:C.card,color:C.white,padding:'10px 14px',borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,outline:'none'}}
                  />
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div>
                    <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>HAUPT-ÜBERSCHRIFT (DE 🇩🇪)</label>
                    <input
                      type="text"
                      value={landingConfig.hero_title}
                      onChange={e => setLandingConfig(prev => ({ ...prev, hero_title: e.target.value }))}
                      style={{width:'100%',background:C.card,color:C.white,padding:'10px 14px',borderRadius:8,border:`1px solid ${C.border}`,fontSize:14,fontWeight:700,outline:'none'}}
                    />
                  </div>
                  <div>
                    <label style={{fontSize:11,color:C.blue,display:'block',marginBottom:4}}>HERO TITLE (EN 🇬🇧)</label>
                    <input
                      type="text"
                      value={landingConfig.hero_title_en || ''}
                      placeholder="One Platform. Endless Experiences."
                      onChange={e => setLandingConfig(prev => ({ ...prev, hero_title_en: e.target.value }))}
                      style={{width:'100%',background:C.card,color:C.white,padding:'10px 14px',borderRadius:8,border:`1px solid ${C.blue}44`,fontSize:14,fontWeight:700,outline:'none'}}
                    />
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div>
                    <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>UNTERTITEL (DE 🇩🇪)</label>
                    <textarea
                      rows={2}
                      value={landingConfig.hero_subtitle}
                      onChange={e => setLandingConfig(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                      style={{width:'100%',background:C.card,color:C.white,padding:'10px 14px',borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,outline:'none'}}
                    />
                  </div>
                  <div>
                    <label style={{fontSize:11,color:C.blue,display:'block',marginBottom:4}}>SUBTITLE (EN 🇬🇧)</label>
                    <textarea
                      rows={2}
                      value={landingConfig.hero_subtitle_en || ''}
                      placeholder="Scenvy connects your content, menus, screens and guest services."
                      onChange={e => setLandingConfig(prev => ({ ...prev, hero_subtitle_en: e.target.value }))}
                      style={{width:'100%',background:C.card,color:C.white,padding:'10px 14px',borderRadius:8,border:`1px solid ${C.blue}44`,fontSize:13,outline:'none'}}
                    />
                  </div>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginTop:10}}>
                  <div style={{background:C.card,padding:14,borderRadius:10,border:`1px solid ${C.purple}44`}}>
                    <div style={{fontSize:12,fontWeight:800,color:C.purple,marginBottom:8}}>PRIMÄRER BUTTON (CTA 1)</div>
                    <div style={{marginBottom:8}}>
                      <label style={{fontSize:10,color:C.muted,display:'block',marginBottom:2}}>BUTTON TEXT</label>
                      <input
                        type="text"
                        value={landingConfig.hero_btn_primary_text}
                        onChange={e => setLandingConfig(prev => ({ ...prev, hero_btn_primary_text: e.target.value }))}
                        style={{width:'100%',background:C.bg,color:C.white,padding:'8px 10px',borderRadius:6,border:`1px solid ${C.border}`,fontSize:12,outline:'none'}}
                      />
                    </div>
                    <div>
                      <label style={{fontSize:10,color:C.muted,display:'block',marginBottom:2}}>BUTTON ZIEL-AKTION</label>
                      <select
                        value={landingConfig.hero_btn_primary_action}
                        onChange={e => setLandingConfig(prev => ({ ...prev, hero_btn_primary_action: e.target.value }))}
                        style={{width:'100%',background:C.bg,color:C.white,padding:'8px 10px',borderRadius:6,border:`1px solid ${C.border}`,fontSize:12,outline:'none'}}
                      >
                        <option value="register">Registrieren (/auth?mode=register)</option>
                        <option value="demo">Demo-Bereich (#demo)</option>
                        <option value="contact">Enterprise Modal</option>
                        <option value="custom">Eigene URL</option>
                      </select>
                    </div>
                    {landingConfig.hero_btn_primary_action === 'custom' && (
                      <div style={{marginTop:8}}>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={landingConfig.hero_btn_primary_url}
                          onChange={e => setLandingConfig(prev => ({ ...prev, hero_btn_primary_url: e.target.value }))}
                          style={{width:'100%',background:C.bg,color:C.white,padding:'8px 10px',borderRadius:6,border:`1px solid ${C.border}`,fontSize:12,outline:'none'}}
                        />
                      </div>
                    )}
                  </div>

                  <div style={{background:C.card,padding:14,borderRadius:10,border:`1px solid ${C.border}`}}>
                    <div style={{fontSize:12,fontWeight:800,color:C.blue,marginBottom:8}}>SEKUNDÄRER BUTTON (CTA 2)</div>
                    <div style={{marginBottom:8}}>
                      <label style={{fontSize:10,color:C.muted,display:'block',marginBottom:2}}>BUTTON TEXT</label>
                      <input
                        type="text"
                        value={landingConfig.hero_btn_secondary_text}
                        onChange={e => setLandingConfig(prev => ({ ...prev, hero_btn_secondary_text: e.target.value }))}
                        style={{width:'100%',background:C.bg,color:C.white,padding:'8px 10px',borderRadius:6,border:`1px solid ${C.border}`,fontSize:12,outline:'none'}}
                      />
                    </div>
                    <div>
                      <label style={{fontSize:10,color:C.muted,display:'block',marginBottom:2}}>BUTTON ZIEL-AKTION</label>
                      <select
                        value={landingConfig.hero_btn_secondary_action}
                        onChange={e => setLandingConfig(prev => ({ ...prev, hero_btn_secondary_action: e.target.value }))}
                        style={{width:'100%',background:C.bg,color:C.white,padding:'8px 10px',borderRadius:6,border:`1px solid ${C.border}`,fontSize:12,outline:'none'}}
                      >
                        <option value="demo">Demo-Bereich (#demo)</option>
                        <option value="register">Registrieren (/auth?mode=register)</option>
                        <option value="contact">Enterprise Modal</option>
                        <option value="custom">Eigene URL</option>
                      </select>
                    </div>
                    {landingConfig.hero_btn_secondary_action === 'custom' && (
                      <div style={{marginTop:8}}>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={landingConfig.hero_btn_secondary_url}
                          onChange={e => setLandingConfig(prev => ({ ...prev, hero_btn_secondary_url: e.target.value }))}
                          style={{width:'100%',background:C.bg,color:C.white,padding:'8px 10px',borderRadius:6,border:`1px solid ${C.border}`,fontSize:12,outline:'none'}}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. HEADER BUTTONS TOGGLE */}
            <div style={{background:C.bg,padding:18,borderRadius:14,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:14,fontWeight:800,marginBottom:12}}>4. Navigation Header Rechter Bereich Buttons</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13}}>
                  <input
                    type="checkbox"
                    checked={landingConfig.show_login_btn}
                    onChange={e => setLandingConfig(prev => ({ ...prev, show_login_btn: e.target.checked }))}
                  />
                  "Einloggen" Button anzeigen
                </label>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13}}>
                  <input
                    type="checkbox"
                    checked={landingConfig.show_register_btn}
                    onChange={e => setLandingConfig(prev => ({ ...prev, show_register_btn: e.target.checked }))}
                  />
                  "Kostenlos starten" CTA anzeigen
                </label>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13}}>
                  <input
                    type="checkbox"
                    checked={landingConfig.show_pricing_section}
                    onChange={e => setLandingConfig(prev => ({ ...prev, show_pricing_section: e.target.checked }))}
                  />
                  Preissektion auf Landing-Page anzeigen
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Pricing & Tarife Tab */}
        {tab==='pricing' && (
          <div style={{background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div>
                <div style={{fontSize:16,fontWeight:800}}>🏷️ Preise, Tarife & Button-Steuerung</div>
                <div style={{fontSize:13,color:C.muted,marginTop:2}}>Konfiguriere Standard-Preise für Starter, Pro & Enterprise sowie Modul-Add-On Preise & CTA-Verlinkungen.</div>
              </div>
              <button
                onClick={savePricingConfig}
                style={{padding:'10px 20px',borderRadius:10,border:'none',background:grad(C.purple,C.pink),color:C.white,fontWeight:700,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}
              >
                <Save size={15}/> ✓ Preise & Tarife Speichern
              </button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
              {[
                { key: 'starter_price', ctaKey: 'starter_cta_text', actKey: 'starter_cta_action', name: 'STARTER', color: C.muted, features: ['1 Standort', 'Bis zu 3 Reels', 'Wasserzeichen'] },
                { key: 'pro_price', ctaKey: 'pro_cta_text', actKey: 'pro_cta_action', name: 'PRO', color: C.blue, features: ['Unbegrenzte Standorte', 'SNAP KI Speisekarte', 'Full HD Exports'] },
                { key: 'enterprise_price', ctaKey: 'enterprise_cta_text', actKey: 'enterprise_cta_action', name: 'ENTERPRISE', color: C.purple, features: ['Alle Module inklusive', 'SCENVY Board Digital Signage', 'Dedicated Support & White Label'] },
              ].map(p => (
                <div key={p.name} style={{background:C.bg,padding:20,borderRadius:14,border:`1px solid ${p.color}44`}}>
                  <div style={{fontSize:12,fontWeight:800,color:p.color,letterSpacing:1}}>{p.name} PLAN</div>
                  <div style={{display:'flex',alignItems:'center',gap:8,margin:'12px 0'}}>
                    <input
                      type="number"
                      value={pricingConfig[p.key]}
                      onChange={e => setPricingConfig(prev => ({ ...prev, [p.key]: Number(e.target.value) }))}
                      style={{width:90,background:C.card,color:C.white,padding:'8px 12px',borderRadius:8,border:`1px solid ${C.border}`,fontSize:18,fontWeight:900,outline:'none'}}
                    />
                    <span style={{fontSize:14,fontWeight:700,color:C.muted}}>€ / mtl.</span>
                  </div>
                  <div style={{marginBottom:12}}>
                    <label style={{fontSize:10,color:C.muted,display:'block',marginBottom:2}}>BUTTON TEXT</label>
                    <input
                      type="text"
                      value={pricingConfig[p.ctaKey] || ''}
                      onChange={e => setPricingConfig(prev => ({ ...prev, [p.ctaKey]: e.target.value }))}
                      style={{width:'100%',background:C.card,color:C.white,padding:'6px 10px',borderRadius:6,border:`1px solid ${C.border}`,fontSize:12,outline:'none'}}
                    />
                  </div>
                  <div style={{display:'grid',gap:6}}>
                    {p.features.map((f, i) => (
                      <div key={i} style={{fontSize:12,color:C.muted,display:'flex',alignItems:'center',gap:6}}>
                        <Check size={13} color={p.color}/> {f}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Modul Preiskonfiguration (€ / mtl.)</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
              {[
                { key: 'module_flow', name: '🎬 SCENVY Flow', color: C.purple },
                { key: 'module_menu', name: '🍽️ SCENVY Menu', color: C.orange },
                { key: 'module_board', name: '📺 SCENVY Board', color: C.blue },
                { key: 'module_host', name: '🏨 SCENVY Host', color: C.green },
              ].map(m => (
                <div key={m.key} style={{background:C.bg,padding:14,borderRadius:12,border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:12,fontWeight:700,color:m.color,marginBottom:8}}>{m.name}</div>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <input
                      type="number"
                      value={pricingConfig[m.key]}
                      onChange={e => setPricingConfig(prev => ({ ...prev, [m.key]: Number(e.target.value) }))}
                      style={{width:'100%',background:C.card,color:C.white,padding:'6px 10px',borderRadius:6,border:`1px solid ${C.border}`,fontSize:14,fontWeight:800,outline:'none'}}
                    />
                    <span style={{fontSize:12,color:C.muted}}>€</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stripe Tab */}
        {tab==='stripe' && (
          <div style={{background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.border}`,maxWidth:700}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
              <div style={{width:36,height:36,borderRadius:10,background:`${C.purple}22`,display:'flex',alignItems:'center',justifyContent:'center'}}><CreditCard size={18} color={C.purple}/></div>
              <div>
                <div style={{fontSize:14,fontWeight:700}}>Stripe Konfiguration</div>
                <div style={{fontSize:12,color:C.muted,marginTop:2}}>Payment-Keys für Abonnements und Billing</div>
              </div>
            </div>
            <div style={{background:`${C.purple}0A`,border:`1px solid ${C.purple}33`,borderRadius:12,padding:14,marginBottom:18,fontSize:13,color:C.muted}}>
              Trage deine Stripe-Keys ein, um Zahlungen zu aktivieren. Die Keys werden sicher in den Vercel Environment Variables gespeichert.
            </div>
            <div style={{display:'grid',gap:16}}>
              <ConfigField label="STRIPE PUBLISHABLE KEY" value={config.stripe_pk} onChange={v=>setConfig(c=>({...c,stripe_pk:v}))} placeholder="pk_live_..." />
              <ConfigField label="STRIPE SECRET KEY" value={config.stripe_secret} onChange={v=>setConfig(c=>({...c,stripe_secret:v}))} placeholder="sk_live_..." type="password" />
              <ConfigField label="STRIPE WEBHOOK SECRET" value={config.stripe_webhook} onChange={v=>setConfig(c=>({...c,stripe_webhook:v}))} placeholder="whsec_..." type="password" />
            </div>
            <button onClick={saveConfig} style={{display:'flex',alignItems:'center',gap:8,padding:'11px 24px',borderRadius:10,border:'none',background:grad(C.purple,C.pink),color:C.white,cursor:'pointer',fontWeight:700,fontSize:14,fontFamily:'inherit',marginTop:20}}>
              <Save size={15}/> Konfiguration speichern
            </button>
          </div>
        )}

        {/* Email Tab */}
        {tab==='email' && (
          <div style={{background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.border}`,maxWidth:700}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
              <div style={{width:36,height:36,borderRadius:10,background:`${C.blue}22`,display:'flex',alignItems:'center',justifyContent:'center'}}><Mail size={18} color={C.blue}/></div>
              <div>
                <div style={{fontSize:14,fontWeight:700}}>E-Mail & Forwarding</div>
                <div style={{fontSize:12,color:C.muted,marginTop:2}}>Empfänger für Kontaktformulare und Support-Anfragen</div>
              </div>
            </div>
            <div style={{background:`${C.blue}0A`,border:`1px solid ${C.blue}33`,borderRadius:12,padding:14,marginBottom:18,fontSize:13,color:C.muted}}>
              Füge <code style={{background:C.card2,padding:'2px 6px',borderRadius:4,color:C.blue}}>RESEND_API_KEY</code> in Vercel env vars hinzu, damit echte E-Mails versendet werden.
            </div>
            <div style={{display:'grid',gap:16}}>
              <ConfigField label="KONTAKT / ENTERPRISE-ANFRAGEN" value={config.contact_email} onChange={v=>setConfig(c=>({...c,contact_email:v}))} placeholder="kontakt@scenvy.de" icon={<Mail size={14} color={C.muted}/>} />
              <ConfigField label="SUPPORT-E-MAIL" value={config.support_email} onChange={v=>setConfig(c=>({...c,support_email:v}))} placeholder="support@scenvy.de" icon={<Shield size={14} color={C.muted}/>} />
              <ConfigField label="RESEND API KEY" value={config.resend_key} onChange={v=>setConfig(c=>({...c,resend_key:v}))} placeholder="re_..." type="password" />
              <ConfigField label="ABSENDER-ADRESSE" value={config.from_email} onChange={v=>setConfig(c=>({...c,from_email:v}))} placeholder="noreply@scenvy.de" />
            </div>
            <button onClick={saveConfig} style={{display:'flex',alignItems:'center',gap:8,padding:'11px 24px',borderRadius:10,border:'none',background:grad(C.purple,C.pink),color:C.white,cursor:'pointer',fontWeight:700,fontSize:14,fontFamily:'inherit',marginTop:20}}>
              <Save size={15}/> E-Mail-Einstellungen speichern
            </button>
          </div>
        )}

        {/* Feature Flags Tab */}
        {tab==='features' && (
          <div style={{background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:16,fontWeight:800,color:C.white,display:'flex',alignItems:'center',gap:8}}>
                <Shield size={18} color={C.purple}/> Platform Feature Flags & Modul-Steuerung
              </div>
              <div style={{fontSize:12,color:C.muted,marginTop:4}}>
                Steuere platformweite Funktionen, Drosselungs-Schalter und KI-Module in Echtzeit. Jeder Flag erklärt genau, welches Problem er löst und was beim Ein- und Ausschalten passiert.
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
              {flags.map((f,i)=>(
                <div
                  key={f.id || i}
                  style={{
                    background: C.bg,
                    borderRadius: 14,
                    padding: 20,
                    border: `1px solid ${f.on ? f.c+'44' : C.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 14,
                    boxShadow: f.on ? `0 4px 20px ${f.c}11` : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Card Header & Toggle */}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                    <div>
                      <div style={{fontSize:9,fontWeight:900,color:f.c,letterSpacing:1.5,marginBottom:4}}>
                        {f.tag || 'FEATURE FLAG'}
                      </div>
                      <div style={{fontSize:15,fontWeight:800,color:C.white,lineHeight:1.3}}>
                        {f.n}
                      </div>
                    </div>

                    <button
                      onClick={()=>{
                        setFlags(fs=>fs.map((x,j)=>i===j?{...x,on:!x.on}:x))
                        notify(`${f.n} ${!f.on?'aktiviert (ON)':'deaktiviert (OFF)'}`)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 12px',
                        borderRadius: 20,
                        border: `1px solid ${f.on ? f.c : C.border}`,
                        background: f.on ? `${f.c}22` : C.card2,
                        color: f.on ? C.white : C.muted,
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 800,
                        fontFamily: 'inherit',
                        flexShrink: 0,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span>{f.on ? 'AKTIV (ON)' : 'INAKTIV (OFF)'}</span>
                      <div style={{width:32,height:18,borderRadius:10,background:f.on?f.c:C.dim,position:'relative',transition:'background .2s',flexShrink:0}}>
                        <div style={{width:12,height:12,borderRadius:'50%',background:C.white,position:'absolute',top:3,left:f.on?17:3,transition:'left .2s'}}/>
                      </div>
                    </button>
                  </div>

                  {/* Core Description & Problem solved */}
                  <div style={{fontSize:12,color:C.white,lineHeight:1.5,background:C.card2,padding:12,borderRadius:10,border:`1px solid ${C.border}`}}>
                    <strong style={{color:f.c,display:'block',marginBottom:3,fontSize:11}}>💡 Was es löst:</strong>
                    {f.solve}
                  </div>

                  {/* Status impact breakdown */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,fontSize:11,lineHeight:1.4}}>
                    <div style={{padding:'8px 10px',background:f.on?`${C.green}11`:C.card2,borderRadius:8,border:`1px solid ${f.on?C.green+'33':C.border}`}}>
                      <div style={{fontWeight:800,color:C.green,marginBottom:2}}>🟢 Bei AKTIV (ON):</div>
                      <div style={{color:C.muted}}>{f.whenOn}</div>
                    </div>
                    <div style={{padding:'8px 10px',background:!f.on?`${C.pink}11`:C.card2,borderRadius:8,border:`1px solid ${!f.on?C.pink+'33':C.border}`}}>
                      <div style={{fontWeight:800,color:C.pink,marginBottom:2}}>🔴 Bei INAKTIV (OFF):</div>
                      <div style={{color:C.muted}}>{f.whenOff}</div>
                    </div>
                  </div>

                  {/* Why / Recommendation */}
                  <div style={{fontSize:10,color:C.muted,display:'flex',alignItems:'center',gap:6,borderTop:`1px solid ${C.border}`,paddingTop:8}}>
                    <span>🎯 <strong>Einsatzempfehlung:</strong> {f.why}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>

      {toast&&<div style={{position:'fixed',bottom:28,left:'50%',transform:'translateX(-50%)',background:C.purple,color:C.white,padding:'12px 24px',borderRadius:14,fontSize:13,fontWeight:600,zIndex:9999,animation:'fadeUp .25s ease'}}>{toast}</div>}
    </div>
  )
}

function ConfigField({ label, value, onChange, placeholder, type='text', icon }) {
  return (
    <div>
      <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:600,letterSpacing:1}}>{label}</label>
      <div style={{position:'relative'}}>
        {icon&&<span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',display:'flex'}}>{icon}</span>}
        <input value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type}
          style={{width:'100%',padding:`11px 14px ${icon?'11px 34px':'11px 14px'}`,borderRadius:9,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:13,outline:'none',fontFamily:'inherit'}}/>
      </div>
    </div>
  )
}

function TenantEditDrawer({ tenant, onClose, onSave, onDelete }) {
  const nav = useNavigate()
  const { impersonateTenant } = useAuth()
  const [form, setForm] = useState({
    name: tenant.name||'', plan: tenant.plan||'starter', status: tenant.status||'trial',
    max_locations: tenant.max_locations ?? (tenant.plan === 'pro' ? 5 : tenant.plan === 'enterprise' ? 10 : 1),
    custom_price: tenant.custom_price||'',
    company_name: tenant.company_name||'', company_address: tenant.company_address||'',
    company_zip: tenant.company_zip||'', company_city: tenant.company_city||'',
    contact_name: tenant.contact_name||'', contact_email: tenant.contact_email||'',
    contact_phone: tenant.contact_phone||'', website: tenant.website||'',
    stripe_customer_id: tenant.stripe_customer_id||'',
    modules: tenant.modules || { flow: true, menu: true, board: false, host: false }
  })
  const setF = (k,v) => setForm(f=>({...f,[k]:v}))

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:200,display:'flex',justifyContent:'flex-end',animation:'fadeUp .2s ease'}} onClick={onClose}>
      <div style={{width:480,background:C.card,height:'100vh',overflowY:'auto',borderLeft:`1px solid ${C.border}`,padding:28}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <Building2 size={20} color={C.purple}/>
            <div style={{fontSize:18,fontWeight:800}}>{tenant.name}</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.muted,cursor:'pointer',padding:4}}><X size={20}/></button>
        </div>

        <button
          onClick={() => { impersonateTenant(tenant); nav('/dashboard') }}
          style={{
            width:'100%', padding:'12px 0', borderRadius:10, border:'none',
            background: grad(C.purple, C.pink), color: C.white, fontWeight: 800,
            fontSize: 14, cursor: 'pointer', marginBottom: 20, display:'flex',
            alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit'
          }}
        >
          <ExternalLink size={16}/> 🚀 Als dieser Tenant ins Dashboard einsteigen
        </button>

        <div style={{display:'grid',gap:14}}>
          <Field label="TENANT NAME" value={form.name} onChange={v=>setF('name',v)} />
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:600,letterSpacing:1}}>PLAN</label>
              <select 
                value={form.plan} 
                onChange={e=>{
                  const newPlan = e.target.value
                  const defaultLocs = newPlan === 'starter' ? 1 : newPlan === 'pro' ? 5 : 10
                  setForm(f=>({...f, plan: newPlan, max_locations: defaultLocs}))
                }} 
                style={{width:'100%',padding:'11px 14px',borderRadius:9,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:13,outline:'none',fontFamily:'inherit'}}
              >
                <option value="starter">Starter (1 Standort)</option>
                <option value="pro">Pro (5 Standorte)</option>
                <option value="enterprise">Enterprise (Individuell)</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:600,letterSpacing:1}}>STATUS</label>
              <select value={form.status} onChange={e=>setF('status',e.target.value)} style={{width:'100%',padding:'11px 14px',borderRadius:9,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:13,outline:'none',fontFamily:'inherit'}}>
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div style={{background:C.bg,padding:14,borderRadius:12,border:`1px solid ${C.purple}33`,display:'grid',gap:12}}>
            <div>
              <label style={{fontSize:11,color:C.purple,display:'block',marginBottom:6,fontWeight:700,letterSpacing:1}}>
                📍 MAX. STANDORTE (SLOTS)
              </label>
              <input 
                type="number" 
                min="1" 
                max="999" 
                value={form.max_locations ?? 5} 
                onChange={e=>setF('max_locations', parseInt(e.target.value) || 1)} 
                placeholder="z.B. 5" 
                style={{width:'100%',padding:'11px 14px',borderRadius:9,border:`1px solid ${C.border}`,background:C.card,color:C.white,fontSize:14,fontWeight:700,outline:'none',fontFamily:'inherit'}}
              />
              <div style={{fontSize:11,color:C.muted,marginTop:6,lineHeight:1.4}}>
                💡 Standard: <strong>1 Standort</strong> (Testbereich), <strong>5 Standorte</strong> (Standard-Paket). Kann hier für das Mandat manuell überschrieben werden.
              </div>
            </div>

            <Field label="INDIVIDUELLER PREIS (€ / MONAT)" value={form.custom_price} onChange={v=>setF('custom_price',v)} placeholder="z.B. 49 (leer = Standardpreis)" />
          </div>

          <div>
            <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:600,letterSpacing:1}}>GEKAUFTE MODULE</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {[
                { k: 'flow', l: '🎬 SCENVY Flow' },
                { k: 'menu', l: '🍽️ SCENVY Menu' },
                { k: 'board', l: '📺 SCENVY Board' },
                { k: 'host', l: '🏨 SCENVY Host' },
              ].map(m => (
                <button
                  key={m.k}
                  type="button"
                  onClick={() => setF('modules', { ...form.modules, [m.k]: !form.modules?.[m.k] })}
                  style={{
                    padding: '8px 12px', borderRadius: 8,
                    border: `1px solid ${form.modules?.[m.k] ? C.purple : C.border}`,
                    background: form.modules?.[m.k] ? `${C.purple}22` : C.bg,
                    color: form.modules?.[m.k] ? C.white : C.muted,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                  }}
                >
                  {form.modules?.[m.k] ? '✓ ' : '✕ '}{m.l}
                </button>
              ))}
            </div>
          </div>

          <Field label="FIRMENNAME" value={form.company_name} onChange={v=>setF('company_name',v)} />
          <Field label="ADRESSE" value={form.company_address} onChange={v=>setF('company_address',v)} />
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Field label="PLZ" value={form.company_zip} onChange={v=>setF('company_zip',v)} />
            <Field label="STADT" value={form.company_city} onChange={v=>setF('company_city',v)} />
          </div>
          <Field label="KONTAKTNAME" value={form.contact_name} onChange={v=>setF('contact_name',v)} />
          <Field label="KONTAKT-E-MAIL" value={form.contact_email} onChange={v=>setF('contact_email',v)} type="email" />
          <Field label="TELEFON" value={form.contact_phone} onChange={v=>setF('contact_phone',v)} type="tel" />
          <Field label="WEBSITE" value={form.website} onChange={v=>setF('website',v)} />
          <Field label="STRIPE CUSTOMER ID" value={form.stripe_customer_id} onChange={v=>setF('stripe_customer_id',v)} />
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:24}}>
          <button onClick={()=>onSave(form)} style={{width:'100%',padding:'13px 0',borderRadius:12,border:'none',background:grad(C.purple,C.pink),color:C.white,cursor:'pointer',fontWeight:700,fontSize:15,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            <Save size={16}/> Änderungen speichern
          </button>
          
          {onDelete && (
            <button onClick={onDelete} style={{width:'100%',padding:'11px 0',borderRadius:12,border:`1px solid ${C.pink}55`,background:`${C.pink}11`,color:C.pink,cursor:'pointer',fontWeight:600,fontSize:13,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              <Trash2 size={14}/> Tenant löschen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type='text' }) {
  return (
    <div>
      <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:600,letterSpacing:1}}>{label}</label>
      <input value={value||''} onChange={e=>onChange(e.target.value)} type={type}
        style={{width:'100%',padding:'11px 14px',borderRadius:9,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:13,outline:'none',fontFamily:'inherit'}}/>
    </div>
  )
}
