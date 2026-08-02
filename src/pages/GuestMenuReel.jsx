import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchMenuReel } from '@/lib/db'
import { Phone, MessageCircle, MapPin, Instagram, Globe, Sparkles, ChevronUp, ArrowLeft, Edit3, Check, Plus, Trash2, Image, ShieldAlert, Download, QrCode, Share2, Copy } from 'lucide-react'
import { copyToClipboard } from '@/storage'
import JSZip from 'jszip'

export default function GuestMenuReel({ initialMenu, isPreview = false, onSaveMenu }) {
  const { menuId } = useParams()
  const nav = useNavigate()

  const [menu, setMenu] = useState(initialMenu || null)
  const [loading, setLoading] = useState(!initialMenu)
  const [lang, setLang] = useState('de') // 'de' | 'en'
  const [activeCat, setActiveCat] = useState('')
  const [selectedAllergen, setSelectedAllergen] = useState(null)
  const [editorMode, setEditorMode] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrType, setQrType] = useState('menu') // 'menu' | 'reel'
  const [toast, setToast] = useState(null)

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
    }
  }, [menuId, initialMenu])

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
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop'
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
    <div style={{ minHeight: '100vh', background: '#09090E', color: '#ECECF1', fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 100 }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Editor Bar if preview or inline editor mode enabled */}
      {(isPreview || onSaveMenu) && (
        <div style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'rgba(13,13,20,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 8px', borderRadius: 6, background: `${primaryColor}33`, color: primaryColor, border: `1px solid ${primaryColor}66` }}>
              AI MENU REEL & DIGITAL WEB
            </span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{branding.name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {onSaveMenu && (
              <button 
                onClick={() => {
                  onSaveMenu(menu)
                  notify('💾 Speisekarte erfolgreich gespeichert!')
                }} 
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 800, boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}
              >
                <Check size={14} /> Speisekarte Speichern
              </button>
            )}

            <button onClick={() => setEditorMode(!editorMode)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: `1px solid ${editorMode ? primaryColor : 'rgba(255,255,255,0.2)'}`, background: editorMode ? primaryColor : 'transparent', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              <Edit3 size={14} /> {editorMode ? 'WYSIWYG Beenden' : 'WYSIWYG Editor'}
            </button>

            <button onClick={() => setShowQrModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              <QrCode size={14} /> Dual QR & Links
            </button>

            <button onClick={downloadSingleHtml} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: `1px solid ${secondaryColor}`, background: `${secondaryColor}22`, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              <Download size={14} /> Standalone HTML
            </button>

            <button onClick={downloadZip} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              <Download size={14} /> ZIP Export
            </button>
          </div>
        </div>
      )}

      {/* Header Branding Banner */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '36px 20px 24px', background: `linear-gradient(180deg, ${primaryColor}22 0%, #09090E 100%)`, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          {/* Top Row: Language & Back */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            {isPreview ? (
              <span style={{ fontSize: 11, color: '#A1A1AA', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Sparkles size={13} color={primaryColor} /> Dynamic Preview
              </span>
            ) : (
              <span style={{ fontSize: 11, color: '#A1A1AA' }}>scenvy Digital Menu</span>
            )}

            {/* Language Switcher */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
              <button onClick={() => setLang('de')} style={{ padding: '4px 10px', borderRadius: 16, border: 'none', background: lang === 'de' ? primaryColor : 'transparent', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                🇩🇪 DE
              </button>
              <button onClick={() => setLang('en')} style={{ padding: '4px 10px', borderRadius: 16, border: 'none', background: lang === 'en' ? primaryColor : 'transparent', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                🇬🇧 EN
              </button>
            </div>
          </div>

          {/* Logo or Icon */}
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.name} style={{ width: 72, height: 72, borderRadius: 20, objectFit: 'cover', margin: '0 auto 14px', border: `2px solid ${primaryColor}` }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 28, fontWeight: 900, boxShadow: `0 10px 30px ${primaryColor}44` }}>
              🍽️
            </div>
          )}

          <h1 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 6px', letterSpacing: -0.5, color: '#FFF' }}>
            {branding.name || 'Gourmet Restaurant'}
          </h1>
          {branding.address && (
            <div style={{ fontSize: 12, color: '#A1A1AA', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 14 }}>
              <MapPin size={13} color={secondaryColor} /> {branding.address}
            </div>
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
      <div className="hide-scrollbar" style={{ position: 'sticky', top: 0, zIndex: 900, background: 'rgba(9,9,14,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px', overflowX: 'auto', display: 'flex', gap: 8 }}>
        {categories.map((cat) => {
          const catName = typeof cat.name === 'object' ? cat.name[lang] || cat.name.de : cat.name
          const isActive = activeCat === cat.id
          return (
            <button key={cat.id} onClick={() => scrollToCat(cat.id)} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 24, border: `1px solid ${isActive ? primaryColor : 'rgba(255,255,255,0.1)'}`, background: isActive ? primaryColor : 'rgba(255,255,255,0.04)', color: isActive ? '#FFF' : '#A1A1AA', fontSize: 13, fontWeight: isActive ? 800 : 500, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}>
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
          const catName = typeof cat.name === 'object' ? (cat.name[lang] || cat.name.de || cat.name.en || Object.values(cat.name)[0]) : (cat.name || 'Kategorie')
          return (
            <div key={cat.id || catIdx} id={cat.id} style={{ marginBottom: 36, scrollMarginTop: 110, animation: 'fadeIn 0.4s ease' }}>
              {/* Category Title */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 8, borderBottom: `2px solid ${primaryColor}44` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>{cat.icon || '🍴'}</span>
                  {editorMode ? (
                    <input value={catName} onChange={(e) => updateCategoryName(catIdx, e.target.value)} style={{ fontSize: 20, fontWeight: 800, background: 'rgba(255,255,255,0.1)', border: `1px solid ${primaryColor}`, color: '#FFF', borderRadius: 8, padding: '4px 8px', outline: 'none' }} />
                  ) : (
                    <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#FFF' }}>{catName}</h2>
                  )}
                </div>

                {editorMode && (
                  <button onClick={() => addItemToCategory(catIdx)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: primaryColor, color: '#FFF', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                    <Plus size={13} /> Gericht hinzufügen
                  </button>
                )}
              </div>

              {/* Items List */}
              <div style={{ display: 'grid', gap: 16 }}>
                {cat.items?.map((item, itemIdx) => {
                  const itemName = typeof item.name === 'object' ? (item.name[lang] || item.name.de || item.name.en || Object.values(item.name)[0]) : (item.name || 'Gericht')
                  const itemDesc = typeof item.description === 'object' ? (item.description[lang] || item.description.de || item.description.en || Object.values(item.description)[0]) : (item.description || '')

                  return (
                    <div key={item.id || itemIdx} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: item.highlight ? `1px solid ${primaryColor}88` : '1px solid rgba(255,255,255,0.07)', padding: 16, display: 'flex', gap: 14, position: 'relative', overflow: 'hidden', transition: 'all 0.2s', boxShadow: item.highlight ? `0 4px 20px ${primaryColor}15` : 'none' }}>
                      {/* Highlight Ribbon */}
                      {item.highlight && (
                        <div style={{ position: 'absolute', top: 0, right: 0, background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, color: '#FFF', fontSize: 9, fontWeight: 800, padding: '3px 10px 3px 8px', borderRadius: '0 16px 0 10px', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                          ⭐ Empfehlung
                        </div>
                      )}

                      {/* Cover Image */}
                      {item.imageUrl && (
                        <div style={{ width: 90, height: 90, borderRadius: 12, flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                          <img 
                            src={item.imageUrl} 
                            alt={itemName} 
                            onError={(e) => { e.target.onerror=null; e.target.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop' }} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        </div>
                      )}

                      {/* Content details */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, paddingRight: item.highlight ? 60 : 0 }}>
                            {editorMode ? (
                              <input value={itemName} onChange={(e) => updateItemField(catIdx, itemIdx, 'name', e.target.value)} style={{ fontSize: 15, fontWeight: 700, background: 'rgba(255,255,255,0.1)', border: `1px solid ${primaryColor}`, color: '#FFF', borderRadius: 6, padding: '2px 6px', width: '100%' }} />
                            ) : (
                              <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>{itemName}</div>
                            )}

                            {!editorMode && (
                              <div style={{ fontSize: 15, fontWeight: 800, color: secondaryColor, whiteSpace: 'nowrap' }}>
                                {item.price}
                              </div>
                            )}
                          </div>

                          {editorMode ? (
                            <textarea value={itemDesc} onChange={(e) => updateItemField(catIdx, itemIdx, 'description', e.target.value)} rows={2} style={{ fontSize: 12, background: 'rgba(255,255,255,0.1)', border: `1px solid ${primaryColor}`, color: '#FFF', borderRadius: 6, padding: '4px 6px', width: '100%', marginTop: 6, outline: 'none' }} />
                          ) : (
                            <div style={{ fontSize: 12, color: '#A1A1AA', marginTop: 4, lineHeight: 1.4 }}>
                              {itemDesc}
                            </div>
                          )}
                        </div>

                        {/* Price editor field */}
                        {editorMode && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                            <span style={{ fontSize: 11, color: '#A1A1AA' }}>Preis:</span>
                            <input value={item.price} onChange={(e) => updateItemField(catIdx, itemIdx, 'price', e.target.value)} style={{ fontSize: 13, fontWeight: 700, background: 'rgba(255,255,255,0.1)', border: `1px solid ${secondaryColor}`, color: secondaryColor, borderRadius: 6, padding: '2px 6px', width: 90 }} />
                          </div>
                        )}

                        {/* Variants (e.g., S / L) */}
                        {item.variants && item.variants.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                            {item.variants.map((v, vIdx) => {
                              const vName = typeof v.name === 'object' ? v.name[lang] || v.name.de : v.name
                              return (
                                <span key={vIdx} style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#D4D4D8' }}>
                                  {vName}: <strong style={{ color: secondaryColor }}>{v.price}</strong>
                                </span>
                              )
                            })}
                          </div>
                        )}

                        {/* Badges: Diet & Allergens */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                          {item.diet?.map((d) => (
                            <span key={d} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 12, background: d === 'vegan' ? '#10B98122' : '#F59E0B22', color: d === 'vegan' ? '#10B981' : '#F59E0B', border: `1px solid ${d === 'vegan' ? '#10B98144' : '#F59E0B44'}` }}>
                              {d === 'vegan' ? '🌱 Vegan' : d === 'vegetarian' ? '🧀 Veggie' : d === 'glutenfree' ? '🌾 Glutenfrei' : '🌙 Halal'}
                            </span>
                          ))}

                          {item.allergens?.map((a) => (
                            <button key={a} onClick={() => setSelectedAllergen(a)} style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.1)', color: '#A1A1AA', border: 'none', cursor: 'pointer' }} title="Allergen Info">
                              {a}
                            </button>
                          ))}
                        </div>

                        {editorMode && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
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

        {/* Allergen Legend at Bottom */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', padding: 20, marginTop: 40 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldAlert size={16} color={secondaryColor} /> {lang === 'de' ? 'Allergene & Zusatzstoffe' : 'Allergens & Additives'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {Object.entries(allergensLegend).map(([code, dict]) => {
              const label = typeof dict === 'object' ? dict[lang] || dict.de : dict
              return (
                <div key={code} style={{ fontSize: 11, color: '#A1A1AA', display: 'flex', gap: 6 }}>
                  <strong style={{ color: primaryColor, minWidth: 16 }}>{code}:</strong> <span>{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {branding.whatsapp && (
          <a href={`https://wa.me/${branding.whatsapp.replace(/\+/g, '')}`} target="_blank" rel="noreferrer" style={{ width: 48, height: 48, borderRadius: '50%', background: '#25D366', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(37,211,102,0.4)', textDecoration: 'none' }}>
            <MessageCircle size={24} />
          </a>
        )}
        <button onClick={scrollToTop} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ChevronUp size={20} />
        </button>
      </div>

      {/* Allergen Modal */}
      {selectedAllergen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedAllergen(null)}>
          <div style={{ background: '#181824', border: `1px solid ${primaryColor}`, borderRadius: 20, padding: 24, maxWidth: 360, width: '100%', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${primaryColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: primaryColor, fontSize: 20, fontWeight: 900 }}>
              {selectedAllergen}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>
              Allergen {selectedAllergen}
            </div>
            <div style={{ fontSize: 13, color: '#A1A1AA', marginBottom: 20 }}>
              {allergensLegend[selectedAllergen]?.[lang] || allergensLegend[selectedAllergen]?.de || 'Information auf Anfrage bei unseren Servicemitarbeitern.'}
            </div>
            <button onClick={() => setSelectedAllergen(null)} style={{ padding: '10px 24px', borderRadius: 12, background: primaryColor, color: '#FFF', border: 'none', fontWeight: 700, cursor: 'pointer', width: '100%' }}>
              Schließen
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

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${branding.name || 'Digital Menu'} — Speisekarte</title>
  
  <!-- Embedded Editable Menu Data -->
  <script>
    window.MENU_DATA = ${JSON.stringify(menu, null, 2)};
  </script>

  <style>
    :root {
      --primary: ${primaryColor};
      --secondary: ${secondaryColor};
      --bg-cream: #FAF7F2;
      --card-bg: #FFFFFF;
      --text-dark: #1F2937;
      --text-muted: #6B7280;
      --border-color: #E5E7EB;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      background-color: var(--bg-cream);
      color: var(--text-dark);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      padding-bottom: 90px;
    }

    h1, h2, h3, .brand-title {
      font-family: "Georgia", "Playfair Display", serif;
    }

    /* HEADER */
    .header {
      background: linear-gradient(180deg, #F3ECE1 0%, #FAF7F2 100%);
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
      background: #FFFFFF;
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
      background: rgba(250, 247, 242, 0.95);
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
      background: #FFFFFF;
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
    <h1 class="brand-title">${branding.name || 'Restaurant'}</h1>
    <p class="brand-sub">${branding.address || ''}</p>
    <div class="contact-bar">
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
        ${c.icon || '🍴'} ${typeof c.name === 'object' ? (c.name.de || c.name.en) : c.name}
      </button>
    `).join('')}
  </nav>

  <!-- MENU CONTENT -->
  <main class="container">
    ${categories.map((cat) => `
      <section id="${cat.id}" class="category-section">
        <h2 class="category-title">
          <span>${cat.icon || '🍴'}</span>
          <span>${typeof cat.name === 'object' ? (cat.name.de || cat.name.en) : cat.name}</span>
        </h2>
        
        <div class="dish-grid">
          ${(cat.items || []).map((item) => {
            const name = typeof item.name === 'object' ? (item.name.de || item.name.en) : item.name
            const desc = typeof item.description === 'object' ? (item.description.de || item.description.en) : item.description
            
            return `
              <article class="dish-card ${item.highlight ? 'highlight' : ''}" data-search="${(name + ' ' + desc + ' ' + (item.price || '')).toLowerCase()}">
                ${item.imageUrl ? `<img src="${item.imageUrl}" class="dish-img" alt="${name}" loading="lazy">` : ''}
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
                        const vName = typeof v.name === 'object' ? (v.name.de || v.name.en) : v.name
                        return `<span class="variant-pill">${vName}: <strong>${v.price}</strong></span>`
                      }).join('')}
                    </div>
                  ` : ''}

                  <!-- Dietary & Allergen Badges -->
                  <div class="badge-group">
                    ${item.highlight ? `<span class="badge badge-highlight">⭐ Empfehlung</span>` : ''}
                    ${(item.diet || []).map(d => `
                      <span class="badge ${d === 'vegan' ? 'badge-vegan' : d === 'vegetarian' ? 'badge-veggie' : 'badge-gf'}">
                        ${d === 'vegan' ? '🌱 Vegan' : d === 'vegetarian' ? '🧀 Veggie' : d === 'glutenfree' ? '🌾 Glutenfrei' : '🌙 Halal'}
                      </span>
                    `).join('')}
                    ${(item.allergens || []).map(a => `<span class="badge">${a}</span>`).join('')}
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
      <h3 class="legend-title">⚠️ Allergene & Zusatzstoffe</h3>
      <div class="legend-grid">
        ${Object.entries(allergensLegend).map(([code, dict]) => {
          const label = typeof dict === 'object' ? (dict.de || dict.en) : dict
          return `<div><strong style="color:var(--primary);">${code}:</strong> ${label}</div>`
        }).join('')}
      </div>
    </section>
  </main>

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
