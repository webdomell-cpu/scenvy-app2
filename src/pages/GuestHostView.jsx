import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import {
  useLocations,
  useHostDepartments,
  useHostServices,
  useSubmitHostRequest,
  useHotelSettings,
  useHostRequests,
  useReels
} from '@/lib/db'
import { C } from '@/tokens'
import {
  ConciergeBell,
  Sparkles,
  Utensils,
  Wine,
  Wrench,
  Shirt,
  Compass,
  HelpCircle,
  Clock,
  Wifi,
  ChevronRight,
  ShoppingBag,
  CheckCircle2,
  X,
  Plus,
  Minus,
  Send,
  Building2,
  PhoneCall,
  MapPin,
  Calendar,
  AlertCircle,
  User,
  Hash,
  ArrowLeft,
  Info
} from 'lucide-react'

const ICON_MAP = {
  Sparkles: <Sparkles size={18} />,
  Utensils: <Utensils size={18} />,
  Wine: <Wine size={18} />,
  Wrench: <Wrench size={18} />,
  Shirt: <Shirt size={18} />,
  Compass: <Compass size={18} />,
  ConciergeBell: <ConciergeBell size={18} />,
  HelpCircle: <HelpCircle size={18} />
}

export default function GuestHostView() {
  const { locationId } = useParams()
  const [searchParams] = useSearchParams()
  const nav = useNavigate()

  // Room prefill from QR / URL params (?room=102 or ?r=102 or ?table=5)
  const roomQuery = searchParams.get('room') || searchParams.get('r') || searchParams.get('table') || ''
  const tenantQuery = searchParams.get('tenant') || searchParams.get('tenantId') || ''

  // Local state
  const [guestName, setGuestName] = useState(localStorage.getItem('scenvy_guest_name') || '')
  const [roomNumber, setRoomNumber] = useState(roomQuery || localStorage.getItem('scenvy_guest_room') || '')
  const [selectedDepartment, setSelectedDepartment] = useState('ALL')
  const [basket, setBasket] = useState([])
  const [isBasketOpen, setIsBasketOpen] = useState(false)
  const [orderNotes, setOrderNotes] = useState('')
  const [activeTab, setActiveTab] = useState('services') // 'services' | 'tracker' | 'info' | 'feedback'
  const [submittedRequestId, setSubmittedRequestId] = useState(null)
  const [activeCategory, setActiveCategory] = useState('ALL')

  // Rating & Direct Host Message State
  const [ratingStars, setRatingStars] = useState(5)
  const [feedbackText, setFeedbackText] = useState('')
  const [ratingSubmitted, setRatingSubmitted] = useState(false)

  // Find location details
  const tenantId = tenantQuery || 'tenant-demo-1'
  const { data: locations = [] } = useLocations(tenantId)
  const location = locations.find(l => l.id === locationId || l.slug === locationId) || { name: 'Hotel & Resort', id: locationId }

  const { data: settings = {} } = useHotelSettings(tenantId)
  const { data: rawDepartments = [] } = useHostDepartments(tenantId)
  const { data: rawServices = [] } = useHostServices(tenantId)
  const { data: menuReels = [] } = useReels(tenantId)
  const { data: userRequests = [] } = useHostRequests(tenantId)

  const submitRequest = useSubmitHostRequest()

  // Persist name & room
  useEffect(() => {
    if (guestName) localStorage.setItem('scenvy_guest_name', guestName)
    if (roomNumber) localStorage.setItem('scenvy_guest_room', roomNumber)
  }, [guestName, roomNumber])

  // Filter departments & services
  const departments = rawDepartments.filter(d => d.enabled !== false)

  // Integrate Scenvy Menu items into In-Room Dining / F&B department!
  const mappedMenuServices = menuReels.map(reel => ({
    id: `menu_${reel.id}`,
    department: 'IN_ROOM_DINING',
    category: 'Speisekarte',
    name: reel.title,
    description: reel.cta || 'Frisch aus unserer Hotelküche zubereitet.',
    price: reel.price || '12.50',
    currency: 'EUR',
    active: reel.status === 'live',
    type: 'ORDER',
    image: reel.mediaUrl || reel.posterUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
  }))

  const allServices = [...rawServices, ...mappedMenuServices]

  const filteredServices = allServices.filter(srv => {
    if (!srv.active) return false
    if (selectedDepartment !== 'ALL' && srv.department !== selectedDepartment) return false
    if (activeCategory !== 'ALL' && srv.category !== activeCategory) return false
    return true
  })

  // Get unique categories for selected department
  const availableCategories = ['ALL', ...new Set(
    allServices
      .filter(s => selectedDepartment === 'ALL' || s.department === selectedDepartment)
      .map(s => s.category)
      .filter(Boolean)
  )]

  // Basket Handlers
  const addToBasket = (item) => {
    setBasket(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { ...item, qty: 1 }]
    })
  }

  const removeFromBasket = (itemId) => {
    setBasket(prev => {
      const existing = prev.find(i => i.id === itemId)
      if (existing && existing.qty > 1) {
        return prev.map(i => i.id === itemId ? { ...i, qty: i.qty - 1 } : i)
      }
      return prev.filter(i => i.id !== itemId)
    })
  }

  const totalItemCount = basket.reduce((sum, item) => sum + item.qty, 0)
  const totalPriceNumber = basket.reduce((sum, item) => {
    const p = parseFloat((item.price || '0').replace(',', '.')) || 0
    return sum + (p * item.qty)
  }, 0)

  const handleOrderSubmit = async () => {
    if (!roomNumber.trim()) {
      alert('Bitte geben Sie Ihre Zimmernummer ein.')
      return
    }

    const firstItem = basket[0]
    const dept = firstItem ? firstItem.department : selectedDepartment !== 'ALL' ? selectedDepartment : 'GUEST_SERVICES'
    const reqType = firstItem ? firstItem.type : 'REQUEST'

    try {
      const res = await submitRequest.mutateAsync({
        tenantId,
        locationId,
        guestName: guestName.trim() || 'Gast',
        roomNumber: roomNumber.trim(),
        department: dept,
        requestType: reqType,
        items: basket.map(i => ({
          id: i.id,
          name: i.name,
          qty: i.qty,
          price: `${i.price} €`,
          category: i.category
        })),
        notes: orderNotes,
        totalPrice: `${totalPriceNumber.toFixed(2)} €`
      })

      setSubmittedRequestId(res.id)
      setBasket([])
      setIsBasketOpen(false)
      setOrderNotes('')
      setActiveTab('tracker')
    } catch (e) {
      alert('Fehler beim Absenden der Anfrage. Bitte erneut versuchen.')
    }
  }

  // Filter requests for current room
  const roomRequests = userRequests.filter(r => r.room_number === roomNumber || r.id === submittedRequestId)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B0D14',
      color: '#F3F4F6',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: 90,
      maxWidth: 540,
      margin: '0 auto',
      position: 'relative',
      boxShadow: '0 0 50px rgba(0,0,0,0.8)'
    }}>
      {/* Hotel Brand Header */}
      <header style={{
        background: 'linear-gradient(180deg, rgba(124,58,237,0.3) 0%, rgba(11,13,20,0.95) 100%)',
        padding: '24px 20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backdropFilter: 'blur(16px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              fontWeight: 900,
              fontSize: 20,
              boxShadow: '0 4px 16px rgba(124,58,237,0.4)'
            }}>
              <ConciergeBell size={22} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', letterSpacing: '-0.3px' }}>
                {settings.hotel_name || location.name}
              </div>
              <div style={{ fontSize: 11, color: '#A1A1AA', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={11} color="#7C3AED" /> {location.name || 'Hauptgebäude'}
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(124,58,237,0.18)',
            border: '1px solid rgba(124,58,237,0.4)',
            padding: '6px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 800,
            color: '#C084FC',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <Building2 size={13} />
            <span>Zimmer {roomNumber || '—'}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 12 }}>
          {[
            { id: 'services', label: 'Services', icon: <ConciergeBell size={13} /> },
            { id: 'tracker', label: `Status (${roomRequests.length})`, icon: <Clock size={13} /> },
            { id: 'info', label: 'Hotel Infos', icon: <Info size={13} /> },
            { id: 'feedback', label: 'An Host Senden', icon: <Send size={13} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                background: activeTab === tab.id ? '#7C3AED' : 'transparent',
                color: activeTab === tab.id ? '#FFF' : '#9CA3AF',
                fontWeight: activeTab === tab.id ? 800 : 500,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s ease'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Body Content */}
      <main style={{ padding: '16px 20px' }}>
        {/* TAB 1: SERVICE CATALOG & GUEST REQUEST FLOW */}
        {activeTab === 'services' && (
          <div>
            {/* Welcome Card & Room Inputs */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(124,58,237,0.1) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: 18,
              marginBottom: 20
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#C084FC', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} /> GUEST CONCIERGE & ROOM SERVICE
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', lineHeight: 1.4, marginBottom: 12 }}>
                {settings.welcome_message || 'Willkommen! Bestellen Sie bequem auf Ihr Zimmer.'}
              </div>

              {/* Quick Guest Name & Room Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, display: 'block', marginBottom: 4 }}>ZIMMERNUMMER *</label>
                  <input
                    type="text"
                    placeholder="z.B. 204"
                    value={roomNumber}
                    onChange={e => setRoomNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(124,58,237,0.4)',
                      background: 'rgba(0,0,0,0.4)',
                      color: '#FFF',
                      fontSize: 13,
                      fontWeight: 700,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, display: 'block', marginBottom: 4 }}>NAME DES GASTES</label>
                  <input
                    type="text"
                    placeholder="z.B. Herr Schmidt"
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(0,0,0,0.4)',
                      color: '#FFF',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Department Filter Bar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
                Abteilung wählen
              </div>
              <div style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 8,
                scrollbarWidth: 'none'
              }}>
                <button
                  onClick={() => { setSelectedDepartment('ALL'); setActiveCategory('ALL') }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 20,
                    border: selectedDepartment === 'ALL' ? '1px solid #7C3AED' : '1px solid rgba(255,255,255,0.1)',
                    background: selectedDepartment === 'ALL' ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
                    color: selectedDepartment === 'ALL' ? '#FFF' : '#A1A1AA',
                    fontSize: 12,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                >
                  🌐 Alle Services
                </button>

                {departments.map(dept => {
                  const isActive = selectedDepartment === dept.id
                  return (
                    <button
                      key={dept.id}
                      onClick={() => { setSelectedDepartment(dept.id); setActiveCategory('ALL') }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 20,
                        border: isActive ? `1px solid ${dept.color}` : '1px solid rgba(255,255,255,0.1)',
                        background: isActive ? `${dept.color}33` : 'rgba(255,255,255,0.04)',
                        color: isActive ? '#FFF' : '#A1A1AA',
                        fontSize: 12,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <span style={{ color: dept.color }}>{ICON_MAP[dept.icon] || <Sparkles size={14} />}</span>
                      <span>{dept.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Category Filter Pills */}
            {availableCategories.length > 2 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {availableCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 12,
                      border: 'none',
                      background: activeCategory === cat ? 'rgba(255,255,255,0.15)' : 'transparent',
                      color: activeCategory === cat ? '#FFF' : '#71717A',
                      fontSize: 11,
                      fontWeight: activeCategory === cat ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {cat === 'ALL' ? 'Alle Kategorien' : cat}
                  </button>
                ))}
              </div>
            )}

            {/* Service Items Catalog List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredServices.length === 0 ? (
                <div style={{
                  padding: 30,
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 16,
                  color: '#71717A',
                  fontSize: 13
                }}>
                  Keine Services in dieser Kategorie verfügbar.
                </div>
              ) : (
                filteredServices.map(srv => {
                  const inBasket = basket.find(b => b.id === srv.id)
                  const isFree = parseFloat((srv.price || '0').replace(',', '.')) === 0

                  return (
                    <div
                      key={srv.id}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 16,
                        padding: 14,
                        display: 'flex',
                        gap: 14,
                        alignItems: 'center',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      {srv.image && (
                        <img
                          src={srv.image}
                          alt={srv.name}
                          style={{
                            width: 76,
                            height: 76,
                            borderRadius: 12,
                            objectFit: 'cover',
                            flexShrink: 0
                          }}
                        />
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{
                            fontSize: 9,
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: srv.type === 'ORDER' ? 'rgba(249,115,22,0.2)' : 'rgba(124,58,237,0.2)',
                            color: srv.type === 'ORDER' ? '#F97316' : '#C084FC'
                          }}>
                            {srv.type === 'ORDER' ? 'SPEISE & GETRÄNK' : 'HOTEL SERVICE'}
                          </span>
                          <span style={{ fontSize: 10, color: '#71717A' }}>{srv.category}</span>
                        </div>

                        <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', lineHeight: 1.3, marginBottom: 4 }}>
                          {srv.name}
                        </div>

                        <div style={{ fontSize: 11, color: '#A1A1AA', lineHeight: 1.4, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {srv.description}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ fontSize: 14, fontWeight: 900, color: isFree ? '#10B981' : '#FFF' }}>
                            {isFree ? 'Kostenfrei' : `${srv.price} ${srv.currency || '€'}`}
                          </div>

                          {inBasket ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#7C3AED', padding: '4px 10px', borderRadius: 20 }}>
                              <button
                                onClick={() => removeFromBasket(srv.id)}
                                style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              >
                                <Minus size={14} />
                              </button>
                              <span style={{ fontSize: 13, fontWeight: 900, color: '#FFF' }}>{inBasket.qty}</span>
                              <button
                                onClick={() => addToBasket(srv)}
                                style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToBasket(srv)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: 18,
                                background: 'rgba(124,58,237,0.2)',
                                border: '1px solid rgba(124,58,237,0.5)',
                                color: '#C084FC',
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <Plus size={14} /> Hinzufügen
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LIVE REQUEST TRACKER */}
        {activeTab === 'tracker' && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color="#7C3AED" /> Meine Zimmeranfragen ({roomRequests.length})
            </div>

            {roomRequests.length === 0 ? (
              <div style={{
                padding: 40,
                textAlign: 'center',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <ConciergeBell size={36} color="#7C3AED" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
                <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Noch keine aktiven Anfragen</div>
                <div style={{ fontSize: 12, color: '#71717A', marginBottom: 16 }}>Wählen Sie oben einen Service oder In-Room Dining aus.</div>
                <button
                  onClick={() => setActiveTab('services')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 12,
                    background: '#7C3AED',
                    color: '#FFF',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  Zum Service-Katalog
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {roomRequests.map(req => {
                  const statusSteps = [
                    { key: 'NEW', label: 'Eingegangen' },
                    { key: 'ACCEPTED', label: 'Bestätigt' },
                    { key: 'IN_PROGRESS', label: 'In Arbeit' },
                    { key: 'ON_THE_WAY', label: 'Unterwegs' },
                    { key: 'COMPLETED', label: 'Erledigt' }
                  ]

                  const currentIdx = statusSteps.findIndex(s => s.key === req.status)
                  const isDone = req.status === 'COMPLETED'

                  return (
                    <div
                      key={req.id}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: isDone ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(124,58,237,0.3)',
                        borderRadius: 18,
                        padding: 18
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 800, color: '#A1A1AA' }}>
                            ANFRAGE ID #{req.id.slice(-6)} • {req.department}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginTop: 2 }}>
                            {req.items?.map(i => `${i.qty}x ${i.name}`).join(', ') || 'Service-Anfrage'}
                          </div>
                        </div>

                        <span style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: 20,
                          background: isDone ? 'rgba(16,185,129,0.2)' : 'rgba(124,58,237,0.2)',
                          color: isDone ? '#10B981' : '#C084FC'
                        }}>
                          {isDone ? '✓ Erledigt' : req.status}
                        </span>
                      </div>

                      {/* Status Progress Bar */}
                      <div style={{ margin: '16px 0 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          {statusSteps.map((s, idx) => {
                            const isReached = idx <= (currentIdx >= 0 ? currentIdx : 0)
                            return (
                              <span
                                key={s.key}
                                style={{
                                  fontSize: 9,
                                  fontWeight: isReached ? 800 : 500,
                                  color: isReached ? '#C084FC' : '#52525B',
                                  textAlign: 'center',
                                  flex: 1
                                }}
                              >
                                {s.label}
                              </span>
                            )
                          })}
                        </div>

                        <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.max(15, ((currentIdx + 1) / statusSteps.length) * 100)}%`,
                            background: isDone ? '#10B981' : 'linear-gradient(90deg, #7C3AED, #EC4899)',
                            transition: 'width 0.4s ease'
                          }} />
                        </div>
                      </div>

                      {req.notes && (
                        <div style={{ fontSize: 11, color: '#A1A1AA', background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 8, marginTop: 8 }}>
                          💬 Anmerkung: {req.notes}
                        </div>
                      )}

                      <div style={{ fontSize: 10, color: '#71717A', marginTop: 8, textAlign: 'right' }}>
                        Gesendet um {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Uhr
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: HOTEL INFORMATION & WI-FI */}
        {activeTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#C084FC', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Wifi size={16} /> W-LAN ZUGANG
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#71717A', fontWeight: 700 }}>NETZWERK (SSID)</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{settings.wifi_ssid || 'Scenvy_Guest_5G'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#71717A', fontWeight: 700 }}>PASSWORT</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#10B981' }}>{settings.wifi_pass || 'welcome2026'}</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#F97316', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={16} /> ZEITEN & INFORMATIONEN
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#A1A1AA' }}>Frühstückszeiten</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#FFF' }}>{settings.breakfast_time || '06:30 - 10:30 Uhr'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#A1A1AA' }}>Check-out Zeit</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#FFF' }}>{settings.checkout_time || '11:00 Uhr'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#A1A1AA' }}>Rezeption Durchwahl</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#3B82F6' }}>Taste '9' am Telefon</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SEND TO HOST / RATINGS & FEEDBACK */}
        {activeTab === 'feedback' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(236,72,153,0.1) 100%)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#C084FC', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Send size={15} /> DIREKT AN HOST / REZEPTION SENDEN
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 14 }}>
                Bewertung, Lob oder Wünsche an unser Team
              </div>

              {ratingSubmitted ? (
                <div style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid #10B981', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>🎉</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#10B981' }}>Vielen Dank für deine Nachricht!</div>
                  <div style={{ fontSize: 12, color: '#A1A1AA', marginTop: 4 }}>Das Host-Team hat deine Nachricht erhalten und kümmert sich sofort darum.</div>
                  <button onClick={() => setRatingSubmitted(false)} style={{ marginTop: 12, padding: '6px 14px', borderRadius: 8, background: '#10B981', color: '#000', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 12 }}>
                    Weitere Nachricht senden
                  </button>
                </div>
              ) : (
                <div>
                  {/* Star Rating selector */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#A1A1AA', display: 'block', marginBottom: 6 }}>DEINE BEWERTUNG</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setRatingStars(star)}
                          style={{
                            background: star <= ratingStars ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)',
                            border: star <= ratingStars ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 10,
                            padding: '8px 14px',
                            fontSize: 18,
                            cursor: 'pointer',
                            color: star <= ratingStars ? '#F59E0B' : '#71717A',
                            transition: 'all 0.2s'
                          }}
                        >
                          ★ {star}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback textarea */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#A1A1AA', display: 'block', marginBottom: 6 }}>DEINE NACHRICHT AN DEN HOST *</label>
                    <textarea
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      placeholder="Anregungen, Lob, Fragen zur Gästemappe oder Wünsche an die Rezeption..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: 12,
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(0,0,0,0.4)',
                        color: '#FFF',
                        fontSize: 13,
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={async () => {
                      if (!feedbackText.trim()) {
                        alert('Bitte geben Sie eine Nachricht ein.')
                        return
                      }
                      try {
                        const res = await submitRequest.mutateAsync({
                          tenantId,
                          locationId,
                          guestName: guestName.trim() || 'Gast',
                          roomNumber: roomNumber.trim() || '—',
                          department: 'GUEST_SERVICES',
                          requestType: 'FEEDBACK_RATING',
                          items: [{ name: `Bewertung: ${ratingStars} / 5 Sterne`, qty: 1, price: '—' }],
                          notes: `[${ratingStars}/5 Sterne]: ${feedbackText}`,
                          totalPrice: '—'
                        })
                        setSubmittedRequestId(res.id)
                        setFeedbackText('')
                        setRatingSubmitted(true)
                      } catch (e) {
                        alert('Fehler beim Senden. Bitte versuchen Sie es erneut.')
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
                      color: '#FFF',
                      border: 'none',
                      fontWeight: 900,
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 4px 16px rgba(124,58,237,0.4)'
                    }}
                  >
                    <Send size={16} /> An Host / Rezeption Senden
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Basket Drawer Bar */}
      {totalItemCount > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 540,
          background: 'rgba(18,20,32,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(124,58,237,0.4)',
          padding: '14px 20px',
          boxSizing: 'border-box',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 -10px 30px rgba(0,0,0,0.6)'
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#A1A1AA', fontWeight: 700 }}>
              {totalItemCount} {totalItemCount === 1 ? 'Artikel' : 'Artikel'} gewählt
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#FFF' }}>
              Gesamt: {totalPriceNumber.toFixed(2)} €
            </div>
          </div>

          <button
            onClick={() => setIsBasketOpen(true)}
            style={{
              padding: '10px 20px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
              color: '#FFF',
              border: 'none',
              fontWeight: 900,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(124,58,237,0.5)'
            }}
          >
            <ShoppingBag size={16} /> Warenkorb prüfen →
          </button>
        </div>
      )}

      {/* Basket Modal / Confirmation Drawer */}
      {isBasketOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#121420',
            borderTop: '1px solid rgba(124,58,237,0.5)',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            width: '100%',
            maxWidth: 540,
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: 24,
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingBag size={20} color="#7C3AED" /> Bestellanforderung
              </div>
              <button
                onClick={() => setIsBasketOpen(false)}
                style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Room Confirmation */}
            <div style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', padding: 14, borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#C084FC', marginBottom: 4 }}>LIEFERUNG AN ZIMMER</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#FFF' }}>
                Zimmer {roomNumber || 'Achtung: Bitte Zimmernummer angeben!'} {guestName && `• ${guestName}`}
              </div>
            </div>

            {/* Selected Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              {basket.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>{item.qty}x {item.name}</div>
                    <div style={{ fontSize: 11, color: '#71717A' }}>{item.category}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>
                    {(parseFloat((item.price || '0').replace(',', '.')) * item.qty).toFixed(2)} €
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Notes */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#A1A1AA', display: 'block', marginBottom: 6 }}>
                SONDERWÜNSCHE / ANMERKUNGEN (OPTIONAL)
              </label>
              <textarea
                placeholder="z.B. Bitte vor die Zimmertür stellen oder nicht klingeln..."
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                style={{
                  width: '100%',
                  height: 60,
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.4)',
                  color: '#FFF',
                  padding: 10,
                  fontSize: 12,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setIsBasketOpen(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)',
                  color: '#A1A1AA',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Zurück
              </button>
              <button
                onClick={handleOrderSubmit}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
                  color: '#FFF',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 6px 20px rgba(124,58,237,0.5)'
                }}
              >
                <Send size={16} /> Jetzt kostenpflichtig / verbindlich anfordern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
