'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

const TOTAL_LEARNING = 16

type QuizItem = { q: string; opts: string[]; correct: number; expl: string }

const QUIZ: QuizItem[] = [
  { q: "Pourquoi 2 x 3 n'est-il pas le meilleur exemple d'une heuristique ?", opts: ["Parce que les mathematiques n'utilisent jamais d'heuristiques","Parce qu'il faut toujours recalculer 2 + 2 + 2","Parce que chez un adulte entraine, la reponse correspond surtout a un resultat appris et recupere automatiquement en memoire","Parce que 6 est un algorithme"], correct: 2, expl: "Chez un adulte, 2 x 3 = 6 n'est pas vraiment un raccourci de jugement : c'est plutot un resultat appris et stocke en memoire qui surgit automatiquement. Une heuristique designe plutot une strategie permettant d'obtenir rapidement un jugement sans analyser exhaustivement toutes les possibilites." },
  { q: "Les processus de Type 1 sont generalement :", opts: ["Necessairement faux","Des algorithmes informatiques","Toujours inconscients","Rapides, relativement automatiques et peu exigeants en memoire de travail"], correct: 3, expl: "Les processus de Type 1 sont souvent decrits comme rapides, automatiques, intuitifs et peu exigeants en memoire de travail. C'est un modele utile pour comprendre certaines differences de traitement — pas la description de deux machines independantes dans le cerveau." },
  { q: "Une heuristique est :", opts: ["Une erreur de raisonnement","Un neurone","Une strategie simplifiee permettant de produire rapidement un jugement ou une decision","Un programme informatique"], correct: 2, expl: "Une heuristique est une strategie ou un raccourci permettant d'obtenir rapidement un jugement ou une decision sans analyser exhaustivement toutes les possibilites. Elle peut etre utile et efficace — mais aussi produire certains biais systematiques dans certaines situations." },
  { q: "Si une IA reconnait qu'un nuage ressemble a une vache, cela demontre-t-il qu'elle lui donne le meme sens qu'un humain ?", opts: ["Oui","Non, une IA ne peut jamais reconnaitre de formes","Oui, si elle utilise un LLM","Non. La performance observee ne suffit pas a resoudre la question de la nature de sa comprehension ou de son ancrage semantique"], correct: 3, expl: "Une performance linguistique ou visuelle permet d'observer des capacites de classification et d'association. Mais elle ne suffit pas a demontrer que le systeme attribue a cette reponse le meme type de sens qu'un humain. C'est l'objet du 'symbol grounding problem'." },
  { q: "Un systeme attribue a un candidat un score de 87%. A-t-il decide de le recruter ?", opts: ["Oui, necessairement","Non, jamais","Cela depend du processus : le score peut etre une information, une recommandation ou declencher automatiquement une action","Oui, car 87% est superieur a 50%"], correct: 2, expl: "Un score peut etre une information utilisee dans une decision, une recommandation, ou declencher directement une action automatisee. Ce n'est pas la meme chose. Derriere le systeme existent des choix humains : objectifs, criteres, seuils, supervision. Une decision n'est pas seulement un calcul." },
  { q: "Quel est un risque important lorsqu'un humain supervise une IA ?", opts: ["Qu'il devienne automatiquement plus intelligent","Qu'il utilise trop de papier","Qu'il fasse excessivement confiance aux sorties du systeme : biais d'automatisation","Qu'il transforme l'IA en algorithme"], correct: 2, expl: "Le biais d'automatisation designe la tendance a accorder une confiance excessive au resultat produit par un systeme automatise. Un humain qui valide systematiquement ce que propose une IA sans vraie capacite critique n'exerce pas necessairement une supervision effective." },
]

const QUIZ_EN: QuizItem[] = [
  { q: "Why is 2 x 3 not the best example of a heuristic?", opts: ["Because mathematics never use heuristics","Because you always have to recalculate 2 + 2 + 2","Because in a trained adult, the answer is mainly a result learned and automatically retrieved from memory","Because 6 is an algorithm"], correct: 2, expl: "For an adult, 2 x 3 = 6 is not really a judgment shortcut: it is a result learned and stored in memory that emerges automatically. A heuristic refers more to a strategy for quickly reaching a judgment without exhaustively analysing all possibilities." },
  { q: "Type 1 processes are generally:", opts: ["Necessarily wrong","Computer algorithms","Always unconscious","Fast, relatively automatic and undemanding on working memory"], correct: 3, expl: "Type 1 processes are often described as fast, automatic, intuitive and low in working memory demand. This is a useful model for understanding certain processing differences — not a description of two independent machines inside the brain." },
  { q: "A heuristic is:", opts: ["A reasoning error","A neuron","A simplified strategy for quickly producing a judgment or decision","A computer program"], correct: 2, expl: "A heuristic is a strategy or shortcut for quickly reaching a judgment or decision without exhaustively analysing all possibilities. It can be useful and effective — but can also produce systematic biases in certain situations." },
  { q: "If an AI recognises that a cloud looks like a cow, does this prove it gives it the same meaning as a human?", opts: ["Yes","No, an AI can never recognise shapes","Yes, if it uses an LLM","No. The observed performance does not resolve the question of the nature of its understanding or semantic grounding"], correct: 3, expl: "A linguistic or visual performance allows us to observe classification and association capabilities. But it does not demonstrate that the system attributes to that response the same kind of meaning as a human. This is what the symbol grounding problem is about." },
  { q: "A system gives a candidate a score of 87%. Has it decided to hire them?", opts: ["Yes, necessarily","No, never","It depends on the process: the score can be information, a recommendation or automatically trigger an action","Yes, because 87% is above 50%"], correct: 2, expl: "A score can be information used in a decision, a recommendation, or directly trigger an automated action. These are not the same thing. Behind the system lie human choices: objectives, criteria, thresholds, supervision. A decision is not just a calculation." },
  { q: "What is a significant risk when a human supervises an AI?", opts: ["That they automatically become more intelligent","That they use too much paper","That they place excessive trust in the system's outputs: automation bias","That they turn the AI into an algorithm"], correct: 2, expl: "Automation bias describes the tendency to place excessive trust in the results produced by an automated system. A human who systematically validates what an AI suggests without genuine critical capacity is not necessarily exercising effective supervision." },
]

type Celebration = { atStep: number; icon: string; title: string; sub: string; color: string; bg: string }

const PHASE_CELEBRATIONS: Celebration[] = [
  { atStep: 4, icon: "⚡", title: "Premiers reperes !", sub: "Type 1, Type 2, algorithme... tu as les bases. Place aux heuristiques.", color: "#534AB7", bg: "#EEEDFE" },
  { atStep: 8, icon: "☁️", title: "Le sens en question !", sub: "Le nuage et la vache. Tu sais pourquoi la performance ne suffit pas.", color: "#0C447C", bg: "#E6F1FB" },
  { atStep: 12, icon: "⚖️", title: "La decision demontee !", sub: "Calculer n'est pas decider. Tu connais la difference.", color: "#2B7400", bg: "#D7FFB8" },
  { atStep: 16, icon: "🏆", title: "Sous-module termine !", sub: "Le quiz t'attend. Et peut-etre le badge Esprit Critique IA !", color: "#633806", bg: "#FAEEDA" },
]

