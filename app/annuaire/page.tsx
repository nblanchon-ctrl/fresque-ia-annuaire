'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Animateur } from '@/lib/types'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

type NotifCounts = { veille: number; agenda: number; crm: number }

function Badge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <div style={{
      position: 'absolute', top: -4, right: -4,
      minWidth: 18, height: 18, borderRadius: 9,
      background: '#FF4B4B', color: 'white',
      fontSize: 11, fontWeight: 800,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 4px', boxShadow: '0 1px 4px rgba(255,75,75,0.5)',
      border: '2px solid white',
    }}>
      {count > 9 ? '9+' : count}
    </div>
  )
}

export default function EspacePage() {
  const { t, lang } = useLanguage()
  const [me, setMe] = useState<Animateur | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifs, setNotifs] = useState<NotifCounts>({ veille: 0, agenda: 0, crm: 0 })
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const { data } = await supabase.from('animateurs').select('*').eq('id', user.id).single()
      setMe(data)

      // Charger les compteurs
      try {
        const res = await fetch('/api/notifications')
        const counts = await res.json()
        setNotifs(counts)
      } catch {}

      // Vérifier permission notifs
      if ('Notification' in window) {
        setNotifPermission(Notification.permission)
      }

      setLoading(false)
    }
    load()
  }, [])

  async function requestPermission() {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    setNotifPermission(perm)
  }

  async function markRead(type: 'veille' | 'agenda' | 'crm') {
    if (notifs[type] === 0) return
    setNotifs(prev => ({ ...prev, [type]: 0 }))
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
    } catch {}
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return <div className="container"><div className="empty"><p>{t('common.loading')}</p></div></div>

  const buttons = [
    {
      href: '/fresqueurs', icon: '👥',
      label: lang === 'en' ? 'Directory' : 'Annuaire',
      desc: lang === 'en' ? 'Find all facilitators, their profiles and skills.' : 'Retrouvez tous les animateurs de la communauté.',
      color: '#EEEDFE', textColor: '#3C3489', border: '#AFA9EC',
      notifType: null as null | 'veille' | 'agenda' | 'crm',
    },
    {
      href: '/agenda', icon: '📅',
      label: lang === 'en' ? 'Calendar' : 'Agenda',
      desc: lang === 'en' ? 'Upcoming events, workshops and meetups.' : 'Événements, interventions et rencontres à venir.',
      color: '#E1F5EE', textColor: '#085041', border: '#5DCAA5',
      notifType: 'agenda' as const,
    },
    {
      href: '/veille', icon: '📡',
      label: lang === 'en' ? 'AI Watch' : 'Veille IA',
      desc: lang === 'en' ? 'Legal and use cases watch documents.' : "Documents de veille IA droit et cas d'usage.",
      color: '#FAEEDA', textColor: '#633806', border: '#EF9F27',
      notifType: 'veille' as const,
    },
    {
      href: '/crm', icon: '🤝',
      label: 'CRM',
      desc: lang === 'en' ? 'Clients, prospects and event spaces.' : 'Clients, prospects et espaces de prospection.',
      color: '#E1F0FF', textColor: '#1a4a7a', border: '#5B9BD5',
      notifType: 'crm' as const,
    },
    {
      href: 'https://community.lafresquedelia.com/la-fresque-de-lia/channels/town-square',
      icon: '💬', label: 'Mattermost',
      desc: lang === 'en' ? "Fresque de l'IA community chat." : "Chat de la communauté Fresque de l'IA.",
      color: '#E6F1FB', textColor: '#0C447C', border: '#85B7EB',
      external: true, notifType: null as null | 'veille' | 'agenda' | 'crm',
    },
    {
      href: 'https://drive.google.com/drive/u/0/folders/15CjtB5Mw-vdrBguv4VdQtWgMU7A6lEq4',
      icon: '📁', label: 'Drive',
      desc: lang === 'en' ? 'Community resources and tools.' : 'Ressources documentaires et outils de la communauté.',
      color: '#EAF3DE', textColor: '#27500A', border: '#97C459',
      external: true, notifType: null as null | 'veille' | 'agenda' | 'crm',
    },
    {
      href: 'https://fresquedelia.ovh/', icon: '🃏',
      label: lang === 'en' ? 'Fresco cards' : 'Cartes de la fresque',
      desc: lang === 'en' ? 'Access the complete card reference.' : 'Accédez au référentiel complet des cartes.',
      color: '#FBEAF0', textColor: '#72243E', border: '#F0997B',
      external: true, notifType: null as null | 'veille' | 'agenda' | 'crm',
    },
  ]

  const totalNotifs = notifs.veille + notifs.agenda + notifs.crm

  return (
    <div className="container" style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>
            {lang === 'en' ? 'Hello' : 'Bonjour'}, <strong>{me?.nom}</strong>
            {me?.is_admin && <span className="badge badge-admin" style={{ marginLeft: 8 }}>Admin</span>}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)' }}>
            {lang === 'en' ? 'My facilitator space' : 'Mon espace fresqueur'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <LanguageSwitch />
          <a href="/formation" className="btn btn-sm btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            🎓 {lang === 'en' ? 'Training' : 'Se former'}
          </a>
          <a href="/dashboard" className="btn btn-sm">{t('nav.myProfile')}</a>
          {me?.is_admin && <a href="/admin" className="btn btn-sm">{t('nav.admin')}</a>}
          <button className="btn btn-sm" onClick={handleLogout}>{t('nav.logout')}</button>
        </div>
      </div>

      {/* Demande de permission notifications navigateur */}
      {notifPermission === 'default' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#E6F1FB', borderRadius: 12, border: '1.5px solid #85B7EB', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: 22 }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0C447C' }}>Activez les notifications</div>
            <div style={{ fontSize: 12, color: '#0C447C' }}>Soyez alerté dans votre navigateur quand un document, événement ou client est ajouté.</div>
          </div>
          <button onClick={requestPermission} style={{ padding: '7px 16px', borderRadius: 10, background: '#1a1a2e', color: 'white', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
            Activer
          </button>
        </div>
      )}

      {/* Résumé notifications non lues */}
      {totalNotifs > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#FFF9E6', borderRadius: 12, border: '1.5px solid #FFC800', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: 18 }}>🔔</span>
          <div style={{ fontSize: 13, color: '#8B5E00' }}>
            <strong>{totalNotifs} nouvelle{totalNotifs > 1 ? 's' : ''} notification{totalNotifs > 1 ? 's' : ''}</strong> depuis votre dernière visite
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {buttons.map((b, i) => (
          <a
            key={i}
            href={b.href}
            target={b.external ? '_blank' : undefined}
            rel={b.external ? 'noopener noreferrer' : undefined}
            onClick={() => { if (b.notifType) markRead(b.notifType) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 18,
              padding: '1.25rem 1.5rem',
              background: 'var(--bg)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none', color: 'inherit',
              transition: 'border-color .15s, transform .1s, box-shadow .15s',
              cursor: 'pointer',
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
            }}
          >
            <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                {b.icon}
              </div>
              {b.notifType && <Badge count={notifs[b.notifType]} />}
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
