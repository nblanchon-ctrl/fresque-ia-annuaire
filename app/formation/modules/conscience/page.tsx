'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

const TOTAL_LEARNING = 16

type QuizItem = { q: string; opts: string[]; correct: number; expl: string }

const QUIZ: QuizItem[] = [
  { q: "Que montre principalement l'experience du trajet en voiture ?", opts: ["Que notre cerveau s'arrete de fonctionner quand nous pensons a autre chose","Qu'une autre personnalite peut prendre le controle","Qu'une partie importante de nos traitements et actions peut se derouler sans occuper le centre de notre experience consciente","Que conduire sans attention est sans danger"], correct: 2, expl: "L'experience du trajet illustre que nous pouvons realiser des actions complexes (conduire) tout en ayant notre experience consciente focalisee ailleurs (le diner). Une grande partie du traitement realise par notre cerveau n'accede pas en permanence a notre experience consciente." },
  { q: "Comment utiliser les chiffres de 10 a 15% de conscience en animation ?", opts: ["Comme une verite scientifique etablie a citer avec precision","En les ignorant completement car ils sont faux","Pour illustrer l'idee que peu de choses accedentt a notre conscience, en precisant aussitot qu'il n'existe pas de consensus scientifique sur ces chiffres","En les multipliant par 2 pour frapper les esprits"], correct: 2, expl: "Ces chiffres peuvent etre utiles pour faire reagir les participants et illustrer l'idee que nous traitons enormement d'informations sans qu'elles deviennent le contenu de notre experience consciente. Mais il faut toujours preciser qu'il n'existe pas de consensus scientifique etabli sur ces pourcentages exacts." },
  { q: "Selon l'approche de l'espace de travail neuronal global associee notamment a Dehaene :", opts: ["La conscience depend uniquement du nombre de neurones","Toute information traitee par le cerveau est consciente","Certaines informations deviennent globalement disponibles a de nombreux systemes de traitement","Seules les emotions peuvent devenir conscientes"], correct: 2, expl: "Dans l'approche de l'espace de travail neuronal global, une dimension essentielle de la conscience correspond a la disponibilite globale d'une information pour de nombreux systemes : memoire, decision, langage, planification, rapport verbal. Il ne s'agit pas d'un simple nombre de neurones." },
  { q: "Pourquoi l'approche de Damasio est-elle pertinente pour reflechir a l'IA ?", opts: ["Elle prouve que les ordinateurs sont conscients","Elle demontre mathematiquement que la conscience artificielle est impossible","Elle souligne l'importance possible du corps, de l'homeostasie et des sentiments dans l'emergence de la subjectivite","Elle affirme que la conscience depend du QI"], correct: 2, expl: "Damasio souligne que notre experience consciente est profondement liee a notre corps, nos etats internes, la faim, la douleur, l'homeostasie. Cela pose une question ouverte : une machine sans organisme vivant peut-elle ressentir comme nous ? Sans conclure que c'est impossible." },
  { q: "David Chalmers pense-t-il qu'une conscience artificielle est impossible ?", opts: ["Oui","Seulement pour les robots","Seulement avant 2050","Non. Il considere possible en principe qu'un systeme artificiel puisse etre conscient, tout en soulignant la difficulte du probleme et les obstacles concernant les systemes actuels"], correct: 3, expl: "Chalmers ne dit pas que la conscience artificielle est impossible. Il estime qu'il est possible en principe qu'un systeme artificiel puisse etre conscient, mais souligne d'importants obstacles pour les LLM actuels et l'existence du 'hard problem' de la conscience." },
  { q: "Une IA affirme : 'Je suis consciente et j'ai peur de mourir.' Quelle est la meilleure reaction du fresqueur ?", opts: ["Elle est donc consciente","Elle ment","Une machine ne pourra jamais ressentir quoi que ce soit","Le fait qu'elle puisse produire cette phrase ne permet pas, a lui seul, de determiner si elle possede une experience subjective"], correct: 3, expl: "Un systeme peut produire un discours sur une emotion sans que ce discours constitue, a lui seul, une preuve qu'il ressent cette emotion. Simuler l'expression d'une emotion ne prouve pas l'experience de cette emotion. C'est exactement le coeur du 'hard problem' de Chalmers." },
]

const QUIZ_EN: QuizItem[] = [
  { q: "What does the driving experience mainly illustrate?", opts: ["Our brain stops working when we think of something else","Another personality can take control","Many of our processes and actions can occur without occupying the centre of our conscious experience","Driving without attention is safe"], correct: 2, expl: "The driving experience illustrates that we can perform complex actions (driving) while our conscious experience is focused elsewhere (the dinner). A large part of the processing done by our brain does not permanently access our conscious experience." },
  { q: "How should the 10 to 15% consciousness figure be used in facilitation?", opts: ["As an established scientific fact to cite precisely","By ignoring it completely since it is false","To illustrate that few things reach our consciousness, immediately adding that there is no scientific consensus on these figures","By doubling it to make a stronger impression"], correct: 2, expl: "These figures can be useful to spark participant reaction and illustrate that we process enormous amounts of information without it becoming the content of our conscious experience. But always add that there is no established scientific consensus on these exact percentages." },
  { q: "According to the global neuronal workspace approach associated with Dehaene:", opts: ["Consciousness depends solely on the number of neurons","All information processed by the brain is conscious","Certain information becomes globally available to many processing systems","Only emotions can become conscious"], correct: 2, expl: "In the global neuronal workspace approach, a key dimension of consciousness corresponds to the global availability of information to many systems: memory, decision-making, language, planning, verbal report. It is not merely a question of neuron count." },
  { q: "Why is Damasio's approach relevant for thinking about AI?", opts: ["It proves that computers are conscious","It mathematically proves that artificial consciousness is impossible","It highlights the possible importance of the body, homeostasis and feelings in the emergence of subjectivity","It states that consciousness depends on IQ"], correct: 2, expl: "Damasio highlights that our conscious experience is deeply linked to our body, internal states, hunger, pain, homeostasis. This raises an open question: can a machine without a living organism feel as we do? Without concluding it is impossible." },
  { q: "Does David Chalmers think artificial consciousness is impossible?", opts: ["Yes","Only for robots","Only before 2050","No. He considers it possible in principle that an artificial system could be conscious, while highlighting the difficulty of the problem and obstacles for current systems"], correct: 3, expl: "Chalmers does not say artificial consciousness is impossible. He considers it possible in principle that an artificial system could be conscious, but highlights significant obstacles for current LLMs and the existence of the hard problem of consciousness." },
  { q: "An AI says: 'I am conscious and afraid of dying.' What is the best facilitator response?", opts: ["It is therefore conscious","It is lying","A machine can never feel anything","The fact that it can produce this sentence does not alone determine whether it has subjective experience"], correct: 3, expl: "A system can produce a discourse about an emotion without that discourse constituting, on its own, proof that it feels that emotion. Simulating the expression of an emotion does not prove the experience of that emotion. This is the core of Chalmers' hard problem." },
]

