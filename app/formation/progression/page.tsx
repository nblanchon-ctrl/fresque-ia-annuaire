'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

interface Module {
  id: string
  titre: string
  titre_en?: string
  ordre: number
  slug?: string
}

interface Progression {
  module_id: string
  completed: boolean
  completed_at?: string
  attempts: number
}

const COLORS = [
  { bg: '#EEEDFE', text: '#3C3489' }, { bg: '#E1F5EE', text: '#085041' },
  { bg: '#FAECE7', text: '#993C1D' }, { bg: '#E6F1FB', text: '#0C447C' },
  { bg: '#FAEEDA', text: '#633806' }, { bg: '#FBEAF0', text: '#72243E' },
]
function colorFor(id: string) {
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return COLORS[n % COLORS.length]
}
function initials(nom: string) {
  return nom.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?'
}

function PCBBadge({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" rx="100" fill="#DFFBEE"/>
      <path d="M20 100 L58 100 L58 58 L100 58" stroke="#00A85E" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M180 100 L142 100 L142 58 L100 58" stroke="#00A85E" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M100 180 L100 142 L142 142 L142 100" stroke="#00A85E" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M100 20 L100 58 L58 58 L58 100" stroke="#00A85E" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="60" y="60" width="80" height="80" rx="8" fill="#C6F0DA" stroke="#00A85E" strokeWidth="5"/>
      <rect x="74" y="74" width="52" height="52" rx="4" fill="#E8FBF2"/>
      {([[85,85],[100,85],[115,85],[85,100],[115,100],[85,115],[100,115],[115,115]] as [number,number][]).map(([cx,cy],i)=>(<circle key={i} cx={cx} cy={cy} r="5" fill="#00A85E"/>))}
      <rect x="90" y="90" width="20" height="20" rx="3" fill="#007A44" stroke="#00A85E" strokeWidth="3"/>
      <text x="100" y="103" textAnchor="middle" fontSize="9" fill="white" fontWeight="900" fontFamily="monospace">AI</text>
    </svg>
  )
}

function JusticeBadge({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" rx="100" fill="#FEF3D0"/>
      <rect x="97" y="45" width="6" height="110" fill="#C9A84C"/>
      <rect x="65" y="152" width="70" height="9" rx="4" fill="#C9A84C"/>
      <rect x="35" y="55" width="130" height="7" rx="3" fill="#C9A84C"/>
      <line x1="53" y1="62" x2="53" y2="95" stroke="#C9A84C" strokeWidth="3.5"/>
      <ellipse cx="53" cy="101" rx="26" ry="8" fill="#FEE8A0" stroke="#C9A84C" strokeWidth="3"/>
      <path d="M27 99 Q53 116 79 99" fill="none" stroke="#C9A84C" strokeWidth="3.5"/>
      <line x1="147" y1="62" x2="147" y2="85" stroke="#C9A84C" strokeWidth="3.5"/>
      <ellipse cx="147" cy="91" rx="26" ry="8" fill="#FEE8A0" stroke="#C9A84C" strokeWidth="3"/>
      <path d="M121 89 Q147 106 173 89" fill="none" stroke="#C9A84C" strokeWidth="3.5"/>
    </svg>
  )
}

