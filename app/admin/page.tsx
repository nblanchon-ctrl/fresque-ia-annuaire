'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import type { Animateur } from '@/lib/types'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

const REGIONS = [
  'Auvergne-Rhône-Alpes','Bourgogne-Franche-Comté','Bretagne','Centre-Val de Loire',
  'Corse','Grand Est','Hauts-de-France','Île-de-France','Normandie','Nouvelle-Aquitaine',
  'Occitanie','Pays de la Loire',"Provence-Alpes-Côte d'Azur",
  'Belgique','Suisse','Luxembourg','Canada','Autre'
]

function generatePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function AdminPage() {
  const { t, lang } = useLanguage()
  const [animateurs, setAnimateurs] = useState<Animateur[]>([])
  const [me, setMe] = useState<Animateur | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Animateur>>({})
  const [saving, setSaving] = useState(false)

  // Photo upload
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const photoRef = useRef<HTMLInputElement>(null)

  // Modal reset password
  const [pwdModal, setPwdModal] = useState<Animateur | null>(null)
  const [newPwd, setNewPwd] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdDone, setPwdDone] = useState(false)
  const [pwdError, setPwdError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const { data: meData } = await supabase.from('animateurs').select('*').eq('id', user.id).single()
      if (!meData?.is_admin) { window.location.href = '/'; return }
      setIsAdmin(true)
      setMe(meData)
      const { data } = await supabase.from('animateurs').select('*').order('nom')
      setAnimateurs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const toggleAdmin = async (id: string, current: boolean) => {
    await supabase.from('animateurs').update({ is_admin: !current }).eq('id', id)
    setAnimateurs(prev => prev.map(a => a.id === id ? { ...a, is_admin: !current } : a))
  }

  const deleteAnimateur = async (id: string) => {
    if (!confirm(t('admin.confirmDelete'))) return
    await supabase.from('animateurs').delete().eq('id', id)
    setAnimateurs(prev => prev.filter(a => a.id !== id))
    if (editId === id) setEditId(null)
  }

  const startEdit = (a: Animateur) => {
    setEditId(a.id)
    setEditForm({ ...a })
    setPhotoFile(null)
    setPhotoPreview('')
  }

  const cancelEdit = () => {
    setEditId(null)
    setEditForm({})
    setPhotoFile(null)
    setPhotoPreview('')
  }

  const saveEdit = async () => {
    if (!editId) return
    setSaving(true)

    // Upload photo if changed
    let photo_url = editForm.photo_url
    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const path = `${editId}/avatar_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, photoFile, { upsert: true })
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        photo_url = urlData.publicUrl
      }
    }

    const { error } = await supabase.from('animateurs').update({
      nom: editForm.nom,
      titre: editForm.titre,
      email: editForm.email,
      telephone: editForm.telephone,
      region: editForm.region,
      ville: editForm.ville,
      bio: editForm.bio,
      competences: editForm.competences || [],
      badge_observateur: editForm.badge_observateur || false,
      badge_coanimateur: editForm.badge_coanimateur || false,
      photo_url,
      updated_at: new Date().toISOString()
    }).eq('id', editId)

    if (!error) {
      setAnimateurs(prev => prev.map(a =>
        a.id === editId ? { ...a, ...editForm, photo_url } as Animateur : a
      ))
      setEditId(null)
      setEditForm({})
      setPhotoFile(null)
      setPhotoPreview('')
    }
    setSaving(false)
  }

  const setF = (field: string, value: unknown) => setEditForm(f => ({ ...f, [field]: value }))

  const openPwdModal = (a: Animateur) => {
    setPwdModal(a)
    setNewPwd(generatePassword())
    setPwdDone(false)
    setPwdError('')
  }

  const handleSetPassword = async () => {
    if (!pwdModal || !me) return
    if (newPwd.length < 8) {
      setPwdError(lang === 'en' ? 'Password must be at least 8 characters.' : 'Mot de passe trop court (8 car. min.).')
      return
    }
    setPwdSaving(true)
    setPwdError('')
    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: pwdModal.id, newPassword: newPwd, requesterId: me.id })
    })
    const data = await res.json()
    if (!res.ok || data.error) { setPwdError(data.error || 'Erreur.') } else { setPwdDone(true) }
    setPwdSaving(false)
  }

  const sendMailWithPassword = () => {
    if (!pwdModal) return
    const sujet = lang === 'en' ? "Your new password — Fresque de l'IA" : "Votre nouveau mot de passe — Fresque de l'IA"
    const corps = lang === 'en'
      ? `Hello ${pwdModal.nom},\n\nYour password has been reset.\n\nNew password: ${newPwd}\n\nLogin: ${window.location.origin}\n\nBest regards`
      : `Bonjour ${pwdModal.nom},\n\nVotre mot de passe a été réinitialisé.\n\nNouveau mot de passe : ${newPwd}\n\nConnexion : ${window.location.origin}\n\nCordialement`
    window.location.href = `mailto:${pwdModal.email}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`
  }

  const emailsAvec = animateurs.filter(a => a.email)

  const exportCSV = () => {
    const header = 'Nom,Email,Région,Ville,Titre,Compétences,Badge Observateur,Badge Co-animateur'
    const rows = animateurs.map(a =>
      `"${a.nom}","${a.email || ''}","${a.region || ''}","${a.ville || ''}","${a.titre || ''}","${(a.competences || []).join(' | ')}","${a.badge_observateur ? 'Oui' : 'Non'}","${a.badge_coanimateur ? 'Oui' : 'Non'}"`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = `animateurs-${new Date().toISOString().slice(0, 10)}.csv`; link.click()
    URL.revokeObjectURL(url)
  }

  const exportEmailsCSV = () => {
    const header = 'Nom,Email'
    const rows = emailsAvec.map(a => `"${a.nom}","${a.email}"`)
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = `emails-animateurs-${new Date().toISOString().slice(0, 10)}.csv`; link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="container"><div className="empty"><p>{t('common.loading')}</p></div></div>
  if (!isAdmin) return null

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>{t('admin.title')}</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <LanguageSwitch />
          <a href="/annuaire" className="btn btn-sm">← {lang === 'en' ? 'My space' : 'Mon espace'}</a>
        </div>
      </div>

      <div className="stats-bar" style={{ marginBottom: '1rem' }}>
        <span className="stat-pill"><strong>{animateurs.length}</strong> {t('admin.animators')}</span>
        <span className="stat-pill"><strong>{animateurs.filter(a => a.is_admin).length}</strong> {t('admin.admins')}</span>
        <span className="stat-pill"><strong>{emailsAvec.length}</strong> {t('admin.emailsAvailable')}</span>
      </div>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{t('admin.exports')}</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1rem' }}>{t('admin.exportsHint')}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={exportEmailsCSV}>{t('admin.downloadEmails')} ({emailsAvec.length})</button>
          <button className="btn" onClick={exportCSV}>{t('admin.downloadAll')}</button>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: 'var(--text2)' }}>{t('admin.colName')}</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: 'var(--text2)' }}>{t('admin.colEmail')}</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: 'var(--text2)' }}>{t('admin.colRegion')}</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: 'var(--text2)' }}>{t('admin.colJoined')}</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: 'var(--text2)' }}>{t('admin.colAdmin')}</th>
                <th style={{ padding: '10px 12px' }}></th>
              </tr>
            </thead>
            <tbody>
              {animateurs.map(a => (
                <>
                  <tr key={a.id} style={{ borderBottom: editId === a.id ? 'none' : '0.5px solid var(--border)', background: editId === a.id ? 'var(--bg2)' : 'transparent' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg2)', flexShrink: 0 }}>
                          {a.photo_url
                            ? <img src={a.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 13 }}>👤</span>
                          }
                        </div>
                        <a href={`/profile/${a.id}`} style={{ color: 'var(--accent)', fontWeight: 500 }}>{a.nom}</a>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{a.email || '—'}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{a.region || '—'}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{new Date(a.created_at).toLocaleDateString('fr-FR')}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <input type="checkbox" checked={a.is_admin} onChange={() => toggleAdmin(a.id, a.is_admin)} />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {editId === a.id
                          ? <button className="btn btn-sm" onClick={cancelEdit}>{t('common.cancel')}</button>
                          : <button className="btn btn-sm" onClick={() => startEdit(a)}>{t('common.edit')}</button>
                        }
                        {a.email && (
                          <button className="btn btn-sm" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                            onClick={() => openPwdModal(a)} title={lang === 'en' ? 'Set a new password' : 'Définir un nouveau mot de passe'}>
                            🔑
                          </button>
                        )}
                        <button className="btn btn-sm btn-danger" onClick={() => deleteAnimateur(a.id)}>{t('common.delete')}</button>
                      </div>
                    </td>
                  </tr>

                  {editId === a.id && (
                    <tr key={`edit-${a.id}`} style={{ borderBottom: '0.5px solid var(--border)' }}>
                      <td colSpan={6} style={{ padding: '0 12px 16px' }}>
                        <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginTop: 4 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem', color: 'var(--text2)' }}>
                            {t('admin.editingTitle')} {a.nom}
                          </div>

                          {/* ── PHOTO DE PROFIL ── */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: 'var(--bg2)', borderRadius: 'var(--radius)', marginBottom: '1rem', border: '0.5px solid var(--border)' }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              <div style={{ width: 68, height: 68, borderRadius: '50%', overflow: 'hidden', background: '#E5E5E5', border: '2px solid var(--border)' }}>
                                {photoPreview
                                  ? <img src={photoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : editForm.photo_url
                                    ? <img src={editForm.photo_url as string} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                    : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 28 }}>👤</span>
                                }
                              </div>
                              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✏️</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                                {lang === 'en' ? 'Profile photo' : 'Photo de profil'}
                              </div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                <button type="button" className="btn btn-sm" onClick={() => photoRef.current?.click()}>
                                  {photoFile ? `✓ ${photoFile.name.slice(0, 22)}…` : (lang === 'en' ? 'Replace photo' : 'Remplacer la photo')}
                                </button>
                                {photoFile && (
                                  <button type="button" className="btn btn-sm btn-danger"
                                    onClick={() => { setPhotoFile(null); setPhotoPreview('') }}>
                                    ✕ {lang === 'en' ? 'Cancel' : 'Annuler'}
                                  </button>
                                )}
                                <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }}
                                  onChange={e => {
                                    const f = e.target.files?.[0]
                                    if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)) }
                                  }}
                                />
                              </div>
                              {photoFile && (
                                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                                  {lang === 'en' ? 'Will be applied on save.' : 'Sera appliquée à la sauvegarde.'}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* ── CHAMPS PROFIL ── */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">{t('directory.name')}</label>
                              <input className="form-input" value={editForm.nom || ''} onChange={e => setF('nom', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">{t('directory.title2')}</label>
                              <input className="form-input" value={editForm.titre || ''} onChange={e => setF('titre', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">{t('directory.email')}</label>
                              <input className="form-input" type="email" value={editForm.email || ''} onChange={e => setF('email', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">{t('directory.phone')}</label>
                              <input className="form-input" value={editForm.telephone || ''} onChange={e => setF('telephone', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">{t('directory.region')}</label>
                              <select className="form-input" value={editForm.region || ''} onChange={e => setF('region', e.target.value)}>
                                <option value="">{t('dashboard.select')}</option>
                                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">{t('directory.city')}</label>
                              <input className="form-input" value={editForm.ville || ''} onChange={e => setF('ville', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                              <label className="form-label">{t('directory.bio')}</label>
                              <textarea className="form-input" value={editForm.bio || ''} onChange={e => setF('bio', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                              <label className="form-label">{t('directory.skillsLabel')}</label>
                              <input className="form-input"
                                value={(editForm.competences || []).join(', ')}
                                onChange={e => setF('competences', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 16, marginBottom: '1rem' }}>
                            {[
                              { key: 'badge_observateur', label: '👁 ' + t('badge.observer') },
                              { key: 'badge_coanimateur', label: '⚡ ' + t('badge.coanimator') }
                            ].map(b => (
                              <label key={b.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                                <input type="checkbox"
                                  checked={!!editForm[b.key as keyof Animateur]}
                                  onChange={e => setF(b.key, e.target.checked)} />
                                {b.label}
                              </label>
                            ))}
                          </div>

                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="btn" onClick={cancelEdit}>{t('common.cancel')}</button>
                            <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                              {saving ? t('common.saving') : t('common.save')}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal mot de passe */}
      {pwdModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: 440, width: '100%' }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
              🔑 {lang === 'en' ? 'Set a new password' : 'Définir un nouveau mot de passe'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1.25rem' }}>
              {pwdModal.nom} — {pwdModal.email}
            </div>
            {!pwdDone ? (
              <>
                {pwdError && <div className="alert alert-error">{pwdError}</div>}
                <div className="form-group">
                  <label className="form-label">{lang === 'en' ? 'New password *' : 'Nouveau mot de passe *'}</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" style={{ flex: 1, fontFamily: 'monospace', fontSize: 15, letterSpacing: 1 }}
                      value={newPwd} onChange={e => setNewPwd(e.target.value)} />
                    <button type="button" className="btn btn-sm" onClick={() => setNewPwd(generatePassword())} title="Générer">🔄</button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn" onClick={() => setPwdModal(null)}>{t('common.cancel')}</button>
                  <button className="btn btn-primary" onClick={handleSetPassword} disabled={pwdSaving}>
                    {pwdSaving ? '…' : (lang === 'en' ? 'Set password' : 'Définir le mot de passe')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="alert alert-success">
                  {lang === 'en' ? 'Password updated!' : 'Mot de passe mis à jour !'}
                </div>
                <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '12px 16px', marginBottom: '1rem' }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>
                    {lang === 'en' ? 'New password:' : 'Nouveau mot de passe :'}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 600, letterSpacing: 2, color: 'var(--accent)' }}>{newPwd}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn" onClick={() => setPwdModal(null)}>{lang === 'en' ? 'Close' : 'Fermer'}</button>
                  <button className="btn btn-primary" onClick={sendMailWithPassword}>✉️ {lang === 'en' ? 'Send by email' : 'Envoyer par mail'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
