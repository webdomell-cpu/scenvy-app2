// src/lib/db.js — Firebase Firestore Data Hooks (React Query)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from './firebase'

export const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

export function formatDateTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  if (isNaN(d.getTime())) return String(ts)
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) + ', ' + d.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  }) + ' Uhr'
}

// ─── Helper: normalize DB reel → frontend reel ───────────
export const normalizeReel = (r) => {
  const created = r.created_at || r.createdAt
  const updated = r.updated_at || r.updatedAt
  return {
    ...r,
    createdAt: created || new Date().toISOString(),
    updatedAt: updated || created || new Date().toISOString(),
    locationId: r.location_id || r.locationId,
    ctaUrl:     r.cta_url    || r.ctaUrl || '',
    ctaAction:  r.cta_action || r.ctaAction || 'url',
    mediaUrl:   r.media_url  || r.mediaUrl || null,
    mediaType:  r.media_type || r.mediaType || 'image',
    loc:        r.locations?.name || r.loc || '',
    ago:        formatDateTime(updated || created),
    createdFormatted: formatDateTime(created),
    updatedFormatted: formatDateTime(updated || created),
  }
}

// ─── Helper: normalize frontend reel → DB reel ───────────
export const denormalizeReel = (r, tenantId) => ({
  id:          r.id || crypto.randomUUID(),
  tenant_id:   tenantId,
  location_id: r.locationId || r.location_id || null,
  title:       r.title || 'Neues Reel',
  type:        r.type || 'offer',
  status:      r.status || 'draft',
  color:       r.color || '#8B5CF6',
  emoji:       r.emoji || '🎬',
  cta:         r.cta || 'Mehr erfahren',
  cta_url:     r.ctaUrl || r.cta_url || null,
  cta_action:  r.ctaAction || r.cta_action || 'url',
  media_url:   r.mediaUrl || r.media_url || null,
  media_type:  r.mediaType || r.media_type || 'image',
  loc:         r.loc || '',
  scheduled_at: r.scheduledAt || r.scheduled_at || null,
  created_at:  r.created_at || r.createdAt || new Date().toISOString(),
  updated_at:  new Date().toISOString()
})

export async function resolveTenantId(providedTenantId) {
  if (providedTenantId && providedTenantId !== 'ALL') return providedTenantId
  return 'tenant_default'
}

// ════════════════════════════════════════════════════════
// REELS
// ════════════════════════════════════════════════════════
export function useReels(tenantId) {
  return useQuery({
    queryKey: ['reels', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      let firestoreItems = []
      try {
        const reelsRef = collection(db, 'reels')
        let q = query(reelsRef)
        if (tenantId && tenantId !== 'ALL') {
          q = query(reelsRef, where('tenant_id', '==', tenantId))
        }
        const snap = await getDocs(q)
        firestoreItems = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      } catch (e) {
        console.warn('Firestore reels query notice:', e)
      }

      const stored = JSON.parse(localStorage.getItem(`demo_reels_${tenantId}`) || '[]')
      const combined = [...firestoreItems]
      for (const s of stored) {
        if (!combined.some(item => item.id === s.id)) {
          combined.push(s)
        }
      }

      const now = new Date()
      const processed = combined.map(r => {
        if (r.status === 'scheduled' && (r.scheduled_at || r.scheduledAt)) {
          const schedDate = new Date(r.scheduled_at || r.scheduledAt)
          if (!isNaN(schedDate.getTime()) && schedDate <= now) {
            return { ...r, status: 'live' }
          }
        }
        return r
      })

      return processed.map(normalizeReel)
    },
  })
}

export function useSaveReel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params) => {
      const reel = params?.reel || params
      const tenantId = params?.tenantId || reel?.tenant_id
      const finalTenantId = await resolveTenantId(tenantId || reel?.tenant_id)
      const payload = denormalizeReel(reel, finalTenantId)

      try {
        const docRef = doc(db, 'reels', payload.id)
        await setDoc(docRef, payload, { merge: true })
      } catch (e) {
        console.warn('Firestore save reel fallback:', e)
      }

      // Always sync to localStorage so local queries find it instantly
      const stored = JSON.parse(localStorage.getItem(`demo_reels_${finalTenantId}`) || '[]')
      const index = stored.findIndex(l => l.id === payload.id)
      if (index >= 0) stored[index] = payload
      else stored.push(payload)
      localStorage.setItem(`demo_reels_${finalTenantId}`, JSON.stringify(stored))

      return normalizeReel(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reels'] })
    },
  })
}

export function useDeleteReel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, tenantId }) => {
      try {
        await deleteDoc(doc(db, 'reels', id))
      } catch (e) {
        console.warn('Firestore delete reel fallback:', e)
      }
      const stored = JSON.parse(localStorage.getItem(`demo_reels_${tenantId}`) || '[]')
      localStorage.setItem(`demo_reels_${tenantId}`, JSON.stringify(stored.filter(x => x.id !== id)))
      return tenantId
    },
    onSuccess: (tenantId) =>
      qc.invalidateQueries({ queryKey: ['reels', tenantId] }),
  })
}

// ════════════════════════════════════════════════════════
// LOCATIONS
// ════════════════════════════════════════════════════════
export function useLocations(tenantId) {
  return useQuery({
    queryKey: ['locations', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      try {
        const locRef = collection(db, 'locations')
        let q = query(locRef)
        if (tenantId && tenantId !== 'ALL') {
          q = query(locRef, where('tenant_id', '==', tenantId))
        }
        const snap = await getDocs(q)
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        if (items.length > 0) return items
      } catch (e) {
        console.warn('Firestore locations query notice:', e)
      }

      const stored = localStorage.getItem(`demo_locations_${tenantId}`)
      return stored ? JSON.parse(stored) : [
        {
          id: 'loc1',
          tenant_id: tenantId,
          name: 'Hauptplatz München',
          slug: 'muenchen-hauptplatz',
          address: 'Marienplatz 12',
          city: 'München',
          zip: '80331',
          country: 'DE',
          googleMapsUrl: 'https://maps.google.com/?q=Marienplatz+12+München',
          phone: '+49 89 1234567',
          tablesCount: 18,
          active: true,
          highlight: {
            enabled: true,
            title: '🔥 Happy Hour Special',
            text: 'Alle Aperitifs 2-for-1 & Frisches Focaccia aufs Haus zwischen 17:00 und 19:30 Uhr!',
            startTime: '11:00',
            endTime: '23:00',
            badge: 'Tages-Highlight',
            color: '#7C3AED'
          }
        },
        {
          id: 'loc2',
          tenant_id: tenantId,
          name: 'Filiale Berlin Ku\'Damm',
          slug: 'berlin-kudamm',
          address: 'Kurfürstendamm 180',
          city: 'Berlin',
          zip: '10707',
          country: 'DE',
          googleMapsUrl: 'https://maps.google.com/?q=Kurfuerstendamm+180+Berlin',
          phone: '+49 30 9876543',
          tablesCount: 24,
          active: true,
          highlight: {
            enabled: true,
            title: '⭐ Mittagsmenü & Business Lunch',
            text: 'Hauptgericht inkl. Espresso für nur 12,90 € – täglich bis 14:30 Uhr',
            startTime: '11:30',
            endTime: '14:30',
            badge: 'LUNCH DEAL',
            color: '#10B981'
          }
        }
      ]
    },
  })
}

export function useSaveLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params) => {
      const location = params?.location || params
      const tenantId = params?.tenantId || location?.tenant_id
      const finalTenantId = await resolveTenantId(tenantId || location?.tenant_id)
      const payload = {
        id: location.id || crypto.randomUUID(),
        tenant_id: finalTenantId,
        name: location.name || 'Neuer Standort',
        slug: location.slug || (location.name ? location.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'standort'),
        address: location.address || '',
        zip: location.zip || '',
        city: location.city || 'Berlin',
        country: location.country || 'DE',
        googleMapsUrl: location.googleMapsUrl || location.maps_url || '',
        phone: location.phone || '',
        tablesCount: location.tablesCount || location.tables_count || 10,
        active: location.active !== false,
        defaultMenuId: location.defaultMenuId || '',
        highlight: location.highlight || {
          enabled: false,
          title: '',
          text: '',
          startTime: '12:00',
          endTime: '22:00',
          badge: 'SPEZIAL',
          color: '#8B5CF6'
        },
        updated_at: new Date().toISOString()
      }

      try {
        await setDoc(doc(db, 'locations', payload.id), payload, { merge: true })
      } catch (e) {
        console.warn('Firestore save location fallback:', e)
      }

      // Always sync to localStorage demo_locations
      const stored = JSON.parse(localStorage.getItem(`demo_locations_${finalTenantId}`) || '[]')
      const index = stored.findIndex(l => l.id === payload.id)
      if (index >= 0) stored[index] = payload
      else stored.push(payload)
      localStorage.setItem(`demo_locations_${finalTenantId}`, JSON.stringify(stored))

      return payload
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['locations'] }),
  })
}

