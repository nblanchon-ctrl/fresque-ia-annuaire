'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Animateur } from '@/lib/types'
import { BadgesDisplay } from '@/components/Badges'

const COLORS = [
  { bg: '#EEEDFE', text: '#3C3489' }, { bg: '#E1F5EE', text: '#085041' },
  { bg: '#FAECE7', text: '#993C1D' }, { bg: '#E6F1FB', text: '#0C447C' },
  { bg: '#FAEEDA', text: '#633806' }, { bg: '#FBEAF0', text: '#72243E' },
  { bg: '#EAF3DE', text: '#27500A' }, { bg: '#F1EFE8', text: '#444441' },
]

function initials(nom: string) {
  return nom.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?'
}
function colorFor(id: string) {
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return COLORS[n % COLORS.length]
}

export default function AnnuairePage() {
  const [animateurs, setAnimateurs] = useState<Animateur[]>([])
  const [me, setMe] = useState<Animateur | null>(null)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [competence, setCompetence] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newNom, setNewNom] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRegion, setNewRegion] = useState('')
  const [newVille, setNewVille] = useState('')
  const [newTitre, setNewTitre] = useState('')
  const [newCompetences, setNewCompetences] = useState('')
  const [newBio, setNewBio] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const [{ data: meData }, { data: list }] = await Promise.all([
        supabase.from('animateurs').select('*').eq('id', user.id).single(),
        supabase.from('animateurs').select('*').order('nom')
      ])
      setMe(meData)
      setAnimateurs(list || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleDelete = async (id: string, nom: string) => {
    if (!confirm(`Supprimer ${nom} de l'annuaire ?`)) return
    await supabase.from('animateurs').delete().eq('id', id)
    setAnimateurs(prev => prev.filter(a => a.id !== id))
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data, error } = await supabase.from('animateurs').insert({
      id: crypto.randomUUID(),
      nom: newNom,
      email: newEmail,
      titre: newTitre,
      region: newRegion,
      ville: newVille,
      bio: newBio,
      competences: newCompetences.split(',').map(s => s.trim()).filter(Boolean),
    }).select().single()
    if (!error && data) {
      setAnimateurs(prev => [...prev, data].sort((a, b) => a.nom.localeCompare(b.nom)))
      setShowAddForm(false)
      setNewNom(''); setNewEmail(''); setNewTitre(''); setNewRegion(''); setNewVille(''); setNewCompetences(''); setNewBio('')
    }
    setSaving(false)
  }

  const regions = animateurs.map(a => a.region).filter((r): r is string => !!r).filter((v, i, a) => a.indexOf(v) === i).sort()
  const competences = animateurs.flatMap(a => a.competences).filter((v, i, a) => a.indexOf(v) === i).sort()

  const filtered = animateurs.filter(a => {
    const q = search.toLowerCase()
    const matchQ = !q || a.nom.toLowerCase().includes(q) ||
      (a.ville || '').toLowerCase().includes(q) ||
      (a.region || '').toLowerCase().includes(q) ||
      a.competences.some(c => c.toLowerCase().includes(q))
    return matchQ && (!region || a.region === region) && (!competence || a.competences.includes(competence))
  })

  if (loading) return <div className="container"><div className="empty"><p>Chargement…</p></div></div>

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>Annuaire des animateurs</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>
            Connecté en tant que <strong>{me?.nom}</strong>
            {me?.is_admin && <span className="badge badge-admin" style={{ marginLeft: 8 }}>Admin</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/dashboard" className="btn btn-sm">Mon profil</Link>
          {me?.is_admin && (
            <button className="btn btn-sm btn-primary" onClick={() => setShowAddForm(v => !v)}>
              {showAddForm ? 'Annuler' : '+ Ajouter un animateur'}
            </button>
          )}
          <button className="btn btn-sm" onClick={handleLogout}>Déconnexion</button>
        </div>
      </div>

      {me?.is_admin && showAddForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: '1rem' }}>Nouvel animateur</div>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nom *</label>
                <input className="form-input" value={newNom} onChange={e => setNewNom(e.target.value)} required placeholder="Marie Dupont" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Titre</label>
                <input className="form-input" value={newTitre} onChange={e => setNewTitre(e.target.value)} placeholder="Animatrice certifiée" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Téléphone</label>
                <input className="form-input" placeholder="+33 6 …" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Région</label>
                <input className="form-input" value={newRegion} onChange={e => setNewRegion(e.target.value)} placeholder="Île-de-France" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Ville</label>
                <input className="form-input" value={newVille} onChange={e => setNewVille(e.target.value)} placeholder="Paris" />
              </div>
              <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                <label className="form-label">Compétences (séparées par des virgules)</label>
                <input className="form-input" value={newCompetences} onChange={e => setNewCompetences(e.target.value)} placeholder="Facilitation, Entreprises, RSE" />
              </div>
              <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                <label className="form-label">Bio</label>
                <textarea className="form-input" value={newBio} onChange={e => setNewBio(e.target.value)} placeholder="Quelques mots…" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="btn" onClick={() => setShowAddForm(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Ajout…' : 'Ajouter'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="filters">
        <input type="text" placeholder="Rechercher par nom, ville, compétence…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select value={region} onChange={e => setRegion(e.target.value)}>
          <option value="">Toutes les régions</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={competence} onChange={e => setCompetence(e.target.value)}>
          <option value="">Toutes les compétences</option>
          {competences.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="stats-bar">
        <span className="stat-pill"><strong>{filtered.length}</strong> animateur{filtered.length > 1 ? 's' : ''}</span>
        <span className="stat-pill"><strong>{filtered.map(a => a.region).filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i).length}</strong> régions</span>
        <span className="stat-pill"><strong>{filtered.flatMap(a => a.competences).filter((v, i, arr) => arr.indexOf(v) === i).length}</strong> compétences</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty"><p>Aucun animateur trouvé.</p></div>
      ) : (
        <div className="animateurs-grid">
          {filtered.map(a => {
            const c = colorFor(a.id)
            return (
              <div key={a.id} style={{ position: 'relative' }}>
                <Link href={`/profile/${a.id}`} className="animateur-card">
                  <div className="avatar" style={{ background: c.bg, color: c.text }}>
                    {a.photo_url ? <img src={a.photo_url} alt={a.nom} /> : initials(a.nom)}
                  </div>
                  <div className="name">{a.nom}</div>
                  {a.titre && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 2 }}>{a.titre}</div>}
                  <div className="location">{[a.ville, a.region].filter(Boolean).join(' · ')}</div>
                  {(a.badge_observateur || a.badge_coanimateur) && (
                    <div style={{ margin: '6px 0' }}>
                      <BadgesDisplay badge_observateur={a.badge_observateur} badge_coanimateur={a.badge_coanimateur} size="sm" />
                    </div>
                  )}
                  <div className="tags">
                    {a.competences.slice(0, 3).map(c => <span key={c} className="tag">{c}</span>)}
                    {a.competences.length > 3 && <span className="tag">+{a.competences.length - 3}</span>}
                  </div>
                </Link>
                {me?.is_admin && (
                  <button onClick={() => handleDelete(a.id, a.nom)}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text3)', lineHeight: 1, padding: '2px 4px', borderRadius: 4 }}
                    title="Supprimer">×</button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
