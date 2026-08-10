import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import {
  useOrders,
  useUpdateOrderStatus,
  useServiceCalls,
  useUpdateServiceCallStatus,
  useSubmitOrder,
  useSubmitServiceCall,
  useLocations
} from '@/lib/db'
import { C, grad } from '@/tokens'
import {
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  Utensils,
  Receipt,
  UserCheck,
  Smartphone,
  RefreshCw,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Plus,
  Tv,
  ArrowLeft,
  AlertCircle
} from 'lucide-react'

export default function OrderManagementDashboard() {
  const { tenantId: paramTenantId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const activeTenantId = paramTenantId || user?.tenant_id || user?.tenantId || 'tenant-demo-1'

  const locationQueryParam = searchParams.get('location') || searchParams.get('locationId') || 'all'
  const [selectedLocId, setSelectedLocId] = useState(locationQueryParam)

  const [filter, setFilter] = useState('pending') // 'pending' | 'accepted' | 'all'
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [copied, setCopied] = useState(false)
  const [lastOrderCount, setLastOrderCount] = useState(0)

  // Realtime DB Hooks
  const { data: locations = [] } = useLocations(activeTenantId)
  const { data: rawOrders = [], isLoading: loadingOrders, refetch: refetchOrders } = useOrders(activeTenantId)
  const { data: rawCalls = [], isLoading: loadingCalls, refetch: refetchCalls } = useServiceCalls(activeTenantId)

  // Filter by selected location if specified
  const activeLocation = locations.find(l => l.id === selectedLocId || l.slug === selectedLocId)
  const orders = selectedLocId === 'all' 
    ? rawOrders 
    : rawOrders.filter(o => o.location_id === selectedLocId || (activeLocation && o.location_id === activeLocation.id))
  
  const serviceCalls = selectedLocId === 'all' 
    ? rawCalls 
    : rawCalls.filter(c => c.location_id === selectedLocId || (activeLocation && c.location_id === activeLocation.id))

  const updateOrderStatus = useUpdateOrderStatus()
  const updateCallStatus = useUpdateServiceCallStatus()
  const submitOrder = useSubmitOrder()
  const submitServiceCall = useSubmitServiceCall()

  // Filtered lists
  const pendingOrders = orders.filter(o => o.status === 'pending')
  const acceptedOrders = orders.filter(o => o.status === 'accepted')
  const completedOrders = orders.filter(o => o.status === 'done')

  const pendingCalls = serviceCalls.filter(c => c.status === 'pending')
  const completedCalls = serviceCalls.filter(c => c.status === 'done')

  // Audio effect on new order/call
  useEffect(() => {
    if (orders.length > lastOrderCount && lastOrderCount > 0 && soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3) // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5)
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.5)
      } catch (e) {
        // Audio fallback
      }
    }
    setLastOrderCount(orders.length)
  }, [orders.length, soundEnabled])

  const publicDashboardUrl = `${window.location.origin}/live-dashboard/${activeTenantId}`

  const copyLink = () => {
    navigator.clipboard.writeText(publicDashboardUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Demo helper: create a test order
  const handleTestOrder = () => {
    const tableNum = `Tisch ${Math.floor(Math.random() * 12 + 1)}`
    submitOrder.mutate({
      tenantId: activeTenantId,
      menuId: 'demo',
      tableNumber: tableNum,
      items: [
        { name: 'Pizza Margherita (Extra Käse)', qty: 1, price: '11.50 €' },
        { name: 'Aperol Spritz 0.2l', qty: 2, price: '15.00 €' }
      ],
      notes: 'Gäste bitten um schnellen Service',
      totalPrice: '26.50 €'
    })
  }

  // Demo helper: create a test call
  const handleTestCall = (type = 'waiter') => {
    const tableNum = `Tisch ${Math.floor(Math.random() * 12 + 1)}`
    submitServiceCall.mutate({
      tenantId: activeTenantId,
      tableNumber: tableNum,
      type,
      note: type === 'bill' ? 'Kartenzahlung gewünscht' : 'Kellner an den Tisch gerufen'
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A10', color: '#F3F4F6', fontFamily: "'Inter', sans-serif", padding: '20px 24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24, background: '#12121A', padding: '16px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to="/dashboard" style={{ textDecoration: 'none', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div>
            <div style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 800, letterSpacing: 1.5 }}>
              SCENVY LIVE MANAGEMENT DASHBOARD
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
              🛎️ Gastro Bestell- & Service-Zentrale
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Location Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)' }}>
            <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700 }}>Standort:</span>
            <select
              value={selectedLocId}
              onChange={(e) => {
                setSelectedLocId(e.target.value)
                setSearchParams(prev => {
                  if (e.target.value === 'all') prev.delete('location')
                  else prev.set('location', e.target.value)
                  return prev
                })
              }}
              style={{
                background: 'transparent',
                color: '#FFF',
                border: 'none',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all" style={{ background: '#12121A', color: '#FFF' }}>Alle Standorte</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id} style={{ background: '#12121A', color: '#FFF' }}>
                  📍 {loc.name} {loc.city ? `(${loc.city})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{ padding: '8px 14px', borderRadius: 10, background: soundEnabled ? 'rgba(139, 92, 246, 0.18)' : 'rgba(255,255,255,0.06)', border: `1px solid ${soundEnabled ? '#8B5CF6' : 'rgba(255,255,255,0.1)'}`, color: soundEnabled ? '#C4B5FD' : '#9CA3AF', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {soundEnabled ? <Volume2 size={16} color="#A78BFA" /> : <VolumeX size={16} />}
            {soundEnabled ? 'Ton Aktiv' : 'Stumm'}
          </button>

          {/* Refresh */}
          <button
            onClick={() => { refetchOrders(); refetchCalls() }}
            style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} /> Aktualisieren
          </button>

          {/* Copy Dashboard URL */}
          <button
            onClick={copyLink}
            style={{ padding: '8px 14px', borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)', color: '#FFF', border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Link kopiert!' : 'Tablet-Link kopieren'}
          </button>
        </div>
      </div>

      {/* Live KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#12121A', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 800, letterSpacing: 1 }}>OFFENE KELLNER-RUFE</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#FFF', marginTop: 4, display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
            <span>{pendingCalls.length}</span>
            <Bell size={28} color="#EF4444" style={{ opacity: 0.8 }} />
          </div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Dringender Tisch-Service</div>
        </div>

        <div style={{ background: '#12121A', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 800, letterSpacing: 1 }}>NEUE BESTELLUNGEN</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#FFF', marginTop: 4, display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
            <span>{pendingOrders.length}</span>
            <Utensils size={28} color="#F59E0B" style={{ opacity: 0.8 }} />
          </div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Warten auf POS-Übernahme</div>
        </div>

        <div style={{ background: '#12121A', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 11, color: '#10B981', fontWeight: 800, letterSpacing: 1 }}>ANGENOMMEN / IN PROZESS</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#FFF', marginTop: 4, display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
            <span>{acceptedOrders.length}</span>
            <CheckCircle2 size={28} color="#10B981" style={{ opacity: 0.8 }} />
          </div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Im POS gebucht</div>
        </div>

        <div style={{ background: '#12121A', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 11, color: '#A78BFA', fontWeight: 800, letterSpacing: 1 }}>TASTE / TEST SIMULATION</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button onClick={handleTestOrder} style={{ flex: 1, padding: '8px 6px', borderRadius: 8, background: 'rgba(139, 92, 246, 0.2)', border: '1px solid #8B5CF6', color: '#FFF', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
              + Test-Bestellung
            </button>
            <button onClick={() => handleTestCall('waiter')} style={{ flex: 1, padding: '8px 6px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', color: '#FFF', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
              + Kellner Ruf
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: URGENT SERVICE CALLS (KELLNER RUFEN & RECHNUNG) */}
      {pendingCalls.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#EF4444', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={18} /> Dringende Service-Anfragen ({pendingCalls.length})
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {pendingCalls.map(call => (
              <div
                key={call.id}
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '2px solid #EF4444',
                  borderRadius: 16,
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyIn: 'space-between',
                  gap: 12,
                  animation: 'pulse 2s infinite'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, background: '#EF4444', color: '#FFF', fontSize: 13, fontWeight: 900 }}>
                      {call.table_number || 'Tisch'}
                    </span>
                    <span style={{ fontSize: 12, color: '#FCA5A5', fontWeight: 800 }}>
                      {call.type === 'bill' ? '💳 RECHNUNG BITTE' : '🛎️ KELLNER RUFEN'}
                    </span>
                  </div>
                  {call.note && (
                    <div style={{ fontSize: 12, color: '#E5E7EB', marginTop: 6, fontWeight: 600 }}>
                      "{call.note}"
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
                    Anfrage um {new Date(call.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                  </div>
                </div>

                <button
                  onClick={() => updateCallStatus.mutate({ id: call.id, tenantId: activeTenantId, status: 'done' })}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    background: '#10B981',
                    color: '#FFF',
                    border: 'none',
                    fontWeight: 900,
                    fontSize: 12,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ✓ Erledigt
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
        <button
          onClick={() => setFilter('pending')}
          style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: filter === 'pending' ? '#8B5CF6' : 'rgba(255,255,255,0.06)', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
        >
          Offen ({pendingOrders.length})
        </button>
        <button
          onClick={() => setFilter('accepted')}
          style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: filter === 'accepted' ? '#8B5CF6' : 'rgba(255,255,255,0.06)', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
        >
          In POS gebucht ({acceptedOrders.length})
        </button>
        <button
          onClick={() => setFilter('all')}
          style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: filter === 'all' ? '#8B5CF6' : 'rgba(255,255,255,0.06)', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
        >
          Alle Bestellungen ({orders.length})
        </button>
      </div>

      {/* SECTION 2: ORDERS GRID */}
      {(() => {
        const displayedOrders = filter === 'pending' ? pendingOrders : filter === 'accepted' ? acceptedOrders : orders

        if (displayedOrders.length === 0) {
          return (
            <div style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 48, textAlign: 'center' }}>
              <Utensils size={48} color="#4B5563" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>Keine aktiven Bestellungen in diesem Filter</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
                Neue Bestellungen von Gästen erscheinen hier in Echtzeit.
              </div>
            </div>
          )
        }

        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 18 }}>
            {displayedOrders.map(ord => {
              const isPending = ord.status === 'pending'
              return (
                <div
                  key={ord.id}
                  style={{
                    background: '#12121A',
                    border: `2px solid ${isPending ? '#F59E0B' : 'rgba(16, 185, 129, 0.4)'}`,
                    borderRadius: 20,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isPending ? '0 0 20px rgba(245, 158, 11, 0.15)' : 'none'
                  }}
                >
                  <div>
                    {/* Header: Table & Time */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ padding: '6px 14px', borderRadius: 12, background: isPending ? '#F59E0B' : '#10B981', color: '#000', fontSize: 15, fontWeight: 900, letterSpacing: 0.5 }}>
                          {ord.table_number || 'Tisch'}
                        </span>
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.08)', color: '#9CA3AF', fontWeight: 700 }}>
                          {isPending ? 'OFFEN' : 'IM POS'}
                        </span>
                      </div>

                      <div style={{ fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={13} />
                        {new Date(ord.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                      </div>
                    </div>

                    {/* Ordered Items List */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 12, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#8B5CF6', marginBottom: 8, letterSpacing: 1 }}>
                        BESTELLTE GERICHTE & GETRÄNKE:
                      </div>
                      <div style={{ display: 'grid', gap: 8 }}>
                        {ord.items && ord.items.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, borderBottom: idx < ord.items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 22, height: 22, borderRadius: 6, background: '#7C3AED', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>
                                {item.qty || 1}x
                              </span>
                              <span style={{ fontWeight: 700, color: '#FFF' }}>{item.name}</span>
                            </div>
                            <span style={{ color: '#9CA3AF', fontWeight: 600 }}>{item.price}</span>
                          </div>
                        ))}
                      </div>

                      {/* Special Requests / Notes */}
                      {ord.notes && (
                        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed rgba(255,255,255,0.1)', fontSize: 12, color: '#FBBF24', fontStyle: 'italic' }}>
                          💡 Anmerkung: "{ord.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer: Price & Action */}
                  <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700 }}>GESAMTBETRAG</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#10B981' }}>{ord.total_price}</div>
                    </div>

                    {isPending ? (
                      <button
                        onClick={() => updateOrderStatus.mutate({ id: ord.id, tenantId: activeTenantId, status: 'accepted' })}
                        style={{
                          padding: '10px 18px',
                          borderRadius: 12,
                          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                          color: '#FFF',
                          border: 'none',
                          fontWeight: 900,
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                        }}
                      >
                        <CheckCircle2 size={16} /> In POS übernehmen
                      </button>
                    ) : (
                      <button
                        onClick={() => updateOrderStatus.mutate({ id: ord.id, tenantId: activeTenantId, status: 'done' })}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 10,
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: '#9CA3AF',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Archivieren / Erledigt
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}
    </div>
  )
}
