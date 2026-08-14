import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import {
  useOrders,
  useUpdateOrderStatus,
  useServiceCalls,
  useUpdateServiceCallStatus,
  useSubmitOrder,
  useSubmitServiceCall,
  useLocations,
  useHostRequests,
  useUpdateHostRequestStatus,
  useSubmitHostRequest
} from '@/lib/db'
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
  AlertCircle,
  ConciergeBell,
  Layers,
  Building2,
  User,
  Sparkles,
  Wrench,
  Shirt,
  Compass,
  Maximize2,
  Minimize2,
  Search,
  CheckSquare,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Flame,
  Wine
} from 'lucide-react'

// Department definitions with icons, titles, and color tokens
const DEPARTMENTS = {
  GASTRONOMIE: {
    id: 'GASTRONOMIE',
    title: 'Gastronomie & F&B',
    shortTitle: 'Gastronomie',
    sub: 'Küche, Bar & In-Room Dining',
    icon: <Utensils size={18} />,
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: '#F59E0B',
    badgeColor: '#F59E0B'
  },
  HOUSEKEEPING: {
    id: 'HOUSEKEEPING',
    title: 'Housekeeping',
    shortTitle: 'Housekeeping',
    sub: 'Zimmer, Wäsche & Amenities',
    icon: <Sparkles size={18} />,
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10B981',
    badgeColor: '#10B981'
  },
  ENGINEERING: {
    id: 'ENGINEERING',
    title: 'Engineering & Technik',
    shortTitle: 'Technik',
    sub: 'Wartung, Klima, TV & Reparaturen',
    icon: <Wrench size={18} />,
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: '#3B82F6',
    badgeColor: '#3B82F6'
  },
  FRONT_OFFICE: {
    id: 'FRONT_OFFICE',
    title: 'Front Office & Concierge',
    shortTitle: 'Front Office',
    sub: 'Rezeption, Weckruf, Taxi & Guest Services',
    icon: <ConciergeBell size={18} />,
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.12)',
    borderColor: '#8B5CF6',
    badgeColor: '#8B5CF6'
  }
}

// Sound chime generator using Web Audio API
function playChimeSound(type = 'new_order') {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()

    if (type === 'urgent') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(880, audioCtx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15)
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.45)
    } else {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.25) // A5
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.5)
    }
  } catch (e) {
    console.warn('Audio playback notice:', e)
  }
}

// Elapsed time formatter
function formatElapsedTime(isoString) {
  if (!isoString) return 'Gerade eben'
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMins = Math.max(0, Math.floor(diffMs / (1000 * 60)))
  if (diffMins === 0) return 'Gerade eben'
  if (diffMins === 1) return 'Vor 1 Min'
  if (diffMins < 60) return `Vor ${diffMins} Min`
  const hours = Math.floor(diffMins / 60)
  return `Vor ${hours}h ${diffMins % 60}m`
}

