'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

interface Module {
  id: string
  titre: string
  titre_en?: string
  ordre: number
}

interface Progression {
  module_id: string
  completed: boolean
  completed_at?: string
  attempts: number
}

export default function ProgressionPage() {
  const { lang } = useLanguage()
  const [modules, setModules] = useState<Module[]>([])
  const [progressions, setProgressions] = useState<Progression[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const [{ data: mods }, { data: progs }] = await Promise.all([
        supabase.from('modules').select('id, titre, titre_en, ordre').eq('actif', true).order('ordre'),
        supabase.from('progressions').select('*').eq('animateur_id', user.id)
      ])
      setModules(mods || [])
      setProgressions(progs || [])
      setLoading(false)
    }
    load()
  }, [])

  const getProgression = (moduleId: string) => progressions.find(p => p.module_id === moduleId)
  const completedModules = modules.filter(m => getProgression(m.id)?.completed)
  const totalModules = modules.length
  const percent = totalModules > 0 ? Math.round((completedModules.length / totalModules) * 100) : 0

  if (loading) return <div className="container"><div className="empty"><p>Chargement…</p></div></div>

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <a href="/formation" style={{ fontSize: 13, color: 'var(--text2)' }}>
              ← {lang === 'en' ? 'Training' : 'Se former'}
            </a>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>
            {lang === 'en' ? 'My progress' : 'Ma progression'}
          </h1>
        </div>
        <LanguageSwitch />
      </div>

      {/* Barre de progression globale */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>
            {lang === 'en' ? 'Overall progress' : 'Progression globale'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{percent}%</div>
        </div>
        <div style={{ background: 'var(--bg2)', borderRadius: 20, height: 10, overflow: 'hidden' }}>
          <div style={{
            width: `${percent}%`, height: '100%',
            background: percent === 100
              ? 'linear-gradient(90deg, #085041, #5DCAA5)'
              : 'var(--accent)',
            borderRadius: 20,
            transition: 'width .5s',
          }} />
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8 }}>
          {completedModules.length} / {totalModules} {lang === 'en' ? 'module(s) completed' : 'module(s) validé(s)'}
        </div>
        {percent === 100 && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#E1F5EE', borderRadius: 8, fontSize: 13, color: '#085041', fontWeight: 500 }}>
            🎉 {lang === 'en' ? 'Congratulations! You have completed all modules.' : 'Félicitations ! Vous avez validé tous les modules.'}
          </div>
        )}
      </div>

      {/* Macarons obtenus */}
      {completedModules.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: '1rem' }}>
            🏅 {lang === 'en' ? 'Earned badges' : 'Macarons obtenus'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            {completedModules.map(m => {
              const prog = getProgression(m.id)
              const titre = lang === 'en' && m.titre_en ? m.titre_en : m.titre
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, maxWidth: 90 }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: '#040F1D',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(0,184,107,0.5)',
                    border: '2px solid #00B86B',
                  }}>
                    <svg width="44" height="44" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="200" height="200" rx="20" fill="#040F1D"/>
                      <path d="M20 100 L58 100 L58 58 L100 58" stroke="#00B86B" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M180 100 L142 100 L142 58 L100 58" stroke="#00B86B" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M100 180 L100 142 L142 142 L142 100" stroke="#00B86B" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M100 20 L100 58 L58 58 L58 100" stroke="#00B86B" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="60" y="60" width="80" height="80" rx="8" fill="#0D1F3C" stroke="#2D5AA8" strokeWidth="6"/>
                      <rect x="74" y="74" width="52" height="52" rx="4" fill="#060E1A"/>
                      {([[85,85],[100,85],[115,85],[85,100],[115,100],[85,115],[100,115],[115,115]] as [number,number][]).map(([cx,cy],i)=>(<circle key={i} cx={cx} cy={cy} r="5.5" fill="#1A6AC8"/>))}
                      <rect x="90" y="90" width="20" height="20" rx="3" fill="#0A2050" stroke="#2D6AC8" strokeWidth="4"/>
                      <text x="100" y="103" textAnchor="middle" fontSize="9" fill="white" fontWeight="900" fontFamily="monospace">AI</text>
                      {[60,80,100,120,140].map((pos,i)=>[
                        <rect key={`t${i}`} x={pos-5} y="0" width="10" height="14" rx="2" fill="#B8860B"/>,
                        <rect key={`b${i}`} x={pos-5} y="186" width="10" height="14" rx="2" fill="#B8860B"/>,
                        <rect key={`l${i}`} x="0" y={pos-5} width="14" height="10" rx="2" fill="#B8860B"/>,
                        <rect key={`r${i}`} x="186" y={pos-5} width="14" height="10" rx="2" fill="#B8860B"/>,
                      ])}
                    </svg>
                  </div>
                  <div style={{ fontSize: 11, textAlign: 'center', color: 'var(--text)', fontWeight: 500, lineHeight: 1.3 }}>
                    {titre}
                  </div>
                  {prog?.completed_at && (
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                      {new Date(prog.completed_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short' })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Détail par module */}
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: '1rem' }}>
        {lang === 'en' ? 'Module details' : 'Détail par module'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {modules.map((m, i) => {
          const prog = getProgression(m.id)
          const completed = prog?.completed || false
          const titre = lang === 'en' && m.titre_en ? m.titre_en : m.titre
          return (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
              background: 'var(--bg)',
              border: completed ? '1.5px solid #5DCAA5' : '0.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: completed ? '#E1F5EE' : 'var(--bg2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: completed ? 16 : 13,
                fontWeight: 700,
                color: completed ? '#085041' : 'var(--text2)',
              }}>
                {completed ? '✓' : i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{titre}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                  {completed
                    ? `${lang === 'en' ? 'Validated on' : 'Validé le'} ${prog?.completed_at ? new Date(prog.completed_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR') : ''}`
                    : prog?.attempts
                      ? `${prog.attempts} ${lang === 'en' ? 'attempt(s)' : 'tentative(s)'}`
                      : lang === 'en' ? 'Not started' : 'Non commencé'
                  }
                </div>
              </div>
              <a href={`/formation/modules/${m.id}`} className="btn btn-sm">
                {completed
                  ? (lang === 'en' ? 'Review' : 'Revoir')
                  : (lang === 'en' ? 'Start' : 'Commencer')}
              </a>
            </div>
          )
        })}
      </div>
    </div>
  )
}
