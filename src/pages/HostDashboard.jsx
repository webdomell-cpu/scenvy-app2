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
  useReels
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
  Send
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

  // CSV Import state
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [csvParsed, setCsvParsed] = useState([])

  // QR Code generator state
  const [qrRoomNum, setQrRoomNum] = useState('101')
  const [copiedLink, setCopiedLink] = useState(false)

  // Hooks
  const { data: locations = [] } = useLocations(activeTenantId)
  const activeLocation = locations[0] || { id: 'loc1', name: 'Hauptstandort' }

  const { data: departments = [] } = useHostDepartments(activeTenantId)
  const saveDepartments = useSaveHostDepartments()

  const { data: services = [] } = useHostServices(activeTenantId)
  const saveService = useSaveHostService()
  const deleteService = useDeleteHostService()
  const importCSV = useImportHostServicesCSV()

  const { data: requests = [], isLoading: loadingRequests } = useHostRequests(activeTenantId)
  const updateStatus = useUpdateHostRequestStatus()

  const { data: settings = {} } = useHotelSettings(activeTenantId)
  const saveSettings = useSaveHotelSettings()

  const { data: menuReels = [] } = useReels(activeTenantId)

  // Sound chime on new incoming request
  useEffect(() => {
    if (requests.length > lastReqCount && lastReqCount > 0 && soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime) // C5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3) // A5
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

  // CSV Parsing handler
  const handleParseCsv = () => {
    if (!csvText.trim()) return
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) return

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const rows = []

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim())
      if (parts.length < 2) continue

      const obj = {}
      headers.forEach((h, idx) => {
        obj[h] = parts[idx] || ''
      })

      rows.push({
        id: `csv_${Date.now()}_${i}`,
        department: (obj.department || 'GUEST_SERVICES').toUpperCase(),
        category: obj.category || 'Allgemein',
        name: obj.name || parts[1] || 'Unbenannt',
        description: obj.description || '',
        price: obj.price || '0.00',
        currency: obj.currency || 'EUR',
        active: obj.active !== 'false',
        type: (obj.type || 'REQUEST').toUpperCase()
      })
    }

    setCsvParsed(rows)
  }

  const handleCommitCsv = async () => {
    if (csvParsed.length === 0) return
    await importCSV.mutateAsync({ tenantId: activeTenantId, items: csvParsed })
    setShowCsvModal(false)
    setCsvText('')
    setCsvParsed([])
    alert(`✅ ${csvParsed.length} Services erfolgreich importiert!`)
  }

  // QR Guest Link URL
  const guestBaseUrl = `${window.location.origin}/h/${activeLocation.id}`
  const currentQrGuestUrl = `${guestBaseUrl}?room=${encodeURIComponent(qrRoomNum)}&tenant=${activeTenantId}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentQrGuestUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.white, padding: 24, fontFamily: 'inherit' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(236,72,153,0.1) 100%)',
        borderRadius: 20,
        border: `1px solid ${C.purple}44`,
        padding: '24px 28px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ fontSize: 11, color: C.pink, fontWeight: 800, letterSpacing: 1.5, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ConciergeBell size={16} /> SCENVY HOST HOSPITALITY ECOSYSTEM
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: C.white }}>
            {settings.hotel_name || 'Hotel Management & Concierge Dashboard'}
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
            Mandant: <strong style={{ color: C.white }}>{activeTenantId}</strong> • Echtzeit Anfragen, Department Dispatcher & Service Katalog
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              padding: '10px 14px',
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
          { title: 'Katalog Services', count: services.length, color: C.blue, sub: 'Aktiv im Gästemenü' },
          { title: 'In-Room Dining Items', count: menuReels.length, color: C.orange, sub: 'Aus Scenvy Menu synchronisiert' }
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
      <div style={{ display: 'flex', gap: 8, borderBottom: `1px solid ${C.border}`, paddingBottom: 12, marginBottom: 24 }}>
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
              borderBottom: activeTab === tab.id ? `2px solid ${C.purple}` : '2px solid transparent'
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: LIVE REQUESTS DISPATCHER */}
      {activeTab === 'requests' && (
        <div>
          {/* Filters Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select
                value={selectedDeptFilter}
                onChange={e => setSelectedDeptFilter(e.target.value)}
                style={{ padding: '8px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 12, fontWeight: 700 }}
              >
                <option value="ALL">Alle Abteilungen</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={e => setSelectedStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 12, fontWeight: 700 }}
              >
                <option value="ALL">Alle Status</option>
                <option value="NEW">🚨 NEU</option>
                <option value="ACCEPTED">👍 BESTÄTIGT</option>
                <option value="IN_PROGRESS">⏳ IN BEARBEITUNG</option>
                <option value="ON_THE_WAY">🚀 UNTERWEGS</option>
                <option value="COMPLETED">✅ ERLEDIGT</option>
              </select>
            </div>

            <div style={{ fontSize: 12, color: C.muted }}>
              Zeige {filteredRequests.length} von {requests.length} Anfragen (Automatische 3s Live-Aktualisierung)
            </div>
          </div>

          {/* Requests Feed Table / Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredRequests.length === 0 ? (
              <div style={{ padding: 40, background: C.card, borderRadius: 16, textAlign: 'center', color: C.muted, fontSize: 13 }}>
                Keine Anfragen mit diesem Filter gefunden.
              </div>
            ) : (
              filteredRequests.map(req => {
                const isNew = req.status === 'NEW'
                return (
                  <div
                    key={req.id}
                    style={{
                      background: isNew ? 'rgba(124,58,237,0.12)' : C.card,
                      border: `1px solid ${isNew ? C.purple : C.border}`,
                      borderRadius: 16,
                      padding: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 16
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: C.white }}>
                          Zimmer {req.room_number || '—'}
                        </span>
                        <span style={{ fontSize: 12, color: C.muted }}>• {req.guest_name || 'Gast'}</span>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: `${C.purple}33`, color: C.purple, fontWeight: 800 }}>
                          {req.department}
                        </span>
                      </div>

                      <div style={{ fontSize: 14, fontWeight: 800, color: C.white, marginBottom: 4 }}>
                        {req.items?.map(i => `${i.qty}x ${i.name}`).join(', ') || 'Zimmeranfrage'}
                      </div>

                      {req.notes && (
                        <div style={{ fontSize: 12, color: C.pink, fontWeight: 600 }}>💬 Note: {req.notes}</div>
                      )}

                      <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                        Eingegangen: {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Uhr • Preis: {req.total_price}
                      </div>
                    </div>

                    {/* Status Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {req.status === 'NEW' && (
                        <button
                          onClick={() => updateStatus.mutate({ id: req.id, tenantId: activeTenantId, status: 'ACCEPTED' })}
                          style={{ padding: '8px 14px', borderRadius: 8, background: C.green, color: '#000', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                        >
                          ✓ Bestätigen
                        </button>
                      )}

                      {req.status === 'ACCEPTED' && (
                        <button
                          onClick={() => updateStatus.mutate({ id: req.id, tenantId: activeTenantId, status: 'IN_PROGRESS' })}
                          style={{ padding: '8px 14px', borderRadius: 8, background: C.blue, color: C.white, border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                        >
                          ⏳ Starten
                        </button>
                      )}

                      {req.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => updateStatus.mutate({ id: req.id, tenantId: activeTenantId, status: 'ON_THE_WAY' })}
                          style={{ padding: '8px 14px', borderRadius: 8, background: C.orange, color: C.white, border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                        >
                          🚀 Unterwegs
                        </button>
                      )}

                      {req.status === 'ON_THE_WAY' && (
                        <button
                          onClick={() => updateStatus.mutate({ id: req.id, tenantId: activeTenantId, status: 'COMPLETED' })}
                          style={{ padding: '8px 14px', borderRadius: 8, background: C.purple, color: C.white, border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                        >
                          ✅ Erledigt
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedRequest(req)}
                        style={{ padding: '8px 12px', borderRadius: 8, background: C.card2, color: C.white, border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Details & Historie
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SERVICE CATALOG & CSV IMPORTER */}
      {activeTab === 'catalog' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.white }}>Hotel Service Katalog</div>
              <div style={{ fontSize: 12, color: C.muted }}>Verwalte alle buchbaren Handtücher, In-Room Dining Gerichte, Reparaturen & Services.</div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowCsvModal(true)}
                style={{ padding: '9px 16px', borderRadius: 10, background: `${C.blue}22`, color: C.blue, border: `1px solid ${C.blue}44`, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <FileSpreadsheet size={15} /> CSV Import
              </button>

              <button
                onClick={() => {
                  setEditingService({
                    department: 'HOUSEKEEPING',
                    category: 'Allgemein',
                    name: '',
                    description: '',
                    price: '0.00',
                    currency: 'EUR',
                    type: 'REQUEST',
                    active: true
                  })
                  setShowServiceModal(true)
                }}
                style={{ padding: '9px 16px', borderRadius: 10, background: grad, color: C.white, border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={15} /> Neuer Service
              </button>
            </div>
          </div>

          {/* Scenvy Menu Linked Info Banner */}
          <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', padding: 14, borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: C.white }}>
              🍔 <strong>Scenvy Menu Integration:</strong> {menuReels.length} Produkte aus deiner digitalen Speisekarte stehen automatisch im In-Room Dining Bereich für Hotelgäste zur Verfügung!
            </div>
            <Link to="/menu-generator" style={{ fontSize: 11, color: C.orange, fontWeight: 800, textDecoration: 'none' }}>
              Speisekarte bearbeiten →
            </Link>
          </div>

          {/* Catalog Table */}
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
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

      {/* TAB 3: DEPARTMENTS & STAFF */}
      {activeTab === 'departments' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {departments.map(dept => (
            <div key={dept.id} style={{ background: C.card, border: `1px solid ${dept.color}33`, borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: C.white, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: dept.color }}>●</span> {dept.name}
                </div>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: dept.enabled !== false ? `${C.green}22` : C.card2, color: dept.enabled !== false ? C.green : C.muted }}>
                  {dept.enabled !== false ? 'AKTIV' : 'DEAKTIVIERT'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>ID: {dept.id}</div>
            </div>
          ))}
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
    </div>
  )
}
