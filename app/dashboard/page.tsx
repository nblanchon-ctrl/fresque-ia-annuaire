'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import type { Animateur } from '@/lib/types'
import { BadgesEditor } from '@/components/Badges'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

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
  const { t, lang } = useLanguage()
  const [animateur, setAnimateur] = useState<Animateur | null>(null)
  const [form, setForm] = useState<Partial<Animateur>>({})
  const [competenceInput, setCompetenceInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showPwd, setShowPwd] = useState(false)
  const [pwd, setPwd] = useState('')
  const [pwdConfirm, setPwdConfirm] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
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
    if (saveErr) setError(t('dashboard.updateError'))
    else setSuccess(true)
    setSaving(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdError('')
    setPwdSuccess(false)
    if (pwd.length < 8) {
      setPwdError(lang === 'en' ? 'Password must be at least 8 characters.' : 'Le mot de passe doit faire au moins 8 caractères.')
      return
    }
    if (pwd !== pwdConfirm) {
      setPwdError(lang === 'en' ? 'Passwords do not match.' : 'Les mots de passe ne correspondent pas.')
      return
    }
    setPwdLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pwd })
    if (error) {
      setPwdError(error.message)
    } else {
      setPwdSuccess(true)
      setPwd('')
      setPwdConfirm('')
    }
    setPwdLoading(false)
  }

  if (loading) return <div className="container"><div className="empty"><p>{t('common.loading')}</p></div></div>
  if (!animateur) return null

  const photoUrl = form.photo_url
  const initials = animateur.nom.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div className="container" style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <div style={{ marginBottom: 4 }}>
            <a href="/annuaire" style={{ fontSize: 13, color: 'var(--text2)' }}>
              ← {lang === 'en' ? 'My space' : 'Mon espace'}
            </a>
          </div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>{t('dashboard.title')}</h1>
        </div>
        <LanguageSwitch />
      </div>

      {success && <div className="alert alert-success">{t('dashboard.updateSuccess')}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSave}>
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div className="avatar avatar-lg" style={{ background: '#EEEDFE', color: '#3C3489', cursor: 'pointer' }}
              onClick={() => fileRef.current?.click()}>
              {photoUrl ? <img src={photoUrl} alt="" /> : initials}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t('dashboard.photo')}</div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>{t('dashboard.photoHint')}</div>
              <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? t('dashboard.uploading') : t('dashboard.changePhoto')}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">{t('dashboard.fullName')}</label>
              <input className="form-input" value={form.nom || ''} onChange={e => set('nom', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('dashboard.titleRole')}</label>
              <input className="form-input" value={form.titre || ''} onChange={e => set('titre', e.target.value)} placeholder="Animatrice certifiée" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('dashboard.publicEmail')}</label>
              <input className="form-input" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('dashboard.phone')}</label>
              <input className="form-input" value={form.telephone || ''} onChange={e => set('telephone', e.target.value)} placeholder="+33 6 …" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('dashboard.region')}</label>
              <select className="form-input" value={form.region || ''} onChange={e => set('region', e.target.value)}>
                <option value="">{t('dashboard.select')}</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('dashboard.city')}</label>
              <input className="form-input" value={form.ville || ''} onChange={e => set('ville', e.target.value)} placeholder="Paris" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('dashboard.bio')}</label>
            <textarea className="form-input" value={form.bio || ''} onChange={e => set('bio', e.target.value)}
              placeholder={t('dashboard.bioPlaceholder')} />
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>{t('dashboard.myLevels')}</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '1rem' }}>
            {t('dashboard.levelsHint')}
          </div>
          <BadgesEditor
            badge_observateur={form.badge_observateur || false}
            badge_coanimateur={form.badge_coanimateur || false}
            onChange={(key, value) => set(key, value)}
          />
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '1rem' }}>{t('dashboard.skills')}</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input className="form-input" style={{ flex: 1 }} value={competenceInput}
              onChange={e => setCompetenceInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCompetence(competenceInput) }}}
              placeholder={t('dashboard.addSkill')} />
            <button type="button" className="btn" onClick={() => addCompetence(competenceInput)}>{t('common.add')}</button>
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
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>{t('dashboard.suggestions')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {COMPETENCES_SUGGÉRÉES.filter(c => !(form.competences || []).includes(c)).map(c => (
              <button key={c} type="button" className="btn btn-sm" style={{ fontSize: '12px' }} onClick={() => addCompetence(c)}>{c}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <a href={`/profile/${animateur.id}`} className="btn">{t('dashboard.viewPublicProfile')}</a>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>

      {/* Modifier le mot de passe */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>
              {lang === 'en' ? 'Change password' : 'Modifier mon mot de passe'}
            </div>
            {!showPwd && (
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
                {lang === 'en' ? 'Update your login password.' : 'Mettez à jour votre mot de passe de connexion.'}
              </div>
            )}
          </div>
          <button className="btn btn-sm" onClick={() => {
            setShowPwd(v => !v)
            setPwdError('')
            setPwdSuccess(false)
            setPwd('')
            setPwdConfirm('')
          }}>
            {showPwd
              ? (lang === 'en' ? 'Cancel' : 'Annuler')
              : (lang === 'en' ? 'Change' : 'Modifier')}
          </button>
        </div>

        {showPwd && (
          <form onSubmit={handleChangePassword} style={{ marginTop: '1rem' }}>
            {pwdError && <div className="alert alert-error">{pwdError}</div>}
            {pwdSuccess && (
              <div className="alert alert-success">
                {lang === 'en' ? 'Password updated successfully.' : 'Mot de passe mis à jour avec succès.'}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">
                {lang === 'en' ? 'New password * (min. 8 characters)' : 'Nouveau mot de passe * (8 car. min.)'}
              </label>
              <input className="form-input" type="password" value={pwd}
                onChange={e => setPwd(e.target.value)} required autoComplete="new-password" />
            </div>
            <div className="form-group">
              <label className="form-label">
                {lang === 'en' ? 'Confirm new password *' : 'Confirmer le nouveau mot de passe *'}
              </label>
              <input className="form-input" type="password" value={pwdConfirm}
                onChange={e => setPwdConfirm(e.target.value)} required autoComplete="new-password" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={pwdLoading}>
                {pwdLoading ? '…' : (lang === 'en' ? 'Update password' : 'Mettre à jour')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
