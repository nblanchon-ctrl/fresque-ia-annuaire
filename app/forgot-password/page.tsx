'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function ForgotPasswordPage() {
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
      redirectTo: 'https://fresque-ia-animateurs.fr/reset-password'
    })
    if (error) { setError(error.message); setLoading(false) }
    else setSuccess(true)
  }

  if (success) {
    return (
      <div className="auth-wrap">
        <div className="auth-card card">
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 22 }}>✉️</div>
            <h1 style={{ fontSize: 20 }}>Email envoyé</h1>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 14, textAlign: 'center', marginBottom: '1.25rem' }}>
            Un lien de réinitialisation a été envoyé à <strong>{email}</strong>. Vérifiez vos spams si vous ne le recevez pas.
          </p>
          <a href="/" className="btn" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            Retour à la connexion
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>Fresque de l&apos;IA</div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Mot de passe oublié</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>
            Entrez votre email pour recevoir un lien de réinitialisation.
          </p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <button className="btn btn-primary" type="submit"
            style={{ width: '100%', marginTop: 4 }} disabled={loading}>
            {loading ? 'Envoi…' : 'Envoyer le lien'}
          </button>
        </form>
        <div className="auth-footer">
          <a href="/">Retour à la connexion</a>
        </div>
      </div>
    </div>
  )
}
