'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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
  const [completedModules, setCompletedModules] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    Promise.all([
      supabase.from('animateurs').select('*').eq('id', id).single(),
      supabase.auth.getUser(),
      supabase.from('progressions').select('id').eq('animateur_id', id).eq('completed', true)
    ]).then(([{ data }, { data: { user } }, { data: progs }]) => {
      setAnimateur(data)
      setCurrentUserId(user?.id || null)
      setCompletedModules((progs || []).length)
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
          <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
            <div className="avatar avatar-lg" style={{ background: c.bg, color: c.text }}>
              {animateur.photo_url ? <img src={animateur.photo_url} alt={animateur.nom} /> : initials(animateur.nom)}
            </div>
            {completedModules > 0 && (
              <div style={{
                position: 'absolute', bottom: -2, right: -6,
                width: 32, height: 32, borderRadius: '50%',
                background: '#040F1D',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(0,184,107,0.7)',
                border: '2px solid #00B86B',
              }} title={`${completedModules} module(s) validé(s) — MAÎTRISE IA`}>
                <svg width="20" height="20" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="200" height="200" rx="20" fill="#040F1D"/>
                  <path d="M20 100 L58 100 L58 58 L100 58" stroke="#00B86B" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M180 100 L142 100 L142 58 L100 58" stroke="#00B86B" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M100 180 L100 142 L142 142 L142 100" stroke="#00B86B" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M100 20 L100 58 L58 58 L58 100" stroke="#00B86B" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="60" y="60" width="80" height="80" rx="8" fill="#0D1F3C" stroke="#2D5AA8" strokeWidth="6"/>
                  <rect x="74" y="74" width="52" height="52" rx="4" fill="#060E1A"/>
                  {([[85,85],[100,85],[115,85],[85,100],[115,100],[85,115],[100,115],[115,115]] as [number,number][]).map(([cx,cy],i)=>(<circle key={i} cx={cx} cy={cy} r="5.5" fill="#1A6AC8"/>))}
                  <rect x="90" y="90" width="20" height="20" rx="3" fill="#0A2050" stroke="#2D6AC8" strokeWidth="4"/>
                </svg>
              </div>
            )}
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

        {(animateur.badge_observateur || animateur.badge_coanimateur) && (
          <>
            <hr className="divider" />
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '10px', fontWeight: 500 }}>Niveaux</div>
            <BadgesDisplay badge_observateur={animateur.badge_observateur} badge_coanimateur={animateur.badge_coanimateur} />
          </>
        )}

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
