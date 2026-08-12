import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import CsvImportUtility from '@/components/CsvImportUtility'
import {
  useLocations,
  useHostDepartments,
  useSaveHostDepartments,
  useHostServices,
  useSaveHostService,
  useDeleteHostService,
  useImportHostServicesCSV,
  useHostRequests,
  useUpdateHostRequestStatus,
  useHotelSettings,
  useSaveHotelSettings,
  useReels,
  useHostStaff,
  useSaveHostStaff,
  useDeleteHostStaff
} from '@/lib/db'
import { C, grad } from '@/tokens'
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
  CheckCircle2,
  AlertCircle,
  QrCode,
  Download,
  Copy,
  Plus,
  Trash2,
  Edit2,
  Upload,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Volume2,
  VolumeX,
  ExternalLink,
  Users,
  Settings,
  Building2,
  FileSpreadsheet,
  Link as LinkIcon,
  ChevronRight,
  Send,
  Phone,
  MessageSquare,
  Wifi,
  MapPin,
  UserCheck,
  Layers
} from 'lucide-react'

export default function HostDashboard() {
  const { tenantId: paramTenantId } = useParams()
  const { user } = useAuth()
  const activeTenantId = paramTenantId || user?.tenant_id || user?.tenantId || 'tenant-demo-1'

  const [activeTab, setActiveTab] = useState('requests') // 'requests' | 'catalog' | 'departments' | 'qr_generator' | 'settings'
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [lastReqCount, setLastReqCount] = useState(0)

  // Service Modal state
  const [editingService, setEditingService] = useState(null)
  const [showServiceModal, setShowServiceModal] = useState(false)

  // Department Modal State
  const [editingDept, setEditingDept] = useState(null)
  const [showDeptModal, setShowDeptModal] = useState(false)

  // Staff Modal State
  const [editingStaff, setEditingStaff] = useState(null)
  const [showStaffModal, setShowStaffModal] = useState(false)

  // CSV Import state
  const [showCsvModal, setShowCsvModal] = useState(false)

  // QR Code generator state
  const [qrRoomNum, setQrRoomNum] = useState('101')
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedHeaderLink, setCopiedHeaderLink] = useState(false)

  // Hooks
  const { data: locations = [] } = useLocations(activeTenantId)
  const activeLocation = locations[0] || { id: 'loc1', name: 'Hauptstandort' }

  const { data: departments = [] } = useHostDepartments(activeTenantId)
  const saveDepartments = useSaveHostDepartments()

  const { data: staffList = [] } = useHostStaff(activeTenantId)
  const saveStaff = useSaveHostStaff()
  const deleteStaff = useDeleteHostStaff()

  const { data: services = [] } = useHostServices(activeTenantId)
  const saveService = useSaveHostService()
  const deleteService = useDeleteHostService()
  const importCSV = useImportHostServicesCSV()

  const { data: requests = [], isLoading: loadingRequests } = useHostRequests(activeTenantId)
  const updateStatus = useUpdateHostRequestStatus()

  const { data: settings = {} } = useHotelSettings(activeTenantId)
  const saveSettings = useSaveHotelSettings()

  const { data: menuReels = [] } = useReels(activeTenantId)

  // Settings form local state
  const [hotelForm, setHotelForm] = useState({
    hotel_name: '',
    welcome_message: '',
    address: '',
    city: '',
    phone: '',
    whatsapp: '',
    wifi_ssid: '',
    wifi_pass: '',
    breakfast_time: '',
    checkout_time: '',
    primary_color: '#7C3AED',
    currency: 'EUR'
  })

  useEffect(() => {
    if (settings) {
      setHotelForm({
        hotel_name: settings.hotel_name || 'Grand Boutique Hotel & Resort',
        welcome_message: settings.welcome_message || 'Willkommen! Bestellen Sie bequem auf Ihr Zimmer.',
        address: settings.address || 'Alexanderplatz 1',
        city: settings.city || 'Berlin',
        phone: settings.phone || '+49 30 12345678',
        whatsapp: settings.whatsapp || '+49 170 9876543',
        wifi_ssid: settings.wifi_ssid || 'Scenvy_Guest_5G',
        wifi_pass: settings.wifi_pass || 'welcome2026',
        breakfast_time: settings.breakfast_time || '06:30 - 10:30 Uhr',
        checkout_time: settings.checkout_time || '11:00 Uhr',
        primary_color: settings.primary_color || '#7C3AED',
        currency: settings.currency || 'EUR'
      })
    }
  }, [settings])

  // Sound chime on new incoming request
  useEffect(() => {
    if (requests.length > lastReqCount && lastReqCount > 0 && soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3)
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5)
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.5)
      } catch (e) {
        // Audio fallback
      }
    }
    setLastReqCount(requests.length)
  }, [requests.length, soundEnabled])

  // Filter requests
  const filteredRequests = requests.filter(r => {
    if (selectedDeptFilter !== 'ALL' && r.department !== selectedDeptFilter) return false
    if (selectedStatusFilter !== 'ALL' && r.status !== selectedStatusFilter) return false
    return true
  })

  const newCount = requests.filter(r => r.status === 'NEW').length
  const activeCount = requests.filter(r => ['ACCEPTED', 'IN_PROGRESS', 'ON_THE_WAY'].includes(r.status)).length

  const guestBaseUrl = `${window.location.origin}/h/${activeLocation.id || 'loc1'}?tenantId=${activeTenantId}`
  const currentQrGuestUrl = `${guestBaseUrl}&room=${encodeURIComponent(qrRoomNum)}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentQrGuestUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleCopyHeaderLink = () => {
    navigator.clipboard.writeText(guestBaseUrl)
    setCopiedHeaderLink(true)
    setTimeout(() => setCopiedHeaderLink(false), 2500)
  }

  const handleSaveHotelSettings = async (e) => {
    e.preventDefault()
    try {
      await saveSettings.mutateAsync({ tenantId: activeTenantId, settings: hotelForm })
      alert('✅ Hotel Einstellungen erfolgreich gespeichert!')
    } catch (err) {
      alert('❌ Fehler beim Speichern: ' + err.message)
    }
  }

  // Department CRUD handlers
  const handleSaveDepartment = async (deptData) => {
    const updated = departments.some(d => d.id === deptData.id)
      ? departments.map(d => d.id === deptData.id ? deptData : d)
      : [...departments, deptData]

    await saveDepartments.mutateAsync({ tenantId: activeTenantId, departments: updated })
    setShowDeptModal(false)
    setEditingDept(null)
  }

  const handleDeleteDepartment = async (deptId) => {
    if (!window.confirm('Möchtest du diese Abteilung wirklich löschen?')) return
    const updated = departments.filter(d => d.id !== deptId)
    await saveDepartments.mutateAsync({ tenantId: activeTenantId, departments: updated })
  }

  // Staff CRUD handlers
  const handleSaveStaff = async (staffData) => {
    await saveStaff.mutateAsync({ tenantId: activeTenantId, staff: staffData })
    setShowStaffModal(false)
    setEditingStaff(null)
  }

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm('Möchtest du diesen Mitarbeiter wirklich entfernen?')) return
    await deleteStaff.mutateAsync({ tenantId: activeTenantId, staffId })
  }

  return (
    <div style={{ padding: '24px 32px', color: C.white, fontFamily: 'inherit', maxWidth: 1400, margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, color: C.purple, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
            SCENVY HOST • IN-ROOM CONCIERGE MANAGER
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🏨 {settings.hotel_name || activeLocation.name || 'Grand Hotel'}</span>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: `${C.green}22`, color: C.green, border: `1px solid ${C.green}44` }}>
              ● CONCIERGE LIVE
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Combined Master Display Link */}
          <Link
            to="/dashboard?page=orders"
            style={{
              padding: '10px 16px',
              borderRadius: 12,
              background: 'rgba(139, 92, 246, 0.2)',
              color: '#C4B5FD',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'none'
            }}
            title="Gastro & Host Kombinierte Live-Zentrale auf einem Display anzeigen"
          >
            <Layers size={15} />
            <span>Kombinierte Live-Zentrale</span>
          </Link>

          {/* Sound Toggle Button */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              padding: '10px 16px',
              borderRadius: 12,
              background: soundEnabled ? `${C.green}22` : C.card2,
              color: soundEnabled ? C.green : C.muted,
              border: `1px solid ${soundEnabled ? `${C.green}44` : C.border}`,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? 'Ton Aktiv' : 'Stumm'}</span>
          </button>

          {/* Copy Guest Link */}
          <button
            onClick={handleCopyHeaderLink}
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: C.card,
              color: C.white,
              border: `1px solid ${C.border}`,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            title="Link zur Gästewebseite in Zwischenablage kopieren"
          >
            {copiedHeaderLink ? <Check size={15} color={C.green} /> : <Copy size={15} />}
            <span>{copiedHeaderLink ? 'Link Kopiert!' : 'Gästelink Kopieren'}</span>
          </button>

          {/* Open Guest Link */}
          <a
            href={guestBaseUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              background: grad,
              color: C.white,
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(124,58,237,0.4)'
            }}
          >
            <ExternalLink size={15} /> Gästewebseite Öffnen →
          </a>
        </div>
      </div>

      {/* Main Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { title: 'Neue Anfragen', count: newCount, color: C.purple, sub: 'Erfordern Bearbeitung' },
          { title: 'In Bearbeitung', count: activeCount, color: C.pink, sub: 'Unterwegs / In Arbeit' },
          { title: 'Mitarbeiter im Dienst', count: staffList.filter(s=>s.status==='ON_DUTY').length, color: C.green, sub: 'Aktiv auf Station' },
          { title: 'Katalog Services', count: services.length, color: C.blue, sub: 'Aktiv im Gästemenü' }
        ].map((s, idx) => (
          <div key={idx} style={{
            background: C.card,
            border: `1px solid ${s.color}33`,
            borderRadius: 16,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: 0.5, textTransform: 'uppercase' }}>{s.title}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: C.white, margin: '8px 0' }}>{s.count}</div>
            <div style={{ fontSize: 11, color: s.color, fontWeight: 700 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: `1px solid ${C.border}`, paddingBottom: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { id: 'requests', label: `Gäste-Anfragen (${newCount > 0 ? `🚨 ${newCount} neu` : requests.length})`, icon: <ConciergeBell size={16} /> },
          { id: 'catalog', label: 'Service Katalog & CSV', icon: <FileSpreadsheet size={16} /> },
          { id: 'departments', label: 'Abteilungen & Staff', icon: <Users size={16} /> },
          { id: 'qr_generator', label: 'Zimmer QR-Links', icon: <QrCode size={16} /> },
          { id: 'settings', label: 'Hotel Einstellungen', icon: <Settings size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              border: 'none',
              background: activeTab === tab.id ? `${C.purple}33` : C.card,
              color: activeTab === tab.id ? C.white : C.muted,
              fontWeight: activeTab === tab.id ? 800 : 500,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: activeTab === tab.id ? C.purple : C.border
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: GUEST REQUESTS FEED & ORDER DISPATCH */}
      {activeTab === 'requests' && (
        <div>
          {/* Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {/* Department Filter */}
              <select
                value={selectedDeptFilter}
                onChange={e => setSelectedDeptFilter(e.target.value)}
                style={{ padding: '8px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 12, fontWeight: 600, outline: 'none' }}
              >
                <option value="ALL">🌐 Alle Abteilungen</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={e => setSelectedStatusFilter(e.target.value)}
                style={{ padding: '8px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 12, fontWeight: 600, outline: 'none' }}
              >
                <option value="ALL">📋 Alle Status Filter</option>
                <option value="NEW">🚨 Nur Neue Anfragen</option>
                <option value="ACCEPTED">✓ Akzeptiert / In Arbeit</option>
                <option value="COMPLETED">✅ Erledigt / Geliefert</option>
                <option value="REJECTED">❌ Abgelehnt</option>
              </select>
            </div>

            <div style={{ fontSize: 12, color: C.muted }}>
              Zeige {filteredRequests.length} von {requests.length} Anfragen
            </div>
          </div>

          {/* Requests Grid / Table */}
          {filteredRequests.length === 0 ? (
            <div style={{ background: C.card, border: `2px dashed ${C.border}`, borderRadius: 20, padding: 48, textAlign: 'center' }}>
              <ConciergeBell size={48} color={C.muted} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 800, color: C.white }}>Keine aktiven Gäste-Anfragen in diesem Filter</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                Sobald Gäste über die digitale Zimmermappe bestellen, erscheinen die Aufgaben hier live mit Ton-Signal.
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {filteredRequests.map(req => {
                const isNew = req.status === 'NEW'
                const isDone = req.status === 'COMPLETED'
                const isRejected = req.status === 'REJECTED'

                return (
                  <div
                    key={req.id}
                    style={{
                      background: isNew ? 'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(18,20,32,0.95) 100%)' : C.card,
                      border: isNew ? `1.5px solid ${C.purple}` : `1px solid ${C.border}`,
                      borderRadius: 18,
                      padding: 18,
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: isNew ? '0 8px 24px rgba(124,58,237,0.25)' : 'none'
                    }}
                  >
                    <div>
                      {/* Room & Status Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 900, color: C.white, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Building2 size={18} color={C.purple} /> Zimmer {req.room_number || req.roomNumber || '—'}
                          </div>
                          <div style={{ fontSize: 12, color: C.muted }}>Gast: {req.guest_name || 'Unbekannt'}</div>
                        </div>

                        <span style={{
                          fontSize: 10,
                          fontWeight: 900,
                          padding: '4px 10px',
                          borderRadius: 20,
                          background: isNew ? `${C.purple}33` : isDone ? `${C.green}22` : isRejected ? `${C.pink}22` : `${C.orange}22`,
                          color: isNew ? C.purple : isDone ? C.green : isRejected ? C.pink : C.orange,
                          border: `1px solid ${isNew ? C.purple : isDone ? C.green : isRejected ? C.pink : C.orange}44`
                        }}>
                          {req.status}
                        </span>
                      </div>

                      {/* Items List */}
                      <div style={{ background: C.bg, padding: 12, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', marginBottom: 6 }}>
                          BESTELLUNG / SERVICE ({req.department})
                        </div>
                        {Array.isArray(req.items) && req.items.length > 0 ? (
                          req.items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 2 }}>
                              <span>{item.qty}x {item.name}</span>
                              <span style={{ color: C.muted }}>{item.price}</span>
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{req.request_type || 'Gästeanfrage'}</div>
                        )}

                        {req.notes && (
                          <div style={{ fontSize: 11, color: C.pink, marginTop: 6, fontStyle: 'italic' }}>
                            💬 "{req.notes}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Dispatch Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 8 }}>
                      {req.status !== 'COMPLETED' && (
                        <button
                          onClick={() => updateStatus.mutate({ tenantId: activeTenantId, requestId: req.id, status: 'COMPLETED' })}
                          style={{ padding: '8px', borderRadius: 8, background: `${C.green}22`, color: C.green, border: `1px solid ${C.green}44`, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                        >
                          ✓ Erledigt
                        </button>
                      )}
                      {req.status === 'NEW' && (
                        <button
                          onClick={() => updateStatus.mutate({ tenantId: activeTenantId, requestId: req.id, status: 'ACCEPTED' })}
                          style={{ padding: '8px', borderRadius: 8, background: `${C.purple}22`, color: C.purple, border: `1px solid ${C.purple}44`, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                        >
                          ▶ Akzeptieren
                        </button>
                      )}
                      {req.status !== 'REJECTED' && req.status !== 'COMPLETED' && (
                        <button
                          onClick={() => updateStatus.mutate({ tenantId: activeTenantId, requestId: req.id, status: 'REJECTED' })}
                          style={{ padding: '8px', borderRadius: 8, background: `${C.pink}15`, color: C.pink, border: `1px solid ${C.pink}33`, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                        >
                          ✕ Ablehnen
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SERVICE CATALOG & CSV UTILITIES */}
      {activeTab === 'catalog' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.white }}>
              Service Katalog & Menüpunkte ({services.length})
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowCsvModal(true)}
                style={{ padding: '9px 16px', borderRadius: 10, background: `${C.blue}22`, color: C.blue, border: `1px solid ${C.blue}44`, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <FileSpreadsheet size={15} /> CSV Daten Importieren
              </button>

              <button
                onClick={() => {
                  setEditingService({
                    id: `srv_${Date.now()}`,
                    name: '',
                    department: 'HOUSEKEEPING',
                    category: 'Allgemein',
                    description: '',
                    price: '0.00',
                    currency: 'EUR',
                    active: true,
                    type: 'REQUEST'
                  })
                  setShowServiceModal(true)
                }}
                style={{ padding: '9px 16px', borderRadius: 10, background: grad, color: C.white, border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={15} /> Neuer Service
              </button>
            </div>
          </div>

          <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Service Name</th>
                  <th style={{ padding: '12px 16px' }}>Abteilung</th>
                  <th style={{ padding: '12px 16px' }}>Kategorie</th>
                  <th style={{ padding: '12px 16px' }}>Preis</th>
                  <th style={{ padding: '12px 16px' }}>Typ</th>
                  <th style={{ padding: '12px 16px' }}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {services.map(srv => (
                  <tr key={srv.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: C.white }}>{srv.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{srv.description}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 8, background: `${C.purple}22`, color: C.purple, fontWeight: 700 }}>
                        {srv.department}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: C.muted }}>{srv.category}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: C.white }}>
                      {parseFloat(srv.price || '0') === 0 ? 'Kostenfrei' : `${srv.price} ${srv.currency || '€'}`}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: srv.type === 'ORDER' ? `${C.orange}22` : `${C.blue}22`, color: srv.type === 'ORDER' ? C.orange : C.blue }}>
                        {srv.type}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => { setEditingService(srv); setShowServiceModal(true) }}
                          style={{ padding: '6px 10px', background: C.card2, border: `1px solid ${C.border}`, borderRadius: 6, color: C.white, cursor: 'pointer' }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => deleteService.mutate({ tenantId: activeTenantId, serviceId: srv.id })}
                          style={{ padding: '6px 10px', background: `${C.pink}22`, border: `1px solid ${C.pink}44`, borderRadius: 6, color: C.pink, cursor: 'pointer' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DEPARTMENTS & STAFF EDITABLE SECTION */}
      {activeTab === 'departments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Departments Header & Actions */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: C.white }}>Abteilungen ({departments.length})</div>
                <div style={{ fontSize: 12, color: C.muted }}>Verwalte Abteilungen, Zuständigkeiten & Zuordnungen.</div>
              </div>

              <button
                onClick={() => {
                  setEditingDept({ id: `dept_${Date.now()}`, name: '', color: '#7C3AED', icon: 'ConciergeBell', enabled: true })
                  setShowDeptModal(true)
                }}
                style={{ padding: '9px 16px', borderRadius: 10, background: grad, color: C.white, border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={15} /> Neue Abteilung Anlegen
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {departments.map(dept => (
                <div key={dept.id} style={{ background: C.card, border: `1px solid ${dept.color || C.purple}44`, borderRadius: 16, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: C.white, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: dept.color || C.purple }}>●</span> {dept.name}
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: dept.enabled !== false ? `${C.green}22` : C.card2, color: dept.enabled !== false ? C.green : C.muted }}>
                      {dept.enabled !== false ? 'AKTIV' : 'INAKTIV'}
                    </span>
                  </div>

                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>ID: {dept.id}</div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => { setEditingDept(dept); setShowDeptModal(true) }}
                      style={{ padding: '6px 12px', background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Edit2 size={12} /> Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDeleteDepartment(dept.id)}
                      style={{ padding: '6px 12px', background: `${C.pink}15`, border: `1px solid ${C.pink}33`, borderRadius: 8, color: C.pink, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Trash2 size={12} /> Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Staff Members Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: C.white }}>Mitarbeiter & Personal ({staffList.length})</div>
                <div style={{ fontSize: 12, color: C.muted }}>Verwalte dein Personal, Schichten & Bereitschaftsstatus.</div>
              </div>

              <button
                onClick={() => {
                  setEditingStaff({
                    id: `staff_${Date.now()}`,
                    name: '',
                    role: 'Concierge / Rezeptionist',
                    department: departments[0]?.id || 'GUEST_SERVICES',
                    status: 'ON_DUTY',
                    shift: 'Frühschicht (06:00 - 14:30)',
                    email: '',
                    phone: ''
                  })
                  setShowStaffModal(true)
                }}
                style={{ padding: '9px 16px', borderRadius: 10, background: `${C.green}22`, color: C.green, border: `1px solid ${C.green}44`, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={15} /> Mitarbeiter Hinzufügen
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {staffList.map(st => {
                const isOnDuty = st.status === 'ON_DUTY'
                const isOnBreak = st.status === 'ON_BREAK'

                return (
                  <div key={st.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: C.white }}>{st.name}</div>
                        <div style={{ fontSize: 12, color: C.purple, fontWeight: 700 }}>{st.role}</div>
                      </div>

                      <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: 12,
                        background: isOnDuty ? `${C.green}22` : isOnBreak ? `${C.orange}22` : C.card2,
                        color: isOnDuty ? C.green : isOnBreak ? C.orange : C.muted,
                        border: `1px solid ${isOnDuty ? C.green : isOnBreak ? C.orange : C.border}44`
                      }}>
                        {isOnDuty ? '● IM DIENST' : isOnBreak ? '☕ PAUSE' : '○ OFF-DUTY'}
                      </span>
                    </div>

                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div>🏛️ Abteilung: <strong style={{ color: C.white }}>{st.department}</strong></div>
                      <div>⏱ Schicht: {st.shift || 'Reguläre Schicht'}</div>
                      {st.phone && <div>📞 Tel: {st.phone}</div>}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => { setEditingStaff(st); setShowStaffModal(true) }}
                        style={{ padding: '6px 12px', background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        <Edit2 size={12} /> Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(st.id)}
                        style={{ padding: '6px 12px', background: `${C.pink}15`, border: `1px solid ${C.pink}33`, borderRadius: 8, color: C.pink, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        <Trash2 size={12} /> Entfernen
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ROOM QR-CODE GENERATOR */}
      {activeTab === 'qr_generator' && (
        <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, padding: 28, maxWidth: 640 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.white, marginBottom: 8 }}>
            📷 Universal Room QR-Code Generator
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
            Erstelle maßgeschneiderte QR-Code Aufsteller für deine Hotelzimmer. Der Gast scannt den Code mit der Smartphone-Kamera und hat sofort Zugriff auf alle Concierge Services & In-Room Dining.
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: C.purple, display: 'block', marginBottom: 6 }}>
              ZIMMERNUMMER / BEREICH *
            </label>
            <input
              type="text"
              value={qrRoomNum}
              onChange={e => setQrRoomNum(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.bg, border: `1px solid ${C.purple}`, color: C.white, fontSize: 14, fontWeight: 800, outline: 'none' }}
            />
          </div>

          <div style={{ background: C.bg, padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Gästelink für Zimmer {qrRoomNum}:</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.purple, wordBreak: 'break-all' }}>{currentQrGuestUrl}</div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleCopyLink}
              style={{ padding: '12px 20px', borderRadius: 10, background: C.card2, color: C.white, border: `1px solid ${C.border}`, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {copiedLink ? <Check size={16} color={C.green} /> : <Copy size={16} />}
              <span>{copiedLink ? 'Link kopiert!' : 'Link kopieren'}</span>
            </button>

            <a
              href={currentQrGuestUrl}
              target="_blank"
              rel="noreferrer"
              style={{ padding: '12px 20px', borderRadius: 10, background: grad, color: C.white, textDecoration: 'none', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <ExternalLink size={16} /> Link testen →
            </a>
          </div>
        </div>
      )}

      {/* TAB 5: HOTEL EINSTELLUNGEN EDITABLE FORM */}
      {activeTab === 'settings' && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, maxWidth: 720 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.white, marginBottom: 6 }}>
            ⚙️ Hotel & Host Stammdaten Einstellungen
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>
            Passe Hotelname, W-LAN Zugangsdaten, Rezeption-Hotline & Empfangstexte für Gäste an.
          </div>

          <form onSubmit={handleSaveHotelSettings} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>HOTELNAME *</label>
                <input
                  type="text"
                  value={hotelForm.hotel_name}
                  onChange={e => setHotelForm({ ...hotelForm, hotel_name: e.target.value })}
                  placeholder="z.B. Grand Boutique Hotel"
                  style={{ width: '100%', padding: '10px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>STADT / ORT</label>
                <input
                  type="text"
                  value={hotelForm.city}
                  onChange={e => setHotelForm({ ...hotelForm, city: e.target.value })}
                  placeholder="Berlin"
                  style={{ width: '100%', padding: '10px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>BEGRÜSSUNGSTEXT FÜR GÄSTE</label>
              <textarea
                value={hotelForm.welcome_message}
                onChange={e => setHotelForm({ ...hotelForm, welcome_message: e.target.value })}
                rows={2}
                placeholder="Willkommen! Bestellen Sie bequem In-Room Dining & Services..."
                style={{ width: '100%', padding: '10px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 12, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>W-LAN NETZWERK (SSID)</label>
                <input
                  type="text"
                  value={hotelForm.wifi_ssid}
                  onChange={e => setHotelForm({ ...hotelForm, wifi_ssid: e.target.value })}
                  placeholder="Scenvy_Guest_5G"
                  style={{ width: '100%', padding: '10px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>W-LAN PASSWORT</label>
                <input
                  type="text"
                  value={hotelForm.wifi_pass}
                  onChange={e => setHotelForm({ ...hotelForm, wifi_pass: e.target.value })}
                  placeholder="welcome2026"
                  style={{ width: '100%', padding: '10px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.green, fontWeight: 800, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>REZEPTION TELEFON</label>
                <input
                  type="text"
                  value={hotelForm.phone}
                  onChange={e => setHotelForm({ ...hotelForm, phone: e.target.value })}
                  placeholder="+49 30 12345678"
                  style={{ width: '100%', padding: '10px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>WHATSAPP CONCIERGE HOTLINE</label>
                <input
                  type="text"
                  value={hotelForm.whatsapp}
                  onChange={e => setHotelForm({ ...hotelForm, whatsapp: e.target.value })}
                  placeholder="+49 170 1234567"
                  style={{ width: '100%', padding: '10px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>FRÜHSTÜCKSZEITEN</label>
                <input
                  type="text"
                  value={hotelForm.breakfast_time}
                  onChange={e => setHotelForm({ ...hotelForm, breakfast_time: e.target.value })}
                  placeholder="06:30 - 10:30 Uhr"
                  style={{ width: '100%', padding: '10px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>CHECK-OUT ZEIT</label>
                <input
                  type="text"
                  value={hotelForm.checkout_time}
                  onChange={e => setHotelForm({ ...hotelForm, checkout_time: e.target.value })}
                  placeholder="11:00 Uhr"
                  style={{ width: '100%', padding: '10px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{ marginTop: 12, padding: '14px', background: grad, color: C.white, border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}
            >
              ✓ Hotel Einstellungen Speichern
            </button>
          </form>
        </div>
      )}

      {/* CSV IMPORTER UTILITY MODAL */}
      <CsvImportUtility
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        tenantId={activeTenantId}
        onImportComplete={async (itemsToImport) => {
          await importCSV.mutateAsync({ tenantId: activeTenantId, items: itemsToImport })
          alert(`✅ ${itemsToImport.length} Services erfolgreich in den Service Katalog importiert!`)
        }}
      />

      {/* SERVICE EDIT MODAL */}
      {showServiceModal && editingService && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, width: '100%', maxWidth: 540, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.white }}>Service Bearbeiten</div>
              <button onClick={() => setShowServiceModal(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 4 }}>SERVICE NAME *</label>
                <input
                  type="text"
                  value={editingService.name || ''}
                  onChange={e => setEditingService({ ...editingService, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 4 }}>ABTEILUNG</label>
                  <select
                    value={editingService.department || 'HOUSEKEEPING'}
                    onChange={e => setEditingService({ ...editingService, department: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                  >
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 4 }}>KATEGORIE</label>
                  <input
                    type="text"
                    value={editingService.category || ''}
                    onChange={e => setEditingService({ ...editingService, category: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 4 }}>BESCHREIBUNG</label>
                <textarea
                  value={editingService.description || ''}
                  onChange={e => setEditingService({ ...editingService, description: e.target.value })}
                  style={{ width: '100%', height: 60, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, color: C.white, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 4 }}>PREIS (EUR)</label>
                  <input
                    type="text"
                    value={editingService.price || '0.00'}
                    onChange={e => setEditingService({ ...editingService, price: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 4 }}>ANFRAGE-TYP</label>
                  <select
                    value={editingService.type || 'REQUEST'}
                    onChange={e => setEditingService({ ...editingService, type: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="REQUEST">REQUEST (Service-Anforderung)</option>
                    <option value="ORDER">ORDER (Kostenpflichtige Bestellung)</option>
                    <option value="INCIDENT">INCIDENT (Störungsmeldung)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={async () => {
                  await saveService.mutateAsync({ tenantId: activeTenantId, service: editingService })
                  setShowServiceModal(false)
                }}
                style={{ marginTop: 10, padding: '12px', background: grad, color: C.white, border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 14, cursor: 'pointer' }}
              >
                ✓ Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEPARTMENT EDIT MODAL */}
      {showDeptModal && editingDept && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, width: '100%', maxWidth: 460, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.white }}>Abteilung Bearbeiten</div>
              <button onClick={() => setShowDeptModal(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 4 }}>ABTEILUNG ID *</label>
                <input
                  type="text"
                  value={editingDept.id || ''}
                  onChange={e => setEditingDept({ ...editingDept, id: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                  placeholder="z.B. SPA_WELLNESS"
                  style={{ width: '100%', padding: '10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 4 }}>ABTEILUNGS-NAME *</label>
                <input
                  type="text"
                  value={editingDept.name || ''}
                  onChange={e => setEditingDept({ ...editingDept, name: e.target.value })}
                  placeholder="z.B. Spa & Wellness Lounge"
                  style={{ width: '100%', padding: '10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 4 }}>KENN-FARBE (HEX)</label>
                <input
                  type="color"
                  value={editingDept.color || '#7C3AED'}
                  onChange={e => setEditingDept({ ...editingDept, color: e.target.value })}
                  style={{ width: '100%', height: 40, padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}
                />
              </div>

              <button
                onClick={() => handleSaveDepartment(editingDept)}
                style={{ marginTop: 10, padding: '12px', background: grad, color: C.white, border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 14, cursor: 'pointer' }}
              >
                ✓ Abteilung Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAFF EDIT MODAL */}
      {showStaffModal && editingStaff && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, width: '100%', maxWidth: 500, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.white }}>Mitarbeiter / Staff Bearbeiten</div>
              <button onClick={() => setShowStaffModal(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 4 }}>VOLLER NAME *</label>
                <input
                  type="text"
                  value={editingStaff.name || ''}
                  onChange={e => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  placeholder="z.B. Marco Rossi"
                  style={{ width: '100%', padding: '10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 4 }}>ROLLE / POSITION</label>
                  <input
                    type="text"
                    value={editingStaff.role || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, role: e.target.value })}
                    placeholder="Head Concierge"
                    style={{ width: '100%', padding: '10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 4 }}>ABTEILUNG</label>
                  <select
                    value={editingStaff.department || departments[0]?.id || 'GUEST_SERVICES'}
                    onChange={e => setEditingStaff({ ...editingStaff, department: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                  >
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 4 }}>BEREITSCHAFTS-STATUS</label>
                  <select
                    value={editingStaff.status || 'ON_DUTY'}
                    onChange={e => setEditingStaff({ ...editingStaff, status: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="ON_DUTY">● ON_DUTY (Aktiv im Dienst)</option>
                    <option value="ON_BREAK">☕ ON_BREAK (In Pause)</option>
                    <option value="OFF_DUTY">○ OFF_DUTY (Außer Dienst)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 4 }}>SCHICHT</label>
                  <input
                    type="text"
                    value={editingStaff.shift || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, shift: e.target.value })}
                    placeholder="Frühschicht"
                    style={{ width: '100%', padding: '10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                onClick={() => handleSaveStaff(editingStaff)}
                style={{ marginTop: 10, padding: '12px', background: grad, color: C.white, border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 14, cursor: 'pointer' }}
              >
                ✓ Mitarbeiter Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
