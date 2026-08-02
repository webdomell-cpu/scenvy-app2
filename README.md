# SCENVY — Full Platform v2.0
**app.scenvy.de**

## Was ist drin

| Seite | URL | Beschreibung |
|-------|-----|-------------|
| Landing Page | `/` | Marketing-Seite, zweisprachig DE/EN |
| Login / Register | `/login` | Einloggen + neuen Account erstellen |
| Guest Reel Experience | `/l/:id` | TikTok-style Reel Viewer |
| CMS Dashboard | `/dashboard` | Reel-Verwaltung, Upload, Analytics |
| Super Admin | `/admin` | Alle Tenants, MRR, Feature-Flags |

## Demo-Zugänge
| Email | Passwort | Rolle |
|-------|----------|-------|
| admin@scenvy.de | admin123 | Super Admin |
| venue@scenvy.de | venue123 | Tenant CMS |

## API Endpoints
| Methode | URL | Beschreibung |
|---------|-----|-------------|
| GET/POST | /api/reels | Reels lesen/erstellen |
| PUT/DELETE | /api/reels | Reel aktualisieren/löschen |
| GET/POST | /api/locations | Standorte |
| GET/POST | /api/tenants | Tenants (Admin) |
| GET | /api/analytics | Analytics-Daten |
| POST | /api/ai/generate | Claude KI-Reel-Generator |

## Deploy zu Vercel

```bash
# ZIP entpacken
unzip scenvy-full.zip
cd scenvy-full

# Dependencies installieren
npm install

# Lokal testen
npm run dev

# Deployen
npm install -g vercel
vercel
```

## KI-Generator aktivieren
1. API-Key holen: console.anthropic.com
2. Vercel Dashboard → Projekt → Settings → Environment Variables
3. `ANTHROPIC_API_KEY` = dein Key
4. Redeploy

## Neue Features in v2.0
- ✅ Zweisprachige Landing Page (DE/EN) mit Flaggen-Umschalter
- ✅ Echte Bilder in animierten Phone-Mockups
- ✅ Registrierung funktioniert ("Kostenlos starten")
- ✅ Demo-Zugangsdaten auf Login-Seite versteckt
- ✅ Foto/Video Upload für Reels
- ✅ CTA-Link & Aktion pro Reel konfigurierbar
- ✅ KI-Generator: Bild hochladen + beschreiben
- ✅ Reel-Vorschau vor dem Speichern

## Nächste Schritte für Produktion
- [ ] Echte Datenbank: Supabase (kostenlos) oder PlanetScale
- [ ] Media-Speicher: Cloudflare Stream oder AWS S3
- [ ] Echte Auth: Clerk oder Supabase Auth
- [ ] Domain in Vercel Settings: app.scenvy.de
- [ ] ANTHROPIC_API_KEY in Vercel Environment Variables

---
Built with React + Vite + Vercel · app.scenvy.de
