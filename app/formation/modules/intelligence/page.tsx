'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

const TOTAL_LEARNING = 16

const QUIZ = [
  {
    q: "Quel est l'objectif principal de la question « Avez-vous le sentiment d'être intelligent ? »",
    opts: [
      "Mesurer l'intelligence des participants",
      "Identifier les personnes ayant un QI élevé",
      "Faire émerger leurs représentations de l'intelligence",
      "Démontrer que l'intelligence est subjective"
    ],
    correct: 2,
    expl: "Cette question fonctionne car elle surprend, fait sourire et crée immédiatement de l'interaction. Elle provoque presque toujours une demande de clarification : les participants répondent souvent spontanément « Ça dépend de quelle intelligence on parle. » C'est précisément ce que l'on cherche."
  },
  {
    q: "La théorie des intelligences multiples de Gardner :",
    opts: [
      "Constitue aujourd'hui la définition scientifique universelle de l'intelligence",
      "Démontre qu'il existe exactement neuf intelligences",
      "A remplacé les tests de QI",
      "Propose différentes formes d'intelligence sans constituer une définition scientifique universellement admise"
    ],
    correct: 3,
    expl: "La théorie des intelligences multiples de Gardner est influente, notamment dans le domaine éducatif, mais elle ne constitue pas un consensus scientifique permettant de définir définitivement l'intelligence. Il est important de ne pas la présenter comme une vérité scientifique définitive."
  },
  {
    q: "Dire que l'intelligence correspond à la capacité à s'adapter :",
    opts: [
      "Constitue une définition fausse",
      "Constitue la définition officielle de l'intelligence",
      "Met en évidence une dimension importante de l'intelligence mais ne suffit pas nécessairement à épuiser la notion",
      "Démontre que seuls les humains sont intelligents"
    ],
    correct: 2,
    expl: "L'adaptation est une dimension fréquemment associée à l'intelligence. Mais poussée jusqu'au bout, cette définition pose la question de la frontière : une huître qui ajuste ses fonctions physiologiques à son environnement serait-elle intelligente ? L'objectif n'est pas de répondre définitivement mais de montrer qu'une définition apparemment évidente entraîne de nouvelles questions."
  },
  {
    q: "Quel énoncé décrit le mieux l'ambition exprimée autour de Dartmouth 1956 ?",
    opts: [
      "Reproduire exactement un cerveau humain",
      "Créer une machine consciente",
      "Construire Internet",
      "Explorer la possibilité de décrire certaines caractéristiques de l'apprentissage et de l'intelligence de façon suffisamment précise pour qu'une machine puisse les simuler"
    ],
    correct: 3,
    expl: "Il ne faut jamais écrire que l'objectif de Dartmouth était de « dupliquer le cerveau humain » — c'est trop simplificateur. Dès les origines de l'IA moderne, l'ambition consiste à se demander si certaines facultés associées à l'intelligence peuvent être décrites puis simulées par une machine."
  },
  {
    q: "Un participant affirme : « ChatGPT est plus intelligent qu'un humain puisqu'il réussit mieux certains tests. » Quelle est la meilleure réaction du fresqueur ?",
    opts: [
      "« C'est faux. »",
      "« Oui, l'IA a dépassé l'homme. »",
      "« Les benchmarks ne servent à rien. »",
      "« Qu'est-ce que nous appelons intelligence ici, et qu'est-ce que ce test mesure réellement ? »"
    ],
    correct: 3,
    expl: "Avant même de savoir si l'affirmation est vraie ou fausse, il faut comprendre ce que l'auteur mesure et ce qu'il appelle « intelligence ». Une performance supérieure sur une tâche ou un benchmark ne signifie pas automatiquement une intelligence supérieure dans tous les sens que nous pouvons donner à ce mot."
  },
]

const QUIZ_EN = [
  {
    q: "What is the main objective of asking 'Do you feel intelligent?'",
    opts: [
      "To measure participants' intelligence",
      "To identify people with a high IQ",
      "To surface their representations of intelligence",
      "To prove that intelligence is subjective"
    ],
    correct: 2,
    expl: "This question works because it surprises, makes people smile, and immediately creates interaction. Participants almost always respond 'It depends on what kind of intelligence you mean' — which is exactly what we are looking for."
  },
  {
    q: "Gardner's theory of multiple intelligences:",
    opts: [
      "Is now the universal scientific definition of intelligence",
      "Proves there are exactly nine intelligences",
      "Has replaced IQ tests",
      "Proposes different forms of intelligence without constituting a universally accepted scientific definition"
    ],
    correct: 3,
    expl: "Gardner's theory is influential, especially in education, but it does not constitute a scientific consensus that definitively defines intelligence. It is important not to present it as a final scientific truth."
  },
  {
    q: "Saying that intelligence means the ability to adapt:",
    opts: [
      "Is a false definition",
      "Is the official definition of intelligence",
      "Highlights an important dimension of intelligence but does not necessarily exhaust the concept",
      "Proves that only humans are intelligent"
    ],
    correct: 2,
    expl: "Adaptation is a frequently associated dimension of intelligence. But pushed to its limits, this definition raises questions: would an oyster that adjusts its physiology to its environment be intelligent? The goal is not to answer definitively but to show that an apparently obvious definition immediately raises new questions."
  },
  {
    q: "Which statement best describes the ambition expressed at Dartmouth 1956?",
    opts: [
      "To exactly reproduce the human brain",
      "To create a conscious machine",
      "To build the internet",
      "To explore whether certain characteristics of learning and intelligence could be described precisely enough for a machine to simulate them"
    ],
    correct: 3,
    expl: "We should never write that the goal of Dartmouth was to 'duplicate the human brain' — that is too simplistic. From the very origins of modern AI, the ambition was to ask whether certain faculties associated with intelligence could be described and then simulated by a machine."
  },
  {
    q: "A participant says: 'ChatGPT is smarter than a human since it does better on tests.' What is the best facilitator response?",
    opts: [
      "'That's false.'",
      "'Yes, AI has surpassed humans.'",
      "'Benchmarks are useless.'",
      "'What do we mean by intelligence here, and what does this test actually measure?'"
    ],
    correct: 3,
    expl: "Before even deciding whether the claim is true or false, we need to understand what the author is measuring and what they call 'intelligence'. Superior performance on a task or benchmark does not automatically mean superior intelligence in every sense we give that word."
  },
]

const PHASE_CELEBRATIONS = [
  { atStep: 4, icon: "🧠", title: "Bonne entrée en matière !", sub: "Tu comprends pourquoi la question est difficile. Place aux repères scientifiques.", color: "#534AB7", bg: "#EEEDFE" },
  { atStep: 8, icon: "🔍", title: "Repères maîtrisés !", sub: "Gardner, QI, adaptation… tu sais les utiliser sans les caricaturer. En route vers Dartmouth.", color: "#0C447C", bg: "#E6F1FB" },
  { atStep: 12, icon: "🎤", title: "Posture d'animateur !", sub: "Tu sais conduire le débat. Encore quelques étapes et le sous-module est complet.", color: "#2B7400", bg: "#D7FFB8" },
  { atStep: 16, icon: "💡", title: "Sous-module terminé !", sub: "Tu es prêt à animer cette séquence. Le quiz t'attend !", color: "#633806", bg: "#FAEEDA" },
]

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

