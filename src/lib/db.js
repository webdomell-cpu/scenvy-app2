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

// ─── Helper: normalize DB reel → frontend reel ───────────
export const normalizeReel = (r) => ({
  ...r,
  locationId: r.location_id || r.locationId,
  ctaUrl:     r.cta_url    || r.ctaUrl || '',
  ctaAction:  r.cta_action || r.ctaAction || 'url',
  mediaUrl:   r.media_url  || r.mediaUrl || null,
  mediaType:  r.media_type || r.mediaType || 'image',
  loc:        r.locations?.name || r.loc || '',
  ago:        r.created_at || r.createdAt
    ? new Date(r.created_at || r.createdAt).toLocaleDateString('de-DE')
    : '',
})

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
        { id: 'dt-demo', tenant_id: tenantId, name: 'DT-Demo', city: 'Berlin', country: 'DE', active: true },
        { id: 'loc1', tenant_id: tenantId, name: 'Main Venue', city: 'Berlin', country: 'DE', active: true }
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
        address: location.address || '',
        zip: location.zip || '',
        city: location.city || 'Berlin',
        country: location.country || 'DE',
        active: location.active !== false,
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
      const mockTenants = [
        { id: 't-ocean', name: 'Ocean Beach Club', plan: 'pro', status: 'active', users: 12, modules: ['flow', 'menu'], joined: '2025-01-15' },
        { id: 't-marina', name: 'Marina Group', plan: 'enterprise', status: 'active', users: 45, modules: ['flow', 'menu', 'board', 'host'], joined: '2024-11-02' },
        { id: 't-cafe', name: 'Café Vienna', plan: 'starter', status: 'trial', users: 3, modules: ['flow'], joined: '2025-03-20' },
        { id: 't-alpine', name: 'Alpine Resort Hotel', plan: 'enterprise', status: 'active', users: 85, modules: ['flow', 'menu', 'board', 'host', 'link'], joined: '2024-05-12' },
        { id: 't-burger', name: 'Urban Burger Co', plan: 'pro', status: 'trial', users: 8, modules: ['menu'], joined: '2025-04-01' }
      ];
      try {
        const snap = await getDocs(collection(db, 'tenants'))
        let items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        if (items.length === 0) {
          for (const t of mockTenants) {
            await setDoc(doc(db, 'tenants', t.id), t).catch(() => {});
          }
          items = mockTenants;
        }
        return items
      } catch (e) {
        console.warn('Firestore tenants query notice, falling back to mock:', e)
        return mockTenants
      }
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
      return { id, ...updates }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
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
        if (snap.exists()) return snap.data()
      } catch (e) {
        console.warn('Firestore get tenant notice:', e)
      }

      const stored = localStorage.getItem(`demo_tenant_${tenantId}`)
      return stored ? JSON.parse(stored) : { id: tenantId, name: 'SCENVY Partner', plan: 'pro', status: 'active' }
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

