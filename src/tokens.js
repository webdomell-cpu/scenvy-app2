export const darkTheme = {
  bg: '#0A0D14',
  card: '#111622',
  card2: '#182030',
  cardHover: '#1F293D',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.15)',
  flow: '#8B5CF6',
  purple: '#8B5CF6',
  purpleL: '#A78BFA',
  pink: '#EC4899',
  menu: '#F97316',
  orange: '#F97316',
  board: '#3B82F6',
  blue: '#3B82F6',
  host: '#10B981',
  green: '#10B981',
  store: '#EC4899',
  link: '#06B6D4',
  magic: '#F59E0B',
  white: '#F8FAFC',
  muted: '#94A3B8',
  dim: '#64748B',
}

export const lightTheme = {
  bg: '#F4F6FA',
  card: '#FFFFFF',
  card2: '#EBF0F7',
  cardHover: '#E1E8F2',
  border: 'rgba(15, 23, 42, 0.08)',
  borderLight: 'rgba(15, 23, 42, 0.15)',
  flow: '#7C3AED',
  purple: '#7C3AED',
  purpleL: '#8B5CF6',
  pink: '#DB2777',
  menu: '#EA580C',
  orange: '#EA580C',
  board: '#2563EB',
  blue: '#2563EB',
  host: '#059669',
  green: '#059669',
  store: '#DB2777',
  link: '#0891B2',
  magic: '#D97706',
  white: '#0F172A',
  muted: '#475569',
  dim: '#64748B',
}

export const C = { ...darkTheme }

export function applyTheme(mode) {
  const isLight = mode === 'light'
  const target = isLight ? lightTheme : darkTheme
  Object.assign(C, target)
  if (typeof window !== 'undefined') {
    localStorage.setItem('scenvy_theme', mode)
    document.documentElement.classList.toggle('light-theme', isLight)
    document.documentElement.style.colorScheme = mode
    document.body.style.backgroundColor = C.bg
    document.body.style.color = C.white
  }
}

// Initial theme load
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('scenvy_theme')
  if (saved === 'light') {
    applyTheme('light')
  }
}

export const SG_TOKENS = {
  bgPrimary: '#0B0F14',
  bgSecondary: '#121821',
  textPrimary: '#FFFFFF',
  textMuted: '#A0A8B8',
  borderSoft: 'rgba(255,255,255,0.08)',
  gradPrimary: 'linear-gradient(135deg, #4F8CFF 0%, #7A5CFF 100%)',
  gradAccent: 'linear-gradient(135deg, #FF4FD8 0%, #FF8A4F 100%)',
}

export const grad  = (a,b) => `linear-gradient(135deg,${a},${b})`
export const gradV = (a,b) => `linear-gradient(180deg,${a},${b})`

export const moduleColors = {
  flow: '#8B5CF6',
  menu: '#F97316',
  board: '#3B82F6',
  host: '#10B981',
  store: '#EC4899',
  link: '#06B6D4',
  magic: '#F59E0B'
}

export const tokens = {
  bg: '#0B0F14',
  card: '#121821',
  cardHover: '#1A2230',
  accent: '#7A5CFF',
  accentPink: '#FF4FD8',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.15)',
  text: '#FFFFFF',
  textMuted: '#A0A8B8',
  textSubtle: '#64748B',
  radius: '16px',
}

