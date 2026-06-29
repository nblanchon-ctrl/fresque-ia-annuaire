'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

export default function ResetPasswordPage() {
  const { t } = useLanguage()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError(t('reset.tooShort')); return }
    if (password !== confirm) { setError(t('reset.mismatch')); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false) }
    else setSuccess(true)
  }

  if (success) {
    return (
      <div className="auth-wrap">
        <div className="auth-card card">
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 22 }}>✓</div>
            <h1 style={{ fontSize: 20 }}>{t('reset.successTitle')}</h1>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 14, textAlign: 'center', marginBottom: '1.25rem' }}>
            {t('reset.successBody')}
          </p>
          <a href="/" className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            {t('auth.login')}
          </a>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="auth-wrap">
        <div className="auth-card card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>{t('reset.checking')}</p>
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
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>{t('reset.title')}</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>{t('reset.subtitle')}</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('reset.newPassword')}</label>
            <input className="form-input" type="password" value={password}
              onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('reset.confirmPassword')}</label>
            <input className="form-input" type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)} required autoComplete="new-password" />
          </div>
          <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
            {loading ? '…' : t('reset.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
