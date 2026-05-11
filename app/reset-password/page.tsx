'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
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
    if (password.length < 8) { setError('Le mot de passe doit faire au moins 8 caractères.'); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
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
            <h1 style={{ fontSize: 20 }}>Mot de passe mis à jour</h1>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 14, textAlign: 'center', marginBottom: '1.25rem' }}>
            Votre mot de passe a été modifié avec succès.
          </p>
          <a href="/" className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            Se connecter
          </a>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="auth-wrap">
        <div className="auth-card card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Vérification du lien en cours…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>Fresque de l&apos;IA</div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Nouveau mot de passe</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>Choisissez un nouveau mot de passe.</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nouveau mot de passe * (8 car. min.)</label>
            <input className="form-input" type="password" value={password}
              onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          <div className="form-group">
            <label className="form-label">Confirmer le mot de passe *</label>
            <input className="form-input" type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)} required autoComplete="new-password" />
          </div>
          <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
            {loading ? '…' : 'Mettre à jour'}
          </button>
        </form>
      </div>
    </div>
  )
}
