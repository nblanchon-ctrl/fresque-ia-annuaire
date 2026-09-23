'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

const TOTAL_LEARNING = 31
const QUIZ = [
  { q: "Dans l'informatique traditionnelle, qui définit principalement les règles ?", opts: ["Le développeur", "Le réseau de neurones", "La machine elle-même", "Les utilisateurs finaux"], correct: 0, expl: "Dans l'informatique traditionnelle, ce sont les développeurs (humains) qui écrivent explicitement chaque règle." },
  { q: "Quel est l'avantage d'un système déterministe à règles explicites ?", opts: ["Il apprend seul", "Il ne commet jamais d'erreur", "Son chemin de décision peut généralement être retracé", "Il comprend le langage naturel"], correct: 2, expl: "La traçabilité est un avantage clé : on peut revenir sur chaque condition et expliquer le résultat." },
  { q: "Dans un système expert, à quoi sert le moteur d'inférence ?", opts: ["À créer des images", "À appliquer des règles aux faits disponibles", "À remplacer la base de connaissances", "À entraîner un réseau neuronal"], correct: 1, expl: "Le moteur d'inférence confronte les faits aux règles pour déduire une conclusion." },
  { q: "Pourquoi Deep Blue est-il intéressant dans cette histoire ?", opts: ["Il a inventé les LLM", "Il était capable de tout faire", "Il utilisait ChatGPT", "Il illustre la très forte performance possible sur une tâche spécialisée"], correct: 3, expl: "Deep Blue illustre qu'une machine peut être extraordinairement performante dans un domaine précis sans savoir faire autre chose." },
  { q: "Quel changement caractérise le mieux le machine learning ?", opts: ["La machine n'utilise plus de calculs", "Le modèle apprend des paramètres à partir de données plutôt que toutes les règles étant écrites explicitement", "Les ordinateurs abandonnent le binaire", "Internet devient inutile"], correct: 1, expl: "La rupture : au lieu d'écrire les règles, on fournit des données et un objectif, et le modèle apprend ses paramètres." },
  { q: "Qu'est-ce qu'un neurone artificiel ?", opts: ["Une copie exacte d'un neurone biologique", "Une cellule créée artificiellement", "Un composant possédant une conscience", "Une unité de calcul mathématique"], correct: 3, expl: "Un neurone artificiel est essentiellement une fonction mathématique. Ce n'est pas une reproduction fidèle du cerveau." },
  { q: "Dans un réseau neuronal, que représente un poids ?", opts: ["La taille du serveur", "Le volume de données", "Une valeur influençant l'importance d'un signal dans le calcul", "Le nombre d'utilisateurs"], correct: 2, expl: "Les poids sont comme des boutons de réglage. L'apprentissage les ajuste pour réduire les erreurs." },
  { q: "Pendant l'entraînement, que cherche-t-on à réduire ?", opts: ["L'erreur entre prédiction et résultat attendu", "Le nombre de touches du clavier", "La taille de l'écran", "Le nombre d'utilisateurs"], correct: 0, expl: "L'apprentissage consiste à ajuster les poids pour réduire l'erreur entre prédiction et résultat attendu." },
  { q: "À quoi sert la rétropropagation ?", opts: ["À transformer le réseau en système expert", "À déterminer comment les paramètres ont contribué à l'erreur afin de les ajuster", "À supprimer les données", "À traduire le texte"], correct: 1, expl: "La rétropropagation calcule la contribution de chaque paramètre à l'erreur, combinée à la descente de gradient." },
  { q: "Que désigne la 'boîte noire' ?", opts: ["Un ordinateur éteint", "Un serveur sécurisé", "Un modèle secret", "La difficulté à traduire le fonctionnement interne en explication humaine simple"], correct: 3, expl: "Un grand réseau peut avoir des milliards de paramètres. Expliquer une décision en règles compréhensibles est très difficile." },
  { q: "Qu'est-ce qu'un token ?", opts: ["Une unité dans laquelle le texte peut être découpé pour être traité", "Une réponse complète", "Un neurone biologique", "Un moteur de recherche"], correct: 0, expl: "Le texte est découpé en tokens : un mot entier, une partie de mot, un signe de ponctuation..." },
  { q: "Pourquoi 'va' est-il une suite plausible de 'Bonjour, comment ça...' ?", opts: ["Le système d'exploitation l'impose", "Tous les prompts se terminent ainsi", "Le modèle estime les suites possibles en fonction du contexte et de son apprentissage", "'Va' est toujours le mot le plus fréquent"], correct: 2, expl: "Le modèle calcule une distribution de probabilités sur les tokens susceptibles de suivre le contexte." },
  { q: "À quoi sert l'exemple du sac de billes ?", opts: ["À expliquer les processeurs", "À montrer que l'IA fonctionne au hasard", "À représenter physiquement les tokens", "À introduire intuitivement la notion de probabilité conditionnelle"], correct: 3, expl: "Le sac de billes est une analogie pour comprendre qu'une probabilité peut être estimée à partir des observations." },
  { q: "Pourquoi utilise-t-on des vecteurs ?", opts: ["Pour représenter numériquement les tokens et des relations apprises entre eux", "Pour dessiner uniquement des images", "Pour remplacer les réseaux neuronaux", "Pour créer des fichiers Word"], correct: 0, expl: "Les tokens sont transformés en vecteurs : des coordonnées dans un espace à des centaines de dimensions qui capturent le sens." },
  { q: "Que montre principalement l'exemple du lapin ?", opts: ["Que l'IA sait cuisiner", "Que le contexte peut modifier le sens pertinent d'une même formulation", "Que les chasseurs utilisent l'IA", "Que chaque mot a toujours une seule signification"], correct: 1, expl: "Le mot 'lapin' n'est pas interprété de la même façon selon que le contexte évoque un enfant avec une peluche ou un chasseur." },
  { q: "Que signifie le T de GPT ?", opts: ["Token", "Training", "Transformer", "Technology"], correct: 2, expl: "GPT = Generative Pre-trained Transformer. Le Transformer est l'architecture introduite en 2017, avec son mécanisme d'attention." },
  { q: "Quel mécanisme est particulièrement associé au Transformer ?", opts: ["L'attention", "La carte perforée", "Le moteur d'inférence", "L'arbre binaire"], correct: 0, expl: "Le mécanisme d'attention permet d'évaluer quelles parties du contexte sont les plus pertinentes entre elles." },
  { q: "Quelle description correspond le mieux à un agent IA ?", opts: ["Un chatbot donnant toujours une phrase", "Un système pouvant associer modèle, instructions et outils pour enchaîner des actions vers un objectif", "Une base de données", "Une IA obligatoirement totalement autonome"], correct: 1, expl: "Un agent IA combine un modèle avec des instructions et des outils pour enchaîner des actions et atteindre un objectif." },
  { q: "Pourquoi parle-t-on de world models ?", opts: ["Pour créer des cartes", "Pour remplacer les IA par des robots", "Pour explorer des systèmes capables d'apprendre des représentations permettant d'anticiper l'évolution d'un environnement", "Pour augmenter la quantité de texte"], correct: 2, expl: "Les world models visent à permettre aux machines d'anticiper les conséquences de leurs actions dans le monde physique." },
  { q: "Quelle phrase résume le mieux l'évolution présentée ?", opts: ["Les ordinateurs modernes n'utilisent plus d'algorithmes", "Chaque technologie a complètement remplacé la précédente", "L'IA fonctionne désormais sans intervention humaine", "Nous sommes progressivement passés de règles explicitement programmées à des systèmes capables d'apprendre des paramètres à partir de données"], correct: 3, expl: "L'évolution clé : de règles écrites par des humains, nous sommes passés à des systèmes qui apprennent leurs paramètres à partir de données." },
]

