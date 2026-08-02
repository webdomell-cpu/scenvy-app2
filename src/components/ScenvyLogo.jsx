import React from 'react'
import scenvyFullImg from '@/assets/images/scenvy_full_png_1784963885587.jpg'
import scenvyIconImg from '@/assets/images/scenvy_icon_png_1784963861269.jpg'
import scenvyBadgeImg from '@/assets/images/scenvy_badge_png_1784963873616.jpg'

/**
 * SCENVY Iconic Icon Logo (from official image asset)
 */
export function ScenvyLogoIcon({ size = 32, className = '', style = {} }) {
  const [error, setError] = React.useState(false)

  if (error) {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      >
        <defs>
          <linearGradient id="scenvySGradFallback" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        <path 
          d="M 60 26 C 60 17, 46 15, 36 15 C 22 15, 16 26, 16 36 C 16 52, 60 48, 60 66 C 60 82, 44 85, 32 85 C 18 85, 12 74, 12 66" 
          stroke="url(#scenvySGradFallback)" 
          strokeWidth="14" 
          strokeLinecap="round" 
          fill="none" 
        />
        <rect x="66" y="23" width="16" height="5" rx="2.5" fill="#3B82F6" opacity="0.9" />
        <rect x="68" y="33" width="24" height="5" rx="2.5" fill="#6366F1" opacity="0.95" />
        <rect x="66" y="43" width="18" height="5" rx="2.5" fill="#8B5CF6" opacity="0.9" />
        <rect x="70" y="53" width="12" height="5" rx="2.5" fill="#A78BFA" opacity="0.8" />
      </svg>
    )
  }

  return (
    <img 
      src={scenvyIconImg || '/scenvy-icon.png'} 
      alt="SCENVY" 
      onError={() => setError(true)}
      style={{ 
        height: size, 
        width: size, 
        objectFit: 'contain', 
        display: 'inline-block', 
        verticalAlign: 'middle', 
        flexShrink: 0,
        borderRadius: size > 40 ? 12 : 6,
        mixBlendMode: 'screen',
        filter: 'contrast(1.1) brightness(1.15)',
        ...style 
      }}
      className={className} 
    />
  )
}

/**
 * SCENVY Full Horizontal Logo with optional tagline (from official image asset)
 */
export function ScenvyLogoFull({ height = 36, tagline = false, className = '', style = {} }) {
  const [error, setError] = React.useState(false)

  if (error) {
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0, ...style }} className={className}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: height * 0.28 }}>
          <ScenvyLogoIcon size={height} />
          <span style={{ 
            fontSize: height * 0.68, 
            fontWeight: 900, 
            letterSpacing: '0.08em', 
            color: '#FFFFFF',
            fontFamily: "'Inter', sans-serif"
          }}>
            SCENV<span style={{ color: '#8B5CF6' }}>Y</span>
          </span>
        </div>
        {tagline && (
          <span style={{ 
            fontSize: Math.max(8, height * 0.22), 
            fontWeight: 700, 
            letterSpacing: '0.22em', 
            color: '#94A3B8', 
            marginTop: 2,
            paddingLeft: height * 0.05
          }}>
            CONNECT. ENGAGE. ELEVATE.
          </span>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0, ...style }} className={className}>
      <img 
        src={scenvyFullImg || '/scenvy-full.png'} 
        alt="SCENVY" 
        onError={() => setError(true)}
        style={{ 
          height: height, 
          width: 'auto', 
          objectFit: 'contain', 
          display: 'block',
          mixBlendMode: 'screen',
          filter: 'contrast(1.15) brightness(1.2)',
        }} 
      />
      {tagline && (
        <span style={{ 
          fontSize: Math.max(8, height * 0.22), 
          fontWeight: 700, 
          letterSpacing: '0.22em', 
          color: '#94A3B8', 
          marginTop: 4,
          paddingLeft: 2
        }}>
          CONNECT. ENGAGE. ELEVATE.
        </span>
      )}
    </div>
  )
}

/**
 * SCENVY Circular Emblem Badge Logo (from official image asset)
 */
export function ScenvyLogoBadge({ size = 160, className = '', style = {} }) {
  const [error, setError] = React.useState(false)

  if (error) {
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          borderRadius: '50%', 
          background: '#0F172A', 
          border: '3px solid #8B5CF6', 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0,
          ...style 
        }} 
        className={className}
      >
        <ScenvyLogoIcon size={size * 0.5} />
      </div>
    )
  }

  return (
    <img 
      src={scenvyBadgeImg || '/scenvy-badge.png'} 
      alt="SCENVY Badge" 
      onError={() => setError(true)}
      style={{ 
        width: size, 
        height: size, 
        objectFit: 'contain', 
        display: 'inline-block', 
        verticalAlign: 'middle', 
        flexShrink: 0,
        mixBlendMode: 'screen',
        filter: 'contrast(1.1) brightness(1.1)',
        ...style 
      }}
      className={className}
    />
  )
}



