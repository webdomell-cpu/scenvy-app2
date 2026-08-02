import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { C, grad } from '@/tokens'
import { ScenvyLogoFull } from '@/components/ScenvyLogo'
import { Eye, EyeOff } from 'lucide-react'

const F = ({ label, value, onChange, placeholder, type='text', onEnter }) => (
  <div style={{ marginBottom:14 }}>
    <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, letterSpacing:1 }}>{label}</label>
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type}
      onKeyDown={e=>e.key==='Enter'&&onEnter?.()}
      style={{ width:'100%', padding:'11px 14px', borderRadius:9, border:`1px solid ${C.border}`, background:C.bg, color:C.white, fontSize:13, outline:'none', fontFamily:'inherit' }}/>
  </div>
)

const FPw = ({ label, value, onChange, onEnter, hint }) => {
  const [show, setShow] = useState(false)
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, letterSpacing:1 }}>{label}</label>
      <div style={{ position:'relative' }}>
        <input value={value} onChange={e=>onChange(e.target.value)} placeholder="••••••••"
          type={show?'text':'password'} onKeyDown={e=>e.key==='Enter'&&onEnter?.()}
          style={{ width:'100%', padding:'11px 44px 11px 14px', borderRadius:9, border:`1px solid ${C.border}`, background:C.bg, color:C.white, fontSize:13, outline:'none', fontFamily:'inherit' }}/>
        <button onClick={()=>setShow(s=>!s)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:C.muted, cursor:'pointer' }}>
          {show?<EyeOff size={16}/>:<Eye size={16}/>}
        </button>
      </div>
      {hint&&<div style={{ fontSize:11, color:C.dim, marginTop:4 }}>{hint}</div>}
    </div>
  )
}