// ─── PCB BADGE (puce électronique sur fond bleu) ─────────────────────────────
function AIChipBadge({ size = 100 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ animation: 'pcbGlow 2.5s ease-in-out infinite' }}>
      <style>{`@keyframes pcbGlow{0%,100%{filter:drop-shadow(0 0 6px #00B86B) drop-shadow(0 0 10px #003A8C)}50%{filter:drop-shadow(0 0 16px #00B86B) drop-shadow(0 0 28px #0066CC)}}`}</style>
      <rect width="200" height="200" rx="20" fill="#040F1D"/>
      <rect x="1" y="1" width="198" height="198" rx="19" fill="none" stroke="#0A2540" strokeWidth="2"/>
      {[25,50,75,100,125,150,175].map(x=><line key={x} x1={x} y1="0" x2={x} y2="200" stroke="#071828" strokeWidth="0.8"/>)}
      {[25,50,75,100,125,150,175].map(y=><line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#071828" strokeWidth="0.8"/>)}
      <path d="M20 100 L58 100 L58 58 L100 58" stroke="#00B86B" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M180 100 L142 100 L142 58 L100 58" stroke="#00B86B" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M100 180 L100 142 L142 142 L142 100" stroke="#00B86B" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M100 20 L100 58 L58 58 L58 100" stroke="#00B86B" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M38 38 L58 58" stroke="#0066CC" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M162 38 L142 58" stroke="#0066CC" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M38 162 L58 142" stroke="#0066CC" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M162 162 L142 142" stroke="#0066CC" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {([[20,20],[180,20],[20,180],[180,180]] as [number,number][]).map(([cx,cy],i)=>(
        <g key={i}>
          <circle cx={cx} cy={cy} r="8" fill="#B8860B"/>
          <circle cx={cx} cy={cy} r="5" fill="#DAA520"/>
          <circle cx={cx} cy={cy} r="2.5" fill="#040F1D"/>
        </g>
      ))}
      {[60,80,100,120,140].map((pos,i)=>[
        <rect key={`t${i}`} x={pos-5} y="0" width="10" height="14" rx="2" fill="#B8860B"/>,
        <rect key={`b${i}`} x={pos-5} y="186" width="10" height="14" rx="2" fill="#B8860B"/>,
        <rect key={`l${i}`} x="0" y={pos-5} width="14" height="10" rx="2" fill="#B8860B"/>,
        <rect key={`r${i}`} x="186" y={pos-5} width="14" height="10" rx="2" fill="#B8860B"/>,
      ])}
      <rect x="60" y="60" width="80" height="80" rx="8" fill="#0D1F3C" stroke="#1A4A8A" strokeWidth="2"/>
      <rect x="67" y="67" width="66" height="66" rx="5" fill="#060E1A" stroke="#2D5AA8" strokeWidth="1"/>
      <line x1="100" y1="71" x2="100" y2="90" stroke="#00B86B" strokeWidth="1"/>
      <line x1="71" y1="100" x2="90" y2="100" stroke="#00B86B" strokeWidth="1"/>
      <line x1="100" y1="129" x2="100" y2="110" stroke="#00B86B" strokeWidth="1"/>
      <line x1="129" y1="100" x2="110" y2="100" stroke="#00B86B" strokeWidth="1"/>
      {([[82,82],[100,82],[118,82],[82,100],[118,100],[82,118],[100,118],[118,118]] as [number,number][]).map(([cx,cy],i)=>(
        <circle key={i} cx={cx} cy={cy} r="4" fill="#1A6AC8" opacity="0.85"/>
      ))}
      {([[82,82,100,82],[100,82,118,82],[82,100,100,100],[100,100,118,100],[82,118,100,118],[100,118,118,118],[82,82,82,100],[100,82,100,100],[118,82,118,100],[82,100,82,118],[100,100,100,118],[118,100,118,118],[82,82,100,100],[100,100,118,118]] as [number,number,number,number][]).map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1A4A8A" strokeWidth="0.8" opacity="0.6"/>
      ))}
      <rect x="90" y="90" width="20" height="20" rx="4" fill="#0A2050" stroke="#2D6AC8" strokeWidth="1.5"/>
      <text x="100" y="103" textAnchor="middle" fontSize="9" fill="white" fontWeight="900" fontFamily="monospace">AI</text>
      {([[58,58],[142,58],[58,142],[142,142]] as [number,number][]).map(([cx,cy],i)=>(
        <circle key={i} cx={cx} cy={cy} r="5" fill="#00B86B" opacity="0.9"/>
      ))}
      <text x="100" y="174" textAnchor="middle" fontSize="8" fill="#2D6AC8" fontWeight="800" fontFamily="monospace" letterSpacing="2">IA MASTER</text>
    </svg>
  )
}


// ─── PHASE CELEBRATIONS DATA ──────────────────────────────────────────────────
const PHASE_CELEBRATIONS = [
  { atStep: 6,  icon: '💻', title: 'Âge 1 maîtrisé !', sub: 'Tu comprends maintenant comment les humains ont appris à faire calculer les machines.', color: '#534AB7', bg: '#EEEDFE' },
  { atStep: 11, icon: '🧪', title: 'Systèmes experts explorés !', sub: "Tu sais ce qu'est un moteur d'inférence et pourquoi Deep Blue est fascinant.", color: '#633806', bg: '#FAEEDA' },
  { atStep: 20, icon: '🔗', title: 'Réseaux de neurones maîtrisés !', sub: "Tu comprends comment une machine apprend — et ce qu'est la boîte noire.", color: '#0C447C', bg: '#E6F1FB' },
  { atStep: 29, icon: '✨', title: 'IA générative découverte !', sub: 'Tokens, vecteurs, attention, Transformer… tu as tout compris.', color: '#72243E', bg: '#FBEAF0' },
  { atStep: 31, icon: '🚀', title: 'Contenu terminé ! Place au quiz.', sub: '20 questions pour valider ta maîtrise. Un score parfait débloque le badge IA MASTER.', color: '#27500A', bg: '#EAF3DE' },
]

// ─── CONFETTI ─────────────────────────────────────────────────────────────────
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

// ─── CELEBRATION MODAL ────────────────────────────────────────────────────────
function CelebrationModal({ data, onContinue }: { data: typeof PHASE_CELEBRATIONS[0], onContinue: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.72)', padding: '20px' }}>
      <style>{`
        @keyframes popIn{0%{transform:scale(0.4);opacity:0}65%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
        @keyframes bounceIcon{0%,100%{transform:translateY(0)}45%{transform:translateY(-14px)}}
        @keyframes starSpin{0%{transform:rotate(0deg) scale(0);opacity:0}60%{transform:rotate(200deg) scale(1.3);opacity:1}100%{transform:rotate(360deg) scale(1);opacity:1}}
      `}</style>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <Confetti />
        <div style={{ background: 'white', borderRadius: 28, padding: '40px 32px', textAlign: 'center', maxWidth: 360, width: '100%', animation: 'popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards', boxShadow: '0 28px 64px rgba(0,0,0,0.35)', position: 'relative' }}>
          {[[-30,-30],[30,-30],[-30,30],[30,30]].map(([dx,dy],i)=>(
            <div key={i} style={{ position:'absolute', top:44+Math.abs(dy), [dx<0?'left':'right']:44-Math.abs(dx), fontSize:20, animation:`starSpin 0.7s ${i*0.12}s ease both`, opacity:0 }}>⭐</div>
          ))}
          <div style={{ fontSize: 68, marginBottom: 8, animation: 'bounceIcon 1.2s 0.5s ease-in-out infinite', display: 'block' }}>{data.icon}</div>
          <div style={{ display: 'inline-block', background: data.bg, color: data.color, fontSize: 11, fontWeight: 800, padding: '4px 16px', borderRadius: 20, marginBottom: 14, letterSpacing: 1, textTransform: 'uppercase' }}>Phase complétée !</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a2e', marginBottom: 10, lineHeight: 1.3, whiteSpace: 'pre-line' }}>{data.title}</h2>
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.65, marginBottom: 28 }}>{data.sub}</p>
          <button onClick={onContinue} style={{ width: '100%', padding: '16px', borderRadius: 16, background: '#58CC02', color: 'white', border: 'none', fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 0 #3D8A00', letterSpacing: 0.5, transition: 'transform 0.1s' }}
            onMouseDown={e => (e.currentTarget.style.transform = 'translateY(3px)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'translateY(0)')}>
            Continuer →
          </button>
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ step, phase }: { step: number, phase: number }) {
  const pct = Math.round((step / (TOTAL_LEARNING + QUIZ.length)) * 100)
  const phases = ['💻','🧪','🔗','✨','🤖','❓']
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
          <div key={i} style={{
            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13,
            background: i < phase ? '#E1F5EE' : i === phase ? 'var(--accent)' : 'var(--bg2)',
            border: `2px solid ${i === phase ? 'var(--accent)' : 'transparent'}`,
          }} title={['Traditionnel','Experts','Neurones','Génératif','Maintenant','Quiz'][i]}>
            {i < phase ? '✓' : p}
          </div>
        ))}
      </div>
    </div>
  )
}

function Btn({ children, onClick, disabled, variant = 'primary', full = true }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean, variant?: 'primary' | 'secondary', full?: boolean }) {
  const isPrimary = variant === 'primary' && !disabled
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: full ? '100%' : 'auto', padding: '15px 20px', borderRadius: 16, border: 'none',
      background: disabled ? '#E5E5E5' : variant === 'primary' ? '#58CC02' : '#F0F0F0',
      color: disabled ? '#AFAFAF' : variant === 'primary' ? 'white' : '#555',
      fontWeight: 800, fontSize: 15, cursor: disabled ? 'default' : 'pointer',
      boxShadow: isPrimary ? '0 4px 0 #3D8A00' : 'none',
      letterSpacing: 0.3,
      transition: 'transform 0.1s, box-shadow 0.1s',
    }}
    onMouseDown={e => isPrimary && Object.assign(e.currentTarget.style, {transform:'translateY(3px)',boxShadow:'0 1px 0 #3D8A00'})}
    onMouseUp={e => isPrimary && Object.assign(e.currentTarget.style, {transform:'translateY(0)',boxShadow:'0 4px 0 #3D8A00'})}>
      {children}
    </button>
  )
}

function FeedbackBar({ correct, expl, onNext, last }: { correct: boolean, expl: string, onNext: () => void, last: boolean }) {
  const msgs = ['Exact ! 🎉', 'Bien vu ! ⚡', 'Parfait ! 🔥', 'Tu as compris ! 💡', 'Bravo ! 🌟']
  const msg = msgs[Math.floor(Math.random() * msgs.length)]
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: correct ? '#D7FFB8' : '#FFDFE0', borderTop: `4px solid ${correct ? '#58CC02' : '#FF4B4B'}`, padding: '16px 20px 28px', zIndex: 100 }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: correct ? '#58CC02' : '#FF4B4B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'white', fontWeight: 900 }}>{correct ? '✓' : '✗'}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: correct ? '#2B7400' : '#CC0000', marginBottom: 4 }}>{correct ? msg : 'Pas tout à fait…'}</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: correct ? '#1A5200' : '#990000' }}>{expl}</div>
          </div>
        </div>
        <Btn onClick={onNext}>{last ? 'Voir mes résultats →' : 'Continuer →'}</Btn>
      </div>
    </div>
  )
}

