'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Animateur } from '@/lib/types'

const REGIONS = [
  'Auvergne-Rhône-Alpes','Bourgogne-Franche-Comté','Bretagne','Centre-Val de Loire',
  'Corse','Grand Est','Hauts-de-France','Île-de-France','Normandie','Nouvelle-Aquitaine',
  'Occitanie','Pays de la Loire',"Provence-Alpes-Côte d'Azur",
  'Belgique','Suisse','Luxembourg','Canada','Autre'
]

export default function AdminPage() {
  const [animateurs, setAnimateurs] = useState<Animateur[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Animateur>>({})
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data: me } = await supabase.from('animateurs').select('is_admin').eq('id', user.id).single()
      if (!me?.is_admin) { window.location.href = '/'; return }
      setIsAdmin(true)
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
    if (!confirm('Supprimer cet animateur ? Cette action est irréversible.')) return
    await supabase.from('animateurs').delete().eq('id', id)
    setAnimateurs(prev => prev.filter(a => a.id !== id))
    if (editId === id) setEditId(null)
  }

  const startEdit = (a: Animateur) => {
    setEditId(a.id)
    setEditForm({ ...a })
  }

  const cancelEdit = () => {
    setEditId(null)
    setEditForm({})
  }

  const saveEdit = async () => {
    if (!editId) return
    setSaving(true)
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
      updated_at: new Date().toISOString()
    }).eq('id', editId)
    if (!error) {
      setAnimateurs(prev => prev.map(a => a.id === editId ? { ...a, ...editForm } as Animateur : a))
      setEditId(null)
      setEditForm({})
    }
    setSaving(false)
  }

  const setF = (field: string, value: unknown) => setEditForm(f => ({ ...f, [field]: value }))

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
    link.href = url
    link.download = `animateurs-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportEmailsCSV = () => {
    const header = 'Nom,Email'
    const rows = emailsAvec.map(a => `"${a.nom}","${a.email}"`)
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `emails-animateurs-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="container"><div className="empty"><p>Chargement…</p></div></div>
  if (!isAdmin) return null

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Administration v2</h1>
        <a href="/annuaire" className="btn btn-sm">← Annuaire</a>
      </div>

      <div className="stats-bar" style={{ marginBottom: '1rem' }}>
        <span className="stat-pill"><strong>{animateurs.length}</strong> animateurs</span>
        <span className="stat-pill"><strong>{animateurs.filter(a => a.is_admin).length}</strong> admins</span>
        <span className="stat-pill"><strong>{emailsAvec.length}</strong> emails renseignés</span>
      </div>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Exports</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1rem' }}>
          Téléchargez les données au format CSV, lisible dans Excel ou Google Sheets.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={exportEmailsCSV}>
            Télécharger les emails ({emailsAvec.length})
          </button>
          <button className="btn" onClick={exportCSV}>
            Télécharger toutes les fiches
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: 'var(--text2)' }}>Nom</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: 'var(--text2)' }}>Email</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: 'var(--text2)' }}>Région</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: 'var(--text2)' }}>Inscription</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: 'var(--text2)' }}>Admin</th>
                <th style={{ padding: '10px 12px' }}></th>
              </tr>
            </thead>
            <tbody>
              {animateurs.map(a => (
                <>
                  <tr key={a.id} style={{ borderBottom: editId === a.id ? 'none' : '0.5px solid var(--border)', background: editId === a.id ? 'var(--bg2)' : 'transparent' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <a href={`/profile/${a.id}`} style={{ color: 'var(--accent)', fontWeight: 500 }}>{a.nom}</a>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{a.email || '—'}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{a.region || '—'}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>
                      {new Date(a.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <input type="checkbox" checked={a.is_admin}
                        onChange={() => toggleAdmin(a.id, a.is_admin)} />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {editId === a.id ? (
                          <button className="btn btn-sm" onClick={cancelEdit}>Annuler</button>
                        ) : (
                          <button className="btn btn-sm" onClick={() => startEdit(a)}>Modifier</button>
                        )}
                        <button className="btn btn-sm btn-danger" onClick={() => deleteAnimateur(a.id)}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>

                  {editId === a.id && (
                    <tr key={`edit-${a.id}`} style={{ borderBottom: '0.5px solid var(--border)' }}>
                      <td colSpan={6} style={{ padding: '0 12px 16px' }}>
                        <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginTop: 4 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem', color: 'var(--text2)' }}>
                            Modifier la fiche de {a.nom}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">Nom *</label>
                              <input className="form-input" value={editForm.nom || ''} onChange={e => setF('nom', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">Titre</label>
                              <input className="form-input" value={editForm.titre || ''} onChange={e => setF('titre', e.target.value)} placeholder="Animateur certifié" />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">Email</label>
                              <input className="form-input" type="email" value={editForm.email || ''} onChange={e => setF('email', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">Téléphone</label>
                              <input className="form-input" value={editForm.telephone || ''} onChange={e => setF('telephone', e.target.value)} placeholder="+33 6 …" />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">Région</label>
                              <select className="form-input" value={editForm.region || ''} onChange={e => setF('region', e.target.value)}>
                                <option value="">Sélectionner…</option>
                                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">Ville</label>
                              <input className="form-input" value={editForm.ville || ''} onChange={e => setF('ville', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                              <label className="form-label">Bio</label>
                              <textarea className="form-input" value={editForm.bio || ''} onChange={e => setF('bio', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                              <label className="form-label">Compétences (séparées par des virgules)</label>
                              <input className="form-input"
                                value={(editForm.competences || []).join(', ')}
                                onChange={e => setF('competences', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 16, marginBottom: '1rem' }}>
                            {[
                              { key: 'badge_observateur', label: '👁 Observateur' },
                              { key: 'badge_coanimateur', label: '⚡ Co-animateur' }
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
                            <button className="btn" onClick={cancelEdit}>Annuler</button>
                            <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                              {saving ? 'Sauvegarde…' : 'Sauvegarder'}
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
    </div>
  )
}
