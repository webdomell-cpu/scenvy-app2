import React, { useState, useRef } from 'react'
import { C, grad } from '@/tokens'
import {
  FileSpreadsheet,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  FileText,
  RefreshCw,
  Plus,
  Filter,
  Check,
  Edit2,
  Trash2,
  HelpCircle,
  ArrowRight
} from 'lucide-react'

const VALID_DEPARTMENTS = [
  'HOUSEKEEPING',
  'IN_ROOM_DINING',
  'FNB',
  'MAINTENANCE',
  'LAUNDRY',
  'CONCIERGE',
  'GUEST_SERVICES',
  'OTHER'
]

const VALID_TYPES = ['REQUEST', 'ORDER', 'SERVICE', 'INCIDENT']

const SAMPLE_CSV = `category,name,description,price,currency,department,type,active
Bad & Hygiene,Extra Handtücher (2er Set),Frische flauschige Handtücher,0.00,EUR,HOUSEKEEPING,REQUEST,true
Bad & Hygiene,Zahnpflege Set,Einweg-Zahnbürste und Zahnpasta,0.00,EUR,HOUSEKEEPING,REQUEST,true
Zimmer-Komfort,Eiseimer & Gläser,Gefüllter Eiseimer mit Gläsern,0.00,EUR,HOUSEKEEPING,REQUEST,true
Hauptgerichte,Scenvy Gourmet Club Sandwich,Gegrillte Hähnchenbrust mit Bacon & Avocado,18.50,EUR,IN_ROOM_DINING,ORDER,true
Getränke,Aperol Spritz (0.2l),Klassischer Aperitif mit Prosecco,8.50,EUR,IN_ROOM_DINING,ORDER,true
Technik,Klimaanlage Einstellen,Techniker zur Temperaturprüfung,0.00,EUR,MAINTENANCE,INCIDENT,true
Wäscheservice,Express Hemden Bügeln,Bügeln innerhalb von 2 Stunden,6.00,EUR,LAUNDRY,SERVICE,true`

// Robust CSV Line Splitter handling quotes
function parseCsvLine(textLine, delimiter = ',') {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < textLine.length; i++) {
    const char = textLine[i]
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''))
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ''))
  return result
}

