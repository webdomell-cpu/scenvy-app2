// QR helpers & guest reel converters
export async function copyToClipboard(text) {
  try { await navigator.clipboard.writeText(text); return true } catch {
    const el = document.createElement('textarea')
    el.value = text; el.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(el); el.select()
    document.execCommand('copy'); document.body.removeChild(el); return true
  }
}
export function getGuestUrl(locationId) {
  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://app.scenvy.de'
  return `${origin}/l/${locationId}`
}

export async function downloadQR(locationId, locationName = 'Venue') {
  const targetUrl = getGuestUrl(locationId)
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(targetUrl)}&format=png&margin=30`
  try {
    const res = await fetch(url); const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `SCENVY-QR-${locationName.replace(/\s+/g,'-')}.png`
    a.click(); URL.revokeObjectURL(a.href)
  } catch { window.open(url,'_blank') }
}

export function qrImageUrl(locationId, size=200) {
  const targetUrl = getGuestUrl(locationId)
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(targetUrl)}&margin=10`
}
export function toGuestReel(r) {
  const hookMap={offer:'JETZT SICHERN 🔥',event:'HEUTE ABEND ✨',menu:'NEU AUF DER KARTE 🍽️',promo:'SONDERAKTION ⚡'}
  const bgMap={'#7C3AED':'linear-gradient(160deg,#1a0533 0%,#3d1168 55%,#0d0d14 100%)','#FF2D8D':'linear-gradient(160deg,#33001a 0%,#680d3d 55%,#0d0d14 100%)','#00D4FF':'linear-gradient(160deg,#071433 0%,#163a68 55%,#0d0d14 100%)','#FF9500':'linear-gradient(160deg,#1a1400 0%,#3d3200 55%,#0d0d14 100%)','#00E676':'linear-gradient(160deg,#001a0d 0%,#003d1a 55%,#0d0d14 100%)'}
  return { id:r.id, hook:hookMap[r.type]||'ENTDECKE MEHR ✨', title:r.title, sub:r.loc||r.locations?.name||'', cta:r.cta||'Mehr', ctaUrl:r.cta_url||r.ctaUrl||'', bg:bgMap[r.color]||bgMap['#7C3AED'], accent:r.color||'#7C3AED', tag:(r.type||'offer').toUpperCase(), emoji:r.emoji||'✨', mediaUrl:r.media_url||r.mediaUrl||null, mediaType:r.media_type||r.mediaType||'image', duration: Number(r.duration) || 5 }
}
