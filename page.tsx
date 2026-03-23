'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Animateur } from '@/lib/types'

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

export default function HomePage() {
  const [animateurs, setAnimateurs] = useState<Animateur[]>([])
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [competence, setCompetence] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('animateurs').select('*').order('nom').then(({ data }) => {
      setAnimateurs(data || [])
      setLoading(false)
    })
  }, [])

  const regions = [...new Set(animateurs.map(a => a.region).filter(Boolean))].sort() as string[]
  const competences = [...new Set(animateurs.flatMap(a => a.competences))].sort()

  const filtered = animateurs.filter(a => {
    const q = search.toLowerCase()
    const matchQ = !q || a.nom.toLowerCase().includes(q) ||
      (a.ville || '').toLowerCase().includes(q) ||
      (a.region || '').toLowerCase().includes(q) ||
      a.competences.some(c => c.toLowerCase().includes(q))
    const matchR = !region || a.region === region
    const matchC = !competence || a.competences.includes(competence)
    return matchQ && matchR && matchC
  })

  return (
    <div className="container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: '4px' }}>Animateurs de la Fresque de l&apos;IA</h1>
        <p style={{ color: 'var(--text2)', fontSize: '14px' }}>
          Trouvez un animateur près de chez vous ou selon vos besoins.
        </p>
      </div>

      <div className="filters">
        <input
          type="text" placeholder="Rechercher par nom, ville, compétence…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
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
        <span className="stat-pill"><strong>{[...new Set(filtered.map(a => a.region).filter(Boolean))].length}</strong> régions</span>
        <span className="stat-pill"><strong>{[...new Set(filtered.flatMap(a => a.competences))].length}</strong> compétences</span>
      </div>

      {loading ? (
        <div className="empty"><p>Chargement…</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty"><p>Aucun animateur trouvé.</p></div>
      ) : (
        <div className="animateurs-grid">
          {filtered.map(a => {
            const c = colorFor(a.id)
            return (
              <Link key={a.id} href={`/profile/${a.id}`} className="animateur-card">
                <div className="avatar" style={{ background: c.bg, color: c.text }}>
                  {a.photo_url
                    ? <img src={a.photo_url} alt={a.nom} />
                    : initials(a.nom)}
                </div>
                <div className="name">{a.nom}</div>
                {a.titre && <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '2px' }}>{a.titre}</div>}
                <div className="location">{[a.ville, a.region].filter(Boolean).join(' · ')}</div>
                <div className="tags">
                  {a.competences.slice(0, 3).map(c => (
                    <span key={c} className="tag">{c}</span>
                  ))}
                  {a.competences.length > 3 && <span className="tag">+{a.competences.length - 3}</span>}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
