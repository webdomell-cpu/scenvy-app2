import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tv, Film, Utensils, ConciergeBell, ExternalLink, Building2 } from 'lucide-react'
import { C } from '@/tokens'
import { launchSubdomainModule } from '@/lib/sso'

export function AppLauncherBar({ user, tenant, activePage, setPage }) {
  const nav = useNavigate()
  const [opening, setOpening] = useState(null)

  const modules = [
    {
      id: 'reels',
      key: 'flow',
      name: 'SCENVY FLOW',
      subdomain: 'flow.scenvy.de',
      sub: 'Reels & Video-Feed',
      icon: <Film size={15} color="#8B5CF6" />,
      color: '#8B5CF6'
    },
    {
      id: 'menu_generator',
      key: 'menu',
      name: 'SCENVY MENU',
      subdomain: 'menu.scenvy.de',
      sub: 'Digitale Speisekarten',
      icon: <Utensils size={15} color="#F97316" />,
      color: '#F97316'
    },
    {
      id: 'board',
      key: 'board',
      name: 'SCENVY BOARD',
      subdomain: 'board.scenvy.de',
      sub: 'Digital Signage TV',
      icon: <Tv size={15} color="#3B82F6" />,
      color: '#3B82F6'
    },
    {
      id: 'host',
      key: 'host',
      name: 'SCENVY HOST',
      subdomain: 'host.scenvy.de',
      sub: 'Gäste-Concierge',
      icon: <ConciergeBell size={15} color="#10B981" />,
      color: '#10B981'
    }
  ]

  const handleLaunch = async (m, e) => {
    e.stopPropagation()
    setOpening(m.id)
    if (setPage) setPage(m.id)
    try {
      await launchSubdomainModule(m.key, user, tenant, true)
    } catch (err) {
      console.warn('Launch notice:', err)
    } finally {
      setTimeout(() => setOpening(null), 600)
    }
  }

  return (
    <div style={{
      background: '#0B0F19',
      borderBottom: `1px solid ${C.border}`,
      padding: '8px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      fontSize: 12,
      color: C.white,
      zIndex: 60,
      flexShrink: 0
    }}>
      {/* Left: Module App Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {modules.map(m => {
          const isActive = activePage === m.id || (activePage === 'menu' && m.id === 'menu_generator')
          return (
            <div
              key={m.id}
              onClick={() => {
                if (setPage) setPage(m.id)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '5px 12px',
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

              <button
                onClick={(e) => handleLaunch(m, e)}
                title={`Subdomain öffnen: ${m.subdomain}`}
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
            </div>
          )
        })}
      </div>

      {/* Right: Tenant Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: C.muted }}>
        <Building2 size={13} color={C.purple} />
        <span style={{ color: C.white, fontWeight: 700 }}>
          {tenant?.name || user?.tenant?.name || 'Scenvy Partner'}
        </span>
      </div>
    </div>
  )
}
