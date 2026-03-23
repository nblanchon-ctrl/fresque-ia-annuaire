'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function RegisterPage() {
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Le mot de passe doit faire au moins 8 caractères.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { nom } }
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="auth-wrap">
        <div className="auth-card card">
          <h1>Vérifiez votre email</h1>
          <p style={{ marginTop: '8px' }}>
            Un email de confirmation a été envoyé à <strong>{email}</strong>.
            Cliquez sur le lien pour activer votre compte.
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <Link href="/login" className="btn btn-primary" style={{ width: '100%', display: 'flex' }}>
              Aller à la connexion
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card card">
        <h1>Créer un compte</h1>
        <p>Rejoignez l&apos;annuaire des animateurs de la Fresque de l&apos;IA.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Prénom et nom *</label>
            <input className="form-input" type="text" value={nom}
              onChange={e => setNom(e.target.value)} required placeholder="Marie Dupont" />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="form-group">
            <label className="form-label">Mot de passe * (8 caractères min.)</label>
            <input className="form-input" type="password" value={password}
              onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          <button className="btn btn-primary" type="submit"
            style={{ width: '100%', marginTop: '4px' }} disabled={loading}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>
        <div className="auth-footer">
          Déjà un compte ? <Link href="/login">Se connecter</Link>
        </div>
      </div>
    </div>
  )
}