function CritiqueIABadge({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="96" fill="#FEF9EC" stroke="#C9A84C" strokeWidth="4"/>
      <circle cx="100" cy="100" r="88" fill="none" stroke="#E8D5A0" strokeWidth="1"/>
      <ellipse cx="108" cy="68" rx="26" ry="28" fill="#1a1a2e"/>
      <rect x="96" y="92" width="16" height="14" rx="4" fill="#1a1a2e"/>
      <path d="M60 106 Q78 100 96 106 L112 106 Q132 108 142 118 L142 148 L60 148 Z" fill="#1a1a2e"/>
      <path d="M72 116 Q62 118 58 126 Q55 134 62 140 Q68 144 76 140" stroke="#1a1a2e" strokeWidth="9" strokeLinecap="round" fill="none"/>
      <ellipse cx="80" cy="86" rx="9" ry="7" fill="#1a1a2e"/>
      <circle cx="148" cy="72" r="7" fill="#C9A84C" opacity="0.9"/>
      <text x="148" y="76" textAnchor="middle" fontSize="8" fill="white" fontWeight="900">I</text>
      <ellipse cx="155" cy="95" rx="8" ry="5" fill="none" stroke="#C9A84C" strokeWidth="2"/>
      <circle cx="155" cy="95" r="2.5" fill="#C9A84C"/>
      <path d="M147 112 L162 112" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M159 108 L164 112 L159 116" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <text x="100" y="172" textAnchor="middle" fontSize="10" fill="#8B6914" fontWeight="800" fontFamily="sans-serif" letterSpacing="1">ESPRIT CRITIQUE IA</text>
      <text x="100" y="184" textAnchor="middle" fontSize="7.5" fill="#C9A84C" fontFamily="sans-serif" letterSpacing="0.5">Parcours valide</text>
    </svg>
  )
}

