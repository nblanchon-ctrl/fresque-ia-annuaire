'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import type { Animateur } from '@/lib/types'
import { BadgesEditor } from '@/components/Badges'

const REGIONS = [
  'Auvergne-Rhône-Alpes','Bourgogne-Franche-Comté','Bretagne','Centre-Val de Loire',
  'Corse','Grand Est','Hauts-de-France','Île-de-France','Normandie','Nouvelle-Aquitaine',
  'Occitanie','Pays de la Loire',"Provence-Alpes-Côte d'Azur",
  'Belgique','Suisse','Luxembourg','Canada','Autre'
]

const COMPETENCES_SUGGÉRÉES = [
  'Facilitation','Numérique','Formation','Entreprises','Éducation','Collectivités',
  'Startups','Associations','RSE','IA éthique','Jeunesse','Milieu rural',
  'Recherche','Académique','Multilinguisme','Santé','Culture'
]

export default function DashboardPage() {
  const [animateur, setAnimateur] = useState<Animateur | null>(null)
  const [form, setForm] = useState<Partial<Animateur>>({})
  const [competenceInput, setCompetenceInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const { data } = await supabase.from('animateurs').select('*').eq('id', user.id).single()
      if (data) { setAnimateur(data); setForm(data) }
      setLoading(false)
    }
    load()
  }, [])

  const set = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }))

  const addCompetence = (c: string) => {
    const trimmed = c.trim()
    if (!trimmed) return
    const current = form.competences || []
    if (!current.includes(trimmed)) set('competences', [...current, trimmed])
    setCompetenceInput('')
  }

  const removeCompetence = (c: string) => {
    set('competences', (form.competences || []).filter(x => x !== c))
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !animateur) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${animateur.id}/avatar.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!upErr) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      set('photo_url', data.publicUrl + '?t=' + Date.now())
    }
    setUploading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    const { error: saveErr } = await supabase.from('animateurs').update({
      nom: form.nom, titre: form.titre, email: form.email,
      telephone: form.telephone, region: form.region, ville: form.ville,
      bio: form.bio, photo_url: form.photo_url, competences: form.competences || [],
      badge_observateur: form.badge_observateur || false,
      badge_coanimateur: form.badge_coanimateur || false,
      updated_at: new Date().toISOString()
    }).eq('id', animateur!.id)
    if (saveErr) setError('Erreur lors de la sauvegarde.')
    else setSuccess(true)
    setSaving(false)
  }

  if (loading) return <div className="container"><div className="empty"><p>Chargement…</p></div></div>
  if (!animateur) return null

  const photoUrl = form.photo_url
  const initials = animateur.nom.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div className="container" style={{ maxWidth: 700 }}>
      <h1 className="page-title">Mon profil</h1>

      {success && <div className="alert alert-success">Profil mis à jour avec succès.</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSave}>
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div className="avatar avatar-lg" style={{ background: '#EEEDFE', color: '#3C3489', cursor: 'pointer' }}
              onClick={() => fileRef.current?.click()}>
              {photoUrl ? <img src={photoUrl} alt="" /> : initials}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Photo de profil</div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>JPG ou PNG, 2 Mo max.</div>
              <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? 'Envoi…' : 'Changer la photo'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Prénom et nom *</label>
              <input className="form-input" value={form.nom || ''} onChange={e => set('nom', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Titre / rôle</label>
              <input className="form-input" value={form.titre || ''} onChange={e => set('titre', e.target.value)} placeholder="Animatrice certifiée" />
            </div>
            <div className="form-group">
              <label className="form-label">Email public</label>
              <input className="form-input" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input className="form-input" value={form.telephone || ''} onChange={e => set('telephone', e.target.value)} placeholder="+33 6 …" />
            </div>
            <div className="form-group">
              <label className="form-label">Région</label>
              <select className="form-input" value={form.region || ''} onChange={e => set('region', e.target.value)}>
                <option value="">Sélectionner…</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Ville</label>
              <input className="form-input" value={form.ville || ''} onChange={e => set('ville', e.target.value)} placeholder="Paris" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea className="form-input" value={form.bio || ''} onChange={e => set('bio', e.target.value)}
              placeholder="Quelques mots sur vous, votre expérience, vos disponibilités…" />
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>Mes niveaux</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '1rem' }}>
            Cochez les étapes que vous avez franchies.
          </div>
          <BadgesEditor
            badge_observateur={form.badge_observateur || false}
            badge_coanimateur={form.badge_coanimateur || false}
            onChange={(key, value) => set(key, value)}
          />
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '1rem' }}>Compétences</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input className="form-input" style={{ flex: 1 }} value={competenceInput}
              onChange={e => setCompetenceInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCompetence(competenceInput) }}}
              placeholder="Ajouter une compétence…" />
            <button type="button" className="btn" onClick={() => addCompetence(competenceInput)}>Ajouter</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {(form.competences || []).map(c => (
              <span key={c} style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                background: '#EEEDFE', color: '#3C3489', fontSize: '13px',
                padding: '3px 10px', borderRadius: '20px', border: '0.5px solid #AFA9EC'
              }}>
                {c}
                <button type="button" onClick={() => removeCompetence(c)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#534AB7', fontSize: '14px', lineHeight: 1, padding: 0 }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Suggestions :</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {COMPETENCES_SUGGÉRÉES.filter(c => !(form.competences || []).includes(c)).map(c => (
              <button key={c} type="button" className="btn btn-sm" style={{ fontSize: '12px' }} onClick={() => addCompetence(c)}>{c}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <a href={`/profile/${animateur.id}`} className="btn">Voir mon profil public</a>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </form>
    </div>
  )
}
