'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Animateur } from '@/lib/types'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

export default function VeillePage() {
  const { lang } = useLanguage()
  const [me, setMe] = useState<Animateur | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const { data } = await supabase.from('animateurs').select('*').eq('id', user.id).single()
      setMe(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="container"><div className="empty"><p>Chargement…</p></div></div>

  const categories = [
    {
      href: '/veille/droit',
      icon: '⚖️',
      labelFr: 'Veille IA & Droit',
      labelEn: 'Legal Watch',
      descFr: "Réglementations, lois et actualités juridiques autour de l'IA.",
      descEn: 'Regulations, laws and legal news around AI.',
      color: '#E6F1FB',
      textColor: '#0C447C',
      border: '#85B7EB',
    },
    {
      href: '/veille/usage',
      icon: '🔍',
      labelFr: "Veille Cas d'usage IA",
      labelEn: 'AI Use Cases Watch',
      descFr: "Exemples concrets et retours d'expérience sur les usages de l'IA.",
      descEn: 'Concrete examples and feedback on AI use cases.',
      color: '#E1F5EE',
      textColor: '#085041',
      border: '#5DCAA5',
    },
    {
      href: '/veille/rse',
      icon: '🌱',
      labelFr: 'Veille RSE & IA',
      labelEn: 'CSR & AI Watch',
      descFr: "Responsabilité sociale, impact environnemental et éthique de l'IA.",
      descEn: 'Social responsibility, environmental impact and AI ethics.',
      color: '#EAF3DE',
      textColor: '#27500A',
      border: '#97C459',
    },
  ]

  return (
    <div className="container" style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <a href="/annuaire" style={{ fontSize: 13, color: 'var(--text2)' }}>
              ← {lang === 'en' ? 'My facilitator space' : 'Mon espace fresqueur'}
            </a>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>{lang === 'en' ? 'AI Watch' : 'Veille IA'}</h1>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 4 }}>
            {lang === 'en' ? 'Stay up to date with AI news and regulations.' : "Restez informé des actualités et réglementations IA."}
          </p>
        </div>
        <LanguageSwitch />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {categories.map((c, i) => (
          <a key={i} href={c.href}
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
              el.style.borderColor = c.border
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
              background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
            }}>
              {c.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                {lang === 'en' ? c.labelEn : c.labelFr}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                {lang === 'en' ? c.descEn : c.descFr}
              </div>
            </div>
            <div style={{ color: 'var(--text3)', fontSize: 20 }}>›</div>
          </a>
        ))}
      </div>
    </div>
  )
}