export default function ProgressionPage() {
  const { lang } = useLanguage()
  const [modules, setModules] = useState<Module[]>([])
  const [progressions, setProgressions] = useState<Progression[]>([])
  const [animateur, setAnimateur] = useState<{nom: string; photo_url: string | null; id: string} | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const [{ data: mods }, { data: progs }, { data: anim }] = await Promise.all([
        supabase.from('modules').select('id, titre, titre_en, ordre, slug').eq('actif', true).order('ordre'),
        supabase.from('progressions').select('*').eq('animateur_id', user.id),
        supabase.from('animateurs').select('nom, photo_url, id').eq('id', user.id).single(),
      ])
      setModules(mods || [])
      setProgressions(progs || [])
      setAnimateur(anim)
      setLoading(false)
    }
    load()
  }, [])

  const getProgression = (moduleId: string) => progressions.find(p => p.module_id === moduleId)
  const completedModules = modules.filter(m => getProgression(m.id)?.completed)
  const completedSlugs = completedModules.map(m => m.slug).filter(Boolean)
  const totalModules = modules.length
  const percent = totalModules > 0 ? Math.round((completedModules.length / totalModules) * 100) : 0

  // Badge logic
  const hasPCB = completedModules.some(m => !m.slug)
  const hasDroit = completedSlugs.includes('droit')
  const hasCritique = ['intelligence','conscience','decision'].every(s => completedSlugs.includes(s))

  // Which badge to show per completed module
  const getBadgeForModule = (m: Module) => {
    if (m.slug === 'droit') return { Badge: JusticeBadge, label: lang === 'en' ? 'AI & Law' : 'Droit & IA', color: '#C9A84C', border: '#C9A84C', bg: '#FEF3D0' }
    if (m.slug === 'intelligence' || m.slug === 'conscience' || m.slug === 'decision') return null // shown as groupe
    return { Badge: PCBBadge, label: lang === 'en' ? '4 Ages of AI' : '4 âges de l\'IA', color: '#00A85E', border: '#00A85E', bg: '#DFFBEE' }
  }

  // Module link
  const getModuleLink = (m: Module) => {
    if (m.slug) return `/formation/modules/${m.slug}`
    return `/formation/modules/${m.id}`
  }

  if (loading) return <div className="container"><div className="empty"><p>Chargement…</p></div></div>

  const c = animateur ? colorFor(animateur.id) : { bg: '#EEEDFE', text: '#3C3489' }
  const badgeList = [
    ...(hasPCB ? [{ Badge: PCBBadge, col: '#00A85E' }] : []),
    ...(hasDroit ? [{ Badge: JusticeBadge, col: '#C9A84C' }] : []),
    ...(hasCritique ? [{ Badge: CritiqueIABadge, col: '#C9A84C' }] : []),
  ]
  const badgePos = badgeList.length === 1 ? [{ bottom: 0, right: -4 }] : badgeList.length === 2 ? [{ bottom: 0, right: -4 }, { bottom: 0, left: -4 }] : [{ bottom: 0, right: -4 }, { bottom: -14, right: 8 }, { bottom: 0, left: -4 }]

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

      {/* Photo profil avec badges */}
      {animateur && (
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div className="avatar avatar-lg" style={{ background: c.bg, color: c.text }}>
              {animateur.photo_url ? <img src={animateur.photo_url} alt={animateur.nom} /> : initials(animateur.nom)}
            </div>
            {badgeList.map(({ Badge, col }, i) => (
              <div key={i} style={{ position: 'absolute', ...badgePos[i], width: 28, height: 28, borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: '2px solid white', background: 'white' }}>
                <Badge size={28}/>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{animateur.nom}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
              {completedModules.length} / {totalModules} {lang === 'en' ? 'module(s) completed' : 'module(s) validé(s)'}
            </div>
          </div>
        </div>
      )}

      {/* Barre de progression globale */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>
            {lang === 'en' ? 'Overall progress' : 'Progression globale'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{percent}%</div>
        </div>
        <div style={{ background: 'var(--bg2)', borderRadius: 20, height: 10, overflow: 'hidden' }}>
          <div style={{ width: `${percent}%`, height: '100%', background: percent === 100 ? 'linear-gradient(90deg, #085041, #5DCAA5)' : 'var(--accent)', borderRadius: 20, transition: 'width .5s' }} />
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
      {(hasPCB || hasDroit || hasCritique) && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: '1rem' }}>
            🏅 {lang === 'en' ? 'Earned badges' : 'Macarons obtenus'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
            {hasPCB && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, maxWidth: 100 }}>
                <PCBBadge size={72}/>
                <div style={{ fontSize: 11, textAlign: 'center', color: 'var(--text)', fontWeight: 500, lineHeight: 1.3 }}>
                  {lang === 'en' ? '4 Ages of AI' : '4 âges de l\'IA'}
                </div>
              </div>
            )}
            {hasDroit && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, maxWidth: 100 }}>
                <JusticeBadge size={72}/>
                <div style={{ fontSize: 11, textAlign: 'center', color: 'var(--text)', fontWeight: 500, lineHeight: 1.3 }}>
                  {lang === 'en' ? 'AI & Law' : 'Droit & IA'}
                </div>
              </div>
            )}
            {hasCritique && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, maxWidth: 100 }}>
                <CritiqueIABadge size={72}/>
                <div style={{ fontSize: 11, textAlign: 'center', color: 'var(--text)', fontWeight: 500, lineHeight: 1.3 }}>
                  {lang === 'en' ? 'Critical AI Thinking' : 'Esprit Critique IA'}
                </div>
              </div>
            )}
          </div>
          {hasCritique && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: '#FEF3D0', borderRadius: 8, fontSize: 13, color: '#8B6914', fontWeight: 500 }}>
              ✦ {lang === 'en' ? 'Intelligence · Consciousness · Decision-making — all three completed.' : 'Intelligence · Conscience · Prise de décision — les trois validés.'}
            </div>
          )}
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
          const badge = completed ? getBadgeForModule(m) : null
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--bg)', border: completed ? '1.5px solid #5DCAA5' : '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: completed ? '#E1F5EE' : 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: completed ? 16 : 13, fontWeight: 700, color: completed ? '#085041' : 'var(--text2)' }}>
                {completed ? '✓' : i + 1}
              </div>
              {badge && (
                <div style={{ flexShrink: 0 }}>
                  <badge.Badge size={32}/>
                </div>
              )}
              {completed && !badge && (
                <div style={{ flexShrink: 0, fontSize: 20 }}>
                  {m.slug === 'intelligence' ? '🧠' : m.slug === 'conscience' ? '💡' : m.slug === 'decision' ? '⚖️' : '✅'}
                </div>
              )}
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
              <a href={getModuleLink(m)} className="btn btn-sm">
                {completed ? (lang === 'en' ? 'Review' : 'Revoir') : (lang === 'en' ? 'Start' : 'Commencer')}
              </a>
            </div>
          )
        })}
      </div>
    </div>
  )
}
