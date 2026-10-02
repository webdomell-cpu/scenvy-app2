// Utility for detecting mobile/tablet devices and PWA standalone modes

export function isMobileOrTabletDevice() {
  if (typeof window === 'undefined') return false

  // 1. If PWA standalone mode is active, prefer mobile app view
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  if (isStandalone) return true

  // 2. User preference override
  try {
    const forceDesktop = localStorage.getItem('scenvy_force_desktop')
    if (forceDesktop === 'true') return false
    const preferredView = localStorage.getItem('scenvy_preferred_view')
    if (preferredView === 'mobile') return true
    if (preferredView === 'desktop') return false
  } catch (e) {}

  // 3. User agent check
  const ua = navigator.userAgent || navigator.vendor || window.opera || ''
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua)
  
  // 4. Screen width threshold (tablet / smartphone)
  const isSmallScreen = window.innerWidth <= 840

  return isMobileUA || isSmallScreen
}

export function setPreferredViewMode(mode) {
  try {
    if (mode === 'desktop') {
      localStorage.setItem('scenvy_force_desktop', 'true')
      localStorage.setItem('scenvy_preferred_view', 'desktop')
    } else {
      localStorage.removeItem('scenvy_force_desktop')
      localStorage.setItem('scenvy_preferred_view', 'mobile')
    }
  } catch (e) {}
}
