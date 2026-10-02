import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchMenuReel, fetchLocationData, useSubmitOrder, useSubmitServiceCall, useRecordMenuScan } from '@/lib/db'
import { Phone, MessageCircle, MapPin, Instagram, Globe, Sparkles, ChevronUp, ArrowLeft, Edit3, Check, Plus, Trash2, Image, ShieldAlert, Download, QrCode, Share2, Copy, ShoppingCart, Bell, Receipt, Send, X, Minus, UtensilsCrossed, Clock, ExternalLink, Calendar } from 'lucide-react'
import { copyToClipboard } from '@/storage'
import JSZip from 'jszip'

export function JaggedStar13({ size = 22, fill = '#FFD700', stroke = '#B45309' }) {
  const points = []
  const numPoints = 13
  const outerRadius = size / 2
  const innerRadius = size * 0.38
  const cx = size / 2
  const cy = size / 2

  for (let i = 0; i < numPoints * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = (i * Math.PI) / numPoints - Math.PI / 2
    const x = (cx + radius * Math.cos(angle)).toFixed(2)
    const y = (cy + radius * Math.sin(angle)).toFixed(2)
    points.push(`${x},${y}`)
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <polygon points={points.join(' ')} fill={fill} stroke={stroke} strokeWidth="1" strokeLinejoin="round" />
    </svg>
  )
}

export function isScheduleActive(schedule) {
  if (!schedule || schedule.enabled === false) return true
  const now = new Date()

  // Date Check (startDate & endDate format YYYY-MM-DD)
  if (schedule.startDate) {
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    if (todayStr < schedule.startDate) return false
  }
  if (schedule.endDate) {
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    if (todayStr > schedule.endDate) return false
  }

  // Time Check
  const currentMin = now.getHours() * 60 + now.getMinutes()
  const [startH, startM] = (schedule.startTime || '00:00').split(':').map(Number)
  const [endH, endM] = (schedule.endTime || '23:59').split(':').map(Number)

  const startMin = startH * 60 + (startM || 0)
  const endMin = endH * 60 + (endM || 0)

  if (startMin <= endMin) {
    return currentMin >= startMin && currentMin <= endMin
  } else {
    return currentMin >= startMin || currentMin <= endMin
  }
}