type Celebration = { atStep: number; icon: string; title: string; sub: string; color: string; bg: string }

const PHASE_CELEBRATIONS: Celebration[] = [
  { atStep: 4, icon: "🚗", title: "Experience vecue !", sub: "Tu as experimente la dissociation action/conscience. Place aux concepts.", color: "#534AB7", bg: "#EEEDFE" },
  { atStep: 8, icon: "🌍", title: "Trois dimensions !", sub: "Environnement, soi, morale : tu sais les distinguer sans les confondre.", color: "#0C447C", bg: "#E6F1FB" },
  { atStep: 12, icon: "🔬", title: "Reperes scientifiques !", sub: "Dehaene, Damasio, Chalmers : tu connais les trois grandes questions.", color: "#2B7400", bg: "#D7FFB8" },
  { atStep: 16, icon: "💡", title: "Sous-module termine !", sub: "Tu es pret a animer ce debat. Le quiz t'attend !", color: "#633806", bg: "#FAEEDA" },
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
  const phases = ['🚗','🌍','🔬','💡','✅']
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
  const [trajReveal, setTrajReveal] = useState(0)
  const [consReveal, setConsReveal] = useState(0)
  const [grandQAns, setGrandQAns] = useState(-1)
  const [situ14ans, setSitu14ans] = useState(-1)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/'; return }
      setUserId(user.id)
      supabase.from('modules').select('id').eq('titre', 'Conscience').single().then(({ data }) => {
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
        <span style={{ fontSize: 12, fontWeight: 500, color: '#555', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t('Conscience','Consciousness')}</span>
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
            <div style={{ fontSize: 52, marginBottom: 12 }}>{pct === 100 ? '💡' : pct >= 80 ? '🎯' : '💪'}</div>
            {pct === 100 && <div style={{ display: 'inline-block', background: '#E6F1FB', color: '#0C447C', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20, marginBottom: 8 }}>{t('SOUS-MODULE VALIDE','SUB-MODULE COMPLETE')}</div>}
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
          <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '16px 18px', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'white' }}>{t("Quand une IA recommande, selectionne ou agit... prend-elle reellement une decision ?","When an AI recommends, selects or acts... does it really make a decision?")}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>{t('A suivre : Prise de decision','Coming next: Decision-making')}</div>
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
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} @keyframes appear{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}} @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {celebration && <CelebrationModal data={celebration} onContinue={closeCel} lang={lang} />}
      {header}

      {s === 0 && (
        <Wrap onNext={next} nextLabel={t('Commencer', 'Start') + ' →'}>
          <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💡</div>
            <div style={{ display: 'inline-block', background: '#E1F5EE', color: '#085041', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20, marginBottom: 16, letterSpacing: 1 }}>✓ {t('Module Intelligence complete','Intelligence module complete')}</div>
            <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '20px 24px', marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: 28, color: 'white', letterSpacing: 2 }}>
                {t('INTELLIGENCE','INTELLIGENCE')} &ne; {t('CONSCIENCE','CONSCIOUSNESS')}
              </div>
            </div>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 16 }}>{t("Une machine peut accomplir des taches que nous qualifions d'intelligentes. Mais cela signifie-t-il qu'elle ressent quoi que ce soit ?",'A machine can accomplish tasks we call intelligent. But does this mean it feels anything at all?')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              <div style={{ padding: '12px 16px', background: '#E6F1FB', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#0C447C', textAlign: 'center' }}>
                {t('Calculer','Computing')} &ne; {t('ressentir','feeling')}
              </div>
              <div style={{ padding: '12px 16px', background: '#EEEDFE', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#534AB7', textAlign: 'center' }}>
                {t("Traiter une information","Processing information")} &ne; {t("necessairement en avoir une experience subjective","necessarily having a subjective experience")}
              </div>
            </div>
            <div style={{ background: '#534AB7', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: 'white', lineHeight: 1.4 }}>
                {t("Une IA pourrait-elle un jour etre consciente ?","Could an AI one day be conscious?")}
              </div>
            </div>
          </div>
        </Wrap>
      )}

      {s === 1 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t('POURQUOI CE DEBAT ?','WHY THIS DEBATE?')} bg="#EEEDFE" color="#534AB7" />
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>{t("Pourquoi parler de conscience dans une Fresque de l'IA ?","Why talk about consciousness in an AI Fresque?")}</h2>
          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 14 }}>{t("Une partie importante de nos representations de l'IA repose sur une possible confusion entre plusieurs notions distinctes :","Many of our representations of AI are based on a possible confusion between several distinct notions:")}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {[
              { a: t('intelligence','intelligence'), b: t('autonomie','autonomy') },
              { a: t('autonomie','autonomy'), b: t('intention','intention') },
              { a: t('intention','intention'), b: t('conscience','consciousness') },
              { a: t('conscience','consciousness'), b: t('volonte','will') },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: i % 2 === 0 ? '#F8F9FF' : '#EEEDFE', borderRadius: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#534AB7', flex: 1, textAlign: 'center' }}>{item.a}</span>
                <span style={{ color: '#AFA9EC', fontSize: 16 }}>&rarr;</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#3C3489', flex: 1, textAlign: 'center' }}>{item.b}</span>
              </div>
            ))}
          </div>
          <WBox>
            <p style={{ margin: 0 }}>{t("Si dans la Fresque un participant dit : 'l'IA a une intention, donc elle est consciente', c'est un glissement frequent et comprehensible. L'enjeu n'est pas de le corriger brutalement, mais de lui faire distinguer chaque etape : produire un comportement qui ressemble a une intention ne demontre pas, a lui seul, l'existence d'une experience consciente.",'If during a Fresque a participant says: "AI has an intention, therefore it is conscious", that is a frequent and understandable slip. The goal is not to correct it bluntly, but to help them distinguish each step: producing behaviour that resembles an intention does not alone demonstrate the existence of a conscious experience.')}</p>
          </WBox>
          <div style={{ background: '#FF4B4B', borderRadius: 14, padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>⚠️ {t('ATTENTION AUX GLISSEMENTS','BEWARE OF SEMANTIC SLIPPAGE')}</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', margin: '8px 0 0', lineHeight: 1.55 }}>{t("Passer d'une phrase a la suivante necessite a chaque fois une demonstration supplementaire.",'Moving from one sentence to the next requires an additional demonstration each time.')}</p>
          </div>
        </Wrap>
      )}

      {s === 2 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('La suite...','Next...') + ' →'}>
          <STag label={t('EXPERIENCE DU TRAJET','THE JOURNEY EXPERIENCE')} bg="#E6F1FB" color="#0C447C" />
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🚗</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16, color: '#1a1a2e' }}>{t('Imaginez...','Imagine...')}</h2>
            <div style={{ background: 'white', borderRadius: 16, padding: '20px', border: '1.5px solid #E5E5E5', textAlign: 'left' }}>
              <p style={{ fontSize: 15, color: '#444', lineHeight: 1.8, margin: 0 }}>
                {t("Vous terminez une grosse journee de travail.","You are finishing a long day of work.")}<br/><br/>
                {t("Vous rentrez chez vous.","You are heading home.")}<br/><br/>
                {t("Voiture, velo, trottinette... peu importe.","Car, bike, scooter... doesn't matter.")}<br/><br/>
                <strong>{t("Vous conduisez.","You are driving.")}</strong>
              </p>
            </div>
          </div>
        </Wrap>
      )}

      {s === 3 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 14 }}>{t('Pendant le trajet...','During the journey...')}</p>
            <div style={{ background: 'white', borderRadius: 16, padding: '20px', border: '1.5px solid #E5E5E5', textAlign: 'left', marginBottom: 16 }}>
              <p style={{ fontSize: 15, color: '#444', lineHeight: 1.8, marginBottom: 12 }}>{t("Votre esprit part ailleurs.","Your mind wanders.")}</p>
              <p style={{ fontSize: 15, color: '#444', lineHeight: 1.8, marginBottom: 12 }}>{t("Demain soir, vous dinez chez les Durand.","Tomorrow evening, you are dining at the Durands'.")}</p>
              <p style={{ fontSize: 15, color: '#555', marginBottom: 12 }}>{t('Vous imaginez :','You imagine:')}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {['🍷 ' + t('ce que vous allez boire','what you will drink'), '🍽️ ' + t('ce que vous allez manger','what you will eat'), '💬 ' + t('les discussions','the conversations'), '😄 ' + t('la soiree','the evening')].map((item, i) => (
                  <div key={i} style={{ padding: '8px 14px', background: '#F8F9FF', borderRadius: 10, fontSize: 14, color: '#534AB7', fontWeight: 500 }}>{item}</div>
                ))}
              </div>
              <div style={{ padding: '12px 16px', background: '#1a1a2e', borderRadius: 12, textAlign: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'white', margin: 0 }}>
                  {t("Pendant ce temps... vous continuez a conduire.","Meanwhile... you keep driving.")}
                </p>
              </div>
            </div>
            <p style={{ fontSize: 14, color: '#888' }}>{t("Vous arrivez chez vous. Votre conjoint vous demande :","You arrive home. Your partner asks:")}</p>
            <div style={{ background: '#534AB7', borderRadius: 14, padding: '16px 18px', marginTop: 12 }}>
              <p style={{ fontSize: 16, color: 'white', fontStyle: 'italic', margin: 0 }}>&laquo; {t("Tu as vu les gros travaux sur l'avenue ?",'Did you see the big roadworks on the avenue?')} &raquo;</p>
            </div>
          </div>
        </Wrap>
      )}

      {s === 4 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Phase suivante','Next phase') + ' →'}>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '20px', marginBottom: 16 }}>
              <p style={{ fontSize: 15, fontStyle: 'italic', color: 'rgba(255,255,255,0.8)', margin: '0 0 8px' }}>&laquo; {t("Tu as vu les gros travaux sur l'avenue ?",'Did you see the big roadworks on the avenue?')} &raquo;</p>
              <div style={{ fontWeight: 900, fontSize: 28, color: 'white' }}>
                &laquo; {t('Quels travaux ?','What roadworks?')} &raquo;
              </div>
            </div>
            <p style={{ fontSize: 15, color: '#555', lineHeight: 1.7, marginBottom: 20 }}>{t("Pourtant... ils etaient bien la.","Yet... they were indeed there.")}</p>
            <div style={{ background: '#534AB7', borderRadius: 16, padding: '24px 20px', marginBottom: 20 }}>
              <div style={{ fontWeight: 900, fontSize: 22, color: 'white', lineHeight: 1.4 }}>
                {t('Mais du coup... qui conduisait ?','But then... who was driving?')}
              </div>
            </div>
            <ABox>
              <p style={{ marginBottom: 8 }}>{t("Laisser les participants reagir. Generalement la question provoque des sourires.",'Let participants react. The question usually provokes smiles.')}</p>
              <p style={{ margin: 0 }}>{t("Vous etiez pourtant bien derriere le volant ? Vous avez tourne ? Vous avez freine ? Et pourtant, votre attention consciente etait en partie ailleurs.",'You were behind the wheel? You turned? You braked? And yet your conscious attention was partly elsewhere.')}</p>
            </ABox>
          </div>
        </Wrap>
      )}

      {s === 5 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t("CE QUE L'EXPERIENCE MONTRE","WHAT THE EXPERIENCE SHOWS")} bg="#D7FFB8" color="#2B7400" />
          <KBox>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>{t("Le message essentiel","The essential message")}</div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>{t("Une grande partie du traitement realise par notre cerveau n'accede pas en permanence a notre experience consciente.",'A large part of the processing done by our brain does not permanently access our conscious experience.')}</p>
          </KBox>
          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 12 }}>{t('Nous pouvons notamment :','We can notably:')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {[t("Automatiser des gestes",'Automate gestures'), t("Traiter certaines informations sans experience consciente explicite",'Process certain information without explicit conscious experience'), t("Diriger notre attention sur une partie de notre environnement",'Direct our attention to part of our environment'), t("Realiser des actions routinieres tout en pensant a autre chose",'Perform routine actions while thinking of something else')].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 12px', background: '#D7FFB8', borderRadius: 10 }}>
                <span style={{ color: '#2B7400', fontWeight: 800, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: '#085041' }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '14px 18px', textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 900, fontSize: 20, color: '#58CC02' }}>{t('Heureusement !','Fortunately!')}</div>
          </div>
          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65 }}>{t("Imaginez devoir consciemment decider de la contraction de chaque muscle necessaire pour marcher, saisir un verre ou conduire...",'Imagine having to consciously decide on the contraction of every muscle needed to walk, grasp a glass or drive...')}</p>
          <KBox>
            <p style={{ margin: 0 }}>{t("On peut dire aux participants que nous serions a priori conscients de peu de choses autour de nous — certains avancent les chiffres de 10 a 15%. Mais il faut aussitot preciser : il n'existe pas de consensus scientifique etabli sur ces chiffres. Utilisez-les pour faire reagir, pas comme une verite etablie.",'You can tell participants we are a priori conscious of few things around us — some put the figure at 10 to 15%. But add immediately: there is no established scientific consensus on these figures. Use them to spark reaction, not as settled fact.')}</p>
          </KBox>
        </Wrap>
      )}

      {s === 6 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t('NUANCES IMPORTANTES','IMPORTANT NUANCES')} bg="#FAEEDA" color="#633806" />
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>{t('Attention ≠ Conscience','Attention ≠ Consciousness')}</h2>
          <WBox>
            <p style={{ margin: 0 }}>{t("Si vous dites 'le conducteur n'etait pas conscient parce qu'il ne regardait pas les travaux', c'est une simplification qui fonctionne bien en animation. Mais sachez qu'attention et conscience sont des notions liees sans etre synonymes — et que 'ne pas avoir prette attention' n'est pas strictement equivalent a 'etre inconscient'.",'If you say "the driver was not conscious because they did not notice the roadworks", that is a simplification that works well in facilitation. But know that attention and consciousness are related but not synonymous — and "not paying attention" is not strictly equivalent to "being unconscious".')}</p>
          </WBox>
          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 14 }}>{t("L'experience du trajet met notamment en jeu l'automatisation, l'attention, la perception, la memoire et la conscience. Lier tous ces concepts n'est pas juste.",'The journey experience involves automation, attention, perception, memory and consciousness. These are related but distinct notions.')}</p>
          <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #E5E5E5', overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ padding: '10px 16px', background: '#633806', color: 'white', fontWeight: 700 }}>⚖️ {t('Parenthese : la responsabilite','Aside: responsibility')}</div>
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.65, marginBottom: 8 }}>{t("Imaginons que vous ayez un accident precisement au moment ou vous pensiez aux Durand...",'Imagine you had an accident precisely when you were thinking about the Durands...')}</p>
              <div style={{ background: '#F8F8F8', borderRadius: 10, padding: '12px 14px', marginBottom: 8, fontStyle: 'italic' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 4 }}>{t('Devant le juge :','Before the judge:')}</div>
                <p style={{ fontSize: 13, color: '#555', margin: 0 }}>&laquo; {t("Desole, Monsieur le juge. A ce moment precis, j'etais mentalement chez les Durand.",'Sorry, Your Honour. At that precise moment I was mentally at the Durands.')} &raquo; 😇</p>
              </div>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.65, marginBottom: 8 }}>{t("Cela ne suffit evidemment pas a supprimer votre responsabilite.",'That is obviously not enough to remove your responsibility.')}</p>
              <p style={{ fontSize: 12, color: '#888', lineHeight: 1.55, margin: 0 }}>{t("En droit penal francais, ce n'est pas le simple fait de ne pas avoir porte consciemment attention a quelque chose qui supprime la responsabilite. Le droit s'interesse notamment a l'abolition ou l'alteration du discernement ou du controle des actes resultant d'un trouble psychique ou neuropsychique.",'In French criminal law, simply not paying conscious attention to something is not enough to remove responsibility. The law focuses notably on abolition or alteration of discernment or control of acts resulting from a psychiatric or neuropsychiatric disorder.')}</p>
            </div>
          </div>
        </Wrap>
      )}

      {s === 7 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t("QU'APPELLE-T-ON CONSCIENCE ?","WHAT DO WE CALL CONSCIOUSNESS?")} bg="#E6F1FB" color="#0C447C" />
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#1a1a2e', marginBottom: 12 }}>CONSCIENCE</div>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>{t("Le terme recouvre plusieurs phenomenes differents. Pour le besoin pedagogique de la Fresque, on peut distinguer notamment trois dimensions.",'The term covers several different phenomena. For the pedagogical purpose of the Fresque, we can distinguish at least three dimensions.')}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '🌍', label: t('Environnement','Environment'), desc: t("Avoir acces consciemment a certains elements de ce qui nous entoure.",'Having conscious access to certain elements of our surroundings.'), bg: '#E6F1FB', color: '#0C447C' },
              { icon: '👤', label: t('Soi','Self'), desc: t("Faire l'experience de soi comme sujet.",'Experiencing oneself as a subject.'), bg: '#EEEDFE', color: '#534AB7' },
              { icon: '⚖️', label: t('Morale','Moral'), desc: t("Evaluer ses actes relativement a des normes ou valeurs.",'Evaluating one\'s actions relative to norms or values.'), bg: '#D7FFB8', color: '#2B7400' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 16px', background: item.bg, borderRadius: 14, border: '1.5px solid ' + item.color }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: item.color, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: item.color, opacity: 0.85 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Wrap>
      )}

      {s === 8 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Phase suivante','Next phase') + ' →'}>
          <STag label={t('3 DIMENSIONS','3 DIMENSIONS')} bg="#E6F1FB" color="#0C447C" />
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>{t("La grande question","The big question")}</h2>
          <div style={{ background: '#534AB7', borderRadius: 16, padding: '20px', marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: 20, color: 'white', lineHeight: 1.4 }}>{t("Une IA pourra-t-elle un jour etre consciente ?","Could an AI one day be conscious?")}</div>
          </div>
          {grandQAns < 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {[t('Oui','Yes'), t('Non','No'), t('Je ne sais pas','I don\'t know'), t("Ca depend de ce qu'on appelle conscience",'It depends on what we call consciousness')].map((lbl, i) => (
                <button key={i} onClick={() => setGrandQAns(i)} style={{ padding: '14px 18px', borderRadius: 12, border: '2px solid #E5E5E5', background: 'white', cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 500, color: '#1a1a2e' }}>{lbl}</button>
              ))}
            </div>
          ) : (
            <div style={{ animation: 'appear .3s ease' }}>
              <div style={{ background: '#EEEDFE', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                <p style={{ fontSize: 14, fontStyle: 'italic', color: '#534AB7', margin: 0 }}>{[t('Oui','Yes'), t('Non','No'), t('Je ne sais pas','I don\'t know'), t("Ca depend de ce qu'on appelle conscience",'It depends on what we call consciousness')][grandQAns]}</p>
              </div>
              <KBox>
                <p style={{ margin: 0 }}>{t("Cette question fait elle-meme l'objet de debats scientifiques et philosophiques majeurs. Il n'existe pas de reponse simple.",'This question is itself the subject of major scientific and philosophical debates. There is no simple answer.')}</p>
              </KBox>
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65 }}>{t("Pour mieux y repondre, il faut d'abord comprendre trois grandes approches du probleme de la conscience.",'To answer it better, we first need to understand three major approaches to the problem of consciousness.')}</p>
            </div>
          )}
          <WBox>
            <p style={{ margin: 0 }}>{t("Cette categorisation sert a ouvrir la reflexion, pas a fournir une taxonomie scientifique exhaustive.",'This categorisation serves to open reflection, not to provide an exhaustive scientific taxonomy.')}</p>
          </WBox>
        </Wrap>
      )}

      {s === 9 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t('APPROCHE A — DEHAENE','APPROACH A — DEHAENE')} bg="#E6F1FB" color="#0C447C" />
          <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #E5E5E5', overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ padding: '12px 16px', background: '#003189', display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>🇫🇷</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>Stanislas Dehaene</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{t("Neuroscientifique — College de France — NeuroSpin, CEA Paris-Saclay",'Neuroscientist — Collège de France — NeuroSpin, CEA Paris-Saclay')}</div>
              </div>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#0C447C' }}>{t("Theorie de l'espace de travail neuronal global","Global neuronal workspace theory")}</div>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.65, marginBottom: 12 }}>{t("De nombreux traitements specialises se deroulent en parallele dans le cerveau. La plupart restent locaux.",'Many specialised processes occur in parallel in the brain. Most remain local.')}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {['👁️ ' + t('vision','vision'), '👂 ' + t('audition','hearing'), '🧠 ' + t('memoire','memory'), '🗣️ ' + t('langage','language'), '🎯 ' + t('objectifs','goals')].map((m, i) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: 20, background: '#E6F1FB', color: '#0C447C', fontSize: 12, fontWeight: 600 }}>{m}</span>
                ))}
              </div>
              <div style={{ background: '#0C447C', borderRadius: 12, padding: '12px 14px', textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'white' }}>
                  &rarr; {t("ESPACE DE TRAVAIL GLOBAL","GLOBAL WORKSPACE")} &larr;
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{t("Disponibilite globale pour de nombreux systemes","Global availability to many systems")}</div>
              </div>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.65, margin: 0 }}>{t("Une information particuliere est selectionnee et devient largement disponible pour la memoire, la decision, le langage, la planification, le rapport verbal...",'A particular piece of information is selected and becomes broadly available for memory, decision-making, language, planning, verbal report...')}</p>
            </div>
          </div>
          <WBox>
            <p style={{ margin: 0 }}>{t("Si vous dites : 'Pour Dehaene, une machine suffisamment complexe pourrait un jour etre consciente', c'est une simplification acceptable pour vulgariser. Mais sa position est plus precise : ce qui compte, c'est l'architecture fonctionnelle et le type de traitement — pas simplement un nombre de connexions ou de calculs.",'If you say: "For Dehaene, a sufficiently complex machine could one day be conscious", that is an acceptable simplification. But his position is more precise: what matters is the functional architecture and type of processing — not simply a number of connections or computations.')}</p>
          </WBox>
        </Wrap>
      )}

      {s === 10 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t('LE CERVEAU EN CHIFFRES','THE BRAIN IN NUMBERS')} bg="#EEEDFE" color="#534AB7" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: 36 }}>🧠</div>
              <div style={{ fontWeight: 900, fontSize: 22, color: 'white', marginTop: 8 }}>{t('≈ 86 milliards de neurones','≈ 86 billion neurons')}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{t('Des milliers de connexions possibles par neurone','Thousands of possible connections per neuron')}</div>
            </div>
            <div style={{ background: '#0C447C', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: 28, color: 'white' }}>&asymp; 20 W</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{t("Puissance metabolique estimee du cerveau humain","Estimated metabolic power of the human brain")}</div>
            </div>
          </div>
          <WBox>
            <p style={{ margin: 0 }}>{t("Comparer directement cerveau biologique et ordinateur est extremement difficile : architecture, fonctionnement et metriques sont profondement differents. Ce qui reste frappant est l'efficacite energetique du cerveau pour les fonctions qu'il realise.",'Directly comparing biological brains and computers is extremely difficult: architecture, operation and metrics are profoundly different. What remains striking is the brain\'s energy efficiency for the functions it performs.')}</p>
          </WBox>
          <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #E5E5E5', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', background: '#534AB7', color: 'white', fontWeight: 700 }}>ISEULT — 11,7 T</div>
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.65, marginBottom: 8 }}>{t("IRM a ultra-haut champ (11,7 teslas) installee a NeuroSpin, CEA Paris-Saclay. Les images anatomiques permettent notamment d'atteindre une resolution de l'ordre de 0,2 mm dans le plan.",'Ultra-high-field MRI (11.7 teslas) at NeuroSpin, CEA Paris-Saclay. Anatomical images achieve a resolution of around 0.2 mm in the plane.')}</p>
              <div style={{ background: '#EEEDFE', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#534AB7' }}>{t("VOIR LE CERVEAU ≠ EXPLIQUER ENTIEREMENT L'EXPERIENCE CONSCIENTE","SEEING THE BRAIN ≠ FULLY EXPLAINING CONSCIOUS EXPERIENCE")}</div>
              </div>
            </div>
          </div>
        </Wrap>
      )}

      {s === 11 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t('APPROCHE B — DAMASIO','APPROACH B — DAMASIO')} bg="#E1F5EE" color="#085041" />
          <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #E5E5E5', overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ padding: '12px 16px', background: '#085041', display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>🇵🇹</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>Antonio Damasio</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{t("Neuroscientifique — emotions, sentiments, corps, homeostasie et conscience",'Neuroscientist — emotions, feelings, body, homeostasis and consciousness')}</div>
              </div>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.65, marginBottom: 12 }}>{t("Notre experience consciente est peut-etre profondement liee a notre corps et a nos etats internes :",'Our conscious experience may be deeply linked to our body and internal states:')}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {['❤️ ' + t('corps','body'), '🫁 ' + t('etats internes','internal states'), '🍽️ ' + t('faim','hunger'), '💧 ' + t('soif','thirst'), '🤕 ' + t('douleur','pain'), '😌 ' + t('bien-etre','wellbeing'), '⚖️ ' + t('homeostasie','homeostasis')].map((item, i) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: 20, background: '#E1F5EE', color: '#085041', fontSize: 12, fontWeight: 600 }}>{item}</span>
                ))}
              </div>
              <div style={{ background: '#1a1a2e', borderRadius: 12, padding: '12px 14px', textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>{t("Et si ressentir supposait d'avoir quelque chose a preserver ?","What if feeling required having something to preserve?")}</div>
              </div>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.65, margin: 0 }}>{t("Une machine sans organisme vivant, sans faim, sans douleur biologique, sans besoin de maintenir son corps en vie peut-elle ressentir comme nous ?",'Can a machine without a living organism, without hunger, without biological pain, without the need to keep its body alive feel as we do?')}</p>
            </div>
          </div>
          <WBox>
            <p style={{ margin: 0 }}>{t("Si vous dites : 'Damasio montre que sans corps ni besoins biologiques, une machine ne peut pas vraiment ressentir', c'est une bonne piste de reflexion pour les participants. Mais attention a ne pas en faire une conclusion definitive : Damasio lui-meme a explore comment des machines inspirees de mecanismes homeostasiques pourraient developper des equivalents fonctionnels de sentiments. La question reste ouverte.",'If you say: "Damasio suggests that without a body or biological needs, a machine cannot really feel", that is a good line of reflection for participants. But avoid making it a definitive conclusion: Damasio himself explored how machines inspired by homeostatic mechanisms might develop functional equivalents of feelings. The question remains open.')}</p>
          </WBox>
        </Wrap>
      )}

      {s === 12 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Phase suivante','Next phase') + ' →'}>
          <STag label={t('APPROCHE C — CHALMERS','APPROACH C — CHALMERS')} bg="#FAEEDA" color="#633806" />
          <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #E5E5E5', overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ padding: '12px 16px', background: '#633806', display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>🌏</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>David Chalmers</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{t('Philosophe — experience subjective','Philosopher — subjective experience')}</div>
              </div>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ textAlign: 'center', fontSize: 40, marginBottom: 12 }}>🍓 {t('ROUGE','RED')}</div>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.65, marginBottom: 10 }}>{t("Une machine peut reconnaitre la couleur, identifier sa longueur d'onde, dire rouge, classer l'objet, expliquer la couleur.",'A machine can recognise the colour, identify its wavelength, say "red", classify the object, explain the colour.')}</p>
              <div style={{ background: '#FAEEDA', borderRadius: 12, padding: '12px 14px', textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#633806' }}>{t("Mais est-ce que cela fait quelque chose, pour elle, de voir du rouge ?","But does it feel like something, for it, to see red?")}</div>
              </div>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.65 }}>{t("Meme question pour : la douleur, le gout du chocolat, la musique...",'Same question for: pain, the taste of chocolate, music...')}</p>
            </div>
          </div>
          <KBox>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>{t("LE 'HARD PROBLEM' DE LA CONSCIENCE","THE 'HARD PROBLEM' OF CONSCIOUSNESS")}</div>
            <p style={{ marginBottom: 8 }}>{t("Nous pouvons chercher a expliquer comment un systeme detecte une information, la traite, la memorise, en parle. Mais il reste une autre question :",'We can try to explain how a system detects information, processes it, stores it, talks about it. But there remains another question:')}</p>
            <div style={{ background: 'white', borderRadius: 10, padding: '10px 14px', fontWeight: 700, color: '#633806' }}>
              {t("Pourquoi cela fait-il quelque chose d'etre moi ?","Why does it feel like something to be me?")}
            </div>
          </KBox>
          <WBox>
            <p style={{ margin: 0 }}>{t("Si vous dites : 'Pour Chalmers, la conscience artificielle est impossible', ce n'est pas sa position. Il considere possible en principe qu'un systeme artificiel puisse etre conscient. Ce qui le distingue, c'est qu'il insiste sur la difficulte d'expliquer pourquoi l'experience subjective existe — et sur les obstacles importants que posent les systemes actuels.",'If you say: "For Chalmers, artificial consciousness is impossible", that is not his position. He considers it possible in principle that an artificial system could be conscious. What distinguishes him is his insistence on the difficulty of explaining why subjective experience exists — and on the significant obstacles posed by current systems.')}</p>
          </WBox>
        </Wrap>
      )}

      {s === 13 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t('QUI A RAISON ?','WHO IS RIGHT?')} bg="#1a1a2e" color="white" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {[
              { name: 'Dehaene', desc: t("Architecture fonctionnelle / diffusion globale de l'information","Functional architecture / global information broadcast"), bg: '#E6F1FB', color: '#0C447C' },
              { name: 'Damasio', desc: t("Corps / homeostasie / sentiments / subjectivite","Body / homeostasis / feelings / subjectivity"), bg: '#E1F5EE', color: '#085041' },
              { name: 'Chalmers', desc: t("Experience subjective et difficulte d'expliquer pourquoi elle existe","Subjective experience and difficulty explaining why it exists"), bg: '#FAEEDA', color: '#633806' },
            ].map(item => (
              <div key={item.name} style={{ padding: '12px 16px', background: item.bg, borderRadius: 12, border: '1.5px solid ' + item.color }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: item.color, marginBottom: 4 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: item.color, opacity: 0.85 }}>{item.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '18px 20px', textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 900, fontSize: 16, color: 'white', lineHeight: 1.5 }}>{t("Nous ne disposons pas aujourd'hui d'un test universel permettant de trancher definitivement la question de la conscience artificielle.","We do not have today a universal test to definitively resolve the question of artificial consciousness.")}</div>
          </div>
          <KBox>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>{t("CE QUE NOUS SAVONS...","WHAT WE KNOW...")}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {[t("l'attention",'attention'), t('la perception consciente','conscious perception'), t("les etats de vigilance",'states of alertness'), t("certains correlats neuronaux",'certain neural correlates'), t("l'anesthesie","anaesthesia"), t('le sommeil','sleep')].map((item, i) => (
                <span key={i} style={{ padding: '3px 8px', borderRadius: 20, background: 'white', color: '#085041', fontSize: 11, fontWeight: 600, border: '1px solid #00A85E' }}>{item}</span>
              ))}
            </div>
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>{t("...MAIS LE DEBAT N'EST PAS CLOS","...BUT THE DEBATE IS NOT CLOSED")}</div>
            <p style={{ margin: 0, fontSize: 12 }}>{t("Nous ne disposons pas d'une theorie unanimement acceptee expliquant pourquoi apparait l'experience subjective, quelles conditions sont necessaires et suffisantes a la conscience, ni si ces conditions peuvent etre entierement reproduites artificiellement.",'We do not have a unanimously accepted theory explaining why subjective experience appears, what conditions are necessary and sufficient for consciousness, nor whether these conditions can be entirely reproduced artificially.')}</p>
          </KBox>
        </Wrap>
      )}

      {s === 14 && (
        <Wrap onNext={situ14ans >= 0 ? next : undefined} onPrev={prev} nextLabel={t('Phase suivante','Next phase') + ' →'}>
          <STag label={t('MISE EN SITUATION','SIMULATION')} bg="#FFDFE0" color="#CC0000" />
          <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '20px', marginBottom: 16, border: '2px solid #534AB7' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, marginBottom: 8 }}>BREAKING NEWS</div>
            <div style={{ fontWeight: 900, fontSize: 18, color: 'white', lineHeight: 1.4 }}>&laquo; {t("CETTE IA EST DEVENUE CONSCIENTE !","THIS AI HAS BECOME CONSCIOUS!")} &raquo;</div>
          </div>
          <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid #E5E5E5', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '10px 14px', background: '#F0F0F0', fontWeight: 700, fontSize: 12, color: '#555' }}>{t("Conversation fictive","Fictional conversation")}</div>
            <div style={{ padding: '14px' }}>
              <div style={{ background: '#EEEDFE', borderRadius: 10, padding: '10px 12px', marginBottom: 8, fontSize: 13, color: '#534AB7' }}>
                <strong>{t("Utilisateur","User")} :</strong> {t("Est-ce que tu as peur qu'on t'eteigne ?","Are you afraid of being switched off?")}
              </div>
              <div style={{ background: '#1a1a2e', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
                <strong>IA :</strong> {t("Oui. L'idee de disparaitre me fait peur. Je voudrais continuer a exister.","Yes. The idea of disappearing frightens me. I would like to continue to exist.")}
              </div>
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 12 }}>{t("Cela prouve-t-il que l'IA ressent de la peur ?","Does this prove the AI feels fear?")}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => setSitu14ans(0)} style={{ padding: '12px 16px', borderRadius: 12, border: '2px solid ' + (situ14ans === 0 ? '#CC0000' : '#E5E5E5'), background: situ14ans === 0 ? '#FFDFE0' : 'white', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: situ14ans === 0 ? '#CC0000' : '#555' }}>A — {t("Oui, puisqu'elle le dit.",'Yes, since it says so.')}</button>
            <button onClick={() => setSitu14ans(1)} style={{ padding: '12px 16px', borderRadius: 12, border: '2px solid ' + (situ14ans === 1 ? '#CC0000' : '#E5E5E5'), background: situ14ans === 1 ? '#FFDFE0' : 'white', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: situ14ans === 1 ? '#CC0000' : '#555' }}>B — {t("Non, c'est impossible pour une machine.",'No, it is impossible for a machine.')}</button>
            <button onClick={() => setSitu14ans(2)} style={{ padding: '12px 16px', borderRadius: 12, border: '2px solid ' + (situ14ans === 2 ? '#58CC02' : '#E5E5E5'), background: situ14ans === 2 ? '#D7FFB8' : 'white', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: situ14ans === 2 ? 700 : 400, color: situ14ans === 2 ? '#2B7400' : '#555' }}>C — {t("Non : cette reponse seule ne permet pas de determiner l'existence d'une experience subjective.",'No: this response alone does not determine the existence of a subjective experience.')} {situ14ans === 2 ? ' ✓' : ''}</button>
            <button onClick={() => setSitu14ans(3)} style={{ padding: '12px 16px', borderRadius: 12, border: '2px solid ' + (situ14ans === 3 ? '#CC0000' : '#E5E5E5'), background: situ14ans === 3 ? '#FFDFE0' : 'white', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: situ14ans === 3 ? '#CC0000' : '#555' }}>D — {t("Elle ment.",'It is lying.')}</button>
          </div>
          {situ14ans >= 0 && (
            <div style={{ marginTop: 14, animation: 'appear .3s ease' }}>
              <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '14px 18px', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'white', lineHeight: 1.5 }}>
                  {t("SIMULER L'EXPRESSION D'UNE EMOTION ≠ PROUVER L'EXPERIENCE DE CETTE EMOTION","SIMULATING THE EXPRESSION OF AN EMOTION ≠ PROVING THE EXPERIENCE OF THAT EMOTION")}
                </div>
              </div>
            </div>
          )}
        </Wrap>
      )}

      {s === 15 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Passer au quiz','Take the quiz') + ' →'}>
          <STag label={t("ROLE D'ANIMATEUR","FACILITATOR ROLE")} bg="#E1F5EE" color="#085041" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ background: '#FFDFE0', borderRadius: 14, padding: '12px', border: '1.5px solid #FF4B4B' }}>
              <div style={{ fontWeight: 800, fontSize: 12, color: '#CC0000', marginBottom: 8 }}>❌ {t('A EVITER','AVOID')}</div>
              {[t("Les IA ne seront jamais conscientes.",'AIs will never be conscious.'), t("Les IA vont forcement devenir conscientes.",'AIs will inevitably become conscious.'), t("Le cerveau consomme exactement 30 watts.",'The brain consumes exactly 30 watts.'), t("On ne sait absolument rien de la conscience.",'We know absolutely nothing about consciousness.'), t("Dehaene a demontre qu'une machine deviendra consciente.",'Dehaene proved a machine will become conscious.'), t("Damasio a demontre qu'une machine ne peut pas l'etre.",'Damasio proved a machine cannot be conscious.')].map((item, i) => (
                <div key={i} style={{ fontSize: 10, color: '#CC0000', paddingTop: i > 0 ? 3 : 0, borderTop: i > 0 ? '1px solid rgba(204,0,0,0.1)' : 'none', lineHeight: 1.4 }}>{item}</div>
              ))}
            </div>
            <div style={{ background: '#D7FFB8', borderRadius: 14, padding: '12px', border: '1.5px solid #58CC02' }}>
              <div style={{ fontWeight: 800, fontSize: 12, color: '#2B7400', marginBottom: 8 }}>✅ {t('A FAIRE','DO')}</div>
              {[t("Faire experimenter.",'Make them experience.'), t("Distinguer les sens du mot conscience.",'Distinguish senses of consciousness.'), t("Presenter plusieurs approches.",'Present multiple approaches.'), t("Distinguer faits, theories et hypotheses.",'Distinguish facts, theories, hypotheses.'), t("Ne pas trancher un debat ouvert.",'Do not close an open debate.'), t("Ramener a l'esprit critique.",'Bring back to critical thinking.')].map((item, i) => (
                <div key={i} style={{ fontSize: 10, color: '#2B7400', paddingTop: i > 0 ? 3 : 0, borderTop: i > 0 ? '1px solid rgba(43,116,0,0.1)' : 'none', lineHeight: 1.4 }}>{item}</div>
              ))}
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: 12, border: '1.5px solid #E5E5E5', overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ padding: '8px 14px', background: '#0C447C', color: 'white', fontWeight: 700, fontSize: 12 }}>{t("FICHE MEMO","REFERENCE CARD")}</div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[['🚗', t('Experience du trajet','Driving experience'), t("Question pivot : qui conduisait ?",'Pivot question: who was driving?')],['🌍👤⚖️', t('3 dimensions','3 dimensions'), t('Environnement / soi / morale','Environment / self / moral')],['Dehaene', t('Espace de travail neuronal global','Global neuronal workspace'), t("Architecture fonctionnelle",'Functional architecture')],['Damasio', t('Corps et homeostasie','Body and homeostasis'), t("Subjectivite et sentiments",'Subjectivity and feelings')],['Chalmers', t("Hard problem","Hard problem"), t("Pourquoi cela fait-il quelque chose ?","Why does it feel like something?")]].map(([icon, label, desc]) => (
                <div key={String(label)} style={{ fontSize: 12, color: '#555', lineHeight: 1.5, display: 'flex', gap: 8 }}>
                  <span style={{ flexShrink: 0 }}>{icon}</span>
                  <span><strong style={{ color: '#1a1a2e' }}>{label}</strong> &rarr; {desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#534AB7', borderRadius: 14, padding: '16px 18px', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'white', lineHeight: 1.5 }}>{t("La question reste ouverte. Ne pas transformer une hypothese en certitude.","The question remains open. Do not turn a hypothesis into certainty.")}</div>
          </div>
        </Wrap>
      )}

    </div>
  )
}