export default function ScenvyAuth() {
  const nav = useNavigate()
  const { login, loginWithGoogle, quickAdminLogin, signup, resetPassword } = useAuth()
  const p = new URLSearchParams(window.location.search)
  const [mode,    setMode]    = useState(p.get('mode')==='register'?'register':'login')
  const [email,   setEmail]   = useState('')
  const [pw,      setPw]      = useState('')
  const [pw2,     setPw2]     = useState('')
  const [name,    setName]    = useState('')
  const [venue,   setVenue]   = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const de = navigator.language?.startsWith('de')

  const doQuickAdmin = () => {
    quickAdminLogin('web.domell@gmail.com')
    nav('/admin')
  }

  const doGoogleLogin = async () => {
    setError(''); setLoading(true)
    const { user, error: e } = await loginWithGoogle()
    if (e || !user) {
      setError(e?.message || (de ? 'Google Anmeldung fehlgeschlagen.' : 'Google sign-in failed.'))
      setLoading(false)
    } else {
      nav(user?.role === 'admin' ? '/admin' : '/dashboard')
    }
  }

  const doLogin = async () => {
    setError(''); setLoading(true)
    const { user, error: e } = await login(email, pw)
    if (e || !user) {
      setError(de ? 'E-Mail oder Passwort falsch.' : 'Invalid email or password.')
      setLoading(false)
      return
    }
    nav(user?.role === 'admin' ? '/admin' : '/dashboard')
  }

  const doRegister = async () => {
    setError(''); setLoading(true)
    if (!name||!email||!pw) { setError(de?'Pflichtfelder ausfüllen.':'Fill required fields.'); setLoading(false); return }
    if (pw!==pw2)           { setError(de?'Passwörter stimmen nicht überein.':'Passwords do not match.'); setLoading(false); return }
    if (pw.length<8)        { setError(de?'Mindestens 8 Zeichen.':'Min. 8 characters.'); setLoading(false); return }

    const { user, error: e } = await signup(email, pw, name, venue)
    if (e) {
      setError(e.message || (de ? 'Registrierung fehlgeschlagen.' : 'Registration failed.'))
      setLoading(false)
      return
    }
    nav(user?.role === 'admin' ? '/admin' : '/dashboard')
  }

  const doReset = async () => {
    setError(''); setLoading(true)
    if (!email) {
      setError(de ? 'Bitte E-Mail-Adresse eingeben.' : 'Please enter your email address.')
      setLoading(false)
      return
    }
    const { error: e } = await resetPassword(email)
    if (e) {
      setError(e.message || (de ? 'Fehler beim Senden der E-Mail.' : 'Failed to send reset email.'))
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  const SubmitBtn = ({ onClick, label }) => (
    <button onClick={onClick} disabled={loading} style={{ width:'100%', padding:'13px 0', borderRadius:12, border:'none', cursor:loading?'wait':'pointer', background:loading?C.dim:grad(C.purple,C.pink), color:C.white, fontWeight:700, fontSize:15, fontFamily:'inherit', marginTop:6 }}>
      {loading?'...' : label}
    </button>
  )

  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter',sans-serif", position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:`radial-gradient(circle,${C.purple}33 0%,transparent 70%)`, top:'-10%', left:'-10%', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:`radial-gradient(circle,${C.pink}22 0%,transparent 70%)`, bottom:'-10%', right:'-10%', pointerEvents:'none' }}/>

      <div style={{ width:'100%', maxWidth:440, padding:'0 20px' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <ScenvyLogoFull height={58} style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize:13, color:C.muted, marginTop:6 }}>app.scenvy.de</div>
        </div>

        {sent ? (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:22, padding:32, textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>📧</div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>{de?'E-Mail gesendet!':'Email sent!'}</div>
            <div style={{ fontSize:14, color:C.muted, marginBottom:24 }}>
              {mode==='register' ? (de?'Bestätige deine E-Mail-Adresse.':'Confirm your email address.') : (de?'Prüfe deinen Posteingang.':'Check your inbox.')}
            </div>
            <button onClick={()=>{setSent(false);setMode('login')}} style={{ padding:'11px 28px', borderRadius:12, border:'none', background:grad(C.purple,C.pink), color:C.white, cursor:'pointer', fontWeight:700, fontSize:14, fontFamily:'inherit' }}>
              {de?'Zurück zum Login':'Back to Login'}
            </button>
          </div>
        ) : (
          <>
            {mode!=='forgot' && (
              <div style={{ display:'flex', background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:4, marginBottom:20 }}>
                {[['login',de?'Einloggen':'Sign In'],['register',de?'Registrieren':'Sign Up']].map(([m,label])=>(
                  <button key={m} onClick={()=>{setMode(m);setError('')}} style={{ flex:1, padding:'9px 0', borderRadius:9, border:'none', cursor:'pointer', background:mode===m?C.purple:'transparent', color:mode===m?C.white:C.muted, fontWeight:mode===m?700:400, fontSize:14, fontFamily:'inherit', transition:'all .2s' }}>{label}</button>
                ))}
              </div>
            )}

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:22, padding:28 }}>
              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={doGoogleLogin}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  background: '#FFFFFF',
                  color: '#1F2937',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  marginBottom: 10,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  fontFamily: 'inherit'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                {de ? 'Mit Google anmelden' : 'Sign in with Google'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', color: C.muted, fontSize: 12 }}>
                <div style={{ flex: 1, borderBottom: `1px solid ${C.border}` }}></div>
                <span style={{ padding: '0 10px', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 10, fontWeight: 700 }}>{de ? 'Oder mit E-Mail' : 'Or with Email'}</span>
                <div style={{ flex: 1, borderBottom: `1px solid ${C.border}` }}></div>
              </div>
              {mode==='forgot' && <div style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>{de?'Passwort zurücksetzen':'Reset Password'}</div>}

              {mode==='register' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <F label={de?'NAME *':'NAME *'} value={name} onChange={setName} placeholder="Max Mustermann"/>
                  <F label={de?'VENUE':'VENUE'} value={venue} onChange={setVenue} placeholder="Mein Restaurant"/>
                </div>
              )}

              <F label="E-MAIL *" value={email} onChange={setEmail} placeholder="deine@email.de" type="email" onEnter={mode==='login'?doLogin:mode==='forgot'?doReset:undefined}/>

              {mode!=='forgot' && <FPw label={de?'PASSWORT *':'PASSWORD *'} value={pw} onChange={setPw} onEnter={mode==='login'?doLogin:undefined} hint={mode==='register'?(de?'Mindestens 8 Zeichen':'Min. 8 characters'):undefined}/>}
              {mode==='register' && <FPw label={de?'PASSWORT WIEDERHOLEN *':'CONFIRM PASSWORD *'} value={pw2} onChange={setPw2}/>}

              {error && <div style={{ fontSize:13, color:C.pink, marginBottom:14, padding:'10px 14px', background:`${C.pink}18`, borderRadius:8 }}>{error}</div>}

              <SubmitBtn onClick={mode==='login'?doLogin:mode==='register'?doRegister:doReset}
                label={mode==='login'?(de?'Einloggen →':'Sign In →'):mode==='register'?(de?'Account erstellen →':'Create Account →'):(de?'Link senden →':'Send Link →')}/>

              <div style={{ textAlign:'center', marginTop:14 }}>
                {mode==='login' && <span onClick={()=>{setMode('forgot');setError('')}} style={{ fontSize:12, color:C.muted, cursor:'pointer' }}>{de?'Passwort vergessen?':'Forgot password?'}</span>}
                {mode==='forgot' && <span onClick={()=>{setMode('login');setError('')}} style={{ fontSize:13, color:C.purple, cursor:'pointer', fontWeight:600 }}>← {de?'Zurück':'Back'}</span>}
              </div>
            </div>
          </>
        )}

        <div style={{ textAlign:'center', marginTop:20 }}>
          <span onClick={()=>nav('/')} style={{ fontSize:13, color:C.muted, cursor:'pointer' }}>← {de?'Zur Startseite':'Homepage'}</span>
        </div>
      </div>
    </div>
  )
}
