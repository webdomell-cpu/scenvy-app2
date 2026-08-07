import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tv, Film, Utensils, Settings, ExternalLink, ChevronDown, Sparkles, Building2, Shield, Globe } from 'lucide-react'
import { C } from '@/tokens'
import { getSsoLaunchUrl, launchSubdomainModule } from '@/lib/sso'

export function AppLauncherBar({ user, tenant, activePage, setPage }) {
  const nav = useNavigate()
  const [opening, setOpening] = useState(null)

  const modules = [
    {
      id: 'website_studio',
      key: 'website',
      name: 'WEBSTUDIO CMS',
      subdomain: 'app.scenvy.de/website-studio',
      sub: 'Landing Pages & Web-Editor',
      icon: <Globe size={15} color="#10B981" />,
      color: '#10B981',
      badge: 'CMS EDITOR'
    },
    {
      id: 'board',
      key: 'board',
      name: 'SCENVY BOARD',
      subdomain: 'board.scenvy.de',
      sub: 'Digital Signage TV',
      icon: <Tv size={15} color="#3B82F6" />,
      color: '#3B82F6',
      badge: 'DISPLAY'
    },
    {
      id: 'reels',
      key: 'flow',
      name: 'SCENVY FLOW',
      subdomain: 'flow.scenvy.de',
      sub: 'Reels & Video-Feed',
      icon: <Film size={15} color="#8B5CF6" />,
      color: '#8B5CF6',
      badge: 'REELS'
    },
    {
      id: 'menu_generator',
      key: 'menu',
      name: 'SCENVY MENU',
      subdomain: 'menu.scenvy.de',
      sub: 'Digitale Speisekarten',
      icon: <Utensils size={15} color="#F97316" />,
      color: '#F97316',
      badge: 'KI MENU'
    },
    {
      id: 'settings',
      key: 'settings',
      name: 'SETTINGS',
      subdomain: 'app.scenvy.de/settings',
      sub: 'Account & Tenant Settings',
      icon: <Settings size={15} color="#EC4899" />,
      color: '#EC4899',
      badge: 'ACCOUNT'
    }
  ]

  const handleLaunch = async (m, e) => {
    e.stopPropagation()
    if (m.id === 'website_studio') {
      nav('/website-studio')
      return
    }
    if (m.id === 'settings') {
      if (setPage) setPage('settings')
      else nav('/dashboard?page=settings')
      return
    }

    setOpening(m.id)
    try {
      await launchSubdomainModule(m.key, user, tenant, true)
    } catch (err) {
      console.warn('Launch error:', err)
      if (setPage) setPage(m.id)
    } finally {
      setTimeout(() => setOpening(null), 800)
    }
  }

  return (
    <div style={{
      background: '#0B0F19',
      borderBottom: `1px solid ${C.border}`,
      padding: '6px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      fontSize: 12,
      color: C.white,
      zIndex: 60,
      flexShrink: 0
    }}>
      {/* Left: Ecosystem Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
        <div style={{
          width: 20, height: 20, borderRadius: 6,
          background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10
        }}>
          ⚡
        </div>
        <span style={{ fontSize: 11, letterSpacing: 1, color: C.muted, fontWeight: 800 }}>
          SCENVY ECOSYSTEM HUB
        </span>
        <span style={{ color: C.dim }}>|</span>
        <span style={{ fontSize: 11, color: C.purple, fontWeight: 800 }}>
          app.scenvy.de
        </span>
      </div>

      {/* Center: Module App Switcher Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {modules.map(m => {
          const isActive = activePage === m.id || (activePage === 'menu' && m.id === 'menu_generator')
          return (
            <div
              key={m.id}
              onClick={() => {
                if (m.id === 'website_studio') nav('/website-studio')
                else if (m.id === 'settings' && setPage) setPage('settings')
                else if (setPage) setPage(m.id)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 8,
                background: isActive ? `${m.color}22` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? m.color : C.border}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {m.icon}
              <span style={{ fontWeight: 800, fontSize: 11, color: isActive ? C.white : C.muted }}>
                {m.name}
              </span>

              {m.id !== 'settings' && (
                <button
                  onClick={(e) => handleLaunch(m, e)}
                  title={`Mit SSO öffnen auf ${m.subdomain}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: m.color,
                    cursor: 'pointer',
                    padding: '2px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    borderRadius: 4,
                    fontSize: 9,
                    fontWeight: 700
                  }}
                >
                  {opening === m.id ? '⌛ SSO...' : <ExternalLink size={11} />}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Right: Tenant Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: C.muted }}>
        <Building2 size={13} color={C.purple} />
        <span style={{ color: C.white, fontWeight: 700 }}>
          {tenant?.name || 'Tenant'}
        </span>
        <span style={{
          fontSize: 9,
          padding: '2px 6px',
          borderRadius: 4,
          background: `${C.green}22`,
          color: C.green,
          fontWeight: 800,
          border: `1px solid ${C.green}44`
        }}>
          SSO READY
        </span>
      </div>
    </div>
  )
}