export function useDeleteLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, tenantId }) => {
      try {
        await deleteDoc(doc(db, 'locations', id))
      } catch (e) {
        console.warn('Firestore delete location fallback:', e)
      }
      const stored = JSON.parse(localStorage.getItem(`demo_locations_${tenantId}`) || '[]')
      localStorage.setItem(`demo_locations_${tenantId}`, JSON.stringify(stored.filter(x => x.id !== id)))
      return tenantId
    },
    onSuccess: (tenantId) =>
      qc.invalidateQueries({ queryKey: ['locations', tenantId] }),
  })
}

export async function fetchLocationData(locationId) {
  if (!locationId) return null
  try {
    const snap = await getDoc(doc(db, 'locations', locationId))
    if (snap.exists()) return snap.data()
  } catch (e) {
    console.warn('fetchLocationData notice:', e)
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith('demo_locations_')) {
      const items = JSON.parse(localStorage.getItem(key) || '[]')
      const found = items.find(l => l.id === locationId || l.slug === locationId)
      if (found) return found
    }
  }

  return {
    id: locationId,
    name: 'Hauptplatz München',
    city: 'München',
    address: 'Marienplatz 12, 80331 München',
    googleMapsUrl: 'https://maps.google.com/?q=Marienplatz+12+München',
    phone: '+49 89 1234567',
    active: true,
    highlight: {
      enabled: true,
      title: '🔥 Happy Hour & Tagesempfehlung',
      text: '2-for-1 Signature Spritz & Frische Steinofen-Pizza von 17:00–19:30 Uhr!',
      startTime: '11:00',
      endTime: '23:00',
      badge: 'TOP HIGHLIGHT',
      color: '#7C3AED'
    }
  }
}

// ════════════════════════════════════════════════════════
// ANALYTICS
// ════════════════════════════════════════════════════════
export function useAnalyticsSummary(tenantId) {
  return useQuery({
    queryKey: ['analytics', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const days = ['Mo','Di','Mi','Do','Fr','Sa','So']
      const chart = days.map(day => ({
        day,
        scans: Math.floor(Math.random() * 45 + 12),
        views: Math.floor(Math.random() * 120 + 35),
        ctr: Math.round(Math.random() * 20 + 15)
      }))

      return {
        totalScans: chart.reduce((acc, c) => acc + c.scans, 0),
        chart,
      }
    },
  })
}

// ════════════════════════════════════════════════════════
// TENANTS (Super Admin)
// ════════════════════════════════════════════════════════
export function useTenants() {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      try {
        const snap = await getDocs(collection(db, 'tenants'))
        const items = snap.docs.map(d => {
          const data = d.data()
          return {
            id: d.id,
            modules: { flow: true, menu: true, board: true, host: false },
            ...data
          }
        })
        if (items && items.length > 0) return items
      } catch (e) {
        console.warn('Firestore tenants query notice:', e)
      }
      return [
        { id: 'tenant-demo-1', name: 'Trattoria Bella (Hauptmandant)', plan: 'pro', status: 'active', locations_count: 2, max_locations: 5, reels_count: 8, custom_price: 19, contact_email: 'kontakt@trattoria.de', modules: { flow: true, menu: true, board: true, host: true } },
        { id: 'tenant-demo-2', name: 'Burger & Craft Bar', plan: 'starter', status: 'trial', locations_count: 1, max_locations: 1, reels_count: 3, custom_price: 0, contact_email: 'info@burgercraft.de', modules: { flow: true, menu: true, board: false, host: false } },
        { id: 'tenant-demo-3', name: 'Grand Hotel & Resort Group', plan: 'enterprise', status: 'active', locations_count: 8, max_locations: 15, reels_count: 32, custom_price: 149, contact_email: 'admin@grandhotel.de', modules: { flow: true, menu: true, board: true, host: true } }
      ]
    },
  })
}

export function useSaveTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tenantData) => {
      const id = tenantData.id || (`tenant-${Date.now()}`)
      const newTenant = {
        id,
        name: tenantData.name || 'Neuer Mandant',
        plan: tenantData.plan || 'pro',
        status: tenantData.status || 'active',
        locations_count: tenantData.locations_count || 1,
        max_locations: tenantData.max_locations ?? (tenantData.plan === 'starter' ? 1 : tenantData.plan === 'pro' ? 5 : 10),
        reels_count: tenantData.reels_count || 0,
        custom_price: tenantData.custom_price ? Number(tenantData.custom_price) : 0,
        contact_email: tenantData.contact_email || tenantData.email || '',
        contact_name: tenantData.contact_name || '',
        company_name: tenantData.company_name || tenantData.name || '',
        company_city: tenantData.company_city || '',
        modules: tenantData.modules || { flow: true, menu: true, board: true, host: false },
        createdAt: new Date().toISOString()
      }
      try {
        await setDoc(doc(db, 'tenants', id), newTenant, { merge: true })
      } catch (e) {
        console.warn('Firestore save tenant fallback:', e)
      }
      try {
        localStorage.setItem(`demo_tenant_${id}`, JSON.stringify(newTenant))
      } catch (e) {
        console.warn('localStorage tenant save notice:', e)
      }
      return newTenant
    },
    onSuccess: (data) => {
      qc.setQueryData(['tenants'], (old) => {
        if (!old || !Array.isArray(old)) return [data]
        const exists = old.some(t => t.id === data.id)
        if (exists) {
          return old.map(t => t.id === data.id ? { ...t, ...data } : t)
        }
        return [data, ...old]
      })
      qc.setQueryData(['tenant', data.id], data)
      qc.invalidateQueries({ queryKey: ['tenants'] })
      qc.invalidateQueries({ queryKey: ['tenant', data.id] })
    },
  })
}

export function useUpdateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      try {
        await setDoc(doc(db, 'tenants', id), updates, { merge: true })
      } catch (e) {
        console.warn('Firestore update tenant fallback:', e)
      }
      try {
        const localKey = `demo_tenant_${id}`
        const existing = localStorage.getItem(localKey)
        const merged = existing ? { ...JSON.parse(existing), ...updates } : { id, ...updates }
        localStorage.setItem(localKey, JSON.stringify(merged))
      } catch (e) {
        console.warn('localStorage tenant update notice:', e)
      }
      return { id, ...updates }
    },
    onSuccess: (data, { id, updates }) => {
      qc.setQueryData(['tenants'], (old) => {
        if (!old || !Array.isArray(old)) return old
        return old.map(t => t.id === id ? { ...t, ...updates } : t)
      })
      qc.setQueryData(['tenant', id], (old) => {
        if (!old) return { id, ...updates }
        return { ...old, ...updates }
      })
      qc.invalidateQueries({ queryKey: ['tenants'] })
      qc.invalidateQueries({ queryKey: ['tenant', id] })
    },
  })
}

export function useDeleteTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      try {
        await deleteDoc(doc(db, 'tenants', id))
      } catch (e) {
        console.warn('Firestore delete tenant fallback:', e)
      }
      return id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  })
}

// ════════════════════════════════════════════════════════
// USERS MANAGEMENT (Admin User Management)
// ════════════════════════════════════════════════════════
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const snap = await getDocs(collection(db, 'users'))
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        return items
      } catch (e) {
        console.warn('Firestore users query notice:', e)
        return []
      }
    },
  })
}

export function useSaveUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userData) => {
      const uid = userData.uid || userData.id || ('usr_' + Date.now())
      const payload = {
        uid,
        id: uid,
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        role: userData.role || 'tenant_owner',
        tenant_id: userData.tenant_id || ('tenant_' + uid),
        updatedAt: new Date().toISOString()
      }
      try {
        await setDoc(doc(db, 'users', uid), payload, { merge: true })
        // Also ensure tenant exists
        if (userData.tenant_name || userData.venue) {
          const tenantId = payload.tenant_id
          await setDoc(doc(db, 'tenants', tenantId), {
            id: tenantId,
            name: userData.tenant_name || userData.venue || 'New Venue',
            plan: userData.plan || 'pro',
            status: 'active',
            updatedAt: new Date().toISOString()
          }, { merge: true })
        }
      } catch (e) {
        console.warn('Firestore save user notice:', e)
      }
      return payload
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['tenants'] })
    }
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId) => {
      try {
        await deleteDoc(doc(db, 'users', userId))
      } catch (e) {
        console.warn('Firestore delete user notice:', e)
      }
      return userId
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] })
  })
}

// ════════════════════════════════════════════════════════
// MEDIA UPLOAD & LIBRARY
// ════════════════════════════════════════════════════════
export async function uploadMedia(file, tenantId) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useMedia(tenantId) {
  return useQuery({
    queryKey: ['media', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      try {
        const snap = await getDocs(query(collection(db, 'media'), where('tenant_id', '==', tenantId)))
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        if (items.length > 0) return items
      } catch (e) {
        console.warn('Firestore media query notice:', e)
      }

      const stored = localStorage.getItem(`demo_media_${tenantId}`)
      return stored ? JSON.parse(stored) : []
    },
  })
}

