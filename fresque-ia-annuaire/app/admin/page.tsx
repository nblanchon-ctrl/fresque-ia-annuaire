'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Animateur } from '@/lib/types'

export default function AdminPage() {
  const [animateurs, setAnimateurs] = useState<Animateur[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
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
  }

  if (loading) return <div className="container"><div className="empty"><p>Chargement…</p></div></div>
  if (!isAdmin) return null

  return (
    <div className="container">
      <h1 className="page-title">Administration</h1>

      <div className="stats-bar" style={{ marginBottom: '1.5rem' }}>
        <span className="stat-pill"><strong>{animateurs.length}</strong> animateurs</span>
        <span className="stat-pill"><strong>{animateurs.filter(a => a.is_admin).length}</strong> admins</span>
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
                <tr key={a.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
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
                    <button className="btn btn-sm btn-danger" onClick={() => deleteAnimateur(a.id)}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
