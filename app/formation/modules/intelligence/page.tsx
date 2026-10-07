'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

const TOTAL_LEARNING = 16

type QuizItem = { q: string; opts: string[]; correct: number; expl: string }

const QUIZ: QuizItem[] = [
  { q: "Quel est l'objectif principal de la question 'Avez-vous le sentiment d'etre intelligent ?'", opts: ["Mesurer l'intelligence des participants","Identifier les personnes ayant un QI eleve","Faire emerger leurs representations de l'intelligence","Demontrer que l'intelligence est subjective"], correct: 2, expl: "Cette question fonctionne car elle surprend, fait sourire et cree immediatement de l'interaction. Les participants repondent souvent spontanement : 'Ca depend de quelle intelligence on parle.' C'est precisement ce que l'on cherche." },
  { q: "La theorie des intelligences multiples de Gardner :", opts: ["Constitue aujourd'hui la definition scientifique universelle de l'intelligence","Demontre qu'il existe exactement neuf intelligences","A remplace les tests de QI","Propose differentes formes d'intelligence sans constituer une definition scientifique universellement admise"], correct: 3, expl: "La theorie des intelligences multiples de Gardner est influente, notamment dans le domaine educatif, mais elle ne constitue pas un consensus scientifique permettant de definir definitivement l'intelligence." },
  { q: "Dire que l'intelligence correspond a la capacite a s'adapter :", opts: ["Constitue une definition fausse","Constitue la definition officielle de l'intelligence","Met en evidence une dimension importante de l'intelligence mais ne suffit pas necessairement a epuiser la notion","Demontre que seuls les humains sont intelligents"], correct: 2, expl: "L'adaptation est une dimension frequemment associee a l'intelligence. Mais poussee jusqu'au bout, cette definition pose la question de la frontiere : une huitre qui ajuste ses fonctions physiologiques serait-elle intelligente au meme sens ?" },
  { q: "Quel enonce decrit le mieux l'ambition exprimee autour de Dartmouth 1956 ?", opts: ["Reproduire exactement un cerveau humain","Creer une machine consciente","Construire Internet","Explorer la possibilite de decrire certaines caracteristiques de l'apprentissage et de l'intelligence de facon suffisamment precise pour qu'une machine puisse les simuler"], correct: 3, expl: "Il ne faut jamais ecrire que Dartmouth voulait 'dupliquer le cerveau humain'. L'ambition etait de se demander si certaines facultes associees a l'intelligence peuvent etre decrites puis simulees par une machine." },
  { q: "Un participant affirme : 'ChatGPT est plus intelligent qu'un humain puisqu'il reussit mieux certains tests.' Quelle est la meilleure reaction du fresqueur ?", opts: ["'C'est faux.'","'Oui, l'IA a depasse l'homme.'","'Les benchmarks ne servent a rien.'","'Qu'est-ce que nous appelons intelligence ici, et qu'est-ce que ce test mesure reellement ?'"], correct: 3, expl: "Avant meme de savoir si l'affirmation est vraie ou fausse, il faut comprendre ce que l'auteur mesure et ce qu'il appelle intelligence. Une performance superieure sur un benchmark ne signifie pas une intelligence superieure dans tous les sens de ce mot." },
]

const QUIZ_EN: QuizItem[] = [
  { q: "What is the main objective of asking 'Do you feel intelligent?'", opts: ["To measure participants' intelligence","To identify people with a high IQ","To surface their representations of intelligence","To prove that intelligence is subjective"], correct: 2, expl: "This question works because it surprises, makes people smile, and immediately creates interaction. Participants almost always respond: 'It depends on what kind of intelligence we mean' which is exactly what we are looking for." },
  { q: "Gardner's theory of multiple intelligences:", opts: ["Is now the universal scientific definition of intelligence","Proves there are exactly nine intelligences","Has replaced IQ tests","Proposes different forms of intelligence without constituting a universally accepted scientific definition"], correct: 3, expl: "Gardner's theory is influential, especially in education, but it does not constitute a scientific consensus that definitively defines intelligence. Never present it as a final scientific truth." },
  { q: "Saying that intelligence means the ability to adapt:", opts: ["Is a false definition","Is the official definition of intelligence","Highlights an important dimension of intelligence but does not necessarily exhaust the concept","Proves that only humans are intelligent"], correct: 2, expl: "Adaptation is a frequently associated dimension of intelligence. But pushed to its limits, this definition raises questions: would an oyster that adjusts its physiology to salinity conditions be intelligent in the same sense?" },
  { q: "Which statement best describes the ambition expressed at Dartmouth 1956?", opts: ["To exactly reproduce the human brain","To create a conscious machine","To build the internet","To explore whether certain characteristics of learning and intelligence could be described precisely enough for a machine to simulate them"], correct: 3, expl: "We should never write that Dartmouth aimed to duplicate the human brain. The ambition was to ask whether certain faculties associated with intelligence could be described and then simulated by a machine." },
  { q: "A participant says: 'ChatGPT is smarter than humans since it does better on tests.' What is the best facilitator response?", opts: ["'That's false.'","'Yes, AI has surpassed humans.'","'Benchmarks are useless.'","'What do we mean by intelligence here, and what does this test actually measure?'"], correct: 3, expl: "Before deciding whether the claim is true or false, we need to understand what the author is measuring and what they call intelligence. Superior performance on a benchmark does not automatically mean superior intelligence in every sense." },
]

type Celebration = { atStep: number; icon: string; title: string; sub: string; color: string; bg: string }

const PHASE_CELEBRATIONS: Celebration[] = [
  { atStep: 4, icon: "🧠", title: "Bonne entree en matiere !", sub: "Tu comprends pourquoi la question est difficile. Place aux reperes.", color: "#534AB7", bg: "#EEEDFE" },
  { atStep: 8, icon: "🔍", title: "Reperes maîtrises !", sub: "Gardner, QI, adaptation sans les caricaturer. En route vers Dartmouth.", color: "#0C447C", bg: "#E6F1FB" },
  { atStep: 12, icon: "🎤", title: "Posture d'animateur !", sub: "Tu sais conduire le debat. Encore quelques etapes avant le quiz.", color: "#2B7400", bg: "#D7FFB8" },
  { atStep: 16, icon: "💡", title: "Sous-module termine !", sub: "Tu es pret a animer cette sequence. Le quiz t'attend !", color: "#633806", bg: "#FAEEDA" },
]

