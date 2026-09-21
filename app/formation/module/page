'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

interface Module {
  id: string
  titre: string
  titre_en?: string
  description?: string
  description_en?: string
  ordre: number
  actif: boolean
}

interface Progression {
  module_id: string
  completed: boolean
  attempts: number
}

export default function ModulesPage() {
  const { lang } = useLanguage()
  const [modules, setModules] = useState<Module[]>([])
  const [progressions, setProgressions] = useState<Progression[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      setUserId(user.id)
      const [{ data: mods }, { data: progs }] = await Promise.all([
        supabase.from('modules').select('*').eq('actif', true).order('ordre'),
        supabase.from('progressions').select('*').eq('animateur_id', user.id)
      ])
      setModules(mods || [])
      setProgressions(progs || [])
      setLoading(false)
    }
    load()
  }, [])

  const getProgression = (moduleId: string) => progressions.find(p => p.module_id === moduleId)
  const completedCount = progressions.filter(p => p.completed).length

  if (loading) return <div className="container"><div className="empty"><p>Chargement…</p></div></div>

  return (
    <div className="container" style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <a href="/formation" style={{ fontSize: 13, color: 'var(--text2)' }}>
              ← {lang === 'en' ? 'Training' : 'Se former'}
            </a>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>
            {lang === 'en' ? 'Training modules' : 'Modules de formation'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
            {completedCount} / {modules.length} {lang === 'en' ? 'module(s) completed' : 'module(s) validé(s)'}
          </p>
        </div>
        <LanguageSwitch />
      </div>

      {modules.length === 0 ? (
        <div className="empty">
          <p>{lang === 'en' ? 'No module available yet.' : 'Aucun module disponible pour l\'instant.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {modules.map((m, i) => {
            const prog = getProgression(m.id)
            const completed = prog?.completed || false
            const titre = lang === 'en' && m.titre_en ? m.titre_en : m.titre
            const description = lang === 'en' && m.description_en ? m.description_en : m.description

            return (
              <a key={m.id} href={`/formation/modules/${m.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '1.25rem 1.5rem',
                  background: 'var(--bg)',
                  border: completed ? '1.5px solid #5DCAA5' : '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  textDecoration: 'none', color: 'inherit',
                  transition: 'all .15s',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.transform = 'translateY(-1px)'
                  el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = 'none'
                }}>

                {/* Numéro du module */}
                <div style={{
                  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                  background: completed ? '#E1F5EE' : 'var(--bg2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: completed ? 22 : 16,
                  fontWeight: 700,
                  color: completed ? '#085041' : 'var(--text2)',
                }}>
                  {completed ? '✓' : i + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                    {titre}
                  </div>
                  {description && (
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>{description}</div>
                  )}
                  <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                    {completed ? (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#E1F5EE', color: '#085041', border: '0.5px solid #5DCAA5', fontWeight: 500 }}>
                        ✓ {lang === 'en' ? 'Completed' : 'Validé'}
                      </span>
                    ) : prog?.attempts ? (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--bg2)', color: 'var(--text2)', border: '0.5px solid var(--border)' }}>
                        {lang === 'en' ? `${prog.attempts} attempt(s)` : `${prog.attempts} tentative(s)`}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '0.5px solid #AFA9EC' }}>
                        {lang === 'en' ? 'Not started' : 'Non commencé'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Macaron si validé */}
                {completed && (
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #085041, #5DCAA5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                    boxShadow: '0 2px 8px rgba(8,80,65,0.3)',
                  }}>
                    🏅
                  </div>
                )}

                {!completed && <div style={{ color: 'var(--text3)', fontSize: 20 }}>›</div>}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
