import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, grad } from '@/tokens'
import { ScenvyLogoFull } from '@/components/ScenvyLogo'
import { useAuth } from '@/lib/AuthContext'
import { useTenant, useMenuReels, useSaveMenuReel, useDeleteMenuReel, useLocations, useSaveLocation, useDeleteLocation, useMedia, uploadMedia, formatDateTime } from '@/lib/db'
import GuestMenuReel, { isScheduleActive, JaggedStar13 } from '@/pages/GuestMenuReel'
import { copyToClipboard } from '@/storage'
import { Sparkles, FileText, Upload, Edit3, Palette, Phone, Instagram, QrCode, Download, Share2, Copy, Trash2, Eye, Plus, ArrowRight, CheckCircle2, Lock, ShieldAlert, ArrowLeft, Maximize2, Minimize2, Clock, MapPin, ExternalLink, Calendar, Zap, Check, Globe } from 'lucide-react'

export default function MenuGenerator({ embedded = false, initialTab }) {
  const nav = useNavigate()
  const { user } = useAuth()
  const tenantId = user?.tenant_id
  const { data: tenant } = useTenant(tenantId)
  const { data: menuReels = [], isLoading: loadingReels } = useMenuReels(tenantId)
  const { data: locations = [], isLoading: loadingLocations } = useLocations(tenantId)
  const { data: mediaItems = [] } = useMedia(tenantId)
  const saveMenuReel = useSaveMenuReel()
  const deleteMenuReel = useDeleteMenuReel()
  const saveLocation = useSaveLocation()
  const deleteLocation = useDeleteLocation()

  // Feature Flag gating
  const isFeatureEnabled = tenant?.features?.menu_reel_generator !== false

  const [activeTab, setActiveTab] = useState(initialTab || 'create') // 'create' | 'list' | 'locations' | 'design' | 'settings'

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])
  const [inputTab, setInputTab] = useState('doc') // 'doc' | 'manual' | 'branding'
  const [isGenerating, setIsGenerating] = useState(false)
  const [genStep, setGenStep] = useState('')
  const [toast, setToast] = useState(null)
  const [showMediaModal, setShowMediaModal] = useState(false)
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false)

  // Input states
  const [documentText, setDocumentText] = useState('')
  const [fileBase64, setFileBase64] = useState(null)
  const [fileMimeType, setFileMimeType] = useState(null)
  const [fileName, setFileName] = useState('')
  const [uploadedImage, setUploadedImage] = useState(null)
  const [venue, setVenue] = useState(tenant?.name || '')
  const [style, setStyle] = useState('fine_dining')
  const [primaryColor, setPrimaryColor] = useState('#7C3AED')
  const [secondaryColor, setSecondaryColor] = useState('#FF2D8D')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [instagram, setInstagram] = useState('')
  const [address, setAddress] = useState('')

  // Preview & Editor state
  const [currentMenu, setCurrentMenu] = useState(null)
  const [selectedMenuForView, setSelectedMenuForView] = useState(null)
  const [editingMenuId, setEditingMenuId] = useState(null)
  const [showBrandingInTable, setShowBrandingInTable] = useState(true)
  const csvInputRef = React.useRef(null)

  // Location & Highlight Management states
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [editingLocId, setEditingLocId] = useState(null)
  const [locForm, setLocForm] = useState({
    name: '',
    slug: '',
    address: '',
    zip: '',
    city: 'München',
    googleMapsUrl: '',
    phone: '',
    tablesCount: 15,
    active: true,
    highlight: {
      enabled: true,
      title: '🔥 Happy Hour & Tagesempfehlung',
      text: '2-for-1 Signature Cocktails & Snack-Platte von 17:00–19:30 Uhr!',
      startTime: '17:00',
      endTime: '19:30',
      badge: 'TAGES-HIGHLIGHT',
      color: '#7C3AED'
    }
  })

  // Schedule input states for current menu
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduleStartTime, setScheduleStartTime] = useState('11:30')
  const [scheduleEndTime, setScheduleEndTime] = useState('14:30')
  const [scheduleLocationId, setScheduleLocationId] = useState('all')

  // Article Master Table Editor filters & state
  const [articleSearch, setArticleSearch] = useState('')
  const [selectedCatFilter, setSelectedCatFilter] = useState('ALL')
  const [dietFilter, setDietFilter] = useState('ALL') // 'ALL' | 'vegan' | 'vegetarian' | 'spicy' | 'glutenfree'

  const updateArticleInMenu = (catId, itemId, field, value) => {
    if (!currentMenu || !currentMenu.categories) return

    let updatedCategories = [...currentMenu.categories]

    // Moving item to another category
    if (field === 'catId') {
      let itemToMove = null
      updatedCategories = updatedCategories.map(cat => {
        if (cat.items?.some(i => i.id === itemId)) {
          itemToMove = cat.items.find(i => i.id === itemId)
          return { ...cat, items: cat.items.filter(i => i.id !== itemId) }
        }
        return cat
      })

      if (itemToMove) {
        updatedCategories = updatedCategories.map(cat => {
          if (cat.id === value) {
            return { ...cat, items: [...(cat.items || []), itemToMove] }
          }
          return cat
        })
      }
    } else {
      // Standard inline field updates
      updatedCategories = updatedCategories.map(cat => {
        if (!cat.items) return cat
        const newItems = cat.items.map(item => {
          if (item.id === itemId) {
            if (field === 'name') {
              const nameObj = typeof item.name === 'object' ? { ...item.name, de: value } : value
              return { ...item, name: nameObj }
            }
            if (field === 'description') {
              const descObj = typeof item.description === 'object' ? { ...item.description, de: value } : value
              return { ...item, description: descObj }
            }
            if (field === 'price') return { ...item, price: value }
            if (field === 'spicy') return { ...item, spicy: value }
            if (field === 'allergens') {
              const arr = value ? value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : []
              return { ...item, allergens: arr }
            }
            if (field === 'diet_vegan') {
              let diet = Array.isArray(item.diet) ? [...item.diet] : []
              if (value && !diet.includes('vegan')) diet.push('vegan')
              if (!value) diet = diet.filter(d => d !== 'vegan')
              return { ...item, diet, vegan: value }
            }
            if (field === 'diet_vegetarian') {
              let diet = Array.isArray(item.diet) ? [...item.diet] : []
              if (value && !diet.includes('vegetarian')) diet.push('vegetarian')
              if (!value) diet = diet.filter(d => d !== 'vegetarian')
              return { ...item, diet, vegetarian: value }
            }
            if (field === 'diet_glutenfree') {
              let diet = Array.isArray(item.diet) ? [...item.diet] : []
              if (value && !diet.includes('glutenfree')) diet.push('glutenfree')
              if (!value) diet = diet.filter(d => d !== 'glutenfree')
              return { ...item, diet, glutenFree: value }
            }
          }
          return item
        })
        return { ...cat, items: newItems }
      })
    }

    const newMenu = { ...currentMenu, categories: updatedCategories }
    setCurrentMenu(newMenu)
    try {
      localStorage.setItem('scenvy_cached_menu', JSON.stringify(newMenu))
    } catch (e) {}
  }

  const deleteArticleFromMenu = (itemId) => {
    if (!currentMenu || !currentMenu.categories) return
    const updatedCategories = currentMenu.categories.map(cat => ({
      ...cat,
      items: (cat.items || []).filter(i => i.id !== itemId)
    }))
    const newMenu = { ...currentMenu, categories: updatedCategories }
    setCurrentMenu(newMenu)
    try {
      localStorage.setItem('scenvy_cached_menu', JSON.stringify(newMenu))
    } catch (e) {}
    notify('🗑️ Artikel gelöscht.')
  }

  const addNewArticleToMenu = (targetCatId) => {
    if (!currentMenu || !currentMenu.categories?.length) {
      addNewCategoryToMenu()
      return
    }
    const catId = targetCatId || currentMenu.categories[0].id
    const newItem = {
      id: 'item_' + Date.now(),
      name: { de: 'Neues Gericht / Getränk', en: 'New Item' },
      description: { de: 'Frische Zutaten & hausgemachte Zubereitung...', en: 'Fresh ingredients...' },
      price: '9.90 €',
      allergens: [],
      diet: [],
      spicy: false
    }

    const updatedCategories = currentMenu.categories.map(cat => {
      if (cat.id === catId) {
        return { ...cat, items: [...(cat.items || []), newItem] }
      }
      return cat
    })

    const newMenu = { ...currentMenu, categories: updatedCategories }
    setCurrentMenu(newMenu)
    try {
      localStorage.setItem('scenvy_cached_menu', JSON.stringify(newMenu))
    } catch (e) {}
    notify('✨ Neuer Artikel hinzugefügt!')
  }

  const addNewCategoryToMenu = () => {
    if (!currentMenu) {
      const newMenu = {
        branding: { name: venue || 'Gourmet Bistro' },
        categories: [
          {
            id: 'cat_' + Date.now(),
            name: { de: 'Neue Kategorie', en: 'New Category' },
            icon: '🍽️',
            items: []
          }
        ]
      }
      setCurrentMenu(newMenu)
      try {
        localStorage.setItem('scenvy_cached_menu', JSON.stringify(newMenu))
      } catch (e) {}
      notify('✨ Neue Kategorie erstellt!')
      return
    }

    const newCat = {
      id: 'cat_' + Date.now(),
      name: { de: 'Neue Kategorie', en: 'New Category' },
      icon: '🍽️',
      items: []
    }
    const newMenu = { ...currentMenu, categories: [...(currentMenu.categories || []), newCat] }
    setCurrentMenu(newMenu)
    try {
      localStorage.setItem('scenvy_cached_menu', JSON.stringify(newMenu))
    } catch (e) {}
    notify('✨ Neue Kategorie erstellt!')
  }

  const updateCategoryInMenu = (catId, field, value) => {
    if (!currentMenu || !currentMenu.categories) return
    const updatedCategories = currentMenu.categories.map(cat => {
      if (cat.id === catId) {
        if (field === 'name') {
          const nameObj = typeof cat.name === 'object' ? { ...cat.name, de: value } : value
          return { ...cat, name: nameObj }
        }
        if (field === 'icon') {
          return { ...cat, icon: value }
        }
      }
      return cat
    })
    const newMenu = { ...currentMenu, categories: updatedCategories }
    setCurrentMenu(newMenu)
    try {
      localStorage.setItem('scenvy_cached_menu', JSON.stringify(newMenu))
    } catch (e) {}
  }

  const deleteCategoryFromMenu = (catId) => {
    if (!currentMenu || !currentMenu.categories) return
    if (!window.confirm('Soll diese Kategorie samt allen enthaltenen Artikeln gelöscht werden?')) return
    const updatedCategories = currentMenu.categories.filter(cat => cat.id !== catId)
    const newMenu = { ...currentMenu, categories: updatedCategories }
    setCurrentMenu(newMenu)
    try {
      localStorage.setItem('scenvy_cached_menu', JSON.stringify(newMenu))
    } catch (e) {}
    notify('🗑️ Kategorie gelöscht.')
  }

  const exportArticlesToCSV = () => {
    if (!currentMenu || !currentMenu.categories) return
    let csv = 'Kategorie;Artikel Name;Beschreibung;Preis;Scharf;Vegan;Vegetarisch;Glutenfrei;Allergene\n'

    currentMenu.categories.forEach(cat => {
      const catName = (typeof cat.name === 'object' ? (cat.name.de || cat.name.en || '') : cat.name).replace(/;/g, ',')
      ;(cat.items || []).forEach(item => {
        const name = (typeof item.name === 'object' ? (item.name.de || item.name.en || '') : item.name).replace(/;/g, ',')
        const desc = (typeof item.description === 'object' ? (item.description.de || item.description.en || '') : (item.description || '')).replace(/;/g, ',')
        const price = (item.price || '').replace(/;/g, ',')
        const spicy = item.spicy ? 'Ja' : 'Nein'
        const vegan = (item.diet || []).includes('vegan') || item.vegan ? 'Ja' : 'Nein'
        const veggie = (item.diet || []).includes('vegetarian') || item.vegetarian ? 'Ja' : 'Nein'
        const glutenfree = (item.diet || []).includes('glutenfree') || item.glutenFree ? 'Ja' : 'Nein'
        const allergens = Array.isArray(item.allergens) ? item.allergens.join(', ') : (item.allergens || '')

        csv += `"${catName}";"${name}";"${desc}";"${price}";"${spicy}";"${vegan}";"${veggie}";"${glutenfree}";"${allergens}"\n`
      })
    })

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `artikelstamm_${(currentMenu.branding?.name || venue || 'speisekarte').toLowerCase().replace(/\s+/g, '_')}.csv`
    a.click()
    notify('📥 Artikelstamm-CSV heruntergeladen!')
  }

  const openMenuInEditor = (m) => {
    if (!m) return
    const data = m.data || m
    setEditingMenuId(m.id || null)
    setCurrentMenu({
      ...data,
      id: m.id || data.id
    })
    if (data.branding) {
      if (data.branding.name) setVenue(data.branding.name)
      if (data.branding.primaryColor) setPrimaryColor(data.branding.primaryColor)
      if (data.branding.secondaryColor) setSecondaryColor(data.branding.secondaryColor)
      if (data.branding.style) setStyle(data.branding.style)
      if (data.branding.phone) setPhone(data.branding.phone)
      if (data.branding.email) setEmail(data.branding.email)
      if (data.branding.whatsapp) setWhatsapp(data.branding.whatsapp)
      if (data.branding.instagram) setInstagram(data.branding.instagram)
      if (data.branding.address) setAddress(data.branding.address)
    }
    setActiveTab('articles')
    notify(`📊 Artikelstamm für "${data.branding?.name || m.title || 'Digital Menu'}" geladen!`)
  }

  const handleCSVImport = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result
      if (!text || typeof text !== 'string') return

      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
      if (lines.length === 0) {
        notify('⚠️ CSV-Datei ist leer.')
        return
      }

      const firstLine = lines[0]
      const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ','

      const categoriesMap = {}

      lines.forEach((line, idx) => {
        if (idx === 0 && (line.toLowerCase().includes('kategorie') || line.toLowerCase().includes('preis') || line.toLowerCase().includes('artikel'))) {
          return
        }

        const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''))
        if (cols.length < 2) return

        let catName = 'Hauptspeisen'
        let name = ''
        let desc = ''
        let price = ''
        let spicyStr = ''
        let veganStr = ''
        let veggieStr = ''
        let glutenfreeStr = ''
        let allergensStr = ''

        if (cols.length === 2) {
          name = cols[0]
          price = cols[1]
        } else if (cols.length === 3) {
          name = cols[0]
          desc = cols[1]
          price = cols[2]
        } else if (cols.length >= 4) {
          catName = cols[0] || 'Hauptspeisen'
          name = cols[1]
          desc = cols[2]
          price = cols[3]
          spicyStr = cols[4] || ''
          veganStr = cols[5] || ''
          veggieStr = cols[6] || ''
          glutenfreeStr = cols[7] || ''
          allergensStr = cols[8] || ''
        }

        if (!name) return

        const catKey = catName.toLowerCase()
        if (!categoriesMap[catKey]) {
          categoriesMap[catKey] = {
            id: 'cat_csv_' + Math.random().toString(36).substr(2, 6),
            name: catName,
            icon: '🍽️',
            items: []
          }
        }

        const isSpicy = spicyStr.toLowerCase().includes('ja') || spicyStr.toLowerCase().includes('yes') || spicyStr === 'true' || spicyStr === '1'
        const isVegan = veganStr.toLowerCase().includes('ja') || veganStr.toLowerCase().includes('yes') || veganStr === 'true' || veganStr === '1'
        const isVeggie = veggieStr.toLowerCase().includes('ja') || veggieStr.toLowerCase().includes('yes') || veggieStr === 'true' || veggieStr === '1'
        const isGlutenfree = glutenfreeStr.toLowerCase().includes('ja') || glutenfreeStr.toLowerCase().includes('yes') || glutenfreeStr === 'true' || glutenfreeStr === '1'

        const diet = []
        if (isVegan) diet.push('vegan')
        if (isVeggie) diet.push('vegetarian')
        if (isGlutenfree) diet.push('glutenfree')

        const allergens = allergensStr ? allergensStr.split(/[,;]/).map(a => a.trim().toUpperCase()).filter(Boolean) : []

        categoriesMap[catKey].items.push({
          id: 'item_csv_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          name: { de: name, en: name },
          description: { de: desc, en: desc },
          price: price.includes('€') ? price : (price ? `${price} €` : '0.00 €'),
          allergens,
          diet,
          spicy: isSpicy
        })
      })

      const categoriesList = Object.values(categoriesMap)
      if (categoriesList.length === 0) {
        notify('⚠️ Keine gültigen Artikel in der CSV-Datei gefunden.')
        return
      }

      const newMenu = {
        id: editingMenuId || currentMenu?.id || crypto.randomUUID(),
        branding: {
          name: venue || 'CSV Speisekarte',
          primaryColor: primaryColor || '#7C3AED',
          secondaryColor: secondaryColor || '#FF2D8D',
          style: style || 'fine_dining',
          phone,
          email,
          whatsapp,
          instagram,
          address
        },
        categories: categoriesList
      }

      setCurrentMenu(newMenu)
      try {
        localStorage.setItem('scenvy_cached_menu', JSON.stringify(newMenu))
      } catch (e) {}

      notify(`📥 CSV Import erfolgreich! ${categoriesList.reduce((a, c) => a + c.items.length, 0)} Artikel in ${categoriesList.length} Kategorien geladen.`)
    }
    reader.readAsText(file)
    if (event.target) event.target.value = ''
  }

  const handleOpenNewLocationModal = () => {
    setEditingLocId(null)
    setLocForm({
      name: '',
      slug: '',
      address: '',
      zip: '',
      city: 'München',
      googleMapsUrl: '',
      phone: '',
      tablesCount: 15,
      active: true,
      highlight: {
        enabled: true,
        title: '🔥 Happy Hour & Tagesempfehlung',
        text: '2-for-1 Signature Cocktails & Snack-Platte von 17:00–19:30 Uhr!',
        startTime: '17:00',
        endTime: '19:30',
        startDate: '',
        endDate: '',
        badge: 'TAGES-HIGHLIGHT',
        batchName: 'Batch 1 - Hauptstandort',
        badgeShape: 'jagged_star_13',
        color: '#7C3AED',
        exactLocation: 'Hauptplatz 12, München',
        bgImage: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80',
        price: '9,90 €'
      }
    })
    setShowLocationModal(true)
  }

  const handleEditLocation = (loc) => {
    setEditingLocId(loc.id)
    const hl = loc.highlight || {}
    setLocForm({
      name: loc.name || '',
      slug: loc.slug || (loc.name ? loc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : ''),
      address: loc.address || '',
      zip: loc.zip || '',
      city: loc.city || 'München',
      googleMapsUrl: loc.googleMapsUrl || '',
      phone: loc.phone || '',
      tablesCount: loc.tablesCount || 15,
      active: loc.active !== false,
      highlight: {
        enabled: hl.enabled !== false,
        title: hl.title || '🔥 Happy Hour Specials',
        text: hl.text || '',
        startTime: hl.startTime || '12:00',
        endTime: hl.endTime || '22:00',
        startDate: hl.startDate || '',
        endDate: hl.endDate || '',
        badge: hl.badge || 'SPEZIAL',
        batchName: hl.batchName || 'Batch 1',
        badgeShape: hl.badgeShape || hl.starStyle || 'jagged_star_13',
        color: hl.color || '#7C3AED',
        exactLocation: hl.exactLocation || (loc.address ? `${loc.address}, ${loc.city || ''}`.trim() : ''),
        bgImage: hl.bgImage || hl.image || '',
        price: hl.price || ''
      }
    })
    setShowLocationModal(true)
  }

  const handleSaveLocationSubmit = async (e) => {
    e.preventDefault()
    if (!locForm.name) {
      notify('⚠️ Bitte gib einen Standortnamen ein.')
      return
    }

    try {
      await saveLocation.mutateAsync({
        location: {
          id: editingLocId || crypto.randomUUID(),
          tenant_id: tenantId,
          ...locForm
        },
        tenantId
      })
      notify(editingLocId ? '✅ Standort erfolgreich aktualisiert!' : '✨ Neuer Standort angelegt!')
      setShowLocationModal(false)
    } catch (err) {
      console.error('Save location error:', err)
      notify('⚠️ Fehler beim Speichern des Standorts.')
    }
  }

  const handleDeleteLocation = async (id) => {
    if (!window.confirm('Möchtest du diesen Standort wirklich löschen?')) return
    try {
      await deleteLocation.mutateAsync({ id, tenantId })
      notify('🗑️ Standort gelöscht.')
    } catch (err) {
      notify('⚠️ Fehler beim Löschen.')
    }
  }

  // Caching mechanism: Restore last generated menu on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem('scenvy_cached_menu')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed && parsed.categories?.length) {
          setCurrentMenu(parsed)
          if (parsed.branding) {
            if (parsed.branding.name) setVenue(parsed.branding.name)
            if (parsed.branding.phone) setPhone(parsed.branding.phone)
            if (parsed.branding.address) setAddress(parsed.branding.address)
            if (parsed.branding.whatsapp) setWhatsapp(parsed.branding.whatsapp)
            if (parsed.branding.instagram) setInstagram(parsed.branding.instagram)
          }
        }
      }
    } catch (err) {
      console.warn('LocalStorage cache restore error:', err)
    }
  }, [])

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 50MB Size limit check to prevent crashes
    const MAX_MB = 50
    if (file.size > MAX_MB * 1024 * 1024) {
      notify(`⚠️ Datei zu groß (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max ${MAX_MB}MB erlaubt.`)
      return
    }

    setFileName(file.name)
    setFileMimeType(file.type || 'application/pdf')
    // Clear previous menu cache when a new file is uploaded
    try {
      localStorage.removeItem('scenvy_cached_menu')
    } catch (e) {}

    // Read as Base64 for Multimodal Gemini AI processing
    const reader = new FileReader()
    reader.onerror = () => {
      notify(`❌ Fehler beim Lesen der Datei "${file.name}". Bitte erneut versuchen.`)
    }
    reader.onload = async (event) => {
      try {
        const base64Str = event.target.result
        setFileBase64(base64Str)

        let mime = file.type || 'application/pdf'

        if (file.type.startsWith('image/')) {
          setUploadedImage(base64Str)
          setDocumentText(`[Foto-Speisekarte: ${file.name}]`)
          notify(`📸 Foto "${file.name}" geladen — KI-Analyse startet...`)
        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          mime = 'application/pdf'
          setDocumentText(`[PDF-Speisekarte: ${file.name}]`)
          notify(`📄 PDF "${file.name}" hochgeladen — KI-Analyse startet...`)
        } else {
          if (typeof base64Str === 'string' && !base64Str.startsWith('data:')) {
            setDocumentText(base64Str)
          } else {
            setDocumentText(`[Dokument: ${file.name}]`)
          }
          notify(`📄 Datei "${file.name}" geladen — KI-Analyse startet...`)
        }

        // Auto-trigger AI extraction immediately!
        triggerMenuGeneration(base64Str, mime, file.name)
      } catch (err) {
        console.error('Error processing uploaded file:', err)
        notify(`⚠️ Verarbeitungsfehler bei "${file.name}".`)
      }
    }

    if (file.type.startsWith('image/') || file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      reader.readAsDataURL(file)
    } else {
      reader.readAsText(file)
    }
  }

  const handleSelectFromMedia = (media) => {
    setFileName(media.name || 'Mediathek-Datei')
    if (media.url && (media.type === 'image' || media.url.startsWith('data:image'))) {
      setUploadedImage(media.url)
    }
    setDocumentText(`[Mediathek Speisekarte: ${media.name}]\n- Vorspeisen: Hausgemachte Suppe 7,20€, Vitello Tonnato 14,50€\n- Hauptspeisen: Pizza Burrata & Rucola 13,90€, Tagliolini al Tartufo 19,50€, Lachsfilet vom Grill 24,50€\n- Getränke: Homemade Lemonade 5,20€, Espresso 2,80€`)
    setShowMediaModal(false)
    notify(`🖼️ Aus Mediathek übernommen: ${media.name}`)
    triggerMenuGeneration(null, null, media.name)
  }

  const downloadHTML = (menu) => {
    const data = menu.data || menu
    const htmlContent = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.branding?.name || 'Digital Menu'} - SCENVY MENU</title>
  <style>
    body { margin: 0; font-family: 'Inter', system-ui, sans-serif; background: #0F172A; color: #FFFFFF; padding: 20px; }
    .header { text-align: center; padding: 30px 10px; border-bottom: 2px solid ${data.branding?.primaryColor || '#8B5CF6'}; }
    .title { font-size: 28px; font-weight: 800; color: #FFFFFF; }
    .subtitle { color: #94A3B8; font-size: 14px; margin-top: 6px; }
    .category { margin-top: 30px; }
    .cat-title { font-size: 20px; font-weight: 700; color: ${data.branding?.primaryColor || '#8B5CF6'}; border-bottom: 1px solid #334155; padding-bottom: 8px; }
    .item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed #334155; }
    .item-name { font-weight: 700; font-size: 16px; }
    .item-desc { font-size: 12px; color: #94A3B8; margin-top: 4px; }
    .item-price { font-weight: 800; color: #38BDF8; font-size: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${data.branding?.name || 'Speisekarte'}</div>
    <div class="subtitle">${data.branding?.address || 'Digitale Speisekarte von SCENVY'}</div>
  </div>
  ${(data.categories || []).map(cat => {
    const catName = typeof cat.name === 'object' ? (cat.name.de || cat.name.en || Object.values(cat.name)[0]) : (cat.name || '')
    return `
    <div class="category">
      <div class="cat-title">${cat.emoji || cat.icon || '🍽️'} ${catName}</div>
      ${(cat.items || []).map(item => {
        const itemName = typeof item.name === 'object' ? (item.name.de || item.name.en || Object.values(item.name)[0]) : (item.name || '')
        const itemDesc = typeof item.description === 'object' ? (item.description.de || item.description.en || Object.values(item.description)[0]) : (item.description || item.desc || '')
        return `
        <div class="item">
          <div>
            <div class="item-name">${itemName}</div>
            <div class="item-desc">${itemDesc}</div>
          </div>
          <div class="item-price">${item.price || ''}</div>
        </div>
        `
      }).join('')}
    </div>
    `
  }).join('')}
</body>
</html>`

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${(data.branding?.name || 'speisekarte').toLowerCase().replace(/\s+/g, '_')}_scenvy.html`
    link.click()
    notify('📥 Standalone HTML-Datei heruntergeladen!')
  }

  const triggerMenuGeneration = async (overrideBase64, overrideMime, overrideFileName) => {
    const activeBase64 = overrideBase64 !== undefined ? overrideBase64 : fileBase64
    const activeMime = overrideMime !== undefined ? overrideMime : fileMimeType
    const activeDocText = overrideFileName ? `[PDF/Dokument: ${overrideFileName}]` : documentText

    setIsGenerating(true)
    setGenStep('📄 PDF-Inhalte & Preise werden von KI analysiert...')

    setTimeout(() => setGenStep('🧠 KI-Kategorisierung & Preiserfassung...'), 1200)
    setTimeout(() => setGenStep('🌐 Zweisprachige Übersetzung (DE & EN)...'), 2200)
    setTimeout(() => setGenStep('🎨 Design & Branding werden angepasst...'), 3200)

    try {
      const res = await fetch('/api/ai/parse-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: activeDocText,
          fileBase64: activeBase64,
          fileMimeType: activeMime,
          venue: venue || tenant?.name || '',
          style,
          primaryColor,
          secondaryColor,
          phone,
          email,
          whatsapp,
          instagram,
          address,
        })
      })

      let parsedMenu = null
      if (res.ok) {
        parsedMenu = await res.json()
      } else {
        const errData = await res.json().catch(() => ({}))
        console.error('Menu parsing API error:', errData)
        notify(`⚠️ Fehler bei der KI-Analyse: ${errData?.message || 'Serverfehler oder zu viele Anfragen.'}`)
        setIsGenerating(false)
        return
      }

      if (!parsedMenu || !parsedMenu.categories) {
        notify('⚠️ Die KI konnte das Dokument nicht vollständig parsen. Bitte prüfe die Lesbarkeit oder erstelle Einträge manuell.')
        setIsGenerating(false)
        return
      }

      // Auto-populate branding contact details from AI if detected
      if (parsedMenu.branding) {
        if (!venue && parsedMenu.branding.name && parsedMenu.branding.name !== 'Gourmet Bistro & Bar') setVenue(parsedMenu.branding.name)
        if (!phone && parsedMenu.branding.phone) setPhone(parsedMenu.branding.phone)
        if (!address && parsedMenu.branding.address) setAddress(parsedMenu.branding.address)
        if (!whatsapp && parsedMenu.branding.whatsapp) setWhatsapp(parsedMenu.branding.whatsapp)
        if (!instagram && parsedMenu.branding.instagram) setInstagram(parsedMenu.branding.instagram)
        if (parsedMenu.branding.primaryColor && parsedMenu.branding.primaryColor !== '#7C3AED') setPrimaryColor(parsedMenu.branding.primaryColor)
        if (parsedMenu.branding.secondaryColor && parsedMenu.branding.secondaryColor !== '#FF2D8D') setSecondaryColor(parsedMenu.branding.secondaryColor)
      }

      // Local storage cache
      try {
        localStorage.setItem('scenvy_cached_menu', JSON.stringify(parsedMenu))
      } catch (err) {
        console.warn('Cache write warning:', err)
      }

      setCurrentMenu(parsedMenu)
      setIsGenerating(false)

      const totalItems = parsedMenu.categories?.reduce((sum, c) => sum + (c.items?.length || 0), 0) || 0
      notify(`✨ ${totalItems} Gerichte in ${parsedMenu.categories?.length || 0} Kategorien erfolgreich analysiert!`)

      // Save to Database
      await saveMenuReel.mutateAsync({
        menuReel: {
          id: crypto.randomUUID(),
          title: parsedMenu.branding?.name || 'Digital Menu',
          data: parsedMenu
        },
        tenantId
      }).catch(err => console.warn('Save menu reel warning:', err))
    } catch (err) {
      console.error('Error generating menu:', err)
      setIsGenerating(false)
      notify('⚠️ Fehler bei der KI-Analyse. Bitte erneut versuchen.')
    }
  }

  const handleGenerate = () => {
    triggerMenuGeneration()
  }

  const handleSaveEditedMenu = async (updatedMenu) => {
    const rawMenu = updatedMenu || currentMenu
    if (!rawMenu) return

    const menuToSave = {
      ...rawMenu,
      id: editingMenuId || rawMenu.id || crypto.randomUUID(),
      branding: {
        ...(rawMenu.branding || {}),
        name: venue || rawMenu.branding?.name || 'Digital Menu',
        primaryColor: primaryColor || rawMenu.branding?.primaryColor || '#7C3AED',
        secondaryColor: secondaryColor || rawMenu.branding?.secondaryColor || '#FF2D8D',
        style: style || rawMenu.branding?.style || 'fine_dining',
        phone: phone || rawMenu.branding?.phone || '',
        whatsapp: whatsapp || rawMenu.branding?.whatsapp || '',
        instagram: instagram || rawMenu.branding?.instagram || '',
        address: address || rawMenu.branding?.address || '',
        email: email || rawMenu.branding?.email || ''
      }
    }

    setCurrentMenu(menuToSave)

    try {
      localStorage.setItem('scenvy_cached_menu', JSON.stringify(menuToSave))
    } catch (e) {
      console.warn('Cache error:', e)
    }

    try {
      await saveMenuReel.mutateAsync({
        menuReel: {
          id: menuToSave.id,
          title: menuToSave.branding?.name || venue || 'Digital Menu',
          data: menuToSave
        },
        tenantId
      })
      notify(`💾 Speisekarte "${menuToSave.branding?.name || venue || 'Digital Menu'}" in Datenbank gespeichert!`)
    } catch (err) {
      console.error('Save menu error:', err)
      notify('💾 Speisekarte lokal im Zwischenspeicher gesichert')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Soll diese digitale Speisekarte gelöscht werden?')) return
    await deleteMenuReel.mutateAsync({ id, tenantId })
    notify('🗑️ Speisekarte gelöscht')
    if (currentMenu?.id === id) setCurrentMenu(null)
    if (selectedMenuForView?.id === id) setSelectedMenuForView(null)
  }

  if (!isFeatureEnabled) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 32, maxWidth: 440, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${C.pink}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: C.pink }}>
            <Lock size={28} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Feature nicht freigeschaltet</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>
            Das Add-on "AI Menu → Reel Generator" ist für deinen Account aktuell deaktiviert. Wende dich an den Platform-Admin.
          </div>
          <button onClick={() => nav('/dashboard')} style={{ padding: '10px 20px', borderRadius: 10, background: C.purple, color: C.white, border: 'none', fontWeight: 700, cursor: 'pointer' }}>
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Full screen view mode for saved menu
  if (selectedMenuForView) {
    return (
      <div>
        <div style={{ position: 'fixed', top: 16, left: 16, zIndex: 9999 }}>
          <button onClick={() => setSelectedMenuForView(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, background: C.card, border: `1px solid ${C.border}`, color: C.white, cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
            <ArrowLeft size={16} /> Zurück zur Verwaltung
          </button>
        </div>
        <GuestMenuReel initialMenu={selectedMenuForView.data || selectedMenuForView} isPreview={true} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: embedded ? 'auto' : '100vh', background: embedded ? 'transparent' : C.bg, color: C.white, fontFamily: "'Inter', sans-serif" }}>
      {/* Top Bar (Only when standalone) */}
      {!embedded && (
        <div style={{ height: 58, background: C.card, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => nav('/dashboard')} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={18} />
            </button>
            <ScenvyLogoFull height={35} />
            <span style={{ fontSize: 11, color: C.purple, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: `${C.purple}22`, border: `1px solid ${C.purple}44` }}>
              MODUL: SCENVY MENU
            </span>
          </div>

          <div style={{ display: 'flex', gap: 6, background: '#12121A', padding: 4, borderRadius: 12, border: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
            <button onClick={() => setActiveTab('create')} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: activeTab === 'create' ? C.purple : 'transparent', color: activeTab === 'create' ? C.white : C.muted, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              🚀 SNAP Generator
            </button>
            <button onClick={() => setActiveTab('articles')} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: activeTab === 'articles' ? C.purple : 'transparent', color: activeTab === 'articles' ? C.white : C.muted, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              📊 Artikelstamm & Editor
              {currentMenu?.categories?.length > 0 && (
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: activeTab === 'articles' ? '#FFF' : `${C.purple}33`, color: activeTab === 'articles' ? C.purple : C.pink, fontWeight: 800 }}>
                  {currentMenu.categories.reduce((acc, c) => acc + (c.items?.length || 0), 0)}
                </span>
              )}
            </button>
            <button onClick={() => setActiveTab('list')} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: activeTab === 'list' ? C.purple : 'transparent', color: activeTab === 'list' ? C.white : C.muted, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              📋 Digital Menus ({menuReels.length})
            </button>
            <button onClick={() => setActiveTab('locations')} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: activeTab === 'locations' ? C.purple : 'transparent', color: activeTab === 'locations' ? C.white : C.muted, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              📍 Standorte & Zeitplanung ({locations.length})
            </button>
            <button onClick={() => setActiveTab('design')} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: activeTab === 'design' ? C.purple : 'transparent', color: activeTab === 'design' ? C.white : C.muted, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              🎨 Branding
            </button>
            <button onClick={() => setActiveTab('settings')} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: activeTab === 'settings' ? C.purple : 'transparent', color: activeTab === 'settings' ? C.white : C.muted, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              ⚙️ Einstellungen
            </button>
          </div>
        </div>
      )}

      {/* Internal Sub-Tabs when embedded inside Dashboard */}
      {embedded && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: C.pink, fontWeight: 800, letterSpacing: 2, marginBottom: 4 }}>GEBUCHTES MODUL</div>
            <div style={{ fontSize: 24, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
              🍽️ SCENVY MENU — Digitale Speisekarte & SNAP AI
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, background: C.card, padding: 4, borderRadius: 12, border: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
            <button onClick={() => setActiveTab('create')} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: activeTab === 'create' ? C.purple : 'transparent', color: activeTab === 'create' ? C.white : C.muted, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              🚀 SNAP Generator
            </button>
            <button onClick={() => setActiveTab('articles')} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: activeTab === 'articles' ? C.purple : 'transparent', color: activeTab === 'articles' ? C.white : C.muted, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              📊 Artikelstamm & Editor
              {currentMenu?.categories?.length > 0 && (
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: activeTab === 'articles' ? '#FFF' : `${C.purple}33`, color: activeTab === 'articles' ? C.purple : C.pink, fontWeight: 800 }}>
                  {currentMenu.categories.reduce((acc, c) => acc + (c.items?.length || 0), 0)}
                </span>
              )}
            </button>
            <button onClick={() => setActiveTab('list')} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: activeTab === 'list' ? C.purple : 'transparent', color: activeTab === 'list' ? C.white : C.muted, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              📋 Menus ({menuReels.length})
            </button>
            <button onClick={() => setActiveTab('locations')} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: activeTab === 'locations' ? C.purple : 'transparent', color: activeTab === 'locations' ? C.white : C.muted, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              📍 Standorte & Zeitplanung ({locations.length})
            </button>
            <button onClick={() => setActiveTab('design')} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: activeTab === 'design' ? C.purple : 'transparent', color: activeTab === 'design' ? C.white : C.muted, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              🎨 Branding
            </button>
            <button onClick={() => setActiveTab('settings')} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: activeTab === 'settings' ? C.purple : 'transparent', color: activeTab === 'settings' ? C.white : C.muted, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              ⚙️ Settings
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: embedded ? 0 : 28, maxWidth: 1280, margin: '0 auto' }}>
        {activeTab === 'create' ? (
          <div>
            {!embedded && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: C.pink, fontWeight: 800, letterSpacing: 2, marginBottom: 4 }}>SCENVY MODUL</div>
                <div style={{ fontSize: 26, fontWeight: 900 }}>AI Speisekarten-Reel Generator</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                  Verwandle Speisekarten-Fotos, Dokumente oder PDF in ein interaktives, mobil-optimiertes Digital Menu.
                </div>
              </div>
            )}

            {currentMenu && currentMenu.categories?.length > 0 && (
              <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(236,72,153,0.18))', border: `1px solid ${C.purple}`, borderRadius: 16, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 24 }}>✨</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: C.white }}>
                      Extrahiertes Menü aktiv ({currentMenu.categories.reduce((acc, c) => acc + (c.items?.length || 0), 0)} Artikel in {currentMenu.categories.length} Kategorien)
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                      Möchtest du Gerichte, Preise, Allergene, Schärfegrade oder Kategorien in der Tabellenansicht nachbearbeiten?
                    </div>
                  </div>
                </div>
                <button onClick={() => setActiveTab('articles')} style={{ padding: '8px 16px', borderRadius: 10, background: C.purple, color: C.white, border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  📊 Artikelstamm-Editor Öffnen <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* Main 2-Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24 }}>
              {/* Left Column: Input Forms */}
              <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 24 }}>
                {/* Input Tabs */}
                <div style={{ display: 'flex', gap: 6, background: C.card2, borderRadius: 12, padding: 4, marginBottom: 20 }}>
                  <button onClick={() => setInputTab('doc')} style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', background: inputTab === 'doc' ? C.purple : 'transparent', color: inputTab === 'doc' ? C.white : C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    📸 Foto / Datei
                  </button>
                  <button onClick={() => setInputTab('manual')} style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', background: inputTab === 'manual' ? C.purple : 'transparent', color: inputTab === 'manual' ? C.white : C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    ✍️ Manuell
                  </button>
                  <button onClick={() => setInputTab('branding')} style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', background: inputTab === 'branding' ? C.purple : 'transparent', color: inputTab === 'branding' ? C.white : C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    🎨 Branding
                  </button>
                </div>

                {/* Tab A: Document / Photo Upload & Mediathek */}
                {inputTab === 'doc' && (
                  <div style={{ display: 'grid', gap: 16 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>
                          SPEISEKARTEN-UPLOAD (PDF, FOTO, PNG, JPG, DOCX)
                        </label>
                        <button onClick={() => setShowMediaModal(true)} style={{ fontSize: 11, color: C.purple, fontWeight: 700, background: `${C.purple}22`, border: `1px solid ${C.purple}44`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          🖼️ Aus Mediathek
                        </button>
                      </div>

                      <label style={{ border: `2px dashed ${uploadedImage ? C.green : C.purple}55`, borderRadius: 12, padding: 20, textAlign: 'center', display: 'block', cursor: 'pointer', background: uploadedImage ? `${C.green}0D` : `${C.purple}0A` }}>
                        {uploadedImage ? (
                          <div>
                            <img src={uploadedImage} style={{ maxHeight: 120, borderRadius: 8, margin: '0 auto 8px', objectFit: 'contain' }} alt="Preview" />
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.green }}>
                              ✓ Foto/Datei geladen: {fileName}
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload size={28} color={C.purple} style={{ margin: '0 auto 8px' }} />
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>
                              {fileName ? fileName : 'Speisekarte oder Foto hochladen'}
                            </div>
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                              Unterstützt Fotos (JPG, PNG), PDF oder Word
                            </div>
                          </>
                        )}
                        <input type="file" accept=".txt,.pdf,.docx,.png,.jpg,.jpeg,.webp,image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                      </label>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                        ODER SPEISEKARTEN-TEXT DIREKT EINFÜGEN
                      </label>
                      <textarea value={documentText} onChange={(e) => setDocumentText(e.target.value)} placeholder="Füge hier Gerichte, Preise, Beschreibungen und Kategorien aus deiner Speisekarte ein..." rows={6} style={{ width: '100%', padding: 12, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                    </div>
                  </div>
                )}

                {/* Tab B: Manual Quick Settings */}
                {inputTab === 'manual' && (
                  <div style={{ display: 'grid', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 6 }}>RESTAURANT / VENUE NAME</label>
                      <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="z. B. La Trattoria Scenvy" style={{ width: '100%', padding: 10, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 13, outline: 'none' }} />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 6 }}>STILRICHTUNG</label>
                      <select value={style} onChange={(e) => setStyle(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 13, outline: 'none' }}>
                        <option value="fine_dining">Fine Dining & Elegance</option>
                        <option value="street_food">Street Food & Burger</option>
                        <option value="cafe">Café & Bakery</option>
                        <option value="trattoria">Trattoria & Pizzeria</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 6 }}>ADRESSE</label>
                      <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Musterstraße 12, Berlin" style={{ width: '100%', padding: 10, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 13, outline: 'none' }} />
                    </div>
                  </div>
                )}

                {/* Tab C: Branding Input */}
                {inputTab === 'branding' && (
                  <div style={{ display: 'grid', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 6 }}>HAUPTFARBE</label>
                        <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ width: '100%', height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 6 }}>AKZENTFARBE</label>
                        <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} style={{ width: '100%', height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent' }} />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 6 }}>TELEFON</label>
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+49 30 1234567" style={{ width: '100%', padding: 10, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 13, outline: 'none' }} />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 6 }}>WHATSAPP NUMBER</label>
                      <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+491701234567" style={{ width: '100%', padding: 10, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 13, outline: 'none' }} />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 6 }}>INSTAGRAM HANDLE</label>
                      <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@scenvy_gourmet" style={{ width: '100%', padding: 10, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 13, outline: 'none' }} />
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <button onClick={handleGenerate} disabled={isGenerating} style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: grad(C.purple, C.pink), color: C.white, fontSize: 15, fontWeight: 800, cursor: isGenerating ? 'not-allowed' : 'pointer', marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 10px 25px ${C.purple}44` }}>
                  <Sparkles size={18} /> {isGenerating ? 'Generiere AI Menu Reel...' : '🚀 AI Menu Reel Generieren'}
                </button>

                {isGenerating && (
                  <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: C.card2, border: `1px solid ${C.purple}44`, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.purple, marginBottom: 4 }}>{genStep}</div>
                    <div style={{ height: 4, background: C.bg, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '70%', background: grad(C.purple, C.pink), borderRadius: 2, animation: 'pulse 1.2s infinite' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Live Mobile Reel Preview */}
              <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 20px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                    📱 LIVE MOBIL-PREVIEW
                  </div>
                  {currentMenu && (
                    <button onClick={() => setIsEditorFullscreen(true)} style={{ background: C.purple, color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Maximize2 size={12} /> Großer Editor
                    </button>
                  )}
                </div>

                {/* Mobile Phone Device Frame */}
                <div style={{ width: 360, height: 680, background: '#000', borderRadius: 36, border: `12px solid #181824`, overflow: 'hidden', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
                  <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 120, height: 18, background: '#181824', borderRadius: '0 0 12px 12px', zIndex: 1000 }} />
                  <div style={{ height: '100%', overflowY: 'auto' }} className="hide-scrollbar">
                    {currentMenu ? (
                      <GuestMenuReel initialMenu={currentMenu} isPreview={true} onSaveMenu={handleSaveEditedMenu} />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', color: C.muted }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📜</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: C.white, marginBottom: 8 }}>Noch kein Menü generiert</div>
                        <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                          Lade deine Speisekarte hoch oder klicke auf "Generieren", um die Live-Vorschau anzuzeigen.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Button & Quick Navigation below mobile preview */}
                {currentMenu && (
                  <div style={{ marginTop: 16, width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button 
                      onClick={() => handleSaveEditedMenu(currentMenu)} 
                      style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 20px rgba(16,185,129,0.35)' }}
                    >
                      💾 Speisekarte in Datenbank Speichern
                    </button>
                    <button 
                      onClick={() => setActiveTab('list')} 
                      style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: `1px solid ${C.border}`, background: C.card2, color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}
                    >
                      📋 Gespeicherte Menüs anzeigen ({menuReels.length})
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'design' ? (
          /* Branding & Design Templates Tab */
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>🎨 Branding & Menu Templates</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Konfiguriere das visuelle Erscheinungsbild deiner digitalen Speisekarten.</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
              <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: C.white }}>Restaurant Profil & Farben</div>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 6 }}>RESTAURANT NAME</label>
                    <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Mein Restaurant" style={{ width: '100%', padding: 10, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 13, outline: 'none' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 6 }}>HAUPTFARBE (BRANDING)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ width: 44, height: 38, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent' }} />
                        <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 12 }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 6 }}>AKZENTFARBE</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} style={{ width: 44, height: 38, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent' }} />
                        <input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 12 }} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 6 }}>STIL / DESIGN THEME</label>
                    <select value={style} onChange={(e) => setStyle(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 13, outline: 'none' }}>
                      <option value="fine_dining">🍷 Fine Dining & Elegance (Dunkel & Gold)</option>
                      <option value="street_food">🍔 Street Food & Fast Casual (Aktiv & Bunt)</option>
                      <option value="cafe">☕ Café & Bakery (Warm & Hell)</option>
                      <option value="trattoria">🍕 Trattoria & Pizzeria (Klassisch)</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 6 }}>TELEFON</label>
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+49 30 1234567" style={{ width: '100%', padding: 10, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 13, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 6 }}>INSTAGRAM</label>
                      <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@scenvy_restaurant" style={{ width: '100%', padding: 10, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 13, outline: 'none' }} />
                    </div>
                  </div>

                  <button onClick={() => notify('✅ Branding-Einstellungen gespeichert!')} style={{ padding: '12px 20px', borderRadius: 10, background: C.purple, color: C.white, border: 'none', fontWeight: 700, cursor: 'pointer', marginTop: 10 }}>
                    Branding Einstellungen Speichern
                  </button>
                </div>
              </div>

              <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: C.white }}>Vorschau Design Theme</div>
                <div style={{ background: '#090D16', borderRadius: 16, padding: 20, border: `2px solid ${primaryColor}` }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: primaryColor, marginBottom: 4 }}>{venue || 'Dein Restaurant'}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>{address || 'Musterstraße 1, Berlin'}</div>
                  <div style={{ height: 2, background: secondaryColor, width: '40%', marginBottom: 16 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 8 }}>Vorspeisen</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.white, borderBottom: '1px dashed #334155', paddingBottom: 6 }}>
                    <span>Trüffel Burrata</span>
                    <span style={{ fontWeight: 800, color: secondaryColor }}>14,50 €</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'articles' ? (
          /* Article Master Table & Database Editor Tab */
          <div>
            <input ref={csvInputRef} type="file" accept=".csv,.txt" onChange={handleCSVImport} style={{ display: 'none' }} />

            {/* Menu Card Selector & Quick Action Header Bar */}
            <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 20, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.pink, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                    📌 AKTUELL IN BEARBEITUNG (SPEISEKARTE & STANDORT)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <select
                      value={editingMenuId || (currentMenu?.id || '')}
                      onChange={(e) => {
                        const targetId = e.target.value
                        if (targetId === 'new') {
                          setEditingMenuId(null)
                          setCurrentMenu(null)
                          notify('✨ Neuer Artikelstamm-Entwurf erstellt')
                          return
                        }
                        const found = menuReels.find(m => m.id === targetId)
                        if (found) openMenuInEditor(found)
                      }}
                      style={{ padding: '10px 14px', borderRadius: 12, background: C.bg, border: `1px solid ${C.purple}88`, color: C.white, fontSize: 14, fontWeight: 800, outline: 'none', cursor: 'pointer', minWidth: 260 }}
                    >
                      {currentMenu && !menuReels.some(m => m.id === currentMenu.id) && (
                        <option value={currentMenu.id || 'draft'}>
                          ⚡ Entwurf: {currentMenu.branding?.name || venue || 'Unbenanntes Menü'}
                        </option>
                      )}
                      {menuReels.map(m => (
                        <option key={m.id} value={m.id}>
                          📜 {m.data?.branding?.name || m.title || 'Digital Menu'} (ID: {m.id.slice(0, 6)})
                        </option>
                      ))}
                      <option value="new">➕ Neue Speisekarte anlegen</option>
                    </select>

                    <button
                      onClick={() => setShowBrandingInTable(!showBrandingInTable)}
                      style={{ padding: '8px 14px', borderRadius: 10, background: C.card2, border: `1px solid ${C.border}`, color: C.white, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      ⚙️ Restaurant-Branding {showBrandingInTable ? 'einklappen ▲' : 'anpassen ▼'}
                    </button>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => addNewArticleToMenu()} style={{ padding: '10px 16px', borderRadius: 10, background: C.purple, color: C.white, border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={16} /> Neuer Artikel
                  </button>
                  <button onClick={addNewCategoryToMenu} style={{ padding: '10px 16px', borderRadius: 10, background: C.card2, border: `1px solid ${C.border}`, color: C.white, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    📁 Neue Kategorie
                  </button>
                  <button onClick={() => csvInputRef.current?.click()} style={{ padding: '10px 16px', borderRadius: 10, background: `${C.purple}22`, border: `1px solid ${C.purple}44`, color: C.purple, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    📂 CSV / Excel Import
                  </button>
                  <button onClick={exportArticlesToCSV} style={{ padding: '10px 16px', borderRadius: 10, background: `${C.pink}22`, border: `1px solid ${C.pink}44`, color: C.pink, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    📥 CSV Export
                  </button>
                  {currentMenu && (
                    <button onClick={() => handleSaveEditedMenu(currentMenu)} style={{ padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #10B981, #059669)', color: C.white, border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)' }}>
                      💾 Speisekarte Aktualisieren & Speichern
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible Branding & Location Metadata Inline Bar */}
              {showBrandingInTable && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 10, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 4 }}>RESTAURANT NAME</label>
                    <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Restaurant Name" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 12 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 4 }}>ADRESSE & STANDORT</label>
                    <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Musterstraße 12, Berlin" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 12 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 4 }}>TELEFON / WHATSAPP</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+49 170 1234567" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 12 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: C.muted, fontWeight: 700, display: 'block', marginBottom: 4 }}>INSTAGRAM HANDLE</label>
                    <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@gourmet_bistro" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 12 }} />
                  </div>
                </div>
              )}
            </div>

            {!currentMenu || !currentMenu.categories?.length ? (
              <div style={{ padding: 48, textAlign: 'center', color: C.muted, background: C.card, borderRadius: 20, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>📊</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.white, marginBottom: 6 }}>Noch keine Speisekarte geladen oder generiert</div>
                <div style={{ fontSize: 13, maxWidth: 480, margin: '0 auto 20px', lineHeight: 1.5 }}>
                  Lade ein PDF oder Foto im SNAP Generator hoch, importiere eine CSV-Datei oder wähle eine gespeicherte Karte aus der Liste oben.
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => setActiveTab('create')} style={{ padding: '10px 20px', borderRadius: 10, background: C.purple, color: C.white, border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                    🚀 Zum SNAP AI Generator
                  </button>
                  <button onClick={() => csvInputRef.current?.click()} style={{ padding: '10px 20px', borderRadius: 10, background: `${C.purple}22`, border: `1px solid ${C.purple}44`, color: C.purple, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                    📂 CSV / Excel Import
                  </button>
                  <button onClick={addNewCategoryToMenu} style={{ padding: '10px 20px', borderRadius: 10, background: C.card2, border: `1px solid ${C.border}`, color: C.white, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    + Erste Kategorie Anlegen
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Stats Header Bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
                  <div style={{ background: C.card, padding: 14, borderRadius: 14, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 800, textTransform: 'uppercase' }}>GESAMT ARTIKEL</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: C.purple, marginTop: 2 }}>
                      {currentMenu.categories.reduce((acc, c) => acc + (c.items?.length || 0), 0)}
                    </div>
                  </div>
                  <div style={{ background: C.card, padding: 14, borderRadius: 14, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 800, textTransform: 'uppercase' }}>KATEGORIEN</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: C.pink, marginTop: 2 }}>
                      {currentMenu.categories.length}
                    </div>
                  </div>
                  <div style={{ background: C.card, padding: 14, borderRadius: 14, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 800, textTransform: 'uppercase' }}>🌱 VEGAN / VEGGIE</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#34D399', marginTop: 2 }}>
                      {currentMenu.categories.reduce((acc, c) => acc + (c.items?.filter(i => (i.diet || []).includes('vegan') || (i.diet || []).includes('vegetarian') || i.vegan || i.vegetarian).length || 0), 0)}
                    </div>
                  </div>
                  <div style={{ background: C.card, padding: 14, borderRadius: 14, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 800, textTransform: 'uppercase' }}>🌶️ SCHARF</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#F87171', marginTop: 2 }}>
                      {currentMenu.categories.reduce((acc, c) => acc + (c.items?.filter(i => i.spicy).length || 0), 0)}
                    </div>
                  </div>
                </div>

                {/* Filters Row */}
                <div style={{ background: C.card, padding: 16, borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                      <input value={articleSearch} onChange={(e) => setArticleSearch(e.target.value)} placeholder="🔍 Artikel nach Name, Beschreibung, Preis oder Allergen durchsuchen..." style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 13, outline: 'none' }} />
                    </div>

                    {/* Diet Quick Filter Pills */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {[
                        { id: 'ALL', label: 'Alle' },
                        { id: 'vegan', label: '🌱 Vegan' },
                        { id: 'vegetarian', label: '🧀 Veggie' },
                        { id: 'spicy', label: '🌶️ Scharf' },
                        { id: 'glutenfree', label: '🌾 Glutenfrei' }
                      ].map(f => (
                        <button key={f.id} onClick={() => setDietFilter(f.id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: dietFilter === f.id ? C.purple : C.card2, color: dietFilter === f.id ? C.white : C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category Pills Filter */}
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }} className="hide-scrollbar">
                    <button onClick={() => setSelectedCatFilter('ALL')} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${selectedCatFilter === 'ALL' ? C.purple : C.border}`, background: selectedCatFilter === 'ALL' ? `${C.purple}22` : C.bg, color: selectedCatFilter === 'ALL' ? C.white : C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      📂 Alle Kategorien ({currentMenu.categories.reduce((a, c) => a + (c.items?.length || 0), 0)})
                    </button>
                    {currentMenu.categories.map(cat => {
                      const cName = typeof cat.name === 'object' ? (cat.name.de || cat.name.en || '') : cat.name
                      return (
                        <button key={cat.id} onClick={() => setSelectedCatFilter(cat.id)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${selectedCatFilter === cat.id ? C.purple : C.border}`, background: selectedCatFilter === cat.id ? `${C.purple}22` : C.bg, color: selectedCatFilter === cat.id ? C.white : C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>{cat.icon || '🍽️'}</span>
                          <span>{cName}</span>
                          <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 6, background: C.card2, color: C.pink }}>
                            {cat.items?.length || 0}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Master Article Table */}
                <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#0D0D14', borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          <th style={{ padding: '14px 16px', width: 40 }}>#</th>
                          <th style={{ padding: '14px 16px', width: 180 }}>KATEGORIE</th>
                          <th style={{ padding: '14px 16px', width: 220 }}>GERICHT / ARTIKEL NAME</th>
                          <th style={{ padding: '14px 16px', minWidth: 260 }}>BESCHREIBUNG</th>
                          <th style={{ padding: '14px 16px', width: 120 }}>PREIS (€)</th>
                          <th style={{ padding: '14px 16px', width: 160 }}>EIGENSCHAFTEN</th>
                          <th style={{ padding: '14px 16px', width: 110 }}>ALLERGENE</th>
                          <th style={{ padding: '14px 16px', width: 80, textAlign: 'center' }}>AKTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          // Flatten items from all categories
                          let flatList = []
                          currentMenu.categories.forEach(cat => {
                            if (selectedCatFilter !== 'ALL' && cat.id !== selectedCatFilter) return
                            const catName = typeof cat.name === 'object' ? (cat.name.de || cat.name.en || '') : cat.name

                            ;(cat.items || []).forEach(item => {
                              const itemName = typeof item.name === 'object' ? (item.name.de || item.name.en || '') : (item.name || '')
                              const itemDesc = typeof item.description === 'object' ? (item.description.de || item.description.en || '') : (item.description || item.desc || '')
                              const itemPrice = item.price || ''
                              const isVegan = (item.diet || []).includes('vegan') || item.vegan
                              const isVeggie = (item.diet || []).includes('vegetarian') || item.vegetarian
                              const isGlutenfree = (item.diet || []).includes('glutenfree') || item.glutenFree
                              const isSpicy = !!item.spicy
                              const allergensStr = Array.isArray(item.allergens) ? item.allergens.join(', ') : (item.allergens || '')

                              // Filter matching
                              if (articleSearch) {
                                const q = articleSearch.toLowerCase()
                                const matchName = itemName.toLowerCase().includes(q)
                                const matchDesc = itemDesc.toLowerCase().includes(q)
                                const matchCat = catName.toLowerCase().includes(q)
                                const matchPrice = itemPrice.toLowerCase().includes(q)
                                const matchAllergen = allergensStr.toLowerCase().includes(q)
                                if (!matchName && !matchDesc && !matchCat && !matchPrice && !matchAllergen) return
                              }

                              if (dietFilter === 'vegan' && !isVegan) return
                              if (dietFilter === 'vegetarian' && !isVeggie) return
                              if (dietFilter === 'spicy' && !isSpicy) return
                              if (dietFilter === 'glutenfree' && !isGlutenfree) return

                              flatList.push({
                                catId: cat.id,
                                catName,
                                catIcon: cat.icon || '🍽️',
                                item,
                                itemId: item.id,
                                itemName,
                                itemDesc,
                                itemPrice,
                                isVegan,
                                isVeggie,
                                isGlutenfree,
                                isSpicy,
                                allergensStr
                              })
                            })
                          })

                          if (flatList.length === 0) {
                            return (
                              <tr>
                                <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: C.muted }}>
                                  Keine Artikel gefunden für die aktuellen Filter.
                                </td>
                              </tr>
                            )
                          }

                          return flatList.map((row, idx) => (
                            <tr key={row.itemId} style={{ borderBottom: `1px solid ${C.border}`, background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                              <td style={{ padding: '12px 16px', color: C.muted, fontWeight: 700 }}>
                                {idx + 1}
                              </td>

                              {/* Category Dropdown Selection */}
                              <td style={{ padding: '12px 16px' }}>
                                <select value={row.catId} onChange={(e) => updateArticleInMenu(row.catId, row.itemId, 'catId', e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 12, outline: 'none' }}>
                                  {currentMenu.categories.map(c => (
                                    <option key={c.id} value={c.id}>
                                      {c.icon || '🍽️'} {typeof c.name === 'object' ? (c.name.de || c.name.en || '') : c.name}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* Article Name */}
                              <td style={{ padding: '12px 16px' }}>
                                <input value={row.itemName} onChange={(e) => updateArticleInMenu(row.catId, row.itemId, 'name', e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 13, fontWeight: 700, outline: 'none' }} placeholder="Artikelname eingeben..." />
                              </td>

                              {/* Article Description */}
                              <td style={{ padding: '12px 16px' }}>
                                <input value={row.itemDesc} onChange={(e) => updateArticleInMenu(row.catId, row.itemId, 'description', e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, outline: 'none' }} placeholder="Beschreibung..." />
                              </td>

                              {/* Price */}
                              <td style={{ padding: '12px 16px' }}>
                                <input value={row.itemPrice} onChange={(e) => updateArticleInMenu(row.catId, row.itemId, 'price', e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: '#38BDF8', fontSize: 13, fontWeight: 800, outline: 'none' }} placeholder="0.00 €" />
                              </td>

                              {/* Diet & Attribute Toggles */}
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                  <button onClick={() => updateArticleInMenu(row.catId, row.itemId, 'spicy', !row.isSpicy)} style={{ padding: '3px 6px', borderRadius: 6, border: 'none', background: row.isSpicy ? 'rgba(239,68,68,0.2)' : C.bg, color: row.isSpicy ? '#F87171' : C.muted, fontSize: 11, cursor: 'pointer' }} title="🌶️ Scharf">
                                    🌶️
                                  </button>
                                  <button onClick={() => updateArticleInMenu(row.catId, row.itemId, 'diet_vegan', !row.isVegan)} style={{ padding: '3px 6px', borderRadius: 6, border: 'none', background: row.isVegan ? 'rgba(16,185,129,0.2)' : C.bg, color: row.isVegan ? '#34D399' : C.muted, fontSize: 11, cursor: 'pointer' }} title="🌱 Vegan">
                                    🌱
                                  </button>
                                  <button onClick={() => updateArticleInMenu(row.catId, row.itemId, 'diet_vegetarian', !row.isVeggie)} style={{ padding: '3px 6px', borderRadius: 6, border: 'none', background: row.isVeggie ? 'rgba(245,158,11,0.2)' : C.bg, color: row.isVeggie ? '#FBBF24' : C.muted, fontSize: 11, cursor: 'pointer' }} title="🧀 Veggie">
                                    🧀
                                  </button>
                                  <button onClick={() => updateArticleInMenu(row.catId, row.itemId, 'diet_glutenfree', !row.isGlutenfree)} style={{ padding: '3px 6px', borderRadius: 6, border: 'none', background: row.isGlutenfree ? 'rgba(139,92,246,0.2)' : C.bg, color: row.isGlutenfree ? '#A78BFA' : C.muted, fontSize: 11, cursor: 'pointer' }} title="🌾 Glutenfrei">
                                    🌾
                                  </button>
                                </div>
                              </td>

                              {/* Allergens Input */}
                              <td style={{ padding: '12px 16px' }}>
                                <input value={row.allergensStr} onChange={(e) => updateArticleInMenu(row.catId, row.itemId, 'allergens', e.target.value)} placeholder="z.B. A, C, G" style={{ width: '100%', padding: '6px 8px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 11, outline: 'none' }} />
                              </td>

                              {/* Delete Action */}
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                <button onClick={() => deleteArticleFromMenu(row.itemId)} style={{ padding: '6px', borderRadius: 8, background: `${C.pink}11`, border: `1px solid ${C.pink}33`, color: C.pink, cursor: 'pointer' }} title="Artikel aus Tabelle löschen">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer Bar */}
                  <div style={{ padding: '12px 20px', background: '#0D0D14', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <button onClick={() => addNewArticleToMenu()} style={{ padding: '8px 14px', borderRadius: 8, background: C.purple, color: C.white, border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Plus size={14} /> + Artikel Hinzufügen
                    </button>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      💡 Tipp: Korrigierte Rechtschreibfehler & geänderte Preise werden automatisch in deine digitale Speisekarte übernommen.
                    </div>
                  </div>
                </div>

                {/* Category Structure Manager Section */}
                <div style={{ marginTop: 28, background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: C.white }}>📁 Kategorien-Struktur Verwalten</div>
                      <div style={{ fontSize: 12, color: C.muted }}>Passe Kategorie-Namen und Icons an oder lösche leere Gruppen.</div>
                    </div>
                    <button onClick={addNewCategoryToMenu} style={{ padding: '8px 14px', borderRadius: 8, background: C.card2, border: `1px solid ${C.border}`, color: C.white, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                      + Neue Kategorie
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {currentMenu.categories.map((cat) => {
                      const cName = typeof cat.name === 'object' ? (cat.name.de || cat.name.en || '') : cat.name
                      return (
                        <div key={cat.id} style={{ background: C.bg, borderRadius: 12, padding: 12, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input value={cat.icon || '🍽️'} onChange={(e) => updateCategoryInMenu(cat.id, 'icon', e.target.value)} style={{ width: 36, height: 36, textAlign: 'center', fontSize: 18, borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.white, outline: 'none' }} title="Icon/Emoji" />
                          <input value={cName} onChange={(e) => updateCategoryInMenu(cat.id, 'name', e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.white, fontSize: 13, fontWeight: 700, outline: 'none' }} placeholder="Kategorie Name..." />
                          <button onClick={() => deleteCategoryFromMenu(cat.id)} style={{ padding: 8, borderRadius: 8, background: `${C.pink}11`, border: `1px solid ${C.pink}33`, color: C.pink, cursor: 'pointer' }} title="Kategorie löschen">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'locations' ? (
          /* Locations & Time Schedule Tab */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.white }}>📍 Standorte, Zeitplanung & Highlights</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                  Verknüpfe Speisekarten mit Standorten, steuere zeitbasierte Menü-Anzeigen & erstelle Standort-Highlight Banner.
                </div>
              </div>
              <button onClick={handleOpenNewLocationModal} style={{ padding: '10px 18px', borderRadius: 10, background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`, color: C.white, border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 6px 20px rgba(124, 58, 237, 0.4)' }}>
                <Plus size={16} /> Neuer Standort
              </button>
            </div>

            {/* Standorte Grid */}
            {loadingLocations ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Lade Standorte...</div>
            ) : locations.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.muted, background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
                Keine Standorte angelegt. Klicke auf "+ Neuer Standort", um deinen ersten Gastronomie-Standort mit zeitgesteuerter Speisekarte zu erstellen.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20, marginBottom: 32 }}>
                {locations.map((loc) => {
                  const locLink = `${window.location.origin}/location/${loc.slug || loc.id}`
                  const highlight = loc.highlight || {}

                  return (
                    <div key={loc.id} style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        {/* Header Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: C.white, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <MapPin size={18} color={C.pink} /> {loc.name}
                            </div>
                            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{loc.address || 'Keine Adresse'}, {loc.city || 'München'}</div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: loc.active !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: loc.active !== false ? '#34D399' : '#F87171', border: `1px solid ${loc.active !== false ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
                            {loc.active !== false ? '🟢 Aktiv' : '⚪ Inaktiv'}
                          </span>
                        </div>

                        {/* Location Direct URL Box */}
                        <div style={{ background: '#0A0A10', borderRadius: 12, padding: 12, border: `1px solid ${C.border}`, marginBottom: 16 }}>
                          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 4 }}>🔗 STANDORT-LINK & QR-ZIEL</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C.purple, wordBreak: 'break-all', marginBottom: 8 }}>{locLink}</div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => { copyToClipboard(locLink); notify('📋 Standortlink kopiert!') }} style={{ padding: '6px 12px', borderRadius: 8, background: C.card2, border: `1px solid ${C.border}`, color: C.white, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Copy size={12} /> Kopieren
                            </button>
                            <a href={locLink} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', padding: '6px 12px', borderRadius: 8, background: `${C.purple}22`, border: `1px solid ${C.purple}44`, color: C.purple, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <ExternalLink size={12} /> Vorschau Öffnen
                            </a>
                          </div>
                        </div>

                        {/* Highlight Banner Status Box */}
                        <div style={{ background: highlight.enabled !== false ? 'rgba(124, 58, 237, 0.1)' : C.bg, borderRadius: 12, padding: 14, border: `1px solid ${highlight.enabled !== false ? `${C.purple}44` : C.border}`, marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: highlight.enabled !== false ? C.pink : C.muted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Zap size={12} /> Standort-Highlight Banner
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: highlight.enabled !== false ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.06)', color: highlight.enabled !== false ? '#34D399' : C.muted }}>
                              {highlight.enabled !== false ? 'AKTIV' : 'DEAKTIVIERT'}
                            </span>
                          </div>

                          {highlight.enabled !== false ? (
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                                  <span style={{ padding: '2px 8px', borderRadius: 12, background: '#FFF', color: highlight.color || C.purple, fontSize: 10, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    {(highlight.badgeShape || 'jagged_star_13') === 'jagged_star_13' && <JaggedStar13 size={14} fill="#F59E0B" stroke="#B45309" />}
                                    {highlight.badge || highlight.batchName || 'HIGHLIGHT'}
                                  </span>
                                  {highlight.price && (
                                    <span style={{ padding: '2px 8px', borderRadius: 10, background: '#F59E0B', color: '#000', fontSize: 10, fontWeight: 900 }}>
                                      {highlight.price}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: C.white }}>{highlight.title || 'Kein Titel'}</div>
                                {highlight.text && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{highlight.text}</div>}
                                <div style={{ fontSize: 10, fontWeight: 700, color: C.pink, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                                  <Clock size={11} />
                                  {highlight.startDate && highlight.endDate ? `${highlight.startDate} bis ${highlight.endDate} • ` : ''}
                                  {highlight.startTime || '11:00'} – {highlight.endTime || '23:00'} Uhr
                                  {highlight.exactLocation && <span>• 📍 {highlight.exactLocation}</span>}
                                </div>
                              </div>
                              {(highlight.bgImage || highlight.image) && (
                                <img src={highlight.bgImage || highlight.image} alt="" style={{ width: 54, height: 54, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: `1px solid ${C.border}` }} />
                              )}
                            </div>
                          ) : (
                            <div style={{ fontSize: 11, color: C.muted }}>
                              Kein aktiver Highlight-Banner. Klicke auf "Bearbeiten", um Happy Hour, Mittagsdeals oder Specials einzustellen.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleEditLocation(loc)} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: C.purple, color: C.white, border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <Edit3 size={14} /> Standort & Highlight Bearbeiten
                        </button>
                        <button onClick={() => handleDeleteLocation(loc.id)} style={{ padding: '10px', borderRadius: 10, background: `${C.pink}11`, border: `1px solid ${C.pink}33`, color: C.pink, cursor: 'pointer' }} title="Standort löschen">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : activeTab === 'settings' ? (
          /* Settings Tab */
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>⚙️ SCENVY MENU Einstellungen</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Globale Konfiguration für KI-Erkennung und Speisekarten-Exporte.</div>

            <div style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
              <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>🧠 KI SNAP Menü-Parser</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Automatische Allergen-Erkennung und zweisprachige Übersetzung aktivieren.</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: C.purple }} />
                    Allergene & Zusatzstoffe automatisch kategorisieren (A-N EU-Standard)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: C.purple }} />
                    Zweisprachige Übersetzung (DE & EN) bei KI-Generierung
                  </label>
                </div>
              </div>

              <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>💾 Zwischenspeicher & Cache</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Lösche den lokalen Zwischenspeicher, falls Entwürfe nicht richtig aktualisiert werden.</div>
                <button onClick={() => { localStorage.removeItem('scenvy_cached_menu'); setCurrentMenu(null); notify('🧹 Zwischenspeicher geleert!') }} style={{ padding: '8px 16px', borderRadius: 8, background: `${C.pink}22`, border: `1px solid ${C.pink}44`, color: C.pink, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  🧹 Lokalen Entwurfs-Cache leeren
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* List Tab: All Saved Menu Reels */
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Gespeicherte Digital Menus ({menuReels.length})</div>

            {loadingReels ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Lade Speisekarten...</div>
            ) : menuReels.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.muted, background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
                Noch keine digitalen Speisekarten erstellt. Klicke oben auf "SNAP Generator".
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
                {menuReels.map((m) => {
                  const data = m.data || m
                  const branding = data.branding || {}
                  const menuLink = `${window.location.origin}/m/${m.id}?view=menu`
                  const reelLink = `${window.location.origin}/m/${m.id}?view=reel`

                  return (
                    <div key={m.id} style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: C.white }}>{branding.name || m.title || 'Digital Menu'}</div>
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>ID: {m.id?.slice(0, 8)}...</div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: `${branding.primaryColor || C.purple}22`, color: branding.primaryColor || C.purple }}>
                            {data.categories?.length || 0} Kategorien
                          </span>
                        </div>

                        {/* Dual Links Display */}
                        <div style={{ background: '#0D0D14', borderRadius: 12, padding: 12, border: `1px solid ${C.border}`, marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 11 }}>
                            <span style={{ fontWeight: 700, color: C.white }}>📖 Digital Web-Menü Link</span>
                            <button onClick={() => { copyToClipboard(menuLink); notify('📋 Menü-Link kopiert!') }} style={{ background: 'none', border: 'none', color: C.purple, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                              Kopieren
                            </button>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                            <span style={{ fontWeight: 700, color: C.pink }}>🎬 9:16 Video Reel Link</span>
                            <button onClick={() => { copyToClipboard(reelLink); notify('📋 Reel-Link kopiert!') }} style={{ background: 'none', border: 'none', color: C.pink, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                              Kopieren
                            </button>
                          </div>
                        </div>

                        <div style={{ fontSize: 11, color: C.muted, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div>📅 Erstellt: {formatDateTime(m.created_at || m.createdAt || m.updated_at)}</div>
                          <div>⏱️ Aktualisiert: {formatDateTime(m.updated_at || m.updatedAt || m.created_at)}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => openMenuInEditor(m)} style={{ flex: '1 1 100%', padding: '9px 12px', borderRadius: 8, background: 'linear-gradient(135deg, #7C3AED, #9333EA)', color: C.white, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)' }}>
                          <Edit3 size={14} /> 📊 Artikelstamm & Tabelle editieren
                        </button>
                        <button onClick={() => setSelectedMenuForView(m)} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: C.card2, border: `1px solid ${C.border}`, color: C.white, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <Eye size={14} /> WYSIWYG Preview
                        </button>
                        <button onClick={() => downloadHTML(m)} style={{ padding: '8px 12px', borderRadius: 8, background: C.card2, border: `1px solid ${C.border}`, color: C.white, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }} title="HTML Herunterladen">
                          <Download size={14} /> HTML
                        </button>
                        <button onClick={() => handleDelete(m.id)} style={{ padding: '8px 12px', borderRadius: 8, background: `${C.pink}11`, border: `1px solid ${C.pink}33`, color: C.pink, cursor: 'pointer', fontSize: 12, fontWeight: 600 }} title="Löschen">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Editor Modal */}
      {isEditorFullscreen && currentMenu && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 100000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 60, background: '#181824', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Edit3 size={18} color={C.purple} /> Grosser Editor (WYSIWYG)
            </div>
            <button onClick={() => setIsEditorFullscreen(false)} style={{ background: C.card, color: '#FFF', border: `1px solid ${C.border}`, padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color={C.green} /> Schließen & Übernehmen
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <div style={{ width: '100%', maxWidth: 700, background: '#000', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: `1px solid ${C.border}` }}>
              <GuestMenuReel initialMenu={currentMenu} isPreview={true} onSaveMenu={handleSaveEditedMenu} />
            </div>
          </div>
        </div>
      )}

      {/* Select From Mediathek Modal */}
      {showMediaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, width: '100%', maxWidth: 640, padding: 24, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>🖼️ Mediathek durchsuchen</div>
                <div style={{ fontSize: 12, color: C.muted }}>Wähle ein hochgeladenes Speisekarten-Foto oder PDF aus</div>
              </div>
              <button onClick={() => setShowMediaModal(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 20, fontWeight: 700 }}>✕</button>
            </div>

            {mediaItems.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.muted, background: C.bg, borderRadius: 12 }}>
                Keine Medien in deiner Mediathek vorhanden. Lade zuerst in der Mediathek oder oben ein Foto hoch.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                {mediaItems.map((med) => (
                  <div key={med.id} onClick={() => handleSelectFromMedia(med)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 8, cursor: 'pointer', transition: 'transform 0.15s', textAlign: 'center' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = C.purple} onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}>
                    <div style={{ height: 90, borderRadius: 8, overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                      {med.url && (med.type === 'image' || med.url.startsWith('data:image')) ? (
                        <img src={med.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                      ) : (
                        <FileText size={32} color={C.purple} />
                      )}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.white, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {med.name || 'Datei'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location & Highlight Modal */}
      {showLocationModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, width: '100%', maxWidth: 640, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: C.white }}>
                  {editingLocId ? '✏️ Standort & Highlight Bearbeiten' : '📍 Neuer Gastronomie-Standort'}
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  Konfiguriere Standortdaten, QR-Slug und zeitgesteuerte Tagesangebote.
                </div>
              </div>
              <button onClick={() => setShowLocationModal(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 22, fontWeight: 700 }}>✕</button>
            </div>

            <form onSubmit={handleSaveLocationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Basic Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: 'block', marginBottom: 6 }}>STANDORT NAME *</label>
                  <input value={locForm.name} onChange={(e) => setLocForm({ ...locForm, name: e.target.value })} placeholder="z.B. Hauptplatz München" style={{ width: '100%', padding: 10, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 13, outline: 'none' }} required />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: 'block', marginBottom: 6 }}>URL SLUG (z.B. muenchen-hauptplatz)</label>
                  <input value={locForm.slug} onChange={(e) => setLocForm({ ...locForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="muenchen-hauptplatz" style={{ width: '100%', padding: 10, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 13, outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: 'block', marginBottom: 6 }}>STRASSE & HAUSNUMMER</label>
                  <input value={locForm.address} onChange={(e) => setLocForm({ ...locForm, address: e.target.value })} placeholder="Marienplatz 12" style={{ width: '100%', padding: 10, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: 'block', marginBottom: 6 }}>PLZ</label>
                  <input value={locForm.zip} onChange={(e) => setLocForm({ ...locForm, zip: e.target.value })} placeholder="80331" style={{ width: '100%', padding: 10, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: 'block', marginBottom: 6 }}>STADT</label>
                  <input value={locForm.city} onChange={(e) => setLocForm({ ...locForm, city: e.target.value })} placeholder="München" style={{ width: '100%', padding: 10, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 13, outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: 'block', marginBottom: 6 }}>GOOGLE MAPS LINK</label>
                  <input value={locForm.googleMapsUrl} onChange={(e) => setLocForm({ ...locForm, googleMapsUrl: e.target.value })} placeholder="https://maps.google.com/..." style={{ width: '100%', padding: 10, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: 'block', marginBottom: 6 }}>TELEFONNUMMER</label>
                  <input value={locForm.phone} onChange={(e) => setLocForm({ ...locForm, phone: e.target.value })} placeholder="+49 89 12345678" style={{ width: '100%', padding: 10, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontSize: 13, outline: 'none' }} />
                </div>
              </div>

              {/* Highlight Settings Section */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: C.white, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Zap size={16} color={C.pink} /> Standort-Highlight & Aktions-Banner Konfigurieren
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>Erstelle aufmerksamkeitsstarke Tagesangebote mit 13-Zack Stern, Sonderpreis & Hintergrundbild.</div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', color: C.white }}>
                    <input type="checkbox" checked={locForm.highlight?.enabled !== false} onChange={(e) => setLocForm({ ...locForm, highlight: { ...locForm.highlight, enabled: e.target.checked } })} style={{ accentColor: C.purple, width: 16, height: 16 }} />
                    Aktivieren
                  </label>
                </div>

                {locForm.highlight?.enabled !== false && (
                  <div style={{ background: C.bg, borderRadius: 16, border: `1px solid ${C.border}`, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    
                    {/* Row 1: Batch Name & Badge Label */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: 'block', marginBottom: 4 }}>BATCH / ZIEL-GRUPPE NAME</label>
                        <input value={locForm.highlight?.batchName || ''} onChange={(e) => setLocForm({ ...locForm, highlight: { ...locForm.highlight, batchName: e.target.value } })} placeholder="z.B. Batch 1 - Hauptstandort" style={{ width: '100%', padding: 8, borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.white, fontSize: 12 }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: 'block', marginBottom: 4 }}>BADGE TEXT (TAG / LABEL)</label>
                        <input value={locForm.highlight?.badge || ''} onChange={(e) => setLocForm({ ...locForm, highlight: { ...locForm.highlight, badge: e.target.value } })} placeholder="TAGES-HIGHLIGHT" style={{ width: '100%', padding: 8, borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.white, fontSize: 12 }} />
                      </div>
                    </div>

                    {/* Row 2: Banner Title & Special Price */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: 'block', marginBottom: 4 }}>BANNER TITEL *</label>
                        <input value={locForm.highlight?.title || ''} onChange={(e) => setLocForm({ ...locForm, highlight: { ...locForm.highlight, title: e.target.value } })} placeholder="z.B. 🔥 Happy Hour Specials & Aperitivo" style={{ width: '100%', padding: 8, borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.white, fontSize: 12, fontWeight: 700 }} required />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: 'block', marginBottom: 4 }}>SONDERPREIS / RABATT</label>
                        <input value={locForm.highlight?.price || ''} onChange={(e) => setLocForm({ ...locForm, highlight: { ...locForm.highlight, price: e.target.value } })} placeholder="z.B. 9,90 € oder -20%" style={{ width: '100%', padding: 8, borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: '#FBBF24', fontSize: 12, fontWeight: 800 }} />
                      </div>
                    </div>

                    {/* Row 3: Description Text */}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: 'block', marginBottom: 4 }}>BESCHREIBUNG / DETAILS (TEXT)</label>
                      <textarea value={locForm.highlight?.text || ''} onChange={(e) => setLocForm({ ...locForm, highlight: { ...locForm.highlight, text: e.target.value } })} placeholder="z.B. Alle Cocktails & Antipasti Platten zum Aktionspreis. Nur solange der Vorrat reicht!" rows={2} style={{ width: '100%', padding: 8, borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.white, fontSize: 12, outline: 'none', resize: 'vertical' }} />
                    </div>

                    {/* Row 4: Badge Shape Selector (Stars & Shapes) & Exact Location */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: 'block', marginBottom: 4 }}>STERN / BADGE FORM (13-ZACK STERN)</label>
                        <select value={locForm.highlight?.badgeShape || locForm.highlight?.starStyle || 'jagged_star_13'} onChange={(e) => setLocForm({ ...locForm, highlight: { ...locForm.highlight, badgeShape: e.target.value } })} style={{ width: '100%', padding: 8, borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.white, fontSize: 12 }}>
                          <option value="jagged_star_13">💥 13-Zackiger Stern (Sehr Zackiger Stern)</option>
                          <option value="starburst">❇️ Zacken-Burst Badge</option>
                          <option value="star">⭐ Klassischer Stern</option>
                          <option value="sparkles">🌟 Magic Sparkles</option>
                          <option value="flame">🔥 Fire Deal</option>
                          <option value="tag">🏷️ Angebotsschild</option>
                          <option value="medal">🎖️ Auszeichnungs-Medaille</option>
                          <option value="crown">👑 Royal Crown</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: 'block', marginBottom: 4 }}>EXAKTER STANDORT / BEREICH</label>
                        <input value={locForm.highlight?.exactLocation || ''} onChange={(e) => setLocForm({ ...locForm, highlight: { ...locForm.highlight, exactLocation: e.target.value } })} placeholder="z.B. Terrasse & Lounge Bar" style={{ width: '100%', padding: 8, borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.white, fontSize: 12 }} />
                      </div>
                    </div>

                    {/* Row 5: Exact Start Date, End Date, Start Time & End Time */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, display: 'block', marginBottom: 3 }}>STARTDATUM</label>
                        <input type="date" value={locForm.highlight?.startDate || ''} onChange={(e) => setLocForm({ ...locForm, highlight: { ...locForm.highlight, startDate: e.target.value } })} style={{ width: '100%', padding: 6, borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.white, fontSize: 11 }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, display: 'block', marginBottom: 3 }}>ENDDATUM</label>
                        <input type="date" value={locForm.highlight?.endDate || ''} onChange={(e) => setLocForm({ ...locForm, highlight: { ...locForm.highlight, endDate: e.target.value } })} style={{ width: '100%', padding: 6, borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.white, fontSize: 11 }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, display: 'block', marginBottom: 3 }}>STARTZEIT</label>
                        <input type="time" value={locForm.highlight?.startTime || '17:00'} onChange={(e) => setLocForm({ ...locForm, highlight: { ...locForm.highlight, startTime: e.target.value } })} style={{ width: '100%', padding: 6, borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.white, fontSize: 11 }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, display: 'block', marginBottom: 3 }}>ENDZEIT</label>
                        <input type="time" value={locForm.highlight?.endTime || '19:30'} onChange={(e) => setLocForm({ ...locForm, highlight: { ...locForm.highlight, endTime: e.target.value } })} style={{ width: '100%', padding: 6, borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.white, fontSize: 11 }} />
                      </div>
                    </div>

                    {/* Row 6: Color & Background Image */}
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: 'block', marginBottom: 4 }}>BANNER FARBE</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input type="color" value={locForm.highlight?.color || '#7C3AED'} onChange={(e) => setLocForm({ ...locForm, highlight: { ...locForm.highlight, color: e.target.value } })} style={{ width: 42, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent' }} />
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.white }}>{locForm.highlight?.color || '#7C3AED'}</div>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <label style={{ fontSize: 11, fontWeight: 800, color: C.muted }}>HINTERGRUNDBILD (URL oder PRESET)</label>
                          <button type="button" onClick={() => setShowMediaModal(true)} style={{ fontSize: 10, color: C.purple, fontWeight: 700, background: `${C.purple}22`, border: `1px solid ${C.purple}44`, borderRadius: 6, padding: '2px 6px', cursor: 'pointer' }}>
                            🖼️ Mediathek
                          </button>
                        </div>
                        <input value={locForm.highlight?.bgImage || ''} onChange={(e) => setLocForm({ ...locForm, highlight: { ...locForm.highlight, bgImage: e.target.value } })} placeholder="https://images.unsplash.com/photo-..." style={{ width: '100%', padding: 8, borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.white, fontSize: 11 }} />
                        
                        {/* Quick Image Presets */}
                        <div style={{ display: 'flex', gap: 6, marginTop: 6, overflowX: 'auto', paddingBottom: 2 }}>
                          {[
                            { name: '🍹 Cocktails', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80' },
                            { name: '🥩 Gourmet', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80' },
                            { name: '🍔 Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80' },
                            { name: '🍕 Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80' },
                            { name: '☕ Kaffee', url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80' }
                          ].map((preset) => (
                            <button key={preset.name} type="button" onClick={() => setLocForm({ ...locForm, highlight: { ...locForm.highlight, bgImage: preset.url } })} style={{ padding: '3px 8px', borderRadius: 6, background: locForm.highlight?.bgImage === preset.url ? C.purple : C.card, border: `1px solid ${C.border}`, color: C.white, fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Banner Live Preview */}
                    <div style={{ borderTop: `1px dashed ${C.border}`, paddingTop: 12, marginTop: 4 }}>
                      <div style={{ fontSize: 10, color: C.muted, fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        ✨ LIVE-VORSCHAU FÜR BREADCRUMB / GAST:
                      </div>
                      <div style={{
                        padding: 14,
                        borderRadius: 16,
                        position: 'relative',
                        overflow: 'hidden',
                        background: locForm.highlight?.bgImage
                          ? `linear-gradient(135deg, rgba(15,15,26,0.85) 0%, rgba(15,15,26,0.95) 100%), url(${locForm.highlight.bgImage}) center/cover no-repeat`
                          : `linear-gradient(135deg, ${locForm.highlight?.color || C.purple}, #EC4899)`,
                        color: '#FFF',
                        boxShadow: `0 8px 24px ${locForm.highlight?.color || C.purple}44`,
                        border: '1px solid rgba(255,255,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 16, background: '#FFF', color: locForm.highlight?.color || C.purple, fontSize: 10, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {(locForm.highlight?.badgeShape || 'jagged_star_13') === 'jagged_star_13' && <JaggedStar13 size={15} fill="#F59E0B" stroke="#B45309" />}
                              {(locForm.highlight?.badgeShape) === 'starburst' && <span>💥</span>}
                              {(locForm.highlight?.badgeShape) === 'star' && <span>⭐</span>}
                              {(locForm.highlight?.badgeShape) === 'sparkles' && <span>🌟</span>}
                              {(locForm.highlight?.badgeShape) === 'flame' && <span>🔥</span>}
                              {(locForm.highlight?.badgeShape) === 'tag' && <span>🏷️</span>}
                              <span>{locForm.highlight?.badge || 'HIGHLIGHT'}</span>
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 800, opacity: 0.95, background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 8 }}>
                              ⏰ {locForm.highlight?.startDate ? `${locForm.highlight.startDate} bis ${locForm.highlight.endDate} • ` : ''}{locForm.highlight?.startTime} – {locForm.highlight?.endTime} Uhr
                            </span>
                            {locForm.highlight?.exactLocation && (
                              <span style={{ fontSize: 10, opacity: 0.9, background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 8 }}>
                                📍 {locForm.highlight.exactLocation}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 900 }}>{locForm.highlight?.title || 'Banner Titel'}</div>
                          {locForm.highlight?.text && <div style={{ fontSize: 11, opacity: 0.92, marginTop: 2 }}>{locForm.highlight.text}</div>}
                        </div>

                        {locForm.highlight?.price && (
                          <div style={{ background: '#F59E0B', color: '#000', padding: '4px 10px', borderRadius: 12, fontWeight: 900, fontSize: 13, transform: 'rotate(-3deg)', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                            {locForm.highlight.price}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="submit" style={{ flex: 1, padding: '12px 20px', borderRadius: 12, background: C.purple, color: C.white, border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>
                  💾 Standort Speichern
                </button>
                <button type="button" onClick={() => setShowLocationModal(false)} style={{ padding: '12px 20px', borderRadius: 12, background: C.bg, border: `1px solid ${C.border}`, color: C.white, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: C.purple, color: C.white, padding: '12px 24px', borderRadius: 14, fontSize: 13, fontWeight: 700, zIndex: 9999 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