function Confetti() {
  const pieces = Array.from({ length: 24 }, (_, i) => ({
    color: ['#58CC02','#FFC800','#FF4B4B','#1CB0F6','#CE82FF'][i % 5],
    left: ((i * 4.2) % 100).toFixed(1) + '%',
    delay: (i * 0.07).toFixed(2) + 's',
    size: 7 + (i % 4) * 3,
  }))
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', pointerEvents: 'none', overflow: 'hidden' }}>
      <style>{`@keyframes cfall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(300px) rotate(720deg);opacity:0}}`}</style>
      {pieces.map((p, i) => (
        <div key={i} style={{ position: 'absolute', top: 0, left: p.left, width: p.size, height: p.size / 2, background: p.color, borderRadius: 2, animation: `cfall 0.8s ${p.delay} ease-in forwards` }}/>
      ))}
    </div>
  )
}

function CelebrationModal({ data, onContinue, lang }: { data: Celebration; onContinue: () => void; lang: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.72)', padding: '20px' }}>
      <style>{`@keyframes popIn{0%{transform:scale(0.4);opacity:0}65%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}} @keyframes bounce{0%,100%{transform:translateY(0)}45%{transform:translateY(-12px)}}`}</style>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <Confetti />
        <div style={{ background: 'white', borderRadius: 28, padding: '40px 32px', textAlign: 'center', maxWidth: 360, width: '100%', animation: 'popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards', boxShadow: '0 28px 64px rgba(0,0,0,0.35)', position: 'relative' }}>
          <div style={{ fontSize: 64, marginBottom: 8, animation: 'bounce 1.2s 0.5s ease-in-out infinite', display: 'block' }}>{data.icon}</div>
          <div style={{ display: 'inline-block', background: data.bg, color: data.color, fontSize: 11, fontWeight: 800, padding: '4px 16px', borderRadius: 20, marginBottom: 14, letterSpacing: 1, textTransform: 'uppercase' as const }}>Phase complete !</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a2e', marginBottom: 10, lineHeight: 1.3 }}>{data.title}</h2>
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.65, marginBottom: 28 }}>{data.sub}</p>
          <button onClick={onContinue} style={{ width: '100%', padding: '16px', borderRadius: 16, background: '#58CC02', color: 'white', border: 'none', fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 0 #3D8A00' }}>
            {lang === 'en' ? 'Continue' : 'Continuer'} &rarr;
          </button>
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ step, phase, quizLength }: { step: number; phase: number; quizLength: number }) {
  const pct = Math.round((step / (TOTAL_LEARNING + quizLength)) * 100)
  const phases = ['🧠','🔍','🎤','💡','✅']
  return (
    <div style={{ padding: '10px 16px', background: 'var(--bg)', borderBottom: '0.5px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ flex: 1, height: 6, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: pct + '%', height: '100%', background: 'linear-gradient(90deg, #58CC02, #89E219)', borderRadius: 3, transition: 'width .4s' }}/>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', minWidth: 30 }}>{pct}%</span>
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        {phases.map((p, i) => (
          <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, background: i < phase ? '#E1F5EE' : i === phase ? 'var(--accent)' : 'var(--bg2)', border: '2px solid ' + (i === phase ? 'var(--accent)' : 'transparent') }}>
            {i < phase ? '✓' : p}
          </div>
        ))}
      </div>
    </div>
  )
}

function FeedbackBar({ correct, expl, onNext, last, lang }: { correct: boolean; expl: string; onNext: () => void; last: boolean; lang: string }) {
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: correct ? '#D7FFB8' : '#FFDFE0', borderTop: '4px solid ' + (correct ? '#58CC02' : '#FF4B4B'), padding: '16px 20px 28px', zIndex: 100 }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: correct ? '#2B7400' : '#CC0000', marginBottom: 6 }}>
          {correct ? 'Correct ✓' : (lang === 'en' ? 'Not quite ✗' : 'Pas tout a fait ✗')}
        </div>
        <p style={{ fontSize: 13, color: correct ? '#2B7400' : '#990000', lineHeight: 1.6, marginBottom: 12 }}>{expl}</p>
        <button onClick={onNext} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: correct ? '#58CC02' : '#FF4B4B', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: correct ? '0 4px 0 #3D8A00' : '0 4px 0 #CC0000' }}>
          {last ? (lang === 'en' ? 'See results' : 'Voir les resultats') : (lang === 'en' ? 'Continue' : 'Continuer')} &rarr;
        </button>
      </div>
    </div>
  )
}

function Wrap({ children, onNext, onPrev, canNext, nextLabel }: {
  children: React.ReactNode; onNext?: () => void; onPrev?: () => void; canNext?: boolean; nextLabel?: string
}) {
  const enabled = canNext !== false
  return (
    <div style={{ padding: '20px 16px 110px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ animation: 'fadeIn 0.25s ease' }}>{children}</div>
      {(onNext || onPrev) && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px 22px', background: 'white', borderTop: '1px solid #E5E5E5', zIndex: 10 }}>
          <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', gap: 10 }}>
            {onPrev && <button onClick={onPrev} style={{ padding: '15px 18px', borderRadius: 16, border: '2px solid #E5E5E5', background: 'white', color: '#888', fontWeight: 700, fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>&larr;</button>}
            {onNext && <button onClick={onNext} disabled={!enabled} style={{ flex: 1, padding: '15px', borderRadius: 16, border: 'none', background: enabled ? '#58CC02' : '#E5E5E5', color: enabled ? 'white' : '#AFAFAF', fontWeight: 800, fontSize: 15, cursor: enabled ? 'pointer' : 'default', boxShadow: enabled ? '0 4px 0 #3D8A00' : 'none' }}>{nextLabel || 'Continuer'}</button>}
          </div>
        </div>
      )}
    </div>
  )
}

function ABox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#F0F0FF', borderRadius: 14, padding: '14px 16px', border: '2px solid #534AB7', marginBottom: 14 }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: '#534AB7', marginBottom: 8 }}>🎤 Dans la Fresque</div>
      <div style={{ fontSize: 13, color: '#3C3489', lineHeight: 1.65 }}>{children}</div>
    </div>
  )
}

function KBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#E8FBF2', borderRadius: 14, padding: '14px 16px', border: '2px solid #00A85E', marginBottom: 14 }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: '#00A85E', marginBottom: 8 }}>🧠 A comprendre</div>
      <div style={{ fontSize: 13, color: '#085041', lineHeight: 1.65 }}>{children}</div>
    </div>
  )
}

function WBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#FFF9E6', borderRadius: 14, padding: '14px 16px', border: '2px solid #FFC800', marginBottom: 14 }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: '#8B5E00', marginBottom: 8 }}>⚠️ Point de vigilance</div>
      <div style={{ fontSize: 13, color: '#8B5E00', lineHeight: 1.65 }}>{children}</div>
    </div>
  )
}

function STag({ label, bg, color }: { label: string; bg: string; color: string }) {
  return <div style={{ display: 'inline-block', background: bg, color, fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, marginBottom: 12 }}>{label}</div>
}

export default function ModulePage() {
  const { lang } = useLanguage()
  const t = (fr: string, en: string) => lang === 'en' ? en : fr
  const activeQuiz = lang === 'en' ? QUIZ_EN : QUIZ

  const [userId, setUserId] = useState<string | null>(null)
  const [moduleId, setModuleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [celebration, setCelebration] = useState<Celebration | null>(null)
  const [answers, setAnswers] = useState<Array<number | null>>(Array(QUIZ.length).fill(null))
  const [feedback, setFeedback] = useState<boolean | null>(null)
  const [showFb, setShowFb] = useState(false)
  const [score, setScore] = useState(0)
  const [saved, setSaved] = useState(false)
  const [s1ans, setS1ans] = useState(-1)
  const [s6ans, setS6ans] = useState(-1)
  const [gardnerOpen, setGardnerOpen] = useState(false)
  const [halfOpen, setHalfOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/'; return }
      setUserId(user.id)
      supabase.from('modules').select('id').eq('titre', 'Intelligence').single().then(({ data }) => {
        if (data) setModuleId(data.id)
        setLoading(false)
      })
    })
  }, [])

  const next = () => {
    const ns = step + 1
    const cel = PHASE_CELEBRATIONS.find(c => c.atStep === ns)
    if (cel) { setCelebration(cel) } else { setStep(ns) }
  }
  const prev = () => { if (step > 0) setStep(s => s - 1) }
  const closeCel = () => { if (celebration) { setStep(celebration.atStep); setCelebration(null) } }

  const qIdx = step - TOTAL_LEARNING
  const isQuiz = step >= TOTAL_LEARNING && step < TOTAL_LEARNING + activeQuiz.length
  const isResult = step >= TOTAL_LEARNING + activeQuiz.length
  const phase = step < 4 ? 0 : step < 8 ? 1 : step < 12 ? 2 : step < 16 ? 3 : 4

  const pickAnswer = async (optIdx: number) => {
    if (answers[qIdx] !== null) return
    const correct = activeQuiz[qIdx].correct === optIdx
    const na = [...answers]; na[qIdx] = optIdx; setAnswers(na)
    setFeedback(correct); setShowFb(true)
    if (correct) setScore(sc => sc + 1)
    if (step === TOTAL_LEARNING + activeQuiz.length - 1 && !saved) {
      setSaved(true)
      const fs = score + (correct ? 1 : 0)
      await supabase.from('progressions').upsert({ animateur_id: userId!, module_id: moduleId, completed: fs === activeQuiz.length, completed_at: fs === activeQuiz.length ? new Date().toISOString() : null, attempts: 1 }, { onConflict: 'animateur_id,module_id' })
    }
  }

  const nextQuiz = () => { setShowFb(false); setFeedback(null); next() }
  const restart = () => { setStep(TOTAL_LEARNING); setAnswers(Array(QUIZ.length).fill(null)); setScore(0); setShowFb(false); setFeedback(null); setSaved(false) }

  if (loading) return <div className="container"><div className="empty"><p>Chargement...</p></div></div>

  const header = (
    <div style={{ position: 'sticky', top: 0, zIndex: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'white', borderBottom: '0.5px solid var(--border)' }}>
        <a href="/formation/modules" style={{ fontSize: 16, color: '#AFAFAF', fontWeight: 700, textDecoration: 'none' }}>&#x2715;</a>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#555', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Intelligence</span>
        <LanguageSwitch />
      </div>
      {!isResult && <ProgressBar step={step} phase={phase} quizLength={activeQuiz.length} />}
    </div>
  )

  if (isQuiz) {
    const q = activeQuiz[qIdx]
    const ua = answers[qIdx]
    const labs = ['A','B','C','D']
    return (
      <div style={{ minHeight: '100vh', background: '#F7F7F7' }}>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
        {celebration && <CelebrationModal data={celebration} onContinue={closeCel} lang={lang} />}
        {header}
        <div style={{ padding: '20px 16px 120px', maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#534AB7', marginBottom: 12 }}>{t('Question','Question')} {qIdx + 1} / {activeQuiz.length} &middot; Score {score}</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.5, marginBottom: 20 }}>{q.q}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.opts.map((opt, i) => {
              const sel = ua === i
              const cor = i === q.correct
              const shown = ua !== null
              return (
                <button key={i} onClick={() => pickAnswer(i)} disabled={shown} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '16px 18px', borderRadius: 14, border: '2.5px solid ' + (!shown ? '#E5E5E5' : cor ? '#58CC02' : sel ? '#FF4B4B' : '#E5E5E5'), background: !shown ? 'white' : cor ? '#D7FFB8' : sel ? '#FFDFE0' : 'white', cursor: shown ? 'default' : 'pointer', textAlign: 'left', width: '100%' }}>
                  <span style={{ minWidth: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0, background: !shown ? '#F0F0F0' : cor ? '#58CC02' : sel ? '#FF4B4B' : '#F0F0F0', color: !shown ? '#888' : (cor || sel) ? 'white' : '#888' }}>{!shown ? labs[i] : cor ? '✓' : sel ? '✗' : labs[i]}</span>
                  <span style={{ fontSize: 15, lineHeight: 1.5, color: '#1a1a2e', fontWeight: 500 }}>{opt}</span>
                </button>
              )
            })}
          </div>
        </div>
        {showFb && <FeedbackBar correct={feedback!} expl={q.expl} onNext={nextQuiz} last={qIdx === activeQuiz.length - 1} lang={lang} />}
      </div>
    )
  }

  if (isResult) {
    const total = answers.filter((a, i) => a === activeQuiz[i].correct).length
    const pct = Math.round((total / activeQuiz.length) * 100)
    const wrongs = answers.map((a, i) => a !== activeQuiz[i].correct ? i : -1).filter(x => x >= 0)
    return (
      <div style={{ minHeight: '100vh', background: '#F7F7F7' }}>
        {header}
        <div style={{ padding: '24px 16px 40px', maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>{pct === 100 ? '🧠' : pct >= 80 ? '🎯' : '💪'}</div>
            {pct === 100 && <div style={{ display: 'inline-block', background: '#EEEDFE', color: '#534AB7', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20, marginBottom: 8 }}>{t('SOUS-MODULE VALIDE','SUB-MODULE COMPLETE')}</div>}
            <div style={{ fontSize: 32, fontWeight: 900, color: '#534AB7', marginBottom: 8 }}>{total} / {activeQuiz.length}</div>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>{pct === 100 ? t('Parfait ! Tu maitrises ce sous-module.','Perfect! You have mastered this sub-module.') : pct >= 80 ? t('Beau parcours !','Great work!') : t('Continue a apprendre !','Keep learning!')}</p>
          </div>
          {wrongs.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 10 }}>{t('Questions manquees :','Missed questions:')}</div>
              {wrongs.map(i => (
                <div key={i} style={{ padding: 12, background: '#FAECE7', borderRadius: 10, marginBottom: 8, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Q{i+1}. {activeQuiz[i].q.substring(0, 70)}...</div>
                  <div style={{ color: '#085041' }}>{t('Bonne reponse :','Correct:')} {activeQuiz[i].opts[activeQuiz[i].correct]}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ background: '#534AB7', borderRadius: 14, padding: '16px 18px', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'white' }}>{t('Une machine peut-elle etre intelligente sans etre consciente ?','Can a machine be intelligent without being conscious?')}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>{t('A suivre : Conscience','Coming next: Consciousness')}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={restart} style={{ width: '100%', padding: '15px', borderRadius: 16, border: 'none', background: '#58CC02', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 0 #3D8A00' }}>{t('Refaire le quiz','Retake quiz')}</button>
            <button onClick={() => { window.location.href = '/formation/modules' }} style={{ width: '100%', padding: '15px', borderRadius: 16, border: '2px solid #E5E5E5', background: 'white', color: '#555', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>{t('Retour aux modules','Back to modules')}</button>
          </div>
        </div>
      </div>
    )
  }

  const s = step
  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} @keyframes appear{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}`}</style>
      {celebration && <CelebrationModal data={celebration} onContinue={closeCel} lang={lang} />}
      {header}

      {s === 0 && (
        <Wrap onNext={next} nextLabel={t('Commencer', 'Start') + ' →'}>
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🧠</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, lineHeight: 1.3 }}>{t('Intelligence, conscience et prise de decision','Intelligence, Consciousness & Decision-making')}</h1>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 20 }}>{t("Nous parlons d'intelligence artificielle en permanence. Mais savons-nous vraiment ce que nous appelons intelligence ?","We constantly talk about artificial intelligence. But do we really know what we mean by intelligence?")}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 16px', background: 'white', borderRadius: 14, border: '1.5px solid #534AB7' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#534AB7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>01</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 2 }}>Intelligence</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{t("Comprendre ce que nous mettons derriere le mot intelligence.",'Understanding what we mean by the word "intelligence".')}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 16px', background: '#F8F8F8', borderRadius: 14, border: '1.5px solid #E5E5E5', opacity: 0.5 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#E5E5E5', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>🔒</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#888' }}>Conscience</div>
                  <div style={{ fontSize: 12, color: '#aaa' }}>{t('A venir','Coming soon')}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 16px', background: '#F8F8F8', borderRadius: 14, border: '1.5px solid #E5E5E5', opacity: 0.5 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#E5E5E5', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>🔒</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#888' }}>{t('Prise de decision','Decision-making')}</div>
                  <div style={{ fontSize: 12, color: '#aaa' }}>{t('A venir','Coming soon')}</div>
                </div>
              </div>
            </div>
          </div>
        </Wrap>
      )}

      {s === 1 && (
        <Wrap onNext={s1ans >= 0 ? next : undefined} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t('SEQUENCE 1 — Ouverture','SEQUENCE 1 — Opening')} bg="#EEEDFE" color="#534AB7" />
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 20, lineHeight: 1.3, textAlign: 'center' }}>{t("Avez-vous le sentiment d'etre intelligent ?","Do you feel intelligent?")}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {[t('Oui','Yes'), t('Non','No'), t('Ca depend...','It depends...'), t('Question piege ? 😏','A trick question? 😏')].map((lbl, i) => (
              <button key={i} onClick={() => setS1ans(i)} style={{ padding: '16px 18px', borderRadius: 14, border: '2.5px solid ' + (s1ans === i ? '#534AB7' : '#E5E5E5'), background: s1ans === i ? '#EEEDFE' : 'white', cursor: 'pointer', textAlign: 'left', fontWeight: s1ans === i ? 700 : 500, fontSize: 15, color: '#1a1a2e' }}>
                {lbl}
              </button>
            ))}
          </div>
          {s1ans >= 0 && (
            <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '16px 18px', animation: 'appear .3s ease' }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: 'white', marginBottom: 8 }}>{t('Interessant...','Interesting...')}</p>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.65, margin: 0 }}>{t("Mais avant de repondre, encore faudrait-il savoir ce que signifie etre intelligent.",'But before answering, we would first need to know what being intelligent actually means.')}</p>
            </div>
          )}
        </Wrap>
      )}

      {s === 2 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <ABox>
            <p style={{ marginBottom: 10 }}>{t("C'est volontairement l'une des premieres questions que l'on peut poser. Elle fonctionne car elle surprend, fait sourire et cree immediatement de l'interaction.",'This is deliberately one of the first questions you can ask. It works because it surprises, makes people smile, and immediately creates interaction.')}</p>
            <p style={{ margin: 0 }}>{t("Les participants repondent souvent : Ca depend de quelle intelligence on parle. Et c'est precisement ce que l'on cherche.",'Participants often respond: It depends on what kind of intelligence we mean. That is exactly what we are looking for.')}</p>
          </ABox>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e', marginBottom: 8 }}>{t('Relances possibles :','Possible follow-ups:')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {[
              t("Qu'est-ce qui vous permet de dire qu'une personne est intelligente ?",'What makes you say that someone is intelligent?'),
              t("Si vous deviez definir l'intelligence en une phrase ?",'If you had to define intelligence in one sentence?'),
              t("De quelle forme d'intelligence parlez-vous ?",'Which form of intelligence are you referring to?'),
            ].map((q, i) => (
              <div key={i} style={{ padding: '10px 14px', background: '#F8F9FF', borderRadius: 10, border: '1px solid #AFA9EC', fontSize: 13, color: '#534AB7', fontStyle: 'italic' }}>
                &laquo; {q} &raquo;
              </div>
            ))}
          </div>
          <WBox>
            <span>{t("Ne cherchez pas immediatement a donner une reponse. Faites emerger les representations du groupe.",'Do not give an answer immediately. Let the group\'s representations emerge.')}</span>
          </WBox>
        </Wrap>
      )}

      {s === 3 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t('SEQUENCE 2 — Gardner','SEQUENCE 2 — Gardner')} bg="#EEEDFE" color="#534AB7" />
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>{t("Existe-t-il plusieurs formes d'intelligence ?","Are there multiple forms of intelligence?")}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {[t('Raisonner','Reasoning'), t('Comprendre les autres','Understanding others'), t('Creer','Creating'), t('Manier le langage','Handling language'), t("Utiliser son corps","Using one's body")].map((item, i) => (
              <span key={i} style={{ padding: '6px 12px', borderRadius: 20, background: '#EEEDFE', color: '#534AB7', fontSize: 13, fontWeight: 600 }}>{item}</span>
            ))}
          </div>
          <KBox>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>Howard Gardner</div>
            <p style={{ marginBottom: 10 }}>{t("Gardner a propose plusieurs formes d'intelligence :",'Gardner proposed several forms of intelligence:')}</p>
            {!gardnerOpen ? (
              <button onClick={() => setGardnerOpen(true)} style={{ padding: '8px 16px', borderRadius: 10, background: '#00A85E', color: 'white', border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                {t('Voir les intelligences','Show intelligences')} &rarr;
              </button>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, animation: 'appear .3s ease' }}>
                {[t('Linguistique','Linguistic'), t('Logico-mathematique','Logical-mathematical'), t('Spatiale','Spatial'), t('Musicale','Musical'), t('Corporelle','Bodily'), t('Interpersonnelle','Interpersonal'), t('Intrapersonnelle','Intrapersonal'), t('Naturaliste','Naturalistic')].map((intel, i) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: 20, background: 'white', color: '#00A85E', fontSize: 12, fontWeight: 600, border: '1px solid #00A85E' }}>{intel}</span>
                ))}
              </div>
            )}
          </KBox>
          <WBox>
            <span>{t("La theorie des intelligences multiples de Gardner est influente, notamment dans le domaine educatif, mais elle ne constitue pas un consensus scientifique permettant de definir definitivement l'intelligence.",'Gardner\'s theory is influential, especially in education, but it does not constitute a scientific consensus that definitively defines intelligence.')}</span>
          </WBox>
        </Wrap>
      )}

      {s === 4 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Phase suivante','Next phase') + ' →'}>
          <STag label={t('SEQUENCE 3 — 8 et demi','SEQUENCE 3 — 8 and a half')} bg="#EEEDFE" color="#534AB7" />
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 52, fontWeight: 900, marginBottom: 12, color: '#1a1a2e' }}>8 {t('intelligences','intelligences')}</div>
            {!halfOpen ? (
              <button onClick={() => setHalfOpen(true)} style={{ padding: '12px 24px', borderRadius: 12, background: '#534AB7', color: 'white', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>+ ?</button>
            ) : (
              <div style={{ animation: 'appear .4s ease' }}>
                <div style={{ fontSize: 42, fontWeight: 900, color: '#534AB7', marginBottom: 16 }}>8,5 ? 🤔</div>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>{t("Gardner s'est interroge sur une possible intelligence existentielle et a lui-meme utilise avec humour l'idee de 8 demi intelligences, considerant que cette candidate ne remplissait pas suffisamment tous ses criteres.",'Gardner questioned a possible existential intelligence and humorously coined the idea of "8 and a half intelligences", considering that this candidate did not fully meet all his criteria.')}</p>
              </div>
            )}
          </div>
          <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '18px 20px', marginTop: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: 'white', textAlign: 'center' }}>
              {t("Mais avons-nous vraiment defini l'intelligence ?","But have we really defined intelligence?")}
            </div>
          </div>
        </Wrap>
      )}

      {s === 5 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t("SEQUENCE 4 — L'exemple du chat","SEQUENCE 4 — The cat example")} bg="#EEEDFE" color="#534AB7" />
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 14 }}>{t("Imaginez que je vous demande : Qu'est-ce qu'un chat ?",'Imagine I ask you: "What is a cat?"')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 14 }}>
            {['🐈 noir','🐈 blanc','🐈 gris','🐈 sans poils','🐈 grand','🐈 petit'].map((chat, i) => (
              <div key={i} style={{ padding: '10px 14px', background: 'white', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 16 }}>{chat}</div>
            ))}
          </div>
          <div style={{ background: '#534AB7', borderRadius: 14, padding: '16px 18px', marginBottom: 14, textAlign: 'center' }}>
            <p style={{ fontWeight: 800, fontSize: 15, color: 'white', lineHeight: 1.5, margin: 0 }}>
              {t("Vous m'avez decrit differentes formes de chats... mais vous ne m'avez toujours pas dit ce qu'est un chat.","You have described different types of cats... but you still haven't told me what a cat is.")}
            </p>
          </div>
          <KBox>
            <span>{t("Pour l'intelligence, c'est un peu la meme chose : identifier plusieurs formes d'intelligence ne suffit pas necessairement a definir ce qu'est l'intelligence.",'For intelligence, it is much the same: identifying multiple forms of intelligence does not necessarily suffice to define what intelligence is.')}</span>
          </KBox>
        </Wrap>
      )}

      {s === 6 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t('SEQUENCE 5 — Le QI','SEQUENCE 5 — IQ')} bg="#E6F1FB" color="#0C447C" />
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>{t("Etre intelligent, est-ce savoir raisonner ?","Is being intelligent the same as knowing how to reason?")}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {[t('Formuler une hypothese','Formulate a hypothesis'), t('Analyser','Analyse'), t('Deduire','Deduce'), t('Resoudre un probleme','Solve a problem')].map((cap, i) => (
              <span key={i} style={{ padding: '6px 12px', borderRadius: 20, background: '#E6F1FB', color: '#0C447C', fontSize: 13, fontWeight: 600 }}>{cap}</span>
            ))}
          </div>
          <KBox>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>{t('Le QI','IQ')}</div>
            <p style={{ marginBottom: 8 }}>{t("Les tests de QI evaluent certaines capacites cognitives : raisonnement, comprehension, memoire de travail, vitesse de traitement.",'IQ tests assess certain cognitive abilities: reasoning, comprehension, working memory, processing speed.')}</p>
            <div style={{ background: 'white', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
              <span style={{ fontWeight: 900, fontSize: 16, color: '#0C447C' }}>QI &ne; {t("totalite de l'intelligence humaine",'all of human intelligence')}</span>
            </div>
          </KBox>
          <WBox>
            <span>{t("Ne jamais presenter le QI comme inutile ou faux. Mesurer certaines capacites cognitives ne signifie pas necessairement mesurer tout ce que nous pouvons mettre derriere le concept d'intelligence.",'Never present IQ as useless or false. Measuring cognitive abilities does not mean measuring everything intelligence encompasses.')}</span>
          </WBox>
        </Wrap>
      )}

      {s === 7 && (
        <Wrap onNext={s6ans >= 0 ? next : undefined} onPrev={prev} nextLabel={t('Phase suivante','Next phase') + ' →'}>
          <STag label={t("SEQUENCE 6 — L'adaptation","SEQUENCE 6 — Adaptation")} bg="#E1F5EE" color="#085041" />
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>{t("L'intelligence est la capacite a s'adapter a son environnement.",'"Intelligence is the ability to adapt to one\'s environment."')}</h2>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#555', marginBottom: 10 }}>{t("Vous etes d'accord ?",'Do you agree?')}</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button onClick={() => setS6ans(0)} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '2px solid ' + (s6ans === 0 ? '#2B7400' : '#E5E5E5'), background: s6ans === 0 ? '#D7FFB8' : 'white', color: s6ans === 0 ? '#2B7400' : '#888', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>👍 Oui</button>
            <button onClick={() => setS6ans(1)} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '2px solid ' + (s6ans === 1 ? '#633806' : '#E5E5E5'), background: s6ans === 1 ? '#FAEEDA' : 'white', color: s6ans === 1 ? '#633806' : '#888', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>🤔 {t('En partie','Partly')}</button>
            <button onClick={() => setS6ans(2)} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '2px solid ' + (s6ans === 2 ? '#CC0000' : '#E5E5E5'), background: s6ans === 2 ? '#FFDFE0' : 'white', color: s6ans === 2 ? '#CC0000' : '#888', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>👎 Non</button>
          </div>
          {s6ans >= 0 && (
            <div style={{ animation: 'fadeIn .3s ease' }}>
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 12 }}>{t("L'adaptation est une dimension frequemment associee a l'intelligence. Mais poussons la definition jusqu'au bout.",'Adaptation is a frequently associated dimension of intelligence. But let us push the definition to its limits.')}</p>
              <KBox>
                <p style={{ marginBottom: 8 }}>{t("Une huitre est capable d'ajuster certaines fonctions physiologiques aux variations de son environnement, notamment aux conditions de salinite.",'An oyster can adjust certain physiological functions to environmental variations, particularly salinity conditions.')}</p>
                <p style={{ margin: 0 }}>{t("Si la capacite d'adaptation definit l'intelligence, faut-il considerer tous les organismes capables de s'adapter comme intelligents au meme sens ?",'If the capacity for adaptation defines intelligence, should we consider all adapting organisms as intelligent in the same sense?')}</p>
              </KBox>
              <WBox>
                <span>{t("Ne pas chercher a repondre definitivement. L'objectif est de montrer qu'une definition apparemment evidente entraine immediatement de nouvelles questions.",'Do not try to answer definitively. The goal is to show that an apparently obvious definition immediately raises new questions.')}</span>
              </WBox>
            </div>
          )}
        </Wrap>
      )}

      {s === 8 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Phase suivante','Next phase') + ' →'}>
          <STag label={t('SEQUENCE 7 — Synthese','SEQUENCE 7 — Summary')} bg="#D7FFB8" color="#2B7400" />
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>{t("Alors... qu'est-ce que l'intelligence ?","So... what is intelligence?")}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {[t('Raisonner ?','Reasoning?'), t('Apprendre ?','Learning?'), t('Resoudre des problemes ?','Solving problems?'), t("S'adapter ?","Adapting?"), t('Comprendre ?','Understanding?'), t('Creer ?','Creating?'), t('Interagir ?','Interacting?')].map((w, i) => (
              <div key={i} style={{ padding: '10px 16px', background: 'white', borderRadius: 10, border: '0.5px solid #E5E5E5', fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>{w}</div>
            ))}
          </div>
          <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
            <p style={{ fontWeight: 800, fontSize: 15, color: 'white', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
              {t("Il n'existe pas une definition simple et unique permettant d'epuiser a elle seule ce que nous appelons intelligence.","There is no single simple definition that can alone exhaust what we call intelligence.")}
            </p>
          </div>
          <WBox>
            <p style={{ margin: 0 }}><strong>{t('Ne pas dire :','Do not say:')}</strong> {t("Les scientifiques ne savent pas ce qu'est l'intelligence.",'"Scientists do not know what intelligence is."')}<br /><br /><strong>{t('Dire plutot :','Say instead:')}</strong> {t("Differentes disciplines mettent l'accent sur des dimensions differentes. Il n'existe pas une definition unique qui mette fin a tous les debats.",'"Different disciplines emphasise different dimensions. There is no single definition that ends all debates."')}</p>
          </WBox>
        </Wrap>
      )}

      {s === 9 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t("SEQUENCE 8 — L'IA","SEQUENCE 8 — AI")} bg="#FAEEDA" color="#633806" />
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>{t("Pourquoi parler d'intelligence artificielle ?","Why talk about 'artificial' intelligence?")}</h2>
          <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '16px 18px', marginBottom: 14, textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'white' }}>{t('Intelligence naturelle &rarr; Intelligence artificielle','Natural intelligence &rarr; Artificial intelligence')}</div>
          </div>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 14 }}>{t("Si nous avons deja du mal a definir l'intelligence humaine, que signifie exactement le mot intelligence lorsque nous parlons d'intelligence artificielle ?",'If we already struggle to define human intelligence, what exactly does the word "intelligence" mean when we talk about artificial intelligence?')}</p>
          <KBox>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>{t("Intelligence en anglais",'Intelligence in English')}</div>
            <p style={{ marginBottom: 8 }}>{t("En anglais, intelligence peut egalement designer le renseignement — la collecte, le traitement et l'exploitation d'informations.",'In English, "intelligence" can also mean intelligence gathering — collection, processing and exploitation of information.')}</p>
            <div style={{ background: 'white', borderRadius: 8, padding: '8px 12px', fontWeight: 700, fontSize: 13, color: '#085041' }}>CIA = Central Intelligence Agency</div>
          </KBox>
          <WBox>
            <span>{t("Attention : cela ne signifie pas que l'expression Artificial Intelligence a ete creee pour designer simplement du traitement de l'information. C'est une nuance importante.",'Attention: this does not mean that "Artificial Intelligence" was created to simply designate information processing. This is an important nuance.')}</span>
          </WBox>
        </Wrap>
      )}

      {s === 10 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t('SEQUENCE 9 — Dartmouth 1956','SEQUENCE 9 — Dartmouth 1956')} bg="#FAEEDA" color="#633806" />
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>{t("Dartmouth : aux origines de l'IA","Dartmouth: the origins of AI")}</h2>
          <div style={{ display: 'flex', gap: 0, marginBottom: 16, overflow: 'hidden', borderRadius: 12, border: '1.5px solid #E5E5E5' }}>
            <div style={{ flex: 1, padding: '14px 12px', background: 'white', borderRight: '1px solid #E5E5E5', textAlign: 'center' }}>
              <div style={{ fontSize: 22 }}>📝</div>
              <div style={{ fontWeight: 900, fontSize: 18, color: '#633806' }}>1955</div>
              <div style={{ fontSize: 11, color: '#633806', marginTop: 4 }}>{t('Proposition','Proposal')}</div>
            </div>
            <div style={{ flex: 1, padding: '14px 12px', background: '#FAEEDA', textAlign: 'center' }}>
              <div style={{ fontSize: 22 }}>🏛</div>
              <div style={{ fontWeight: 900, fontSize: 18, color: '#633806' }}>1956</div>
              <div style={{ fontSize: 11, color: '#633806', marginTop: 4 }}>Dartmouth Summer Research Project</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 14 }}>{t("McCarthy, Minsky, Rochester et Shannon proposent d'organiser un projet de recherche a Dartmouth. Leur hypothese : certains aspects de l'apprentissage et d'autres caracteristiques de l'intelligence pourraient etre decrits suffisamment precisement pour qu'une machine puisse les simuler.",'McCarthy, Minsky, Rochester and Shannon proposed a summer research project at Dartmouth. Their hypothesis: certain aspects of learning and other characteristics of intelligence could be described precisely enough for a machine to simulate them.')}</p>
          <WBox>
            <p style={{ margin: 0 }}><strong>{t('Ne jamais ecrire :','Never write:')}</strong> {t("L'objectif de Dartmouth etait de dupliquer le cerveau humain.",'"The goal of Dartmouth was to duplicate the human brain."')}<br /><br /><strong>{t('Preferer :','Prefer:')}</strong> {t("L'ambition etait de se demander si certaines facultes associees a l'intelligence peuvent etre decrites puis simulees par une machine.",'"The ambition was to ask whether certain faculties associated with intelligence could be described and then simulated by a machine."')}</p>
          </WBox>
        </Wrap>
      )}

      {s === 11 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Phase suivante','Next phase') + ' →'}>
          <STag label={t('MISE EN SITUATION','SIMULATION')} bg="#FFDFE0" color="#CC0000" />
          <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '20px', marginBottom: 20, textAlign: 'center', border: '3px solid #FF4B4B' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, marginBottom: 8 }}>BREAKING NEWS</div>
            <div style={{ fontWeight: 900, fontSize: 18, color: 'white', lineHeight: 1.4 }}>{t("L'IA EST DESORMAIS PLUS INTELLIGENTE QUE L'ETRE HUMAIN",'"AI IS NOW MORE INTELLIGENT THAN HUMANS"')}</div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e', marginBottom: 12 }}>{t('Quelle devrait etre votre premiere reaction ?','What should be your first reaction?')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <div style={{ padding: '14px 16px', borderRadius: 12, border: '2px solid #E5E5E5', background: 'white', fontSize: 14, color: '#555' }}>A — {t("C'est inquietant.","This is worrying.")}</div>
            <div style={{ padding: '14px 16px', borderRadius: 12, border: '2px solid #E5E5E5', background: 'white', fontSize: 14, color: '#555' }}>B — {t("C'est formidable.","This is wonderful.")}</div>
            <div style={{ padding: '14px 16px', borderRadius: 12, border: '2px solid #E5E5E5', background: 'white', fontSize: 14, color: '#555' }}>C — {t("C'est faux.","This is false.")}</div>
            <div style={{ padding: '14px 16px', borderRadius: 12, border: '2px solid #58CC02', background: '#D7FFB8', fontSize: 14, fontWeight: 700, color: '#2B7400' }}>D — {t('Que signifie ici le mot intelligente ?','What does the word "intelligent" mean here?')} ✓</div>
          </div>
          <KBox>
            <span>{t("Avant meme de savoir si l'affirmation est vraie ou fausse, il faut comprendre ce que l'auteur mesure et ce qu'il appelle intelligence.",'Before deciding whether the claim is true or false, we need to understand what the author is measuring and what they call "intelligence".')}</span>
          </KBox>
          <div style={{ background: '#534AB7', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: 'white', marginBottom: 8 }}>🧠 {t('LE REFLEXE A RETENIR','THE REFLEX TO REMEMBER')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>1. {t("Quelle definition de l'intelligence est utilisee ?",'What definition of intelligence is being used?')}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.15)' }}>2. {t("Quelle capacite est reellement mesuree ?",'What capability is actually being measured?')}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.15)' }}>3. {t("Comment cette capacite a-t-elle ete evaluee ?",'How was this capability evaluated?')}</div>
            </div>
          </div>
        </Wrap>
      )}

      {s === 12 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Phase suivante','Next phase') + ' →'}>
          <STag label={t("ROLE D'ANIMATEUR","FACILITATOR ROLE")} bg="#E1F5EE" color="#085041" />
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>🎤 {t("Votre role d'animateur","Your facilitator role")}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#FFDFE0', borderRadius: 14, padding: '14px', border: '1.5px solid #FF4B4B' }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#CC0000', marginBottom: 8 }}>❌ {t('A NE PAS faire','Do NOT do')}</div>
              {[t("Imposer sa definition",'Impose your definition'), t("Presenter Gardner comme definitif",'Present Gardner as definitive'), t("Reduire l'intelligence au QI",'Reduce intelligence to IQ'), t("Dire que le QI ne mesure rien",'Say IQ measures nothing'), t("Simplifier Dartmouth",'Oversimplify Dartmouth'), t("Conclure sur l'IA",'Draw conclusions about AI')].map((item, i) => (
                <div key={i} style={{ fontSize: 11, color: '#CC0000', paddingTop: i > 0 ? 4 : 0, borderTop: i > 0 ? '1px solid rgba(204,0,0,0.1)' : 'none', lineHeight: 1.4 }}>{item}</div>
              ))}
            </div>
            <div style={{ background: '#D7FFB8', borderRadius: 14, padding: '14px', border: '1.5px solid #58CC02' }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#2B7400', marginBottom: 8 }}>✅ {t('A FAIRE','DO')}</div>
              {[t("Poser la question",'Ask the question'), t("Faire preciser les termes",'Ask for clarification'), t("Confronter les definitions",'Confront definitions'), t("Apporter des reperes",'Provide reference points'), t("Creer du doute constructif",'Create constructive doubt'), t("Developper l'esprit critique",'Develop critical thinking')].map((item, i) => (
                <div key={i} style={{ fontSize: 11, color: '#2B7400', paddingTop: i > 0 ? 4 : 0, borderTop: i > 0 ? '1px solid rgba(43,116,0,0.1)' : 'none', lineHeight: 1.4 }}>{item}</div>
              ))}
            </div>
          </div>
        </Wrap>
      )}

      {s === 13 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>{t("Methode d'animation","Facilitation method")}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: '❓', phase: t('QUESTIONNER','QUESTION'), desc: t("Avez-vous le sentiment d'etre intelligent ?","Do you feel intelligent?"), bg: '#EEEDFE', border: '#534AB7', fg: '#3C3489' },
              { icon: '📖', phase: t('FAIRE DEFINIR','DEFINE'), desc: t("Qu'appelez-vous intelligence ?",'What do you call intelligence?'), bg: '#E6F1FB', border: '#85B7EB', fg: '#0C447C' },
              { icon: '⚡', phase: t('CONFRONTER','CONFRONT'), desc: t("Faire emerger plusieurs conceptions.",'Let multiple conceptions emerge.'), bg: '#FAEEDA', border: '#EF9F27', fg: '#633806' },
              { icon: '💡', phase: t('ECLAIRER','ILLUMINATE'), desc: t("Gardner, QI, adaptation, Dartmouth.",'Gardner, IQ, adaptation, Dartmouth.'), bg: '#D7FFB8', border: '#58CC02', fg: '#2B7400' },
              { icon: '🔄', phase: t('QUESTIONNER A NOUVEAU','QUESTION AGAIN'), desc: t("Que signifie maintenant intelligence artificielle ?",'What does "artificial intelligence" mean now?'), bg: '#1a1a2e', border: '#1a1a2e', fg: 'white' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', background: item.bg, borderRadius: 12, border: '1.5px solid ' + item.border }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 12, color: item.fg, marginBottom: 2 }}>{item.phase}</div>
                  <div style={{ fontSize: 12, color: item.fg, opacity: 0.8, fontStyle: 'italic' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: '#F8F9FF', borderRadius: 12, padding: '14px 16px', marginTop: 14, border: '1.5px solid #AFA9EC', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#534AB7', lineHeight: 1.7, margin: 0, fontWeight: 600 }}>
              {t("Une bonne animation ne ferme pas necessairement la question. Elle permet aux participants de mieux la poser.",'Good facilitation does not necessarily close the question. It allows participants to ask it better.')}
            </p>
          </div>
        </Wrap>
      )}

      {s === 14 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t("Derniere etape","Final step") + ' →'}>
          <STag label={t('FICHE MEMO ANIMATEUR','FACILITATOR REFERENCE CARD')} bg="#FAEEDA" color="#633806" />
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>{t('Intelligence — Fiche animateur','Intelligence — Facilitator card')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: 'white', borderRadius: 12, border: '1.5px solid #E5E5E5', overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', background: '#534AB7', color: 'white', fontWeight: 700, fontSize: 12 }}>{t("Question d'ouverture","Opening question")}</div>
              <div style={{ padding: '10px 14px', fontSize: 14, fontWeight: 700, color: '#1a1a2e', fontStyle: 'italic' }}>{t("Avez-vous le sentiment d'etre intelligent ?",'"Do you feel intelligent?"')}</div>
            </div>
            <div style={{ background: 'white', borderRadius: 12, border: '1.5px solid #E5E5E5', overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', background: '#00A85E', color: 'white', fontWeight: 700, fontSize: 12 }}>{t('Reperes','Reference points')}</div>
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}><strong style={{ color: '#085041' }}>Gardner</strong> &rarr; {t("Plusieurs formes d'intelligence — pas une definition definitive",'Multiple forms of intelligence — not a definitive definition')}</div>
                <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}><strong style={{ color: '#085041' }}>QI</strong> &rarr; {t("Certaines capacites cognitives — pas tout ce que recouvre l'intelligence",'Certain cognitive abilities — not everything intelligence encompasses')}</div>
                <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}><strong style={{ color: '#085041' }}>{t('Adaptation','Adaptation')}</strong> &rarr; {t("Dimension importante mais insuffisante",'Important but insufficient dimension')}</div>
                <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}><strong style={{ color: '#085041' }}>Dartmouth 1956</strong> &rarr; {t("Simuler des caracteristiques de l'intelligence — pas dupliquer un cerveau",'Simulate characteristics of intelligence — not duplicate a brain')}</div>
              </div>
            </div>
          </div>
        </Wrap>
      )}

      {s === 15 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Passer au quiz','Take the quiz') + ' →'}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#534AB7', marginBottom: 8 }}>Intelligence — {t('termine','complete')}</h2>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>{t("Vous savez desormais conduire la premiere partie de ce debat. Mais intelligence et conscience sont-elles la meme chose ?",'You now know how to lead the first part of this debate. But are intelligence and consciousness the same thing?')}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', background: '#EEEDFE', borderRadius: 12, border: '1.5px solid #534AB7' }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#534AB7' }}>Intelligence</span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', background: '#F8F8F8', borderRadius: 12, border: '1.5px solid #E5E5E5' }}>
              <span style={{ fontSize: 20 }}>🔒</span>
              <span style={{ fontSize: 14, fontWeight: 400, color: '#888' }}>{t('Conscience — prochainement','Consciousness — coming soon')}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', background: '#F8F8F8', borderRadius: 12, border: '1.5px solid #E5E5E5' }}>
              <span style={{ fontSize: 20 }}>🔒</span>
              <span style={{ fontSize: 14, fontWeight: 400, color: '#888' }}>{t('Prise de decision — prochainement','Decision-making — coming soon')}</span>
            </div>
          </div>
          <div style={{ background: '#534AB7', borderRadius: 14, padding: '18px 20px', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'white', lineHeight: 1.5 }}>{t("Une machine peut-elle etre intelligente sans etre consciente ?",'Can a machine be intelligent without being conscious?')}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>{t('A suivre : Conscience','Coming next: Consciousness')}</div>
          </div>
        </Wrap>
      )}

    </div>
  )
}