export default function OrderManagementDashboard({ embedded = false, activeTenantId: propTenantId }) {
  const { tenantId: paramTenantId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const activeTenantId = propTenantId || paramTenantId || user?.tenant_id || user?.tenantId || 'tenant-demo-1'

  const locationQueryParam = searchParams.get('location') || searchParams.get('locationId') || 'all'
  const [selectedLocId, setSelectedLocId] = useState(locationQueryParam)

  // Display Mode & Department View
  // 'MASTER' = Multi-column Board across all departments
  // 'GASTRONOMIE' | 'HOUSEKEEPING' | 'ENGINEERING' | 'FRONT_OFFICE'
  const [activeDeptView, setActiveDeptView] = useState('MASTER')

  // Gastro Origin Sub-Filter: 'ALL' | 'TABLES' (Restaurant/Bar) | 'ROOMS' (In-Room Dining)
  const [gastroOriginFilter, setGastroOriginFilter] = useState('ALL')

  // Status Filter: 'pending' (Open & In Progress) | 'all' | 'completed'
  const [statusFilter, setStatusFilter] = useState('pending')

  // Search & Fullscreen
  const [searchQuery, setSearchQuery] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [copied, setCopied] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [lastTotalCount, setLastTotalCount] = useState(0)

  // Live Digital Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Realtime DB Hooks
  const { data: locations = [] } = useLocations(activeTenantId)
  const { data: rawOrders = [], isLoading: loadingOrders, refetch: refetchOrders } = useOrders(activeTenantId)
  const { data: rawCalls = [], isLoading: loadingCalls, refetch: refetchCalls } = useServiceCalls(activeTenantId)
  const { data: rawHostReqs = [], isLoading: loadingHostReqs, refetch: refetchHostReqs } = useHostRequests(activeTenantId)

  // Location filter
  const activeLocation = locations.find(l => l.id === selectedLocId || l.slug === selectedLocId)
  
  const orders = selectedLocId === 'all' 
    ? rawOrders 
    : rawOrders.filter(o => o.location_id === selectedLocId || (activeLocation && o.location_id === activeLocation.id))
  
  const serviceCalls = selectedLocId === 'all' 
    ? rawCalls 
    : rawCalls.filter(c => c.location_id === selectedLocId || (activeLocation && c.location_id === activeLocation.id))

  const hostRequests = selectedLocId === 'all'
    ? rawHostReqs
    : rawHostReqs.filter(r => r.location_id === selectedLocId || (activeLocation && r.location_id === activeLocation.id))

  // Mutations
  const updateOrderStatus = useUpdateOrderStatus()
  const updateCallStatus = useUpdateServiceCallStatus()
  const updateHostRequestStatus = useUpdateHostRequestStatus()
  const submitOrder = useSubmitOrder()
  const submitServiceCall = useSubmitServiceCall()
  const submitHostRequest = useSubmitHostRequest()

  // ──────────────────────────────────────────────────────────
  // UNIFIED ITEM CLASSIFICATION BY HOTEL DEPARTMENT
  // ──────────────────────────────────────────────────────────
  const unifiedTickets = useMemo(() => {
    const list = []

    // 1. Table Orders -> GASTRONOMIE (Origin: TABLE)
    orders.forEach(o => {
      list.push({
        id: `ord_${o.id}`,
        rawId: o.id,
        source: 'ORDER',
        department: 'GASTRONOMIE',
        originType: 'TABLE',
        title: o.table_number || 'Tisch',
        subtitle: 'Restaurant / Bar Gast',
        createdAt: o.created_at || new Date().toISOString(),
        status: o.status === 'done' ? 'COMPLETED' : o.status === 'accepted' ? 'IN_PROGRESS' : 'NEW',
        items: o.items || [],
        notes: o.notes || '',
        totalPrice: o.total_price || '0.00 €',
        urgent: false,
        rawObj: o
      })
    })

    // 2. Service Calls (Waiter / Bill) -> GASTRONOMIE (Urgent)
    serviceCalls.forEach(c => {
      list.push({
        id: `call_${c.id}`,
        rawId: c.id,
        source: 'SERVICE_CALL',
        department: 'GASTRONOMIE',
        originType: 'TABLE',
        title: c.table_number || 'Tisch',
        subtitle: c.type === 'bill' ? '💳 RECHNUNGS-WUNSCH' : '🛎️ KELLNER-RUF',
        createdAt: c.created_at || new Date().toISOString(),
        status: c.status === 'done' ? 'COMPLETED' : 'NEW',
        items: [],
        notes: c.note || (c.type === 'bill' ? 'Gast wünscht die Rechnung / Zahlung am Tisch' : 'Gast bittet um Service am Tisch'),
        totalPrice: '',
        urgent: true,
        rawObj: c
      })
    })

    // 3. SCENVY Host Requests -> Mapped to specific hotel department
    hostRequests.forEach(r => {
      const rawDept = (r.department || 'GUEST_SERVICES').toUpperCase()
      let deptKey = 'FRONT_OFFICE'
      let originType = 'ROOM'

      if (rawDept === 'IN_ROOM_DINING' || rawDept === 'F&B' || rawDept === 'GASTRONOMIE' || (r.items && r.items.length > 0)) {
        deptKey = 'GASTRONOMIE'
        originType = 'ROOM'
      } else if (rawDept === 'HOUSEKEEPING' || rawDept === 'CLEANING') {
        deptKey = 'HOUSEKEEPING'
      } else if (rawDept === 'MAINTENANCE' || rawDept === 'ENGINEERING' || rawDept === 'TECHNIK') {
        deptKey = 'ENGINEERING'
      } else {
        deptKey = 'FRONT_OFFICE'
      }

      list.push({
        id: `host_${r.id}`,
        rawId: r.id,
        source: 'HOST_REQUEST',
        department: deptKey,
        originType: originType,
        title: r.room_number ? `Zimmer ${r.room_number}` : 'Zimmer',
        subtitle: r.guest_name ? `Gast: ${r.guest_name}` : 'Hotelgast',
        createdAt: r.created_at || new Date().toISOString(),
        status: r.status === 'COMPLETED' ? 'COMPLETED' : (r.status === 'IN_PROGRESS' || r.status === 'ACCEPTED') ? 'IN_PROGRESS' : 'NEW',
        items: r.items || [],
        notes: r.notes || '',
        totalPrice: r.total_price || '',
        urgent: r.request_type === 'INCIDENT' || r.request_type === 'URGENT',
        rawObj: r
      })
    })

    // Sort newest first, with urgent pending items elevated
    return list.sort((a, b) => {
      if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1
      if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1
      if (a.urgent && !b.urgent) return -1
      if (!a.urgent && b.urgent) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [orders, serviceCalls, hostRequests])

  // Sound chime trigger on new tickets
  useEffect(() => {
    const pendingTotal = unifiedTickets.filter(t => t.status !== 'COMPLETED').length
    if (pendingTotal > lastTotalCount && lastTotalCount > 0 && soundEnabled) {
      const hasUrgent = unifiedTickets.some(t => t.status === 'NEW' && t.urgent)
      playChimeSound(hasUrgent ? 'urgent' : 'new_order')
    }
    setLastTotalCount(pendingTotal)
  }, [unifiedTickets, soundEnabled])

  // Department Count Metrics
  const deptMetrics = useMemo(() => {
    const metrics = {
      GASTRONOMIE: { total: 0, pending: 0, inProgress: 0, tables: 0, rooms: 0 },
      HOUSEKEEPING: { total: 0, pending: 0, inProgress: 0 },
      ENGINEERING: { total: 0, pending: 0, inProgress: 0 },
      FRONT_OFFICE: { total: 0, pending: 0, inProgress: 0 },
      ALL: { total: 0, pending: 0, inProgress: 0, completed: 0 }
    }

    unifiedTickets.forEach(t => {
      const d = t.department
      const isPending = t.status === 'NEW'
      const isInProg = t.status === 'IN_PROGRESS'
      const isComp = t.status === 'COMPLETED'

      metrics.ALL.total++
      if (isPending) metrics.ALL.pending++
      if (isInProg) metrics.ALL.inProgress++
      if (isComp) metrics.ALL.completed++

      if (metrics[d]) {
        metrics[d].total++
        if (isPending) metrics[d].pending++
        if (isInProg) metrics[d].inProgress++
        if (d === 'GASTRONOMIE') {
          if (t.originType === 'TABLE') metrics.GASTRONOMIE.tables++
          if (t.originType === 'ROOM') metrics.GASTRONOMIE.rooms++
        }
      }
    })

    return metrics
  }, [unifiedTickets])

  // Filtered Tickets according to active view & filters
  const getFilteredTicketsForDept = (deptKey) => {
    return unifiedTickets.filter(t => {
      if (t.department !== deptKey) return false
      
      // Gastro origin sub-filter
      if (deptKey === 'GASTRONOMIE') {
        if (gastroOriginFilter === 'TABLES' && t.originType !== 'TABLE') return false
        if (gastroOriginFilter === 'ROOMS' && t.originType !== 'ROOM') return false
      }

      // Status filter
      if (statusFilter === 'pending' && t.status === 'COMPLETED') return false
      if (statusFilter === 'completed' && t.status !== 'COMPLETED') return false

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = t.title.toLowerCase().includes(q)
        const matchSub = t.subtitle.toLowerCase().includes(q)
        const matchNotes = (t.notes || '').toLowerCase().includes(q)
        const matchItems = (t.items || []).some(i => (i.name || '').toLowerCase().includes(q))
        if (!matchTitle && !matchSub && !matchNotes && !matchItems) return false
      }

      return true
    })
  }

  // ──────────────────────────────────────────────────────────
  // ONE-CLICK STATUS ADVANCE HANDLERS
  // ──────────────────────────────────────────────────────────
  const handleAdvanceStatus = (ticket, targetStatus) => {
    if (ticket.source === 'ORDER') {
      const dbStatus = targetStatus === 'COMPLETED' ? 'done' : targetStatus === 'IN_PROGRESS' ? 'accepted' : 'pending'
      updateOrderStatus.mutate({ id: ticket.rawId, tenantId: activeTenantId, status: dbStatus })
    } else if (ticket.source === 'SERVICE_CALL') {
      const dbStatus = targetStatus === 'COMPLETED' ? 'done' : 'pending'
      updateCallStatus.mutate({ id: ticket.rawId, tenantId: activeTenantId, status: dbStatus })
    } else if (ticket.source === 'HOST_REQUEST') {
      updateHostRequestStatus.mutate({ id: ticket.rawId, tenantId: activeTenantId, status: targetStatus })
    }
  }

  // ──────────────────────────────────────────────────────────
  // SIMULATION HELPERS FOR ALL DEPARTMENTS
  // ──────────────────────────────────────────────────────────
  const testSimulation = (dept) => {
    const locId = selectedLocId === 'all' ? 'loc1' : selectedLocId

    if (dept === 'GASTRO_TABLE') {
      const tableNum = `Tisch ${Math.floor(Math.random() * 12 + 1)}`
      submitOrder.mutate({
        tenantId: activeTenantId,
        menuId: 'demo',
        tableNumber: tableNum,
        items: [
          { name: 'Pizza Margherita (Extra Bufala)', qty: 1, price: '12.50 €' },
          { name: 'Aperol Spritz 0.2l', qty: 2, price: '15.00 €' }
        ],
        notes: 'Bitte Getränke vorab servieren',
        totalPrice: '27.50 €'
      })
    } else if (dept === 'GASTRO_WAITER') {
      const tableNum = `Tisch ${Math.floor(Math.random() * 12 + 1)}`
      const isBill = Math.random() > 0.5
      submitServiceCall.mutate({
        tenantId: activeTenantId,
        tableNumber: tableNum,
        type: isBill ? 'bill' : 'waiter',
        note: isBill ? 'Kartenzahlung am Tisch erbeten' : 'Gast bittet um Kellner am Tisch'
      })
    } else if (dept === 'GASTRO_ROOM') {
      const roomNum = `${Math.floor(Math.random() * 30 + 101)}`
      submitHostRequest.mutate({
        tenantId: activeTenantId,
        locationId: locId,
        guestName: 'Dr. Michael Schmidt',
        roomNumber: roomNum,
        department: 'IN_ROOM_DINING',
        requestType: 'ORDER',
        items: [
          { name: 'Club Sandwich mit Steakhouse Pommes', qty: 1, price: '16.50 €' },
          { name: 'San Pellegrino 0.75l', qty: 1, price: '6.50 €' },
          { name: 'Panna Cotta Mango', qty: 1, price: '7.50 €' }
        ],
        notes: 'Bitte mit Besteck und Servietten auf das Zimmer liefern',
        totalPrice: '30.50 €'
      })
    } else if (dept === 'HOUSEKEEPING') {
      const roomNum = `${Math.floor(Math.random() * 30 + 101)}`
      submitHostRequest.mutate({
        tenantId: activeTenantId,
        locationId: locId,
        guestName: 'Familie Weber',
        roomNumber: roomNum,
        department: 'HOUSEKEEPING',
        requestType: 'REQUEST',
        items: [],
        notes: '2x zusätzliche Federkissen und 4x frische Duschhandtücher erbeten',
        totalPrice: '0.00 €'
      })
    } else if (dept === 'ENGINEERING') {
      const roomNum = `${Math.floor(Math.random() * 30 + 101)}`
      submitHostRequest.mutate({
        tenantId: activeTenantId,
        locationId: locId,
        guestName: 'Klaus Müller',
        roomNumber: roomNum,
        department: 'MAINTENANCE',
        requestType: 'INCIDENT',
        items: [],
        notes: 'Klimaanlage kühlt nicht ausreichend / Fernbedienung reagiert verzögert',
        totalPrice: '0.00 €'
      })
    } else if (dept === 'FRONT_OFFICE') {
      const roomNum = `${Math.floor(Math.random() * 30 + 101)}`
      submitHostRequest.mutate({
        tenantId: activeTenantId,
        locationId: locId,
        guestName: 'Elena Rostova',
        roomNumber: roomNum,
        department: 'CONCIERGE',
        requestType: 'REQUEST',
        items: [],
        notes: 'Weckruf morgen früh um 06:30 Uhr & Taxi zum Hauptbahnhof um 07:15 Uhr',
        totalPrice: '0.00 €'
      })
    }
  }

  const refreshAll = () => {
    refetchOrders()
    refetchCalls()
    refetchHostReqs()
  }

  const copyTabletLink = () => {
    const url = `${window.location.origin}/live-orders/${activeTenantId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Toggle browser fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  // ──────────────────────────────────────────────────────────
  // TICKET CARD COMPONENT
  // ──────────────────────────────────────────────────────────
  const renderTicketCard = (ticket) => {
    const deptInfo = DEPARTMENTS[ticket.department] || DEPARTMENTS.FRONT_OFFICE
    const isNew = ticket.status === 'NEW'
    const isInProg = ticket.status === 'IN_PROGRESS'
    const isCompleted = ticket.status === 'COMPLETED'
    const isUrgent = ticket.urgent || ticket.source === 'SERVICE_CALL'

    return (
      <div
        key={ticket.id}
        style={{
          background: '#12121A',
          border: isUrgent && isNew
            ? '2px solid #EF4444'
            : isNew
            ? `2px solid ${deptInfo.borderColor}`
            : isInProg
            ? '2px solid #3B82F6'
            : '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 12,
          boxShadow: isUrgent && isNew
            ? '0 0 24px rgba(239, 68, 68, 0.25)'
            : isNew
            ? `0 0 20px ${deptInfo.bgColor}`
            : 'none',
          position: 'relative',
          opacity: isCompleted ? 0.65 : 1,
          transition: 'all 0.2s ease'
        }}
      >
        {/* Header: Title / Room / Table + Elapsed Timer */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  padding: '5px 12px',
                  borderRadius: 10,
                  background: isUrgent ? '#EF4444' : isNew ? deptInfo.color : '#3B82F6',
                  color: isUrgent || isInProg ? '#FFF' : '#000',
                  fontSize: 14,
                  fontWeight: 900,
                  letterSpacing: 0.3
                }}
              >
                {ticket.originType === 'ROOM' ? '🏨 ' : '🍽️ '}
                {ticket.title}
              </span>

              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.06)',
                  color: isNew ? '#FBBF24' : isInProg ? '#60A5FA' : '#10B981',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                {isNew ? 'NEU / OFFEN' : isInProg ? 'IN BEARBEITUNG' : 'ERLEDIGT'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9CA3AF', fontWeight: 600, whiteSpace: 'nowrap' }}>
              <Clock size={12} />
              <span>{formatElapsedTime(ticket.createdAt)}</span>
            </div>
          </div>

          <div style={{ fontSize: 12, color: '#D1D5DB', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{ticket.subtitle}</span>
            {ticket.originType === 'ROOM' && ticket.department === 'GASTRONOMIE' && (
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(245,158,11,0.2)', color: '#F59E0B', fontWeight: 800 }}>
                In-Room Dining
              </span>
            )}
          </div>

          {/* Ordered items list if food/beverage */}
          {ticket.items && ticket.items.length > 0 && (
            <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: deptInfo.color, marginBottom: 6, letterSpacing: 0.5 }}>
                POSTEN ({ticket.items.length}):
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {ticket.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, borderBottom: idx < ticket.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', paddingBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ minWidth: 20, height: 20, borderRadius: 5, background: deptInfo.color, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900 }}>
                        {item.qty || 1}x
                      </span>
                      <span style={{ fontWeight: 700, color: '#FFF' }}>{item.name}</span>
                    </div>
                    <span style={{ color: '#9CA3AF', fontSize: 11 }}>{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes / Special Requests */}
          {ticket.notes && (
            <div
              style={{
                background: isUrgent ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px dashed ${isUrgent ? '#EF4444' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 12,
                color: isUrgent ? '#FCA5A5' : '#E5E7EB',
                fontWeight: 600,
                lineHeight: 1.4
              }}
            >
              {isUrgent ? '🚨 Dringend: ' : '💬 '}"{ticket.notes}"
            </div>
          )}
        </div>

        {/* Footer with Price & Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            {ticket.totalPrice && (
              <div>
                <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 700 }}>SUMME</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#10B981' }}>{ticket.totalPrice}</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {isNew && (
              <button
                onClick={() => handleAdvanceStatus(ticket, 'IN_PROGRESS')}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: '#3B82F6',
                  color: '#FFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
                title="In Bearbeitung / In POS übernehmen"
              >
                <Play size={12} />
                {ticket.department === 'GASTRONOMIE' && ticket.originType === 'TABLE' ? 'In POS buchen' : 'In Arbeit'}
              </button>
            )}

            {!isCompleted && (
              <button
                onClick={() => handleAdvanceStatus(ticket, 'COMPLETED')}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: '#10B981',
                  color: '#FFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
                title="Als erledigt / serviert markieren"
              >
                <Check size={13} />
                Erledigt
              </button>
            )}

            {isCompleted && (
              <button
                onClick={() => handleAdvanceStatus(ticket, 'IN_PROGRESS')}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)',
                  color: '#9CA3AF',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontWeight: 700,
                  fontSize: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
                title="Vorgang wiedereröffnen"
              >
                <RotateCcw size={11} />
                Reopen
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: embedded ? 'auto' : '100vh',
        background: embedded ? 'transparent' : '#08080E',
        color: '#F3F4F6',
        fontFamily: "'Inter', sans-serif",
        padding: embedded ? '0' : isFullscreen ? '16px' : '20px 24px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* ──────────────────────────────────────────────────────────
          1. TOP NAVIGATION & KDS STATION BAR
      ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
          marginBottom: 16,
          background: '#101018',
          padding: '14px 20px',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {!isFullscreen && !embedded && (
            <Link
              to="/dashboard"
              style={{
                textDecoration: 'none',
                color: '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 700,
                padding: '6px 10px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.04)'
              }}
            >
              <ArrowLeft size={16} /> Zurück
            </Link>
          )}

          <div>
            <div style={{ fontSize: 10, color: '#8B5CF6', fontWeight: 900, letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>SCENVY OPERATIONS & ORDER TAFEL</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'pulse 1.5s infinite' }} />
              <span style={{ color: '#10B981', fontWeight: 800 }}>LIVE</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
              📋 Hotel & Gastro Bestellzentrale
            </div>
          </div>
        </div>

        {/* Live Clock & Station Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Digital Clock */}
          <div
            style={{
              padding: '6px 14px',
              borderRadius: 10,
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 900,
              color: '#FFF',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            <Clock size={15} color="#8B5CF6" />
            <span>{currentTime.toLocaleTimeString('de-DE')}</span>
          </div>

          {/* Location Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)' }}>
            <Building2 size={14} color="#9CA3AF" />
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
              <option value="all" style={{ background: '#12121A', color: '#FFF' }}>Alle Standorte / Bereiche</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id} style={{ background: '#12121A', color: '#FFF' }}>
                  📍 {loc.name} {loc.city ? `(${loc.city})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Sound Toggle & Test */}
          <button
            onClick={() => {
              if (!soundEnabled) playChimeSound('new_order')
              setSoundEnabled(!soundEnabled)
            }}
            style={{
              padding: '7px 12px',
              borderRadius: 10,
              background: soundEnabled ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${soundEnabled ? '#8B5CF6' : 'rgba(255,255,255,0.1)'}`,
              color: soundEnabled ? '#C4B5FD' : '#9CA3AF',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            title="Akustische Benachrichtigung bei neuen Bestellungen"
          >
            {soundEnabled ? <Volume2 size={15} color="#A78BFA" /> : <VolumeX size={15} />}
            {soundEnabled ? 'Ton AN' : 'Stumm'}
          </button>

          {/* Refresh */}
          <button
            onClick={refreshAll}
            style={{ padding: '7px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            title="Echtzeit-Synchronisation manuell aktualisieren"
          >
            <RefreshCw size={14} />
          </button>

          {/* Tablet Link */}
          <button
            onClick={copyTabletLink}
            style={{
              padding: '7px 14px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)',
              color: '#FFF',
              border: 'none',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            title="Link für Küchen-Monitor oder Servicestation kopieren"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Kopiert!' : 'Station-Link'}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            style={{
              padding: '7px 12px',
              borderRadius: 10,
              background: isFullscreen ? '#F59E0B' : 'rgba(255,255,255,0.06)',
              color: isFullscreen ? '#000' : '#FFF',
              border: '1px solid rgba(255,255,255,0.12)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            title="Vollbild-Tafel für Monitore und Tablets aktivieren"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            {isFullscreen ? 'Vollbild Beenden' : 'Tafel-Vollbild'}
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          2. DEPARTMENT TAFEL SWITCHER & TEST SIMULATION TOOLBAR
      ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
          background: '#101018',
          padding: '10px 16px',
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        {/* Department Station Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 900, color: '#9CA3AF', letterSpacing: 1, marginRight: 4 }}>
            ABTEILUNGEN:
          </span>

          {/* Master View (All Departments) */}
          <button
            onClick={() => setActiveDeptView('MASTER')}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: `1px solid ${activeDeptView === 'MASTER' ? '#8B5CF6' : 'rgba(255,255,255,0.1)'}`,
              background: activeDeptView === 'MASTER' ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255,255,255,0.04)',
              color: activeDeptView === 'MASTER' ? '#FFF' : '#9CA3AF',
              fontSize: 12,
              fontWeight: activeDeptView === 'MASTER' ? 900 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Layers size={14} color="#8B5CF6" />
            <span>🏛️ Master-Tafel (Alle Abteilungen)</span>
            <span style={{ padding: '2px 6px', borderRadius: 6, background: '#8B5CF6', color: '#FFF', fontSize: 10, fontWeight: 900 }}>
              {deptMetrics.ALL.pending}
            </span>
          </button>

          {/* Gastronomie & F&B */}
          <button
            onClick={() => setActiveDeptView('GASTRONOMIE')}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: `1px solid ${activeDeptView === 'GASTRONOMIE' ? '#F59E0B' : 'rgba(255,255,255,0.1)'}`,
              background: activeDeptView === 'GASTRONOMIE' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.04)',
              color: activeDeptView === 'GASTRONOMIE' ? '#FFF' : '#9CA3AF',
              fontSize: 12,
              fontWeight: activeDeptView === 'GASTRONOMIE' ? 900 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Utensils size={14} color="#F59E0B" />
            <span>🍽️ Gastronomie & F&B</span>
            <span style={{ padding: '2px 6px', borderRadius: 6, background: '#F59E0B', color: '#000', fontSize: 10, fontWeight: 900 }}>
              {deptMetrics.GASTRONOMIE.pending}
            </span>
          </button>

          {/* Housekeeping */}
          <button
            onClick={() => setActiveDeptView('HOUSEKEEPING')}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: `1px solid ${activeDeptView === 'HOUSEKEEPING' ? '#10B981' : 'rgba(255,255,255,0.1)'}`,
              background: activeDeptView === 'HOUSEKEEPING' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.04)',
              color: activeDeptView === 'HOUSEKEEPING' ? '#FFF' : '#9CA3AF',
              fontSize: 12,
              fontWeight: activeDeptView === 'HOUSEKEEPING' ? 900 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Sparkles size={14} color="#10B981" />
            <span>🧹 Housekeeping</span>
            <span style={{ padding: '2px 6px', borderRadius: 6, background: '#10B981', color: '#000', fontSize: 10, fontWeight: 900 }}>
              {deptMetrics.HOUSEKEEPING.pending}
            </span>
          </button>

          {/* Engineering & Technik */}
          <button
            onClick={() => setActiveDeptView('ENGINEERING')}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: `1px solid ${activeDeptView === 'ENGINEERING' ? '#3B82F6' : 'rgba(255,255,255,0.1)'}`,
              background: activeDeptView === 'ENGINEERING' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.04)',
              color: activeDeptView === 'ENGINEERING' ? '#FFF' : '#9CA3AF',
              fontSize: 12,
              fontWeight: activeDeptView === 'ENGINEERING' ? 900 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Wrench size={14} color="#3B82F6" />
            <span>🔧 Engineering</span>
            <span style={{ padding: '2px 6px', borderRadius: 6, background: '#3B82F6', color: '#FFF', fontSize: 10, fontWeight: 900 }}>
              {deptMetrics.ENGINEERING.pending}
            </span>
          </button>

          {/* Front Office & Concierge */}
          <button
            onClick={() => setActiveDeptView('FRONT_OFFICE')}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: `1px solid ${activeDeptView === 'FRONT_OFFICE' ? '#8B5CF6' : 'rgba(255,255,255,0.1)'}`,
              background: activeDeptView === 'FRONT_OFFICE' ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255,255,255,0.04)',
              color: activeDeptView === 'FRONT_OFFICE' ? '#FFF' : '#9CA3AF',
              fontSize: 12,
              fontWeight: activeDeptView === 'FRONT_OFFICE' ? 900 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <ConciergeBell size={14} color="#8B5CF6" />
            <span>🛎️ Front Office</span>
            <span style={{ padding: '2px 6px', borderRadius: 6, background: '#8B5CF6', color: '#FFF', fontSize: 10, fontWeight: 900 }}>
              {deptMetrics.FRONT_OFFICE.pending}
            </span>
          </button>
        </div>

        {/* Multi-Department Test Simulation Drawer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 900, color: '#9CA3AF', letterSpacing: 1 }}>TEST-SIMULATION:</span>
          
          <button
            onClick={() => testSimulation('GASTRO_TABLE')}
            style={{ padding: '6px 9px', borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #F59E0B', color: '#FFF', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            title="Test Gastro Tisch-Bestellung generieren"
          >
            + Tisch
          </button>

          <button
            onClick={() => testSimulation('GASTRO_WAITER')}
            style={{ padding: '6px 9px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#FFF', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            title="Test Kellner- / Rechnungs-Ruf generieren"
          >
            + Kellner
          </button>

          <button
            onClick={() => testSimulation('GASTRO_ROOM')}
            style={{ padding: '6px 9px', borderRadius: 8, background: 'rgba(245, 158, 11, 0.25)', border: '1px solid #F59E0B', color: '#FCD34D', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            title="Test In-Room Dining Bestellung generieren"
          >
            + In-Room F&B
          </button>

          <button
            onClick={() => testSimulation('HOUSEKEEPING')}
            style={{ padding: '6px 9px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', color: '#FFF', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            title="Test Housekeeping Anfrage generieren"
          >
            + Housekeeping
          </button>

          <button
            onClick={() => testSimulation('ENGINEERING')}
            style={{ padding: '6px 9px', borderRadius: 8, background: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3B82F6', color: '#FFF', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            title="Test Technik Incident generieren"
          >
            + Technik
          </button>

          <button
            onClick={() => testSimulation('FRONT_OFFICE')}
            style={{ padding: '6px 9px', borderRadius: 8, background: 'rgba(139, 92, 246, 0.15)', border: '1px solid #8B5CF6', color: '#FFF', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            title="Test Front Office / Weckruf Anfrage generieren"
          >
            + Front Office
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          3. SUB-FILTER BAR (Gastro Origin, Status, Search)
      ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
          background: '#0D0D14',
          padding: '8px 14px',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700 }}>Filter:</span>
          {[
            { id: 'pending', label: `Offen & In Arbeit (${deptMetrics.ALL.pending + deptMetrics.ALL.inProgress})` },
            { id: 'all', label: `Alle Vorgänge (${deptMetrics.ALL.total})` },
            { id: 'completed', label: `Erledigt / Archiv (${deptMetrics.ALL.completed})` }
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              style={{
                padding: '5px 12px',
                borderRadius: 8,
                border: 'none',
                background: statusFilter === st.id ? '#8B5CF6' : 'rgba(255,255,255,0.06)',
                color: '#FFF',
                fontSize: 11,
                fontWeight: statusFilter === st.id ? 800 : 600,
                cursor: 'pointer'
              }}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Gastro Origin Sub-Filter (when Gastronomie is focused or in master) */}
        {(activeDeptView === 'MASTER' || activeDeptView === 'GASTRONOMIE') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.08)', padding: '4px 8px', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)' }}>
            <span style={{ fontSize: 10, color: '#F59E0B', fontWeight: 900 }}>GASTRO-ORIGIN:</span>
            {[
              { id: 'ALL', label: 'Alle (Tische + Zimmer)' },
              { id: 'TABLES', label: `🍽️ Nur Restaurant-Tische (${deptMetrics.GASTRONOMIE.tables})` },
              { id: 'ROOMS', label: `🏨 Nur In-Room Dining (${deptMetrics.GASTRONOMIE.rooms})` }
            ].map(o => (
              <button
                key={o.id}
                onClick={() => setGastroOriginFilter(o.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: gastroOriginFilter === o.id ? '#F59E0B' : 'transparent',
                  color: gastroOriginFilter === o.id ? '#000' : '#D1D5DB',
                  fontSize: 11,
                  fontWeight: gastroOriginFilter === o.id ? 900 : 600,
                  cursor: 'pointer'
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
          <Search size={14} color="#9CA3AF" />
          <input
            type="text"
            placeholder="Tisch, Zimmer, Gast oder Gericht suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFF',
              fontSize: 11,
              outline: 'none',
              width: 200
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 12 }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          4. MAIN TAFEL DISPLAY CONTENT
      ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1 }}>
        {/* VIEW 1: MASTER-TAFEL (4 Department Columns Side-by-Side) */}
        {activeDeptView === 'MASTER' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 16,
              alignItems: 'start'
            }}
          >
            {/* Column 1: Gastronomie & F&B */}
            {(() => {
              const deptKey = 'GASTRONOMIE'
              const dept = DEPARTMENTS[deptKey]
              const items = getFilteredTicketsForDept(deptKey)
              return (
                <div
                  key={deptKey}
                  style={{
                    background: '#0E0E16',
                    borderRadius: 18,
                    border: `1px solid ${dept.borderColor}33`,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 480
                  }}
                >
                  {/* Column Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `2px solid ${dept.color}`, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: dept.bgColor, border: `1px solid ${dept.borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: dept.color }}>
                        {dept.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#FFF' }}>{dept.title}</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF' }}>{dept.sub}</div>
                      </div>
                    </div>

                    <span style={{ padding: '4px 10px', borderRadius: 8, background: dept.color, color: '#000', fontSize: 12, fontWeight: 900 }}>
                      {items.filter(i => i.status !== 'COMPLETED').length} Offen
                    </span>
                  </div>

                  {/* Tickets */}
                  <div style={{ display: 'grid', gap: 12, flex: 1 }}>
                    {items.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 16px', color: '#6B7280', fontSize: 12 }}>
                        <Utensils size={32} color="#374151" style={{ margin: '0 auto 8px' }} />
                        Keine aktiven Vorgänge in der Gastronomie
                      </div>
                    ) : (
                      items.map(ticket => renderTicketCard(ticket))
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Column 2: Housekeeping */}
            {(() => {
              const deptKey = 'HOUSEKEEPING'
              const dept = DEPARTMENTS[deptKey]
              const items = getFilteredTicketsForDept(deptKey)
              return (
                <div
                  key={deptKey}
                  style={{
                    background: '#0E0E16',
                    borderRadius: 18,
                    border: `1px solid ${dept.borderColor}33`,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 480
                  }}
                >
                  {/* Column Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `2px solid ${dept.color}`, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: dept.bgColor, border: `1px solid ${dept.borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: dept.color }}>
                        {dept.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#FFF' }}>{dept.title}</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF' }}>{dept.sub}</div>
                      </div>
                    </div>

                    <span style={{ padding: '4px 10px', borderRadius: 8, background: dept.color, color: '#000', fontSize: 12, fontWeight: 900 }}>
                      {items.filter(i => i.status !== 'COMPLETED').length} Offen
                    </span>
                  </div>

                  {/* Tickets */}
                  <div style={{ display: 'grid', gap: 12, flex: 1 }}>
                    {items.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 16px', color: '#6B7280', fontSize: 12 }}>
                        <Sparkles size={32} color="#374151" style={{ margin: '0 auto 8px' }} />
                        Keine aktiven Housekeeping-Anfragen
                      </div>
                    ) : (
                      items.map(ticket => renderTicketCard(ticket))
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Column 3: Engineering & Technik */}
            {(() => {
              const deptKey = 'ENGINEERING'
              const dept = DEPARTMENTS[deptKey]
              const items = getFilteredTicketsForDept(deptKey)
              return (
                <div
                  key={deptKey}
                  style={{
                    background: '#0E0E16',
                    borderRadius: 18,
                    border: `1px solid ${dept.borderColor}33`,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 480
                  }}
                >
                  {/* Column Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `2px solid ${dept.color}`, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: dept.bgColor, border: `1px solid ${dept.borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: dept.color }}>
                        {dept.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#FFF' }}>{dept.title}</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF' }}>{dept.sub}</div>
                      </div>
                    </div>

                    <span style={{ padding: '4px 10px', borderRadius: 8, background: dept.color, color: '#FFF', fontSize: 12, fontWeight: 900 }}>
                      {items.filter(i => i.status !== 'COMPLETED').length} Offen
                    </span>
                  </div>

                  {/* Tickets */}
                  <div style={{ display: 'grid', gap: 12, flex: 1 }}>
                    {items.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 16px', color: '#6B7280', fontSize: 12 }}>
                        <Wrench size={32} color="#374151" style={{ margin: '0 auto 8px' }} />
                        Keine offenen Technik- oder Reparaturanfragen
                      </div>
                    ) : (
                      items.map(ticket => renderTicketCard(ticket))
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Column 4: Front Office & Concierge */}
            {(() => {
              const deptKey = 'FRONT_OFFICE'
              const dept = DEPARTMENTS[deptKey]
              const items = getFilteredTicketsForDept(deptKey)
              return (
                <div
                  key={deptKey}
                  style={{
                    background: '#0E0E16',
                    borderRadius: 18,
                    border: `1px solid ${dept.borderColor}33`,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 480
                  }}
                >
                  {/* Column Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `2px solid ${dept.color}`, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: dept.bgColor, border: `1px solid ${dept.borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: dept.color }}>
                        {dept.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#FFF' }}>{dept.title}</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF' }}>{dept.sub}</div>
                      </div>
                    </div>

                    <span style={{ padding: '4px 10px', borderRadius: 8, background: dept.color, color: '#FFF', fontSize: 12, fontWeight: 900 }}>
                      {items.filter(i => i.status !== 'COMPLETED').length} Offen
                    </span>
                  </div>

                  {/* Tickets */}
                  <div style={{ display: 'grid', gap: 12, flex: 1 }}>
                    {items.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 16px', color: '#6B7280', fontSize: 12 }}>
                        <ConciergeBell size={32} color="#374151" style={{ margin: '0 auto 8px' }} />
                        Keine offenen Front Office Vorgänge
                      </div>
                    ) : (
                      items.map(ticket => renderTicketCard(ticket))
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* VIEW 2: SINGLE DEPARTMENT FOCUSED TAFEL GRID */}
        {activeDeptView !== 'MASTER' && (
          <div>
            {(() => {
              const dept = DEPARTMENTS[activeDeptView] || DEPARTMENTS.GASTRONOMIE
              const items = getFilteredTicketsForDept(activeDeptView)

              return (
                <div style={{ background: '#0E0E16', borderRadius: 20, padding: 20, border: `1px solid ${dept.borderColor}44` }}>
                  {/* Department Banner */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: dept.bgColor, border: `2px solid ${dept.borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: dept.color }}>
                        {dept.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{dept.title} Station-Tafel</div>
                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>{dept.sub}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ padding: '6px 14px', borderRadius: 10, background: dept.color, color: '#000', fontSize: 13, fontWeight: 900 }}>
                        {items.filter(i => i.status !== 'COMPLETED').length} Vorgänge aktiv
                      </span>
                    </div>
                  </div>

                  {/* Grid */}
                  {items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#12121A', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <CheckCircle2 size={48} color="#10B981" style={{ margin: '0 auto 12px' }} />
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>Alles erledigt in {dept.shortTitle}!</div>
                      <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
                        Neue Bestellungen und Anfragen für diesen Bereich erscheinen hier sofort in Echtzeit.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                      {items.map(ticket => renderTicketCard(ticket))}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
