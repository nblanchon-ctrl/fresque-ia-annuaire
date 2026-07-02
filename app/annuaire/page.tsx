'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Animateur } from '@/lib/types'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

export default function EspacePage() {
  const { t } = useLanguage()
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return <div className="container"><div className="empty"><p>{t('common.loading')}</p></div></div>

  const buttons = [
    {
      href: '/fresqueurs',
      icon: '👥',
      label: t('Annuaire'),
      desc: t('Retrouvez tous les animateurs de la communauté'),
      color: '#EEEDFE',
      textColor: '#3C3489',
      border: '#AFA9EC',
    },
    {
      href: '/agenda',
      icon: '📅',
      label: t('Agenda'),
      desc: t('Retrouvez tous les événements de la communauté'),
      color: '#E1F5EE',
      textColor: '#085041',
      border: '#5DCAA5',
    },
    {
      href: 'https://community.lafresquedelia.com/la-fresque-de-lia/channels/town-square',
      icon: '💬',
      label: 'Mattermost',
      desc: t('Accédez à l'outil de chat de la communauté'),
      color: '#E6F1FB',
      textColor: '#0C447C',
      border: '#85B7EB',
      external: true,
    },
    {
      href: 'https://drive.google.com/drive/u/0/folders/15CjtB5Mw-vdrBguv4VdQtWgMU7A6lEq4',
      icon: '📁',
      label: t('Drive'),
      desc: t('Retrouvez l'ensemble des ressources documentaires de la communauté'),
      color: '#FAEEDA',
      textColor: '#633806',
      border: '#EF9F27',
      external: true,
    },
    {
      href: 'https://fresquedelia.ovh/',
      icon: '🃏',
      label: t('Cartes de la Fresque'),
      desc: t('Retrouvez l'ensemble des cartes de La Fresque de l'IA'),
      color: '#FAECE7',
      textColor: '#993C1D',
      border: '#F0997B',
      external: true,
    },
  ]

  return (
    <div className="container" style={{ maxWidth: 700 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>
            {t('espace.welcome')}, <strong>{me?.nom}</strong>
            {me?.is_admin && <span className="badge badge-admin" style={{ marginLeft: 8 }}>Admin</span>}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)' }}>{t('espace.title')}</h1>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 4 }}>{t('espace.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <LanguageSwitch />
          <a href="/dashboard" className="btn btn-sm">{t('nav.myProfile')}</a>
          {me?.is_admin && <a href="/admin" className="btn btn-sm">{t('nav.admin')}</a>}
          <button className="btn btn-sm" onClick={handleLogout}>{t('nav.logout')}</button>
        </div>
      </div>

      {/* 5 boutons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {buttons.map((b, i) => (
          <a
            key={i}
            href={b.href}
            target={b.external ? '_blank' : undefined}
            rel={b.external ? 'noopener noreferrer' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 18,
              padding: '1.25rem 1.5rem',
              background: 'var(--bg)',
              border: `0.5px solid var(--border)`,
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none', color: 'inherit',
              transition: 'border-color .15s, transform .1s, box-shadow .15s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = b.border
              ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'
              ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)'
              ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'
              ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 14, flexShrink: 0,
              background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24
            }}>
              {b.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                {b.label}
                {b.external && <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>↗</span>}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{b.desc}</div>
            </div>
            <div style={{ color: 'var(--text3)', fontSize: 20 }}>›</div>
          </a>
        ))}
      </div>
    </div>
  )
}