export function useSaveMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ media, tenantId }) => {
      const finalTenantId = await resolveTenantId(tenantId)
      const payload = { ...media, tenant_id: finalTenantId, id: media.id || crypto.randomUUID() }

      try {
        await setDoc(doc(db, 'media', payload.id), payload, { merge: true })
      } catch (e) {
        console.warn('Firestore save media fallback:', e)
        const stored = JSON.parse(localStorage.getItem(`demo_media_${finalTenantId}`) || '[]')
        const index = stored.findIndex(m => m.id === payload.id)
        if (index >= 0) stored[index] = payload
        else stored.push(payload)
        localStorage.setItem(`demo_media_${finalTenantId}`, JSON.stringify(stored))
      }
      return payload
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  })
}

export function useDeleteMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, tenantId }) => {
      try {
        await deleteDoc(doc(db, 'media', id))
      } catch (e) {
        console.warn('Firestore delete media fallback:', e)
      }
      const stored = JSON.parse(localStorage.getItem(`demo_media_${tenantId}`) || '[]')
      localStorage.setItem(`demo_media_${tenantId}`, JSON.stringify(stored.filter(x => x.id !== id)))
      return tenantId
    },
    onSuccess: (tenantId) => qc.invalidateQueries({ queryKey: ['media', tenantId] }),
  })
}

