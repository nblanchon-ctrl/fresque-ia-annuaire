'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

export default function FormationPage() {
  const { lang } = useLanguage()
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/'
      else setLoading(false)
    })
  }, [])

  if (loading) return <div className="container"><div className="empty"><p>Chargement…</p></div></div>

  const buttons = [
    {
      href: '/formation/modules',
      icon: '📚',
      label: lang === 'en' ? 'Training modules' : 'Modules de formation',
      desc: lang === 'en'
        ? 'Access all training modules and take the quizzes.'
        : 'Accédez à tous les modules de formation et passez les quiz.',
      color: '#EEEDFE',
      textColor: '#3C3489',
      border: '#AFA9EC',
    },
    {
      href: '/formation/progression',
      icon: '🏅',
      label: lang === 'en' ? 'My progress' : 'Ma progression',
      desc: lang === 'en'
        ? 'View your completed modules and earned badges.'
        : 'Consultez vos modules validés et vos macarons obtenus.',
      color: '#E1F5EE',
      textColor: '#085041',
      border: '#5DCAA5',
    },
  ]

  return (
    <div className="container" style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <a href="/annuaire" style={{ fontSize: 13, color: 'var(--text2)' }}>
              ← {lang === 'en' ? 'My space' : 'Mon espace fresqueur'}
            </a>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>
            {lang === 'en' ? 'Training' : 'Se former'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 4 }}>
            {lang === 'en'
              ? 'Deepen your knowledge of the AI Fresco.'
              : 'Approfondissez vos connaissances sur la Fresque de l\'IA.'}
          </p>
        </div>
        <LanguageSwitch />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {buttons.map((b, i) => (
          <a key={i} href={b.href}
            style={{
              display: 'flex', alignItems: 'center', gap: 18,
              padding: '1.25rem 1.5rem',
              background: 'var(--bg)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none', color: 'inherit',
              transition: 'border-color .15s, transform .1s, box-shadow .15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.borderColor = b.border
              el.style.transform = 'translateY(-1px)'
              el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.borderColor = 'var(--border)'
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = 'none'
            }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, flexShrink: 0,
              background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
            }}>
              {b.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{b.label}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{b.desc}</div>
            </div>
            <div style={{ color: 'var(--text3)', fontSize: 20 }}>›</div>
          </a>
        ))}
      </div>
    </div>
  )
}