function Wrap({ children, onNext, canNext = true, nextLabel = 'Continuer →' }: { children: React.ReactNode, onNext?: () => void, canNext?: boolean, nextLabel?: string }) {
  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 700, margin: '0 auto' }}>
      {children}
      {onNext && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '10px 16px 18px', background: 'var(--bg)', borderTop: '0.5px solid var(--border)' }}>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <Btn onClick={onNext} disabled={!canNext}>{nextLabel}</Btn>
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
  const { id } = useParams<{ id: string }>()
  const { lang } = useLanguage()
  const [userId, setUserId] = useState<string | null>(null)
  const [moduleTitle, setModuleTitle] = useState('')
  const [loading, setLoading] = useState(true)

  // Learning state
  const [introSeen, setIntroSeen] = useState(false)
  const [moduleData, setModuleData] = useState<{titre:string,description:string,description_en:string,video_url:string|null}|null>(null)
  const [step, setStep] = useState(0)
  const [celebration, setCelebration] = useState<typeof PHASE_CELEBRATIONS[0] | null>(null)
  const [catStep, setCatStep] = useState(0)
  const [dogAnswer, setDogAnswer] = useState<boolean | null>(null)
  const [expertStep, setExpertStep] = useState(0)
  const [marbles, setMarbles] = useState<string[]>([])
  const [wordChoice, setWordChoice] = useState<number | null>(null)
  const [rabbitCtx, setRabbitCtx] = useState<number | null>(null)
  const [gptReveal, setGptReveal] = useState(0)

  // Quiz state
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
      supabase.from('modules').select('titre,description,description_en,video_url').eq('id', id as string).single().then(({ data }) => {
        if (data) { setModuleTitle(data.titre); setModuleData(data) }
        setLoading(false)
      })
    })
  }, [id])

  const next = () => {
    const nextStep = step + 1
    const cel = PHASE_CELEBRATIONS.find(c => c.atStep === nextStep)
    if (cel) { setCelebration(cel) } else { setStep(nextStep) }
  }
  const closeCelebration = () => {
    if (celebration) { setStep(celebration.atStep); setCelebration(null) }
  }

  const qIdx = step - TOTAL_LEARNING
  const isQuiz = step >= TOTAL_LEARNING && step < TOTAL_LEARNING + QUIZ.length
  const isResult = step >= TOTAL_LEARNING + QUIZ.length

  const phase = step < 2 ? 0 : step < 7 ? 0 : step < 12 ? 1 : step < 20 ? 2 : step < 28 ? 3 : step < 31 ? 4 : 5

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
        animateur_id: userId!, module_id: id,
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--bg)', borderBottom: '0.5px solid var(--border)' }}>
        <a href="/formation/modules" style={{ fontSize: 16, color: '#AFAFAF', fontWeight: 700, textDecoration: 'none', lineHeight: 1 }}>✕</a>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{moduleTitle}</span>
        <LanguageSwitch />
      </div>
      {!isResult && <ProgressBar step={step} phase={phase} />}
    </div>
  )

    // ── INTRO PAGE ───────────────────────────────────────────────────────────────
  if (!introSeen) {
    const videoUrl = moduleData?.video_url || null
    const desc = lang === 'en' ? (moduleData?.description_en || moduleData?.description || '') : (moduleData?.description || '')
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg3)' }}>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'white', borderBottom: '1px solid #E5E5E5', position: 'sticky', top: 0, zIndex: 20 }}>
          <a href="/formation/modules" style={{ fontSize: 16, color: '#AFAFAF', fontWeight: 700, textDecoration: 'none' }}>{"✕"}</a>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#555', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{moduleTitle}</span>
          <LanguageSwitch />
        </div>
        <div style={{ padding: '24px 16px 110px', maxWidth: 700, margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
          {videoUrl && (
            <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 20, background: '#000', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
              <video controls style={{ width: '100%', display: 'block', maxHeight: 320 }} preload="metadata">
                <source src={videoUrl} type="video/mp4"/>
              </video>
            </div>
          )}
          <div style={{ background: 'white', borderRadius: 16, padding: '20px', border: '1.5px solid #E5E5E5', marginBottom: 14 }}>
            <div style={{ display: 'inline-block', background: '#EEEDFE', color: '#3C3489', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, marginBottom: 12, textTransform: 'uppercase' as const, letterSpacing: 1 }}>
              Module de formation
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a2e', marginBottom: 10, lineHeight: 1.3 }}>{moduleTitle}</h1>
            {desc && <p style={{ fontSize: 14, color: '#555', lineHeight: 1.75, margin: 0 }}>{desc}</p>}
          </div>
          <div style={{ background: 'white', borderRadius: 16, padding: '18px', border: '1.5px solid #E5E5E5', marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#1a1a2e', marginBottom: 12 }}>{"🎯 Objectifs du module"}</div>
            {[
              ['💻', "Comprendre l'informatique traditionnelle et son principe déterministe"],
              ['🧪', 'Découvrir les systèmes experts et leurs 3 composants clés'],
              ['🔗', 'Comprendre comment les réseaux de neurones apprennent à partir de données'],
              ['✨', 'Maîtriser les LLM : tokens, vecteurs, attention et probabilités'],
              ['🤖', 'Explorer les agents IA et les world models'],
            ].map(([icon, text], i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                <span style={{ fontSize: 13, color: '#444', lineHeight: 1.55 }}>{text}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[['📖', '31', 'étapes'], ['❓', '20', 'questions'], ['⏱️', '~20', 'min']].map(([icon, val, label]) => (
              <div key={label} style={{ background: 'white', borderRadius: 12, padding: '14px', textAlign: 'center', border: '1.5px solid #E5E5E5' }}>
                <div style={{ fontSize: 22 }}>{icon}</div>
                <div style={{ fontWeight: 900, fontSize: 20, color: '#1a1a2e', marginTop: 4 }}>{val}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#D7FFB8', borderRadius: 14, padding: '14px 16px', border: '2px solid #58CC02' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#2B7400', marginBottom: 4 }}>{"🏆 Badge MAÎTRISE IA"}</div>
            <div style={{ fontSize: 12, color: '#1A5200', lineHeight: 1.55 }}>{"Obtiens 20/20 au quiz pour débloquer le badge — visible sur ton profil dans l'annuaire."}</div>
          </div>
        </div>
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px 24px', background: 'white', borderTop: '1px solid #E5E5E5' }}>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <Btn onClick={() => setIntroSeen(true)}>{"Commencer le module →"}</Btn>
          </div>
        </div>
      </div>
    )
  }

  // ── QUIZ ────────────────────────────────────────────────────────────────────
  if (isQuiz) {
    const q = QUIZ[qIdx]
    const ua = answers[qIdx]
    const labels = ['A','B','C','D']
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg3)' }}>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
        {celebration && <CelebrationModal data={celebration} onContinue={closeCelebration}/>}
        {header}
        <div style={{ padding: '20px 16px 120px', maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 12 }}>Question {qIdx + 1} / {QUIZ.length} &nbsp;·&nbsp; ✓ {score}</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.5, marginBottom: 20 }}>{q.q}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.opts.map((opt, i) => {
              const sel = ua === i, cor = i === q.correct, shown = ua !== null
              return (
                <button key={i} onClick={() => pickAnswer(i)} disabled={shown} style={{
                  display: 'flex', gap: 14, alignItems: 'center', padding: '16px 18px', borderRadius: 14,
                  border: `2.5px solid ${!shown ? '#E5E5E5' : cor ? '#58CC02' : sel ? '#FF4B4B' : '#E5E5E5'}`,
                  background: !shown ? 'white' : cor ? '#D7FFB8' : sel ? '#FFDFE0' : 'white',
                  cursor: shown ? 'default' : 'pointer', textAlign: 'left', animation: 'fadeIn .2s ease',
                  transition: 'border-color .15s, background .15s', width: '100%',
                }}>
                  <span style={{ minWidth: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0, background: !shown ? '#F0F0F0' : cor ? '#58CC02' : sel ? '#FF4B4B' : '#F0F0F0', color: !shown ? '#888' : (cor || sel) ? 'white' : '#888', transition: 'all .15s' }}>{!shown ? labels[i] : cor ? '✓' : sel ? '✗' : labels[i]}</span>
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

  // ── RESULT ──────────────────────────────────────────────────────────────────
  if (isResult) {
    const total = answers.filter((a, i) => a === QUIZ[i].correct).length
    const perfect = total === QUIZ.length
    const pct = Math.round((total / QUIZ.length) * 100)
    const wrongs = answers.map((a, i) => a !== QUIZ[i].correct ? i : -1).filter(x => x >= 0)
    const restart = () => { setStep(TOTAL_LEARNING); setAnswers(Array(QUIZ.length).fill(null)); setScore(0); setShowFb(false); setFeedback(null); setSaved(false) }
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg3)' }}>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} @keyframes pcbGlow{0%,100%{filter:drop-shadow(0 0 6px #00B86B) drop-shadow(0 0 12px #003A8C)}50%{filter:drop-shadow(0 0 14px #00B86B) drop-shadow(0 0 28px #0066CC)}}`}</style>
        {celebration && <CelebrationModal data={celebration} onContinue={closeCelebration}/>}
        {header}
        <div style={{ padding: '24px 16px 40px', maxWidth: 700, margin: '0 auto' }}>
          {perfect ? (
            <div style={{ textAlign: 'center', marginBottom: 24, animation: 'fadeIn .5s ease' }}>
              <div style={{ marginBottom: 12 }}><AIChipBadge size={96} /></div>
              <div style={{ display: 'inline-block', background: 'var(--accent)', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20, marginBottom: 8, letterSpacing: 1 }}>BADGE DÉBLOQUÉ ✦</div>
              <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>MAÎTRISE IA 🧠</h2>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent)', marginBottom: 8 }}>20 / 20 — 100 %</div>
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>Parfait ! Tu maîtrises les fondamentaux des 4 âges de l'IA.</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>{pct >= 80 ? '🎯' : '💪'}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent)', marginBottom: 8 }}>{total} / {QUIZ.length}</div>
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{pct >= 80 ? 'Beau parcours ! Quelques notions méritent encore un peu d\'entraînement.' : pct >= 60 ? 'Bon début ! Revois les questions manquées pour progresser.' : 'Continue à apprendre ! Le module t\'attend pour une révision.'}</p>
            </div>
          )}
          {wrongs.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>Questions manquées :</div>
              {wrongs.map(i => (
                <div key={i} style={{ padding: 12, background: '#FAECE7', borderRadius: 10, border: '0.5px solid #F0997B', marginBottom: 8, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Q{i+1}. {QUIZ[i].q.substring(0, 70)}…</div>
                  <div style={{ color: '#085041' }}>✓ {QUIZ[i].opts[QUIZ[i].correct]}</div>
                  {answers[i] !== null && <div style={{ color: '#993C1D', marginTop: 2 }}>✗ {QUIZ[i].opts[answers[i]!]}</div>}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Btn onClick={restart}>Refaire le quiz</Btn>
            <Btn variant="secondary" onClick={() => window.location.href = '/formation/modules'}>← Retour aux modules</Btn>
          </div>
        </div>
      </div>
    )
  }

  // ── LEARNING STEPS ──────────────────────────────────────────────────────────
  const s = step
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg3)' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {header}

      {/* STEP 0 — Cover */}
      {s === 0 && <Wrap onNext={next} nextLabel="Commencer →">
        <div style={{ textAlign: 'center', padding: '12px 0', animation: 'fadeIn .4s ease' }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>💡</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10, lineHeight: 1.3 }}>Sans technologie,<br/>pas d'intelligence artificielle.</h1>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 20 }}>Comment sommes-nous passés d'ordinateurs auxquels il fallait expliquer précisément quoi faire à des IA capables de dialoguer, créer et générer ?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            {[['💻','Informatique traditionnelle'],['🧪','Systèmes experts'],['🔗','Réseaux de neurones'],['✨','IA générative'],['🤖','Et maintenant ?']].map(([icon,label],i)=>(
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: 'var(--bg)', borderRadius: 12, width: '100%', maxWidth: 280, border: '0.5px solid var(--border)' }}>
                <span style={{ fontSize: 18 }}>{icon}</span><span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text3)' }}>Ces technologies coexistent et se combinent. Ce n'est pas une histoire linéaire.</p>
        </div>
      </Wrap>}

      {/* STEP 1 — Traditional computing intro */}
      {s === 1 && <Wrap onNext={next}>
        <Tag color="var(--accent-bg)"><span style={{ color: 'var(--accent-text)' }}>💻 ÂGE 1 — Informatique traditionnelle</span></Tag>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>« Dis-moi exactement quoi faire. »</h2>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 16 }}>Dans l'informatique traditionnelle, <strong>l'humain écrit les instructions</strong>. La machine les exécute fidèlement.</p>
        <div style={{ background: 'var(--bg2)', borderRadius: 12, padding: 14, marginBottom: 14, fontFamily: 'monospace', fontSize: 15, fontWeight: 600 }}>SI [condition] → ALORS [action]</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>Dès 1890, IBM se développait grâce aux machines à cartes perforées — trier, classer, gérer de grandes quantités d'information. Une informatique de <strong>traitement déterministe</strong>.</p>
      </Wrap>}

      {/* STEP 2 — Cat decision tree */}
      {s === 2 && <Wrap onNext={catStep >= 3 ? next : undefined} canNext={catStep >= 3} nextLabel="Suite →">
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 6 }}>🐱</div>
          <h3 style={{ fontSize: 17, fontWeight: 700 }}>Comment classer cet animal ?</h3>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Un système traditionnel construit un arbre de décision</p>
        </div>
        {/* Question courante */}
        {catStep < 3 && (
          <div style={{ padding: '18px 16px', background: 'var(--accent-bg)', borderRadius: 14, marginBottom: 14, textAlign: 'center', border: '2px solid var(--accent)' }}>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>Question {catStep + 1} / 3</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--accent-text)' }}>
              {['A-t-il des poils ?', 'A-t-il des oreilles ?', 'A-t-il une queue ?'][catStep]}
            </div>
          </div>
        )}
        {/* Réponses déjà données */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {[['A-t-il des poils ?','🔸'],['A-t-il des oreilles ?','🔸'],['A-t-il une queue ?','🔸'],['🐱 CHAT !','✅']].map(([q,icon],i)=> i < catStep || (catStep >= 3 && i === 3) ? (
            <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: i===3?'#E1F5EE':'var(--bg2)', border: `1.5px solid ${i===3?'#5DCAA5':'var(--border)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeIn .3s ease' }}>
              <span style={{ fontSize: i===3?15:13, fontWeight: i===3?700:500 }}>{q}</span>
              <span style={{ fontSize: 14 }}>{i < 3 ? '✓ OUI' : icon}</span>
            </div>
          ) : null)}
        </div>
        {catStep < 3 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Btn onClick={()=>setCatStep(s=>s+1)}>OUI 👍</Btn>
            <Btn variant="secondary" onClick={()=>setCatStep(s=>s+1)}>NON 👎</Btn>
          </div>
        )}
        {catStep >= 3 && <div style={{ marginTop: 10, padding: 12, background: 'var(--accent-bg)', borderRadius: 10, fontSize: 13, color: 'var(--accent-text)' }}>💡 L'idée fondamentale : <strong>les règles ont été définies à l'avance par des humains.</strong></div>}
      </Wrap>}

      {/* STEP 3 — Binary */}
      {s === 3 && <Wrap onNext={next}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#1a1a2e' }}>Le 0 et le 1 — fondement du calcul</h3>
        <p style={{ fontSize: 13, color: '#666', lineHeight: 1.65, marginBottom: 14 }}>Tous les ordinateurs fonctionnent en binaire. À l'échelle des circuits électroniques, tout est soit <strong>1</strong> (le courant passe) soit <strong>0</strong> (le courant ne passe pas).</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
          {[['0','Le courant ne passe pas','🔴 Circuit ouvert','#1a1a18','white','#9CA3AF'],['1','Le courant passe','🟢 Circuit fermé','var(--accent)','white','#CECBF6']].map(([n,d,e,bg,c,dc],i)=>(
            <div key={i} style={{ flex: 1, textAlign: 'center', padding: '18px 14px', background: bg, color: c, borderRadius: 14, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <div style={{ fontSize: 44, fontWeight: 900 }}>{n}</div>
              <div style={{ fontSize: 16, margin: '6px 0' }}>{e}</div>
              <div style={{ fontSize: 12, color: dc, lineHeight: 1.4 }}>{d}</div>
            </div>
          ))}
        </div>
        {/* Lien avec l'arbre de décision */}
        <div style={{ background: '#E6F1FB', borderRadius: 14, padding: '14px 16px', marginBottom: 12, border: '1.5px solid #85B7EB' }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#0C447C', marginBottom: 8 }}>🔗 Le lien avec l'arbre de décision</div>
          <p style={{ fontSize: 13, color: '#0C447C', lineHeight: 1.7, margin: 0 }}>
            Dans un arbre de décision, chaque condition donne une réponse <strong>OUI ou NON</strong>. Au niveau des circuits électroniques, ce OUI/NON se traduit directement en binaire :
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <div style={{ flex: 1, padding: '10px 12px', background: 'white', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#2B7400', marginBottom: 4 }}>OUI ✓</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent)' }}>= 1</div>
              <div style={{ fontSize: 11, color: '#0C447C', marginTop: 4 }}>courant passe<br/>circuit fermé</div>
            </div>
            <div style={{ flex: 1, padding: '10px 12px', background: 'white', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#CC0000', marginBottom: 4 }}>NON ✗</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#1a1a2e' }}>= 0</div>
              <div style={{ fontSize: 11, color: '#0C447C', marginTop: 4 }}>courant ne passe pas<br/>circuit ouvert</div>
            </div>
          </div>
        </div>
        {/* La nuance importante */}
        <div style={{ background: '#FFF9E6', borderRadius: 14, padding: '14px 16px', border: '1.5px solid #FFC800' }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#8B5E00', marginBottom: 8 }}>⚡ La nuance importante</div>
          <p style={{ fontSize: 13, color: '#8B5E00', lineHeight: 1.7, margin: 0 }}>
            Le binaire (0/1) est le <strong>niveau matériel</strong> — la langue des circuits électroniques. L'arbre de décision (OUI/NON) est le <strong>niveau logique</strong> — la structure du programme. Les deux sont liés, mais distincts : un programme peut avoir des dizaines de choix possibles (pas seulement oui/non), tous représentés en binaire dans les circuits. Le 0 et le 1 sont le <em>substrat</em>, pas la structure du raisonnement.
          </p>
        </div>
      </Wrap>}

      {/* STEP 4 — Dog challenge */}
      {s === 4 && <Wrap onNext={dogAnswer!==null?next:undefined} canNext={dogAnswer!==null}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🐶</div>
          <h3 style={{ fontSize: 17, fontWeight: 700 }}>Mini-défi</h3>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 8, lineHeight: 1.6 }}>On vient de construire un système pour reconnaître un chat. Si on lui présente un chien — <strong>fonctionne-t-il automatiquement ?</strong></p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {['Oui, forcément 😎','Pas forcément 🤔'].map((opt,i)=>(
            <button key={i} onClick={()=>setDogAnswer(i===1)} style={{ flex:1, padding:'14px 10px', borderRadius:12, border:`2px solid ${dogAnswer===(i===1)?'var(--accent)':'var(--border)'}`, background:dogAnswer===(i===1)?'var(--accent-bg)':'var(--bg)', cursor:'pointer', fontWeight:600, fontSize:13, color:'var(--text)' }}>{opt}</button>
          ))}
        </div>
        {dogAnswer!==null && <div style={{ marginTop:14, padding:14, background:'#E1F5EE', borderRadius:12, fontSize:13, lineHeight:1.6, color:'#085041' }}><strong>✓ Bien vu !</strong> Si une nouvelle situation n'a pas été anticipée par les règles, le système peut échouer. Les règles doivent être adaptées.</div>}
      </Wrap>}

      {/* STEP 5 — Advantages/limits */}
      {s === 5 && <Wrap onNext={next}>
        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14, textAlign: 'center' }}>À retenir</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ padding:14, background:'#E1F5EE', borderRadius:12, border:'1.5px solid #5DCAA5' }}>
            <div style={{ fontSize:24, marginBottom:6 }}>👍</div>
            <div style={{ fontWeight:700, fontSize:13, color:'#085041', marginBottom:4 }}>AVANTAGE</div>
            <div style={{ fontWeight:600, fontSize:15, color:'#085041', marginBottom:6 }}>Traçabilité</div>
            <div style={{ fontSize:12, color:'#0a6050', lineHeight:1.5 }}>Les règles sont explicites. On peut retracer le chemin ayant conduit au résultat.</div>
          </div>
          <div style={{ padding:14, background:'#FAECE7', borderRadius:12, border:'1.5px solid #F0997B' }}>
            <div style={{ fontSize:24, marginBottom:6 }}>⚠️</div>
            <div style={{ fontWeight:700, fontSize:13, color:'#993C1D', marginBottom:4 }}>LIMITE</div>
            <div style={{ fontWeight:600, fontSize:15, color:'#993C1D', marginBottom:6 }}>Complexité</div>
            <div style={{ fontSize:12, color:'#7a2e10', lineHeight:1.5 }}>Plus les situations se multiplient, plus écrire et maintenir toutes les règles devient difficile.</div>
          </div>
        </div>
      </Wrap>}

      {/* STEP 6 — Transition to expert systems */}
      {s === 6 && <Wrap onNext={next} nextLabel="Découvrir le 2e âge →">
        <div style={{ textAlign:'center', padding:'20px 0', animation:'fadeIn .4s ease' }}>
          <div style={{ fontSize:36, marginBottom:14 }}>💭</div>
          <h3 style={{ fontSize:20, fontWeight:800, marginBottom:10 }}>Et si on mettait directement l'expertise humaine dans la machine ?</h3>
          <p style={{ fontSize:14, color:'var(--text2)', lineHeight:1.7 }}>Plutôt que de programmer toutes les situations possibles, que se passerait-il si on formalisait le raisonnement d'un expert ?</p>
        </div>
      </Wrap>}

      {/* STEP 7 — Expert systems intro */}
      {s === 7 && <Wrap onNext={next}>
        <Tag color="#FAEEDA"><span style={{ color:'#633806' }}>🧪 ÂGE 2 — Années 1970-1980</span></Tag>
        <h2 style={{ fontSize:22, fontWeight:800, marginBottom:10 }}>« Mettons l'expert dans la machine. »</h2>
        <p style={{ fontSize:14, color:'var(--text2)', lineHeight:1.7 }}>Un <strong>ingénieur de la connaissance</strong> rencontre un spécialiste — médecin, ingénieur, technicien — et transforme son expertise en connaissances exploitables par un ordinateur.</p>
      </Wrap>}

      {/* STEP 8 — Expert system builder */}
      {s === 8 && <Wrap onNext={expertStep>=3?next:undefined} canNext={expertStep>=3}>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>🎮 Construis le système expert</h3>
        <p style={{ fontSize:12, color:'var(--text2)', marginBottom:14 }}>Clique pour découvrir chaque composant</p>
        {[{title:'BASE DE RÈGLES',icon:'📋',body:'SI A + B → ALORS C · Les connaissances de l\'expert sous forme de règles.',bg:'#E6F1FB',tc:'#0C447C',bc:'#85B7EB'},
          {title:'BASE DE FAITS',icon:'📊',body:'Les informations sur la situation actuelle : résultats d\'analyses, observations, données.',bg:'#FAEEDA',tc:'#633806',bc:'#EF9F27'},
          {title:'MOTEUR D\'INFÉRENCE',icon:'⚙️',body:'Applique les règles aux faits disponibles pour déduire une conclusion.',bg:'#E1F5EE',tc:'#085041',bc:'#5DCAA5'}
        ].map((c,i)=>(
          <div key={i} style={{ marginBottom:10 }}>
            {expertStep>i ? (
              <div style={{ padding:14, borderRadius:12, background:c.bg, border:`1.5px solid ${c.bc}`, animation:'fadeIn .3s ease' }}>
                <div style={{ fontWeight:700, fontSize:12, color:c.tc, marginBottom:4 }}>{c.icon} {c.title}</div>
                <div style={{ fontSize:13, color:c.tc, lineHeight:1.5 }}>{c.body}</div>
              </div>
            ) : (
              <button onClick={()=>setExpertStep(s=>s+1)} style={{ width:'100%', padding:'14px', borderRadius:12, background:'var(--bg2)', border:'2px dashed var(--border)', cursor:'pointer', color:'var(--text2)', fontSize:13, fontWeight:500 }}>
                {['① Révéler la base de règles','② Révéler la base de faits','③ Révéler le moteur d\'inférence'][i]}
              </button>
            )}
          </div>
        ))}
        {expertStep>=3 && <div style={{ textAlign:'center', padding:10, background:'var(--bg2)', borderRadius:10, fontSize:12, fontWeight:600 }}>FAITS + RÈGLES ⚙️ MOTEUR → CONCLUSION</div>}
      </Wrap>}

      {/* STEP 9 — Algorithm recipe */}
      {s === 9 && <Wrap onNext={next}>
        <div style={{ textAlign:'center', marginBottom:16 }}><div style={{ fontSize:44 }}>🍳</div></div>
        <h3 style={{ fontSize:17, fontWeight:700, marginBottom:10 }}>L'algorithme, c'est comme une recette</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div style={{ padding:12, background:'var(--bg2)', borderRadius:12, textAlign:'center' }}>
            <div style={{ fontSize:22 }}>📖</div>
            <div style={{ fontWeight:600, fontSize:12, marginTop:4 }}>RECETTE</div>
            <div style={{ fontSize:11, color:'var(--text2)', marginTop:4 }}>Ingrédients + instructions → plat</div>
          </div>
          <div style={{ padding:12, background:'var(--accent-bg)', borderRadius:12, textAlign:'center' }}>
            <div style={{ fontSize:22 }}>💻</div>
            <div style={{ fontWeight:600, fontSize:12, marginTop:4, color:'var(--accent-text)' }}>ALGORITHME</div>
            <div style={{ fontSize:11, color:'var(--accent-text)', marginTop:4 }}>Données + instructions → résultat</div>
          </div>
        </div>
        <div style={{ padding:12, background:'var(--bg2)', borderRadius:10, fontSize:12, color:'var(--text2)' }}>⚠️ C'est une analogie. Un algorithme est une <strong>procédure structurée pour résoudre un problème</strong>, pas littéralement une recette.</div>
      </Wrap>}

      {/* STEP 10 — Deep Blue */}
      {s === 10 && <Wrap onNext={next}>
        <div style={{ textAlign:'center', padding:'10px 0' }}>
          <div style={{ fontSize:44, marginBottom:6 }}>♟️</div>
          <h3 style={{ fontSize:20, fontWeight:800 }}>Deep Blue vs Kasparov</h3>
          <div style={{ fontSize:22, fontWeight:300, color:'var(--text3)', margin:'4px 0' }}>1997</div>
          <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6, marginBottom:16 }}>Deep Blue bat le champion du monde d'échecs. Ce n'était pas un système expert classique — il combinait recherche dans l'arbre des coups, fonctions d'évaluation et matériel spécialisé.</p>
          <div style={{ display:'flex', gap:10, marginBottom:14 }}>
            <div style={{ flex:1, padding:12, background:'#E1F5EE', borderRadius:12, textAlign:'center' }}>
              <div style={{ fontWeight:700, fontSize:12, color:'#085041' }}>Deep Blue aux échecs</div>
              <div style={{ fontSize:18, margin:'4px 0' }}>⭐⭐⭐⭐⭐</div>
            </div>
            <div style={{ flex:1, padding:12, background:'#FAECE7', borderRadius:12, textAlign:'center' }}>
              <div style={{ fontWeight:700, fontSize:12, color:'#993C1D' }}>Deep Blue 🥞 crêpes</div>
              <div style={{ fontSize:14, margin:'6px 0', fontWeight:600, color:'#993C1D' }}>❌ Aucune compétence</div>
            </div>
          </div>
          <div style={{ padding:12, background:'var(--bg2)', borderRadius:12, fontSize:13, fontWeight:600, lineHeight:1.5 }}>Une machine peut être extraordinaire dans un domaine précis <em>sans</em> savoir faire autre chose.</div>
        </div>
      </Wrap>}

      {/* STEP 11 — Transition to neural networks */}
      {s === 11 && <Wrap onNext={next} nextLabel="Découvrir les réseaux →">
        <div style={{ textAlign:'center', padding:'20px 0', animation:'fadeIn .4s ease' }}>
          <div style={{ fontSize:36, marginBottom:14 }}>🤔</div>
          <h3 style={{ fontSize:20, fontWeight:800, marginBottom:10 }}>Et si nous arrêtions de donner toutes les règles à la machine ?</h3>
          <p style={{ fontSize:16, color:'var(--accent)', fontWeight:700 }}>Et si elle pouvait apprendre ?</p>
        </div>
      </Wrap>}

      {/* STEP 12 — Neural networks intro + timeline */}
      {s === 12 && <Wrap onNext={next}>
        <Tag color="#E6F1FB"><span style={{ color:'#0C447C' }}>🔗 ÂGE 3 — Réseaux de neurones</span></Tag>
        <h2 style={{ fontSize:22, fontWeight:800, marginBottom:14 }}>« Et si la machine apprenait ? »</h2>
        {[{y:'1943',t:'McCulloch & Pitts : premier modèle mathématique du neurone'},{y:'1956',t:'Atelier de Dartmouth — le champ de l\'IA se structure'},{y:'1957-58',t:'Rosenblatt développe le perceptron'},{y:'Ensuite…',t:'Développement progressif des réseaux neuronaux jusqu\'à aujourd\'hui'}].map(({y,t},i)=>(
          <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:10 }}>
            <div style={{ minWidth:56, padding:'3px 6px', background:'var(--accent-bg)', color:'var(--accent-text)', borderRadius:8, fontSize:10, fontWeight:700, textAlign:'center' }}>{y}</div>
            <div style={{ fontSize:13, color:'var(--text)', paddingTop:3, lineHeight:1.5 }}>{t}</div>
          </div>
        ))}
      </Wrap>}

      {/* STEP 13 — Brain vs network */}
      {s === 13 && <Wrap onNext={next}>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14, textAlign:'center' }}>Cerveau vs Réseau artificiel</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div style={{ padding:14, background:'var(--bg2)', borderRadius:12, textAlign:'center' }}><div style={{ fontSize:34, marginBottom:6 }}>🧠</div><div style={{ fontWeight:600, fontSize:12 }}>CERVEAU</div><div style={{ fontSize:11, color:'var(--text2)', marginTop:4, lineHeight:1.5 }}>Neurones biologiques + synapses</div></div>
          <div style={{ padding:14, background:'var(--accent-bg)', borderRadius:12, textAlign:'center' }}><div style={{ fontSize:34, marginBottom:6 }}>🔗</div><div style={{ fontWeight:600, fontSize:12, color:'var(--accent-text)' }}>RÉSEAU ARTIFICIEL</div><div style={{ fontSize:11, color:'var(--accent-text)', marginTop:4, lineHeight:1.5 }}>Unités mathématiques + connexions pondérées</div></div>
        </div>
        <div style={{ padding:14, background:'#FAECE7', borderRadius:12, border:'1.5px solid #F0997B', fontSize:13, lineHeight:1.6 }}>⚠️ <strong>Un réseau de neurones artificiels n'est PAS un cerveau miniature.</strong> C'est une architecture mathématique librement inspirée de certaines idées biologiques.</div>
      </Wrap>}

      {/* STEP 14 — Layers and weights */}
      {s === 14 && <Wrap onNext={next}>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Couches et poids</h3>
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:6, marginBottom:18, flexWrap:'wrap' }}>
          {['ENTRÉE','●●','●●','●●','SORTIE'].map((l,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
              {i>0&&<div style={{ color:'var(--text3)', fontSize:16 }}>→</div>}
              <div style={{ padding:'8px 6px', background:i===0||i===4?'var(--accent)':'var(--bg2)', color:i===0||i===4?'white':'var(--text)', borderRadius:8, fontSize:11, fontWeight:600, minWidth:40, textAlign:'center' }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:14, background:'var(--bg2)', borderRadius:12 }}>
          <div style={{ fontSize:28 }}>🎚️</div>
          <div><div style={{ fontWeight:600, fontSize:14 }}>Les poids = boutons de réglage</div><div style={{ fontSize:13, color:'var(--text2)', marginTop:4, lineHeight:1.5 }}>Certains signaux ont plus d'influence. <strong>L'apprentissage ajuste ces poids</strong> pour réduire les erreurs.</div></div>
        </div>
      </Wrap>}

      {/* STEP 15 — Cat learning */}
      {s === 15 && <Wrap onNext={next}>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>🎮 Apprenons à reconnaître un chat</h3>
        <p style={{ fontSize:12, color:'var(--text2)', marginBottom:14 }}>Le réseau fait des erreurs au début… puis il apprend !</p>
        {[{p:'CAMION',pct:72,ok:false},{p:'CHIEN',pct:58,ok:false},{p:'FÉLIN 🟠',pct:84,ok:false},{p:'CHAT ✅',pct:96,ok:true}].map((a,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:a.ok?'#E1F5EE':'var(--bg2)', border:`1.5px solid ${a.ok?'#5DCAA5':'var(--border)'}`, borderRadius:10, marginBottom:8, animation:'fadeIn .3s ease' }}>
            <span style={{ fontSize:18 }}>🐱</span>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:13, fontWeight:600 }}>→ {a.p}</span>
                <span style={{ fontSize:11, color:'var(--text2)' }}>{a.pct}%</span>
              </div>
              <div style={{ height:4, background:'var(--bg3)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ width:`${a.pct}%`, height:'100%', background:a.ok?'#5DCAA5':'var(--accent)', borderRadius:2 }}/>
              </div>
            </div>
            <span style={{ fontSize:14 }}>{a.ok?'✅':'❌'}</span>
          </div>
        ))}
        <div style={{ padding:10, background:'var(--accent-bg)', borderRadius:10, fontSize:12, color:'var(--accent-text)', marginTop:4 }}>IMAGE → PRÉDICTION → ERREUR → AJUSTEMENT → RECOMMENCER. Des millions de fois.</div>
      </Wrap>}

      {/* STEP 16 — Generalization */}
      {s === 16 && <Wrap onNext={next}>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>La généralisation</h3>
        <p style={{ fontSize:14, color:'var(--text2)', marginBottom:14, lineHeight:1.6 }}>L'objectif n'est pas de reconnaître uniquement les images déjà vues. Le modèle doit <strong>généraliser à de nouvelles situations</strong>.</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[['🐈','Chat noir'],['🐈‍⬛','Chat de nuit'],['🐱','Chat de côté'],['😺','Chat stylisé']].map(([icon,label],i)=>(
            <div key={i} style={{ padding:'12px', background:'#E1F5EE', border:'1.5px solid #5DCAA5', borderRadius:10, textAlign:'center' }}>
              <div style={{ fontSize:26 }}>{icon}</div>
              <div style={{ fontSize:11, color:'#085041', marginTop:3 }}>{label}</div>
              <div style={{ fontSize:11, color:'#5DCAA5', fontWeight:700, marginTop:2 }}>CHAT ✓</div>
            </div>
          ))}
        </div>
      </Wrap>}

      {/* STEP 17 — Big comparison */}
      {s === 17 && <Wrap onNext={next}>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14, textAlign:'center' }}>Le grand changement</h3>
        <div style={{ padding:14, background:'var(--bg2)', borderRadius:12, marginBottom:10 }}>
          <div style={{ fontWeight:700, fontSize:12, color:'var(--text2)', marginBottom:8 }}>💻 INFORMATIQUE TRADITIONNELLE</div>
          <div style={{ fontSize:13 }}>👨‍💻 L'humain écrit les règles → 💻 La machine les applique</div>
        </div>
        <div style={{ textAlign:'center', fontSize:20, margin:'4px 0' }}>⚡</div>
        <div style={{ padding:14, background:'var(--accent-bg)', borderRadius:12, border:'1.5px solid var(--accent)' }}>
          <div style={{ fontWeight:700, fontSize:12, color:'var(--accent-text)', marginBottom:8 }}>🔗 MACHINE LEARNING</div>
          <div style={{ fontSize:13, color:'var(--accent-text)' }}>👨‍💻 Données + objectif → 🧠 Le réseau <strong>apprend ses propres paramètres</strong></div>
        </div>
      </Wrap>}

      {/* STEP 18 — Black box */}
      {s === 18 && <Wrap onNext={next}>
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <div style={{ display:'inline-block', background:'#E1F5EE', padding:'10px 20px', borderRadius:12, marginBottom:12 }}><span style={{ fontSize:14, fontWeight:700, color:'#085041' }}>✨ LA CAPACITÉ D'APPRENDRE</span></div>
          <div style={{ fontSize:20, color:'#993C1D', fontWeight:700, marginBottom:8 }}>…mais une difficulté apparaît.</div>
          <div style={{ display:'inline-block', background:'#FAECE7', padding:'10px 20px', borderRadius:12, marginBottom:14 }}><span style={{ fontSize:14, fontWeight:700, color:'#993C1D' }}>🔲 L'EXPLICABILITÉ</span></div>
        </div>
        <div style={{ padding:12, background:'var(--bg2)', borderRadius:12, fontSize:13, lineHeight:1.6 }}>
          <div style={{ padding:10, background:'var(--bg)', borderRadius:8, marginBottom:10 }}>
            <div style={{ fontStyle:'italic' }}>« Pourquoi ma candidature a-t-elle été rejetée ? »</div>
            <div style={{ color:'var(--text3)', fontSize:11, marginTop:4 }}>Réponse : « Parce que le paramètre X28 vaut 0,728. »</div>
            <div style={{ color:'#993C1D', fontWeight:600, fontSize:11, marginTop:3 }}>❌ Pas une explication satisfaisante.</div>
          </div>
          Un grand réseau peut avoir des milliards de paramètres interconnectés. Traduire une décision en règles compréhensibles est très difficile. C'est pourquoi il existe un domaine entier consacré à l'<strong>explicabilité de l'IA</strong>.
        </div>
      </Wrap>}

      {/* STEP 19 — Generative AI acceleration */}
      {s === 19 && <Wrap onNext={next} nextLabel="Découvrir l'IA générative →">
        <div style={{ textAlign:'center', padding:'10px 0', animation:'fadeIn .4s ease' }}>
          {[['🌐','Internet'],['📚','Données massives'],['⚡','Puissance de calcul / GPU'],['🔀','Transformer (2017)'],['✨','IA GÉNÉRATIVE']].map(([icon,label],i)=>(
            <div key={i}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 16px', background:i===4?'var(--accent)':'var(--bg2)', borderRadius:10, color:i===4?'white':'var(--text)', marginBottom:4 }}>
                <span style={{ fontSize:16 }}>{icon}</span><span style={{ fontSize:13, fontWeight:i===4?700:400 }}>{label}</span>
              </div>
              {i<4&&<div style={{ color:'var(--text3)', fontSize:16, margin:'0 0 4px' }}>↓</div>}
            </div>
          ))}
        </div>
      </Wrap>}

      {/* STEP 20 — Gen AI intro */}
      {s === 20 && <Wrap onNext={next}>
        <Tag color="#FBEAF0"><span style={{ color:'#72243E' }}>✨ ÂGE 4 — IA Générative</span></Tag>
        <h2 style={{ fontSize:21, fontWeight:800, marginBottom:10 }}>La machine ne fait plus seulement reconnaître. Elle peut aussi <em>générer</em>.</h2>
        <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7, marginBottom:14 }}>L'IA générative existait avant ChatGPT. On se concentre ici sur les <strong>LLM — Large Language Models</strong> : de très grands réseaux entraînés sur d'immenses volumes de texte.</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[['🔤','TOKENS'],['📍','VECTEURS'],['👁️','ATTENTION'],['🎲','PROBABILITÉS']].map(([icon,label],i)=>(
            <div key={i} style={{ padding:'12px', background:'var(--bg2)', border:'1.5px dashed var(--border)', borderRadius:10, textAlign:'center' }}>
              <div style={{ fontSize:22, marginBottom:3 }}>{icon}</div><div style={{ fontSize:11, fontWeight:600, color:'var(--text2)' }}>{label}</div>
            </div>
          ))}
        </div>
      </Wrap>}

      {/* STEP 21 — Tokens */}
      {s === 21 && <Wrap onNext={next}>
        <h3 style={{ fontSize:17, fontWeight:700, marginBottom:4 }}>🔤 Les tokens</h3>
        <p style={{ fontSize:13, color:'var(--text2)', marginBottom:14 }}>Un token est l'unité élémentaire que le modèle manipule.</p>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, color:'var(--text2)', marginBottom:8 }}>La phrase « Bonjour le monde ! » devient :</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {['Bonjour',' le',' monde',' !'].map((t,i)=>(
              <div key={i} style={{ padding:'6px 12px', background:['var(--accent-bg)','#E1F5EE','#FAEEDA','#FAECE7'][i], color:['var(--accent-text)','#085041','#633806','#993C1D'][i], borderRadius:8, fontWeight:600, fontSize:14, fontFamily:'monospace' }}>{t}</div>
            ))}
          </div>
        </div>
        <div style={{ padding:12, background:'var(--bg2)', borderRadius:10, fontSize:13, lineHeight:1.6 }}>Un token peut être un mot, une partie de mot, un signe de ponctuation… Le modèle génère du texte <strong>token après token</strong>.</div>
      </Wrap>}

      {/* STEP 22 — Marble bag */}
      {s === 22 && <Wrap onNext={marbles.length>=6?next:undefined} canNext={marbles.length>=6}>
        <h3 style={{ fontSize:17, fontWeight:700, marginBottom:4 }}>🎲 Le sac de billes</h3>
        <p style={{ fontSize:12, color:'var(--text2)', marginBottom:14 }}>Pioche des billes pour comprendre les probabilités</p>
        <div style={{ textAlign:'center', padding:'18px', background:'var(--bg2)', borderRadius:14, marginBottom:14 }}>
          <div style={{ fontSize:44, marginBottom:6 }}>🎒</div>
          <div style={{ fontSize:12, color:'var(--text2)', marginBottom:10 }}>Billes rouges 🔴 et vertes 🟢 à l'intérieur</div>
          {marbles.length<6 ? (
            <Btn onClick={()=>setMarbles(m=>[...m,'🔴'])} full={false}>Piocher ({6-marbles.length} restantes)</Btn>
          ) : <div style={{ fontSize:13, fontWeight:600, color:'var(--accent)' }}>6 tirages effectués !</div>}
        </div>
        {marbles.length>0 && (
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:22, letterSpacing:4, marginBottom:8 }}>{marbles.join(' ')}</div>
            <div style={{ padding:10, background:'var(--bg2)', borderRadius:10, fontSize:13, lineHeight:1.6 }}>
              {marbles.length<6 ? 'Continue…' : `${marbles.filter(m=>m==='🔴').length} rouges sur 6 tirages. Ces observations modifient-elles ton estimation ? Oui ! C'est l'intuition de la probabilité conditionnelle.`}
            </div>
          </div>
        )}
        {marbles.length>=6 && <div style={{ padding:10, background:'var(--bg2)', borderRadius:10, fontSize:11, color:'var(--text3)' }}>💡 Analogie pédagogique — un LLM ne met évidemment pas ses tokens dans un sac !</div>}
      </Wrap>}

      {/* STEP 23 — Word prediction */}
      {s === 23 && <Wrap onNext={wordChoice!==null?next:undefined} canNext={wordChoice!==null}>
        <div style={{ textAlign:'center', marginBottom:18 }}>
          <h3 style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>Bonjour, comment ça…</h3>
          <p style={{ fontSize:13, color:'var(--text2)' }}>Quel token suit naturellement ?</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[{t:'🐘 éléphant',ok:false},{t:'👍 va',ok:true},{t:'💻 ordinateur',ok:false},{t:'🥫 mayonnaise',ok:false}].map((w,i)=>(
            <button key={i} onClick={()=>setWordChoice(i)} style={{
              padding:'14px 10px', borderRadius:12, fontWeight:600, fontSize:14, cursor:wordChoice===null?'pointer':'default',
              border:`2px solid ${wordChoice===null?'var(--border)':i===wordChoice&&w.ok?'#5DCAA5':i===wordChoice&&!w.ok?'#F0997B':w.ok&&wordChoice!==null?'#5DCAA5':'var(--border)'}`,
              background:wordChoice===null?'var(--bg)':i===wordChoice&&w.ok?'#E1F5EE':i===wordChoice&&!w.ok?'#FAECE7':w.ok&&wordChoice!==null?'#E1F5EE':'var(--bg)',
              color:'var(--text)'
            }}>{w.t}{wordChoice!==null&&w.ok&&' ✓'}</button>
          ))}
        </div>
        {wordChoice!==null && <div style={{ marginTop:14, padding:12, background:'#E1F5EE', borderRadius:10, fontSize:13, lineHeight:1.6, color:'#085041' }}><strong>À partir du contexte, le modèle calcule une distribution de probabilités sur les tokens susceptibles de suivre.</strong> Token après token, une phrase entière se construit.</div>}
      </Wrap>}

      {/* STEP 24 — Rabbit */}
      {s === 24 && <Wrap onNext={rabbitCtx!==null?next:undefined} canNext={rabbitCtx!==null}>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>🐰 Le défi du lapin</h3>
        <p style={{ fontSize:15, fontWeight:700, marginBottom:10, textAlign:'center' }}>« Qu'est-ce que je fais de mon lapin ? »</p>
        <p style={{ fontSize:13, color:'var(--text2)', marginBottom:12 }}>La réponse devrait être différente selon le contexte. Lequel ?</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[{icon:'👦🎄🧸',label:'Enfant + Noël + peluche',ctx:0},{icon:'🏹🐇🍳',label:'Chasseur + gibier + cuisine',ctx:1}].map(({icon,label,ctx})=>(
            <button key={ctx} onClick={()=>setRabbitCtx(ctx)} style={{ padding:'16px', borderRadius:12, border:`2px solid ${rabbitCtx===ctx?'var(--accent)':'var(--border)'}`, background:rabbitCtx===ctx?'var(--accent-bg)':'var(--bg2)', cursor:'pointer', textAlign:'center' }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
              <div style={{ fontSize:12, fontWeight:500 }}>{label}</div>
            </button>
          ))}
        </div>
        {rabbitCtx!==null && <div style={{ marginTop:14, padding:12, background:'#E1F5EE', borderRadius:10, fontSize:13, lineHeight:1.6, color:'#085041' }}><strong>Exact !</strong> Le même mot « lapin » n'est pas interprété de la même façon selon le contexte. C'est là qu'interviennent les vecteurs.</div>}
      </Wrap>}

      {/* STEP 25 — Vectors */}
      {s === 25 && <Wrap onNext={next}>
        <h3 style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>📍 Les vecteurs</h3>
        <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6, marginBottom:14 }}>Les tokens sont transformés en <strong>représentations numériques</strong> dans un espace à des centaines de dimensions.</p>
        <div style={{ padding:14, background:'var(--bg2)', borderRadius:12, marginBottom:10, textAlign:'center' }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:10 }}>« Une immense carte mathématique du sens »</div>
          <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
            {[['👦🎄🧸 lapin','#E6F1FB','#0C447C'],['🏹🐇🍳 lapin','#FAEEDA','#633806']].map(([l,bg,c],i)=>(
              <div key={i} style={{ padding:'6px 12px', background:bg, color:c, borderRadius:20, fontSize:13, fontWeight:600 }}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{ padding:10, background:'var(--bg2)', borderRadius:10, fontSize:11, color:'var(--text3)' }}>⚠️ Il n'existe pas un «vecteur doudou» préprogrammé. Ce sont des représentations mathématiques <em>apprises</em> par le modèle.</div>
      </Wrap>}

      {/* STEP 26 — GPT reveal */}
      {s === 26 && <Wrap onNext={gptReveal>=3?next:undefined} canNext={gptReveal>=3}>
        <div style={{ textAlign:'center', marginBottom:18 }}>
          <h3 style={{ fontSize:34, fontWeight:900, letterSpacing:5 }}>GPT</h3>
          <p style={{ fontSize:12, color:'var(--text2)' }}>Clique pour révéler chaque lettre</p>
        </div>
        {[{l:'G',w:'Generative',d:'Le modèle génère du contenu'},{l:'P',w:'Pre-trained',d:'Pré-entraîné sur de très grandes quantités de données'},{l:'T',w:'Transformer',d:"L'architecture du modèle (2017)"}].map((item,i)=>(
          <div key={i} onClick={()=>gptReveal===i&&setGptReveal(i+1)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:gptReveal>i?'var(--accent-bg)':'var(--bg2)', border:`1.5px solid ${gptReveal>i?'var(--accent)':'var(--border)'}`, borderRadius:12, marginBottom:10, cursor:gptReveal===i?'pointer':'default' }}>
            <div style={{ width:38, height:38, borderRadius:10, background:gptReveal>i?'var(--accent)':'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:18, color:gptReveal>i?'white':'var(--text3)', flexShrink:0 }}>{item.l}</div>
            {gptReveal>i ? <div><div style={{ fontWeight:700, fontSize:14, color:'var(--accent-text)' }}>{item.w}</div><div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{item.d}</div></div> : <div style={{ fontSize:13, color:'var(--text3)' }}>Appuie pour révéler</div>}
          </div>
        ))}
      </Wrap>}

      {/* STEP 27 — Attention */}
      {s === 27 && <Wrap onNext={next}>
        <h3 style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>👁️ L'Attention</h3>
        <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6, marginBottom:14 }}>Comment le modèle sait-il quelles parties du contexte sont importantes ?</p>
        <div style={{ padding:14, background:'var(--bg2)', borderRadius:12, marginBottom:14, fontStyle:'italic', fontSize:14, lineHeight:1.8 }}>
          « <span style={{ background:'#FAEEDA', padding:'0 3px', borderRadius:3 }}>L'enfant</span> prend <span style={{ background:'#E6F1FB', padding:'0 3px', borderRadius:3 }}>son lapin</span> avant d'aller dormir avec <strong style={{ background:'#EEEDFE', padding:'0 3px', borderRadius:3 }}>lui</strong>. »
        </div>
        <div style={{ padding:12, background:'var(--accent-bg)', borderRadius:12, fontSize:13, lineHeight:1.6, color:'var(--accent-text)', marginBottom:10 }}>L'<strong>attention</strong> permet au modèle d'évaluer quelles parties du contexte sont les plus pertinentes entre elles pour comprendre «lui».</div>
        <div style={{ padding:10, background:'var(--bg2)', borderRadius:10, fontSize:12, textAlign:'center' }}>TOKENS → VECTEURS → <strong>ATTENTION</strong> → RÉSEAU → PROBABILITÉS → <strong>LLM</strong></div>
      </Wrap>}

      {/* STEP 28 — Agents */}
      {s === 28 && <Wrap onNext={next}>
        <Tag color="#EAF3DE"><span style={{ color:'#27500A' }}>🤖 ET MAINTENANT ?</span></Tag>
        <h3 style={{ fontSize:17, fontWeight:700, marginBottom:14 }}>Chatbot vs Agent IA</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div style={{ padding:12, background:'var(--bg2)', borderRadius:12 }}>
            <div style={{ fontSize:20, marginBottom:4 }}>💬</div><div style={{ fontWeight:700, fontSize:12, marginBottom:6 }}>CHATBOT</div>
            <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6 }}>Question → Réponse<br/>Question → Réponse<br/><em>L'utilisateur dirige tout.</em></div>
          </div>
          <div style={{ padding:12, background:'#EAF3DE', borderRadius:12, border:'1.5px solid #97C459' }}>
            <div style={{ fontSize:20, marginBottom:4 }}>🤖</div><div style={{ fontWeight:700, fontSize:12, color:'#27500A', marginBottom:6 }}>AGENT IA</div>
            <div style={{ fontSize:12, color:'#27500A', lineHeight:1.6 }}>Objectif → Plan → Outil → Action → Résultat → Suite…</div>
          </div>
        </div>
        <div style={{ marginTop:10, padding:10, background:'var(--bg2)', borderRadius:10, fontSize:11, color:'var(--text2)', lineHeight:1.5 }}>Son niveau d'autonomie dépend de sa conception et des contrôles mis en place.</div>
      </Wrap>}

      {/* STEP 29 — World models */}
      {s === 29 && <Wrap onNext={next}>
        <h3 style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>🌍 World Models</h3>
        <div style={{ padding:14, background:'var(--bg2)', borderRadius:12, marginBottom:14, fontSize:14, fontWeight:700, textAlign:'center' }}>Comprendre énormément de textes suffit-il pour comprendre le monde ?</div>
        <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6, marginBottom:12 }}>Yann LeCun et d'autres défendent l'idée qu'un humain apprend aussi grâce à :</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
          {[['👁️','Vision'],['🌍','Espace'],['⏱️','Temps'],['🧱','Physique'],['🤲','Interactions'],['➡️','Conséquences']].map(([icon,label])=>(
            <div key={label} style={{ padding:'5px 12px', background:'var(--bg2)', borderRadius:20, fontSize:12, display:'flex', gap:5, alignItems:'center' }}><span>{icon}</span><span>{label}</span></div>
          ))}
        </div>
        <div style={{ padding:12, background:'var(--accent-bg)', borderRadius:12, fontSize:13, lineHeight:1.6, color:'var(--accent-text)' }}>L'ambition : permettre à une machine d'anticiper <strong>l'évolution d'un environnement et les conséquences possibles d'une action</strong> — pas seulement prédire le prochain token.</div>
      </Wrap>}

      {/* STEP 30 — Summary */}
      {s === 30 && <Wrap onNext={next} nextLabel="Passer au quiz final →">
        <h3 style={{ fontSize:17, fontWeight:700, marginBottom:14, textAlign:'center' }}>Synthèse des 4 âges</h3>
        {[{icon:'💻',n:'1',t:'Informatique traditionnelle',b:"L'humain écrit les instructions. La machine les exécute.",bg:'#EEEDFE',c:'#3C3489'},
          {icon:'🧪',n:'2',t:'Systèmes experts',b:"L'humain formalise l'expertise en règles. Un moteur les applique.",bg:'#FAEEDA',c:'#633806'},
          {icon:'🔗',n:'3',t:'Réseaux de neurones',b:"La machine apprend ses paramètres à partir de données et d'un objectif.",bg:'#E6F1FB',c:'#0C447C'},
          {icon:'✨',n:'4',t:'IA générative',b:"De très grands réseaux génèrent de nouveaux contenus. Tokens + vecteurs + attention.",bg:'#FBEAF0',c:'#72243E'},
          {icon:'🤖',n:'→',t:"Aujourd'hui et demain",b:'Agents IA + world models + nouvelles architectures.',bg:'#EAF3DE',c:'#27500A'},
        ].map(({icon,n,t,b,bg,c})=>(
          <div key={n} style={{ display:'flex', gap:10, padding:'10px 12px', background:bg, borderRadius:12, marginBottom:8, alignItems:'flex-start' }}>
            <div style={{ minWidth:26, height:26, borderRadius:'50%', background:c, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{n}</div>
            <div><div style={{ fontWeight:700, fontSize:12, color:c }}>{icon} {t}</div><div style={{ fontSize:11, color:c, marginTop:3, lineHeight:1.5 }}>{b}</div></div>
          </div>
        ))}
      </Wrap>}
    </div>
  )
}