// ════════════════════════════════════════════════════════
// TENANT PROFILE
// ════════════════════════════════════════════════════════
export function useTenant(tenantId) {
  return useQuery({
    queryKey: ['tenant', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      try {
        const snap = await getDoc(doc(db, 'tenants', tenantId))
        if (snap.exists()) {
          const d = snap.data()
          return {
            modules: { flow: true, menu: true, board: true, host: false },
            ...d
          }
        }
      } catch (e) {
        console.warn('Firestore get tenant notice:', e)
      }

      const stored = localStorage.getItem(`demo_tenant_${tenantId}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          modules: { flow: true, menu: true, board: true, host: false },
          ...parsed
        }
      }
      return { id: tenantId, name: 'SCENVY Partner', plan: 'pro', status: 'active', max_locations: 5, custom_price: 19, modules: { flow: true, menu: true, board: true, host: false } }
    },
  })
}

export function useSaveTenantProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const finalTenantId = await resolveTenantId(id)
      const payload = { id: finalTenantId, ...updates }
      try {
        await setDoc(doc(db, 'tenants', finalTenantId), payload, { merge: true })
      } catch (e) {
        console.warn('Firestore save tenant profile fallback:', e)
        localStorage.setItem(`demo_tenant_${finalTenantId}`, JSON.stringify(payload))
      }
      return payload
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['tenant', id] })
      qc.invalidateQueries({ queryKey: ['tenants'] })
    },
  })
}

// ════════════════════════════════════════════════════════
// PLATFORM CONFIG
// ════════════════════════════════════════════════════════
// DOMAIN AUTHORIZATION & REGISTRY HELPERS
// ════════════════════════════════════════════════════════
export const DEFAULT_DOMAINS = [
  { id: 'scenvy-de', domain: 'scenvy.de', type: 'Haupt-Domain', status: 'authorized', ssl: 'active', targetModule: 'Landing Page & Platform', tenantId: 'ALL', addedAt: '2026-01-01' },
  { id: 'scary-de', domain: 'scary.de', type: 'Eigene Domain', status: 'authorized', ssl: 'active', targetModule: 'Custom Venue & QR Portal', tenantId: 'ALL', addedAt: '2026-08-01' },
  { id: 'app-scenvy-de', domain: 'app.scenvy.de', type: 'Subdomain', status: 'authorized', ssl: 'active', targetModule: 'Tenant Admin App', tenantId: 'ALL', addedAt: '2026-01-01' },
  { id: 'flow-scenvy-de', domain: 'flow.scenvy.de', type: 'Subdomain', status: 'authorized', ssl: 'active', targetModule: 'Flow Content Feed', tenantId: 'ALL', addedAt: '2026-01-01' },
  { id: 'menu-scenvy-de', domain: 'menu.scenvy.de', type: 'Subdomain', status: 'authorized', ssl: 'active', targetModule: 'Digital Menu Reel Addon', tenantId: 'ALL', addedAt: '2026-01-01' },
  { id: 'board-scenvy-de', domain: 'board.scenvy.de', type: 'Subdomain', status: 'authorized', ssl: 'active', targetModule: 'Digital Signage TV Board', tenantId: 'ALL', addedAt: '2026-01-01' },
]

export function useDomains() {
  return useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      try {
        const snap = await getDocs(collection(db, 'domains'))
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          localStorage.setItem('scenvy_domains', JSON.stringify(list))
          return list
        }
      } catch (e) {
        console.warn('Firestore domains fetch notice:', e)
      }
      const saved = localStorage.getItem('scenvy_domains')
      return saved ? JSON.parse(saved) : DEFAULT_DOMAINS
    }
  })
}

export function useSaveDomain() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (domainObj) => {
      const id = domainObj.id || domainObj.domain.replace(/[^a-zA-Z0-9-]/g, '_')
      const payload = {
        id,
        domain: domainObj.domain.trim().toLowerCase(),
        type: domainObj.type || 'Eigene Domain',
        status: domainObj.status || 'authorized',
        ssl: domainObj.ssl || 'active',
        targetModule: domainObj.targetModule || 'Custom Venue Portal',
        tenantId: domainObj.tenantId || 'ALL',
        addedAt: domainObj.addedAt || new Date().toISOString().split('T')[0]
      }
      try {
        await setDoc(doc(db, 'domains', id), payload, { merge: true })
      } catch (e) {
        console.warn('Firestore domain save fallback:', e)
      }
      const current = JSON.parse(localStorage.getItem('scenvy_domains') || JSON.stringify(DEFAULT_DOMAINS))
      const idx = current.findIndex(d => d.id === id || d.domain === payload.domain)
      if (idx >= 0) {
        current[idx] = payload
      } else {
        current.push(payload)
      }
      localStorage.setItem('scenvy_domains', JSON.stringify(current))
      return payload
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['domains'] })
    }
  })
}

export function useDeleteDomain() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (domainId) => {
      try {
        await deleteDoc(doc(db, 'domains', domainId))
      } catch (e) {
        console.warn('Firestore domain delete fallback:', e)
      }
      const current = JSON.parse(localStorage.getItem('scenvy_domains') || JSON.stringify(DEFAULT_DOMAINS))
      const filtered = current.filter(d => d.id !== domainId)
      localStorage.setItem('scenvy_domains', JSON.stringify(filtered))
      return domainId
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['domains'] })
    }
  })
}

// ════════════════════════════════════════════════════════
export const DEFAULT_PLATFORM_CONFIG = {
  contact_email: 'support@scenvy.de',
  support_email: 'hilfe@scenvy.de',
  stripe_pk: '',
  stripe_secret: '',
  stripe_webhook: '',
  resend_key: '',
  from_email: 'noreply@scenvy.de',
}

export function usePlatformConfig() {
  return useQuery({
    queryKey: ['system_config_platform'],
    queryFn: async () => {
      try {
        const snap = await getDoc(doc(db, 'system_config', 'platform'))
        if (snap.exists()) {
          const data = { ...DEFAULT_PLATFORM_CONFIG, ...snap.data() }
          localStorage.setItem('scenvy_platform_config', JSON.stringify(data))
          return data
        }
      } catch (e) {
        console.warn('Firestore platform config notice:', e)
      }
      const stored = localStorage.getItem('scenvy_platform_config')
      return stored ? { ...DEFAULT_PLATFORM_CONFIG, ...JSON.parse(stored) } : DEFAULT_PLATFORM_CONFIG
    },
  })
}

export function useSavePlatformConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (config) => {
      const payload = { ...config, updated_at: new Date().toISOString() }
      try {
        await setDoc(doc(db, 'system_config', 'platform'), payload, { merge: true })
      } catch (e) {
        console.error('Firestore save platform config error:', e)
        if (e?.code === 'permission-denied') {
          throw new Error('Speichern fehlgeschlagen: Keine Administrator-Berechtigung für system_config/platform.')
        }
      }
      localStorage.setItem('scenvy_platform_config', JSON.stringify(payload))
      return payload
    },
    onSuccess: (data) => {
      qc.setQueryData(['system_config_platform'], data)
      qc.invalidateQueries({ queryKey: ['system_config_platform'] })
    },
  })
}

// ════════════════════════════════════════════════════════
// GUEST VIEW & REELS HELPERS
// ════════════════════════════════════════════════════════
export async function fetchLocation(locationId) {
  if (!locationId) return null
  if (locationId === 'demo') {
    return { id: 'demo', name: 'Demo Venue', address: 'Dubai Marina', city: 'Dubai', country: 'UAE', active: true }
  }
  if (locationId === 'dt-demo' || locationId === 'DT-Demo') {
    return { id: 'dt-demo', name: 'DT-Demo', address: 'Demo Strasse 12', city: 'Berlin', country: 'DE', active: true }
  }
  if (locationId === 'loc1') {
    return { id: 'loc1', name: 'Main Venue', address: 'Gastro Mile 12', city: 'Berlin', country: 'DE', active: true }
  }
  try {
    const snap = await getDoc(doc(db, 'locations', locationId))
    if (snap.exists()) return { id: snap.id, ...snap.data() }
  } catch (e) {
    console.warn('fetchLocation error:', e)
  }

  // Fallback search in localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('demo_locations_')) {
      try {
        const locs = JSON.parse(localStorage.getItem(key) || '[]')
        const found = locs.find(l => l.id === locationId || l.name === locationId)
        if (found) return found
      } catch (err) {
        console.warn('LocalStorage loc parse error:', err)
      }
    }
  }

  return { id: locationId, name: 'SCENVY Partner Venue', address: 'Gastro Mile 12', city: 'Berlin', country: 'DE', active: true }
}

export async function fetchReelsByLocation(locationId) {
  if (!locationId) return []
  let results = []
  
  const matchesLocation = (rLoc, reqLoc) => {
    if (!rLoc) return true
    const a = String(rLoc).toLowerCase()
    const b = String(reqLoc).toLowerCase()
    if (a === 'all' || b === 'all' || a === b) return true
    if (a.includes('demo') && b.includes('demo')) return true
    return false
  }

  try {
    const snap = await getDocs(query(collection(db, 'reels')))
    const allReels = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    const matching = allReels.filter(r => matchesLocation(r.location_id || r.locationId, locationId))
    results.push(...matching)
  } catch (e) {
    console.warn('fetchReelsByLocation error:', e)
  }

  // Search local storage across all demo_reels_ keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('demo_reels_')) {
      try {
        const reels = JSON.parse(localStorage.getItem(key) || '[]')
        const matching = reels.filter(r => matchesLocation(r.location_id || r.locationId, locationId))
        for (const m of matching) {
          if (!results.some(existing => existing.id === m.id)) {
            results.push(m)
          }
        }
      } catch (err) {
        console.warn('LocalStorage reel parse error:', err)
      }
    }
  }

  const now = new Date()
  results = results.map(r => {
    if (r.status === 'scheduled' && (r.scheduled_at || r.scheduledAt)) {
      const schedDate = new Date(r.scheduled_at || r.scheduledAt)
      if (!isNaN(schedDate.getTime()) && schedDate <= now) {
        return { ...r, status: 'live' }
      }
    }
    return r
  })

  // Filter for live, active, published, or un-statused reels (anything except explicit drafts)
  const validReels = results.filter(r => r && r.status !== 'draft' && r.status !== 'archived')
  if (validReels.length > 0) return validReels
  if (results.length > 0) return results

  // Demo fallback reels so guest view is never blank if no custom reels exist
  return [
    { id: 'demo-1', title: '50% Off Signature Cocktails', sub: 'Happy Hour', cta: 'Order at Bar', cta_url: '#', color: '#7C3AED', emoji: '🍹', type: 'offer', status: 'live', location_id: locationId, duration: 5 },
    { id: 'demo-2', title: "Chef's Tasting Menu & Wine Pairing", sub: 'Dinner Special', cta: 'Reserve Table', cta_url: '#', color: '#FF2D8D', emoji: '🍽️', type: 'menu', status: 'live', location_id: locationId, duration: 5 },
    { id: 'demo-3', title: 'Live Music & Rooftop Lounge', sub: 'Weekend Vibes', cta: 'Get Guestlist', cta_url: '#', color: '#00D4FF', emoji: '🎵', type: 'event', status: 'live', location_id: locationId, duration: 5 }
  ]
}

export async function recordScan(locationId, reelId = null) {
  if (!locationId || locationId === 'demo') return
  try {
    await addDoc(collection(db, 'scan_events'), {
      location_id: locationId,
      reel_id: reelId,
      event_type: 'scan',
      created_at: new Date().toISOString()
    })
  } catch (err) {
    console.warn('recordScan error:', err)
  }
}

export async function recordClick(reelId) {
  if (!reelId) return
  try {
    await addDoc(collection(db, 'scan_events'), {
      reel_id: reelId,
      event_type: 'click',
      created_at: new Date().toISOString()
    })
  } catch (err) {
    console.warn('recordClick error:', err)
  }
}

// ════════════════════════════════════════════════════════
// MENU REELS (AI Menu Add-On)
// ════════════════════════════════════════════════════════
export function useMenuReels(tenantId) {
  return useQuery({
    queryKey: ['menu_reels', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      try {
        const snap = await getDocs(query(collection(db, 'menus'), where('tenant_id', '==', tenantId)))
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        if (items.length > 0) return items
      } catch (e) {
        console.warn('Firestore menu_reels notice:', e)
      }

      const stored = localStorage.getItem(`demo_menu_reels_${tenantId}`)
      return stored ? JSON.parse(stored) : []
    },
  })
}

export function useSaveMenuReel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params) => {
      const menuReel = params?.menuReel || params
      const tenantId = params?.tenantId || menuReel?.tenant_id
      const finalTenantId = await resolveTenantId(tenantId || menuReel?.tenant_id)
      const id = menuReel.id || params.id || crypto.randomUUID()
      const title = menuReel.title || params.title || menuReel.branding?.name || menuReel.data?.branding?.name || 'Digital Menu'
      const data = menuReel.data || params.data || menuReel
      const payload = {
        id,
        tenant_id: finalTenantId,
        title,
        data,
        updated_at: new Date().toISOString()
      }

      try {
        await setDoc(doc(db, 'menus', payload.id), payload, { merge: true })
      } catch (e) {
        console.warn('Firestore save menu error, using fallback:', e)
      }

      const stored = JSON.parse(localStorage.getItem(`demo_menu_reels_${finalTenantId}`) || '[]')
      const index = stored.findIndex(m => m.id === payload.id)
      if (index >= 0) stored[index] = payload
      else stored.push(payload)
      localStorage.setItem(`demo_menu_reels_${finalTenantId}`, JSON.stringify(stored))

      return payload
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu_reels'] })
    }
  })
}

export function useDeleteMenuReel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, tenantId }) => {
      try {
        await deleteDoc(doc(db, 'menus', id))
      } catch (err) {
        console.warn('Firestore delete menu error:', err)
      }

      const finalTenantId = await resolveTenantId(tenantId)
      const stored = JSON.parse(localStorage.getItem(`demo_menu_reels_${finalTenantId}`) || '[]')
      localStorage.setItem(`demo_menu_reels_${finalTenantId}`, JSON.stringify(stored.filter(x => x.id !== id)))
      return tenantId
    },
    onSuccess: (tenantId) => qc.invalidateQueries({ queryKey: ['menu_reels', tenantId] })
  })
}

export async function fetchMenuReel(menuId) {
  if (!menuId) return null
  try {
    const snap = await getDoc(doc(db, 'menus', menuId))
    if (snap.exists()) return snap.data()
  } catch (e) {
    console.warn('fetchMenuReel error:', e)
  }

  // Local storage fallback
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith('demo_menu_reels_')) {
      const items = JSON.parse(localStorage.getItem(key) || '[]')
      const found = items.find(m => m.id === menuId)
      if (found) return found
    }
  }
  return null
}

// ════════════════════════════════════════════════════════
// SYSTEM CONFIGURATION (Firestore Database Persistence)
// ════════════════════════════════════════════════════════
export const DEFAULT_LANDING_CONFIG = {
  show_flow_page: true,
  show_menu_page: true,
  show_board_page: true,
  show_host_page: true,
  show_store_page: true,
  show_pricing_section: true,
  show_top_banner: true,
  top_banner_text: 'Neu: SCENVY AI Speisekarten-Reel Generator v2 ist live!',
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
}

export const DEFAULT_PRICING_CONFIG = {
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
}

export function useLandingConfig() {
  return useQuery({
    queryKey: ['system_config_landing'],
    queryFn: async () => {
      try {
        const snap = await getDoc(doc(db, 'system_config', 'landing'))
        if (snap.exists()) {
          const data = { ...DEFAULT_LANDING_CONFIG, ...snap.data() }
          localStorage.setItem('scenvy_landing_config', JSON.stringify(data))
          return data
        }
      } catch (e) {
        console.warn('Firestore landing config notice:', e)
      }
      const saved = localStorage.getItem('scenvy_landing_config')
      return saved ? { ...DEFAULT_LANDING_CONFIG, ...JSON.parse(saved) } : DEFAULT_LANDING_CONFIG
    }
  })
}

export function useSaveLandingConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (newConfig) => {
      const payload = { ...newConfig, updated_at: new Date().toISOString() }
      try {
        await setDoc(doc(db, 'system_config', 'landing'), payload, { merge: true })
      } catch (e) {
        console.warn('Firestore save landing config error:', e)
      }
      localStorage.setItem('scenvy_landing_config', JSON.stringify(payload))
      return payload
    },
    onSuccess: (data) => {
      qc.setQueryData(['system_config_landing'], data)
      qc.invalidateQueries({ queryKey: ['system_config_landing'] })
    }
  })
}

export function usePricingConfig() {
  return useQuery({
    queryKey: ['system_config_pricing'],
    queryFn: async () => {
      try {
        const snap = await getDoc(doc(db, 'system_config', 'pricing'))
        if (snap.exists()) {
          const data = { ...DEFAULT_PRICING_CONFIG, ...snap.data() }
          localStorage.setItem('scenvy_pricing_config', JSON.stringify(data))
          return data
        }
      } catch (e) {
        console.warn('Firestore pricing config notice:', e)
      }
      const saved = localStorage.getItem('scenvy_pricing_config')
      return saved ? { ...DEFAULT_PRICING_CONFIG, ...JSON.parse(saved) } : DEFAULT_PRICING_CONFIG
    }
  })
}

export function useSavePricingConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (newConfig) => {
      const payload = { ...newConfig, updated_at: new Date().toISOString() }
      try {
        await setDoc(doc(db, 'system_config', 'pricing'), payload, { merge: true })
      } catch (e) {
        console.warn('Firestore save pricing config error:', e)
      }
      localStorage.setItem('scenvy_pricing_config', JSON.stringify(payload))
      return payload
    },
    onSuccess: (data) => {
      qc.setQueryData(['system_config_pricing'], data)
      qc.invalidateQueries({ queryKey: ['system_config_pricing'] })
    }
  })
}

// ════════════════════════════════════════════════════════
// EMAIL TEMPLATES CONFIG (Firestore Database Persistence)
// ════════════════════════════════════════════════════════
export const DEFAULT_EMAIL_TEMPLATES = {
  reset_password: {
    name: 'Passwort zurücksetzen (Password Recovery)',
    subject_de: '🔐 Passwort zurücksetzen für deinen SCENVY Account',
    subject_en: '🔐 Reset your password for your SCENVY account',
    body_de: 'Hallo {user_name},\n\ndu hast eine Zurücksetzung deines Passworts angefordert. Klicke auf den folgenden Link, um dein Passwort neu zu vergeben:\n\n{reset_link}\n\nFalls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail einfach ignorieren.\n\nHerzliche Grüße,\nDein SCENVY Team',
    body_en: 'Hello {user_name},\n\nYou requested a password reset for your SCENVY account. Click the following link to choose a new password:\n\n{reset_link}\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nYour SCENVY Team'
  },
  welcome_user: {
    name: 'Willkommen nach Registrierung (User Welcome)',
    subject_de: '🎉 Willkommen bei SCENVY — Dein Account ist bereit!',
    subject_en: '🎉 Welcome to SCENVY — Your account is ready!',
    body_de: 'Hallo {user_name},\n\nwillkommen bei SCENVY! Dein Account für {company_name} wurde erfolgreich erstellt.\n\nDu kannst dich jetzt jederzeit anmelden unter:\n{login_url}\n\nViel Erfolg beim Erstellen deiner ersten AI Video Reels und Speisekarten!\n\nDein SCENVY Team',
    body_en: 'Hello {user_name},\n\nWelcome to SCENVY! Your account for {company_name} has been successfully created.\n\nYou can log in anytime at:\n{login_url}\n\nHave fun creating your first AI Video Reels and digital menus!\n\nYour SCENVY Team'
  },
  tenant_opened: {
    name: 'Mandanten-Eröffnung (Tenant Welcome)',
    subject_de: '🚀 Dein SCENVY Mandant {company_name} wurde freigeschaltet!',
    subject_en: '🚀 Your SCENVY Tenant {company_name} is now live!',
    body_de: 'Hallo {user_name},\n\ndein Mandat {company_name} ({plan_name} Plan) ist jetzt vollständig aktiviert.\n\nDeine Standorte, QR-Codes und KI-Generatoren stehen dir ab sofort zur Verfügung:\n{login_url}\n\nBei Fragen erreichst du uns unter {support_email}.\n\nDein SCENVY Team',
    body_en: 'Hello {user_name},\n\nYour tenant {company_name} ({plan_name} Plan) has been fully activated.\n\nYour locations, QR codes and AI generators are ready:\n{login_url}\n\nIf you have any questions, reach out to {support_email}.\n\nYour SCENVY Team'
  },
  invoice_notice: {
    name: 'Rechnung & Zahlungsbestätigung (Billing Notice)',
    subject_de: '📄 Ihre SCENVY Rechnung #{invoice_id}',
    subject_en: '📄 Your SCENVY Invoice #{invoice_id}',
    body_de: 'Sehr geehrte Damen und Herren von {company_name},\n\nvielen Dank für Ihre Zahlung. Anbei erhalten Sie Ihre aktuelle Rechnung #{invoice_id}.\n\nRechnungsbetrag: €{total_amount} brutto\nZahlungsart: Stripe Direct Checkout\n\nSie können alle Rechnungen auch jederzeit in Ihrem Admin-Dashboard herunterladen.\n\nMit freundlichen Grüßen,\nSCENVY Finance Team',
    body_en: 'Dear {company_name} Team,\n\nThank you for your payment. Attached is your invoice #{invoice_id}.\n\nTotal: €{total_amount} incl. VAT\nPayment method: Stripe Direct Checkout\n\nYou can also download all past invoices anytime in your dashboard.\n\nBest regards,\nSCENVY Finance Team'
  },
  contact_autoreply: {
    name: 'Kontaktanfrage Bestätigung (Contact Form Response)',
    subject_de: '📩 Wir haben deine Anfrage erhalten — SCENVY',
    subject_en: '📩 We received your request — SCENVY',
    body_de: 'Hallo {user_name},\n\nvielen Dank für deine Nachricht an SCENVY! Unser Support-Team prüft deine Anfrage und meldet sich innerhalb von 24 Stunden bei dir.\n\nEingegangene Nachricht:\n"{message_excerpt}"\n\nBeste Grüße,\nSCENVY Support',
    body_en: 'Hello {user_name},\n\nThank you for contacting SCENVY! Our support team is reviewing your message and will get back to you within 24 hours.\n\nYour message:\n"{message_excerpt}"\n\nBest regards,\nSCENVY Support'
  }
}

export function useEmailTemplates() {
  return useQuery({
    queryKey: ['system_config_email_templates'],
    queryFn: async () => {
      try {
        const snap = await getDoc(doc(db, 'system_config', 'email_templates'))
        if (snap.exists()) {
          const data = { ...DEFAULT_EMAIL_TEMPLATES, ...snap.data().templates }
          localStorage.setItem('scenvy_email_templates', JSON.stringify(data))
          return data
        }
      } catch (e) {
        console.warn('Firestore email templates notice:', e)
      }
      const saved = localStorage.getItem('scenvy_email_templates')
      return saved ? { ...DEFAULT_EMAIL_TEMPLATES, ...JSON.parse(saved) } : DEFAULT_EMAIL_TEMPLATES
    }
  })
}

export function useSaveEmailTemplates() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (templates) => {
      const payload = { templates, updated_at: new Date().toISOString() }
      try {
        await setDoc(doc(db, 'system_config', 'email_templates'), payload, { merge: true })
      } catch (e) {
        console.warn('Firestore save email templates error:', e)
      }
      localStorage.setItem('scenvy_email_templates', JSON.stringify(templates))
      return templates
    },
    onSuccess: (data) => {
      qc.setQueryData(['system_config_email_templates'], data)
      qc.invalidateQueries({ queryKey: ['system_config_email_templates'] })
    }
  })
}

// ════════════════════════════════════════════════════════
// STRIPE BILLING & CHECKOUT CLIENT HELPERS
// ════════════════════════════════════════════════════════
export async function createStripeCheckout(params) {
  try {
    const res = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
    return await res.json()
  } catch (err) {
    console.error('Create Stripe checkout error:', err)
    return {
      success: false,
      error: err.message,
      url: `${window.location.origin}/dashboard?stripe_demo_checkout=success`
    }
  }
}

export async function createStripePortal(params) {
  try {
    const res = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
    return await res.json()
  } catch (err) {
    console.error('Create Stripe portal error:', err)
    return {
      success: false,
      error: err.message,
      url: `${window.location.origin}/dashboard?portal_demo=active`
    }
  }
}

export async function getStripeStatus() {
  try {
    const res = await fetch('/api/stripe/status')
    return await res.json()
  } catch (err) {
    return { configured: false, mode: 'demo' }
  }
}

// ════════════════════════════════════════════════════════
// BOARD SIGNAGE DATA HOOKS (SHARED WITH board.scenvy.de)
// tenants/{tenantId}/displays, media, playlists, layouts
// ════════════════════════════════════════════════════════
export function useDisplays(tenantId) {
  return useQuery({
    queryKey: ['displays', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      try {
        const subRef = collection(db, 'tenants', tenantId, 'displays')
        const snap = await getDocs(subRef)
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        if (items.length > 0) return items
      } catch (e) {
        console.warn('Tenant displays subcollection notice:', e)
      }
      // Fallback query top-level
      try {
        const topRef = collection(db, 'displays')
        const q = query(topRef, where('tenant_id', '==', tenantId))
        const snap = await getDocs(q)
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        if (items.length > 0) return items
      } catch (e) {
        console.warn('Top-level displays query notice:', e)
      }
      return [
        { id: 'screen_1', tenant_id: tenantId, name: 'Main Lobby TV (4K)', status: 'online', location: 'Main Entrance', playlistId: 'pl_default' },
        { id: 'screen_2', tenant_id: tenantId, name: 'Bar Counter Display', status: 'online', location: 'Cocktail Bar', playlistId: 'pl_happyhour' }
      ]
    }
  })
}

export function useSaveDisplay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ display, tenantId }) => {
      const payload = {
        id: display.id || 'disp_' + crypto.randomUUID().slice(0, 8),
        tenant_id: tenantId,
        name: display.name || 'Display Screen',
        location: display.location || '',
        status: display.status || 'online',
        playlistId: display.playlistId || 'pl_default',
        updated_at: new Date().toISOString()
      }
      try {
        await setDoc(doc(db, 'tenants', tenantId, 'displays', payload.id), payload, { merge: true })
        await setDoc(doc(db, 'displays', payload.id), payload, { merge: true })
      } catch (e) {
        console.warn('Save display Firestore notice:', e)
      }
      return payload
    },
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['displays', variables.tenantId] })
  })
}

export function usePlaylists(tenantId) {
  return useQuery({
    queryKey: ['playlists', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      try {
        const subRef = collection(db, 'tenants', tenantId, 'playlists')
        const snap = await getDocs(subRef)
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        if (items.length > 0) return items
      } catch (e) {
        console.warn('Tenant playlists query notice:', e)
      }
      return [
        { id: 'pl_default', tenant_id: tenantId, name: 'Tages-Menü & Highlights Loop', itemsCount: 6, duration: '120s' },
        { id: 'pl_happyhour', tenant_id: tenantId, name: 'Happy Hour Special Offers', itemsCount: 4, duration: '60s' }
      ]
    }
  })
}

export function useSavePlaylist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ playlist, tenantId }) => {
      const payload = {
        id: playlist.id || 'pl_' + crypto.randomUUID().slice(0, 8),
        tenant_id: tenantId,
        name: playlist.name || 'Signage Playlist',
        items: playlist.items || [],
        duration: playlist.duration || '60s',
        updated_at: new Date().toISOString()
      }
      try {
        await setDoc(doc(db, 'tenants', tenantId, 'playlists', payload.id), payload, { merge: true })
        await setDoc(doc(db, 'playlists', payload.id), payload, { merge: true })
      } catch (e) {
        console.warn('Save playlist notice:', e)
      }
      return payload
    },
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['playlists', variables.tenantId] })
  })
}

export function useLayouts(tenantId) {
  return useQuery({
    queryKey: ['layouts', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      try {
        const subRef = collection(db, 'tenants', tenantId, 'layouts')
        const snap = await getDocs(subRef)
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        if (items.length > 0) return items
      } catch (e) {
        console.warn('Tenant layouts query notice:', e)
      }
      return [
        { id: 'lay_full', tenant_id: tenantId, name: 'Full-Screen Reel Player', type: 'single' },
        { id: 'lay_split', tenant_id: tenantId, name: 'Split Screen (Menu + Video Reel)', type: 'split' }
      ]
    }
  })
}

// ════════════════════════════════════════════════════════
// MANAGEMENT DASHBOARD: ORDERS & SERVICE CALLS (IN-MENU ORDERING)
// ════════════════════════════════════════════════════════

export function useRecordMenuScan() {
  return useMutation({
    mutationFn: async ({ tenantId, menuId }) => {
      const today = new Date().toISOString().split('T')[0]
      const scanId = `scan_${today}_${Math.random().toString(36).substring(2, 7)}`
      const scanRecord = {
        id: scanId,
        tenant_id: tenantId || 'tenant-demo-1',
        menu_id: menuId || 'demo',
        date: today,
        timestamp: new Date().toISOString()
      }
      try {
        await addDoc(collection(db, 'scans'), scanRecord)
      } catch (e) {
        console.warn('Scan record notice:', e)
      }
      const existing = JSON.parse(localStorage.getItem(`demo_scans_${tenantId}`) || '[]')
      existing.push(scanRecord)
      localStorage.setItem(`demo_scans_${tenantId}`, JSON.stringify(existing.slice(-200)))
      return scanRecord
    }
  })
}

export function useOrders(tenantId) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: ['orders', tenantId],
    enabled: !!tenantId,
    refetchInterval: 3000, // Live Polling every 3s for touch dashboard
    queryFn: async () => {
      let firestoreOrders = []
      try {
        const ordersRef = collection(db, 'orders')
        let q = query(ordersRef, where('tenant_id', '==', tenantId))
        const snap = await getDocs(q)
        firestoreOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      } catch (e) {
        console.warn('Orders query notice:', e)
      }

      const stored = JSON.parse(localStorage.getItem(`demo_orders_${tenantId}`) || '[]')
      const combined = [...firestoreOrders]
      for (const s of stored) {
        if (!combined.some(item => item.id === s.id)) {
          combined.push(s)
        }
      }

      // Sort newest first
      return combined.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    }
  })
}

export function useSubmitOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ tenantId, menuId, tableNumber, items, notes, totalPrice }) => {
      const orderPayload = {
        id: `ord_${Date.now()}`,
        tenant_id: tenantId || 'tenant-demo-1',
        menu_id: menuId || 'demo',
        table_number: tableNumber || 'Tisch 1',
        items: items || [],
        notes: notes || '',
        total_price: totalPrice || '0.00 €',
        status: 'pending', // pending -> accepted -> done
        created_at: new Date().toISOString()
      }

      try {
        await setDoc(doc(db, 'orders', orderPayload.id), orderPayload)
      } catch (e) {
        console.warn('Order save notice:', e)
      }

      const stored = JSON.parse(localStorage.getItem(`demo_orders_${orderPayload.tenant_id}`) || '[]')
      stored.unshift(orderPayload)
      localStorage.setItem(`demo_orders_${orderPayload.tenant_id}`, JSON.stringify(stored))

      return orderPayload
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['orders', data.tenant_id] })
    }
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, tenantId, status }) => {
      try {
        await setDoc(doc(db, 'orders', id), { status, updated_at: new Date().toISOString() }, { merge: true })
      } catch (e) {
        console.warn('Order status update notice:', e)
      }

      const stored = JSON.parse(localStorage.getItem(`demo_orders_${tenantId}`) || '[]')
      const idx = stored.findIndex(x => x.id === id)
      if (idx >= 0) {
        stored[idx].status = status
        stored[idx].updated_at = new Date().toISOString()
        localStorage.setItem(`demo_orders_${tenantId}`, JSON.stringify(stored))
      }
      return { id, tenantId, status }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['orders', res.tenantId] })
    }
  })
}

export function useServiceCalls(tenantId) {
  return useQuery({
    queryKey: ['service_calls', tenantId],
    enabled: !!tenantId,
    refetchInterval: 3000, // Live Polling every 3s
    queryFn: async () => {
      let firestoreCalls = []
      try {
        const callsRef = collection(db, 'service_calls')
        let q = query(callsRef, where('tenant_id', '==', tenantId))
        const snap = await getDocs(q)
        firestoreCalls = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      } catch (e) {
        console.warn('Service calls query notice:', e)
      }

      const stored = JSON.parse(localStorage.getItem(`demo_service_calls_${tenantId}`) || '[]')
      const combined = [...firestoreCalls]
      for (const s of stored) {
        if (!combined.some(item => item.id === s.id)) {
          combined.push(s)
        }
      }

      return combined.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    }
  })
}

export function useSubmitServiceCall() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ tenantId, tableNumber, type, note }) => {
      const callPayload = {
        id: `call_${Date.now()}`,
        tenant_id: tenantId || 'tenant-demo-1',
        table_number: tableNumber || 'Tisch 1',
        type: type || 'waiter', // 'waiter' (Kellner rufen) | 'bill' (Rechnung anfordern)
        note: note || '',
        status: 'pending',
        created_at: new Date().toISOString()
      }

      try {
        await setDoc(doc(db, 'service_calls', callPayload.id), callPayload)
      } catch (e) {
        console.warn('Service call save notice:', e)
      }

      const stored = JSON.parse(localStorage.getItem(`demo_service_calls_${callPayload.tenant_id}`) || '[]')
      stored.unshift(callPayload)
      localStorage.setItem(`demo_service_calls_${callPayload.tenant_id}`, JSON.stringify(stored))

      return callPayload
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['service_calls', data.tenant_id] })
    }
  })
}

export function useUpdateServiceCallStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, tenantId, status }) => {
      try {
        await setDoc(doc(db, 'service_calls', id), { status, updated_at: new Date().toISOString() }, { merge: true })
      } catch (e) {
        console.warn('Service call status update notice:', e)
      }

      const stored = JSON.parse(localStorage.getItem(`demo_service_calls_${tenantId}`) || '[]')
      const idx = stored.findIndex(x => x.id === id)
      if (idx >= 0) {
        stored[idx].status = status
        stored[idx].updated_at = new Date().toISOString()
        localStorage.setItem(`demo_service_calls_${tenantId}`, JSON.stringify(stored))
      }
      return { id, tenantId, status }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['service_calls', res.tenantId] })
    }
  })
}

// ════════════════════════════════════════════════════════
// SCENVY HOST: DEPARTMENTS, SERVICES, REQUESTS & SETTINGS
// ════════════════════════════════════════════════════════

export const DEFAULT_HOST_DEPARTMENTS = [
  { id: 'HOUSEKEEPING', name: 'Housekeeping', icon: 'Sparkles', enabled: true, color: '#8B5CF6' },
  { id: 'IN_ROOM_DINING', name: 'In-Room Dining', icon: 'Utensils', enabled: true, color: '#F97316' },
  { id: 'FNB', name: 'F&B & Bar', icon: 'Wine', enabled: true, color: '#EF4444' },
  { id: 'MAINTENANCE', name: 'Maintenance', icon: 'Wrench', enabled: true, color: '#3B82F6' },
  { id: 'LAUNDRY', name: 'Laundry', icon: 'Shirt', enabled: true, color: '#06B6D4' },
  { id: 'CONCIERGE', name: 'Concierge', icon: 'Compass', enabled: true, color: '#10B981' },
  { id: 'GUEST_SERVICES', name: 'Guest Services', icon: 'ConciergeBell', enabled: true, color: '#EC4899' },
  { id: 'OTHER', name: 'Other Services', icon: 'HelpCircle', enabled: true, color: '#6B7280' }
]

export const DEFAULT_HOST_SERVICES = [
  {
    id: 'srv_1',
    department: 'HOUSEKEEPING',
    category: 'Bad & Hygiene',
    name: 'Extra Handtücher (2er Set)',
    description: 'Frische, flauschige Baumwollhandtücher aufs Zimmer geliefert.',
    price: '0.00',
    currency: 'EUR',
    active: true,
    type: 'REQUEST',
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400'
  },
  {
    id: 'srv_2',
    department: 'HOUSEKEEPING',
    category: 'Bad & Hygiene',
    name: 'Zahnpflege Set',
    description: 'Einweg-Zahnbürste und Zahnpasta.',
    price: '0.00',
    currency: 'EUR',
    active: true,
    type: 'REQUEST',
    image: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=400'
  },
  {
    id: 'srv_3',
    department: 'HOUSEKEEPING',
    category: 'Zimmer-Komfort',
    name: 'Eiseimer & Gläser',
    description: 'Frisch gefüllter Eiseimer mit zwei Kristallgläsern.',
    price: '0.00',
    currency: 'EUR',
    active: true,
    type: 'REQUEST',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400'
  },
  {
    id: 'srv_4',
    department: 'IN_ROOM_DINING',
    category: 'Hauptgerichte',
    name: 'Scenvy Gourmet Club Sandwich',
    description: 'Gegrillte Hähnchenbrust, Bacon, Bio-Ei, Avocado und Trüffelmayo.',
    price: '18.50',
    currency: 'EUR',
    active: true,
    type: 'ORDER',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400'
  },
  {
    id: 'srv_5',
    department: 'IN_ROOM_DINING',
    category: 'Getränke',
    name: 'Aperol Spritz (0.2l)',
    description: 'Klassischer venezianischer Aperitif mit Prosecco und Frische-Orange.',
    price: '8.50',
    currency: 'EUR',
    active: true,
    type: 'ORDER',
    image: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=400'
  },
  {
    id: 'srv_6',
    department: 'MAINTENANCE',
    category: 'Technik',
    name: 'Klimaanlage Temperatur einstellen',
    description: 'Techniker überprüft und reguliert die Zimmertemperatur.',
    price: '0.00',
    currency: 'EUR',
    active: true,
    type: 'INCIDENT',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400'
  },
  {
    id: 'srv_7',
    department: 'LAUNDRY',
    category: 'Wäscheservice',
    name: 'Express Hemden Bügelservice',
    description: 'Bügeln innerhalb von 2 Stunden.',
    price: '6.00',
    currency: 'EUR',
    active: true,
    type: 'SERVICE',
    image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=400'
  },
  {
    id: 'srv_8',
    department: 'CONCIERGE',
    category: 'Transfers & Touren',
    name: 'Flughafen-Transfer (VIP Sedan)',
    description: 'Privater Chauffeurservice zum Flughafen.',
    price: '75.00',
    currency: 'EUR',
    active: true,
    type: 'SERVICE',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400'
  }
]

export function useHostDepartments(tenantId) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: ['host_departments', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      try {
        const ref = collection(db, 'host_departments')
        const q = query(ref, where('tenant_id', '==', tenantId))
        const snap = await getDocs(q)
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        if (docs.length > 0) return docs
      } catch (e) {
        console.warn('Host departments query notice:', e)
      }

      const stored = localStorage.getItem(`demo_host_departments_${tenantId}`)
      if (stored) return JSON.parse(stored)

      const defs = DEFAULT_HOST_DEPARTMENTS.map(d => ({ ...d, tenant_id: tenantId }))
      localStorage.setItem(`demo_host_departments_${tenantId}`, JSON.stringify(defs))
      return defs
    }
  })
}

export function useSaveHostDepartments() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ tenantId, departments }) => {
      try {
        for (const dept of departments) {
          const docId = `dept_${tenantId}_${dept.id}`
          await setDoc(doc(db, 'host_departments', docId), { ...dept, tenant_id: tenantId, updated_at: new Date().toISOString() }, { merge: true })
        }
      } catch (e) {
        console.warn('Save host departments notice:', e)
      }
      localStorage.setItem(`demo_host_departments_${tenantId}`, JSON.stringify(departments))
      return { tenantId, departments }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['host_departments', res.tenantId] })
    }
  })
}

export function useHostServices(tenantId) {
  return useQuery({
    queryKey: ['host_services', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      let firestoreItems = []
      try {
        const ref = collection(db, 'host_services')
        const q = query(ref, where('tenant_id', '==', tenantId))
        const snap = await getDocs(q)
        firestoreItems = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      } catch (e) {
        console.warn('Host services query notice:', e)
      }

      const stored = JSON.parse(localStorage.getItem(`demo_host_services_${tenantId}`) || '[]')
      const combined = [...firestoreItems]
      for (const s of stored) {
        if (!combined.some(i => i.id === s.id)) combined.push(s)
      }

      if (combined.length === 0) {
        const defs = DEFAULT_HOST_SERVICES.map(s => ({ ...s, tenant_id: tenantId }))
        localStorage.setItem(`demo_host_services_${tenantId}`, JSON.stringify(defs))
        return defs
      }

      return combined
    }
  })
}

export function useSaveHostService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ tenantId, service }) => {
      const payload = {
        ...service,
        id: service.id || `srv_${Date.now()}`,
        tenant_id: tenantId,
        updated_at: new Date().toISOString()
      }
      try {
        await setDoc(doc(db, 'host_services', payload.id), payload, { merge: true })
      } catch (e) {
        console.warn('Save host service notice:', e)
      }

      const stored = JSON.parse(localStorage.getItem(`demo_host_services_${tenantId}`) || '[]')
      const idx = stored.findIndex(x => x.id === payload.id)
      if (idx >= 0) stored[idx] = payload
      else stored.push(payload)
      localStorage.setItem(`demo_host_services_${tenantId}`, JSON.stringify(stored))
      return payload
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['host_services', data.tenant_id] })
    }
  })
}

export function useDeleteHostService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ tenantId, serviceId }) => {
      try {
        await deleteDoc(doc(db, 'host_services', serviceId))
      } catch (e) {
        console.warn('Delete host service notice:', e)
      }
      const stored = JSON.parse(localStorage.getItem(`demo_host_services_${tenantId}`) || '[]')
      const filtered = stored.filter(x => x.id !== serviceId)
      localStorage.setItem(`demo_host_services_${tenantId}`, JSON.stringify(filtered))
      return { tenantId, serviceId }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['host_services', res.tenantId] })
    }
  })
}

export function useImportHostServicesCSV() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ tenantId, items }) => {
      const prepared = items.map((item, idx) => ({
        id: item.id || `csv_srv_${Date.now()}_${idx}`,
        tenant_id: tenantId,
        department: (item.department || 'GUEST_SERVICES').toUpperCase(),
        category: item.category || 'Allgemein',
        name: item.name || 'Unbenannter Service',
        description: item.description || '',
        price: item.price ? String(item.price) : '0.00',
        currency: item.currency || 'EUR',
        active: item.active !== false && item.active !== 'false',
        type: (item.type || 'REQUEST').toUpperCase(),
        created_at: new Date().toISOString()
      }))

      for (const p of prepared) {
        try {
          await setDoc(doc(db, 'host_services', p.id), p, { merge: true })
        } catch (e) {
          console.warn('Import host service item notice:', e)
        }
      }

      const stored = JSON.parse(localStorage.getItem(`demo_host_services_${tenantId}`) || '[]')
      const merged = [...stored]
      for (const p of prepared) {
        const idx = merged.findIndex(x => x.id === p.id)
        if (idx >= 0) merged[idx] = p
        else merged.push(p)
      }
      localStorage.setItem(`demo_host_services_${tenantId}`, JSON.stringify(merged))

      return { tenantId, importedCount: prepared.length }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['host_services', res.tenantId] })
    }
  })
}

export function useHostRequests(tenantId) {
  return useQuery({
    queryKey: ['host_requests', tenantId],
    enabled: !!tenantId,
    refetchInterval: 3000, // Live 3s Polling
    queryFn: async () => {
      let firestoreRequests = []
      try {
        const ref = collection(db, 'host_requests')
        const q = query(ref, where('tenant_id', '==', tenantId))
        const snap = await getDocs(q)
        firestoreRequests = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      } catch (e) {
        console.warn('Host requests query notice:', e)
      }

      const stored = JSON.parse(localStorage.getItem(`demo_host_requests_${tenantId}`) || '[]')
      const combined = [...firestoreRequests]
      for (const s of stored) {
        if (!combined.some(i => i.id === s.id)) combined.push(s)
      }

      return combined.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    }
  })
}

export function useSubmitHostRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      tenantId,
      locationId,
      guestName,
      roomNumber,
      department,
      requestType,
      items,
      notes,
      totalPrice
    }) => {
      const timestamp = new Date().toISOString()
      const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      const payload = {
        id: reqId,
        tenant_id: tenantId || 'tenant-demo-1',
        location_id: locationId || 'loc1',
        guest_name: guestName || 'Anonymer Gast',
        room_number: roomNumber || '101',
        department: department || 'GUEST_SERVICES',
        request_type: requestType || 'REQUEST', // REQUEST | ORDER | SERVICE | INCIDENT | QUESTION
        status: 'NEW', // NEW -> ACCEPTED -> IN_PROGRESS -> ON_THE_WAY -> COMPLETED
        items: items || [],
        notes: notes || '',
        total_price: totalPrice || '0.00 €',
        created_at: timestamp,
        status_history: [
          { status: 'NEW', timestamp, note: 'Anfrage vom Gast über Web App eingegangen' }
        ],
        staff_assigned: null
      }

      try {
        await setDoc(doc(db, 'host_requests', reqId), payload)
      } catch (e) {
        console.warn('Save host request notice:', e)
      }

      const stored = JSON.parse(localStorage.getItem(`demo_host_requests_${payload.tenant_id}`) || '[]')
      stored.unshift(payload)
      localStorage.setItem(`demo_host_requests_${payload.tenant_id}`, JSON.stringify(stored))

      return payload
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['host_requests', data.tenant_id] })
    }
  })
}

export function useUpdateHostRequestStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, tenantId, status, note, staffName }) => {
      const timestamp = new Date().toISOString()
      const stored = JSON.parse(localStorage.getItem(`demo_host_requests_${tenantId}`) || '[]')
      const target = stored.find(x => x.id === id)

      const history = target?.status_history || []
      const newHistory = [...history, { status, timestamp, note: note || `Status auf ${status} geändert`, staff: staffName || null }]

      const updatePayload = {
        status,
        updated_at: timestamp,
        status_history: newHistory,
        ...(staffName ? { staff_assigned: staffName } : {})
      }

      try {
        await setDoc(doc(db, 'host_requests', id), updatePayload, { merge: true })
      } catch (e) {
        console.warn('Update host request status notice:', e)
      }

      if (target) {
        target.status = status
        target.updated_at = timestamp
        target.status_history = newHistory
        if (staffName) target.staff_assigned = staffName
        localStorage.setItem(`demo_host_requests_${tenantId}`, JSON.stringify(stored))
      }

      return { id, tenantId, status, updatePayload }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['host_requests', res.tenantId] })
    }
  })
}

export function useHotelSettings(tenantId) {
  return useQuery({
    queryKey: ['hotel_settings', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      try {
        const ref = doc(db, 'hotel_settings', tenantId)
        const snap = await getDoc(ref)
        if (snap.exists()) return snap.data()
      } catch (e) {
        console.warn('Hotel settings query notice:', e)
      }

      const stored = localStorage.getItem(`demo_hotel_settings_${tenantId}`)
      if (stored) return JSON.parse(stored)

      const defs = {
        hotel_name: 'Scenvy Grand Hotel & Resort',
        welcome_message: 'Herzlich Willkommen! Wie können wir Ihren Aufenthalt noch angenehmer gestalten?',
        wifi_ssid: 'Scenvy_Guest_5G',
        wifi_pass: 'welcome2026',
        checkout_time: '11:00 Uhr',
        breakfast_time: '06:30 - 10:30 Uhr',
        require_room_number: true,
        allow_custom_notes: true,
        primary_color: '#7C3AED',
        currency: 'EUR'
      }
      localStorage.setItem(`demo_hotel_settings_${tenantId}`, JSON.stringify(defs))
      return defs
    }
  })
}

export function useSaveHotelSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ tenantId, settings }) => {
      try {
        await setDoc(doc(db, 'hotel_settings', tenantId), { ...settings, updated_at: new Date().toISOString() }, { merge: true })
      } catch (e) {
        console.warn('Save hotel settings notice:', e)
      }
      localStorage.setItem(`demo_hotel_settings_${tenantId}`, JSON.stringify(settings))
      return { tenantId, settings }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['hotel_settings', res.tenantId] })
    }
  })
}

export const DEFAULT_HOST_STAFF = [
  { id: 'stf_1', name: 'Laura Schmidt', role: 'Head Concierge', department: 'CONCIERGE', email: 'l.schmidt@scenvy.de', phone: '+49 171 112233', status: 'ON_DUTY', shift: 'Frühschicht (07:00 - 15:30)' },
  { id: 'stf_2', name: 'Marco Rossi', role: 'Housekeeping Lead', department: 'HOUSEKEEPING', email: 'm.rossi@scenvy.de', phone: '+49 171 223344', status: 'ON_DUTY', shift: 'Spätschicht (14:00 - 22:30)' },
  { id: 'stf_3', name: 'Alexander Weber', role: 'F&B Manager', department: 'IN_ROOM_DINING', email: 'a.weber@scenvy.de', phone: '+49 171 334455', status: 'ON_DUTY', shift: 'Spätschicht (14:00 - 22:30)' },
  { id: 'stf_4', name: 'Thomas Müller', role: 'Chief Technician', department: 'MAINTENANCE', email: 't.mueller@scenvy.de', phone: '+49 171 445566', status: 'ON_BREAK', shift: 'Tagesschicht (08:00 - 17:00)' },
  { id: 'stf_5', name: 'Elena Popova', role: 'Guest Relations Manager', department: 'GUEST_SERVICES', email: 'e.popova@scenvy.de', phone: '+49 171 556677', status: 'ON_DUTY', shift: 'Frühschicht (07:00 - 15:30)' }
]

export function useHostStaff(tenantId) {
  return useQuery({
    queryKey: ['host_staff', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      try {
        const ref = collection(db, 'host_staff')
        const q = query(ref, where('tenant_id', '==', tenantId))
        const snap = await getDocs(q)
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        if (docs.length > 0) return docs
      } catch (e) {
        console.warn('Host staff query notice:', e)
      }

      const stored = localStorage.getItem(`demo_host_staff_${tenantId}`)
      if (stored) return JSON.parse(stored)

      const defs = DEFAULT_HOST_STAFF.map(s => ({ ...s, tenant_id: tenantId }))
      localStorage.setItem(`demo_host_staff_${tenantId}`, JSON.stringify(defs))
      return defs
    }
  })
}

export function useSaveHostStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ tenantId, staffMember }) => {
      const payload = {
        ...staffMember,
        id: staffMember.id || `stf_${Date.now()}`,
        tenant_id: tenantId,
        updated_at: new Date().toISOString()
      }
      try {
        await setDoc(doc(db, 'host_staff', payload.id), payload, { merge: true })
      } catch (e) {
        console.warn('Save host staff notice:', e)
      }
      const stored = JSON.parse(localStorage.getItem(`demo_host_staff_${tenantId}`) || '[]')
      const idx = stored.findIndex(x => x.id === payload.id)
      if (idx >= 0) stored[idx] = payload
      else stored.push(payload)
      localStorage.setItem(`demo_host_staff_${tenantId}`, JSON.stringify(stored))
      return payload
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['host_staff', data.tenant_id] })
    }
  })
}

export function useDeleteHostStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ tenantId, staffId }) => {
      try {
        await deleteDoc(doc(db, 'host_staff', staffId))
      } catch (e) {
        console.warn('Delete host staff notice:', e)
      }
      const stored = JSON.parse(localStorage.getItem(`demo_host_staff_${tenantId}`) || '[]')
      const filtered = stored.filter(x => x.id !== staffId)
      localStorage.setItem(`demo_host_staff_${tenantId}`, JSON.stringify(filtered))
      return { tenantId, staffId }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['host_staff', res.tenantId] })
    }
  })
}





