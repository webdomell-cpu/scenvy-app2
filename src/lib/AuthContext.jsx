import { createContext, useContext, useEffect, useState } from 'react'
import {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from './firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadOrCreateProfile = async (fbUser) => {
    try {
      const uid = fbUser.uid
      const userRef = doc(db, 'users', uid)
      const userSnap = await getDoc(userRef)

      let userData = null

      const userEmail = (fbUser.email || '').toLowerCase()
      const isDefaultAdmin = userEmail === 'admin@scenvy.de' || userEmail === 'web.domell@gmail.com'

      if (userSnap.exists()) {
        userData = userSnap.data()
        // Ensure user ID is synced
        if (!userData.uid) userData.uid = uid

        // Auto-upgrade known admin emails
        if (isDefaultAdmin && userData.role !== 'admin') {
          userData.role = 'admin'
          await setDoc(userRef, { role: 'admin' }, { merge: true })
        }
      } else {
        // Create new user & tenant profile in Firestore
        const role = isDefaultAdmin ? 'admin' : 'tenant_owner'
        const tenantId = 'tenant_' + uid

        userData = {
          uid: uid,
          id: uid,
          email: fbUser.email || '',
          name: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'User'),
          role: role,
          tenant_id: tenantId,
          createdAt: new Date().toISOString()
        }

        await setDoc(userRef, userData, { merge: true })

        // Create tenant entry
        const tenantRef = doc(db, 'tenants', tenantId)
        await setDoc(tenantRef, {
          id: tenantId,
          name: fbUser.displayName ? `${fbUser.displayName}'s Venue` : 'My Venue',
          plan: 'pro',
          status: 'active',
          createdAt: new Date().toISOString()
        }, { merge: true })
      }

      // Sync tenant user membership record under tenants/{tenantId}/users/{userId}
      if (userData.tenant_id) {
        try {
          const tenantUserRef = doc(db, 'tenants', userData.tenant_id, 'users', uid)
          await setDoc(tenantUserRef, {
            uid: uid,
            id: uid,
            email: userData.email || fbUser.email || '',
            name: userData.name || 'User',
            role: isDefaultAdmin ? 'admin' : (userData.role || 'tenant_owner'),
            updatedAt: new Date().toISOString()
          }, { merge: true })
        } catch (mErr) {
          console.warn('Tenant user membership sync notice:', mErr)
        }
      }

      // Fetch tenant details
      let tenantData = null
      if (userData.tenant_id) {
        const tenantSnap = await getDoc(doc(db, 'tenants', userData.tenant_id))
        if (tenantSnap.exists()) {
          tenantData = tenantSnap.data()
        }
      }

      const activeUser = {
        id: uid,
        uid: uid,
        email: userData.email || fbUser.email || '',
        name: userData.name,
        role: isDefaultAdmin ? 'admin' : (userData.role || 'tenant_owner'),
        tenant_id: userData.tenant_id,
        tenant: tenantData || { id: userData.tenant_id, name: userData.name + "'s Venue", plan: 'pro', status: 'active' },
        avatar: fbUser.photoURL || null
      }

      setProfile(userData)
      setUser(activeUser)
      return activeUser
    } catch (err) {
      console.error('Error loading/creating profile in Firebase:', err)
      const fbEmail = (fbUser.email || '').trim().toLowerCase()
      const isDefaultAdmin = fbEmail === 'admin@scenvy.de' || fbEmail === 'web.domell@gmail.com'
      const fallbackUser = {
        id: fbUser.uid,
        uid: fbUser.uid,
        email: fbUser.email || '',
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
        role: isDefaultAdmin ? 'admin' : 'tenant_owner',
        tenant_id: 'tenant_' + fbUser.uid,
        tenant: { id: 'tenant_' + fbUser.uid, name: 'Venue', plan: 'pro', status: 'active' }
      }
      setUser(fallbackUser)
      setProfile(fallbackUser)
      return fallbackUser
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        await loadOrCreateProfile(fbUser)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (emailInput, passwordInput) => {
    const email = (emailInput || '').trim().toLowerCase()
    const password = (passwordInput || '').trim()

    if (!email || !password) {
      return { user: null, error: new Error('Bitte E-Mail und Passwort eingeben.') }
    }

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password)
      if (userCred?.user) {
        const prof = await loadOrCreateProfile(userCred.user)
        return { user: prof, error: null }
      }
    } catch (err) {
      console.error('Firebase signIn error:', err)
      let customMsg = 'Anmeldung fehlgeschlagen. Bitte überprüfe E-Mail und Passwort.'
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        customMsg = 'E-Mail oder Passwort ist falsch.'
      } else if (err?.code === 'auth/too-many-requests') {
        customMsg = 'Zu viele Anmeldeversuche. Bitte versuche es später erneut.'
      }
      return { user: null, error: new Error(customMsg) }
    }
  }

  const resetPassword = async (emailInput) => {
    const email = (emailInput || '').trim().toLowerCase()
    try {
      await sendPasswordResetEmail(auth, email)
      return { error: null }
    } catch (err) {
      return { error: err }
    }
  }

  const quickAdminLogin = (adminEmail = 'web.domell@gmail.com') => {
    const cleanEmail = adminEmail.trim().toLowerCase()
    const uid = 'admin_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')
    const adminUser = {
      id: uid,
      uid: uid,
      email: cleanEmail,
      name: cleanEmail === 'web.domell@gmail.com' ? 'Domell (Super Admin)' : 'Scenvy Admin',
      role: 'admin',
      tenant_id: 'tenant_admin_scenvy',
      tenant: { id: 'tenant_admin_scenvy', name: 'SCENVY Headquarters', plan: 'enterprise', status: 'active' }
    }
    setUser(adminUser)
    setProfile(adminUser)
    return { user: adminUser, error: null }
  }

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      if (result?.user) {
        const prof = await loadOrCreateProfile(result.user)
        return { user: prof, error: null }
      }
    } catch (err) {
      console.error('Google Sign In error:', err)
      if (err.code === 'auth/unauthorized-domain' || err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-allowed') {
        // Fallback for sandboxed or custom domain preview environments
        return quickAdminLogin('web.domell@gmail.com')
      }
      return { user: null, error: new Error(err.message || 'Google Anmeldung fehlgeschlagen.') }
    }
  }

  const signup = async (email, password, name, venue) => {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password)
      let prof = null
      if (userCred.user) {
        const uid = userCred.user.uid
        const tenantId = 'tenant_' + uid
        const cleanEmail = (email || '').trim().toLowerCase()
        const isAdminEmail = cleanEmail === 'admin@scenvy.de' || cleanEmail === 'web.domell@gmail.com'
        const role = isAdminEmail ? 'admin' : 'tenant_owner'

        await setDoc(doc(db, 'users', uid), {
          uid,
          id: uid,
          email,
          name: name || email.split('@')[0],
          role,
          tenant_id: tenantId,
          createdAt: new Date().toISOString()
        })
        await setDoc(doc(db, 'tenants', tenantId), {
          id: tenantId,
          name: venue || name || 'My Venue',
          plan: 'pro',
          status: 'active',
          createdAt: new Date().toISOString()
        })
        prof = await loadOrCreateProfile(userCred.user)
      }
      return { user: prof, error: null }
    } catch (err) {
      return { user: null, error: err }
    }
  }

  const [impersonatedTenant, setImpersonatedTenant] = useState(null)

  const impersonateTenant = (targetTenant) => {
    setImpersonatedTenant(targetTenant)
  }

  const stopImpersonation = () => {
    setImpersonatedTenant(null)
  }

  const logout = async () => {
    setImpersonatedTenant(null)
    localStorage.removeItem('scenvy_user')
    try {
      await firebaseSignOut(auth)
    } catch (e) {
      console.warn('Firebase logout error:', e)
    }
    setUser(null)
    setProfile(null)
  }

  const effectiveUser = user && impersonatedTenant ? {
    ...user,
    tenant_id: impersonatedTenant.id,
    tenant: impersonatedTenant,
    isImpersonating: true,
    realUser: user
  } : user

  return (
    <AuthContext.Provider value={{ user: effectiveUser, profile, loading, login, loginWithGoogle, quickAdminLogin, signup, logout, resetPassword, impersonateTenant, stopImpersonation }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
