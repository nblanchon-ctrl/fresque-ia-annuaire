'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

const TOTAL_LEARNING = 16

const QUIZ = [
  { q: "Pourquoi une IA n'est-elle pas juridiquement responsable aujourd'hui ?", opts: ["Elle n'a pas de personnalite juridique reconnue par le droit","Ses createurs ont signe des contrats la protegeant","La technologie evolue trop vite pour les tribunaux","Les IA sont des logiciels non saisissables"], correct: 0, expl: "La personnalite juridique est la cle. Elle permet d'etre titulaire de droits et d'obligations. Les personnes physiques et morales en ont une. Les IA, non." },
  { q: "Qu'est-ce que la personnalite juridique permet ?", opts: ["D'exercer une profession sans diplome","D'etre titulaire de droits et d'obligations","De beneficier de toutes les aides sociales","De signer un contrat sans intermediaire"], correct: 1, expl: "La personnalite juridique permet au droit de s'adresser a une entite : lui reconnaitre des droits et lui imposer des obligations. Sans elle, une entite est juridiquement invisible." },
  { q: "En droit, responsabilite et conscience sont-elles synonymes ?", opts: ["Oui, on ne peut etre responsable sans avoir eu conscience de ses actes","Non, on peut reparer un dommage sans l'avoir consciemment voulu","Oui, mais uniquement en matiere penale","Non, mais seulement en droit civil continental"], correct: 1, expl: "Responsabilite et conscience sont distinctes. Notre droit connait de nombreux cas de responsabilite sans intention : responsabilite du fait des choses, des parents, etc." },
  { q: "Qu'avait envisage le Parlement europeen dans sa resolution de 2017 ?", opts: ["Interdire tout developpement d'IA autonome en Europe","Creer un impot special sur les robots","Examiner un statut juridique pour certains robots autonomes","Transferer la regulation de l'IA a l'ONU"], correct: 2, expl: "En 2017, le Parlement europeen a evoque la possibilite d'un statut juridique pour certains robots autonomes. Cette piste n'est pas devenue droit positif mais la question est prise au serieux." },
  { q: "Si une IA contribue a une mauvaise decision medicale, sur qui le droit cherche-t-il la responsabilite ?", opts: ["Sur le patient uniquement","Sur personne : les IA medicales ont une immunite","Sur le concepteur, l'editeur, l'hopital ou le medecin selon les cas","Sur l'ingenieur du dernier correctif uniquement"], correct: 2, expl: "Puisque l'IA n'est pas responsable, le droit cherche parmi les humains : concepteur, editeur, etablissement, professionnel. Plusieurs acteurs peuvent etre responsables simultanement." },
  { q: "La Convention europeenne des droits de l'homme date de :", opts: ["1789, apres la Revolution francaise","1945, apres la guerre","1950, apres la Seconde Guerre mondiale","2000, avec la Charte de l'UE"], correct: 2, expl: "La CEDH date de 1950. Ces textes anciens s'appliquent aujourd'hui a des realites technologiques que leurs auteurs n'imaginaient pas." },
  { q: "Quel est le principal apport de l'article 22 du RGPD ?", opts: ["Il oblige a nommer un DPO","Il interdit tout traitement automatise","Il encadre les decisions fondees exclusivement sur un traitement automatise","Il cree une autorite europeenne de l'IA"], correct: 2, expl: "L'article 22 encadre les decisions prises exclusivement par algorithme (sans intervention humaine) qui produisent des effets juridiques sur une personne. Un outil existant avant l'AI Act." },
  { q: "Quelle est la logique centrale de l'AI Act europeen ?", opts: ["Interdire tout systeme ne pouvant expliquer ses decisions","Classer les systemes d'IA par niveau de risque et adapter les obligations","Imposer une taxe sur l'IA en Europe","Creer un label de confiance attribue par les Etats membres"], correct: 1, expl: "L'AI Act classe par niveau de risque : certaines pratiques interdites, systemes a haut risque avec obligations renforcees, obligations de transparence pour d'autres." },
  { q: "Quel principe oriente l'objectif declare de l'AI Act ?", opts: ["Assurer la suprematie technologique europeenne","Promouvoir une IA centree sur l'humain et protectrice des droits fondamentaux","Simplifier les regles pour favoriser les startups","Transferer la gouvernance a l'ONU"], correct: 1, expl: "L'AI Act affirme vouloir promouvoir une IA centree sur l'humain et digne de confiance, en protegerant les droits fondamentaux de la Charte europeenne." },
  { q: "Qu'est-ce que le Digital Omnibus ?", opts: ["Un bus autonome deploye en Europe","Un accord UE/Etats-Unis sur l'IA","Des mesures de simplification du cadre numerique europeen","Un consortium de financement de l'IA"], correct: 2, expl: "Le Digital Omnibus designe des mesures de simplification du cadre numerique, dont l'AI Act. Il illustre la tension entre protection des citoyens et competitivite face aux acteurs americains et chinois." },
  { q: "Contre qui visaient d'abord les droits fondamentaux a proteger l'individu ?", opts: ["Les citoyens plus riches","Les entreprises etrangeres","La puissance publique susceptible d'abuser de son pouvoir","Les mouvements religieux"], correct: 2, expl: "Les grands textes fondamentaux visaient a proteger l'individu contre l'Etat. La numerisation a fait emerger un second defi : l'individu face aux grandes entreprises privees." },
  { q: "Quel type de pouvoir les grandes plateformes exercent-elles desormais ?", opts: ["Un pouvoir militaire comparable aux Etats","Le pouvoir de selectionner l'info, profiler et influencer des decisions","Un pouvoir fiscal direct sur les utilisateurs","Le pouvoir legislatif de creer leurs propres lois"], correct: 1, expl: "Les plateformes rendent visible ou invisible un contenu, collectent des donnees, profilent, influencent des decisions. Avec l'IA generative, elles participent directement a la prise de decision." },
  { q: "Comment distingue-t-on la conscience de sa simulation chez une IA ?", opts: ["En mesurant la vitesse de ses reponses","En verifiant si elle utilise des neurones biologiques","C'est le probleme : nous n'avons pas de critere etabli","En appliquant le test de Turing pendant 48h"], correct: 2, expl: "Nous ne disposons pas d'une definition stabilisee de la conscience humaine. Comment alors determiner qu'une machine est consciente et non qu'elle simule des comportements conscients ?" },
  { q: "Quelle question fondamentale le droit de l'IA cherche-t-il a repondre ?", opts: ["Comment breveter un algorithme ?","Quelle puissance minimale pour etre reglemente ?","Quelle place donner a la machine dans les decisions concernant les humains ?","Comment taxer les benefices des IA ?"], correct: 2, expl: "Derriere toutes les regles se cache une question fondamentale : quelle place voulons-nous donner a la machine dans les decisions concernant des etres humains ? Une question juridique, ethique et philosophique." },
  { q: "Le RGPD est-il un texte specifiquement consacre a l'IA ?", opts: ["Oui, concu pour les IA generatives","Oui, mais uniquement pour les IA de sante","Non, mais il s'applique des qu'une IA traite des donnees personnelles","Non, le RGPD n'a aucun lien avec l'IA"], correct: 2, expl: "Le RGPD n'est pas un texte sur l'IA. Il date d'avant l'explosion de l'IA generative. Mais des qu'un systeme d'IA traite des donnees personnelles, le RGPD s'applique, notamment via l'article 22." },
]