export default function CsvImportUtility({
  isOpen,
  onClose,
  tenantId,
  onImportComplete
}) {
  const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'preview'
  const [csvRawText, setCsvRawText] = useState('')
  const [parsedRows, setParsedRows] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [filterStatus, setFilterStatus] = useState('ALL') // 'ALL' | 'VALID' | 'WARNING' | 'ERROR'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  // Auto detect CSV delimiter (, or ;)
  const detectDelimiter = (text) => {
    const firstLine = text.split('\n')[0] || ''
    if (firstLine.includes(';')) return ';'
    if (firstLine.includes('\t')) return '\t'
    return ','
  }

  // Parse and Validate CSV Content
  const processAndValidateCsv = (rawContent) => {
    if (!rawContent || !rawContent.trim()) {
      alert('Bitte CSV-Inhalt eingeben oder eine Datei hochladen.')
      return
    }

    const lines = rawContent.trim().split(/\r?\n/).filter(line => line.trim().length > 0)
    if (lines.length < 2) {
      alert('Die CSV-Datei muss mindestens eine Kopfzeile und eine Datenzeile enthalten.')
      return
    }

    const delimiter = detectDelimiter(rawContent)
    const headers = parseCsvLine(lines[0], delimiter).map(h => h.toLowerCase().trim())

    const rows = []

    for (let idx = 1; idx < lines.length; idx++) {
      const line = lines[idx]
      const values = parseCsvLine(line, delimiter)

      const rowObj = {}
      headers.forEach((h, i) => {
        rowObj[h] = values[i] !== undefined ? values[i] : ''
      })

      // Validation Checks
      const errors = []
      const warnings = []

      // 1. Name Check (Required)
      const rawName = rowObj.name || rowObj['service_name'] || rowObj['title'] || ''
      if (!rawName.trim()) {
        errors.push('Name fehlt (Pflichtfeld)')
      }

      // 2. Department Check
      let rawDept = (rowObj.department || rowObj.dept || rowObj.abteilung || 'GUEST_SERVICES').toUpperCase().replace(/\s+/g, '_')
      if (!VALID_DEPARTMENTS.includes(rawDept)) {
        warnings.push(`Abteilung '${rawDept}' unbekannt. Wird als 'GUEST_SERVICES' eingeordnet.`)
        rawDept = 'GUEST_SERVICES'
      }

      // 3. Price Check
      let rawPrice = (rowObj.price || rowObj.preis || '0.00').toString().replace(',', '.').replace(/[^0-9.]/g, '')
      if (rawPrice === '' || isNaN(parseFloat(rawPrice))) {
        warnings.push('Ungültiger Preis. Auf 0.00 EUR gesetzt.')
        rawPrice = '0.00'
      } else {
        rawPrice = parseFloat(rawPrice).toFixed(2)
      }

      // 4. Type Check
      let rawType = (rowObj.type || rowObj.typ || 'REQUEST').toUpperCase()
      if (!VALID_TYPES.includes(rawType)) {
        warnings.push(`Typ '${rawType}' unbekannt. Standard 'REQUEST' gewählt.`)
        rawType = 'REQUEST'
      }

      // 5. Category Check
      const rawCategory = rowObj.category || rowObj.kategorie || 'Allgemein'

      // 6. Currency Check
      const rawCurrency = (rowObj.currency || rowObj.waehrung || 'EUR').toUpperCase()

      // 7. Active status
      const rawActiveStr = String(rowObj.active || rowObj.aktiv || 'true').toLowerCase()
      const rawActive = rawActiveStr !== 'false' && rawActiveStr !== '0' && rawActiveStr !== 'nein'

      // Row Status Determination
      let status = 'VALID'
      if (errors.length > 0) status = 'ERROR'
      else if (warnings.length > 0) status = 'WARNING'

      rows.push({
        id: `import_row_${idx}_${Date.now()}`,
        rowNumber: idx + 1,
        selected: errors.length === 0, // auto select valid and warning rows
        name: rawName,
        category: rawCategory,
        description: rowObj.description || rowObj.beschreibung || '',
        price: rawPrice,
        currency: rawCurrency,
        department: rawDept,
        type: rawType,
        active: rawActive,
        errors,
        warnings,
        status
      })
    }

    setParsedRows(rows)
    setActiveTab('preview')
  }

  // Handle File Upload Read
  const handleFileUpload = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      setCsvRawText(text)
      processAndValidateCsv(text)
    }
    reader.readAsText(file)
  }

  // Drag & Drop handlers
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  // Download Sample Template
  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'scenvy_service_catalog_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Edit parsed row inline
  const updateParsedRow = (id, field, value) => {
    setParsedRows(prev => prev.map(row => {
      if (row.id !== id) return row
      const updated = { ...row, [field]: value }

      // Re-validate row
      const errors = []
      const warnings = []
      if (!updated.name.trim()) errors.push('Name fehlt')
      if (!VALID_DEPARTMENTS.includes(updated.department)) {
        warnings.push('Unbekannte Abteilung')
      }

      let status = 'VALID'
      if (errors.length > 0) status = 'ERROR'
      else if (warnings.length > 0) status = 'WARNING'

      return {
        ...updated,
        errors,
        warnings,
        status,
        selected: errors.length === 0 ? updated.selected : false
      }
    }))
  }

  // Toggle Selection
  const toggleRowSelect = (id) => {
    setParsedRows(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r))
  }

  const toggleSelectAll = (select) => {
    setParsedRows(prev => prev.map(r => r.status !== 'ERROR' ? { ...r, selected: select } : r))
  }

  // Filtered Rows for Preview Table
  const displayRows = parsedRows.filter(r => {
    if (filterStatus === 'ALL') return true
    return r.status === filterStatus
  })

  // Summary counts
  const totalCount = parsedRows.length
  const validCount = parsedRows.filter(r => r.status === 'VALID').length
  const warningCount = parsedRows.filter(r => r.status === 'WARNING').length
  const errorCount = parsedRows.filter(r => r.status === 'ERROR').length
  const selectedCount = parsedRows.filter(r => r.selected).length

  // Final Commit to Service Catalog
  const handleCommitImport = async () => {
    const itemsToImport = parsedRows.filter(r => r.selected && r.status !== 'ERROR')
    if (itemsToImport.length === 0) {
      alert('Keine gültigen Zeilen zum Importieren ausgewählt.')
      return
    }

    setIsSubmitting(true)
    try {
      if (onImportComplete) {
        await onImportComplete(itemsToImport)
      }
      onClose()
    } catch (err) {
      alert('Fehler beim Speichern der Katalog-Daten: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(16px)',
      zIndex: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        background: C.card,
        border: `1px solid ${C.purple}55`,
        borderRadius: 24,
        width: '100%',
        maxWidth: 960,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(11,13,20,0.8) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: `${C.purple}33`,
              border: `1px solid ${C.purple}66`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.purple
            }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.white }}>
                Service Catalog CSV Import Manager
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>
                Importieren, validieren und aktualisieren Sie Hotel-Services per CSV/Excel.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleDownloadSample}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                background: C.card2,
                color: C.white,
                border: `1px solid ${C.border}`,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Download size={14} color={C.blue} /> Template CSV Herunterladen
            </button>

            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${C.border}`,
          background: C.bg,
          padding: '0 24px'
        }}>
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '14px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'upload' ? `2px solid ${C.purple}` : '2px solid transparent',
              color: activeTab === 'upload' ? C.white : C.muted,
              fontSize: 13,
              fontWeight: activeTab === 'upload' ? 800 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Upload size={16} /> 1. Datei Upload & Eingabe
          </button>

          <button
            onClick={() => processAndValidateCsv(csvRawText)}
            style={{
              padding: '14px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'preview' ? `2px solid ${C.purple}` : '2px solid transparent',
              color: activeTab === 'preview' ? C.white : C.muted,
              fontSize: 13,
              fontWeight: activeTab === 'preview' ? 800 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <CheckCircle2 size={16} /> 2. Validierung & Vorschau Modal ({parsedRows.length})
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {/* TAB 1: UPLOAD & PASTE */}
          {activeTab === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Drag & Drop Box */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? C.purple : 'rgba(255,255,255,0.15)'}`,
                  background: isDragging ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.02)',
                  borderRadius: 18,
                  padding: 32,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.txt"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  style={{ display: 'none' }}
                />

                <div style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  background: grad,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: C.white,
                  margin: '0 auto 12px',
                  boxShadow: '0 8px 24px rgba(124,58,237,0.4)'
                }}>
                  <Upload size={26} />
                </div>

                <div style={{ fontSize: 16, fontWeight: 800, color: C.white, marginBottom: 4 }}>
                  CSV-Datei hierher ziehen oder durchsuchen
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  Unterstützt .csv und .txt Dateien mit Komma-, Semikolon- oder Tab-Trennzeichen.
                </div>
              </div>

              {/* Textarea Paste */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: C.white, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={15} color={C.purple} /> ODER CSV TEXT DIREKT EINFÜGEN
                  </label>
                  <button
                    onClick={() => setCsvRawText(SAMPLE_CSV)}
                    style={{ background: 'none', border: 'none', color: C.purple, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    ✦ Beispiel-CSV Einfügen
                  </button>
                </div>

                <textarea
                  value={csvRawText}
                  onChange={(e) => setCsvRawText(e.target.value)}
                  placeholder={`category,name,description,price,currency,department,type,active\nBad & Hygiene,Extra Handtücher,2x flauschige Handtücher,0.00,EUR,HOUSEKEEPING,REQUEST,true`}
                  style={{
                    width: '100%',
                    height: 180,
                    borderRadius: 14,
                    border: `1px solid ${C.border}`,
                    background: C.bg,
                    color: C.white,
                    padding: 14,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                onClick={() => processAndValidateCsv(csvRawText)}
                disabled={!csvRawText.trim()}
                style={{
                  padding: '14px',
                  borderRadius: 14,
                  background: csvRawText.trim() ? grad : C.card2,
                  color: C.white,
                  border: 'none',
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: csvRawText.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: csvRawText.trim() ? '0 6px 20px rgba(124,58,237,0.4)' : 'none'
                }}
              >
                <span>CSV Analysieren & Validierungs-Vorschau Öffnen</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* TAB 2: VALIDATION & PREVIEW TABLE */}
          {activeTab === 'preview' && (
            <div>
              {/* Summary Metrics Bar */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
                marginBottom: 20
              }}>
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, padding: 12, borderRadius: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: C.muted }}>GESAMT ZEILEN</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: C.white }}>{totalCount}</div>
                </div>

                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: 12, borderRadius: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#10B981' }}>🟢 GÜLTIG</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#10B981' }}>{validCount}</div>
                </div>

                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', padding: 12, borderRadius: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#F59E0B' }}>🟡 WARNUNGEN</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#F59E0B' }}>{warningCount}</div>
                </div>

                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: 12, borderRadius: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#EF4444' }}>🔴 FEHLERHAFT</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#EF4444' }}>{errorCount}</div>
                </div>

                <div style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', padding: 12, borderRadius: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: C.purple }}>SELECTED TO IMPORT</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: C.white }}>{selectedCount} / {totalCount}</div>
                </div>
              </div>

              {/* Status Filter Tabs & Selection Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { id: 'ALL', label: `Alle (${totalCount})` },
                    { id: 'VALID', label: `🟢 Gültig (${validCount})` },
                    { id: 'WARNING', label: `🟡 Warnungen (${warningCount})` },
                    { id: 'ERROR', label: `🔴 Fehler (${errorCount})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterStatus(tab.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: filterStatus === tab.id ? C.purple : C.card2,
                        color: C.white,
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => toggleSelectAll(true)}
                    style={{ padding: '6px 12px', borderRadius: 8, background: C.card2, color: C.white, border: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Alle Auswählen
                  </button>
                  <button
                    onClick={() => toggleSelectAll(false)}
                    style={{ padding: '6px 12px', borderRadius: 8, background: C.card2, color: C.white, border: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Auswahl Aufheben
                  </button>
                </div>
              </div>

              {/* Interactive Editable Table */}
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: C.card, borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 12px', width: 40, textAlign: 'center' }}>Import</th>
                      <th style={{ padding: '10px 12px', width: 80 }}>Status</th>
                      <th style={{ padding: '10px 12px' }}>Name *</th>
                      <th style={{ padding: '10px 12px' }}>Abteilung</th>
                      <th style={{ padding: '10px 12px' }}>Kategorie</th>
                      <th style={{ padding: '10px 12px', width: 90 }}>Preis (€)</th>
                      <th style={{ padding: '10px 12px', width: 100 }}>Typ</th>
                      <th style={{ padding: '10px 12px' }}>Hinweise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: C.muted }}>
                          Keine Zeilen für diesen Statusfilter.
                        </td>
                      </tr>
                    ) : (
                      displayRows.map(row => (
                        <tr key={row.id} style={{
                          borderBottom: `1px solid ${C.border}`,
                          background: row.status === 'ERROR' ? 'rgba(239,68,68,0.06)' : row.status === 'WARNING' ? 'rgba(245,158,11,0.04)' : 'transparent'
                        }}>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={row.selected}
                              disabled={row.status === 'ERROR'}
                              onChange={() => toggleRowSelect(row.id)}
                              style={{ width: 16, height: 16, accentColor: C.purple, cursor: 'pointer' }}
                            />
                          </td>

                          <td style={{ padding: '10px 12px' }}>
                            {row.status === 'VALID' && (
                              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.2)', color: '#10B981', fontWeight: 800 }}>
                                🟢 OK
                              </span>
                            )}
                            {row.status === 'WARNING' && (
                              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.2)', color: '#F59E0B', fontWeight: 800 }}>
                                🟡 Warnung
                              </span>
                            )}
                            {row.status === 'ERROR' && (
                              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.2)', color: '#EF4444', fontWeight: 800 }}>
                                🔴 Fehler
                              </span>
                            )}
                          </td>

                          {/* Inline Editable Fields */}
                          <td style={{ padding: '10px 12px' }}>
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) => updateParsedRow(row.id, 'name', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '4px 8px',
                                background: 'rgba(0,0,0,0.3)',
                                border: row.errors.some(e => e.includes('Name')) ? '1px solid #EF4444' : `1px solid ${C.border}`,
                                borderRadius: 6,
                                color: C.white,
                                fontSize: 12,
                                outline: 'none'
                              }}
                            />
                          </td>

                          <td style={{ padding: '10px 12px' }}>
                            <select
                              value={row.department}
                              onChange={(e) => updateParsedRow(row.id, 'department', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '4px 6px',
                                background: 'rgba(0,0,0,0.3)',
                                border: `1px solid ${C.border}`,
                                borderRadius: 6,
                                color: C.white,
                                fontSize: 11,
                                outline: 'none'
                              }}
                            >
                              {VALID_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </td>

                          <td style={{ padding: '10px 12px' }}>
                            <input
                              type="text"
                              value={row.category}
                              onChange={(e) => updateParsedRow(row.id, 'category', e.target.value)}
                              style={{ width: '100%', padding: '4px 8px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.border}`, borderRadius: 6, color: C.white, fontSize: 11 }}
                            />
                          </td>

                          <td style={{ padding: '10px 12px' }}>
                            <input
                              type="text"
                              value={row.price}
                              onChange={(e) => updateParsedRow(row.id, 'price', e.target.value)}
                              style={{ width: '100%', padding: '4px 8px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.border}`, borderRadius: 6, color: C.white, fontSize: 11 }}
                            />
                          </td>

                          <td style={{ padding: '10px 12px' }}>
                            <select
                              value={row.type}
                              onChange={(e) => updateParsedRow(row.id, 'type', e.target.value)}
                              style={{ width: '100%', padding: '4px 6px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.border}`, borderRadius: 6, color: C.white, fontSize: 11 }}
                            >
                              {VALID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>

                          <td style={{ padding: '10px 12px', fontSize: 10 }}>
                            {row.errors.map((e, idx) => (
                              <div key={idx} style={{ color: '#EF4444', fontWeight: 700 }}>⚠️ {e}</div>
                            ))}
                            {row.warnings.map((w, idx) => (
                              <div key={idx} style={{ color: '#F59E0B' }}>ℹ️ {w}</div>
                            ))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${C.border}`,
          background: C.bg,
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              background: C.card2,
              color: C.white,
              border: `1px solid ${C.border}`,
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Abbrechen
          </button>

          {activeTab === 'preview' && (
            <button
              onClick={handleCommitImport}
              disabled={selectedCount === 0 || isSubmitting}
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                background: selectedCount > 0 ? grad : C.card2,
                color: C.white,
                border: 'none',
                fontWeight: 900,
                fontSize: 13,
                cursor: selectedCount > 0 && !isSubmitting ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: selectedCount > 0 ? '0 4px 16px rgba(124,58,237,0.4)' : 'none'
              }}
            >
              {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              <span>{isSubmitting ? 'Speichere in Datenbank...' : `${selectedCount} Services in Service Katalog Speichern`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