function CelebrationModal({ data, onContinue, lang }: { data: {atStep:number,icon:string,title:string,sub:string,color:string,bg:string}, onContinue: () => void, lang: string }) {
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
            {lang === 'en' ? 'Continue →' : 'Continuer →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ step, phase, quizLength }: { step: number, phase: number, quizLength: number }) {
  const pct = Math.round((step / (TOTAL_LEARNING + quizLength)) * 100)
  const phases = ['🧠', '🔍', '🎤', '💡', '✅']
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

function FeedbackBar({ correct, expl, onNext, last, lang }: { correct: boolean, expl: string, onNext: () => void, last: boolean, lang: string }) {
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: correct ? '#D7FFB8' : '#FFDFE0', borderTop: `4px solid ${correct ? '#58CC02' : '#FF4B4B'}`, padding: '16px 20px 28px', zIndex: 100 }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: correct ? '#2B7400' : '#CC0000', marginBottom: 6 }}>
          {correct ? 'Correct ✓' : (lang === 'en' ? 'Not quite ✗' : 'Pas tout à fait ✗')}
        </div>
        <p style={{ fontSize: 13, color: correct ? '#2B7400' : '#990000', lineHeight: 1.6, marginBottom: 12 }}>{expl}</p>
        <button onClick={onNext} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: correct ? '#58CC02' : '#FF4B4B', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: correct ? '0 4px 0 #3D8A00' : '0 4px 0 #CC0000' }}>
          {last ? (lang === 'en' ? 'See my results →' : 'Voir mes résultats →') : (lang === 'en' ? 'Continue →' : 'Continuer →')}
        </button>
      </div>
    </div>
  )
}

function Wrap({ children, onNext, onPrev, canNext = true, nextLabel }: {
  children: React.ReactNode, onNext?: () => void, onPrev?: () => void, canNext?: boolean, nextLabel?: string
}) {
  return (
    <div style={{ padding: '20px 16px 110px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ animation: 'fadeIn 0.25s ease' }}>{children}</div>
      {(onNext || onPrev) && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px 22px', background: 'white', borderTop: '1px solid #E5E5E5', zIndex: 10 }}>
          <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', gap: 10 }}>
            {onPrev && <button onClick={onPrev} style={{ padding: '15px 18px', borderRadius: 16, border: '2px solid #E5E5E5', background: 'white', color: '#888', fontWeight: 700, fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>←</button>}
            {onNext && <button onClick={onNext} disabled={!canNext} style={{ flex: 1, padding: '15px', borderRadius: 16, border: 'none', background: canNext ? '#58CC02' : '#E5E5E5', color: canNext ? 'white' : '#AFAFAF', fontWeight: 800, fontSize: 15, cursor: canNext ? 'pointer' : 'default', boxShadow: canNext ? '0 4px 0 #3D8A00' : 'none' }}>{nextLabel || 'Continuer →'}</button>}
          </div>
        </div>
      )}
    </div>
  )
}

function Tag({ children, color }: { children: React.ReactNode, color: string }) {
  return <div style={{ display: 'inline-block', background: color, fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, marginBottom: 12 }}>{children}</div>
}

// Composants spécifiques à ce module
function AnimatorBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#F0F0FF', borderRadius: 14, padding: '14px 16px', border: '2px solid #534AB7', marginBottom: 14 }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: '#534AB7', marginBottom: 8 }}>🎤 Dans la Fresque</div>
      {children}
    </div>
  )
}
function KnowledgeBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#E8FBF2', borderRadius: 14, padding: '14px 16px', border: '2px solid #00A85E', marginBottom: 14 }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: '#00A85E', marginBottom: 8 }}>🧠 À comprendre</div>
      {children}
    </div>
  )
}
function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#FFF9E6', borderRadius: 14, padding: '14px 16px', border: '2px solid #FFC800', marginBottom: 14 }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: '#8B5E00', marginBottom: 8 }}>⚠️ Point de vigilance</div>
      {children}
    </div>
  )
}