export default function GuestMenuReel({ initialMenu, isPreview = false, onSaveMenu, isLocationView = false }) {
  const { menuId, locationId } = useParams()
  const nav = useNavigate()

  const [menu, setMenu] = useState(initialMenu || null)
  const [locationData, setLocationData] = useState(null)
  const [showHighlightBanner, setShowHighlightBanner] = useState(true)
  const [loading, setLoading] = useState(!initialMenu)
  const [lang, setLang] = useState(() => initialMenu?.branding?.primaryLanguage || initialMenu?.primaryLanguage || 'en') // 'en' | 'de'
  const [activeCat, setActiveCat] = useState('')
  const [selectedAllergen, setSelectedAllergen] = useState(null)
  const [editorMode, setEditorMode] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrType, setQrType] = useState('menu') // 'menu' | 'reel'
  const [toast, setToast] = useState(null)

  // In-Menu Ordering & Service Call States
  const [cart, setCart] = useState([]) // [{ id, name, price, qty }]
  const [tableNumber, setTableNumber] = useState('Tisch 1')
  const [specialNotes, setSpecialNotes] = useState('')
  const [showCartModal, setShowCartModal] = useState(false)
  const [showCallModal, setShowCallModal] = useState(false)
  const [callType, setCallType] = useState('waiter') // 'waiter' | 'bill'
  const [orderSentSuccess, setOrderSentSuccess] = useState(false)
  const [callSentSuccess, setCallSentSuccess] = useState(false)
  const [activeDetailItem, setActiveDetailItem] = useState(null)

  const submitOrder = useSubmitOrder()
  const submitServiceCall = useSubmitServiceCall()
  const recordScan = useRecordMenuScan()

  const catRefs = useRef({})

  const notify = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const branding = menu?.branding || {}
  const categories = menu?.categories || []
  const allergensLegend = menu?.allergensLegend || {}
  const primaryColor = branding.primaryColor || '#7C3AED'
  const secondaryColor = branding.secondaryColor || '#FF2D8D'
  const orderingEnabled = menu?.orderingEnabled ?? branding?.orderingEnabled ?? false
  const isCartEnabled = menu?.cartEnabled === true || branding?.cartEnabled === true

  const [colorTheme, setColorTheme] = useState(() => (branding.theme === 'dark' ? 'dark' : 'light'))

  useEffect(() => {
    if (branding.theme) {
      setColorTheme(branding.theme)
    }
  }, [branding.theme])

  useEffect(() => {
    const prefLang = branding.primaryLanguage || menu?.primaryLanguage
    if (prefLang && (prefLang === 'en' || prefLang === 'de' || prefLang === 'fr' || prefLang === 'it' || prefLang === 'es')) {
      setLang(prefLang)
    }
  }, [branding.primaryLanguage, menu?.primaryLanguage])

  const getLocalized = (val, currentLang) => {
    if (!val) return ''
    if (typeof val === 'string') return val
    if (typeof val === 'object') {
      return val[currentLang] || (currentLang === 'en' ? (val.en || val.de) : (val.de || val.en)) || Object.values(val)[0] || ''
    }
    return String(val)
  }

  const isLight = colorTheme === 'light'
  const currentBg = branding.backgroundColor || (isLight ? '#FAF9F6' : '#09090E')
  const currentText = isLight ? '#18181B' : '#ECECF1'
  const currentHeading = isLight ? '#0F172A' : '#FFFFFF'
  const currentCardBg = isLight ? '#FFFFFF' : 'rgba(255,255,255,0.03)'
  const currentCardBorder = isLight ? '1px solid #E2E8F0' : '1px solid rgba(255,255,255,0.07)'
  const currentShadow = isLight ? '0 4px 14px rgba(0,0,0,0.05)' : 'none'
  const currentSubText = isLight ? '#64748B' : '#A1A1AA'
  const currentNavBg = isLight ? 'rgba(250, 249, 246, 0.94)' : 'rgba(9, 9, 14, 0.94)'
  const currentNavBorder = isLight ? '#E2E8F0' : 'rgba(255,255,255,0.08)'
  const currentHeaderBg = isLight
    ? `linear-gradient(180deg, ${primaryColor}16 0%, ${currentBg} 100%)`
    : `linear-gradient(180deg, ${primaryColor}22 0%, #09090E 100%)`

  const downloadSingleHtml = () => {
    notify('📄 Generiere autarke HTML Datei...')
    const htmlContent = generateStandaloneHTML(menu)
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scenvy-menu-${(branding.name || 'restaurant').toLowerCase().replace(/\s+/g, '-')}.html`
    a.click()
    URL.revokeObjectURL(url)
    notify('✅ Standalone HTML-Datei heruntergeladen!')
  }

  useEffect(() => {
    if (locationId || isLocationView) {
      setLoading(true)
      const locTarget = locationId || 'loc1'
      fetchLocationData(locTarget).then((loc) => {
        setLocationData(loc)
        const sample = getSampleMenu()
        if (loc) {
          sample.branding = {
            ...sample.branding,
            name: loc.name || sample.branding?.name,
            address: `${loc.address || ''}, ${loc.zip || ''} ${loc.city || ''}`.trim(),
            phone: loc.phone || sample.branding?.phone
          }
        }
        setMenu(sample)
        setActiveCat('cat_1')
        setLoading(false)
      }).catch(() => {
        setMenu(getSampleMenu())
        setActiveCat('cat_1')
        setLoading(false)
      })
      return
    }

    if (initialMenu) {
      setMenu(initialMenu)
      setLoading(false)
      if (initialMenu?.categories?.[0]?.id) {
        setActiveCat(initialMenu.categories[0].id)
      }
      return
    }

    if (menuId) {
      setLoading(true)
      fetchMenuReel(menuId).then((res) => {
        const menuObj = res?.data || res
        if (menuObj && (menuObj.categories || menuObj.branding || menuObj.name)) {
          setMenu(menuObj)
          if (menuObj.categories?.[0]?.id) setActiveCat(menuObj.categories[0].id)
        } else {
          // Fallback sample menu
          setMenu(getSampleMenu())
          setActiveCat('cat_1')
        }
        setLoading(false)
      }).catch(() => {
        setMenu(getSampleMenu())
        setActiveCat('cat_1')
        setLoading(false)
      })
    } else {
      setMenu(getSampleMenu())
      setActiveCat('cat_1')
      setLoading(false)
      recordScan.mutate({ tenantId: 'tenant-demo-1', menuId: menuId || 'demo' })
    }
  }, [menuId, locationId, isLocationView, initialMenu])

  // Cart Helper Functions
  const addToCart = (item) => {
    const name = typeof item.name === 'object' ? item.name[lang] || item.name.de || item.name.en : item.name
    const priceStr = item.price || '0.00 €'

    setCart(prev => {
      const existingIndex = prev.findIndex(x => x.id === item.id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex].qty += 1
        return updated
      }
      return [...prev, { id: item.id || `i_${Date.now()}`, name, price: priceStr, qty: 1 }]
    })
    notify(`🛒 ${name} zum Warenkorb hinzugefügt`)
  }

  const updateCartQty = (id, delta) => {
    setCart(prev => {
      return prev.map(x => {
        if (x.id === id) {
          const newQty = x.qty + delta
          return newQty > 0 ? { ...x, qty: newQty } : null
        }
        return x
      }).filter(Boolean)
    })
  }

  const getCartTotalNum = () => {
    return cart.reduce((acc, item) => {
      const num = parseFloat(item.price.replace(/[^0-9,.]/g, '').replace(',', '.')) || 0
      return acc + (num * item.qty)
    }, 0)
  }

  const getCartTotalFormatted = () => {
    return `${getCartTotalNum().toFixed(2)} €`
  }

  const handleOrderSubmit = (e) => {
    e.preventDefault()
    if (cart.length === 0) return

    submitOrder.mutate({
      tenantId: menu?.tenantId || 'tenant-demo-1',
      menuId: menu?.id || menuId || 'demo',
      tableNumber: tableNumber || 'Tisch 1',
      items: cart,
      notes: specialNotes,
      totalPrice: getCartTotalFormatted()
    }, {
      onSuccess: () => {
        setOrderSentSuccess(true)
        setCart([])
        setSpecialNotes('')
        setTimeout(() => {
          setOrderSentSuccess(false)
          setShowCartModal(false)
        }, 3000)
      }
    })
  }

  const handleServiceCallSubmit = (type = 'waiter') => {
    submitServiceCall.mutate({
      tenantId: menu?.tenantId || 'tenant-demo-1',
      tableNumber: tableNumber || 'Tisch 1',
      type,
      note: type === 'bill' ? 'Rechnung / Kartenzahlung' : 'Kellner am Tisch gewünscht'
    }, {
      onSuccess: () => {
        setCallSentSuccess(true)
        setTimeout(() => {
          setCallSentSuccess(false)
          setShowCallModal(false)
        }, 3000)
      }
    })
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', background: '#0D0D14', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #7C3AED', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 14, color: '#A1A1AA' }}>Lade Menü Reel...</div>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (!menu) return null

  const scrollToCat = (catId) => {
    setActiveCat(catId)
    const el = document.getElementById(catId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle inline updates in editor mode
  const updateItemField = (catIndex, itemIndex, field, value) => {
    const updated = JSON.parse(JSON.stringify(menu))
    if (field === 'name' || field === 'description') {
      if (typeof updated.categories[catIndex].items[itemIndex][field] === 'object') {
        updated.categories[catIndex].items[itemIndex][field][lang] = value
      } else {
        updated.categories[catIndex].items[itemIndex][field] = value
      }
    } else {
      updated.categories[catIndex].items[itemIndex][field] = value
    }
    setMenu(updated)
    if (onSaveMenu) onSaveMenu(updated)
  }

  const updateCategoryName = (catIndex, value) => {
    const updated = JSON.parse(JSON.stringify(menu))
    if (typeof updated.categories[catIndex].name === 'object') {
      updated.categories[catIndex].name[lang] = value
    } else {
      updated.categories[catIndex].name = value
    }
    setMenu(updated)
    if (onSaveMenu) onSaveMenu(updated)
  }

  const addItemToCategory = (catIndex) => {
    const updated = JSON.parse(JSON.stringify(menu))
    const newItem = {
      id: `item_${Date.now()}`,
      name: 'Neues Gericht / New Dish',
      description: 'Zutaten und Beschreibung hier eingeben / Enter ingredients and description here',
      price: '12.00 €',
      variants: [],
      allergens: ['A'],
      diet: ['vegetarian'],
      highlight: false,
      imageUrl: ''
    }
    updated.categories[catIndex].items.push(newItem)
    setMenu(updated)
    if (onSaveMenu) onSaveMenu(updated)
  }

  const deleteItemFromCategory = (catIndex, itemIndex) => {
    const updated = JSON.parse(JSON.stringify(menu))
    updated.categories[catIndex].items.splice(itemIndex, 1)
    setMenu(updated)
    if (onSaveMenu) onSaveMenu(updated)
  }

  const downloadZip = async () => {
    notify('📦 Generiere ZIP-Paket...')
    const zip = new JSZip()
    const assetsFolder = zip.folder('assets')
    
    const htmlContent = generateStandaloneHTML(menu)
    zip.file('index.html', htmlContent)
    zip.file('menu_data.json', JSON.stringify(menu, null, 2))
    
    // Add sample placeholder asset for website package
    try {
      assetsFolder.file('README.txt', `SCENVY Single-Page Restaurant Menu Website Package
--------------------------------------------------
To deploy: Upload index.html and the assets/ directory to any web host, FTP, or Netlify/Vercel.
Data is embedded as window.MENU_DATA at the top of index.html for quick edits.`)
    } catch (err) {
      console.warn('ZIP asset folder warning:', err)
    }

    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = `scenvy-menu-${(branding.name || 'restaurant').toLowerCase().replace(/\s+/g, '-')}.zip`
    a.click()
    URL.revokeObjectURL(url)
    notify('✅ ZIP-Paket (index.html + assets/) heruntergeladen!')
  }

  const publicUrl = `${window.location.origin}/m/${menu.id || menuId || 'demo'}`

  return (
    <div style={{ minHeight: '100vh', background: currentBg, color: currentText, fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 100, transition: 'background-color 0.3s ease, color 0.3s ease' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Editor Bar if preview or inline editor mode enabled */}
      {(isPreview || onSaveMenu) && (
        <div style={{ position: 'sticky', top: 0, zIndex: 1000, background: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(13,13,20,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${isLight ? '#E2E8F0' : 'rgba(255,255,255,0.1)'}`, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 8px', borderRadius: 6, background: `${primaryColor}22`, color: primaryColor, border: `1px solid ${primaryColor}55` }}>
              AI MENU REEL & DIGITAL WEB
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: currentHeading }}>{branding.name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {onSaveMenu && (
              <button 
                onClick={() => {
                  onSaveMenu({ ...menu, branding: { ...menu?.branding, theme: colorTheme } })
                  notify('💾 Speisekarte erfolgreich gespeichert!')
                }} 
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 800, boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}
              >
                <Check size={14} /> Speisekarte Speichern
              </button>
            )}

            <button onClick={() => setEditorMode(!editorMode)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: `1px solid ${editorMode ? primaryColor : (isLight ? '#CBD5E1' : 'rgba(255,255,255,0.2)')}`, background: editorMode ? primaryColor : (isLight ? '#F8FAFC' : 'transparent'), color: editorMode ? '#fff' : currentText, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              <Edit3 size={14} /> {editorMode ? 'WYSIWYG Beenden' : 'WYSIWYG Editor'}
            </button>

            <button onClick={() => setShowQrModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: `1px solid ${isLight ? '#CBD5E1' : 'rgba(255,255,255,0.2)'}`, background: isLight ? '#F8FAFC' : 'transparent', color: currentText, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              <QrCode size={14} /> Dual QR & Links
            </button>

            <button onClick={downloadSingleHtml} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: `1px solid ${secondaryColor}`, background: `${secondaryColor}18`, color: secondaryColor, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              <Download size={14} /> Standalone HTML
            </button>

            <button onClick={downloadZip} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              <Download size={14} /> ZIP Export
            </button>
          </div>
        </div>
      )}

      {/* Header Branding Banner */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '36px 20px 24px', background: currentHeaderBg, borderBottom: `1px solid ${currentNavBorder}` }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          {/* Top Row: Language & Theme Switcher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            {isPreview ? (
              <span style={{ fontSize: 11, color: currentSubText, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Sparkles size={13} color={primaryColor} /> Dynamic Preview
              </span>
            ) : (
              <span style={{ fontSize: 11, color: currentSubText }}>scenvy Digital Menu</span>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Theme Switcher Button (☀️ Hell / 🌙 Dunkel) */}
              <button 
                onClick={() => setColorTheme(isLight ? 'dark' : 'light')} 
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 16, border: `1px solid ${isLight ? '#CBD5E1' : 'rgba(255,255,255,0.15)'}`, background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.08)', color: currentText, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                title={isLight ? 'Zu Dunkelmodus wechseln' : 'Zu Hellmodus wechseln'}
              >
                {isLight ? '☀️ Hell' : '🌙 Dunkel'}
              </button>

              {/* Language Switcher */}
              <div style={{ display: 'flex', background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 3, border: `1px solid ${isLight ? '#E2E8F0' : 'rgba(255,255,255,0.1)'}` }}>
                <button onClick={() => setLang('de')} style={{ padding: '4px 10px', borderRadius: 16, border: 'none', background: lang === 'de' ? primaryColor : 'transparent', color: lang === 'de' ? '#fff' : currentSubText, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  🇩🇪 DE
                </button>
                <button onClick={() => setLang('en')} style={{ padding: '4px 10px', borderRadius: 16, border: 'none', background: lang === 'en' ? primaryColor : 'transparent', color: lang === 'en' ? '#fff' : currentSubText, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  🇬🇧 EN
                </button>
              </div>
            </div>
          </div>

          {/* Logo or Icon */}
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.name} style={{ width: 72, height: 72, borderRadius: 20, objectFit: 'cover', margin: '0 auto 14px', border: `2px solid ${primaryColor}`, background: isLight ? '#FFF' : '#000', boxShadow: currentShadow }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 28, fontWeight: 900, boxShadow: `0 10px 30px ${primaryColor}44`, color: '#FFF' }}>
              🍽️
            </div>
          )}

          <h1 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 6px', letterSpacing: -0.5, color: currentHeading }}>
            {branding.name || 'Gourmet Restaurant'}
          </h1>
          {branding.address && (
            <div style={{ fontSize: 12, color: currentSubText, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
              <MapPin size={13} color={secondaryColor} /> {branding.address}
              {locationData?.googleMapsUrl && (
                <a href={locationData.googleMapsUrl} target="_blank" rel="noreferrer" style={{ color: primaryColor, textDecoration: 'none', fontWeight: 700, marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  Maps <ExternalLink size={10} />
                </a>
              )}
            </div>
          )}

          {/* Schedule Status Badge */}
          {menu?.schedule?.enabled && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: isScheduleActive(menu.schedule) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', border: `1px solid ${isScheduleActive(menu.schedule) ? '#10B981' : '#F59E0B'}`, color: isScheduleActive(menu.schedule) ? '#34D399' : '#FBBF24', fontSize: 11, fontWeight: 800, marginTop: 4, marginBottom: 10 }}>
              <Clock size={13} />
              <span>
                {isScheduleActive(menu.schedule)
                  ? `Zeitgesteuert: Aktiv bis ${menu.schedule.endTime || '23:59'} Uhr`
                  : `Inaktiv (Geplant: ${menu.schedule.startTime} – ${menu.schedule.endTime} Uhr)`}
              </span>
            </div>
          )}

          {/* Standort-Highlight / Zeitbasiertes Tagesangebot Banner */}
          {showHighlightBanner && (locationData?.highlight?.enabled || menu?.schedule?.highlight?.enabled) && (
            (() => {
              const hl = locationData?.highlight || menu?.schedule?.highlight
              const activeNow = isScheduleActive(hl)
              if (!activeNow || !hl?.title) return null

              const bgImg = hl.bgImage || hl.image
              const shape = hl.badgeShape || hl.starStyle || 'jagged_star_13'
              const badgeLabel = hl.badge || hl.batchName || 'TAGES-HIGHLIGHT'
              const primaryClr = hl.color || '#7C3AED'

              return (
                <div style={{
                  maxWidth: 660,
                  margin: '14px auto 0',
                  padding: bgImg ? '16px 20px' : '14px 18px',
                  borderRadius: 20,
                  position: 'relative',
                  overflow: 'hidden',
                  background: bgImg
                    ? `linear-gradient(135deg, rgba(15,15,26,0.85) 0%, rgba(15,15,26,0.95) 100%), url(${bgImg}) center/cover no-repeat`
                    : `linear-gradient(135deg, ${primaryClr}, #EC4899)`,
                  color: '#FFF',
                  boxShadow: `0 12px 35px ${primaryClr}55`,
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  textAlign: 'left'
                }}>
                  {/* Subtle decorative glow overlay */}
                  <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'rgba(255,255,255,0.12)', borderRadius: '50%', blur: '20px', pointerEvents: 'none' }} />

                  <div style={{ flex: 1, zIndex: 2 }}>
                    {/* Top Badges & Meta Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      {/* Badge Name with Star / Shape Icon */}
                      <span style={{ padding: '3px 10px', borderRadius: 20, background: '#FFF', color: primaryClr, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}>
                        {shape === 'jagged_star_13' && <JaggedStar13 size={18} fill="#F59E0B" stroke="#B45309" />}
                        {shape === 'starburst' && <span style={{ fontSize: 13 }}>💥</span>}
                        {shape === 'star' && <span style={{ fontSize: 13 }}>⭐</span>}
                        {shape === 'sparkles' && <span style={{ fontSize: 13 }}>🌟</span>}
                        {shape === 'flame' && <span style={{ fontSize: 13 }}>🔥</span>}
                        {shape === 'tag' && <span style={{ fontSize: 13 }}>🏷️</span>}
                        {shape === 'medal' && <span style={{ fontSize: 13 }}>🎖️</span>}
                        {shape === 'crown' && <span style={{ fontSize: 13 }}>👑</span>}
                        <span>{badgeLabel}</span>
                      </span>

                      {/* Date & Time Info */}
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.92)', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.35)', padding: '3px 8px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)' }}>
                        <Clock size={12} />
                        {hl.startDate && hl.endDate ? `${hl.startDate} bis ${hl.endDate} • ` : hl.startDate ? `Ab ${hl.startDate} • ` : ''}
                        {hl.startTime || '11:00'} – {hl.endTime || '23:00'} Uhr
                      </span>

                      {/* Exact Location or Batch Name */}
                      {(hl.exactLocation || locationData?.name) && (
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.18)', padding: '3px 8px', borderRadius: 12 }}>
                          <MapPin size={11} /> {hl.exactLocation || locationData?.name}
                        </span>
                      )}
                    </div>

                    {/* Banner Title */}
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', textShadow: '0 2px 10px rgba(0,0,0,0.5)', lineHeight: 1.25 }}>
                      {hl.title}
                    </div>

                    {/* Description Text */}
                    {hl.text && (
                      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.94)', marginTop: 4, lineHeight: 1.35, fontWeight: 500 }}>
                        {hl.text}
                      </div>
                    )}
                  </div>

                  {/* Right Side: Price Sticker & Close Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, zIndex: 2, flexShrink: 0 }}>
                    {/* Price Sticker */}
                    {hl.price && (
                      <div style={{
                        background: 'linear-gradient(135deg, #F59E0B, #F59E0B)',
                        color: '#000',
                        padding: '6px 12px',
                        borderRadius: 14,
                        fontWeight: 900,
                        fontSize: 15,
                        textAlign: 'center',
                        boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
                        border: '2px solid #FFF',
                        transform: 'rotate(-3deg)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: 8.5, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 800, color: '#78350F', lineHeight: 1 }}>Sonderpreis</span>
                        <span style={{ fontSize: 15, fontWeight: 900, marginTop: 1 }}>{hl.price}</span>
                      </div>
                    )}

                    <button onClick={() => setShowHighlightBanner(false)} style={{ background: 'rgba(255,255,255,0.22)', border: 'none', color: '#FFF', width: 28, height: 28, borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backdropFilter: 'blur(4px)' }} title="Banner schließen">
                      <X size={15} />
                    </button>
                  </div>
                </div>
              )
            })()
          )}

          {/* Quick Contact Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            {branding.phone && (
              <a href={`tel:${branding.phone}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 12, fontWeight: 600 }}>
                <Phone size={13} color={primaryColor} /> {lang === 'de' ? 'Anrufen' : 'Call'}
              </a>
            )}
            {branding.whatsapp && (
              <a href={`https://wa.me/${branding.whatsapp.replace(/\+/g, '')}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, background: '#25D36622', border: '1px solid #25D36644', color: '#25D366', fontSize: 12, fontWeight: 600 }}>
                <MessageCircle size={13} /> WhatsApp
              </a>
            )}
            {branding.instagram && (
              <a href={`https://instagram.com/${branding.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, background: '#E1306C22', border: '1px solid #E1306C44', color: '#E1306C', fontSize: 12, fontWeight: 600 }}>
                <Instagram size={13} /> Instagram
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Category Bar */}
      <div className="hide-scrollbar" style={{ position: 'sticky', top: 0, zIndex: 900, background: currentNavBg, backdropFilter: 'blur(16px)', borderBottom: `1px solid ${currentNavBorder}`, padding: '12px 16px', overflowX: 'auto', display: 'flex', gap: 8 }}>
        {categories.map((cat) => {
          const catName = getLocalized(cat.name, lang) || 'Category'
          const isActive = activeCat === cat.id
          return (
            <button key={cat.id} onClick={() => scrollToCat(cat.id)} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 24, border: `1px solid ${isActive ? primaryColor : (isLight ? '#CBD5E1' : 'rgba(255,255,255,0.1)')}`, background: isActive ? primaryColor : (isLight ? '#F1F5F9' : 'rgba(255,255,255,0.04)'), color: isActive ? '#FFF' : currentSubText, fontSize: 13, fontWeight: isActive ? 800 : 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6, boxShadow: isActive ? `0 4px 12px ${primaryColor}33` : 'none' }}>
              <span>{cat.icon || '🍴'}</span>
              <span>{catName}</span>
              <span style={{ fontSize: 10, opacity: 0.6 }}>({cat.items?.length || 0})</span>
            </button>
          )
        })}
      </div>

      {/* Categories & Dish Cards */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px' }}>
        {categories.map((cat, catIdx) => {
          const catName = getLocalized(cat.name, lang) || (lang === 'en' ? 'Category' : 'Kategorie')
          return (
            <div key={cat.id || catIdx} id={cat.id} style={{ marginBottom: 36, scrollMarginTop: 110, animation: 'fadeIn 0.4s ease' }}>
              {/* Category Title */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 8, borderBottom: `2px solid ${primaryColor}44` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>{cat.icon || '🍴'}</span>
                  {editorMode ? (
                    <input value={catName} onChange={(e) => updateCategoryName(catIdx, e.target.value)} style={{ fontSize: 20, fontWeight: 800, background: isLight ? '#F1F5F9' : 'rgba(255,255,255,0.1)', border: `1px solid ${primaryColor}`, color: currentHeading, borderRadius: 8, padding: '4px 8px', outline: 'none' }} />
                  ) : (
                    <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: currentHeading }}>{catName}</h2>
                  )}
                </div>

                {editorMode && (
                  <button onClick={() => addItemToCategory(catIdx)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: primaryColor, color: '#FFF', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                    <Plus size={13} /> {lang === 'en' ? 'Add Item' : 'Gericht hinzufügen'}
                  </button>
                )}
              </div>

              {/* Items List */}
              <div style={{ display: 'grid', gap: 16 }}>
                {cat.items?.map((item, itemIdx) => {
                  const itemName = getLocalized(item.name, lang) || (lang === 'en' ? 'Item' : 'Artikel')
                  const itemDesc = getLocalized(item.description, lang)

                  return (
                    <div 
                      key={item.id || itemIdx} 
                      onClick={() => !editorMode && setActiveDetailItem(item)}
                      style={{ 
                        background: currentCardBg, 
                        borderRadius: 16, 
                        border: item.highlight ? `1.5px solid ${primaryColor}99` : currentCardBorder, 
                        padding: 16, 
                        display: 'flex', 
                        gap: 14, 
                        position: 'relative', 
                        overflow: 'hidden', 
                        transition: 'all 0.2s ease', 
                        boxShadow: item.highlight ? `0 4px 20px ${primaryColor}18` : currentShadow,
                        cursor: editorMode ? 'default' : 'pointer'
                      }}
                    >
                      {/* Highlight Ribbon */}
                      {item.highlight && (
                        <div style={{ position: 'absolute', top: 0, right: 0, background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, color: '#FFF', fontSize: 9, fontWeight: 800, padding: '3px 10px 3px 8px', borderRadius: '0 16px 0 10px', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                          ⭐ {lang === 'en' ? 'Recommended' : 'Empfehlung'}
                        </div>
                      )}

                      {/* Cover Image - ONLY rendered if an actual real image exists (never empty boxes or unsplash/placeholder) */}
                      {item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim().length > 5 && !item.imageUrl.includes('unsplash.com') && !item.imageUrl.includes('placeholder') && item.imageUrl !== 'none' && (
                        <div style={{ width: 92, height: 92, borderRadius: 12, flexShrink: 0, overflow: 'hidden', position: 'relative', background: isLight ? '#F1F5F9' : '#000' }}>
                          <img 
                            src={item.imageUrl} 
                            alt={itemName} 
                            onError={(e) => { 
                              e.currentTarget.style.display = 'none'; 
                              if (e.currentTarget.parentElement) e.currentTarget.parentElement.style.display = 'none'; 
                            }} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        </div>
                      )}

                      {/* Content details */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, paddingRight: item.highlight ? 60 : 0 }}>
                            {editorMode ? (
                              <input value={itemName} onClick={(e) => e.stopPropagation()} onChange={(e) => updateItemField(catIdx, itemIdx, 'name', e.target.value)} style={{ fontSize: 15, fontWeight: 700, background: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.1)', border: `1px solid ${primaryColor}`, color: currentHeading, borderRadius: 6, padding: '2px 6px', width: '100%' }} />
                            ) : (
                              <div style={{ fontSize: 15.5, fontWeight: 800, color: currentHeading }}>{itemName}</div>
                            )}

                            {!editorMode && (
                              <div style={{ fontSize: 15, fontWeight: 900, color: secondaryColor, whiteSpace: 'nowrap' }}>
                                {item.price}
                              </div>
                            )}
                          </div>

                          {editorMode ? (
                            <textarea value={itemDesc} onClick={(e) => e.stopPropagation()} onChange={(e) => updateItemField(catIdx, itemIdx, 'description', e.target.value)} rows={2} style={{ fontSize: 12, background: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.1)', border: `1px solid ${primaryColor}`, color: currentText, borderRadius: 6, padding: '4px 6px', width: '100%', marginTop: 6, outline: 'none' }} />
                          ) : (
                            <div style={{ fontSize: 12.5, color: currentSubText, marginTop: 4, lineHeight: 1.45 }}>
                              {itemDesc}
                            </div>
                          )}
                        </div>

                        {/* Price editor field */}
                        {editorMode && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                            <span style={{ fontSize: 11, color: currentSubText }}>Preis:</span>
                            <input value={item.price} onChange={(e) => updateItemField(catIdx, itemIdx, 'price', e.target.value)} style={{ fontSize: 13, fontWeight: 700, background: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.1)', border: `1px solid ${secondaryColor}`, color: secondaryColor, borderRadius: 6, padding: '2px 6px', width: 90 }} />
                          </div>
                        )}

                        {/* Variants (e.g., S / L) */}
                        {item.variants && item.variants.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                            {item.variants.map((v, vIdx) => {
                              const vName = typeof v.name === 'object' ? v.name[lang] || v.name.de : v.name
                              return (
                                <span key={vIdx} style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: isLight ? '#F1F5F9' : 'rgba(255,255,255,0.06)', border: `1px solid ${isLight ? '#E2E8F0' : 'rgba(255,255,255,0.1)'}`, color: currentText }}>
                                  {vName}: <strong style={{ color: secondaryColor }}>{v.price}</strong>
                                </span>
                              )
                            })}
                          </div>
                        )}

                        {/* Badges: Diet & Bold Allergens */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                          {item.diet?.map((d) => (
                            <span key={d} style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 12, background: d === 'vegan' ? '#10B98122' : '#F59E0B22', color: d === 'vegan' ? '#10B981' : '#F59E0B', border: `1px solid ${d === 'vegan' ? '#10B98144' : '#F59E0B44'}` }}>
                              {d === 'vegan' ? '🌱 Vegan' : d === 'vegetarian' ? '🧀 Veggie' : d === 'glutenfree' ? '🌾 Glutenfrei' : '🌙 Halal'}
                            </span>
                          ))}

                          {/* Bold Allergen Code Badges (A, G, etc.) */}
                          {item.allergens?.map((a) => (
                            <button 
                              key={a} 
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedAllergen(a)
                              }} 
                              style={{ 
                                fontSize: 10, 
                                fontWeight: 900, 
                                padding: '2px 7px', 
                                borderRadius: 6, 
                                background: isLight ? '#F1F5F9' : 'rgba(255,255,255,0.12)', 
                                color: primaryColor, 
                                border: `1px solid ${isLight ? '#CBD5E1' : 'rgba(255,255,255,0.2)'}`, 
                                cursor: 'pointer',
                                letterSpacing: '0.5px'
                              }} 
                              title={`Allergen ${a}: ${allergensLegend[a]?.[lang] || allergensLegend[a]?.de || ''} (Klicken für Details)`}
                            >
                              <strong>{a}</strong>
                            </button>
                          ))}

                          {!editorMode && (
                            <span style={{ fontSize: 10.5, color: primaryColor, fontWeight: 700, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
                              Details & Allergene ›
                            </span>
                          )}
                        </div>

                        {!editorMode && isCartEnabled && (
                          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                addToCart(item)
                              }}
                              style={{
                                padding: '6px 14px',
                                borderRadius: 10,
                                background: `linear-gradient(135deg, ${primaryColor} 0%, #C026D3 100%)`,
                                color: '#FFF',
                                border: 'none',
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                boxShadow: `0 4px 12px ${primaryColor}33`
                              }}
                            >
                              <Plus size={14} /> {lang === 'de' ? 'Hinzufügen' : 'Add to Order'}
                            </button>
                          </div>
                        )}

                        {editorMode && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => deleteItemFromCategory(catIdx, itemIdx)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, background: '#EF444422', border: '1px solid #EF444444', color: '#EF4444', fontSize: 11, cursor: 'pointer' }}>
                              <Trash2 size={12} /> Löschen
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Allergen Legend at Bottom of One-Page Menu */}
        <div style={{ background: currentCardBg, borderRadius: 18, border: currentCardBorder, padding: 22, marginTop: 40, boxShadow: currentShadow }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: currentHeading, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={18} color={secondaryColor} />
            <span>{lang === 'de' ? 'Allergene & Zusatzstoffe (Vollständige Legende)' : 'Allergens & Additives (Full Legend)'}</span>
          </div>
          {(branding.allergenNotice || menu?.allergenNotice) && (
            <div style={{ fontSize: 12, color: isLight ? '#334155' : '#D4D4D8', marginBottom: 16, fontStyle: 'italic', background: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.04)', padding: '12px 16px', borderRadius: 12, borderLeft: `4px solid ${secondaryColor}`, lineHeight: 1.5 }}>
              💬 {branding.allergenNotice || menu?.allergenNotice}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
            {Object.entries(allergensLegend).map(([code, dict]) => {
              const label = typeof dict === 'object' ? dict[lang] || dict.de || dict.en : dict
              return (
                <div 
                  key={code} 
                  onClick={() => setSelectedAllergen(code)}
                  style={{ fontSize: 11.5, color: currentSubText, display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', background: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.02)', border: `1px solid ${isLight ? '#F1F5F9' : 'transparent'}` }}
                  title="Klicken für Allergen-Pop-up"
                >
                  <strong style={{ color: primaryColor, minWidth: 22, fontSize: 12, fontWeight: 900 }}>{code}:</strong> 
                  <span style={{ color: currentText, lineHeight: 1.35 }}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* STICKY GUEST BOTTOM ACTION BAR (Tisch-Bestellung & Kellner-Ruf) - Only in public link guest view when menu is loaded */}
      {!editorMode && menu?.categories && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1500,
            background: 'rgba(15, 15, 23, 0.95)',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(255,255,255,0.12)',
            padding: '10px 14px',
            boxShadow: '0 -8px 30px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            {/* 1. Left: Kellner rufen */}
            <button
              onClick={() => { setCallType('waiter'); setShowCallModal(true) }}
              style={{
                flex: isCartEnabled ? '0 0 auto' : 1,
                padding: '10px 14px',
                borderRadius: 12,
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#FCA5A5',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                whiteSpace: 'nowrap'
              }}
            >
              <Bell size={15} color="#EF4444" />
              <span>{lang === 'de' ? 'Kellner rufen' : 'Call Waiter'}</span>
            </button>

            {/* 2. Middle: Bestellung (Order Cart) - only when cart is enabled */}
            {isCartEnabled && (
              <button
                onClick={() => setShowCartModal(true)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 14,
                  background: cart.length > 0 ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'rgba(255,255,255,0.08)',
                  border: cart.length > 0 ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  color: '#FFF',
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: cart.length > 0 ? '0 4px 20px rgba(16,185,129,0.4)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShoppingCart size={17} />
                  <span>{lang === 'de' ? 'Bestellung' : 'Order'}</span>
                  {cart.length > 0 && (
                    <span style={{ padding: '2px 7px', borderRadius: 10, background: '#FFF', color: '#059669', fontSize: 11, fontWeight: 900 }}>
                      {cart.reduce((a, b) => a + b.qty, 0)}
                    </span>
                  )}
                </div>

                <span style={{ fontSize: 13, fontWeight: 900 }}>
                  {cart.length > 0 ? getCartTotalFormatted() : (lang === 'de' ? 'Leer' : 'Empty')}
                </span>
              </button>
            )}

            {/* 3. Right: Rechnung */}
            <button
              onClick={() => { setCallType('bill'); setShowCallModal(true) }}
              style={{
                flex: isCartEnabled ? '0 0 auto' : 1,
                padding: '10px 14px',
                borderRadius: 12,
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#FDE047',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                whiteSpace: 'nowrap'
              }}
            >
              <Receipt size={15} color="#F59E0B" />
              <span>{lang === 'de' ? 'Rechnung' : 'Bill'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div style={{ position: 'fixed', bottom: 80, right: 20, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {branding.whatsapp && (
          <a href={`https://wa.me/${branding.whatsapp.replace(/\+/g, '')}`} target="_blank" rel="noreferrer" style={{ width: 48, height: 48, borderRadius: '50%', background: '#25D366', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(37,211,102,0.4)', textDecoration: 'none' }}>
            <MessageCircle size={24} />
          </a>
        )}
        <button onClick={scrollToTop} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ChevronUp size={20} />
        </button>
      </div>

      {/* MODAL 1: ORDER CART MODAL */}
      {showCartModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowCartModal(false)}>
          <div style={{ background: '#12121A', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 24, padding: 24, maxWidth: 460, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>
                    {lang === 'de' ? 'Ihre Tisch-Bestellung' : 'Your Table Order'}
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                    {lang === 'de' ? 'Keine Online-Zahlung erforderlich. Bezahlung erfolgt beim Kellner.' : 'No online payment required. Pay your waiter directly.'}
                  </div>
                </div>
              </div>

              <button onClick={() => setShowCartModal(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {orderSentSuccess ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', background: 'rgba(16,185,129,0.1)', borderRadius: 16, border: '1px solid #10B981' }}>
                <Check size={48} color="#10B981" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>Bestellung übermittelt!</div>
                <div style={{ fontSize: 13, color: '#A7F3D0', marginTop: 6 }}>
                  Ihre Auswahl wurde an das Team übergeben ({tableNumber}). Ein Servicemitarbeiter bringt Ihre Speisen in Kürze.
                </div>
              </div>
            ) : (
              <form onSubmit={handleOrderSubmit}>
                {/* Table Number Selection */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#A78BFA', marginBottom: 6 }}>
                    📍 {lang === 'de' ? 'Tischnummer angeben' : 'Table Number'}
                  </label>
                  <input
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="z.B. Tisch 4"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      color: '#FFF',
                      fontSize: 14,
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Cart Items List */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#9CA3AF', marginBottom: 8 }}>
                    🛒 {lang === 'de' ? 'Ausgewählte Gerichte' : 'Selected Items'}
                  </label>

                  {cart.length === 0 ? (
                    <div style={{ textStyle: 'italic', padding: 20, textAlign: 'center', color: '#6B7280', background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
                      {lang === 'de' ? 'Noch keine Gerichte ausgewählt.' : 'No items selected yet.'}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                      {cart.map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{item.name}</div>
                            <div style={{ fontSize: 12, color: '#10B981', fontWeight: 800 }}>{item.price}</div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button type="button" onClick={() => updateCartQty(item.id, -1)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Minus size={14} />
                            </button>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF', minWidth: 16, textAlign: 'center' }}>
                              {item.qty}
                            </span>
                            <button type="button" onClick={() => updateCartQty(item.id, 1)} style={{ width: 28, height: 28, borderRadius: 8, background: '#7C3AED', border: 'none', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Special Requests / Notes */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#9CA3AF', marginBottom: 6 }}>
                    ✍️ {lang === 'de' ? 'Sonderwünsche / Anmerkungen' : 'Special Notes'}
                  </label>
                  <textarea
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="z.B. Bitte ohne Knoblauch, Besteck für 2 Personen"
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#FFF',
                      fontSize: 12,
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>

                {/* Summary & Submit */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingTop: 12, borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 700 }}>Gesamtsumme:</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#10B981' }}>{getCartTotalFormatted()}</span>
                </div>

                <button
                  type="submit"
                  disabled={cart.length === 0 || submitOrder.isPending}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 14,
                    background: cart.length > 0 ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#374151',
                    color: '#FFF',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 900,
                    cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: cart.length > 0 ? '0 6px 20px rgba(16,185,129,0.4)' : 'none'
                  }}
                >
                  <Send size={16} />
                  {submitOrder.isPending ? 'Sende Bestellung...' : (lang === 'de' ? 'Bestellung an Kellner senden' : 'Send Order to Waiter')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: SERVICE CALL MODAL (KELLNER RUFEN / RECHNUNG) */}
      {showCallModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowCallModal(false)}>
          <div style={{ background: '#12121A', border: `1px solid ${callType === 'bill' ? '#F59E0B' : '#EF4444'}`, borderRadius: 24, padding: 24, maxWidth: 380, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {callType === 'bill' ? <Receipt size={24} color="#F59E0B" /> : <Bell size={24} color="#EF4444" />}
                <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>
                  {callType === 'bill' ? (lang === 'de' ? 'Rechnung anfordern' : 'Request Bill') : (lang === 'de' ? 'Kellner rufen' : 'Call Waiter')}
                </div>
              </div>
              <button onClick={() => setShowCallModal(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {callSentSuccess ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', background: 'rgba(16,185,129,0.1)', borderRadius: 16, border: '1px solid #10B981' }}>
                <Check size={40} color="#10B981" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF' }}>Signal gesendet!</div>
                <div style={{ fontSize: 12, color: '#A7F3D0', marginTop: 4 }}>
                  Ein Servicemitarbeiter wurde benachrichtigt und kommt sofort zu {tableNumber}.
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#A78BFA', marginBottom: 6 }}>
                    📍 {lang === 'de' ? 'Ihre Tischnummer' : 'Your Table Number'}
                  </label>
                  <input
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="z.B. Tisch 7"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFF',
                      fontSize: 14,
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  onClick={() => handleServiceCallSubmit(callType)}
                  disabled={submitServiceCall.isPending}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 14,
                    background: callType === 'bill' ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    color: '#FFF',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 6px 20px rgba(0,0,0,0.4)'
                  }}
                >
                  <Bell size={16} />
                  {submitServiceCall.isPending ? 'Sende Signal...' : (callType === 'bill' ? 'Rechnung jetzt anfordern' : 'Kellner an den Tisch rufen')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DISH DETAIL MODAL (Bericht & Ausführliche Ansicht mit Allergenen am Ende) */}
      {activeDetailItem && (() => {
        const item = activeDetailItem
        const itemName = getLocalized(item.name, lang) || (lang === 'en' ? 'Item' : 'Gericht')
        const itemDesc = getLocalized(item.description, lang)
        const itemAllergens = item.allergens || []

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setActiveDetailItem(null)}>
            <div style={{ background: isLight ? '#FFFFFF' : '#14141E', color: currentText, border: `1px solid ${isLight ? '#E2E8F0' : 'rgba(255,255,255,0.12)'}`, borderRadius: 24, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.35)', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
              {/* Cover Photo - ONLY if an actual real image exists */}
              {item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim().length > 5 && !item.imageUrl.includes('unsplash.com') && !item.imageUrl.includes('placeholder') && item.imageUrl !== 'none' ? (
                <div style={{ width: '100%', height: 210, position: 'relative', overflow: 'hidden', borderRadius: '24px 24px 0 0', background: isLight ? '#F1F5F9' : '#000' }}>
                  <img 
                    src={item.imageUrl} 
                    alt={itemName} 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)' }} />
                  {item.highlight && (
                    <span style={{ position: 'absolute', top: 16, left: 16, background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, color: '#FFF', fontSize: 10, fontWeight: 900, padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      ⭐ Empfehlung
                    </span>
                  )}
                  <button onClick={() => setActiveDetailItem(null)} style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={17} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px 0' }}>
                  <button onClick={() => setActiveDetailItem(null)} style={{ width: 32, height: 32, borderRadius: '50%', background: isLight ? '#F1F5F9' : 'rgba(255,255,255,0.1)', border: 'none', color: currentText, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={16} />
                  </button>
                </div>
              )}

              <div style={{ padding: '22px 24px 26px' }}>

                {/* Title & Price */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <h2 style={{ fontSize: 21, fontWeight: 900, color: currentHeading, margin: 0, lineHeight: 1.25 }}>
                    {itemName}
                  </h2>
                  <div style={{ fontSize: 19, fontWeight: 900, color: secondaryColor, whiteSpace: 'nowrap' }}>
                    {item.price}
                  </div>
                </div>

                {/* Dietary Badges */}
                {item.diet && item.diet.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    {item.diet.map((d) => (
                      <span key={d} style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 14, background: d === 'vegan' ? '#10B98122' : '#F59E0B22', color: d === 'vegan' ? '#10B981' : '#F59E0B', border: `1px solid ${d === 'vegan' ? '#10B98144' : '#F59E0B44'}` }}>
                        {d === 'vegan' ? '🌱 Vegan' : d === 'vegetarian' ? '🧀 Vegetarisch' : d === 'glutenfree' ? '🌾 Glutenfrei' : '🌙 Halal'}
                      </span>
                    ))}
                  </div>
                )}

                {/* Long Description Text */}
                <div style={{ fontSize: 13.5, color: currentSubText, lineHeight: 1.55, marginBottom: 20 }}>
                  {itemDesc || (lang === 'de' ? 'Frisch zubereitet nach Rezeptur unseres Hauses mit besten Zutaten.' : 'Freshly prepared according to our house recipe with finest ingredients.')}
                </div>

                {/* Variants Box if available */}
                {item.variants && item.variants.length > 0 && (
                  <div style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 12, background: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.04)', border: `1px solid ${isLight ? '#E2E8F0' : 'rgba(255,255,255,0.08)'}` }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: currentSubText, marginBottom: 8 }}>
                      {lang === 'de' ? 'Größen & Varianten' : 'Sizes & Variants'}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {item.variants.map((v, vIdx) => {
                        const vName = typeof v.name === 'object' ? v.name[lang] || v.name.de : v.name
                        return (
                          <span key={vIdx} style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.08)', border: `1px solid ${isLight ? '#CBD5E1' : 'rgba(255,255,255,0.15)'}`, color: currentText }}>
                            {vName}: <strong style={{ color: secondaryColor }}>{v.price}</strong>
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ALLERGENS SECTION AT THE END OF THE DESCRIPTION / DISH DETAIL */}
                <div style={{ background: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.04)', border: `1px solid ${isLight ? '#E2E8F0' : 'rgba(255,255,255,0.08)'}`, borderRadius: 16, padding: 16, marginBottom: 22 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: currentHeading, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <ShieldAlert size={16} color={secondaryColor} />
                    <span>{lang === 'de' ? 'Allergene & Kennzeichnung (Zusatzstoffe)' : 'Allergens & Additives Labeling'}</span>
                  </div>

                  {itemAllergens.length > 0 ? (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {itemAllergens.map((code) => {
                        const allergenInfo = allergensLegend[code]?.[lang] || allergensLegend[code]?.de || allergensLegend[code]?.en || 'Information auf Anfrage'
                        return (
                          <div 
                            key={code} 
                            onClick={() => setSelectedAllergen(code)}
                            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 10, background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)', border: `1px solid ${isLight ? '#E2E8F0' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', transition: 'all 0.15s' }}
                            title="Klicken für Allergen-Pop-up"
                          >
                            <span style={{ fontSize: 12, fontWeight: 900, padding: '3px 8px', borderRadius: 6, background: `${primaryColor}22`, color: primaryColor, border: `1px solid ${primaryColor}44`, minWidth: 26, textAlign: 'center' }}>
                              {code}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 800, color: currentHeading }}>
                                Allergen {code}
                              </div>
                              <div style={{ fontSize: 11.5, color: currentSubText, marginTop: 1 }}>
                                {allergenInfo}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: currentSubText, fontStyle: 'italic' }}>
                      {lang === 'de' ? 'Keine meldepflichtigen Allergene für dieses Gericht deklariert.' : 'No declarable allergens specified for this dish.'}
                    </div>
                  )}

                  {(branding.allergenNotice || menu?.allergenNotice) && (
                    <div style={{ fontSize: 11, color: currentSubText, marginTop: 12, paddingTop: 10, borderTop: `1px dashed ${isLight ? '#CBD5E1' : 'rgba(255,255,255,0.1)'}`, fontStyle: 'italic', lineHeight: 1.45 }}>
                      💬 {branding.allergenNotice || menu?.allergenNotice}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                  {isCartEnabled && (
                    <button
                      onClick={() => {
                        addToCart(item)
                        setActiveDetailItem(null)
                      }}
                      style={{
                        flex: 1,
                        padding: '13px',
                        borderRadius: 14,
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        color: '#FFF',
                        border: 'none',
                        fontSize: 13.5,
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: `0 8px 24px ${primaryColor}44`
                      }}
                    >
                      <Plus size={16} /> {lang === 'de' ? 'In Tisch-Bestellung legen' : 'Add to Order'}
                    </button>
                  )}
                  <button
                    onClick={() => setActiveDetailItem(null)}
                    style={{
                      flex: isCartEnabled ? undefined : 1,
                      padding: '13px 20px',
                      borderRadius: 14,
                      background: isLight ? '#F1F5F9' : 'rgba(255,255,255,0.1)',
                      color: currentText,
                      border: `1px solid ${isLight ? '#CBD5E1' : 'rgba(255,255,255,0.15)'}`,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {lang === 'de' ? 'Schließen' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Quick Allergen Popup Modal (Klick auf Abkürzung) */}
      {selectedAllergen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 2200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedAllergen(null)}>
          <div style={{ background: isLight ? '#FFFFFF' : '#181824', color: currentText, border: `2px solid ${primaryColor}`, borderRadius: 22, padding: 26, maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${primaryColor}22`, border: `2px solid ${primaryColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: primaryColor, fontSize: 24, fontWeight: 900 }}>
              {selectedAllergen}
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: currentHeading, marginBottom: 8 }}>
              Allergen-Code {selectedAllergen}
            </div>
            <div style={{ fontSize: 13, color: currentSubText, lineHeight: 1.5, marginBottom: 20 }}>
              {allergensLegend[selectedAllergen]?.[lang] || allergensLegend[selectedAllergen]?.de || allergensLegend[selectedAllergen]?.en || 'Information auf Anfrage bei unseren Servicemitarbeitern.'}
            </div>
            <button onClick={() => setSelectedAllergen(null)} style={{ padding: '11px 24px', borderRadius: 12, background: primaryColor, color: '#FFF', border: 'none', fontWeight: 800, cursor: 'pointer', width: '100%', fontSize: 13, boxShadow: `0 4px 14px ${primaryColor}44` }}>
              {lang === 'de' ? 'Verstanden / Schließen' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* QR Code & Dual Link Modal */}
      {showQrModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowQrModal(false)}>
          <div style={{ background: '#181824', border: `1px solid ${primaryColor}55`, borderRadius: 24, padding: 28, maxWidth: 440, width: '100%', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Dual Links & QR-Codes</div>
            <div style={{ fontSize: 12, color: '#A1A1AA', marginBottom: 20 }}>
              Wähle das Format für deine Gäste: Einzelnes 9:16 Video Reel oder komplettes digitales Web-Menü.
            </div>

            {/* Link Mode Switcher */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4, marginBottom: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
              <button 
                onClick={() => setQrType('menu')} 
                style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', background: qrType === 'menu' ? primaryColor : 'transparent', color: '#FFF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                📖 Digitales Menü
              </button>
              <button 
                onClick={() => setQrType('reel')} 
                style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', background: qrType === 'reel' ? primaryColor : 'transparent', color: '#FFF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                🎬 Video Reel Link
              </button>
            </div>

            {(() => {
              const activeUrl = qrType === 'menu' ? `${publicUrl}?view=menu` : `${publicUrl}?view=reel`
              return (
                <div>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(activeUrl)}&margin=10`} 
                    alt="QR Code" 
                    style={{ width: 190, height: 190, borderRadius: 16, border: `2px solid ${primaryColor}`, margin: '0 auto 16px', background: '#FFF', padding: 8 }} 
                  />

                  <div style={{ fontSize: 11, fontWeight: 700, color: primaryColor, marginBottom: 8 }}>
                    {qrType === 'menu' ? 'LINK 1: KOMPLETTES DIGITALES WEB-MENÜ' : 'LINK 2: DIREKTES 9:16 VIDEO REEL'}
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    <input value={activeUrl} readOnly style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 11, outline: 'none' }} />
                    <button onClick={() => { copyToClipboard(activeUrl); notify('📋 Link kopiert!') }} style={{ padding: '10px 14px', borderRadius: 10, background: primaryColor, color: '#FFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 12 }}>
                      <Copy size={14} /> Kopieren
                    </button>
                  </div>
                </div>
              )
            })()}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={downloadSingleHtml} style={{ flex: 1, padding: '11px', borderRadius: 12, background: `${secondaryColor}22`, border: `1px solid ${secondaryColor}`, color: '#FFF', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                📄 HTML Herunterladen
              </button>
              <button onClick={() => setShowQrModal(false)} style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', color: '#FFF', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: primaryColor, color: '#FFF', padding: '12px 24px', borderRadius: 14, fontSize: 13, fontWeight: 700, zIndex: 9999 }}>
          {toast}
        </div>
      )}
    </div>
  )
}

function getSampleMenu() {
  return {
    id: 'demo',
    branding: {
      name: 'La Trattoria Scenvy',
      subtitle: 'Authentic Italian Cuisine',
      primaryColor: '#7C3AED',
      secondaryColor: '#FF2D8D',
      phone: '+49 30 9876543',
      whatsapp: '+491701234567',
      address: 'Musterstraße 12, 10115 Berlin',
      instagram: '@latrattoria_berlin'
    },
    categories: [
      {
        id: 'cat_1',
        name: { de: 'Vorspeisen & Antipasti', en: 'Starters & Antipasti' },
        icon: '🥗',
        items: [
          {
            id: 'i1',
            name: { de: 'Burrata al Tartufo', en: 'Truffle Burrata' },
            description: { de: 'Frische Burrata mit wildem Rucola, Kirschtomaten und schwarzem Trüffel', en: 'Fresh burrata with wild arugula, cherry tomatoes and black truffle' },
            price: '14.50 €',
            variants: [],
            allergens: ['G'],
            diet: ['vegetarian'],
            highlight: true,
            imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb16655?w=600&auto=format&fit=crop'
          },
          {
            id: 'i2',
            name: { de: 'Bruschetta Classica', en: 'Classic Bruschetta' },
            description: { de: 'Geröstetes Brot mit Tomaten, Knoblauch und frischem Basilikum', en: 'Toasted bread with tomatoes, garlic and fresh basil' },
            price: '8.90 €',
            variants: [],
            allergens: ['A'],
            diet: ['vegan', 'vegetarian'],
            highlight: false,
            imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600&auto=format&fit=crop'
          }
        ]
      },
      {
        id: 'cat_2',
        name: { de: 'Pasta & Pizza', en: 'Pasta & Pizza' },
        icon: '🍕',
        items: [
          {
            id: 'i3',
            name: { de: 'Tagliolini al Tartufo', en: 'Truffle Tagliolini' },
            description: { de: 'Hausgemachte Pasta in Salbeibutter mit frisch geriebenem Trüffel', en: 'Handmade pasta in sage butter with freshly shaved truffle' },
            price: '21.00 €',
            variants: [
              { name: { de: 'Normal', en: 'Standard' }, price: '21.00 €' },
              { name: { de: 'Große Portion', en: 'Large' }, price: '26.00 €' }
            ],
            allergens: ['A', 'C', 'G'],
            diet: ['vegetarian'],
            highlight: true,
            imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop'
          }
        ]
      }
    ],
    allergensLegend: {
      A: { de: 'Glutenhaltiges Getreide', en: 'Cereals containing gluten' },
      C: { de: 'Eier', en: 'Eggs' },
      G: { de: 'Milch & Laktose', en: 'Milk & Lactose' }
    }
  }
}

function generateStandaloneHTML(menu) {
  const branding = menu.branding || {}
  const categories = menu.categories || []
  const allergensLegend = menu.allergensLegend || {}
  const primaryColor = branding.primaryColor || '#7C3AED'
  const secondaryColor = branding.secondaryColor || '#FF2D8D'
  const initialTheme = branding.theme === 'dark' ? 'dark' : 'light'
  const primaryLang = branding.primaryLanguage || 'en'

  const getHtmlLocalized = (val) => {
    if (!val) return ''
    if (typeof val === 'string') return val
    if (typeof val === 'object') {
      return val[primaryLang] || (primaryLang === 'en' ? (val.en || val.de) : (val.de || val.en)) || Object.values(val)[0] || ''
    }
    return String(val)
  }

  return `<!DOCTYPE html>
<html lang="${primaryLang}" data-theme="${initialTheme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${branding.name || 'Digital Menu'} — ${primaryLang === 'en' ? 'Menu' : 'Speisekarte'}</title>
  
  <!-- Embedded Editable Menu Data -->
  <script>
    window.MENU_DATA = ${JSON.stringify(menu, null, 2)};
  </script>

  <style>
    :root {
      --primary: ${primaryColor};
      --secondary: ${secondaryColor};
      --bg-cream: #FAF9F6;
      --card-bg: #FFFFFF;
      --text-dark: #18181B;
      --text-muted: #64748B;
      --border-color: #E2E8F0;
      --header-bg: linear-gradient(180deg, ${primaryColor}14 0%, #FAF9F6 100%);
      --modal-bg: #FFFFFF;
      --input-bg: #FFFFFF;
      --tag-bg: #F1F5F9;
    }

    [data-theme="dark"] {
      --bg-cream: #09090E;
      --card-bg: #14141E;
      --text-dark: #ECECF1;
      --text-muted: #A1A1AA;
      --border-color: rgba(255, 255, 255, 0.09);
      --header-bg: linear-gradient(180deg, ${primaryColor}22 0%, #09090E 100%);
      --modal-bg: #14141E;
      --input-bg: #1A1A26;
      --tag-bg: rgba(255, 255, 255, 0.08);
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      background-color: var(--bg-cream);
      color: var(--text-dark);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      padding-bottom: 90px;
      transition: background-color 0.3s ease, color 0.3s ease;
    }

    h1, h2, h3, .brand-title {
      font-family: "Georgia", "Playfair Display", serif;
    }

    /* HEADER */
    .header {
      background: var(--header-bg);
      padding: 40px 20px 28px;
      text-align: center;
      border-bottom: 1px solid var(--border-color);
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }
    .brand-title {
      font-size: 32px;
      font-weight: 700;
      color: var(--text-dark);
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 14px;
      color: var(--text-muted);
      margin-bottom: 16px;
    }
    .contact-bar {
      display: flex;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 16px;
    }
    .contact-link {
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 24px;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      color: var(--text-dark);
      font-size: 13px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
      transition: all 0.2s ease;
    }
    .contact-link:hover {
      border-color: var(--primary);
      color: var(--primary);
    }

    /* SEARCH BOX */
    .search-wrapper {
      max-width: 800px;
      margin: 20px auto 0;
      padding: 0 16px;
    }
    .search-box {
      width: 100%;
      padding: 12px 18px;
      border-radius: 30px;
      border: 1px solid var(--border-color);
      background: var(--input-bg);
      color: var(--text-dark);
      font-size: 14px;
      outline: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .search-box:focus {
      border-color: var(--primary);
    }

    /* STICKY CATEGORY NAV & SCROLL SPY */
    .cat-nav {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: var(--bg-cream);
      backdrop-filter: blur(12px);
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      gap: 8px;
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
    }
    .cat-nav::-webkit-scrollbar { display: none; }

    .cat-tab {
      padding: 8px 18px;
      border-radius: 20px;
      border: 1px solid var(--border-color);
      background: var(--card-bg);
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }
    .cat-tab.active {
      background: var(--primary);
      color: #FFFFFF;
      border-color: var(--primary);
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
    }

    /* MAIN CONTAINER */
    .container {
      max-width: 900px;
      margin: 24px auto;
      padding: 0 16px;
    }

    /* CATEGORIES & GRID LAYOUT */
    .category-section {
      margin-bottom: 40px;
      scroll-margin-top: 80px;
      opacity: 0;
      transform: translateY(16px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .category-section.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .category-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-dark);
      margin-bottom: 18px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--primary);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* RESPONSIVE DISH GRID (MOBILE SINGLE COLUMN, DESKTOP 2-COLUMNS) */
    .dish-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }
    @media (min-width: 768px) {
      .dish-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* DISH CARD */
    .dish-card {
      background: var(--card-bg);
      border-radius: 16px;
      border: 1px solid var(--border-color);
      padding: 16px;
      display: flex;
      gap: 14px;
      position: relative;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .dish-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.06);
    }
    .dish-card.highlight {
      border-color: var(--primary);
      background: linear-gradient(180deg, #FFFFFF 0%, #F9F5FE 100%);
    }

    .dish-img {
      width: 90px;
      height: 90px;
      border-radius: 12px;
      object-fit: cover;
      flex-shrink: 0;
      background: #E5E7EB;
    }

    .dish-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .dish-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }

    .dish-name {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-dark);
    }

    .dish-price {
      font-size: 15px;
      font-weight: 800;
      color: var(--secondary);
      white-space: nowrap;
    }

    .dish-desc {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
      line-height: 1.4;
    }

    /* VARIANT BOXES & 2-COLUMN PRICES */
    .variants-box {
      margin-top: 10px;
      padding: 8px 10px;
      background: var(--bg-cream);
      border-radius: 8px;
      border: 1px dashed var(--border-color);
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .variant-pill {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
      background: #FFFFFF;
      border: 1px solid var(--border-color);
      color: var(--text-dark);
    }

    /* BADGES */
    .badge-group {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 10px;
    }
    .badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 12px;
      background: #F3F4F6;
      color: var(--text-muted);
    }
    .badge-vegan { background: #D1FAE5; color: #065F46; }
    .badge-veggie { background: #FEF3C7; color: #92400E; }
    .badge-gf { background: #E0E7FF; color: #3730A3; }
    .badge-highlight { background: var(--primary); color: #FFFFFF; }

    /* ALLERGEN LEGEND */
    .allergen-legend {
      background: var(--card-bg);
      border-radius: 16px;
      border: 1px solid var(--border-color);
      padding: 20px;
      margin-top: 40px;
    }
    .legend-title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .legend-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 8px;
      font-size: 12px;
      color: var(--text-muted);
    }

    /* FOOTER */
    .footer {
      background: #111827;
      color: #F9FAFB;
      text-align: center;
      padding: 40px 20px;
      margin-top: 60px;
    }
    .footer-title {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .footer-links {
      display: flex;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: 16px;
    }
    .footer-a {
      color: #9CA3AF;
      text-decoration: none;
      font-size: 13px;
    }
    .footer-a:hover { color: #FFFFFF; }

    /* FLOATING BUTTONS */
    .floating-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .float-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      text-decoration: none;
      box-shadow: 0 4px 14px rgba(0,0,0,0.2);
      border: none;
      cursor: pointer;
      font-size: 18px;
    }
    .btn-wa { background: #25D366; }
    .btn-top { background: rgba(31, 41, 55, 0.85); backdrop-filter: blur(8px); }

  </style>
</head>
<body>

  <!-- HEADER -->
  <header class="header">
    ${branding.logoUrl ? `<img src="${branding.logoUrl}" alt="${branding.name || 'Logo'}" style="width:72px;height:72px;border-radius:18px;object-fit:cover;margin:0 auto 14px;border:2px solid var(--primary);box-shadow:0 4px 14px rgba(0,0,0,0.06);display:block;">` : ''}
    <h1 class="brand-title">${branding.name || 'Restaurant'}</h1>
    <p class="brand-sub">${branding.address || ''}</p>
    <div class="contact-bar">
      <button type="button" class="contact-link" onclick="toggleTheme()" id="themeBtn" style="cursor:pointer;border:1px solid var(--border-color);">
        ${initialTheme === 'dark' ? '🌙 Dunkel' : '☀️ Hell'}
      </button>
      ${branding.phone ? `<a href="tel:${branding.phone}" class="contact-link">📞 ${branding.phone}</a>` : ''}
      ${branding.email ? `<a href="mailto:${branding.email}" class="contact-link">✉️ ${branding.email}</a>` : ''}
      ${branding.whatsapp ? `<a href="https://wa.me/${branding.whatsapp.replace(/\+/g, '')}" target="_blank" class="contact-link" style="color:#10B981;">💬 WhatsApp</a>` : ''}
      ${branding.instagram ? `<a href="https://instagram.com/${branding.instagram.replace('@', '')}" target="_blank" class="contact-link" style="color:#E1306C;">📷 ${branding.instagram}</a>` : ''}
    </div>
  </header>

  <!-- SEARCH BOX -->
  <div class="search-wrapper">
    <input type="text" id="searchInput" class="search-box" placeholder="🔍 Gericht, Zutat oder Variante suchen..." oninput="filterMenu(this.value)">
  </div>

  <!-- STICKY CATEGORY NAV -->
  <nav class="cat-nav" id="catNav">
    ${categories.map((c, i) => `
      <button class="cat-tab ${i === 0 ? 'active' : ''}" data-cat="${c.id}" onclick="scrollToCat('${c.id}')">
        ${c.icon || '🍴'} ${getHtmlLocalized(c.name)}
      </button>
    `).join('')}
  </nav>

  <!-- MENU CONTENT -->
  <main class="container">
    ${categories.map((cat) => `
      <section id="${cat.id}" class="category-section">
        <h2 class="category-title">
          <span>${cat.icon || '🍴'}</span>
          <span>${getHtmlLocalized(cat.name)}</span>
        </h2>
        
        <div class="dish-grid">
          ${(cat.items || []).map((item) => {
            const name = getHtmlLocalized(item.name) || (primaryLang === 'en' ? 'Item' : 'Artikel')
            const desc = getHtmlLocalized(item.description)
            const allergensStr = (item.allergens || []).join(',')
            
            return `
              <article class="dish-card ${item.highlight ? 'highlight' : ''}" style="cursor:pointer;" onclick="openDishModal(this)" data-name="${encodeURIComponent(name)}" data-desc="${encodeURIComponent(desc || '')}" data-price="${encodeURIComponent(item.price || '')}" data-img="${encodeURIComponent(item.imageUrl || '')}" data-allergens="${allergensStr}" data-search="${(name + ' ' + desc + ' ' + (item.price || '')).toLowerCase()}">
                ${item.imageUrl ? `<img src="${item.imageUrl}" class="dish-img" alt="${name}" loading="lazy" onerror="this.style.display='none';">` : ''}
                <div class="dish-details">
                  <div>
                    <div class="dish-header">
                      <h3 class="dish-name">${name}</h3>
                      <div class="dish-price">${item.price || ''}</div>
                    </div>
                    ${desc ? `<p class="dish-desc">${desc}</p>` : ''}
                  </div>

                  <!-- Multi-size / Variants Box -->
                  ${item.variants && item.variants.length > 0 ? `
                    <div class="variants-box">
                      ${item.variants.map(v => {
                        const vName = getHtmlLocalized(v.name)
                        return `<span class="variant-pill">${vName}: <strong>${v.price}</strong></span>`
                      }).join('')}
                    </div>
                  ` : ''}

                  <!-- Dietary & Allergen Badges -->
                  <div class="badge-group">
                    ${item.highlight ? `<span class="badge badge-highlight">⭐ ${primaryLang === 'en' ? 'Recommended' : 'Empfehlung'}</span>` : ''}
                    ${(item.diet || []).map(d => `
                      <span class="badge ${d === 'vegan' ? 'badge-vegan' : d === 'vegetarian' ? 'badge-veggie' : 'badge-gf'}">
                        ${d === 'vegan' ? '🌱 Vegan' : d === 'vegetarian' ? '🧀 Veggie' : d === 'glutenfree' ? '🌾 Glutenfree' : '🌙 Halal'}
                      </span>
                    `).join('')}
                    ${(item.allergens || []).map(a => `
                      <button type="button" class="badge" onclick="event.stopPropagation(); showAllergenPopup('${a}')" style="cursor:pointer;border:1px solid #CBD5E1;font-weight:900;background:#F1F5F9;color:var(--primary);" title="Allergen ${a} Details">
                        <strong>${a}</strong>
                      </button>
                    `).join('')}
                  </div>
                </div>
              </article>
            `
          }).join('')}
        </div>
      </section>
    `).join('')}

    <!-- ALLERGEN LEGEND -->
    <section class="allergen-legend">
      <h3 class="legend-title">⚠️ Allergene & Zusatzstoffe (Vollständige Legende)</h3>
      ${branding.allergenNotice ? `
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:14px;font-style:italic;background:#F9F6F0;padding:12px 14px;border-radius:10px;border-left:3px solid var(--secondary);line-height:1.45;">
          💬 ${branding.allergenNotice}
        </div>
      ` : ''}
      <div class="legend-grid">
        ${Object.entries(allergensLegend).map(([code, dict]) => {
          const label = typeof dict === 'object' ? (dict.de || dict.en) : dict
          return `<div style="cursor:pointer;padding:4px 6px;border-radius:6px;" onclick="showAllergenPopup('${code}')"><strong style="color:var(--primary);font-weight:900;">${code}:</strong> ${label}</div>`
        }).join('')}
      </div>
    </section>
  </main>

  <!-- ALLERGEN POPUP MODAL -->
  <div id="allergenModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);z-index:9999;align-items:center;justify-content:center;padding:20px;" onclick="closeAllergenPopup()">
    <div style="background:var(--modal-bg);color:var(--text-dark);border-radius:20px;padding:26px;max-width:360px;width:100%;text-align:center;box-shadow:0 20px 40px rgba(0,0,0,0.3);border:2px solid var(--primary);" onclick="event.stopPropagation()">
      <div id="popupAllergenCode" style="width:48px;height:48px;border-radius:50%;background:#F3E8FF;color:var(--primary);font-size:22px;font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;border:2px solid var(--primary);">A</div>
      <div id="popupAllergenTitle" style="font-size:16px;font-weight:900;color:var(--text-dark);margin-bottom:8px;">Allergen-Code</div>
      <div id="popupAllergenDesc" style="font-size:13px;color:var(--text-muted);line-height:1.5;margin-bottom:20px;">Beschreibung</div>
      <button type="button" onclick="closeAllergenPopup()" style="width:100%;padding:10px;border-radius:10px;background:var(--primary);color:#FFF;border:none;font-weight:800;cursor:pointer;">Schließen</button>
    </div>
  </div>

  <!-- DISH DETAIL MODAL -->
  <div id="dishModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);z-index:9998;align-items:center;justify-content:center;padding:16px;" onclick="closeDishModal()">
    <div style="background:var(--modal-bg);color:var(--text-dark);border:1px solid var(--border-color);border-radius:22px;max-width:480px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 25px 50px rgba(0,0,0,0.3);position:relative;" onclick="event.stopPropagation()">
      <div id="dishModalImgWrap" style="width:100%;height:200px;overflow:hidden;position:relative;background:#EEE;">
        <img id="dishModalImg" src="" style="width:100%;height:100%;object-fit:cover;">
        <button onclick="closeDishModal()" style="position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,0.6);border:none;color:#FFF;cursor:pointer;font-size:16px;font-weight:bold;">✕</button>
      </div>
      <div style="padding:22px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px;">
          <h2 id="dishModalName" style="font-size:20px;font-weight:900;color:var(--text-dark);margin:0;"></h2>
          <div id="dishModalPrice" style="font-size:18px;font-weight:900;color:var(--secondary);white-space:nowrap;"></div>
        </div>
        <p id="dishModalDesc" style="font-size:13px;color:var(--text-muted);line-height:1.5;margin-bottom:18px;"></p>
        
        <div style="background:var(--tag-bg);border:1px solid var(--border-color);border-radius:12px;padding:14px;margin-bottom:18px;">
          <div style="font-size:12px;font-weight:900;color:var(--text-dark);margin-bottom:6px;">⚠️ Allergene & Kennzeichnung:</div>
          <div id="dishModalAllergens" style="font-size:12px;color:var(--text-muted);line-height:1.4;"></div>
        </div>

        <button type="button" onclick="closeDishModal()" style="width:100%;padding:12px;border-radius:12px;background:var(--primary);color:#FFF;border:none;font-weight:800;font-size:13px;cursor:pointer;">Schließen</button>
      </div>
    </div>
  </div>

  <script>
    const ALLERGENS_DICT = ${JSON.stringify(allergensLegend)};

    function toggleTheme() {
      const html = document.documentElement;
      const current = html.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      const btn = document.getElementById('themeBtn');
      if (btn) btn.innerText = next === 'dark' ? '🌙 Dunkel' : '☀️ Hell';
    }

    function showAllergenPopup(code) {
      const modal = document.getElementById('allergenModal');
      const clean = (code || '').trim().toUpperCase();
      const info = ALLERGENS_DICT[clean] ? (ALLERGENS_DICT[clean].de || ALLERGENS_DICT[clean]) : 'Allergen Information auf Anfrage.';
      document.getElementById('popupAllergenCode').innerText = clean;
      document.getElementById('popupAllergenTitle').innerText = 'Allergen ' + clean;
      document.getElementById('popupAllergenDesc').innerText = info;
      modal.style.display = 'flex';
    }

    function closeAllergenPopup() {
      document.getElementById('allergenModal').style.display = 'none';
    }

    function openDishModal(card) {
      const name = decodeURIComponent(card.getAttribute('data-name') || '');
      const desc = decodeURIComponent(card.getAttribute('data-desc') || '');
      const price = decodeURIComponent(card.getAttribute('data-price') || '');
      const img = decodeURIComponent(card.getAttribute('data-img') || '');
      const allergensStr = card.getAttribute('data-allergens') || '';

      document.getElementById('dishModalName').innerText = name;
      document.getElementById('dishModalPrice').innerText = price;
      document.getElementById('dishModalDesc').innerText = desc || 'Frisch zubereitet mit ausgewählten Zutaten.';

      const imgEl = document.getElementById('dishModalImg');
      const imgWrap = document.getElementById('dishModalImgWrap');
      if (img) {
        imgEl.src = img;
        imgWrap.style.display = 'block';
      } else {
        imgWrap.style.display = 'none';
      }

      const allergensWrap = document.getElementById('dishModalAllergens');
      if (allergensStr) {
        const codes = allergensStr.split(',').filter(Boolean);
        allergensWrap.innerHTML = codes.map(c => {
          const dict = ALLERGENS_DICT[c];
          const text = dict ? (dict.de || dict) : 'Keine Information';
          return '<div><strong>' + c + ':</strong> ' + text + '</div>';
        }).join('');
      } else {
        allergensWrap.innerHTML = '<em>Keine meldepflichtigen Allergene deklariert.</em>';
      }

      document.getElementById('dishModal').style.display = 'flex';
    }

    function closeDishModal() {
      document.getElementById('dishModal').style.display = 'none';
    }
  </script>

  <!-- FOOTER -->
  <footer class="footer">
    <div class="footer-title">${branding.name || 'Restaurant'}</div>
    <p style="font-size:13px; color:#9CA3AF;">${branding.address || ''}</p>
    <div class="footer-links">
      ${branding.phone ? `<a href="tel:${branding.phone}" class="footer-a">📞 ${branding.phone}</a>` : ''}
      ${branding.email ? `<a href="mailto:${branding.email}" class="footer-a">✉️ ${branding.email}</a>` : ''}
      ${branding.instagram ? `<a href="https://instagram.com/${branding.instagram.replace('@', '')}" target="_blank" class="footer-a">📷 ${branding.instagram}</a>` : ''}
    </div>
    <div style="margin-top:20px; font-size:11px; color:#6B7280;">Powered by SCENVY Digital Menu Engine</div>
  </footer>

  <!-- FLOATING BUTTONS -->
  <div class="floating-container">
    ${branding.whatsapp ? `
      <a href="https://wa.me/${branding.whatsapp.replace(/\+/g, '')}" target="_blank" class="float-btn btn-wa" title="WhatsApp Chat">💬</a>
    ` : ''}
    <button onclick="scrollToTop()" class="float-btn btn-top" title="Nach oben">▲</button>
  </div>

  <script>
    function scrollToCat(id) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }

    function scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function filterMenu(query) {
      const term = query.toLowerCase().trim();
      document.querySelectorAll('.dish-card').forEach(card => {
        const text = card.getAttribute('data-search') || '';
        card.style.display = text.includes(term) ? 'flex' : 'none';
      });
    }

    document.addEventListener('DOMContentLoaded', () => {
      const sections = document.querySelectorAll('.category-section');
      const navTabs = document.querySelectorAll('.cat-tab');

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            const id = entry.target.id;
            navTabs.forEach(tab => {
              if (tab.getAttribute('data-cat') === id) {
                tab.classList.add('active');
                tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
              } else {
                tab.classList.remove('active');
              }
            });
          }
        });
      }, { threshold: 0.15 });

      sections.forEach(s => observer.observe(s));
    });
  </script>
</body>
</html>`
}
