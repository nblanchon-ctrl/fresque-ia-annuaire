'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function HomePage() {
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
      if (error) { setError('Email ou mot de passe incorrect.'); setLoading(false) }
      else window.location.href = '/annuaire'
    } else {
      if (password.length < 8) { setError('Mot de passe trop court (8 caractères min.).'); setLoading(false); return }
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { nom } } })
      if (error) { setError(error.message); setLoading(false) }
      else setSuccess(true)
    }
  }

  if (checking) return null

  if (success) return (
    <div className="auth-wrap">
      <div className="auth-card card">
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: 20 }}>Vérifiez votre email</h1>
        </div>
        <p style={{ color: 'var(--text2)', fontSize: 14, textAlign: 'center' }}>
          Un lien de confirmation a été envoyé à <strong>{email}</strong>.
        </p>
        <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem' }}
          onClick={() => { setSuccess(false); setMode('login') }}>
          Retour à la connexion
        </button>
      </div>
    </div>
  )

  return (
    <div className="auth-wrap">
      <div className="auth-card card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>Fresque de l&apos;IA</div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>
            {mode === 'login' ? 'Se connecter' : 'Créer un compte'}
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>
            {mode === 'login' ? "Accédez à l'annuaire des animateurs." : "Rejoignez l'annuaire des animateurs."}
          </p>
        </div>

        <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: 3, marginBottom: '1.25rem', gap: 3 }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }}
              style={{ flex: 1, padding: '7px', borderRadius: 'calc(var(--radius) - 2px)', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 13, transition: 'all .15s',
                background: mode === m ? 'var(--bg)' : 'transparent',
                color: mode === m ? 'var(--text)' : 'var(--text2)' }}>
              {m === 'login' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Prénom et nom *</label>
              <input className="form-input" type="text" value={nom}
                onChange={e => setNom(e.target.value)} required placeholder="Marie Dupont" />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="form-group">
            <label className="form-label">Mot de passe *{mode === 'register' && ' (8 car. min.)'}</label>
            <input className="form-input" type="password" value={password}
              onChange={e => setPassword(e.target.value)} required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </div>
          <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
            {loading ? '…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  )
}
