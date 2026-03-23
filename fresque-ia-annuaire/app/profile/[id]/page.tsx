'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Animateur } from '@/lib/types'

const COLORS = [
  { bg: '#EEEDFE', text: '#3C3489' }, { bg: '#E1F5EE', text: '#085041' },
  { bg: '#FAECE7', text: '#993C1D' }, { bg: '#E6F1FB', text: '#0C447C' },
  { bg: '#FAEEDA', text: '#633806' }, { bg: '#FBEAF0', text: '#72243E' },
  { bg: '#EAF3DE', text: '#27500A' }, { bg: '#F1EFE8', text: '#444441' },
]

const TAG_COLORS = [
  { bg: '#EEEDFE', text: '#3C3489', border: '#AFA9EC' },
  { bg: '#E1F5EE', text: '#085041', border: '#5DCAA5' },
  { bg: '#FAECE7', text: '#993C1D', border: '#F0997B' },
  { bg: '#E6F1FB', text: '#0C447C', border: '#85B7EB' },
  { bg: '#FAEEDA', text: '#633806', border: '#EF9F27' },
  { bg: '#EAF3DE', text: '#27500A', border: '#97C459' },
]

function initials(nom: string) {
  return nom.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?'
}

function colorFor(id: string) {
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return COLORS[n % COLORS.length]
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [animateur, setAnimateur] = useState<Animateur | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    Promise.all([
      supabase.from('animateurs').select('*').eq('id', id).single(),
      supabase.auth.getUser()
    ]).then(([{ data }, { data: { user } }]) => {
      setAnimateur(data)
      setCurrentUserId(user?.id || null)
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="container"><div className="empty"><p>Chargement…</p></div></div>
  if (!animateur) return (
    <div className="container">
      <div className="empty">
        <p>Animateur introuvable.</p>
        <Link href="/" className="btn" style={{ marginTop: '1rem', display: 'inline-flex' }}>Retour à l&apos;annuaire</Link>
      </div>
    </div>
  )

  const c = colorFor(animateur.id)

  return (
    <div className="container" style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/" style={{ fontSize: '13px', color: 'var(--text2)' }}>← Annuaire</Link>
      </div>

      <div className="card">
        <div className="profile-header">
          <div className="avatar avatar-lg" style={{ background: c.bg, color: c.text }}>
            {animateur.photo_url ? <img src={animateur.photo_url} alt={animateur.nom} /> : initials(animateur.nom)}
          </div>
          <div className="profile-info" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 600 }}>{animateur.nom}</h1>
              {animateur.is_admin && <span className="badge badge-admin">Admin</span>}
            </div>
            {animateur.titre && <div className="titre" style={{ color: 'var(--text2)', marginTop: '2px' }}>{animateur.titre}</div>}
            {(animateur.ville || animateur.region) && (
              <div style={{ fontSize: '14px', color: 'var(--text2)', marginTop: '4px' }}>
                {[animateur.ville, animateur.region].filter(Boolean).join(', ')}
              </div>
            )}
            {currentUserId === animateur.id && (
              <Link href="/dashboard" className="btn btn-sm" style={{ marginTop: '10px', display: 'inline-flex' }}>
                Modifier mon profil
              </Link>
            )}
          </div>
        </div>

        {animateur.bio && (
          <>
            <hr className="divider" />
            <p style={{ fontSize: '15px', lineHeight: '1.7', color: 'var(--text)' }}>{animateur.bio}</p>
          </>
        )}

        <hr className="divider" />

        <div className="profile-meta">
          {animateur.email && (
            <div className="meta-row">
              <span className="meta-label">Email</span>
              <a href={`mailto:${animateur.email}`}>{animateur.email}</a>
            </div>
          )}
          {animateur.telephone && (
            <div className="meta-row">
              <span className="meta-label">Téléphone</span>
              <a href={`tel:${animateur.telephone}`}>{animateur.telephone}</a>
            </div>
          )}
          {(animateur.ville || animateur.region) && (
            <div className="meta-row">
              <span className="meta-label">Localisation</span>
              <span>{[animateur.ville, animateur.region].filter(Boolean).join(', ')}</span>
            </div>
          )}
          <div className="meta-row">
            <span className="meta-label">Membre depuis</span>
            <span>{new Date(animateur.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        {animateur.competences.length > 0 && (
          <>
            <hr className="divider" />
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '10px', fontWeight: 500 }}>Compétences</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {animateur.competences.map((comp, i) => {
                const tc = TAG_COLORS[i % TAG_COLORS.length]
                return (
                  <span key={comp} style={{
                    fontSize: '13px', padding: '4px 12px', borderRadius: '20px',
                    background: tc.bg, color: tc.text, border: `0.5px solid ${tc.border}`
                  }}>{comp}</span>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
