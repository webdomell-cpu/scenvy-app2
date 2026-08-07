import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider }                    from '@tanstack/react-query'
import { queryClient }                            from '@/lib/query-client'
import { AuthProvider, useAuth }                  from '@/lib/AuthContext'
import { ErrorBoundary }                          from '@/components/ErrorBoundary'
import Landing     from './pages/Landing.jsx'
import ScenvyAuth  from './pages/ScenvyAuth.jsx'
import GuestView   from './pages/GuestView.jsx'
import Dashboard   from './pages/Dashboard.jsx'
import Admin       from './pages/Admin.jsx'
import MenuGenerator from './pages/MenuGenerator.jsx'
import GuestMenuReel from './pages/GuestMenuReel.jsx'
import MenuAddonShowcase from './pages/MenuAddonShowcase.jsx'
import ReelsAddonShowcase from './pages/ReelsAddonShowcase.jsx'
import StyleGuide from './pages/StyleGuide.jsx'
import WebsiteStudio from './pages/WebsiteStudio.jsx'
import PublicCustomPage from './pages/PublicCustomPage.jsx'

// ─── Route guards ────────────────────────────────────────
function Protected({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user)   return <Navigate to="/auth" replace />

  const userEmail = (user.email || '').toLowerCase()
  const isAdmin = user.role === 'admin' || user.role === 'superadmin' || userEmail === 'admin@scenvy.de' || userEmail === 'web.domell@gmail.com' || userEmail === 'web.domain@gmail.com'

  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (user) {
    const userEmail = (user.email || '').toLowerCase()
    const isAdmin = user.role === 'admin' || user.role === 'superadmin' || userEmail === 'admin@scenvy.de' || userEmail === 'web.domell@gmail.com'
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
  }
  return children
}

function Spinner() {
  return (
    <div style={{ height:'100vh', background:'#0D0D14', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid #7C3AED', borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ─── Router ──────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      <Route path="/"              element={<PublicOnly><ScenvyAuth /></PublicOnly>} />
      <Route path="/landing"       element={<Landing />} />
      <Route path="/style-guide"    element={<StyleGuide />} />
      <Route path="/reels-addon"    element={<ReelsAddonShowcase />} />
      <Route path="/menu-addon"     element={<MenuAddonShowcase />} />
      <Route path="/add-ons/menu-reel" element={<MenuAddonShowcase />} />
      <Route path="/auth"          element={<PublicOnly><ScenvyAuth /></PublicOnly>} />
      <Route path="/auth/login"    element={<PublicOnly><ScenvyAuth /></PublicOnly>} />
      <Route path="/auth/register" element={<PublicOnly><ScenvyAuth /></PublicOnly>} />
      <Route path="/l/:locationId" element={<GuestView />} />
      <Route path="/r/:locationId" element={<GuestView />} />
      <Route path="/reel/:locationId" element={<GuestView />} />
      <Route path="/reels/:locationId" element={<GuestView />} />
      <Route path="/m/:menuId"     element={<GuestMenuReel />} />
      <Route path="/menu/:menuId"  element={<GuestMenuReel />} />
      <Route path="/menu-reel/:menuId" element={<GuestMenuReel />} />
      <Route path="/p/:slug"       element={<PublicCustomPage />} />
      <Route path="/pages/:slug"   element={<PublicCustomPage />} />
      <Route path="/dashboard"     element={<Protected><Dashboard /></Protected>} />
      <Route path="/website-studio" element={<Protected><WebsiteStudio /></Protected>} />
      <Route path="/menu-generator" element={<Protected><MenuGenerator /></Protected>} />
      <Route path="/admin"         element={<Protected adminOnly><Admin /></Protected>} />
      <Route path="*"              element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  )
}
