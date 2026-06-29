'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

export default function ForgotPasswordPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) { setError(error.message); setLoading(false) }
    else setSuccess(true)
  }

  if (success) {
    return (
      <div className="auth-wrap">
        <div className="auth-card card">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <LanguageSwitch />
          </div>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 22 }}>✉️</div>
            <h1 style={{ fontSize: 20 }}>{t('forgot.sentTitle')}</h1>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 14, textAlign: 'center', marginBottom: '1.25rem' }}>
            {t('forgot.sentBody')} <strong>{email}</strong>. {t('forgot.sentNote')}
          </p>
          <a href="/" className="btn" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            {t('auth.backToLogin')}
          </a>
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
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>{t('forgot.title')}</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>
            {t('forgot.subtitle')}
          </p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('auth.email')}</label>
            <input className="form-input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <button className="btn btn-primary" type="submit"
            style={{ width: '100%', marginTop: 4 }} disabled={loading}>
            {loading ? t('forgot.sending') : t('forgot.send')}
          </button>
        </form>
        <div className="auth-footer">
          <a href="/">{t('auth.backToLogin')}</a>
        </div>
      </div>
    </div>
  )
}