function CritiqueIABadge({ size = 100 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="96" fill="#FEF9EC" stroke="#C9A84C" strokeWidth="4"/>
      <circle cx="100" cy="100" r="88" fill="none" stroke="#E8D5A0" strokeWidth="1"/>
      {/* Thinker silhouette — profil gauche, minimaliste */}
      {/* Tete */}
      <ellipse cx="108" cy="68" rx="26" ry="28" fill="#1a1a2e"/>
      {/* Cou */}
      <rect x="96" y="92" width="16" height="14" rx="4" fill="#1a1a2e"/>
      {/* Epaule et torse */}
      <path d="M60 106 Q78 100 96 106 L112 106 Q132 108 142 118 L142 148 L60 148 Z" fill="#1a1a2e"/>
      {/* Bras gauche leve vers le menton */}
      <path d="M72 116 Q62 118 58 126 Q55 134 62 140 Q68 144 76 140" stroke="#1a1a2e" strokeWidth="9" strokeLinecap="round" fill="none"/>
      {/* Main / poing au menton */}
      <ellipse cx="80" cy="86" rx="9" ry="7" fill="#1a1a2e"/>
      {/* Trois petits symboles */}
      {/* Intelligence — point lumineux */}
      <circle cx="148" cy="72" r="7" fill="#C9A84C" opacity="0.9"/>
      <text x="148" y="76" textAnchor="middle" fontSize="8" fill="white" fontWeight="900">I</text>
      {/* Conscience — oeil */}
      <ellipse cx="155" cy="95" rx="8" ry="5" fill="none" stroke="#C9A84C" strokeWidth="2"/>
      <circle cx="155" cy="95" r="2.5" fill="#C9A84C"/>
      {/* Decision — double fleche */}
      <path d="M147 112 L162 112" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M159 108 L164 112 L159 116" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Texte */}
      <text x="100" y="172" textAnchor="middle" fontSize="10" fill="#8B6914" fontWeight="800" fontFamily="sans-serif" letterSpacing="1">ESPRIT CRITIQUE IA</text>
      <text x="100" y="184" textAnchor="middle" fontSize="7.5" fill="#C9A84C" fontFamily="sans-serif" letterSpacing="0.5">Parcours valide</text>
    </svg>
  )
}

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    color: ['#C9A84C','#FFC800','#534AB7','#00A85E','#FF4B4B'][i % 5],
    left: ((i * 3.6) % 100).toFixed(1) + '%',
    delay: (i * 0.07).toFixed(2) + 's',
    size: 7 + (i % 4) * 3,
  }))
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', pointerEvents: 'none', overflow: 'hidden' }}>
      <style>{`@keyframes cfall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(320px) rotate(720deg);opacity:0}}`}</style>
      {pieces.map((p, i) => (
        <div key={i} style={{ position: 'absolute', top: 0, left: p.left, width: p.size, height: p.size / 2, background: p.color, borderRadius: 2, animation: `cfall 0.9s ${p.delay} ease-in forwards` }}/>
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
  const phases = ['⚡','☁️','⚖️','🏆','✅']
  return (
    <div style={{ padding: '10px 16px', background: 'var(--bg)', borderBottom: '0.5px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ flex: 1, height: 6, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: pct + '%', height: '100%', background: 'linear-gradient(90deg, #C9A84C, #E8D080)', borderRadius: 3, transition: 'width .4s' }}/>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#8B6914', minWidth: 30 }}>{pct}%</span>
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        {phases.map((p, i) => (
          <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, background: i < phase ? '#FEF3D0' : i === phase ? '#C9A84C' : 'var(--bg2)', border: '2px solid ' + (i === phase ? '#C9A84C' : 'transparent') }}>
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
            {onNext && <button onClick={onNext} disabled={!enabled} style={{ flex: 1, padding: '15px', borderRadius: 16, border: 'none', background: enabled ? '#C9A84C' : '#E5E5E5', color: enabled ? 'white' : '#AFAFAF', fontWeight: 800, fontSize: 15, cursor: enabled ? 'pointer' : 'default', boxShadow: enabled ? '0 4px 0 #8B6914' : 'none' }}>{nextLabel || 'Continuer'}</button>}
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
  const [allComplete, setAllComplete] = useState(false)
  const [s1ans, setS1ans] = useState(-1)
  const [s2ans, setS2ans] = useState(-1)
  const [s5ans, setS5ans] = useState(-1)
  const [s11ans, setS11ans] = useState(-1)
  const [s14ans, setS14ans] = useState(-1)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/'; return }
      setUserId(user.id)
      supabase.from('modules').select('id').eq('titre', 'Prise de decision').single().then(({ data }) => {
        if (data) setModuleId(data.id)
        setLoading(false)
      })
    })
  }, [])

  const checkAllComplete = async (uid: string) => {
    const titles = ['Intelligence', 'Conscience', 'Prise de decision']
    const { data: mods } = await supabase.from('modules').select('id, titre').in('titre', titles)
    if (!mods || mods.length < 3) return
    const ids = mods.map((m: { id: string }) => m.id)
    const { data: progs } = await supabase.from('progressions').select('module_id, completed').eq('animateur_id', uid).in('module_id', ids).eq('completed', true)
    if (progs && progs.length >= 3) setAllComplete(true)
  }

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
      const isComplete = fs === activeQuiz.length
      await supabase.from('progressions').upsert({ animateur_id: userId!, module_id: moduleId, completed: isComplete, completed_at: isComplete ? new Date().toISOString() : null, attempts: 1 }, { onConflict: 'animateur_id,module_id' })
      if (isComplete && userId) checkAllComplete(userId)
    }
  }

  const nextQuiz = () => { setShowFb(false); setFeedback(null); next() }
  const restart = () => { setStep(TOTAL_LEARNING); setAnswers(Array(QUIZ.length).fill(null)); setScore(0); setShowFb(false); setFeedback(null); setSaved(false) }

  if (loading) return <div className="container"><div className="empty"><p>Chargement...</p></div></div>

  const header = (
    <div style={{ position: 'sticky', top: 0, zIndex: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'white', borderBottom: '0.5px solid var(--border)' }}>
        <a href="/formation/modules" style={{ fontSize: 16, color: '#AFAFAF', fontWeight: 700, textDecoration: 'none' }}>&#x2715;</a>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#555', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t('Prise de decision','Decision-making')}</span>
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
          <div style={{ fontSize: 12, fontWeight: 600, color: '#8B6914', marginBottom: 12 }}>{t('Question','Question')} {qIdx + 1} / {activeQuiz.length} &middot; Score {score}</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.5, marginBottom: 20 }}>{q.q}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.opts.map((opt, i) => {
              const sel = ua === i; const cor = i === q.correct; const shown = ua !== null
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
          {allComplete && pct === 100 ? (
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <style>{`@keyframes badgeAppear{0%{transform:scale(0.3) rotate(-10deg);opacity:0}60%{transform:scale(1.08) rotate(2deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}`}</style>
              <div style={{ position: 'relative', display: 'inline-block', animation: 'badgeAppear 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards', marginBottom: 16 }}>
                <CritiqueIABadge size={140} />
              </div>
              <div style={{ display: 'inline-block', background: '#FEF3D0', color: '#8B6914', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20, marginBottom: 8, letterSpacing: 1 }}>BADGE DEBLOQUE ✦</div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#8B6914', marginBottom: 4 }}>ESPRIT CRITIQUE IA</h2>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 16 }}>{t("Vous avez complete les trois sous-modules. Intelligence, conscience, decision : vous savez questionner ces notions.",'You have completed all three sub-modules. Intelligence, consciousness, decision: you know how to question these concepts.')}</p>
              {/* Synthese finale */}
              <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '20px', marginBottom: 16, textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'white', marginBottom: 12, textAlign: 'center' }}>{t('TROIS QUESTIONS A GARDER EN TETE','THREE QUESTIONS TO KEEP IN MIND')}</div>
                {[
                  { q: t('"Cette IA est intelligente."','"This AI is intelligent."'), a: t("Qu'entendons-nous par intelligence ?",'What do we mean by intelligence?') },
                  { q: t('"Cette IA est consciente."','"This AI is conscious."'), a: t("Qu'entendons-nous par conscience et comment le savons-nous ?",'What do we mean by consciousness and how do we know?') },
                  { q: t('"Cette IA a decide."','"This AI decided."'), a: t("Qu'a reellement fait le systeme et qui porte la responsabilite ?",'What did the system actually do and who bears responsibility?') },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                    <div style={{ fontSize: 12, fontStyle: 'italic', color: 'rgba(255,255,255,0.6)' }}>{item.q}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#C9A84C', marginTop: 3 }}>&rarr; {item.a}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#C9A84C', borderRadius: 14, padding: '16px 18px', textAlign: 'center', marginBottom: 16 }}>
                <p style={{ fontWeight: 800, fontSize: 14, color: 'white', lineHeight: 1.6, margin: 0 }}>{t("Les mots que nous utilisons facconnent notre perception de l'IA. Les questionner est deja une maniere de reprendre la main.",'The words we use shape our perception of AI. Questioning them is already a way to take back control.')}</p>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>{pct === 100 ? '🏆' : pct >= 80 ? '🎯' : '💪'}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#8B6914', marginBottom: 8 }}>{total} / {activeQuiz.length}</div>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>{pct === 100 ? t('Parfait ! Sous-module valide.','Perfect! Sub-module complete.') : pct >= 80 ? t('Beau parcours !','Great work!') : t('Continue a apprendre !','Keep learning!')}</p>
              {pct === 100 && !allComplete && (
                <div style={{ background: '#FEF3D0', borderRadius: 12, padding: '14px 16px', marginTop: 12, fontSize: 13, color: '#8B6914' }}>
                  {t("Pour obtenir le badge Esprit Critique IA, completez egalement les modules Intelligence et Conscience.",'To earn the Critical AI Thinking badge, also complete the Intelligence and Consciousness modules.')}
                </div>
              )}
            </div>
          )}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={restart} style={{ width: '100%', padding: '15px', borderRadius: 16, border: 'none', background: '#C9A84C', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 0 #8B6914' }}>{t('Refaire le quiz','Retake quiz')}</button>
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
        <Wrap onNext={next} nextLabel={t('Commencer','Start') + ' →'}>
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚖️</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {[
                { icon: '🧠', label: 'INTELLIGENCE', q: t("Qu'entendons-nous par intelligent ?",'What do we mean by intelligent?'), done: true },
                { icon: '💡', label: 'CONSCIENCE', q: t("Qu'entendons-nous par conscient ?",'What do we mean by conscious?'), done: true },
                { icon: '⚖️', label: t('PRISE DE DECISION','DECISION-MAKING'), q: '', done: false },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', background: item.done ? '#F8F8F8' : '#1a1a2e', borderRadius: 12, border: '1.5px solid ' + (item.done ? '#E5E5E5' : '#C9A84C') }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 800, fontSize: 12, color: item.done ? '#888' : '#C9A84C', letterSpacing: 1 }}>{item.done ? '✓ ' : ''}{item.label}</div>
                    {item.q && <div style={{ fontSize: 11, color: '#aaa', fontStyle: 'italic', marginTop: 2 }}>{item.q}</div>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: '#C9A84C', borderRadius: 16, padding: '20px 24px' }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: 'white', lineHeight: 1.4 }}>
                {t("Quand une IA selectionne, recommande, classe ou agit... est-ce la meme chose que lorsqu'un humain decide ?",'When an AI selects, recommends, classifies or acts... is it the same as when a human decides?')}
              </div>
            </div>
          </div>
        </Wrap>
      )}

      {s === 1 && (
        <Wrap onNext={s1ans >= 0 ? next : undefined} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t('EXPERIENCE 1 — 2x3','EXPERIENCE 1 — 2x3')} bg="#EEEDFE" color="#534AB7" />
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontWeight: 900, fontSize: 56, color: '#1a1a2e', marginBottom: 24 }}>2 &times; 3 = ?</div>
            <div style={{ fontWeight: 900, fontSize: 72, color: '#534AB7', marginBottom: 24 }}>6</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#555', marginBottom: 16 }}>{t('Combien de temps avez-vous reflechi ?','How long did you think about it?')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[t('Pas du tout ou presque','Almost not at all'), t('Une seconde','One second'), t('Quelques secondes','A few seconds'), t("J'ai vraiment du calculer","I really had to calculate")].map((lbl, i) => (
                <button key={i} onClick={() => setS1ans(i)} style={{ padding: '14px 18px', borderRadius: 12, border: '2px solid ' + (s1ans === i ? '#534AB7' : '#E5E5E5'), background: s1ans === i ? '#EEEDFE' : 'white', cursor: 'pointer', fontSize: 14, fontWeight: s1ans === i ? 700 : 500, color: '#1a1a2e' }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
          {s1ans >= 0 && (
            <KBox>
              <p style={{ marginBottom: 6 }}>{t("Pour la plupart des adultes, la reponse surgit presque immediatement : elle a ete repetee et apprise de nombreuses fois.",'For most adults, the answer emerges almost immediately: it has been repeated and learned many times.')}</p>
              <p style={{ margin: 0 }}>{t("Nous recuperons directement ce resultat en memoire plutot que de recalculer consciemment 2 + 2 + 2.",'We retrieve this result directly from memory rather than consciously recalculating 2 + 2 + 2.')}</p>
            </KBox>
          )}
        </Wrap>
      )}

      {s === 2 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t('DEUX FAMILLES DE TRAITEMENTS','TWO FAMILIES OF PROCESSING')} bg="#E6F1FB" color="#0C447C" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div style={{ background: '#FAEEDA', borderRadius: 14, padding: '16px', border: '1.5px solid #EF9F27' }}>
              <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 8 }}>⚡ Type 1</div>
              {[t('Rapide','Fast'), t('Automatique','Automatic'), t('Intuitif','Intuitive'), t('Peu exigeant','Low demand'), t("Issu de l'experience","From experience")].map((item, i) => (
                <div key={i} style={{ fontSize: 12, color: '#633806', paddingTop: i > 0 ? 3 : 0, borderTop: i > 0 ? '1px solid rgba(99,56,6,0.1)' : 'none' }}>{item}</div>
              ))}
            </div>
            <div style={{ background: '#E6F1FB', borderRadius: 14, padding: '16px', border: '1.5px solid #85B7EB' }}>
              <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 8 }}>🧠 Type 2</div>
              {[t('Controle','Controlled'), t('Delibere','Deliberate'), t('Analytique','Analytical'), t('Exigeant','Demanding'), t('Raisonnement','Reasoning')].map((item, i) => (
                <div key={i} style={{ fontSize: 12, color: '#0C447C', paddingTop: i > 0 ? 3 : 0, borderTop: i > 0 ? '1px solid rgba(12,68,124,0.1)' : 'none' }}>{item}</div>
              ))}
            </div>
          </div>
          <WBox>
            <span>{t("Si vous dites 'nous avons deux cerveaux' ou 'deux systemes independants', c'est une simplification trop forte. Il s'agit d'un modele utile pour comprendre certaines differences de traitement — pas la description de deux machines distinctes dans le cerveau. Les theories du double processus font elles-memes l'objet de discussions scientifiques.",'If you say "we have two brains" or "two independent systems", that is too strong a simplification. This is a useful model for understanding certain processing differences — not a description of two distinct machines in the brain. Dual process theories are themselves subject to scientific discussion.')}</span>
          </WBox>
        </Wrap>
      )}

      {s === 3 && (
        <Wrap onNext={s2ans >= 0 ? next : undefined} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t('EXPERIENCE 2 — Calcul complexe','EXPERIENCE 2 — Complex calculation')} bg="#EEEDFE" color="#534AB7" />
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontWeight: 900, fontSize: 28, color: '#1a1a2e', marginBottom: 20, fontFamily: 'monospace' }}>
              &#x221b;365628 &divide; (2/5) = ?
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#555', marginBottom: 16 }}>{t('Meme sensation que pour 2 x 3 ?','Same feeling as for 2 x 3?')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['😂 ' + t('Absolument pas','Absolutely not'), '🤔 ' + t('Laissez-moi reflechir','Let me think'), '📝 ' + t("J'ai besoin de papier","I need paper"), '🧮 ' + t('Donnez-moi une calculatrice','Give me a calculator')].map((lbl, i) => (
                <button key={i} onClick={() => setS2ans(i)} style={{ padding: '14px 18px', borderRadius: 12, border: '2px solid ' + (s2ans === i ? '#534AB7' : '#E5E5E5'), background: s2ans === i ? '#EEEDFE' : 'white', cursor: 'pointer', fontSize: 14, fontWeight: s2ans === i ? 700 : 500, color: '#1a1a2e' }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
          {s2ans >= 0 && (
            <div style={{ marginTop: 16, animation: 'appear .3s ease' }}>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.65, marginBottom: 12 }}>{t("Cette fois, la reponse ne surgit probablement pas immediatement. Pour repondre, il faudrait comprendre l'expression, identifier les operations, se souvenir des regles, realiser les calculs...",'This time, the answer probably does not emerge immediately. To answer, you would need to understand the expression, identify the operations, recall the rules, perform the calculations...')}</p>
              <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '14px 18px', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'white' }}>{t('UNE SUITE D\'ETAPES','A SEQUENCE OF STEPS')}</div>
              </div>
            </div>
          )}
        </Wrap>
      )}

      {s === 4 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Phase suivante','Next phase') + ' →'}>
          <STag label={t("L'ALGORITHME","THE ALGORITHM")} bg="#D7FFB8" color="#2B7400" />
          <KBox>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>ALGORITHME</div>
            <p style={{ margin: 0 }}>{t("Une suite finie et organisee d'instructions permettant d'effectuer une tache ou de resoudre une classe de problemes.",'A finite and organised set of instructions for performing a task or solving a class of problems.')}</p>
          </KBox>
          <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #E5E5E5', overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ padding: '10px 16px', background: '#F7D1A0', fontWeight: 700, fontSize: 14, color: '#633806' }}>🍰 {t("Le gateau au yaourt","The yoghurt cake")}</div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['1. ' + t('Preparer les ingredients','Prepare the ingredients'), '2. ' + t('Mesurer','Measure'), '3. ' + t('Melanger','Mix'), '4. ' + t('Verser dans le moule','Pour into the tin'), '5. ' + t('Cuire','Bake'), '6. ' + t('Verifier la cuisson','Check the cooking')].map((step, i) => (
                  <div key={i} style={{ padding: '6px 10px', background: '#FAEEDA', borderRadius: 8, fontSize: 13, color: '#633806' }}>{step}</div>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: 12, fontWeight: 800, fontSize: 14, color: '#633806' }}>
                {t('ENTREES','INPUTS')} &rarr; {t('ETAPES','STEPS')} &rarr; {t('SORTIE','OUTPUT')}
              </div>
            </div>
          </div>
          <WBox>
            <span>{t("Si vous dites 'une recette de cuisine est un algorithme', c'est une bonne analogie pedagogique — et c'est vrai dans un sens large. Mais une recette n'est pas formellement toujours un algorithme informatique au sens strict : elle peut contenir des ambiguites, des approximations, des etapes non deterministes. L'analogie fonctionne bien pour faire comprendre la logique.",'If you say "a recipe is an algorithm", that is a good pedagogical analogy — and broadly true. But a recipe is not always formally a computer algorithm in the strict sense: it can contain ambiguities, approximations, non-deterministic steps. The analogy works well to convey the logic.')}</span>
          </WBox>
        </Wrap>
      )}

      {s === 5 && (
        <Wrap onNext={s5ans >= 0 ? next : undefined} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t("LES HEURISTIQUES","HEURISTICS")} bg="#FAEEDA" color="#633806" />
          <KBox>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>HEURISTIQUE</div>
            <p style={{ margin: 0 }}>{t("Une strategie simplifiee ou un raccourci permettant de produire rapidement un jugement ou une decision sans analyser exhaustivement toutes les possibilites.",'A simplified strategy or shortcut for quickly producing a judgment or decision without exhaustively analysing all possibilities.')}</p>
          </KBox>
          <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #E5E5E5', overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ padding: '10px 16px', background: '#1a1a2e', fontWeight: 700, fontSize: 14, color: 'white' }}>🍽️ {t("Le restaurant","The restaurant")}</div>
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.65, marginBottom: 12 }}>{t("Vous arrivez dans une ville inconnue. Deux restaurants cote a cote.","You arrive in an unknown city. Two restaurants side by side.")}</p>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, background: '#FFDFE0', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24 }}>🍽️</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#CC0000' }}>A</div>
                  <div style={{ fontSize: 11, color: '#CC0000' }}>{t('Vide','Empty')}</div>
                </div>
                <div style={{ flex: 1, background: '#D7FFB8', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24 }}>🍽️</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#2B7400' }}>B</div>
                  <div style={{ fontSize: 11, color: '#2B7400' }}>{t('Presque plein','Almost full')}</div>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#555', marginBottom: 10 }}>{t("Sans lire 200 avis... lequel choisissez-vous ?","Without reading 200 reviews... which do you choose?")}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{lbl:'A — ' + t('le vide','the empty one'), val:0}, {lbl:'B — ' + t('le plein','the full one'), val:1}].map(opt => (
                  <button key={opt.val} onClick={() => setS5ans(opt.val)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '2px solid ' + (s5ans === opt.val ? '#534AB7' : '#E5E5E5'), background: s5ans === opt.val ? '#EEEDFE' : 'white', cursor: 'pointer', fontSize: 13, fontWeight: s5ans === opt.val ? 700 : 500, color: '#1a1a2e' }}>{opt.lbl}</button>
                ))}
              </div>
            </div>
          </div>
          {s5ans >= 0 && (
            <div style={{ animation: 'appear .3s ease' }}>
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 10 }}>{t("S'il y a du monde, c'est probablement meilleur. C'est un raccourci : utile, rapide — mais parfois trompeur. Le restaurant A pourrait simplement venir d'ouvrir.",'If it is busy, it is probably better. That is a shortcut: useful, fast — but sometimes misleading. Restaurant A might have just opened.')}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {['✅ ' + t('Utile','Useful'), '⚡ ' + t('Rapide','Fast'), '❌ ' + t('Parfois trompeur','Sometimes misleading')].map((item, i) => (
                  <div key={i} style={{ flex: 1, padding: '8px', background: '#F8F8F8', borderRadius: 10, fontSize: 11, fontWeight: 600, color: '#555', textAlign: 'center' }}>{item}</div>
                ))}
              </div>
            </div>
          )}
        </Wrap>
      )}

      {s === 6 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t("POURQUOI CES RACCOURCIS ?","WHY SHORTCUTS?")} bg="#E1F5EE" color="#085041" />
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 14 }}>{t("Parce que nous devons decider dans un monde ou nous disposons :","Because we must decide in a world where we have:")}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {[t("D'informations incompletes","Incomplete information"), t("De temps limite","Limited time"), t("D'une attention limitee","Limited attention"), t("D'une memoire de travail limitee","Limited working memory"), t("De ressources cognitives limitees","Limited cognitive resources")].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', background: '#E1F5EE', borderRadius: 10 }}>
                <span style={{ color: '#085041', fontWeight: 800 }}>→</span>
                <span style={{ fontSize: 13, color: '#085041' }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '14px 18px', textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'white' }}>{t('RAPIDITE','SPEED')} &harr; {t('PRECISION','PRECISION')}</div>
          </div>
          <WBox>
            <span>{t("Si vous dites 'les heuristiques sont des erreurs de raisonnement', ce n'est pas exact. Une heuristique peut etre parfaitement adaptee a une situation et produire d'excellents resultats. Ce sont des raccourcis qui peuvent aussi generer certains biais systematiques dans certains contextes — pas des erreurs par nature.",'If you say "heuristics are reasoning errors", that is not accurate. A heuristic can be perfectly suited to a situation and produce excellent results. They are shortcuts that can also generate certain systematic biases in certain contexts — not errors by nature.')}</span>
          </WBox>
        </Wrap>
      )}

      {s === 7 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t("ET L'IA ?","AND AI?")} bg="#EEEDFE" color="#534AB7" />
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>{t("L'IA reproduit-elle cela ?","Does AI reproduce this?")}</h2>
          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 14 }}>{t("Les systemes d'IA utilisent des mecanismes tres differents du cerveau humain. Cependant, il peut etre interessant de comparer fonctionnellement certains comportements.",'AI systems use mechanisms very different from the human brain. However, it can be interesting to compare certain behaviours functionally.')}</p>
          <KBox>
            <p style={{ marginBottom: 8 }}>{t("Des travaux recents analysent meme les LLM a travers le cadre des theories a double processus : selon les taches et les methodes utilisees, leurs sorties peuvent presenter des caracteristiques ressemblant a des reponses rapides de type 1 ou a des raisonnements plus deliberes de type 2.",'Recent work even analyses LLMs through the lens of dual-process theories: depending on the tasks and methods used, their outputs can present characteristics resembling fast type-1 responses or more deliberate type-2 reasoning.')}</p>
            <p style={{ margin: 0, fontWeight: 700 }}>{t("Mais :","But:")}</p>
          </KBox>
          <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '16px 18px', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'white', lineHeight: 1.5 }}>
              {t("RESSEMBLANCE FONCTIONNELLE ≠ MECANISME IDENTIQUE","FUNCTIONAL RESEMBLANCE ≠ IDENTICAL MECHANISM")}
            </div>
          </div>
          <WBox>
            <span>{t("Si vous dites 'ChatGPT a un systeme 1 et un systeme 2 comme nous', ce n'est pas rigoureux. La ressemblance fonctionnelle observee dans certaines taches ne signifie pas que les mecanismes sous-jacents sont identiques a ceux du cerveau humain.",'If you say "ChatGPT has a System 1 and System 2 like us", that is not rigorous. The functional resemblance observed in certain tasks does not mean the underlying mechanisms are identical to those of the human brain.')}</span>
          </WBox>
        </Wrap>
      )}

      {s === 8 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Phase suivante','Next phase') + ' →'}>
          <STag label={t("EXPERIENCE 3 — Le nuage","EXPERIENCE 3 — The cloud")} bg="#E6F1FB" color="#0C447C" />
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #B0D9F0 60%, #90EE90 100%)', borderRadius: 16, padding: '32px 20px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 2, marginBottom: 8 }}>{t('Imaginez...','Imagine...')}</div>
              <div style={{ fontSize: 16, color: 'white', fontWeight: 600, marginBottom: 16 }}>{t("Vous etes allonge dans l'herbe. Vous regardez les nuages.",'You are lying in the grass. You are watching the clouds.')}</div>
              <div style={{ fontSize: 72 }}>☁️</div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2e', marginBottom: 16 }}>{t("Qu'est-ce que vous voyez ?","What do you see?")}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {['🐄 ' + t('Une vache','A cow'), '🚗 ' + t('Une voiture','A car'), '🐉 ' + t('Un dragon','A dragon'), '☁️ ' + t('Un nuage','A cloud')].map((lbl, i) => (
                <div key={i} style={{ padding: '10px 14px', background: 'white', borderRadius: 12, border: '1.5px solid #E5E5E5', fontSize: 14, fontWeight: 500, color: '#1a1a2e' }}>{lbl}</div>
              ))}
            </div>
          </div>
          <KBox>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>PAREIDOLIE</div>
            <p style={{ margin: 0 }}>{t("Notre cerveau peut percevoir une forme familiere dans un stimulus ambigu : un visage dans une facade, un animal dans un nuage... C'est une tendance naturelle de notre systeme perceptif.",'Our brain can perceive a familiar shape in an ambiguous stimulus: a face in a facade, an animal in a cloud... This is a natural tendency of our perceptual system.')}</p>
          </KBox>
        </Wrap>
      )}

      {s === 9 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>{t("Et si on montre ce nuage a une IA ?","What if we show this cloud to an AI?")}</h2>
          <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '16px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, marginBottom: 8 }}>Vision AI</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[t("Identifier : nuage",'Identify: cloud'), t("Decrire : formation cumulus, blanc",'Describe: cumulus formation, white'), t("Sur demande : ressemble a une vache",'When asked: looks like a cow'), t("Generer une histoire autour de l'image",'Generate a story around the image')].map((item, i) => (
                <div key={i} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>✓ {item}</div>
              ))}
            </div>
          </div>
          <KBox>
            <p style={{ marginBottom: 8 }}>{t("Si vous montrez cette photo a une IA et demandez simplement : qu'est-ce que c'est ? — elle repondra probablement : un nuage. Elle repond a la question posee.","If you show this photo to an AI and simply ask: what is this? — it will probably answer: a cloud. It answers the question asked.")}</p>
            <p style={{ margin: 0 }}>{t("L'etre humain, lui, peut percevoir spontanement les deux a la fois sans qu'on le lui demande : c'est un nuage, et ca ressemble a une vache. C'est la difference entre repondre a une requete et construire spontanement une representation.","A human, by contrast, can spontaneously perceive both at once without being asked: it is a cloud, and it looks like a cow. That is the difference between responding to a query and spontaneously constructing a representation.")}</p>
          </KBox>
          <WBox>
            <span>{t("Si vous demandez explicitement a l'IA 'ce nuage ressemble-t-il a un animal ?', elle pourra repondre 'oui, a une vache'. Elle peut reconnaitre des ressemblances quand on l'y invite. Mais la vraie question pedagogique n'est pas 'peut-elle le dire quand on le demande', c'est : percoit-elle spontanement, comme nous ? C'est ce qui rend la question du sens reellement interessante.","If you explicitly ask the AI 'does this cloud look like an animal?', it may well answer 'yes, like a cow'. It can recognise resemblances when invited to. But the real pedagogical question is not 'can it say it when asked' — it is: does it perceive spontaneously, as we do? That is what makes the question of meaning genuinely interesting.")}</span>
          </WBox>
          <div style={{ background: '#534AB7', borderRadius: 14, padding: '16px 18px', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'white', lineHeight: 1.5 }}>
              {t("Repondre a une question ≠ percevoir spontanement","Answering a question ≠ spontaneous perception")}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>{t("Que comprend-elle reellement de ce qu'elle decrit ?","What does it really understand of what it describes?")}</div>
          </div>
        </Wrap>
      )}

      {s === 10 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t("LE PROBLEME DU SENS","THE PROBLEM OF MEANING")} bg="#FAEEDA" color="#633806" />
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 14 }}>{t("Reprenons ce que nous venons de voir avec le nuage.","Let us revisit what we just saw with the cloud.")}</p>
          <div style={{ background: '#E6F1FB', borderRadius: 14, padding: '14px 16px', marginBottom: 14, border: '1.5px solid #85B7EB' }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#0C447C', marginBottom: 6 }}>{t("Pour un humain qui voit ce nuage :","For a human who sees this cloud:")}</p>
            <p style={{ fontSize: 13, color: '#0C447C', margin: 0 }}>{t("Sa perception de 'vache' est ancree dans sa vie : il a vu des vraies vaches, les a touchees, en a mange, les a peut-etre cotoye. Le mot 'vache' est lie a toute une experience vecue, incarnee, situee dans une histoire personnelle et culturelle.","Their perception of 'cow' is grounded in their life: they have seen real cows, touched them, eaten them, perhaps lived alongside them. The word 'cow' is linked to a whole lived, embodied experience, situated in a personal and cultural history.")}</p>
          </div>
          <KBox>
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6 }}>{t("Et pour une IA qui reconnait la meme ressemblance ?","And for an AI that recognises the same resemblance?")}</div>
            <p style={{ margin: 0 }}>{t("C'est la question de l'ancrage des symboles : comment les mots et representations manipules par un systeme acquerent-ils leur signification ? Les concepts humains sont lies a nos perceptions, notre corps, nos experiences, nos objectifs, notre culture. Pour une IA, c'est beaucoup moins clair.","This is the symbol grounding question: how do the words and representations manipulated by a system acquire their meaning? Human concepts are linked to our perceptions, our body, our experiences, our goals, our culture. For an AI, this is much less clear.")}</p>
          </KBox>
          <WBox>
            <span>{t("Si vous dites 'une IA ne donne aucun sens a ce qu'elle produit', vous supposez deja une definition particuliere du sens. Preferez : le fait qu'un systeme produise une reponse pertinente ne suffit pas a demontrer qu'il attribue a cette reponse le meme type de sens qu'un humain dont les concepts sont ancres dans une vie et un corps. C'est une question ouverte.","If you say 'an AI gives no meaning to what it produces', you already assume a particular definition of meaning. Prefer: the fact that a system produces a relevant response does not demonstrate that it attributes to that response the same type of meaning as a human whose concepts are grounded in a life and a body. This is an open question.")}</span>
          </WBox>
        </Wrap>
      )}

      {s === 11 && (
        <Wrap onNext={s11ans >= 0 ? next : undefined} onPrev={prev} nextLabel={t('Phase suivante','Next phase') + ' →'}>
          <STag label={t("UN SCORE EST-IL UNE DECISION ?","IS A SCORE A DECISION?")} bg="#E1F5EE" color="#085041" />
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 14 }}>{t("Un systeme de recrutement affiche :","A recruitment system displays:")}</p>
          <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '20px', marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 28, color: 'white', marginBottom: 4 }}>CANDIDAT B</div>
            <div style={{ fontWeight: 900, fontSize: 44, color: '#C9A84C' }}>87 %</div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 12 }}>{t("Est-ce une decision ?","Is this a decision?")}</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[t('Oui','Yes'), t('Non','No'), t('Ca depend','It depends')].map((lbl, i) => (
              <button key={i} onClick={() => setS11ans(i)} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '2px solid ' + (s11ans === i ? '#C9A84C' : '#E5E5E5'), background: s11ans === i ? '#FEF3D0' : 'white', cursor: 'pointer', fontSize: 13, fontWeight: s11ans === i ? 700 : 500, color: s11ans === i ? '#8B6914' : '#555' }}>{lbl}</button>
            ))}
          </div>
          {s11ans >= 0 && (
            <div style={{ animation: 'appear .3s ease' }}>
              <div style={{ background: '#C9A84C', borderRadius: 14, padding: '14px 18px', textAlign: 'center', marginBottom: 14 }}>
                <div style={{ fontWeight: 900, fontSize: 20, color: 'white' }}>CA DEPEND.</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{t("Et voici pourquoi ce 'ca depend' est au coeur du sujet :","And here is why this 'it depends' is at the heart of the matter:")}</div>
              </div>
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 12 }}>{t("Ce chiffre de 87% ne dit rien par lui-meme. Pour qu'il signifie quelque chose, il faut que des humains aient pris des decisions avant lui :","This figure of 87% says nothing by itself. For it to mean anything, humans must have made decisions before it:")}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {[
                  t("Quelqu'un a choisi les criteres qui composent ce score","Someone chose the criteria that make up this score"),
                  t("Quelqu'un a fixe le seuil (80% ? 75% ? 90% ?) et decide ce qu'il declenche","Someone set the threshold (80%? 75%? 90%?) and decided what it triggers"),
                  t("Quelqu'un a defini l'objectif a optimiser — et peut-etre accepte un certain taux d'erreur","Someone defined the objective to optimise — and perhaps accepted a certain error rate"),
                  t("Quelqu'un doit assumer les consequences si le candidat retenu se revele mauvais — ou si le candidat rejete etait le meilleur","Someone must bear the consequences if the hired candidate proves poor — or if the rejected one was the best"),
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 12px', background: '#FEF3D0', borderRadius: 10 }}>
                    <span style={{ color: '#8B6914', fontWeight: 800, flexShrink: 0 }}>→</span>
                    <span style={{ fontSize: 12, color: '#8B6914', lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '14px 18px', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>{t("Le score existe. Mais le sens de ce score est construit par des choix humains.","The score exists. But the meaning of this score is built by human choices.")}</div>
              </div>
            </div>
          )}
        </Wrap>
      )}


      {s === 12 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Phase suivante','Next phase') + ' →'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {[t("L'IA PEUT CALCULER","AI CAN COMPUTE"), t("L'IA PEUT CLASSER","AI CAN CLASSIFY"), t("L'IA PEUT PREDIRE","AI CAN PREDICT"), t("L'IA PEUT RECOMMANDER","AI CAN RECOMMEND"), t("L'IA PEUT DECLENCHER UNE ACTION","AI CAN TRIGGER AN ACTION")].map((item, i) => (
              <div key={i} style={{ padding: '12px 16px', background: '#1a1a2e', borderRadius: 12, fontWeight: 800, fontSize: i === 4 ? 15 : 14, color: i === 4 ? '#C9A84C' : 'white', textAlign: 'center' }}>{item}</div>
            ))}
          </div>
          <div style={{ background: '#C9A84C', borderRadius: 16, padding: '20px', textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 900, fontSize: 22, color: 'white', lineHeight: 1.4 }}>
              {t("MAIS QUI DEFINIT CE QUI COMPTE ?","BUT WHO DEFINES WHAT MATTERS?")}
            </div>
          </div>
          <KBox>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>{t("Derriere tout systeme existent :","Behind every system there are:")}</div>
            {[t("des objectifs","objectives"), t("des donnees","data"), t("des criteres","criteria"), t("des seuils","thresholds"), t("des arbitrages","trade-offs"), t("des contraintes","constraints")].map((item, i) => (
              <div key={i} style={{ fontSize: 12, color: '#085041', paddingTop: i > 0 ? 3 : 0, borderTop: i > 0 ? '1px solid rgba(8,80,65,0.1)' : 'none' }}>→ {item}</div>
            ))}
          </KBox>
          <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>{t("UNE DECISION N'EST PAS SEULEMENT UN CALCUL.","A DECISION IS NOT JUST A CALCULATION.")}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{t("objectif + contexte + criteres + valeurs + consequences + responsabilite","objective + context + criteria + values + consequences + responsibility")}</div>
          </div>
        </Wrap>
      )}

      {s === 13 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Continuer','Continue') + ' →'}>
          <STag label={t("CONTROLE HUMAIN","HUMAN CONTROL")} bg="#FFDFE0" color="#CC0000" />
          <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #E5E5E5', overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ padding: '10px 16px', background: '#003189', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>🇪🇺</span>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'white' }}>⚖️ {t("AI Act — Controle humain","AI Act — Human oversight")}</div>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.65, marginBottom: 10 }}>{t("Pour les systemes a haut risque, les personnes chargees du controle doivent notamment pouvoir :","For high-risk systems, persons in charge of oversight must notably be able to:")}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[t("Comprendre les capacites et limites du systeme","Understand the system's capabilities and limits"), t("Surveiller son fonctionnement","Monitor its operation"), t("Interpreter ses resultats","Interpret its outputs"), t("Decider de ne pas suivre une sortie","Decide not to follow an output"), t("Intervenir ou arreter le systeme","Intervene or stop the system")].map((item, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#085041', padding: '4px 8px', background: '#E1F5EE', borderRadius: 6 }}>✓ {item}</div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: '#CC0000', borderRadius: 14, padding: '14px 18px', textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>{t("CONTROLE HUMAIN ≠ CLIQUER SUR 'VALIDER'","HUMAN OVERSIGHT ≠ CLICKING 'CONFIRM'")}</div>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>{t("Le biais d'automatisation","Automation bias")}</h3>
          <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '14px 18px', marginBottom: 12, textAlign: 'center' }}>
            <div style={{ fontStyle: 'italic', fontSize: 15, color: 'rgba(255,255,255,0.8)' }}>&laquo; {t("L'ordinateur l'a dit, donc ca doit etre vrai.","The computer said it, so it must be true.")} &raquo;</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ padding: '12px 16px', background: '#FFDFE0', borderRadius: 12, fontWeight: 700, fontSize: 14, color: '#CC0000', textAlign: 'center' }}>{t("LE RISQUE N'EST PAS SEULEMENT QUE L'IA SE TROMPE.","THE RISK IS NOT ONLY THAT AI IS WRONG.")}</div>
            <div style={{ padding: '12px 16px', background: '#1a1a2e', borderRadius: 12, fontWeight: 700, fontSize: 14, color: '#C9A84C', textAlign: 'center' }}>{t("LE RISQUE EST AUSSI QUE L'HUMAIN CESSE DE QUESTIONNER.","THE RISK IS ALSO THAT HUMANS STOP QUESTIONING.")}</div>
          </div>
        </Wrap>
      )}

      {s === 14 && (
        <Wrap onNext={s14ans >= 0 ? next : undefined} onPrev={prev} nextLabel={t('Phase suivante','Next phase') + ' →'}>
          <STag label={t("MISE EN SITUATION","SIMULATION")} bg="#FFDFE0" color="#CC0000" />
          <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '20px', marginBottom: 20, border: '2px solid #C9A84C', textAlign: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: 18, color: 'white', lineHeight: 1.4 }}>{t("L'IA A DECIDE DE REFUSER VOTRE DOSSIER.","THE AI HAS DECIDED TO REJECT YOUR FILE.")}</div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 12 }}>{t("Quelle devrait etre votre premiere reaction ?","What should be your first reaction?")}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            <button onClick={() => setS14ans(0)} style={{ padding: '12px 16px', borderRadius: 12, border: '2px solid ' + (s14ans === 0 ? '#CC0000' : '#E5E5E5'), background: s14ans === 0 ? '#FFDFE0' : 'white', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: s14ans === 0 ? '#CC0000' : '#555' }}>A — {t("L'IA est responsable.","The AI is responsible.")}</button>
            <button onClick={() => setS14ans(1)} style={{ padding: '12px 16px', borderRadius: 12, border: '2px solid ' + (s14ans === 1 ? '#CC0000' : '#E5E5E5'), background: s14ans === 1 ? '#FFDFE0' : 'white', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: s14ans === 1 ? '#CC0000' : '#555' }}>B — {t("L'algorithme est forcement objectif.","The algorithm is necessarily objective.")}</button>
            <button onClick={() => setS14ans(2)} style={{ padding: '12px 16px', borderRadius: 12, border: '2px solid ' + (s14ans === 2 ? '#CC0000' : '#E5E5E5'), background: s14ans === 2 ? '#FFDFE0' : 'white', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: s14ans === 2 ? '#CC0000' : '#555' }}>C — {t("Il faut interdire l'IA.","We must ban AI.")}</button>
            <button onClick={() => setS14ans(3)} style={{ padding: '12px 16px', borderRadius: 12, border: '2px solid ' + (s14ans === 3 ? '#58CC02' : '#E5E5E5'), background: s14ans === 3 ? '#D7FFB8' : 'white', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: s14ans === 3 ? 700 : 400, color: s14ans === 3 ? '#2B7400' : '#555' }}>D — {t("Quel systeme a produit ce resultat, selon quels criteres, avec quel controle humain et qui porte la responsabilite ?","What system produced this result, by what criteria, with what human oversight and who bears responsibility?")} {s14ans === 3 ? ' ✓' : ''}</button>
          </div>
          {s14ans >= 0 && (
            <div style={{ animation: 'appear .3s ease' }}>
              <KBox>
                <p style={{ margin: 0 }}>{t("Parler d'une 'decision de l'IA' peut masquer toute une chaine de choix humains, techniques et organisationnels. Les 5 questions a se poser : 1. Qu'a produit le systeme ? 2. Quel objectif ? 3. Quels criteres ? 4. Quel humain peut intervenir ? 5. Qui assume les consequences ?",'Talking about an "AI decision" can mask a whole chain of human, technical and organisational choices. The 5 questions to ask: 1. What did the system produce? 2. What objective? 3. What criteria? 4. Which human can intervene? 5. Who bears the consequences?')}</p>
              </KBox>
            </div>
          )}
        </Wrap>
      )}

      {s === 15 && (
        <Wrap onNext={next} onPrev={prev} nextLabel={t('Passer au quiz','Take the quiz') + ' →'}>
          <STag label={t("SYNTHESE","SYNTHESIS")} bg="#FEF3D0" color="#8B6914" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {[
              { icon: '🧠', label: 'INTELLIGENCE', desc: t("Une performance ne suffit pas a definir universellement l'intelligence.",'A performance does not suffice to universally define intelligence.'), color: '#EEEDFE', border: '#534AB7', fg: '#3C3489' },
              { icon: '💡', label: 'CONSCIENCE', desc: t("Un comportement ou un discours ne suffit pas a demontrer une experience subjective.",'A behaviour or discourse does not suffice to demonstrate a subjective experience.'), color: '#E6F1FB', border: '#0C447C', fg: '#0C447C' },
              { icon: '⚖️', label: t('PRISE DE DECISION','DECISION-MAKING'), desc: t("Calculer, recommander ou agir ne resout pas les questions de sens, valeurs et responsabilite.",'Computing, recommending or acting does not resolve questions of meaning, values and responsibility.'), color: '#FEF3D0', border: '#C9A84C', fg: '#8B6914' },
            ].map(item => (
              <div key={item.label} style={{ padding: '12px 16px', background: item.color, borderRadius: 12, border: '1.5px solid ' + item.border }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: item.fg, marginBottom: 4 }}>{item.icon} {item.label}</div>
                <div style={{ fontSize: 12, color: item.fg, opacity: 0.85 }}>{item.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#C9A84C', borderRadius: 14, padding: '16px 18px', textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'white', marginBottom: 6 }}>{t("QU'EST-CE QUE NOUS VOULONS DELEGUER ?","WHAT DO WE WANT TO DELEGATE?")}</div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.55 }}>{t("L'IA redistribue les capacites d'analyse, de recommandation et d'action entre humains et machines.",'AI redistributes the capacities for analysis, recommendation and action between humans and machines.')}</p>
          </div>
          <div style={{ background: 'white', borderRadius: 12, border: '1.5px solid #E5E5E5', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', background: '#8B6914', color: 'white', fontWeight: 700, fontSize: 12 }}>{t("FICHE MEMO","REFERENCE CARD")}</div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[['⚡', t('2x3 = traitement automatise','2x3 = automated processing'), ''], ['🧠', t('Type 1 / Type 2','Type 1 / Type 2'), t('Rapide vs delibere','Fast vs deliberate')], ['🔁', t('Heuristique','Heuristic'), t('Raccourci de jugement','Judgment shortcut')], ['📋', t('Algorithme','Algorithm'), t("Suite organisee d'instructions",'Organised set of instructions')], ['☁️', t('Nuage / vache','Cloud / cow'), t("Question du sens et de l'ancrage",'Question of meaning and grounding')], ['⚖️', t('Score 87%','Score 87%'), t("Information ou decision ?","Information or decision?")]].map(([icon, label, desc]) => (
                <div key={String(label)} style={{ fontSize: 12, color: '#555', display: 'flex', gap: 8 }}>
                  <span>{icon}</span><span><strong style={{ color: '#1a1a2e' }}>{label}</strong>{desc ? ' — ' + desc : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </Wrap>
      )}

    </div>
  )
}
