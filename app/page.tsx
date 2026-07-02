'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

export default function HomePage() {
  const { t } = useLanguage()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) window.location.href = '/annuaire'
      else setChecking(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(t('auth.loginError')); setLoading(false) }
      else window.location.href = '/annuaire'
    } else {
      if (password.length < 8) { setError(t('auth.passwordTooShort')); setLoading(false); return }
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { nom } } })
      if (error) { setError(error.message); setLoading(false) }
      else setSuccess(true)
    }
  }

  if (checking) return null

  if (success) {
    return (
      <div className="auth-wrap">
        <div className="auth-card card">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <LanguageSwitch />
          </div>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <h1 style={{ fontSize: 20 }}>{t('auth.checkEmail')}</h1>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 14, textAlign: 'center' }}>
            {t('auth.confirmationSent')} <strong>{email}</strong>.
          </p>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem' }}
            onClick={() => { setSuccess(false); setMode('login') }}>
            {t('auth.backToLogin')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <LanguageSwitch />
        </div>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>{t('auth.brand')}</div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>
            {mode === 'login' ? t('auth.loginEspace') : t('auth.register')}
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>
            {mode === 'login' ? t('auth.loginEspaceSubtitle') : t('auth.registerSubtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: 3, marginBottom: '1.25rem', gap: 3 }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }}
              style={{ flex: 1, padding: '7px', borderRadius: 'calc(var(--radius) - 2px)', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 13, transition: 'all .15s',
                background: mode === m ? 'var(--bg)' : 'transparent',
                color: mode === m ? 'var(--text)' : 'var(--text2)' }}>
              {m === 'login' ? t('auth.loginTab') : t('auth.registerTab')}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">{t('auth.fullName')}</label>
              <input className="form-input" type="text" value={nom}
                onChange={e => setNom(e.target.value)} required placeholder="Marie Dupont" />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">{t('auth.email')}</label>
            <input className="form-input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('auth.password')}{mode === 'register' && t('auth.passwordMin')}</label>
            <input className="form-input" type="password" value={password}
              onChange={e => setPassword(e.target.value)} required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </div>
          <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
            {loading ? '…' : mode === 'login' ? t('auth.submitLogin') : t('auth.submitRegister')}
          </button>
          {mode === 'login' && (
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <a href="/forgot-password" style={{ fontSize: 13, color: 'var(--accent)' }}>
                {t('auth.forgotPassword')}
              </a>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