export default function ModulePage() {
  const { lang } = useLanguage()
  const t2 = (fr: string, en: string) => lang === 'en' ? en : fr
  const activeQuiz = lang === 'en' ? QUIZ_EN : QUIZ

  const [userId, setUserId] = useState<string | null>(null)
  const [moduleId, setModuleId] = useState<string | null>(null)
  const [moduleTitle, setModuleTitle] = useState('Intelligence')
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [celebration, setCelebration] = useState<{atStep:number,icon:string,title:string,sub:string,color:string,bg:string}|null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUIZ.length).fill(null))
  const [feedback, setFeedback] = useState<boolean | null>(null)
  const [showFb, setShowFb] = useState(false)
  const [score, setScore] = useState(0)
  const [saved, setSaved] = useState(false)
  // Interaction states
  const [s1answer, setS1answer] = useState<number | null>(null)
  const [s6answer, setS6answer] = useState<number | null>(null)
  const [gardnerRevealed, setGardnerRevealed] = useState(false)
  const [halfShown, setHalfShown] = useState(false)
  const [visibleWords, setVisibleWords] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/'; return }
      setUserId(user.id)
      supabase.from('modules').select('id, titre').eq('titre', 'Intelligence').single().then(({ data }) => {
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
  const isQuiz = step >= TOTAL_LEARNING && step < TOTAL_LEARNING + activeQuiz.length
  const isResult = step >= TOTAL_LEARNING + activeQuiz.length
  const phase = step < 4 ? 0 : step < 8 ? 1 : step < 12 ? 2 : step < 16 ? 3 : 4

  const pickAnswer = async (optIdx: number) => {
    if (answers[qIdx] !== null) return
    const correct = activeQuiz[qIdx].correct === optIdx
    const na = [...answers]; na[qIdx] = optIdx; setAnswers(na)
    setFeedback(correct); setShowFb(true)
    if (correct) setScore(s => s + 1)
    if (step === TOTAL_LEARNING + activeQuiz.length - 1 && !saved) {
      setSaved(true)
      const finalScore = score + (correct ? 1 : 0)
      await supabase.from('progressions').upsert({
        animateur_id: userId!, module_id: moduleId,
        completed: finalScore === activeQuiz.length,
        completed_at: finalScore === activeQuiz.length ? new Date().toISOString() : null,
        attempts: 1,
      }, { onConflict: 'animateur_id,module_id' })
    }
  }

  const nextQuiz = () => { setShowFb(false); setFeedback(null); next() }

  const restart = () => {
    setStep(TOTAL_LEARNING)
    setAnswers(Array(QUIZ.length).fill(null))
    setScore(0); setShowFb(false); setFeedback(null); setSaved(false)
  }

  if (loading) return <div className="container"><div className="empty"><p>Chargement…</p></div></div>

  const header = (
    <div style={{ position: 'sticky', top: 0, zIndex: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'white', borderBottom: '0.5px solid var(--border)' }}>
        <a href="/formation/modules" style={{ fontSize: 16, color: '#AFAFAF', fontWeight: 700, textDecoration: 'none', lineHeight: 1 }}>✕</a>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#555', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{moduleTitle}</span>
        <LanguageSwitch />
      </div>
      {!isResult && <ProgressBar step={step} phase={phase} quizLength={activeQuiz.length} />}
    </div>
  )

  if (isQuiz) {
    const q = activeQuiz[qIdx]
    const ua = answers[qIdx]
    const labels = ['A','B','C','D']
    return (
      <div style={{ minHeight: '100vh', background: '#F7F7F7' }}>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
        {celebration && <CelebrationModal data={celebration} onContinue={closeCelebration} lang={lang}/>}
        {header}
        <div style={{ padding: '20px 16px 120px', maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#534AB7', marginBottom: 12 }}>{t2('Question','Question')} {qIdx + 1} / {activeQuiz.length} · Score {score}</div>
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
            {pct === 100 ? (
              <div>
                <div style={{ fontSize: 56, marginBottom: 12 }}>🧠</div>
                <div style={{ display: 'inline-block', background: '#EEEDFE', color: '#534AB7', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20, marginBottom: 8, letterSpacing: 1 }}>{t2('SOUS-MODULE VALIDÉ','SUB-MODULE COMPLETE')}</div>
                <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{t2('MAÎTRISE : INTELLIGENCE','MASTERY: INTELLIGENCE')}</h2>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#534AB7', marginBottom: 8 }}>{activeQuiz.length} / {activeQuiz.length}</div>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>{t2("Tu maîtrises ce sous-module. Tu sais conduire le débat sur l'intelligence.",'You have mastered this sub-module. You can lead the debate on intelligence.')}</p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 52, marginBottom: 12 }}>{pct >= 80 ? '🎯' : '💪'}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#534AB7', marginBottom: 8 }}>{total} / {activeQuiz.length}</div>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>{pct >= 80 ? t2('Beau parcours ! Quelques notions méritent encore un peu de révision.','Great work! A few notions still need some review.') : t2("Continue à apprendre ! Le module t'attend pour une révision.",'Keep learning! The module awaits for a review.')}</p>
              </div>
            )}
          </div>
          {wrongs.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 10 }}>{t2('Questions manquées :','Missed questions:')}</div>
              {wrongs.map(i => (
                <div key={i} style={{ padding: 12, background: '#FAECE7', borderRadius: 10, border: '0.5px solid #F0997B', marginBottom: 8, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Q{i+1}. {activeQuiz[i].q.substring(0, 70)}...</div>
                  <div style={{ color: '#085041' }}>{t2('Bonne réponse :','Correct answer:')} {activeQuiz[i].opts[activeQuiz[i].correct]}</div>
                </div>
              ))}
            </div>
          )}
          {/* Teaser sous-modules suivants */}
          <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #E5E5E5', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 16px', background: '#1a1a2e', color: 'white', fontWeight: 700 }}>📍 {t2('Votre parcours','Your progress')}</div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { num: '01', label: 'Intelligence', done: true },
                { num: '02', label: t2('Conscience — à venir','Consciousness — coming soon'), done: false },
                { num: '03', label: t2('Prise de décision — à venir','Decision-making — coming soon'), done: false },
              ].map(item => (
                <div key={item.num} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', background: item.done ? '#EEEDFE' : '#F8F8F8', borderRadius: 10 }}>
                  <span style={{ fontSize: 18 }}>{item.done ? '✅' : '🔒'}</span>
                  <span style={{ fontSize: 13, fontWeight: item.done ? 700 : 400, color: item.done ? '#534AB7' : '#888' }}>{item.num} — {item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#534AB7', borderRadius: 14, padding: '16px 18px', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'white', lineHeight: 1.5 }}>
              {t2("Une machine peut-elle être intelligente sans être consciente ?","Can a machine be intelligent without being conscious?")}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>{t2('À suivre : Conscience','Coming next: Consciousness')}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={restart} style={{ width: '100%', padding: '15px', borderRadius: 16, border: 'none', background: '#58CC02', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 0 #3D8A00' }}>{t2('Refaire le quiz','Retake quiz')}</button>
            <button onClick={() => { window.location.href = '/formation/modules' }} style={{ width: '100%', padding: '15px', borderRadius: 16, border: '2px solid #E5E5E5', background: 'white', color: '#555', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>{t2('← Retour aux modules','← Back to modules')}</button>
          </div>
        </div>
      </div>
    )
  }

  const s = step
  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} @keyframes appear{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}}`}</style>
      {celebration && <CelebrationModal data={celebration} onContinue={closeCelebration} lang={lang}/>}
      {header}

      {/* S0 — Page d'entrée module global */}
      {s === 0 && <Wrap onNext={next} nextLabel={t2('Commencer →','Start →')}>
        <div style={{ textAlign: 'center', padding: '12px 0', animation: 'fadeIn .4s ease' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🧠</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, lineHeight: 1.3 }}>{t2('Intelligence, conscience et prise de décision','Intelligence, Consciousness & Decision-making')}</h1>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 20 }}>{t2("Nous parlons d'intelligence artificielle en permanence. Mais savons-nous vraiment ce que nous appelons intelligence ? Une IA peut-elle être consciente ? Et peut-elle réellement prendre une décision ?","We constantly talk about artificial intelligence. But do we really know what we mean by intelligence? Can an AI be conscious? And can it actually make a decision?")}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {[
              { num: '01', label: t2('Intelligence','Intelligence'), desc: t2("Comprendre ce que nous mettons derrière le mot « intelligence ».",'Understanding what we mean by the word "intelligence".'), active: true },
              { num: '02', label: t2('Conscience','Consciousness'), desc: t2('À venir.','Coming soon.'), active: false },
              { num: '03', label: t2('Prise de décision','Decision-making'), desc: t2('À venir.','Coming soon.'), active: false },
            ].map(item => (
              <div key={item.num} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 16px', background: item.active ? 'white' : '#F8F8F8', borderRadius: 14, border: `1.5px solid ${item.active ? '#534AB7' : '#E5E5E5'}`, opacity: item.active ? 1 : 0.5 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: item.active ? '#534AB7' : '#E5E5E5', color: item.active ? 'white' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{item.active ? item.num : '🔒'}</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: item.active ? '#1a1a2e' : '#888', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Wrap>}

      {/* S1 — Êtes-vous intelligent ? */}
      {s === 1 && <Wrap onNext={s1answer !== null ? next : undefined} onPrev={prev} nextLabel={t2('Continuer →','Continue →')}>
        <Tag color="#EEEDFE"><span style={{ color: '#534AB7' }}>{t2('SÉQUENCE 1 — Ouverture','SEQUENCE 1 — Opening')}</span></Tag>
        <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 20, lineHeight: 1.3, textAlign: 'center' }}>{t2("Avez-vous le sentiment d'être intelligent ?","Do you feel intelligent?")}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {[
            { id: 0, label: t2('Oui','Yes'), icon: '✅' },
            { id: 1, label: t2('Non','No'), icon: '❌' },
            { id: 2, label: t2('Ça dépend…','It depends…'), icon: '🤔' },
            { id: 3, label: t2('Question piège ? 😏','A trick question? 😏'), icon: '😏' },
          ].map(opt => (
            <button key={opt.id} onClick={() => setS1answer(opt.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14, border: `2.5px solid ${s1answer === opt.id ? '#534AB7' : '#E5E5E5'}`, background: s1answer === opt.id ? '#EEEDFE' : 'white', cursor: 'pointer', textAlign: 'left', fontWeight: s1answer === opt.id ? 700 : 500, fontSize: 15, color: '#1a1a2e', transition: 'all .15s' }}>
              <span style={{ fontSize: 22 }}>{opt.icon}</span>{opt.label}
            </button>
          ))}
        </div>
        {s1answer !== null && (
          <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '16px 18px', animation: 'appear .3s ease' }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: 'white', marginBottom: 8 }}>{t2('Intéressant…','Interesting…')}</p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.65 }}>{t2("Mais avant de répondre, encore faudrait-il savoir ce que signifie être intelligent.",'But before answering, we would first need to know what being intelligent actually means.')}</p>
          </div>
        )}
      </Wrap>}

      {/* S2 — Côté animateur séquence 1 */}
      {s === 2 && <Wrap onNext={next} onPrev={prev}>
        <AnimatorBox>
          <p style={{ fontSize: 13, color: '#3C3489', lineHeight: 1.65, marginBottom: 10 }}>{t2("C'est volontairement l'une des premières questions que l'on peut poser aux participants. Elle fonctionne car elle surprend, fait sourire, crée de l'interaction et provoque presque toujours une demande de clarification.","This is deliberately one of the first questions you can ask participants. It works because it surprises, makes people smile, creates interaction, and almost always triggers a request for clarification.")}</p>
          <p style={{ fontSize: 13, color: '#3C3489', lineHeight: 1.65 }}>{t2("Les participants répondent souvent spontanément : « Ça dépend de quelle intelligence on parle. » Et c'est précisément ce que l'on cherche.",'Participants often respond spontaneously: "It depends on what kind of intelligence we're talking about." That is exactly what we are looking for.')}</p>
        </AnimatorBox>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e', marginBottom: 8 }}>{t2('Relances possibles :','Possible follow-up questions:')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              t2("Qu'est-ce qui vous permet de dire qu'une personne est intelligente ?",'What makes you say that someone is intelligent?'),
              t2("Si vous deviez définir l'intelligence en une phrase ?",'If you had to define intelligence in one sentence?'),
              t2("De quelle forme d'intelligence parlez-vous ?",'Which form of intelligence are you referring to?'),
              t2("Est-ce qu'être intelligent, c'est savoir raisonner ?",'Is being intelligent the same as being able to reason?'),
            ].map((q, i) => (
              <div key={i} style={{ padding: '10px 14px', background: '#F8F9FF', borderRadius: 10, border: '1px solid #AFA9EC', fontSize: 13, color: '#534AB7', fontStyle: 'italic' }}>
                « {q} »
              </div>
            ))}
          </div>
        </div>
        <WarningBox>
          <p style={{ fontSize: 13, color: '#8B5E00', lineHeight: 1.65, margin: 0 }}>{t2("Ne cherchez pas immédiatement à donner une réponse. Faites émerger les représentations du groupe.",'Do not try to give an answer immediately. Let the group\'s representations emerge.')}</p>
        </WarningBox>
      </Wrap>}

      {/* S3 — Une ou plusieurs intelligences ? */}
      {s === 3 && <Wrap onNext={next} onPrev={prev}>
        <Tag color="#EEEDFE"><span style={{ color: '#534AB7' }}>{t2('SÉQUENCE 2 — Gardner','SEQUENCE 2 — Gardner')}</span></Tag>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>{t2("Existe-t-il plusieurs formes d'intelligence ?","Are there multiple forms of intelligence?")}</h2>
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 14 }}>{t2("Les participants vont généralement citer plusieurs manières d'être intelligent. Voici quelques exemples habituellement évoqués :","Participants generally mention several ways of being intelligent. Here are some commonly cited examples:")}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {[t2('Raisonner','Reasoning'), t2('Comprendre les autres','Understanding others'), t2('Utiliser son corps','Using one\'s body'), t2('Créer','Creating'), t2('Manier le langage','Handling language'), t2("Comprendre son environnement",'Understanding one\'s environment')].map((item, i) => (
            <span key={i} style={{ padding: '6px 12px', borderRadius: 20, background: '#EEEDFE', color: '#534AB7', fontSize: 13, fontWeight: 600 }}>{item}</span>
          ))}
        </div>
        <KnowledgeBox>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8, color: '#085041' }}>Howard Gardner</div>
          <p style={{ fontSize: 13, color: '#085041', lineHeight: 1.65, marginBottom: 10 }}>{t2("Gardner a proposé plusieurs formes d'intelligence, notamment :","Gardner proposed several forms of intelligence, including:")}</p>
          {!gardnerRevealed ? (
            <button onClick={() => setGardnerRevealed(true)} style={{ padding: '8px 16px', borderRadius: 10, background: '#00A85E', color: 'white', border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
              {t2('Voir les intelligences →','Show intelligences →')}
            </button>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, animation: 'fadeIn .3s ease' }}>
              {[t2('Linguistique','Linguistic'), t2('Logico-mathématique','Logical-mathematical'), t2('Spatiale','Spatial'), t2('Musicale','Musical'), t2('Corporelle-kinesthésique','Bodily-kinesthetic'), t2('Interpersonnelle','Interpersonal'), t2('Intrapersonnelle','Intrapersonal'), t2('Naturaliste','Naturalistic')].map((intel, i) => (
                <span key={i} style={{ padding: '4px 10px', borderRadius: 20, background: 'white', color: '#00A85E', fontSize: 12, fontWeight: 600, border: '1px solid #00A85E' }}>{intel}</span>
              ))}
            </div>
          )}
        </KnowledgeBox>
        <WarningBox>
          <p style={{ fontSize: 13, color: '#8B5E00', lineHeight: 1.65, margin: 0 }}>{t2("La théorie des intelligences multiples de Gardner est influente, notamment dans le domaine éducatif, mais elle ne constitue pas un consensus scientifique permettant de définir définitivement l'intelligence.",'Gardner\'s theory of multiple intelligences is influential, especially in education, but it does not constitute a scientific consensus that definitively defines intelligence.')}</p>
        </WarningBox>
      </Wrap>}

      {/* S4 — 8,5 intelligences [→ CELEBRATION] */}
      {s === 4 && <Wrap onNext={next} onPrev={prev} nextLabel={t2('Phase suivante →','Next phase →')}>
        <Tag color="#EEEDFE"><span style={{ color: '#534AB7' }}>{t2('SÉQUENCE 3 — 8½','SEQUENCE 3 — 8½')}</span></Tag>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 52, fontWeight: 900, marginBottom: 8, color: '#1a1a2e' }}>8 {t2('intelligences','intelligences')}</div>
          {!halfShown ? (
            <button onClick={() => setHalfShown(true)} style={{ padding: '10px 20px', borderRadius: 12, background: '#534AB7', color: 'white', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              + ?
            </button>
          ) : (
            <div style={{ animation: 'appear .4s ease' }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#534AB7', marginBottom: 12 }}>8,5 ? 🤔</div>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 16 }}>{t2("Gardner s'est interrogé sur une possible intelligence existentielle et a lui-même utilisé avec humour l'idée de « 8½ intelligences », considérant que cette candidate ne remplissait pas suffisamment tous ses critères.",'Gardner questioned a possible existential intelligence and humorously coined the idea of "8½ intelligences", considering that this candidate did not fully meet all his criteria.')}</p>
            </div>
          )}
        </div>
        <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '18px 20px', marginTop: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: 'white', textAlign: 'center' }}>
            {t2("Mais avons-nous vraiment défini l'intelligence ?","But have we really defined intelligence?")}
          </div>
        </div>
      </Wrap>}

      {/* S5 — L'exemple du chat */}
      {s === 5 && <Wrap onNext={next} onPrev={prev}>
        <Tag color="#EEEDFE"><span style={{ color: '#534AB7' }}>{t2("SÉQUENCE 4 — L'exemple du chat","SEQUENCE 4 — The cat example")}</span></Tag>
        <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 16 }}>{t2("Imaginez que je vous demande : « Qu'est-ce qu'un chat ? »","Imagine I ask you: \"What is a cat?\"")}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
          {['🐈 noir','🐈 blanc','🐈 gris','🐈 sans poils','🐈 grand','🐈 petit'].map((chat, i) => (
            <div key={i} style={{ padding: '10px 16px', background: 'white', borderRadius: 12, border: '1.5px solid #E5E5E5', fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>{chat}</div>
          ))}
        </div>
        <div style={{ background: '#534AB7', borderRadius: 14, padding: '16px 18px', marginBottom: 14, textAlign: 'center' }}>
          <p style={{ fontWeight: 800, fontSize: 15, color: 'white', lineHeight: 1.5 }}>
            {t2("Vous m'avez décrit différentes formes de chats… mais vous ne m'avez toujours pas dit ce qu'est un chat.","You have described different types of cats… but you still haven't told me what a cat is.")}
          </p>
        </div>
        <KnowledgeBox>
          <p style={{ fontSize: 13, color: '#085041', lineHeight: 1.65, margin: 0 }}>
            {t2("Pour l'intelligence, c'est un peu la même chose : identifier plusieurs formes d'intelligence ne suffit pas nécessairement à définir ce qu'est l'intelligence.",'For intelligence, it is much the same: identifying multiple forms of intelligence does not necessarily suffice to define what intelligence is.')}
          </p>
        </KnowledgeBox>
        <AnimatorBox>
          <p style={{ fontSize: 13, color: '#3C3489', lineHeight: 1.65, margin: 0 }}>
            {t2("Cet exemple du chat fonctionne très bien pour faire sentir aux participants la différence entre décrire des formes et définir une essence.",'This cat example works very well for helping participants feel the difference between describing forms and defining an essence.')}
          </p>
        </AnimatorBox>
      </Wrap>}

      {/* S6 — Raisonner = être intelligent ? */}
      {s === 6 && <Wrap onNext={next} onPrev={prev}>
        <Tag color="#E6F1FB"><span style={{ color: '#0C447C' }}>{t2('SÉQUENCE 5 — Le QI','SEQUENCE 5 — IQ')}</span></Tag>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>{t2("Être intelligent, est-ce savoir raisonner ?","Is being intelligent the same as knowing how to reason?")}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {[t2('Formuler une hypothèse','Formulate a hypothesis'), t2('Analyser','Analyse'), t2('Raisonner','Reason'), t2('Déduire','Deduce'), t2('Résoudre un problème','Solve a problem')].map((cap, i) => (
            <span key={i} style={{ padding: '6px 12px', borderRadius: 20, background: '#E6F1FB', color: '#0C447C', fontSize: 13, fontWeight: 600 }}>{cap}</span>
          ))}
        </div>
        <KnowledgeBox>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8, color: '#085041' }}>{t2('Le QI','IQ')}</div>
          <p style={{ fontSize: 13, color: '#085041', lineHeight: 1.65, marginBottom: 8 }}>{t2("Les tests de QI évaluent certaines capacités cognitives : raisonnement, compréhension, mémoire de travail, vitesse de traitement. Ils fournissent une information utile dans certains contextes.",'IQ tests assess certain cognitive abilities: reasoning, comprehension, working memory, processing speed. They provide useful information in certain contexts.')}</p>
          <div style={{ background: 'white', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
            <span style={{ fontWeight: 900, fontSize: 18, color: '#0C447C' }}>QI ≠ {t2("totalité de l'intelligence humaine",'all of human intelligence')}</span>
          </div>
        </KnowledgeBox>
        <WarningBox>
          <p style={{ fontSize: 13, color: '#8B5E00', lineHeight: 1.65, margin: 0 }}>
            {t2("Ne jamais présenter le QI comme inutile ou faux. Mesurer certaines capacités cognitives ne signifie pas nécessairement mesurer tout ce que nous pouvons mettre derrière le concept d'intelligence.",'Never present IQ as useless or false. Measuring certain cognitive abilities does not necessarily mean measuring everything we can put behind the concept of intelligence.')}
          </p>
        </WarningBox>
      </Wrap>}

      {/* S7 — Capacité à s'adapter */}
      {s === 7 && <Wrap onNext={s6answer !== null ? next : undefined} onPrev={prev} nextLabel={t2('Phase suivante →','Next phase →')}>
        <Tag color="#E1F5EE"><span style={{ color: '#085041' }}>{t2("SÉQUENCE 6 — L'adaptation","SEQUENCE 6 — Adaptation")}</span></Tag>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>{t2("« L'intelligence est la capacité à s'adapter à son environnement. »",'\"Intelligence is the ability to adapt to one\'s environment.\"')}</h2>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#555', marginBottom: 10 }}>{t2('Vous êtes d\'accord ?','Do you agree?')}</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {[{ id: 0, label: '👍 Oui', bg: '#D7FFB8', color: '#2B7400' }, { id: 1, label: '🤔 En partie', bg: '#FAEEDA', color: '#633806' }, { id: 2, label: '👎 Non', bg: '#FFDFE0', color: '#CC0000' }].map(opt => (
            <button key={opt.id} onClick={() => setS6answer(opt.id)} style={{ flex: 1, padding: '14px', borderRadius: 12, border: `2px solid ${s6answer === opt.id ? opt.color : '#E5E5E5'}`, background: s6answer === opt.id ? opt.bg : 'white', color: s6answer === opt.id ? opt.color : '#888', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              {opt.label}
            </button>
          ))}
        </div>
        {s6answer !== null && (
          <div style={{ animation: 'fadeIn .3s ease' }}>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 12 }}>{t2("L'adaptation est une dimension fréquemment associée à l'intelligence. Mais poussons la définition jusqu'au bout.",'Adaptation is a frequently associated dimension of intelligence. But let us push the definition to its limits.')}</p>
            <KnowledgeBox>
              <p style={{ fontSize: 13, color: '#085041', lineHeight: 1.65, marginBottom: 8 }}>{t2("Une huître est capable d'ajuster certaines fonctions physiologiques aux variations de son environnement, notamment aux conditions de salinité.","An oyster is capable of adjusting certain physiological functions to variations in its environment, particularly to salinity conditions.")}</p>
              <p style={{ fontSize: 13, color: '#085041', lineHeight: 1.65 }}>
                {t2("Si la capacité d'adaptation suffit à définir l'intelligence, faut-il considérer tous les organismes capables de s'adapter comme intelligents au même sens ?",'If the capacity for adaptation is enough to define intelligence, should we consider all organisms capable of adapting as intelligent in the same sense?')}
              </p>
            </KnowledgeBox>
            <WarningBox>
              <p style={{ fontSize: 13, color: '#8B5E00', lineHeight: 1.65, margin: 0 }}>
                {t2("Ne pas chercher à répondre définitivement. L'objectif est de montrer qu'une définition apparemment évidente entraîne immédiatement de nouvelles questions.",'Do not try to answer definitively. The goal is to show that an apparently obvious definition immediately raises new questions.')}
              </p>
            </WarningBox>
          </div>
        )}
      </Wrap>}

      {/* S8 — Synthèse [→ CELEBRATION] */}
      {s === 8 && <Wrap onNext={next} onPrev={prev} nextLabel={t2('Phase suivante →','Next phase →')}>
        <Tag color="#D7FFB8"><span style={{ color: '#2B7400' }}>{t2('SÉQUENCE 7 — Synthèse','SEQUENCE 7 — Summary')}</span></Tag>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>{t2("Alors… qu'est-ce que l'intelligence ?","So… what is intelligence?")}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {[t2('Raisonner ?','Reasoning?'), t2('Apprendre ?','Learning?'), t2('Résoudre des problèmes ?','Solving problems?'), t2("S'adapter ?","Adapting?"), t2('Comprendre ?','Understanding?'), t2('Créer ?','Creating?'), t2('Interagir ?','Interacting?')].map((w, i) => (
            <div key={i} style={{ padding: '10px 16px', background: 'white', borderRadius: 10, border: '0.5px solid #E5E5E5', fontSize: 16, fontWeight: 700, color: '#1a1a2e', animation: `fadeIn ${0.1 + i * 0.05}s ease` }}>
              {w}
            </div>
          ))}
        </div>
        <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
          <p style={{ fontWeight: 800, fontSize: 15, color: 'white', textAlign: 'center', lineHeight: 1.6 }}>
            {t2("Il n'existe pas une définition simple et unique permettant d'épuiser à elle seule ce que nous appelons intelligence.","There is no single, simple definition that can alone exhaust what we call intelligence.")}
          </p>
        </div>
        <WarningBox>
          <p style={{ fontSize: 13, color: '#8B5E00', lineHeight: 1.65, margin: 0 }}>
            <strong>{t2('Ne pas dire :','Do not say:')}</strong> {t2("« Les scientifiques ne savent pas ce qu'est l'intelligence. »",'\"Scientists do not know what intelligence is.\"')}<br/><br/>
            <strong>{t2('Dire plutôt :','Say instead:')}</strong> {t2("« Différentes disciplines mettent l'accent sur des dimensions différentes. Il n'existe pas une définition unique qui mette fin à tous les débats. »",'\"Different disciplines emphasise different dimensions. There is no single definition that ends all debates.\"')}
          </p>
        </WarningBox>
      </Wrap>}

      {/* S9 — Pourquoi "intelligence" artificielle ? */}
      {s === 9 && <Wrap onNext={next} onPrev={prev}>
        <Tag color="#FAEEDA"><span style={{ color: '#633806' }}>{t2("SÉQUENCE 8 — L'IA","SEQUENCE 8 — AI")}</span></Tag>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>{t2('Pourquoi parler d\'« intelligence » artificielle ?','Why talk about "artificial" intelligence?')}</h2>
        <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '16px 18px', marginBottom: 14, textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'white' }}>
            {t2('Intelligence naturelle → Intelligence artificielle','Natural intelligence → Artificial intelligence')}
          </div>
        </div>
        <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 14 }}>
          {t2("Si nous avons déjà du mal à définir l'intelligence humaine, que signifie exactement le mot « intelligence » lorsque nous parlons d'intelligence artificielle ?",'If we already struggle to define human intelligence, what exactly does the word "intelligence" mean when we talk about artificial intelligence?')}
        </p>
        <KnowledgeBox>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8, color: '#085041' }}>{t2("Intelligence en anglais",'Intelligence in English')}</div>
          <p style={{ fontSize: 13, color: '#085041', lineHeight: 1.65, marginBottom: 8 }}>
            {t2("En anglais, « intelligence » peut également désigner le renseignement — la collecte, le traitement et l'exploitation d'informations.",'In English, "intelligence" can also mean intelligence gathering — the collection, processing and exploitation of information.')}
          </p>
          <div style={{ background: 'white', borderRadius: 8, padding: '8px 12px', fontWeight: 700, fontSize: 13, color: '#085041', marginBottom: 8 }}>
            CIA = Central Intelligence Agency
          </div>
        </KnowledgeBox>
        <WarningBox>
          <p style={{ fontSize: 13, color: '#8B5E00', lineHeight: 1.65, margin: 0 }}>
            {t2("Attention : cela ne signifie pas que l'expression « Artificial Intelligence » a été créée pour désigner simplement du traitement de l'information. C'est une nuance importante.",'Attention: this does not mean that the expression "Artificial Intelligence" was created to simply designate information processing. This is an important nuance.')}
          </p>
        </WarningBox>
      </Wrap>}

      {/* S10 — Dartmouth */}
      {s === 10 && <Wrap onNext={next} onPrev={prev}>
        <Tag color="#FAEEDA"><span style={{ color: '#633806' }}>{t2('SÉQUENCE 9 — Dartmouth 1956','SEQUENCE 9 — Dartmouth 1956')}</span></Tag>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>{t2('Dartmouth : aux origines de l\'IA','Dartmouth: the origins of AI')}</h2>
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, overflow: 'hidden', borderRadius: 12, border: '1.5px solid #E5E5E5' }}>
          {[{ year: '1955', label: t2('Proposition','Proposal'), icon: '📝' }, { year: '1956', label: t2('Dartmouth Summer Research Project on Artificial Intelligence','Dartmouth Summer Research Project on Artificial Intelligence'), icon: '🏛️' }].map((item, i) => (
            <div key={i} style={{ flex: 1, padding: '14px 12px', background: i === 1 ? '#FAEEDA' : 'white', borderRight: i === 0 ? '1px solid #E5E5E5' : 'none', textAlign: 'center' }}>
              <div style={{ fontSize: 22 }}>{item.icon}</div>
              <div style={{ fontWeight: 900, fontSize: 18, color: '#633806' }}>{item.year}</div>
              <div style={{ fontSize: 11, color: '#633806', lineHeight: 1.4, marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 14 }}>
          {t2("John McCarthy, Marvin Minsky, Nathaniel Rochester et Claude Shannon proposent d'organiser un projet de recherche d'été à Dartmouth. Leur hypothèse fondatrice : certains aspects de l'apprentissage et d'autres caractéristiques de l'intelligence pourraient être décrits suffisamment précisément pour qu'une machine puisse les simuler.",'John McCarthy, Marvin Minsky, Nathaniel Rochester and Claude Shannon proposed organising a summer research project at Dartmouth. Their founding hypothesis: certain aspects of learning and other characteristics of intelligence could be described precisely enough for a machine to simulate them.')}
        </p>
        <WarningBox>
          <p style={{ fontSize: 13, color: '#8B5E00', lineHeight: 1.65, margin: 0 }}>
            <strong>{t2('Ne jamais écrire :','Never write:')}</strong> {t2("« L'objectif de Dartmouth était de dupliquer le cerveau humain. »",'\"The goal of Dartmouth was to duplicate the human brain.\"')}<br/><br/>
            <strong>{t2('Préférer :','Prefer:')}</strong> {t2("« Dès les origines de l'IA moderne, l'ambition consiste à se demander si certaines facultés associées à l'intelligence peuvent être décrites puis simulées par une machine. »",'\"From the very origins of modern AI, the ambition was to ask whether certain faculties associated with intelligence could be described and then simulated by a machine.\"')}
          </p>
        </WarningBox>
        <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '14px 18px', textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'white' }}>
            {t2("La comparaison avec l'intelligence humaine n'est donc pas nouvelle.","The comparison with human intelligence is therefore not new.")}
          </div>
        </div>
      </Wrap>}

      {/* S11 — Mise en situation finale [→ CELEBRATION] */}
      {s === 11 && <Wrap onNext={next} onPrev={prev} nextLabel={t2('Phase suivante →','Next phase →')}>
        <Tag color="#FFDFE0"><span style={{ color: '#CC0000' }}>{t2('MISE EN SITUATION','SIMULATION')}</span></Tag>
        <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '20px', marginBottom: 20, textAlign: 'center', border: '3px solid #FF4B4B' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, marginBottom: 8 }}>BREAKING NEWS</div>
          <div style={{ fontWeight: 900, fontSize: 18, color: 'white', lineHeight: 1.4 }}>
            {t2("« L'IA EST DÉSORMAIS PLUS INTELLIGENTE QUE L'ÊTRE HUMAIN »","\"AI IS NOW MORE INTELLIGENT THAN HUMANS\"")}
          </div>
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e', marginBottom: 14 }}>{t2('Quelle devrait être votre première réaction ?','What should be your first reaction?')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {[
            { label: t2("A — « C'est inquiétant. »",'A — "This is worrying."'), correct: false },
            { label: t2("B — « C'est formidable. »",'B — "This is wonderful."'), correct: false },
            { label: t2("C — « C'est faux. »",'C — "This is false."'), correct: false },
            { label: t2('D — « Que signifie ici le mot "intelligente" ? »','D — "What does the word \'intelligent\' mean here?"'), correct: true },
          ].map((opt, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRadius: 12, border: `2px solid ${opt.correct ? '#58CC02' : '#E5E5E5'}`, background: opt.correct ? '#D7FFB8' : 'white', fontSize: 14, fontWeight: opt.correct ? 700 : 400, color: opt.correct ? '#2B7400' : '#555' }}>
              {opt.label} {opt.correct && ' ✓'}
            </div>
          ))}
        </div>
        <KnowledgeBox>
          <p style={{ fontSize: 13, color: '#085041', lineHeight: 1.65, margin: 0 }}>
            {t2("Avant même de savoir si l'affirmation est vraie ou fausse, il faut comprendre ce que l'auteur mesure et ce qu'il appelle « intelligence ».",'Before even deciding whether the claim is true or false, we need to understand what the author is measuring and what they call "intelligence".')}
          </p>
        </KnowledgeBox>
        <div style={{ background: '#534AB7', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'white', marginBottom: 10 }}>🧠 {t2('LE RÉFLEXE À RETENIR','THE REFLEX TO REMEMBER')}</div>
          {[
            t2("1. Quelle définition de l'intelligence est utilisée ?",'1. What definition of intelligence is being used?'),
            t2("2. Quelle capacité est réellement mesurée ?",'2. What capability is actually being measured?'),
            t2("3. Comment cette capacité a-t-elle été évaluée ?",'3. How was this capability evaluated?'),
          ].map((q, i) => (
            <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', padding: '6px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.15)' : 'none', lineHeight: 1.5 }}>{q}</div>
          ))}
        </div>
      </Wrap>}

      {/* S12 — Rôle d'animateur [→ CELEBRATION] */}
      {s === 12 && <Wrap onNext={next} onPrev={prev} nextLabel={t2('Phase suivante →','Next phase →')}>
        <Tag color="#E1F5EE"><span style={{ color: '#085041' }}>{t2("VOTRE RÔLE D'ANIMATEUR","YOUR ROLE AS FACILITATOR")}</span></Tag>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>🎤 {t2("Votre rôle d'animateur","Your facilitator role")}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: '#FFDFE0', borderRadius: 14, padding: '14px', border: '1.5px solid #FF4B4B' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#CC0000', marginBottom: 10 }}>❌ {t2('À ne PAS faire','Do NOT do')}</div>
            {[
              t2("Imposer sa propre définition",'Impose your own definition'),
              t2("Présenter Gardner comme définitif",'Present Gardner as definitive'),
              t2("Réduire l'intelligence au QI",'Reduce intelligence to IQ'),
              t2("Dire que le QI ne mesure rien",'Say IQ measures nothing'),
              t2("Simplifier Dartmouth",'Oversimplify Dartmouth'),
              t2("Conclure sur l'IA",'Draw conclusions about AI'),
            ].map((item, i) => (
              <div key={i} style={{ fontSize: 11, color: '#CC0000', padding: '3px 0', borderTop: i > 0 ? '1px solid rgba(204,0,0,0.1)' : 'none', lineHeight: 1.4 }}>{item}</div>
            ))}
          </div>
          <div style={{ background: '#D7FFB8', borderRadius: 14, padding: '14px', border: '1.5px solid #58CC02' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#2B7400', marginBottom: 10 }}>✅ {t2('À FAIRE','DO')}</div>
            {[
              t2("Poser la question",'Ask the question'),
              t2("Faire préciser les termes",'Ask for term clarification'),
              t2("Confronter les définitions",'Confront definitions'),
              t2("Apporter des repères",'Provide reference points'),
              t2("Créer du doute constructif",'Create constructive doubt'),
              t2("Développer l'esprit critique",'Develop critical thinking'),
            ].map((item, i) => (
              <div key={i} style={{ fontSize: 11, color: '#2B7400', padding: '3px 0', borderTop: i > 0 ? '1px solid rgba(43,116,0,0.1)' : 'none', lineHeight: 1.4 }}>{item}</div>
            ))}
          </div>
        </div>
      </Wrap>}

      {/* S13 — Méthode d'animation */}
      {s === 13 && <Wrap onNext={next} onPrev={prev}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>{t2("Méthode d'animation","Facilitation method")}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { icon: '❓', phase: t2('QUESTIONNER','QUESTION'), desc: t2("« Avez-vous le sentiment d'être intelligent ? »",'"Do you feel intelligent?"'), color: '#EEEDFE', border: '#534AB7', text: '#3C3489' },
            { icon: '📖', phase: t2('FAIRE DÉFINIR','DEFINE'), desc: t2("« Qu'appelez-vous intelligence ? »",'"What do you call intelligence?"'), color: '#E6F1FB', border: '#85B7EB', text: '#0C447C' },
            { icon: '⚡', phase: t2('CONFRONTER','CONFRONT'), desc: t2("Faire émerger plusieurs conceptions.",'Let multiple conceptions emerge.'), color: '#FAEEDA', border: '#EF9F27', text: '#633806' },
            { icon: '💡', phase: t2('ÉCLAIRER','ILLUMINATE'), desc: t2("Gardner, QI, adaptation, Dartmouth.",'Gardner, IQ, adaptation, Dartmouth.'), color: '#D7FFB8', border: '#58CC02', text: '#2B7400' },
            { icon: '🔄', phase: t2('QUESTIONNER À NOUVEAU','QUESTION AGAIN'), desc: t2("« Que signifie maintenant "intelligence artificielle" ? »",'"What does \"artificial intelligence\" mean now?"'), color: '#1a1a2e', border: '#1a1a2e', text: 'white' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', background: item.color, borderRadius: 12, border: `1.5px solid ${item.border}` }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 12, color: item.text, marginBottom: 2, letterSpacing: 0.5 }}>{item.phase}</div>
                <div style={{ fontSize: 12, color: item.text, opacity: 0.8, fontStyle: 'italic' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: '#F8F9FF', borderRadius: 12, padding: '14px 16px', marginTop: 14, border: '1.5px solid #AFA9EC' }}>
          <p style={{ fontSize: 13, color: '#534AB7', lineHeight: 1.7, margin: 0, fontWeight: 600, textAlign: 'center' }}>
            {t2("Une bonne animation ne ferme pas nécessairement la question. Elle permet aux participants de mieux la poser.",'Good facilitation does not necessarily close the question. It allows participants to ask it better.')}
          </p>
        </div>
      </Wrap>}

      {/* S14 — Fiche mémo */}
      {s === 14 && <Wrap onNext={next} onPrev={prev} nextLabel={t2('Dernière étape →','Final step →')}>
        <Tag color="#FAEEDA"><span style={{ color: '#633806' }}>📋 {t2('FICHE MÉMO ANIMATEUR','FACILITATOR REFERENCE CARD')}</span></Tag>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>{t2('Intelligence — Fiche animateur','Intelligence — Facilitator card')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: 'white', borderRadius: 12, border: '1.5px solid #E5E5E5', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', background: '#534AB7', color: 'white', fontWeight: 700, fontSize: 12 }}>{t2("Question d'ouverture","Opening question")}</div>
            <div style={{ padding: '10px 14px', fontSize: 14, fontWeight: 700, color: '#1a1a2e', fontStyle: 'italic' }}>
              {t2("« Avez-vous le sentiment d'être intelligent ? »",'"Do you feel intelligent?"')}
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: 12, border: '1.5px solid #E5E5E5', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', background: '#00A85E', color: 'white', fontWeight: 700, fontSize: 12 }}>{t2('Repères','Reference points')}</div>
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['Gardner', t2('Plusieurs formes d\'intelligence proposées — pas une définition définitive','Multiple forms of intelligence proposed — not a definitive definition')],
                ['QI', t2('Certaines capacités cognitives — pas tout ce que recouvre l\'intelligence','Certain cognitive abilities — not everything intelligence encompasses')],
                [t2('Adaptation','Adaptation'), t2('Dimension importante mais ne suffit pas à définir l\'intelligence','Important dimension but insufficient to define intelligence')],
                [t2('Dartmouth 1956','Dartmouth 1956'), t2('Simuler certaines caractéristiques de l\'intelligence — pas dupliquer un cerveau','Simulate certain characteristics of intelligence — not duplicate a brain')],
              ].map(([key, val]) => (
                <div key={String(key)} style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>
                  <strong style={{ color: '#085041' }}>{key}</strong> → {val}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: 12, border: '1.5px solid #E5E5E5', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', background: '#8B5E00', color: 'white', fontWeight: 700, fontSize: 12 }}>{t2('Conclusion','Conclusion')}</div>
            <div style={{ padding: '10px 14px', fontSize: 13, color: '#633806', lineHeight: 1.6, fontWeight: 600 }}>
              {t2("Pas de définition unique → toujours identifier ce que signifie « intelligence » avant de comparer humain et IA.",'No single definition → always identify what "intelligence" means before comparing humans and AI.')}
            </div>
          </div>
        </div>
      </Wrap>}

      {/* S15 — Conclusion + teaser */}
      {s === 15 && <Wrap onNext={next} onPrev={prev} nextLabel={t2('Passer au quiz →','Take the quiz →')}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#534AB7', marginBottom: 8 }}>Intelligence — {t2('terminé','complete')}</h2>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>
            {t2("Vous savez désormais conduire la première partie de ce débat. Mais intelligence et conscience sont-elles la même chose ?",'You now know how to lead the first part of this debate. But are intelligence and consciousness the same thing?')}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {[
            { num: '✅', label: 'Intelligence', active: true },
            { num: '🔒', label: t2('Conscience — prochainement','Consciousness — coming soon'), active: false },
            { num: '🔒', label: t2('Prise de décision — prochainement','Decision-making — coming soon'), active: false },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', background: item.active ? '#EEEDFE' : '#F8F8F8', borderRadius: 12, border: `1.5px solid ${item.active ? '#534AB7' : '#E5E5E5'}` }}>
              <span style={{ fontSize: 20 }}>{item.num}</span>
              <span style={{ fontSize: 14, fontWeight: item.active ? 700 : 400, color: item.active ? '#534AB7' : '#888' }}>{item.label}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#534AB7', borderRadius: 14, padding: '18px 20px', textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'white', lineHeight: 1.5 }}>
            {t2("« Une machine peut-elle être intelligente sans être consciente ? »",'"Can a machine be intelligent without being conscious?"')}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>{t2('À suivre : Conscience','Coming next: Consciousness')}</div>
        </div>
      </Wrap>}

    </div>
  )
}