const PHASE_CELEBRATIONS = [
  { atStep: 4, icon: "⚖️", title: "Bonne base juridique !", sub: "Tu comprends pourquoi les IA ne repondent pas de leurs actes. Passons a la conscience.", color: "#0C447C", bg: "#E6F1FB" },
  { atStep: 8, icon: "🎯", title: "Question centrale atteinte !", sub: "Si la machine ne repond pas, qui repond ? On explore maintenant les droits fondamentaux.", color: "#2B7400", bg: "#D7FFB8" },
  { atStep: 12, icon: "🏛️", title: "Contexte historique maitrise !", sub: "Tu saisis comment des textes anciens s'appliquent a des technologies nouvelles. Place au RGPD.", color: "#633806", bg: "#FAEEDA" },
  { atStep: 16, icon: "🌍", title: "Introduction complete !", sub: "Tu es pret a explorer les mecanismes juridiques concrets. Le quiz t'attend !", color: "#534AB7", bg: "#EEEDFE" },
]


function JusticeBadge({ size = 100 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" rx="20" fill="#0C1A2E"/>
      {/* Base et tige */}
      <rect x="97" y="60" width="6" height="100" fill="#C9A84C"/>
      <rect x="70" y="155" width="60" height="8" rx="4" fill="#C9A84C"/>
      {/* Barre horizontale */}
      <rect x="40" y="62" width="120" height="6" rx="3" fill="#C9A84C"/>
      {/* Chaine gauche */}
      <line x1="55" y1="68" x2="55" y2="95" stroke="#C9A84C" strokeWidth="2.5"/>
      {/* Plateau gauche */}
      <ellipse cx="55" cy="100" rx="22" ry="6" fill="none" stroke="#C9A84C" strokeWidth="2.5"/>
      <path d="M33 98 Q55 112 77 98" fill="none" stroke="#C9A84C" strokeWidth="2.5"/>
      {/* Chaine droite */}
      <line x1="145" y1="68" x2="145" y2="88" stroke="#C9A84C" strokeWidth="2.5"/>
      {/* Plateau droit (penché - déséquilibre symbolique) */}
      <ellipse cx="145" cy="93" rx="22" ry="6" fill="none" stroke="#C9A84C" strokeWidth="2.5"/>
      <path d="M123 91 Q145 105 167 91" fill="none" stroke="#C9A84C" strokeWidth="2.5"/>
      {/* Étoiles */}
      <circle cx="55" cy="100" r="3" fill="#F0D080" opacity="0.7"/>
      <circle cx="145" cy="93" r="3" fill="#F0D080" opacity="0.7"/>
      {/* Texte */}
      <text x="100" y="180" textAnchor="middle" fontSize="8" fill="#C9A84C" fontWeight="800" fontFamily="monospace" letterSpacing="1.5">DROIT & IA</text>
    </svg>
  )
}

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    color: ['#58CC02','#FFC800','#FF4B4B','#1CB0F6','#CE82FF','#FF9600'][i % 6],
    left: `${(i * 3.6) % 100}%`,
    delay: `${(i * 0.07).toFixed(2)}s`,
    duration: `${0.75 + (i % 5) * 0.12}s`,
    size: 7 + (i % 4) * 3,
  }))
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', pointerEvents: 'none', overflow: 'hidden' }}>
      <style>{`@keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(320px) rotate(720deg);opacity:0}}`}</style>
      {pieces.map((p, i) => (
        <div key={i} style={{ position: 'absolute', top: 0, left: p.left, width: p.size, height: p.size / 2, background: p.color, borderRadius: 2, animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards` }}/>
      ))}
    </div>
  )
}

function CelebrationModal({ data, onContinue }: { data: typeof PHASE_CELEBRATIONS[0], onContinue: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.72)', padding: '20px' }}>
      <style>{`@keyframes popIn{0%{transform:scale(0.4);opacity:0}65%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}} @keyframes bounceIcon{0%,100%{transform:translateY(0)}45%{transform:translateY(-14px)}}`}</style>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <Confetti />
        <div style={{ background: 'white', borderRadius: 28, padding: '40px 32px', textAlign: 'center', maxWidth: 360, width: '100%', animation: 'popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards', boxShadow: '0 28px 64px rgba(0,0,0,0.35)', position: 'relative' }}>
          <div style={{ fontSize: 68, marginBottom: 8, animation: 'bounceIcon 1.2s 0.5s ease-in-out infinite', display: 'block' }}>{data.icon}</div>
          <div style={{ display: 'inline-block', background: data.bg, color: data.color, fontSize: 11, fontWeight: 800, padding: '4px 16px', borderRadius: 20, marginBottom: 14, letterSpacing: 1, textTransform: 'uppercase' as const }}>Phase complete !</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a2e', marginBottom: 10, lineHeight: 1.3 }}>{data.title}</h2>
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.65, marginBottom: 28 }}>{data.sub}</p>
          <button onClick={onContinue} style={{ width: '100%', padding: '16px', borderRadius: 16, background: '#58CC02', color: 'white', border: 'none', fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 0 #3D8A00' }}>
            Continuer →
          </button>
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ step, phase }: { step: number, phase: number }) {
  const pct = Math.round((step / (TOTAL_LEARNING + QUIZ.length)) * 100)
  const phases = ['⚖️', '🎯', '🏛️', '📋', '🌍']
  return (
    <div style={{ padding: '10px 16px', background: 'var(--bg)', borderBottom: '0.5px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ flex: 1, height: 6, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #58CC02, #89E219)', borderRadius: 3, transition: 'width .4s' }}/>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', minWidth: 30 }}>{pct}%</span>
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        {phases.map((p, i) => (
          <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, background: i < phase ? '#E1F5EE' : i === phase ? 'var(--accent)' : 'var(--bg2)', border: `2px solid ${i === phase ? 'var(--accent)' : 'transparent'}` }}>
            {i < phase ? '✓' : p}
          </div>
        ))}
      </div>
    </div>
  )
}

function FeedbackBar({ correct, expl, onNext, last }: { correct: boolean, expl: string, onNext: () => void, last: boolean }) {
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: correct ? '#D7FFB8' : '#FFDFE0', borderTop: `4px solid ${correct ? '#58CC02' : '#FF4B4B'}`, padding: '16px 20px 28px', zIndex: 100 }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: correct ? '#2B7400' : '#CC0000', marginBottom: 6 }}>
          {correct ? 'Correct ✓' : 'Pas tout a fait ✗'}
        </div>
        <p style={{ fontSize: 13, color: correct ? '#2B7400' : '#990000', lineHeight: 1.6, marginBottom: 12 }}>{expl}</p>
        <button onClick={onNext} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: correct ? '#58CC02' : '#FF4B4B', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: correct ? '0 4px 0 #3D8A00' : '0 4px 0 #CC0000' }}>
          {last ? 'Voir mes resultats →' : 'Continuer →'}
        </button>
      </div>
    </div>
  )
}

function Wrap({ children, onNext, onPrev, canNext = true, nextLabel = 'Continuer →' }: {
  children: React.ReactNode, onNext?: () => void, onPrev?: () => void, canNext?: boolean, nextLabel?: string
}) {
  return (
    <div style={{ padding: '20px 16px 110px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ animation: 'fadeIn 0.25s ease' }}>{children}</div>
      {(onNext || onPrev) && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px 22px', background: 'white', borderTop: '1px solid #E5E5E5', zIndex: 10 }}>
          <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', gap: 10 }}>
            {onPrev && <button onClick={onPrev} style={{ padding: '15px 18px', borderRadius: 16, border: '2px solid #E5E5E5', background: 'white', color: '#888', fontWeight: 700, fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>←</button>}
            {onNext && <button onClick={onNext} disabled={!canNext} style={{ flex: 1, padding: '15px', borderRadius: 16, border: 'none', background: canNext ? '#58CC02' : '#E5E5E5', color: canNext ? 'white' : '#AFAFAF', fontWeight: 800, fontSize: 15, cursor: canNext ? 'pointer' : 'default', boxShadow: canNext ? '0 4px 0 #3D8A00' : 'none' }}>{nextLabel}</button>}
          </div>
        </div>
      )}
    </div>
  )
}

function Tag({ children, color }: { children: React.ReactNode, color: string }) {
  return <div style={{ display: 'inline-block', background: color, fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, marginBottom: 12 }}>{children}</div>
}

export default function ModulePage() {
  const { lang } = useLanguage()
  const [userId, setUserId] = useState<string | null>(null)
  const [moduleId, setModuleId] = useState<string | null>(null)
  const [moduleTitle, setModuleTitle] = useState('IA & Droit')
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [celebration, setCelebration] = useState<typeof PHASE_CELEBRATIONS[0] | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUIZ.length).fill(null))
  const [feedback, setFeedback] = useState<boolean | null>(null)
  const [showFb, setShowFb] = useState(false)
  const [score, setScore] = useState(0)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/'; return }
      setUserId(user.id)
      // Fetch module by title since this page has a static route
      supabase.from('modules').select('id, titre').eq('titre', 'IA & Droit').single().then(({ data }) => {
        if (data) { setModuleId(data.id); setModuleTitle(data.titre) }
        setLoading(false)
      })
    })
  }, [])

  const next = () => {
    const nextStep = step + 1
    const cel = PHASE_CELEBRATIONS.find(c => c.atStep === nextStep)
    if (cel) { setCelebration(cel) } else { setStep(nextStep) }
  }
  const prev = () => { if (step > 0) setStep(s => s - 1) }
  const closeCelebration = () => {
    if (celebration) { setStep(celebration.atStep); setCelebration(null) }
  }

  const qIdx = step - TOTAL_LEARNING
  const isQuiz = step >= TOTAL_LEARNING && step < TOTAL_LEARNING + QUIZ.length
  const isResult = step >= TOTAL_LEARNING + QUIZ.length
  const phase = step < 4 ? 0 : step < 8 ? 1 : step < 12 ? 2 : step < 16 ? 3 : 4

  const pickAnswer = async (optIdx: number) => {
    if (answers[qIdx] !== null) return
    const correct = QUIZ[qIdx].correct === optIdx
    const na = [...answers]; na[qIdx] = optIdx; setAnswers(na)
    setFeedback(correct); setShowFb(true)
    if (correct) setScore(s => s + 1)
    if (step === TOTAL_LEARNING + QUIZ.length - 1 && !saved) {
      setSaved(true)
      const finalScore = score + (correct ? 1 : 0)
      await supabase.from('progressions').upsert({
        animateur_id: userId!, module_id: moduleId,
        completed: finalScore === QUIZ.length,
        completed_at: finalScore === QUIZ.length ? new Date().toISOString() : null,
        attempts: 1,
      }, { onConflict: 'animateur_id,module_id' })
    }
  }

  const nextQuiz = () => { setShowFb(false); setFeedback(null); next() }

  if (loading) return <div className="container"><div className="empty"><p>Chargement…</p></div></div>

  const header = (
    <div style={{ position: 'sticky', top: 0, zIndex: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'white', borderBottom: '0.5px solid var(--border)' }}>
        <a href="/formation/modules" style={{ fontSize: 16, color: '#AFAFAF', fontWeight: 700, textDecoration: 'none', lineHeight: 1 }}>✕</a>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#555', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{moduleTitle}</span>
        <LanguageSwitch />
      </div>
      {!isResult && <ProgressBar step={step} phase={phase} />}
    </div>
  )

  if (isQuiz) {
    const q = QUIZ[qIdx]
    const ua = answers[qIdx]
    const labels = ['A','B','C','D']
    return (
      <div style={{ minHeight: '100vh', background: '#F7F7F7' }}>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
        {celebration && <CelebrationModal data={celebration} onContinue={closeCelebration}/>}
        {header}
        <div style={{ padding: '20px 16px 120px', maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#534AB7', marginBottom: 12 }}>Question {qIdx + 1} / {QUIZ.length}&nbsp;·&nbsp;Score {score}</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.5, marginBottom: 20 }}>{q.q}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.opts.map((opt, i) => {
              const sel = ua === i, cor = i === q.correct, shown = ua !== null
              return (
                <button key={i} onClick={() => pickAnswer(i)} disabled={shown} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '16px 18px', borderRadius: 14, border: `2.5px solid ${!shown ? '#E5E5E5' : cor ? '#58CC02' : sel ? '#FF4B4B' : '#E5E5E5'}`, background: !shown ? 'white' : cor ? '#D7FFB8' : sel ? '#FFDFE0' : 'white', cursor: shown ? 'default' : 'pointer', textAlign: 'left', width: '100%' }}>
                  <span style={{ minWidth: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0, background: !shown ? '#F0F0F0' : cor ? '#58CC02' : sel ? '#FF4B4B' : '#F0F0F0', color: !shown ? '#888' : (cor || sel) ? 'white' : '#888' }}>{!shown ? labels[i] : cor ? '✓' : sel ? '✗' : labels[i]}</span>
                  <span style={{ fontSize: 15, lineHeight: 1.5, color: '#1a1a2e', fontWeight: 500 }}>{opt}</span>
                </button>
              )
            })}
          </div>
        </div>
        {showFb && <FeedbackBar correct={feedback!} expl={q.expl} onNext={nextQuiz} last={qIdx === QUIZ.length - 1} />}
      </div>
    )
  }

  if (isResult) {
    const total = answers.filter((a, i) => a === QUIZ[i].correct).length
    const pct = Math.round((total / QUIZ.length) * 100)
    const wrongs = answers.map((a, i) => a !== QUIZ[i].correct ? i : -1).filter(x => x >= 0)
    const restart = () => { setStep(TOTAL_LEARNING); setAnswers(Array(QUIZ.length).fill(null)); setScore(0); setShowFb(false); setFeedback(null); setSaved(false) }
    return (
      <div style={{ minHeight: '100vh', background: '#F7F7F7' }}>
        {header}
        <div style={{ padding: '24px 16px 40px', maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            {pct === 100 ? (
              <div style={{ animation: 'fadeIn .5s ease' }}>
                <div style={{ marginBottom: 12 }}><JusticeBadge size={96} /></div>
                <div style={{ display: 'inline-block', background: '#0C1A2E', color: '#C9A84C', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20, marginBottom: 8, letterSpacing: 1 }}>BADGE DÉBLOQUÉ ✦</div>
                <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>MAITRISE DROIT & IA</h2>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#C9A84C', marginBottom: 8 }}>{QUIZ.length} / {QUIZ.length} : 100 %</div>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>Parfait ! Tu maitrises les fondamentaux du droit de l'IA.</p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 52, marginBottom: 12 }}>{pct >= 80 ? '🎯' : '💪'}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#534AB7', marginBottom: 8 }}>{total} / {QUIZ.length}</div>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>{pct >= 80 ? "Beau parcours !" : "Continue a apprendre !"}</p>
              </div>
            )}
          </div>
          {wrongs.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 10 }}>Questions manquees :</div>
              {wrongs.map(i => (
                <div key={i} style={{ padding: 12, background: '#FAECE7', borderRadius: 10, border: '0.5px solid #F0997B', marginBottom: 8, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Q{i+1}. {QUIZ[i].q.substring(0, 70)}...</div>
                  <div style={{ color: '#085041' }}>Bonne reponse : {QUIZ[i].opts[QUIZ[i].correct]}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={restart} style={{ width: '100%', padding: '15px', borderRadius: 16, border: 'none', background: '#58CC02', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 0 #3D8A00' }}>Refaire le quiz</button>
            <button onClick={() => { window.location.href = '/formation/modules' }} style={{ width: '100%', padding: '15px', borderRadius: 16, border: '2px solid #E5E5E5', background: 'white', color: '#555', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>← Retour aux modules</button>
          </div>
        </div>
      </div>
    )
  }

  const s = step
  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {celebration && <CelebrationModal data={celebration} onContinue={closeCelebration}/>}
      {header}

      {s === 0 && <Wrap onNext={next} nextLabel="Commencer →">
        <div style={{ textAlign: 'center', padding: '12px 0', animation: 'fadeIn .4s ease' }}>
          <div style={{ fontSize: 56, marginBottom: 14 }}>⚖️</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10, lineHeight: 1.3 }}>IA & Droit</h1>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 20 }}>Qui repond quand une IA provoque un dommage ? Ce module explore les fondements juridiques qui encadrent l'IA en Europe.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            {[['⚖️','Responsabilite & personnalite juridique'],['🧠','La question de la conscience'],['🛡️','Les droits fondamentaux'],['📋','RGPD & AI Act'],['🌍','Geopolitique du droit de l\'IA']].map(([icon,label],i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: 'white', borderRadius: 12, width: '100%', maxWidth: 300, border: '0.5px solid #E5E5E5' }}>
                <span style={{ fontSize: 18 }}>{icon}</span><span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </Wrap>}

      {s === 1 && <Wrap onNext={next} onPrev={prev}>
        <Tag color="#E6F1FB"><span style={{ color: '#0C447C' }}>⚖️ PARTIE 1 — Responsabilite</span></Tag>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, lineHeight: 1.3 }}>Une IA peut agir…<br/>mais peut-elle repondre de ses actes ?</h2>
        <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7, marginBottom: 16 }}>Lorsqu'on parle d'IA et de droit, une question surgit immediatement : <strong>celle de la responsabilite.</strong></p>
        <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '18px 20px', marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: 'white', textAlign: 'center', lineHeight: 1.5 }}>Aujourd'hui, une IA n'est pas juridiquement responsable.</div>
        </div>
        <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7 }}>Pourquoi ? Parce qu'une IA n'a pas de <strong>personnalite juridique</strong>. En droit, cette personnalite appartient aux <strong>personnes physiques</strong> (etres humains) et <strong>morales</strong> (entreprises, associations). Une IA n'entre dans aucune de ces categories.</p>
      </Wrap>}

      {s === 2 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14, color: '#1a1a2e' }}>Peut-on condamner ChatGPT ?</h3>
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 16 }}>Etre responsable signifie que le droit peut imputer a une personne les consequences de certains actes. Selon les situations :</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {[['👤','Personne physique','Amende, indemnisation, prison','#EEEDFE','#3C3489'],['🏢','Personne morale','Sanctions financieres, interdictions, dissolution','#E1F5EE','#085041'],['🤖','Intelligence artificielle','???','#FFDFE0','#CC0000']].map(([icon,type,sanction,bg,color]) => (
            <div key={String(type)} style={{ padding: '14px 16px', background: bg as string, borderRadius: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: color as string, marginBottom: 4 }}>{icon} {type}</div>
              <div style={{ fontSize: 13, color: color as string }}>{sanction}</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#FFF9E6', borderRadius: 12, padding: '14px 16px', border: '1.5px solid #FFC800' }}>
          <p style={{ fontSize: 13, color: '#8B5E00', lineHeight: 1.6, margin: 0 }}>En l'etat actuel du droit : non. On ne peut pas condamner ChatGPT a 3 ans de prison. On ne peut pas demander a un algorithme de verser 100 000 euros de dommages.</p>
        </div>
      </Wrap>}

      {s === 3 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14, color: '#1a1a2e' }}>Et demain ? Une personnalite juridique pour les machines ?</h3>
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 14 }}>La question est plus profonde qu'il n'y parait. La litterature juridique s'interroge sur l'eventualite de reconnaitre une personnalite juridique a certaines machines.</p>
        <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #E5E5E5', overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ padding: '12px 16px', background: '#534AB7', color: 'white' }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Parlement europeen, 2017</div>
          </div>
          <div style={{ padding: '14px 16px' }}>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, margin: 0 }}>Dans une resolution sur la robotique, le Parlement europeen a evoque la possibilite d'examiner un <strong>statut juridique specifique</strong> pour certains robots autonomes. Cette piste n'est pas devenue droit positif, mais elle ouvre une reflexion importante.</p>
          </div>
        </div>
        <div style={{ background: '#F8F9FF', borderRadius: 14, padding: '14px 16px', border: '1.5px solid #AFA9EC' }}>
          <p style={{ fontSize: 13, color: '#534AB7', lineHeight: 1.7, margin: 0 }}>A quelles conditions accepterions-nous qu'une machine reponde elle-meme de ses actes ? Si elle ne comprend pas ce qu'elle fait, n'eprouve aucune intention et ne possede aucune conscience… dans quelle mesure aurait-il du sens de la punir ?</p>
        </div>
      </Wrap>}

      {s === 4 && <Wrap onNext={next} onPrev={prev} nextLabel="Phase suivante →">
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14, color: '#1a1a2e' }}>La question de la conscience</h3>
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 14 }}>La conscience des machines pose une difficulte fondamentale : nous ne disposons meme pas d'une definition universelle de ce qu'est la conscience humaine.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div style={{ padding: 14, background: '#E1F5EE', borderRadius: 14, border: '1.5px solid #5DCAA5' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>😮</div>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#085041', marginBottom: 4 }}>Ce qu'une IA peut faire</div>
            <div style={{ fontSize: 11, color: '#085041', lineHeight: 1.5 }}>Produire des phrases donnant l'impression qu'elle ressent, hesite, reflechit…</div>
          </div>
          <div style={{ padding: 14, background: '#FFDFE0', borderRadius: 14, border: '1.5px solid #FF4B4B' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>🚫</div>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#CC0000', marginBottom: 4 }}>Ce qu'on ne peut pas etablir</div>
            <div style={{ fontSize: 11, color: '#CC0000', lineHeight: 1.5 }}>Qu'elle possede une experience subjective ou une conscience comparable a la notre.</div>
          </div>
        </div>
        <div style={{ background: '#E6F1FB', borderRadius: 14, padding: '14px 16px', border: '1.5px solid #85B7EB' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0C447C', marginBottom: 6 }}>La nuance juridique essentielle</div>
          <p style={{ fontSize: 13, color: '#0C447C', lineHeight: 1.7, margin: 0 }}>Responsabilite et conscience ne sont pas synonymes. Notre droit connait deja des situations ou l'on repond d'un dommage sans l'avoir voulu. La question d'une personnalite juridique de l'IA est donc plus large que celle de sa conscience.</p>
        </div>
      </Wrap>}

      {s === 5 && <Wrap onNext={next} onPrev={prev}>
        <Tag color="#D7FFB8"><span style={{ color: '#2B7400' }}>PARTIE 2 — Qui repond ?</span></Tag>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, lineHeight: 1.3 }}>Si la machine n'est pas responsable… qui l'est ?</h2>
        <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7, marginBottom: 16 }}>C'est <strong>la question centrale de ce module.</strong> Le droit doit chercher la responsabilite ailleurs.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['Son concepteur ?','L\'entreprise qui commercialise le systeme ?','L\'organisation qui decide de l\'utiliser ?','Le professionnel qui s\'appuie sur sa recommandation ?','Plusieurs acteurs simultanement ?'].map((q, i) => (
            <div key={i} style={{ padding: '10px 14px', background: 'white', borderRadius: 10, border: '0.5px solid #E5E5E5', fontSize: 13, color: '#1a1a2e', display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ color: '#534AB7', fontWeight: 800 }}>→</span>{q}
            </div>
          ))}
        </div>
      </Wrap>}

      {s === 6 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14, color: '#1a1a2e' }}>Le droit surgit quand quelque chose se passe mal</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {[['💼','Un algorithme refuse votre candidature a un emploi'],['🏦','Un systeme vous refuse un credit'],['🏥','Une IA medicale contribue a une mauvaise decision'],['👤','Un systeme de reconnaissance faciale vous identifie a tort'],['⚠️','Un algorithme reproduit une discrimination a votre encontre']].map(([icon,txt]) => (
            <div key={String(txt)} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', background: '#FFF9E6', borderRadius: 12, border: '1px solid #FFC800' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: 13, color: '#8B5E00', fontWeight: 500 }}>{txt}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'white', textAlign: 'center', marginBottom: 4 }}>Qui est responsable ?</div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>Quels sont mes droits ?</div>
        </div>
      </Wrap>}

      {s === 7 && <Wrap onNext={next} onPrev={prev} nextLabel="Phase suivante →">
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14, color: '#1a1a2e' }}>Avant les regles sur l'IA : les droits fondamentaux</h3>
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 14 }}>Notre parcours remonte d'abord a la hierarchie des normes :</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[['🕊️','Dignite humaine'],['🗽','Liberte'],['⚖️','Egalite'],['🚫','Non-discrimination'],['🔒','Vie privee'],['📊','Protection des donnees'],['📢','Liberte d\'expression'],['🏛️','Droit a un recours']].map(([icon,label]) => (
            <div key={String(label)} style={{ padding: '10px 12px', background: 'white', borderRadius: 12, border: '0.5px solid #E5E5E5', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e' }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#E6F1FB', borderRadius: 14, padding: '14px 16px', border: '1.5px solid #85B7EB' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0C447C', marginBottom: 6 }}>Le role du juge</div>
          <p style={{ fontSize: 13, color: '#0C447C', lineHeight: 1.7, margin: 0 }}>Confronte a une situation nouvelle, le juge interprete les textes existants et determine comment les principes s'appliquent a des realites technologiques que leurs redacteurs n'avaient pas imaginees.</p>
        </div>
      </Wrap>}

      {s === 8 && <Wrap onNext={next} onPrev={prev} nextLabel="Phase suivante →">
        <Tag color="#FAEEDA"><span style={{ color: '#633806' }}>PARTIE 3 — Contexte historique</span></Tag>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, lineHeight: 1.3 }}>Des droits anciens confrontes a un monde nouveau</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {[['1789','Declaration des droits de l\'homme','Revolution francaise'],['1950','Convention europeenne des droits de l\'homme','Apres la 2e Guerre mondiale'],['2000','Charte des droits fondamentaux de l\'UE','Traite de Lisbonne (2009)']].map(([year,text,ctx]) => (
            <div key={year} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', background: 'white', borderRadius: 12, border: '0.5px solid #E5E5E5' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#AFA9EC', minWidth: 48, textAlign: 'center' }}>{year}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>{text}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{ctx}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: '#FAEEDA', borderRadius: 14, padding: '14px 16px', border: '1.5px solid #EF9F27' }}>
          <p style={{ fontSize: 13, color: '#633806', lineHeight: 1.7, margin: 0 }}>Ces textes doivent aujourd'hui s'appliquer a des realites — IA generative, algorithmes de recommandation, profilage de masse — que leurs redacteurs n'imaginaient pas.</p>
        </div>
      </Wrap>}

      {s === 9 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14, color: '#1a1a2e' }}>De la puissance publique… aux pouvoirs numeriques</h3>
        <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '16px 18px', marginBottom: 14, textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'white', marginBottom: 4 }}>Comment empecher l'Etat d'abuser de son pouvoir ?</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Police · Justice · Administration · Norme</div>
        </div>
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 14 }}>Cette question reste fondamentale. Mais la numerisation en a fait apparaitre une autre :</p>
        <div style={{ background: '#534AB7', borderRadius: 14, padding: '16px 18px', textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'white', lineHeight: 1.5 }}>Comment proteger l'individu lorsque certains pouvoirs autrefois reserves aux Etats sont detenus par des acteurs prives transnationaux ?</div>
        </div>
      </Wrap>}

      {s === 10 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14, color: '#1a1a2e' }}>Les nouveaux pouvoirs numeriques</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {[['🔍','Pouvoir de selectionner l\'information et rendre un contenu visible ou invisible'],['📊','Pouvoir de collecter, exploiter des donnees et profiler des individus'],['🎯','Pouvoir d\'influencer certaines decisions'],['🤖','Avec l\'IA : pouvoir de participer directement a la prise de decision']].map(([icon,txt]) => (
            <div key={String(txt)} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 14px', background: '#EEEDFE', borderRadius: 12, border: '1px solid #AFA9EC' }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: 13, color: '#3C3489', lineHeight: 1.55 }}>{txt}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#E6F1FB', borderRadius: 14, padding: '14px 16px', border: '1.5px solid #85B7EB' }}>
          <p style={{ fontSize: 13, color: '#0C447C', lineHeight: 1.7, margin: 0 }}>C'est cette transformation qui explique la reponse europeenne a l'IA. Le droit de l'IA ne peut pas etre etudie independamment de l'economie et de la geopolitique.</p>
        </div>
      </Wrap>}

      {s === 11 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14, color: '#1a1a2e' }}>Le droit n'est pas reste immobile : le RGPD</h3>
        <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #E5E5E5', overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ padding: '12px 16px', background: '#003189', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 24 }}>🇪🇺</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>RGPD</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Reglement General sur la Protection des Donnees — 2018</div>
            </div>
          </div>
          <div style={{ padding: '14px 16px' }}>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, marginBottom: 10 }}>Le RGPD n'est pas un texte sur l'IA. Mais des qu'un systeme d'IA traite des donnees personnelles, il peut devenir central.</p>
            <div style={{ background: '#E6F1FB', borderRadius: 10, padding: '12px 14px', border: '1px solid #85B7EB' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#0C447C', marginBottom: 4 }}>Article 22 — Decisions automatisees</div>
              <p style={{ fontSize: 12, color: '#0C447C', lineHeight: 1.6, margin: 0 }}>Encadre les decisions fondees <strong>exclusivement</strong> sur un traitement automatise qui produisent des effets juridiques ou affectent significativement une personne.</p>
            </div>
          </div>
        </div>
        <div style={{ background: '#FFF9E6', borderRadius: 14, padding: '14px 16px', border: '1.5px solid #FFC800' }}>
          <p style={{ fontSize: 13, color: '#8B5E00', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>Le droit de l'IA n'a pas commence avec l'AI Act.</p>
        </div>
      </Wrap>}

      {s === 12 && <Wrap onNext={next} onPrev={prev} nextLabel="Phase suivante →">
        <Tag color="#EEEDFE"><span style={{ color: '#3C3489' }}>PARTIE 4 — AI Act & geopolitique</span></Tag>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, lineHeight: 1.3 }}>Puis arrive l'AI Act</h2>
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 14 }}>Sa logique est differente du RGPD. Il construit un cadre autour des <strong>systemes d'IA, de leurs usages et des risques qu'ils generent.</strong></p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {[['🚫','Certaines pratiques sont interdites','#FFDFE0','#CC0000'],['⚠️','Certains systemes = haut risque avec obligations renforcees','#FAEEDA','#633806'],['ℹ️','Certaines utilisations = obligations de transparence','#E6F1FB','#0C447C'],['🤖','Modeles a usage general = regles specifiques','#EEEDFE','#3C3489']].map(([icon,txt,bg,color]) => (
            <div key={String(txt)} style={{ padding: '12px 14px', background: bg as string, borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: 13, color: color as string, fontWeight: 600, lineHeight: 1.4 }}>{txt}</span>
            </div>
          ))}
        </div>
      </Wrap>}

      {s === 13 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14, color: '#1a1a2e' }}>De quoi le legislateur cherche-t-il a nous proteger ?</h3>
        <div style={{ background: '#003189', borderRadius: 16, padding: '20px', marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🇪🇺</div>
          <p style={{ fontSize: 14, color: 'white', lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>Promouvoir une intelligence artificielle centree sur l'humain et digne de confiance, tout en assurant un niveau eleve de protection des droits fondamentaux.</p>
        </div>
        <div style={{ background: '#E6F1FB', borderRadius: 14, padding: '14px 16px', border: '1.5px solid #85B7EB' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0C447C', marginBottom: 6 }}>Posture animateur</div>
          <p style={{ fontSize: 13, color: '#0C447C', lineHeight: 1.7, margin: 0 }}>L'AI Act n'est pas une loi contre l'IA. C'est une tentative de faire en sorte que l'IA reste au service de l'humain et respecte ses droits fondamentaux.</p>
        </div>
      </Wrap>}

      {s === 14 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14, color: '#1a1a2e' }}>Cette conception europeenne est sous tension</h3>
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 14 }}>Depuis l'entree en vigueur de l'AI Act, sa mise en oeuvre fait l'objet de discussions et de mesures de simplification.</p>
        <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #E5E5E5', overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ padding: '12px 16px', background: '#F0F0F4', borderBottom: '1px solid #E5E5E5' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#1a1a2e' }}>Le Digital Omnibus</div>
          </div>
          <div style={{ padding: '14px 16px' }}>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, margin: 0 }}>La Commission europeenne a propose des mesures visant a <strong>simplifier</strong> l'application du cadre numerique et de l'AI Act. Derriere se joue un debat plus large.</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['Comment proteger les citoyens sans freiner l\'innovation ?','Comment imposer des obligations face a la concurrence americaine et chinoise ?','Comment preserver les droits fondamentaux tout en developpant une industrie competitive ?'].map((q, i) => (
            <div key={i} style={{ padding: '10px 14px', background: '#F8F9FF', borderRadius: 10, border: '1px solid #AFA9EC', fontSize: 13, color: '#534AB7', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 800, flexShrink: 0 }}>?</span>{q}
            </div>
          ))}
        </div>
      </Wrap>}

      {s === 15 && <Wrap onNext={next} onPrev={prev} nextLabel="Passer au quiz →">
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14, color: '#1a1a2e' }}>Le voyage que nous allons faire</h3>
        <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '16px 18px', marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'white', lineHeight: 1.5 }}>Qui est responsable lorsqu'une IA produit un dommage ?</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {[['⚖️','Personnalite juridique, responsabilite, conscience'],['👥','De la machine aux humains et organisations'],['🛡️','Droits fondamentaux et role du juge'],['📋','RGPD et AI Act : les reponses concretes'],['🌍','Innovation, competitivite et droits fondamentaux']].map(([icon,txt], i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', background: 'white', borderRadius: 12, border: '0.5px solid #E5E5E5' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a2e' }}>{txt}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#534AB7', borderRadius: 14, padding: '16px 18px', textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'white', lineHeight: 1.5 }}>Quelle place voulons-nous donner a la machine dans les decisions qui concernent les etres humains ?</div>
        </div>
      </Wrap>}

    </div>
  )
}
