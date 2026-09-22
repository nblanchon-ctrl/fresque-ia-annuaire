'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

// ─── QUIZ ─────────────────────────────────────────────────────────────────────
const QUIZ = [
  { q:"Dans l'informatique traditionnelle, qui définit principalement les règles que la machine applique ?", opts:["Le développeur","Le réseau de neurones","La machine elle-même","Les utilisateurs finaux"], correct:0, expl:"Dans l'informatique traditionnelle, ce sont les développeurs (humains) qui écrivent explicitement chaque règle. La machine se contente de les exécuter fidèlement, sans capacité d'apprentissage." },
  { q:"Quel est l'un des principaux avantages d'un système déterministe à règles explicites ?", opts:["Il apprend seul","Il ne commet jamais d'erreur","Son chemin de décision peut généralement être retracé","Il comprend naturellement le langage"], correct:2, expl:"La traçabilité est l'avantage clé : puisque les règles sont écrites explicitement, on peut retracer exactement quelles conditions ont conduit à quel résultat." },
  { q:"Dans un système expert classique, à quoi sert principalement le moteur d'inférence ?", opts:["À créer des images","À appliquer des règles aux faits disponibles","À remplacer la base de connaissances","À entraîner un réseau neuronal"], correct:1, expl:"Le moteur d'inférence confronte les faits disponibles aux règles de la base de connaissances pour produire de nouvelles informations ou aboutir à une conclusion." },
  { q:"Pourquoi Deep Blue est-il particulièrement intéressant dans l'histoire de l'IA ?", opts:["Il a inventé les LLM","Il était capable de tout faire","Il utilisait ChatGPT","Il illustre la très forte performance possible sur une tâche spécialisée"], correct:3, expl:"Deep Blue illustre qu'une machine peut être extraordinairement performante dans un domaine très précis (les échecs) sans être capable de faire quoi que ce soit d'autre. C'est la limite des IA spécialisées." },
  { q:"Quel changement fondamental caractérise le machine learning ?", opts:["La machine n'utilise plus de calculs","Le modèle apprend des paramètres à partir de données plutôt que toutes les règles étant écrites explicitement","Les ordinateurs abandonnent le binaire","Internet devient inutile"], correct:1, expl:"La rupture fondamentale : au lieu d'écrire explicitement toutes les règles, on fournit des données et un objectif, et le modèle apprend ses propres paramètres à partir des exemples." },
  { q:"Qu'est-ce qu'un neurone artificiel, fondamentalement ?", opts:["Une copie exacte d'un neurone biologique","Une cellule créée artificiellement en laboratoire","Un composant possédant une conscience rudimentaire","Une unité de calcul mathématique"], correct:3, expl:"Un neurone artificiel est essentiellement une fonction mathématique. Il reçoit des entrées, les pondère et produit une sortie. Ce n'est pas une reproduction fidèle du cerveau biologique." },
  { q:"Dans un réseau neuronal, que représente principalement un poids (weight) ?", opts:["La taille physique du serveur","Le volume total de données utilisées","Une valeur numérique influençant l'importance d'un signal dans le calcul","Le nombre d'utilisateurs du système"], correct:2, expl:"Les poids sont comme des curseurs de volume : ils déterminent l'influence de chaque signal entrant. C'est précisément ces valeurs que l'apprentissage ajuste progressivement pour réduire les erreurs." },
  { q:"Pendant l'entraînement d'un réseau neuronal, qu'est-ce qu'on cherche principalement à réduire ?", opts:["L'erreur entre la prédiction du modèle et le résultat attendu","Le nombre de touches frappées sur le clavier","La taille de l'écran d'affichage","Le nombre d'utilisateurs simultanés"], correct:0, expl:"L'entraînement consiste à ajuster progressivement les poids du réseau pour minimiser l'erreur entre ce que le modèle prédit et ce qu'on attendait." },
  { q:"À quoi sert notamment la rétropropagation (backpropagation) ?", opts:["À transformer le réseau en système expert","À calculer comment chaque paramètre a contribué à l'erreur afin de pouvoir les ajuster dans la bonne direction","À supprimer les données d'entraînement","À traduire le texte d'une langue à l'autre"], correct:1, expl:"La rétropropagation propage le signal d'erreur en sens inverse dans le réseau pour calculer la contribution de chaque poids à l'erreur totale, permettant de les ajuster via la descente de gradient." },
  { q:"Que désigne le problème de la 'boîte noire' dans le contexte des réseaux de neurones ?", opts:["Un ordinateur physiquement éteint","Un serveur informatique sécurisé","Un modèle dont le code source est secret","La difficulté à traduire le fonctionnement interne complexe d'un réseau en une explication humaine simple"], correct:3, expl:"Un réseau de neurones avec des milliards de paramètres interconnectés prend des décisions impossibles à résumer en règles simples. On sait comment il est construit mais expliquer pourquoi il produit un résultat particulier est très difficile." },
  { q:"Qu'est-ce qu'un token dans le contexte des LLM ?", opts:["Une unité dans laquelle le texte est découpé pour être traité par le modèle","Une réponse complète générée par le modèle","Un neurone biologique artificiel","Un moteur de recherche intégré"], correct:0, expl:"Le texte est découpé en tokens : un mot entier, une partie de mot, un signe de ponctuation. C'est l'unité élémentaire que le modèle manipule. Le modèle génère le texte token après token." },
  { q:"Pourquoi 'va' est-il une suite naturelle de 'Bonjour, comment ça…' pour un LLM ?", opts:["Le système d'exploitation l'impose","Tous les prompts se terminent toujours par ce mot","Le modèle calcule une distribution de probabilités sur les tokens susceptibles de suivre le contexte et 'va' a une probabilité élevée","'Va' est statistiquement le mot le plus fréquent de la langue française"], correct:2, expl:"Le modèle calcule à chaque étape une distribution de probabilités sur tous les tokens possibles en fonction du contexte. 'Bonjour, comment ça va ?' est très fréquente dans les données d'entraînement." },
  { q:"À quoi sert l'analogie du sac de billes dans ce module ?", opts:["À expliquer le fonctionnement des processeurs","À montrer que l'IA fonctionne totalement au hasard","À représenter physiquement les tokens d'un texte","À introduire intuitivement la notion de probabilité conditionnelle : les observations modifient notre estimation"], correct:3, expl:"Le sac de billes illustre que notre estimation de la probabilité d'un événement peut être révisée à mesure qu'on obtient de nouvelles observations. C'est l'intuition de la probabilité conditionnelle." },
  { q:"Pourquoi les tokens sont-ils transformés en vecteurs dans les LLM ?", opts:["Pour représenter numériquement les tokens et capturer des relations de sens apprises entre eux","Pour dessiner des images à partir du texte","Pour remplacer complètement les réseaux de neurones","Pour créer des fichiers dans un traitement de texte"], correct:0, expl:"Les vecteurs permettent de représenter les tokens sous forme de coordonnées numériques dans un espace à des centaines de dimensions, où les relations de sens sont encodées géométriquement." },
  { q:"Que montre principalement l'exemple du lapin avec l'enfant et le chasseur ?", opts:["Que l'IA est capable de cuisiner","Que le contexte peut complètement modifier le sens pertinent d'une même formulation","Que les chasseurs utilisent beaucoup l'IA","Que chaque mot possède une signification unique et immuable"], correct:1, expl:"Le mot 'lapin' prend un sens complètement différent selon que le contexte évoque un enfant avec une peluche de Noël ou un chasseur revenant de la forêt. C'est ce que les vecteurs contextuels capturent." },
  { q:"Que signifie le T dans l'acronyme GPT ?", opts:["Token","Training","Transformer","Technology"], correct:2, expl:"GPT signifie Generative Pre-trained Transformer. Le Transformer est l'architecture introduite en 2017 qui a révolutionné le domaine, notamment grâce à son mécanisme d'attention." },
  { q:"Quel mécanisme est particulièrement central et innovant dans l'architecture Transformer ?", opts:["L'attention : évaluer quelles parties du contexte sont les plus pertinentes entre elles","La carte perforée : stocker les données sur des supports physiques","Le moteur d'inférence : appliquer des règles à des faits","L'arbre binaire : organiser les décisions en oui/non"], correct:0, expl:"Le mécanisme d'attention permet au modèle de calculer, pour chaque élément d'une séquence, sa pertinence par rapport à tous les autres éléments, capturant des dépendances à longue distance." },
  { q:"Quelle description correspond le mieux à un agent IA, par opposition à un simple chatbot ?", opts:["Un chatbot qui donne toujours exactement une phrase de réponse","Un système qui associe un modèle d'IA à des instructions et à des outils pour enchaîner des actions autonomes vers un objectif","Une simple base de données interrogeable","Une IA qui a nécessairement une conscience artificielle complète"], correct:1, expl:"Un agent IA peut planifier des étapes, utiliser des outils (calendrier, recherche web, email…), évaluer les résultats et adapter son comportement en fonction des résultats obtenus." },
  { q:"Pourquoi des chercheurs comme Yann LeCun travaillent-ils sur les 'world models' ?", opts:["Pour créer des cartographies géographiques numériques","Pour remplacer toutes les IA existantes par des robots physiques","Pour explorer des systèmes capables d'apprendre des représentations riches du monde permettant d'anticiper l'évolution d'un environnement","Pour augmenter uniquement la quantité de texte disponible"], correct:2, expl:"Les world models visent à doter les machines de représentations plus riches du monde physique (espace, temps, causalité) permettant d'anticiper les conséquences d'actions — au-delà de la simple prédiction du token suivant." },
  { q:"Quelle phrase résume le mieux l'évolution fondamentale décrite dans ce module ?", opts:["Les ordinateurs modernes n'utilisent plus du tout d'algorithmes","Chaque nouvelle technologie a complètement et définitivement remplacé la précédente","L'IA fonctionne désormais sans aucune intervention ni supervision humaine","Nous sommes progressivement passés de règles explicitement programmées à des systèmes capables d'apprendre des paramètres à partir de données"], correct:3, expl:"L'évolution centrale : de règles écrites explicitement par des humains, nous sommes passés à des systèmes qui apprennent leurs propres paramètres à partir de données. Les technologies précédentes coexistent toujours." },
]

const TOTAL_LEARNING = 31

// ─── PHASE CELEBRATIONS ───────────────────────────────────────────────────────
const PHASE_CELEBRATIONS = [
  { step: 6,  icon: '💻', title: 'Informatique\ntraditionelle maîtrisée !', sub: 'Tu comprends maintenant comment les humains ont appris à faire calculer les machines.', color: '#534AB7', bg: '#EEEDFE' },
  { step: 11, icon: '🧪', title: 'Systèmes experts\nterminés !', sub: 'Tu sais maintenant ce qu\'est un moteur d\'inférence et pourquoi Deep Blue est fascinant.', color: '#633806', bg: '#FAEEDA' },
  { step: 20, icon: '🔗', title: 'Réseaux de neurones\nexplorés !', sub: 'Tu comprends comment une machine apprend — et ce qu\'est la boîte noire.', color: '#0C447C', bg: '#E6F1FB' },
  { step: 29, icon: '✨', title: 'IA générative\ndécouverte !', sub: 'Tokens, vecteurs, attention, Transformer… tu as tout compris.', color: '#72243E', bg: '#FBEAF0' },
  { step: 31, icon: '🚀', title: 'Contenu terminé !\nPlace au quiz final.', sub: '20 questions pour valider ta maîtrise complète du sujet.', color: '#27500A', bg: '#EAF3DE' },
]

// ─── PCB BADGE ────────────────────────────────────────────────────────────────
function PCBBadge({ size = 100, small = false }: { size?: number, small?: boolean }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="pcbBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0D2B4E"/>
          <stop offset="100%" stopColor="#040F1D"/>
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      {/* PCB board */}
      <rect width="200" height="200" rx="18" fill="url(#pcbBg)"/>
      <rect x="1" y="1" width="198" height="198" rx="17" fill="none" stroke="#1A4A7A" strokeWidth="2"/>
      {/* PCB grid pattern */}
      {[20,40,60,80,100,120,140,160,180].map(x=>(
        <line key={`v${x}`} x1={x} y1="0" x2={x} y2="200" stroke="#0E2840" strokeWidth="0.5"/>
      ))}
      {[20,40,60,80,100,120,140,160,180].map(y=>(
        <line key={`h${y}`} x1="0" y1={y} x2="200" y2={y} stroke="#0E2840" strokeWidth="0.5"/>
      ))}
      {/* Circuit traces */}
      <path d="M20 100 L60 100 L60 60 L100 60" stroke="#00B86B" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M180 100 L140 100 L140 60 L100 60" stroke="#00B86B" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M100 180 L100 140 L140 140 L140 100" stroke="#00B86B" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M100 20 L100 60 L60 60 L60 100" stroke="#00B86B" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M40 40 L60 60" stroke="#0066CC" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M160 40 L140 60" stroke="#0066CC" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M40 160 L60 140" stroke="#0066CC" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M160 160 L140 140" stroke="#0066CC" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Corner pads */}
      {[[20,20],[180,20],[20,180],[180,180]].map(([cx,cy],i)=>(
        <g key={i}>
          <circle cx={cx} cy={cy} r="7" fill="#C8960A"/>
          <circle cx={cx} cy={cy} r="4" fill="#F0B429"/>
          <circle cx={cx} cy={cy} r="2" fill="#0A1628"/>
        </g>
      ))}
      {/* Edge connection pins */}
      {[60,80,100,120,140].map((pos,i)=>[
        <rect key={`t${i}`} x={pos-5} y="0" width="10" height="14" rx="2" fill="#C8960A"/>,
        <rect key={`b${i}`} x={pos-5} y="186" width="10" height="14" rx="2" fill="#C8960A"/>,
        <rect key={`l${i}`} x="0" y={pos-5} width="14" height="10" rx="2" fill="#C8960A"/>,
        <rect key={`r${i}`} x="186" y={pos-5} width="14" height="10" rx="2" fill="#C8960A"/>,
      ])}
      {/* Central chip */}
      <rect x="62" y="62" width="76" height="76" rx="6" fill="#1A1A2E" stroke="#2D4A8A" strokeWidth="2"/>
      <rect x="68" y="68" width="64" height="64" rx="4" fill="#0D0D1A" stroke="#3D5FA8" strokeWidth="1"/>
      {/* Chip circuit lines */}
      <line x1="100" y1="72" x2="100" y2="96" stroke="#00B86B" strokeWidth="1"/>
      <line x1="72" y1="100" x2="96" y2="100" stroke="#00B86B" strokeWidth="1"/>
      <line x1="100" y1="128" x2="100" y2="104" stroke="#00B86B" strokeWidth="1"/>
      <line x1="128" y1="100" x2="104" y2="100" stroke="#00B86B" strokeWidth="1"/>
      {/* Chip nodes */}
      {[[85,85],[100,85],[115,85],[85,100],[115,100],[85,115],[100,115],[115,115]].map(([cx,cy],i)=>(
        <circle key={i} cx={cx} cy={cy} r="3.5" fill="#4A90D9" opacity="0.8"/>
      ))}
      {/* Central processor core */}
      <rect x="91" y="91" width="18" height="18" rx="3" fill="#1A3A6A" stroke="#4A90D9" strokeWidth="1.5"/>
      <text x="100" y="103" textAnchor="middle" fontSize="8" fill="#FFFFFF" fontWeight="900" fontFamily="monospace">AI</text>
      {/* Glow dots on traces */}
      {[[60,60],[140,60],[60,140],[140,140]].map(([cx,cy],i)=>(
        <circle key={i} cx={cx} cy={cy} r="4" fill="#00B86B" filter="url(#glow)" opacity="0.9"/>
      ))}
      {!small && <>
        <text x="100" y="175" textAnchor="middle" fontSize="9" fill="#4A90D9" fontWeight="700" fontFamily="monospace" letterSpacing="2">IA MASTER</text>
      </>}
    </svg>
  )
}

// ─── CONFETTI ────────────────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({length: 24}, (_, i) => ({
    color: ['#58CC02','#FFC800','#FF4B4B','#1CB0F6','#CE82FF','#FF9600'][i % 6],
    left: `${(i * 4.2) % 100}%`,
    delay: `${(i * 0.08).toFixed(2)}s`,
    duration: `${0.8 + (i % 4) * 0.15}s`,
    size: 8 + (i % 4) * 2,
    rotate: i % 2 === 0 ? 'rotate' : 'rotateY',
  }))
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', pointerEvents: 'none', overflow: 'hidden' }}>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(300px) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', top: 0, left: p.left,
          width: p.size, height: p.size / 2,
          background: p.color, borderRadius: 2,
          animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
        }}/>
      ))}
    </div>
  )
}

// ─── CELEBRATION MODAL ───────────────────────────────────────────────────────
function CelebrationModal({ data, onContinue }: {
  data: { icon: string, title: string, sub: string, color: string, bg: string },
  onContinue: () => void
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', padding: '20px',
    }}>
      <style>{`
        @keyframes popIn { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes starSpin { 0%{transform:rotate(0deg) scale(0)} 50%{transform:rotate(180deg) scale(1.2)} 100%{transform:rotate(360deg) scale(1)} }
      `}</style>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <Confetti/>
        <div style={{
          background: 'white', borderRadius: 24, padding: '36px 32px',
          textAlign: 'center', maxWidth: 360, width: '100%',
          animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
          position: 'relative',
        }}>
          {/* Stars */}
          {[[-20,-20],[20,-20],[-20,20],[20,20]].map(([dx,dy],i)=>(
            <div key={i} style={{
              position: 'absolute', top: 40+dy, right: i%2===0?'auto':40+Math.abs(dx), left: i%2===0?40+Math.abs(dx):'auto',
              fontSize: 20, animation: `starSpin 0.6s ${i*0.1}s ease forwards`, opacity: 0,
            }}>⭐</div>
          ))}
          <div style={{ fontSize: 64, marginBottom: 8, animation: 'bounce 1s 0.4s ease-in-out infinite' }}>
            {data.icon}
          </div>
          <div style={{
            display: 'inline-block', background: data.bg, color: data.color,
            fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 20,
            marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase',
          }}>
            Phase complétée !
          </div>
          <h2 style={{
            fontSize: 22, fontWeight: 900, color: '#1a1a2e', marginBottom: 10,
            lineHeight: 1.3, whiteSpace: 'pre-line',
          }}>
            {data.title}
          </h2>
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 24 }}>
            {data.sub}
          </p>
          <button onClick={onContinue} style={{
            width: '100%', padding: '16px', borderRadius: 16,
            background: '#58CC02', color: 'white',
            border: 'none', fontWeight: 800, fontSize: 16,
            cursor: 'pointer', letterSpacing: 0.5,
            boxShadow: '0 4px 0 #3D8A00',
            transform: 'translateY(0)',
            transition: 'all 0.1s',
          }}
          onMouseDown={e => (e.currentTarget.style.cssText += 'transform:translateY(3px);box-shadow:0 1px 0 #3D8A00')}
          onMouseUp={e => (e.currentTarget.style.cssText += 'transform:translateY(0);box-shadow:0 4px 0 #3D8A00')}>
            Continuer →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ step, phase }: { step: number, phase: number }) {
  const pct = Math.round((step / (TOTAL_LEARNING + QUIZ.length)) * 100)
  const phases = [['💻','Traditionnel'],['🧪','Experts'],['🔗','Neurones'],['✨','Génératif'],['🤖','Maintenant'],['❓','Quiz']]
  return (
    <div style={{ padding: '10px 16px 8px', background: 'white', borderBottom: '1px solid #E5E5E5' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1, height: 10, background: '#E5E5E5', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: 5,
            background: 'linear-gradient(90deg, #58CC02, #89E219)',
            transition: 'width .5s cubic-bezier(.4,0,.2,1)',
            boxShadow: '0 2px 4px rgba(88,204,2,0.4)',
          }}/>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#58CC02', minWidth: 36 }}>{pct}%</span>
      </div>
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
        {phases.map(([icon, label], i) => (
          <div key={i} title={label} style={{
            width: 30, height: 30, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: i < phase ? 11 : 14,
            fontWeight: 700,
            background: i < phase ? '#58CC02' : i === phase ? '#1CB0F6' : '#F0F0F0',
            color: i < phase ? 'white' : i === phase ? 'white' : '#999',
            border: i === phase ? '3px solid #1CB0F6' : '3px solid transparent',
            transition: 'all .3s',
          }}>
            {i < phase ? '✓' : icon}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── DUOLINGO-STYLE CONTINUE BUTTON ──────────────────────────────────────────
function ContinueBtn({ onClick, disabled, label = 'Continuer →', color = '#58CC02', shadow = '#3D8A00' }: {
  onClick?: () => void, disabled?: boolean, label?: string, color?: string, shadow?: string
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '16px', borderRadius: 16,
      background: disabled ? '#E5E5E5' : color,
      color: disabled ? '#AFAFAF' : 'white',
      border: 'none', fontWeight: 800, fontSize: 16,
      cursor: disabled ? 'default' : 'pointer',
      boxShadow: disabled ? 'none' : `0 4px 0 ${shadow}`,
      transform: 'translateY(0)', transition: 'all 0.1s',
      letterSpacing: 0.5,
    }}
    onMouseDown={e => !disabled && (e.currentTarget.style.cssText += `transform:translateY(3px);box-shadow:0 1px 0 ${shadow}`)}
    onMouseUp={e => !disabled && (e.currentTarget.style.cssText += `transform:translateY(0);box-shadow:0 4px 0 ${shadow}`)}>
      {label}
    </button>
  )
}

// ─── FEEDBACK BAR (Duolingo-style) ───────────────────────────────────────────
function FeedbackBar({ correct, expl, onNext, last }: { correct: boolean, expl: string, onNext: () => void, last: boolean }) {
  const msgs = ['Exact ! 🎉', 'Bien vu ! ⚡', 'Parfait ! 🔥', 'Tu as compris ! 💡', 'Bravo ! 🌟']
  const msg = msgs[Math.floor(Math.random() * msgs.length)]
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: correct ? '#D7FFB8' : '#FFDFE0',
      borderTop: `4px solid ${correct ? '#58CC02' : '#FF4B4B'}`,
      padding: '18px 20px 28px', zIndex: 100,
    }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: correct ? '#58CC02' : '#FF4B4B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>
            {correct ? '✓' : '✗'}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: correct ? '#2B7400' : '#CC0000', marginBottom: 4 }}>
              {correct ? msg : 'Pas tout à fait…'}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: correct ? '#2B7400' : '#990000' }}>
              {expl}
            </div>
          </div>
        </div>
        <ContinueBtn
          onClick={onNext}
          label={last ? 'Voir mes résultats →' : 'Continuer →'}
          color={correct ? '#58CC02' : '#FF4B4B'}
          shadow={correct ? '#3D8A00' : '#CC0000'}
        />
      </div>
    </div>
  )
}

// ─── STEP WRAPPER ────────────────────────────────────────────────────────────
function Wrap({ children, onNext, canNext = true, nextLabel = 'Continuer →' }: {
  children: React.ReactNode, onNext?: () => void, canNext?: boolean, nextLabel?: string
}) {
  return (
    <div style={{ padding: '20px 16px 110px', maxWidth: 700, margin: '0 auto' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ animation: 'fadeIn 0.25s ease' }}>
        {children}
      </div>
      {onNext && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '14px 16px 24px', background: 'white',
          borderTop: '1px solid #E5E5E5',
        }}>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <ContinueBtn onClick={onNext} disabled={!canNext} label={nextLabel}/>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── QUIZ OPTION BUTTON ──────────────────────────────────────────────────────
function QuizOption({ label, text, state, onClick }: {
  label: string, text: string,
  state: 'idle' | 'correct' | 'wrong' | 'shown-correct',
  onClick: () => void
}) {
  const styles = {
    idle: { bg: 'white', border: '#E5E5E5', labelBg: '#F0F0F0', labelColor: '#777', textColor: '#1a1a2e' },
    correct: { bg: '#D7FFB8', border: '#58CC02', labelBg: '#58CC02', labelColor: 'white', textColor: '#1a1a2e' },
    wrong: { bg: '#FFDFE0', border: '#FF4B4B', labelBg: '#FF4B4B', labelColor: 'white', textColor: '#1a1a2e' },
    'shown-correct': { bg: '#D7FFB8', border: '#58CC02', labelBg: '#58CC02', labelColor: 'white', textColor: '#1a1a2e' },
  }[state]
  return (
    <button onClick={onClick} disabled={state !== 'idle'} style={{
      display: 'flex', gap: 12, alignItems: 'center',
      padding: '16px 18px', borderRadius: 14,
      border: `2.5px solid ${styles.border}`,
      background: styles.bg, cursor: state === 'idle' ? 'pointer' : 'default',
      textAlign: 'left', width: '100%', transition: 'all .15s',
    }}>
      <span style={{
        minWidth: 32, height: 32, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 14, flexShrink: 0,
        background: styles.labelBg, color: styles.labelColor,
        transition: 'all .15s',
      }}>{state !== 'idle' && state === 'correct' ? '✓' : state === 'wrong' ? '✗' : label}</span>
      <span style={{ fontSize: 15, lineHeight: 1.45, color: styles.textColor, fontWeight: 500 }}>{text}</span>
    </button>
  )
}

// ─── CARD ────────────────────────────────────────────────────────────────────
function Card({ children, color = 'white', border, style: extraStyle }: { children: React.ReactNode, color?: string, border?: string, style?: React.CSSProperties }) {
  return (
    <div style={{
      background: color, borderRadius: 16, padding: '16px',
      border: border ? `2px solid ${border}` : '1.5px solid #E5E5E5',
      marginBottom: 12, ...extraStyle
    }}>
      {children}
    </div>
  )
}

function PhaseTag({ bg, color, children }: { bg: string, color: string, children: React.ReactNode }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: bg, color, fontSize: 12, fontWeight: 800,
      padding: '5px 14px', borderRadius: 20, marginBottom: 14,
      textTransform: 'uppercase', letterSpacing: 0.5,
    }}>{children}</div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ModulePage() {
  const { id } = useParams<{ id: string }>()
  const { lang } = useLanguage()
  const [userId, setUserId] = useState<string | null>(null)
  const [moduleTitle, setModuleTitle] = useState('')
  const [loading, setLoading] = useState(true)

  const [step, setStep] = useState(0)
  const [celebration, setCelebration] = useState<typeof PHASE_CELEBRATIONS[0] | null>(null)
  const [catStep, setCatStep] = useState(0)
  const [dogAnswer, setDogAnswer] = useState<boolean | null>(null)
  const [expertStep, setExpertStep] = useState(0)
  const [marbles, setMarbles] = useState<string[]>([])
  const [wordChoice, setWordChoice] = useState<number | null>(null)
  const [rabbitCtx, setRabbitCtx] = useState<number | null>(null)
  const [gptReveal, setGptReveal] = useState(0)
  const [bbAnswer, setBbAnswer] = useState<boolean | null>(null)

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
      supabase.from('modules').select('titre').eq('id', id as string).single().then(({ data }) => {
        if (data) setModuleTitle(data.titre)
        setLoading(false)
      })
    })
  }, [id])

  const next = () => {
    const nextStep = step + 1
    const cel = PHASE_CELEBRATIONS.find(c => c.step === nextStep)
    if (cel) {
      setCelebration(cel)
    } else {
      setStep(nextStep)
    }
  }

  const closeCelebration = () => {
    if (celebration) {
      setStep(celebration.step)
      setCelebration(null)
    }
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
      const fs = score + (correct ? 1 : 0)
      await supabase.from('progressions').upsert({
        animateur_id: userId!, module_id: id,
        completed: fs === QUIZ.length,
        completed_at: fs === QUIZ.length ? new Date().toISOString() : null,
        attempts: 1,
      }, { onConflict: 'animateur_id,module_id' })
    }
  }

  const nextQuiz = () => { setShowFb(false); setFeedback(null); next() }

  if (loading) return <div className="container"><div className="empty"><p>Chargement…</p></div></div>

  const header = (
    <div style={{ position: 'sticky', top: 0, zIndex: 20 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'white', borderBottom: '1px solid #E5E5E5',
      }}>
        <a href="/formation/modules" style={{ fontSize: 13, color: '#999', fontWeight: 600, textDecoration: 'none' }}>✕</a>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#555', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{moduleTitle}</span>
        <LanguageSwitch />
      </div>
      {!isResult && <ProgressBar step={step} phase={phase} />}
    </div>
  )

  // ── QUIZ ─────────────────────────────────────────────────────────────────────
  if (isQuiz) {
    const q = QUIZ[qIdx], ua = answers[qIdx], labels = ['A','B','C','D']
    return (
      <div style={{ minHeight: '100vh', background: '#F7F7F7' }}>
        {celebration && <CelebrationModal data={celebration} onContinue={closeCelebration}/>}
        {header}
        <div style={{ padding: '20px 16px 130px', maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1CB0F6' }}>Question {qIdx + 1} / {QUIZ.length}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FFF9E6', padding: '4px 10px', borderRadius: 20 }}>
              <span style={{ fontSize: 16 }}>⭐</span>
              <span style={{ fontWeight: 800, fontSize: 14, color: '#FFC800' }}>{score}</span>
            </div>
          </div>
          <div style={{ height: 6, background: '#E5E5E5', borderRadius: 3, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ width: `${(qIdx / QUIZ.length) * 100}%`, height: '100%', background: '#1CB0F6', borderRadius: 3, transition: 'width .3s' }}/>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.55, marginBottom: 20, color: '#1a1a2e' }}>{q.q}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.opts.map((opt, i) => {
              const sel = ua === i, cor = i === q.correct, shown = ua !== null
              const state = !shown ? 'idle' : cor ? 'correct' : sel ? 'wrong' : 'idle'
              return <QuizOption key={i} label={labels[i]} text={opt} state={state} onClick={() => pickAnswer(i)}/>
            })}
          </div>
        </div>
        {showFb && <FeedbackBar correct={feedback!} expl={q.expl} onNext={nextQuiz} last={qIdx === QUIZ.length - 1}/>}
      </div>
    )
  }

  // ── RESULT ───────────────────────────────────────────────────────────────────
  if (isResult) {
    const total = answers.filter((a, i) => a === QUIZ[i].correct).length
    const perfect = total === QUIZ.length
    const pct = Math.round((total / QUIZ.length) * 100)
    const wrongs = answers.map((a, i) => a !== QUIZ[i].correct ? i : -1).filter(x => x >= 0)
    const restart = () => { setStep(TOTAL_LEARNING); setAnswers(Array(QUIZ.length).fill(null)); setScore(0); setShowFb(false); setFeedback(null); setSaved(false) }
    return (
      <div style={{ minHeight: '100vh', background: '#F7F7F7' }}>
        <style>{`@keyframes pcbScan{0%,100%{opacity:0.3}50%{opacity:1}} @keyframes popIn{0%{transform:scale(0.5);opacity:0}70%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}`}</style>
        {header}
        <div style={{ padding: '28px 16px 40px', maxWidth: 700, margin: '0 auto' }}>
          {perfect ? (
            <div style={{ textAlign: 'center', marginBottom: 28, animation: 'popIn 0.5s ease forwards' }}>
              <div style={{ marginBottom: 16, display: 'inline-block' }}>
                <PCBBadge size={140}/>
              </div>
              <div style={{
                display: 'inline-block', background: '#1a3a6a', color: '#4A90D9',
                fontSize: 11, fontWeight: 800, padding: '5px 16px',
                borderRadius: 20, marginBottom: 10, letterSpacing: 2, textTransform: 'uppercase',
                fontFamily: 'monospace',
              }}>✦ BADGE DÉBLOQUÉ</div>
              <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6, color: '#1a1a2e', letterSpacing: -0.5 }}>MAÎTRISE IA</h2>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#58CC02', marginBottom: 8 }}>20 / 20 — 100 %</div>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, maxWidth: 300, margin: '0 auto 24px' }}>
                Parfait ! Ce badge de maîtrise de l'IA est maintenant visible sur ton profil dans l'annuaire.
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 60, marginBottom: 12 }}>{pct >= 80 ? '🎯' : pct >= 60 ? '💪' : '📚'}</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: pct >= 80 ? '#58CC02' : '#FFC800', marginBottom: 8 }}>
                {total} / {QUIZ.length}
              </div>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>
                {pct >= 80 ? 'Beau parcours ! Quelques notions méritent encore un peu d\'entraînement.' : pct >= 60 ? 'Bon début ! Revois les questions manquées pour consolider tes acquis.' : 'Continue à apprendre — le module t\'attend pour une révision approfondie.'}
              </p>
            </div>
          )}

          {wrongs.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#555', marginBottom: 12 }}>📋 Questions à revoir :</div>
              {wrongs.map(i => (
                <div key={i} style={{ padding: 14, background: 'white', borderRadius: 12, border: '1.5px solid #FFDFE0', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, lineHeight: 1.4, color: '#1a1a2e' }}>
                    Q{i + 1}. {QUIZ[i].q}
                  </div>
                  <div style={{ fontSize: 12, color: '#2B7400', marginBottom: 2 }}>✓ {QUIZ[i].opts[QUIZ[i].correct]}</div>
                  {answers[i] !== null && <div style={{ fontSize: 12, color: '#CC0000' }}>✗ {QUIZ[i].opts[answers[i]!]}</div>}
                  <div style={{ fontSize: 11, color: '#888', marginTop: 8, lineHeight: 1.5, borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>{QUIZ[i].expl}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ContinueBtn onClick={restart} label="Refaire le quiz"/>
            <button onClick={() => window.location.href = '/formation/modules'} style={{
              padding: '14px', borderRadius: 14, background: 'white',
              color: '#555', border: '2px solid #E5E5E5',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>← Retour aux modules</button>
          </div>
        </div>
      </div>
    )
  }

  // ── LEARNING STEPS ────────────────────────────────────────────────────────────
  const s = step
  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7' }}>
      {celebration && <CelebrationModal data={celebration} onContinue={closeCelebration}/>}
      {header}

      {/* S0 — Cover */}
      {s === 0 && <Wrap onNext={next} nextLabel="C'est parti ! →">
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>💡</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12, lineHeight: 1.3, color: '#1a1a2e' }}>
            Sans technologie,<br/>pas d'intelligence<br/>artificielle.
          </h1>
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.75, marginBottom: 24 }}>
            Comment sommes-nous passés d'ordinateurs auxquels il fallait expliquer précisément quoi faire à des IA capables de dialoguer, créer et générer ?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            {[['💻','1. Informatique traditionnelle','#EEEDFE','#3C3489'],['🧪','2. Systèmes experts','#FAEEDA','#633806'],['🔗','3. Réseaux de neurones','#E6F1FB','#0C447C'],['✨','4. IA générative','#FBEAF0','#72243E'],['🤖','Et maintenant ?','#EAF3DE','#27500A']].map(([icon,label,bg,color],i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', background:bg, borderRadius:16, width:'100%', maxWidth:320 }}>
                <span style={{ fontSize:22 }}>{icon}</span>
                <span style={{ fontSize:14, fontWeight:700, color }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </Wrap>}

      {/* S1 — Traditional computing */}
      {s === 1 && <Wrap onNext={next}>
        <PhaseTag bg="#EEEDFE" color="#3C3489">💻 Âge 1 — Informatique traditionnelle</PhaseTag>
        <h2 style={{ fontSize:24, fontWeight:900, marginBottom:12, color:'#1a1a2e' }}>« Dis-moi exactement quoi faire. »</h2>
        <p style={{ fontSize:14, color:'#444', lineHeight:1.75, marginBottom:14 }}>Dans l'informatique traditionnelle, <strong>l'humain écrit les instructions</strong>. La machine les exécute fidèlement, sans les remettre en question.</p>
        <Card color="#F8F5FF" border="#C5C0EF">
          <div style={{ fontSize:12, fontWeight:700, color:'#3C3489', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Principe fondamental</div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
            {[['👨‍💻','Humain','écrit les règles','#F0EFFF'],['→','','','transparent'],['💻','Machine','les exécute','#E6F1FB'],['→','','','transparent'],['📊','Résultat','toujours identique','#E1F5EE']].map(([icon,title,sub,bg],i)=>(
              bg==='transparent' ? <span key={i} style={{fontSize:20,color:'#999'}}>→</span> : (
                <div key={i} style={{padding:'10px 14px',background:bg,borderRadius:12,textAlign:'center',minWidth:80}}>
                  <div style={{fontSize:22}}>{icon}</div>
                  <div style={{fontSize:12,fontWeight:700,marginTop:4}}>{title}</div>
                  <div style={{fontSize:11,color:'#666',marginTop:2}}>{sub}</div>
                </div>
              )
            ))}
          </div>
        </Card>
        <Card>
          <div style={{fontSize:13,color:'#444',lineHeight:1.7}}>
            <strong>Exemple :</strong> si telle condition est remplie → alors effectuer telle action. Dès 1890, IBM développait des machines à cartes perforées sur ce principe — trier, classer, gérer de grandes quantités d'information.
          </div>
        </Card>
      </Wrap>}

      {/* S2 — Decision tree */}
      {s === 2 && <Wrap onNext={catStep >= 3 ? next : undefined} canNext={catStep >= 3}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:6,color:'#1a1a2e'}}>🐱 Construis un arbre de décision</h3>
        <p style={{fontSize:13,color:'#666',marginBottom:16,lineHeight:1.6}}>Un système traditionnel classe cet animal en enchaînant des conditions. Réponds aux questions !</p>
        <div style={{textAlign:'center',fontSize:56,margin:'16px 0'}}>{catStep>=3?'🐱':'❓'}</div>
        {catStep < 3 ? (
          <Card color="#F8F9FF" border="#C5C0EF">
            <div style={{fontWeight:700,fontSize:18,textAlign:'center',marginBottom:16,color:'#1a1a2e'}}>
              {['A-t-il des poils ?','A-t-il des oreilles dressées ?','A-t-il une queue ?'][catStep]}
            </div>
            <div style={{display:'flex',gap:10}}>
              {['OUI 👍','NON 👎'].map((opt,i)=>(
                <button key={i} onClick={()=>setCatStep(s=>s+1)} style={{
                  flex:1, padding:'16px', borderRadius:14, fontWeight:800, fontSize:16,
                  border:'none', cursor:'pointer',
                  background: i===0?'#58CC02':'#FF4B4B', color:'white',
                  boxShadow: i===0?'0 4px 0 #3D8A00':'0 4px 0 #CC0000',
                }}>{opt}</button>
              ))}
            </div>
            <div style={{display:'flex',gap:6,justifyContent:'center',marginTop:14}}>
              {[0,1,2].map(i=><div key={i} style={{width:10,height:10,borderRadius:'50%',background:i<catStep?'#58CC02':'#E5E5E5',transition:'all .3s'}}/>)}
            </div>
          </Card>
        ) : (
          <div>
            <Card color="#D7FFB8" border="#58CC02">
              <div style={{fontWeight:800,fontSize:16,color:'#2B7400',marginBottom:8}}>✓ CHAT identifié !</div>
              <div style={{fontSize:13,color:'#2B7400',lineHeight:1.65}}>
                Poils ✓ → Oreilles ✓ → Queue ✓ → <strong>Résultat : Chat</strong>
              </div>
            </Card>
            <Card>
              <div style={{fontSize:12,color:'#666',lineHeight:1.7}}>💡 L'arbre est volontairement simplifié. L'idée fondamentale : <strong>toutes les règles ont été définies à l'avance par un humain.</strong> Pour des problèmes complexes (1000 espèces), cela devient vite ingérable.</div>
            </Card>
          </div>
        )}
      </Wrap>}

      {/* S3 — Binary */}
      {s === 3 && <Wrap onNext={next}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:12,color:'#1a1a2e'}}>Le 0 et le 1 — fondement du calcul</h3>
        <div style={{display:'flex',gap:12,justifyContent:'center',marginBottom:16}}>
          {[['0','Courant ne passe pas','🔴','#1a1a18','#9CA3AF'],['1','Courant passe','🟢','#1CB0F6','white']].map(([n,d,e,bg,tc],i)=>(
            <div key={i} style={{flex:1,padding:'20px 14px',background:bg,color:tc,borderRadius:16,textAlign:'center',boxShadow:'0 4px 12px rgba(0,0,0,0.15)'}}>
              <div style={{fontSize:44,fontWeight:900,marginBottom:4}}>{n}</div>
              <div style={{fontSize:18,marginBottom:6}}>{e}</div>
              <div style={{fontSize:12,opacity:0.8}}>{d}</div>
            </div>
          ))}
        </div>
        <Card color="#FFF9E6" border="#FFC800">
          <div style={{fontWeight:700,fontSize:13,color:'#8B5E00',marginBottom:6}}>⚠️ Attention à ne pas confondre</div>
          <div style={{fontSize:13,color:'#8B5E00',lineHeight:1.65}}>Le <strong>binaire (0/1)</strong> est le langage des circuits électroniques. Un <strong>arbre de décision (oui/non)</strong> est une structure logique de programme. Ce sont deux niveaux différents — un programme peut avoir des milliers d'options, toutes représentées en binaire.</div>
        </Card>
      </Wrap>}

      {/* S4 — Dog challenge */}
      {s === 4 && <Wrap onNext={dogAnswer!==null?next:undefined} canNext={dogAnswer!==null}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:10,color:'#1a1a2e'}}>🐶 Mini-défi !</h3>
        <Card color="#F8F9FF">
          <p style={{fontSize:14,color:'#444',lineHeight:1.7,marginBottom:0}}>Notre système reconnaît les chats. On lui présente maintenant un chien. <strong>Que se passe-t-il si la règle "a une queue" s'applique aussi au chien ?</strong></p>
        </Card>
        <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:4}}>
          {['Il le reconnaît correctement 😎','Il peut se tromper — les règles doivent être adaptées 🤔'].map((opt,i)=>(
            <button key={i} onClick={()=>setDogAnswer(i===1)} style={{
              padding:'16px 18px', borderRadius:14, border:`2.5px solid ${dogAnswer===(i===1)?'#1CB0F6':'#E5E5E5'}`,
              background:dogAnswer===(i===1)?'#E8F8FF':'white',
              cursor:'pointer', fontWeight:600, fontSize:14, color:'#1a1a2e', textAlign:'left',
            }}>{opt}</button>
          ))}
        </div>
        {dogAnswer!==null && (
          <Card color="#D7FFB8" border="#58CC02" style={{marginTop:12}}>
            <div style={{fontWeight:800,fontSize:14,color:'#2B7400',marginBottom:6}}>✓ Exactement !</div>
            <div style={{fontSize:13,color:'#2B7400',lineHeight:1.65}}>Un chien a aussi des poils, des oreilles et une queue. Sans règle supplémentaire (taille, forme du museau…), le système peut se tromper. <strong>Chaque nouvelle situation nécessite potentiellement de nouvelles règles.</strong></div>
          </Card>
        )}
      </Wrap>}

      {/* S5 — Advantages/limits */}
      {s === 5 && <Wrap onNext={next} nextLabel="Phase suivante →">
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:14,color:'#1a1a2e'}}>Bilan — Âge 1</h3>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{padding:18,background:'#D7FFB8',borderRadius:16,border:'2px solid #58CC02'}}>
            <div style={{fontWeight:800,fontSize:16,color:'#2B7400',marginBottom:8}}>👍 Avantage : la traçabilité</div>
            <p style={{fontSize:13,color:'#2B7400',lineHeight:1.7,margin:0}}>Puisque les règles sont explicites, on peut retracer exactement le chemin ayant conduit au résultat. Fondamental pour auditer un système et expliquer ses décisions.</p>
          </div>
          <div style={{padding:18,background:'#FFDFE0',borderRadius:16,border:'2px solid #FF4B4B'}}>
            <div style={{fontWeight:800,fontSize:16,color:'#CC0000',marginBottom:8}}>⚠️ Limite : la complexité</div>
            <p style={{fontSize:13,color:'#CC0000',lineHeight:1.7,margin:0}}>Pour des tâches perceptuelles (reconnaître une image, comprendre du langage), il faudrait des millions de règles impossibles à écrire manuellement.</p>
          </div>
        </div>
        <Card style={{marginTop:8}}>
          <div style={{fontSize:13,color:'#666',lineHeight:1.6}}>💡 Cette informatique est toujours omniprésente aujourd'hui : logiciels de comptabilité, GPS, systèmes de réservation — tout fonctionne sur ce principe.</div>
        </Card>
      </Wrap>}

      {/* S6 — Transition */}
      {s === 6 && <Wrap onNext={next} nextLabel="Découvrir le 2e âge →">
        <div style={{textAlign:'center',padding:'20px 0'}}>
          <div style={{fontSize:48,marginBottom:16}}>💭</div>
          <h3 style={{fontSize:22,fontWeight:900,marginBottom:14,color:'#1a1a2e',lineHeight:1.3}}>Et si on mettait directement l'expertise humaine dans la machine ?</h3>
          <p style={{fontSize:14,color:'#666',lineHeight:1.75}}>Plutôt que de programmer toutes les situations une par une, que se passerait-il si on <strong>formalisait le raisonnement complet d'un expert</strong> ?</p>
        </div>
      </Wrap>}

      {/* S7 — Expert systems intro */}
      {s === 7 && <Wrap onNext={next}>
        <PhaseTag bg="#FAEEDA" color="#633806">🧪 Âge 2 — Systèmes experts (1970-1980)</PhaseTag>
        <h2 style={{fontSize:24,fontWeight:900,marginBottom:12,color:'#1a1a2e'}}>« Mettons l'expert dans la machine. »</h2>
        <p style={{fontSize:14,color:'#444',lineHeight:1.75,marginBottom:14}}>Un <strong>ingénieur de la connaissance</strong> rencontre un médecin, un ingénieur, un technicien et transforme son expertise en connaissances exploitables.</p>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {[{icon:'📋',t:'Base de règles',d:'Les connaissances sous forme SI…ALORS… SI température > 38°C ET toux = oui → envisager diagnostic Y.',bg:'#FAEEDA',bc:'#EF9F27',tc:'#633806'},
            {icon:'📊',t:'Base de faits',d:'Les informations disponibles sur la situation actuelle : résultats d\'analyses, observations, données.',bg:'#E6F1FB',bc:'#85B7EB',tc:'#0C447C'},
            {icon:'⚙️',t:'Moteur d\'inférence',d:'Confronte les faits aux règles pour produire une conclusion. Le raisonnement reste explicable.',bg:'#E1F5EE',bc:'#5DCAA5',tc:'#085041'},
          ].map(({icon,t,d,bg,bc,tc})=>(
            <div key={t} style={{padding:14,background:bg,borderRadius:14,border:`2px solid ${bc}`}}>
              <div style={{fontWeight:700,fontSize:14,color:tc,marginBottom:6}}>{icon} {t}</div>
              <div style={{fontSize:13,color:tc,lineHeight:1.6}}>{d}</div>
            </div>
          ))}
        </div>
      </Wrap>}

      {/* S8 — Expert system game */}
      {s === 8 && <Wrap onNext={expertStep>=3?next:undefined} canNext={expertStep>=3}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:4,color:'#1a1a2e'}}>🎮 Tu es ingénieur de la connaissance</h3>
        <p style={{fontSize:13,color:'#666',marginBottom:16,lineHeight:1.6}}>Collecte les 3 composants du système expert en cliquant sur chaque question.</p>
        {[{t:'BASE DE RÈGLES',icon:'📋',q:'Demande à l\'expert : « Comment prenez-vous vos décisions ? »',a:'SI temp.>38,5°C ET toux ET test+ → Protocole A',bg:'#FAEEDA',tc:'#633806',bc:'#EF9F27'},
          {t:'BASE DE FAITS',icon:'📊',q:'Demande à l\'expert : « Sur quelles informations vous appuyez-vous ? »',a:'Temp: 39,2°C · Toux: sèche · Test: positif · Fatigue: oui',bg:'#E6F1FB',tc:'#0C447C',bc:'#85B7EB'},
          {t:'MOTEUR D\'INFÉRENCE',icon:'⚙️',q:'Comment relier faits et règles pour obtenir une conclusion ?',a:'[Fait: temp=39,2>38,5] + [Règle SI…] → CONCLUSION: Protocole A',bg:'#E1F5EE',tc:'#085041',bc:'#5DCAA5'},
        ].map((c,i)=>(
          <div key={i} style={{marginBottom:12}}>
            {expertStep>i ? (
              <div style={{padding:14,borderRadius:14,background:c.bg,border:`2px solid ${c.bc}`}}>
                <div style={{fontWeight:800,fontSize:13,color:c.tc,marginBottom:6}}>✓ {c.icon} {c.t}</div>
                <div style={{fontSize:12,color:c.tc,fontFamily:'monospace',background:'rgba(255,255,255,0.5)',padding:'8px 10px',borderRadius:8,lineHeight:1.5}}>{c.a}</div>
              </div>
            ) : (
              <button onClick={()=>setExpertStep(s=>s+1)} style={{
                width:'100%', padding:16, borderRadius:14,
                background:'white', border:'2.5px dashed #E5E5E5',
                cursor:'pointer', color:'#555', fontSize:13,
                fontWeight:600, textAlign:'left',
              }}>
                {['①','②','③'][i]} {c.q} →
              </button>
            )}
          </div>
        ))}
        {expertStep>=3 && <Card color="#D7FFB8" border="#58CC02"><div style={{fontWeight:700,fontSize:13,color:'#2B7400'}}>✓ FAITS + RÈGLES → ⚙️ MOTEUR → CONCLUSION — et le raisonnement est entièrement traçable !</div></Card>}
      </Wrap>}

      {/* S9 — Algorithm recipe */}
      {s === 9 && <Wrap onNext={next}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:12,color:'#1a1a2e'}}>🍳 L'algorithme, c'est comme une recette</h3>
        <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:10,alignItems:'center',marginBottom:14}}>
          {[{icon:'📖',t:'RECETTE',items:['Ingrédients','+ instructions','→ plat'],bg:'#F8F9FF'},
            null,
            {icon:'💻',t:'ALGORITHME',items:['Données','+ instructions','→ résultat'],bg:'#EEEDFE'},
          ].map((c,i)=> c ? (
            <div key={i} style={{padding:14,background:c.bg,borderRadius:14,textAlign:'center'}}>
              <div style={{fontSize:28,marginBottom:6}}>{c.icon}</div>
              <div style={{fontWeight:800,fontSize:12,marginBottom:6}}>{c.t}</div>
              {c.items.map(item=><div key={item} style={{fontSize:11,color:'#666',lineHeight:1.6}}>{item}</div>)}
            </div>
          ) : <div key={i} style={{textAlign:'center',fontSize:24,color:'#999'}}>=</div>)}
        </div>
        <Card color="#FFF9E6" border="#FFC800">
          <div style={{fontSize:13,color:'#8B5E00',lineHeight:1.65}}>⚠️ C'est une analogie pédagogique. Un algorithme est une <strong>procédure structurée et finie permettant de résoudre un problème</strong> — bien plus rigoureux que n'importe quelle recette de cuisine.</div>
        </Card>
      </Wrap>}

      {/* S10 — Deep Blue */}
      {s === 10 && <Wrap onNext={next} nextLabel="Phase suivante →">
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:14,color:'#1a1a2e'}}>♟️ Deep Blue — la spécialisation extrême</h3>
        <Card color="#F0F0F8" border="#3C3489">
          <div style={{display:'flex',gap:12,marginBottom:12}}>
            <div style={{fontSize:40}}>♟️</div>
            <div>
              <div style={{fontWeight:800,fontSize:16,color:'#1a1a2e'}}>Deep Blue vs Kasparov</div>
              <div style={{fontSize:13,color:'#666'}}>IBM, 1997 — 6 parties jouées</div>
            </div>
          </div>
          <p style={{fontSize:13,color:'#444',lineHeight:1.7,margin:0}}>Deep Blue bat le champion du monde d'échecs. Ce n'est pas un système expert classique : il combine recherche exhaustive dans l'arbre des coups, fonctions d'évaluation avec des grands maîtres, et matériel spécialisé.</p>
        </Card>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,margin:'14px 0'}}>
          <div style={{padding:16,background:'#D7FFB8',borderRadius:14,border:'2px solid #58CC02',textAlign:'center'}}>
            <div style={{fontWeight:700,fontSize:12,color:'#2B7400',marginBottom:6}}>Aux échecs ♟️</div>
            <div style={{fontSize:24}}>⭐⭐⭐⭐⭐</div>
            <div style={{fontSize:11,color:'#2B7400',marginTop:4}}>Champion mondial battu</div>
          </div>
          <div style={{padding:16,background:'#FFDFE0',borderRadius:14,border:'2px solid #FF4B4B',textAlign:'center'}}>
            <div style={{fontWeight:700,fontSize:12,color:'#CC0000',marginBottom:6}}>Pour les crêpes 🥞</div>
            <div style={{fontSize:22,fontWeight:800,color:'#CC0000'}}>0 %</div>
            <div style={{fontSize:11,color:'#CC0000',marginTop:4}}>Aucune compétence</div>
          </div>
        </div>
        <Card color="#1a1a2e">
          <div style={{fontWeight:700,fontSize:14,color:'white',textAlign:'center'}}>
            Une machine peut être extraordinaire dans un domaine précis <em style={{color:'#89E219'}}>sans</em> savoir faire autre chose.
          </div>
        </Card>
      </Wrap>}

      {/* S11 — Transition to neural networks */}
      {s === 11 && <Wrap onNext={next} nextLabel="Découvrir les réseaux →">
        <div style={{textAlign:'center',padding:'20px 0'}}>
          <div style={{fontSize:48,marginBottom:16}}>🤔</div>
          <h3 style={{fontSize:22,fontWeight:900,marginBottom:14,color:'#1a1a2e'}}>Et si nous arrêtions d'écrire toutes les règles à la main ?</h3>
          <div style={{padding:'16px 20px',background:'#1CB0F6',borderRadius:20,display:'inline-block',marginBottom:16}}>
            <p style={{fontSize:18,color:'white',fontWeight:800,margin:0}}>Et si la machine pouvait <em>apprendre</em> ?</p>
          </div>
          <p style={{fontSize:14,color:'#666',lineHeight:1.75}}>C'est le changement de paradigme fondamental des réseaux de neurones et du machine learning.</p>
        </div>
      </Wrap>}

      {/* S12 — Neural networks intro */}
      {s === 12 && <Wrap onNext={next}>
        <PhaseTag bg="#E6F1FB" color="#0C447C">🔗 Âge 3 — Réseaux de neurones</PhaseTag>
        <h2 style={{fontSize:24,fontWeight:900,marginBottom:14,color:'#1a1a2e'}}>« Et si la machine apprenait ? »</h2>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {[{y:'1943',t:'McCulloch & Pitts',d:'Premier modèle mathématique simplifié du neurone biologique'},
            {y:'1956',t:'Atelier de Dartmouth',d:'Le terme "intelligence artificielle" se répand'},
            {y:'1957-58',t:'Perceptron',d:'Rosenblatt développe le premier réseau de neurones apprenant'},
            {y:'1980-90s',t:'Rétropropagation',d:'Algorithme permettant d\'entraîner des réseaux multicouches — base du deep learning'},
            {y:'2012+',t:'Deep learning',d:'GPU + grandes données → explosion des performances'},
          ].map(({y,t,d},i)=>(
            <div key={i} style={{display:'flex',gap:12,padding:'10px 14px',background:'white',borderRadius:12,alignItems:'flex-start'}}>
              <div style={{minWidth:56,padding:'4px 6px',background:'#E6F1FB',color:'#0C447C',borderRadius:8,fontSize:10,fontWeight:800,textAlign:'center',flexShrink:0}}>{y}</div>
              <div><div style={{fontSize:13,fontWeight:700}}>{t}</div><div style={{fontSize:12,color:'#666',marginTop:2,lineHeight:1.5}}>{d}</div></div>
            </div>
          ))}
        </div>
      </Wrap>}

      {/* S13 — Brain vs network */}
      {s === 13 && <Wrap onNext={next}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:14,color:'#1a1a2e'}}>🧠 Cerveau vs Réseau artificiel</h3>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          {[{icon:'🧠',t:'CERVEAU BIOLOGIQUE',items:['~86 milliards de neurones','Synapses biologiques','Apprentissage par expérience','Consomme ~20W','Très difficile à observer'],bg:'#F8F8F8',bc:'#999',tc:'#1a1a2e'},
            {icon:'🔗',t:'RÉSEAU ARTIFICIEL',items:['Unités mathématiques','Connexions pondérées','Apprentissage par gradient','Nécessite des GPU','Entièrement observable'],bg:'#E6F1FB',bc:'#1CB0F6',tc:'#0C447C'}
          ].map(({icon,t,items,bg,bc,tc})=>(
            <div key={t} style={{padding:14,background:bg,borderRadius:14,border:`2px solid ${bc}`}}>
              <div style={{fontSize:28,marginBottom:6}}>{icon}</div>
              <div style={{fontWeight:800,fontSize:11,color:tc,marginBottom:8,textTransform:'uppercase',letterSpacing:0.5}}>{t}</div>
              {items.map(item=><div key={item} style={{fontSize:11,color:tc,marginBottom:3,lineHeight:1.4}}>· {item}</div>)}
            </div>
          ))}
        </div>
        <Card color="#FFDFE0" border="#FF4B4B">
          <div style={{fontWeight:800,fontSize:13,color:'#CC0000',marginBottom:4}}>⚠️ Important</div>
          <div style={{fontSize:13,color:'#990000',lineHeight:1.6}}>Un réseau de neurones artificiel <strong>n'est PAS un cerveau miniature</strong>. C'est une architecture mathématique librement inspirée de certaines intuitions biologiques. Un neurone artificiel est essentiellement une fonction mathématique.</div>
        </Card>
      </Wrap>}

      {/* S14 — Layers and weights */}
      {s === 14 && <Wrap onNext={next}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:12,color:'#1a1a2e'}}>Architecture : couches et poids</h3>
        <Card color="#F0F0F8">
          <div style={{fontSize:11,fontWeight:700,color:'#666',marginBottom:10,textTransform:'uppercase',letterSpacing:1}}>Réseau multicouche</div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:4}}>
            {[['📷','ENTRÉE','pixels'],['●●','COUCHE 1',''],['●●','COUCHE 2',''],['●●','COUCHE 3',''],['🎯','SORTIE','chat ?']].map(([icon,label,sub],i,arr)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:4,flex:1}}>
                {i>0&&<div style={{color:'#999',fontSize:14,flexShrink:0}}>→</div>}
                <div style={{flex:1,padding:'8px 4px',background:i===0||i===arr.length-1?'#1CB0F6':'white',borderRadius:10,textAlign:'center',border:`1.5px solid ${i===0||i===arr.length-1?'#1CB0F6':'#E5E5E5'}`}}>
                  <div style={{fontSize:16}}>{icon}</div>
                  <div style={{fontSize:9,fontWeight:700,color:i===0||i===arr.length-1?'white':'#1a1a2e',marginTop:2}}>{label}</div>
                  {sub&&<div style={{fontSize:8,color:i===0||i===arr.length-1?'rgba(255,255,255,0.8)':'#999'}}>{sub}</div>}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <div style={{display:'flex',alignItems:'flex-start',gap:14,padding:16,background:'white',borderRadius:14,border:'1.5px solid #E5E5E5',marginTop:12}}>
          <div style={{fontSize:32,flexShrink:0}}>🎚️</div>
          <div>
            <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Les poids = curseurs de volume</div>
            <div style={{fontSize:13,color:'#666',lineHeight:1.65}}>Chaque connexion entre neurones a un <strong>poids</strong> : une valeur qui détermine l'influence de ce signal. Au départ aléatoires, ces poids sont ajustés pendant l'apprentissage pour réduire les erreurs.</div>
          </div>
        </div>
      </Wrap>}

      {/* S15 — Cat learning */}
      {s === 15 && <Wrap onNext={next}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:4,color:'#1a1a2e'}}>🎮 Le réseau apprend à reconnaître un chat</h3>
        <p style={{fontSize:13,color:'#666',marginBottom:14,lineHeight:1.6}}>Au départ, les poids sont aléatoires. Le réseau fait des erreurs — et apprend de chacune.</p>
        {[{pred:'CAMION',pct:72,ok:false,note:'Poids aléatoires → réponse aléatoire'},
          {pred:'CHIEN',pct:58,ok:false,note:'Erreur mesurée → poids légèrement ajustés'},
          {pred:'FÉLIN (?) 🟡',pct:84,ok:false,note:'Amélioration — mais pas encore exact'},
          {pred:'CHAT ✅',pct:96,ok:true,note:'Après des millions d\'exemples → généralisation'},
        ].map((a,i)=>(
          <div key={i} style={{display:'flex',gap:12,padding:'12px 14px',background:a.ok?'#D7FFB8':'white',border:`2px solid ${a.ok?'#58CC02':'#E5E5E5'}`,borderRadius:12,marginBottom:8}}>
            <span style={{fontSize:24,flexShrink:0}}>🐱</span>
            <div style={{flex:1}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                <span style={{fontSize:14,fontWeight:700}}>→ {a.pred}</span>
                <span style={{fontSize:12,color:'#666'}}>{a.pct}%</span>
              </div>
              <div style={{height:6,background:'#E5E5E5',borderRadius:3,overflow:'hidden',marginBottom:5}}>
                <div style={{width:`${a.pct}%`,height:'100%',background:a.ok?'#58CC02':'#1CB0F6',borderRadius:3}}/>
              </div>
              <div style={{fontSize:11,color:'#888'}}>{a.note}</div>
            </div>
            <span style={{fontSize:18,flexShrink:0}}>{a.ok?'✅':'❌'}</span>
          </div>
        ))}
        <Card color="#E8F8FF" border="#1CB0F6">
          <div style={{fontSize:12,fontWeight:700,color:'#0C447C',marginBottom:4}}>🔄 La boucle d'apprentissage</div>
          <div style={{fontSize:13,color:'#0C447C',textAlign:'center',fontWeight:600}}>IMAGE → PRÉDICTION → ERREUR → AJUSTEMENT → RECOMMENCER</div>
        </Card>
      </Wrap>}

      {/* S16 — Backprop */}
      {s === 16 && <Wrap onNext={next}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:12,color:'#1a1a2e'}}>⚙️ Comment les poids sont-ils ajustés ?</h3>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{padding:16,background:'#E6F1FB',borderRadius:14,border:'2px solid #1CB0F6'}}>
            <div style={{fontWeight:800,fontSize:14,color:'#0C447C',marginBottom:8}}>→ Propagation avant</div>
            <div style={{fontSize:13,color:'#0C447C',lineHeight:1.65}}>L'image traverse le réseau couche par couche. À la fin : une prédiction ("chat 96%"). <strong>Tout se passe dans un seul sens.</strong></div>
          </div>
          <div style={{padding:16,background:'#FFDFE0',borderRadius:14,border:'2px solid #FF4B4B'}}>
            <div style={{fontWeight:800,fontSize:14,color:'#CC0000',marginBottom:8}}>← Rétropropagation</div>
            <div style={{fontSize:13,color:'#990000',lineHeight:1.65}}>L'erreur est calculée. L'algorithme <strong>remonte dans le réseau</strong> pour calculer la contribution de chaque poids à l'erreur. Via la descente de gradient, chaque poids est légèrement ajusté dans la bonne direction.</div>
          </div>
        </div>
        <Card style={{marginTop:8}}>
          <div style={{fontSize:13,color:'#444',lineHeight:1.65}}>Ce processus est répété <strong>des millions, parfois des milliards de fois</strong>. Un grand modèle comme GPT peut nécessiter des semaines d'entraînement sur des milliers de GPU.</div>
        </Card>
      </Wrap>}

      {/* S17 — Generalization */}
      {s === 17 && <Wrap onNext={next}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:10,color:'#1a1a2e'}}>🎯 L'objectif : la généralisation</h3>
        <p style={{fontSize:14,color:'#444',lineHeight:1.7,marginBottom:14}}>Un modèle qui mémorise ses exemples d'entraînement est inutile. L'enjeu est qu'il <strong>généralise</strong> à des situations jamais vues.</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[['🐈','Chat noir','jamais vu en entraînement'],['🐈‍⬛','Chat de nuit','jamais vu'],['🐱','Chat de côté','jamais vu'],['😺','Chat stylisé','jamais vu']].map(([icon,label,note],i)=>(
            <div key={i} style={{padding:14,background:'#D7FFB8',border:'2px solid #58CC02',borderRadius:14,textAlign:'center'}}>
              <div style={{fontSize:30}}>{icon}</div>
              <div style={{fontSize:12,fontWeight:700,color:'#2B7400',marginTop:5}}>{label}</div>
              <div style={{fontSize:10,color:'#3D8A00',marginTop:3}}>{note}</div>
              <div style={{fontSize:12,fontWeight:800,color:'#2B7400',marginTop:6}}>CHAT ✓ (96%)</div>
            </div>
          ))}
        </div>
        <Card style={{marginTop:12}}>
          <div style={{fontSize:13,color:'#444',lineHeight:1.65}}>La qualité d'un modèle se mesure sur un <strong>jeu de test</strong> : des exemples que le modèle n'a jamais vus pendant l'entraînement.</div>
        </Card>
      </Wrap>}

      {/* S18 — Big comparison */}
      {s === 18 && <Wrap onNext={next}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:14,color:'#1a1a2e',textAlign:'center'}}>Le grand changement de paradigme</h3>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <div style={{padding:18,background:'#F0F0F0',borderRadius:16}}>
            <div style={{fontWeight:800,fontSize:12,color:'#666',marginBottom:10,textTransform:'uppercase',letterSpacing:1}}>💻 Avant</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',fontSize:13}}>
              <div style={{padding:'8px 14px',background:'white',borderRadius:20,border:'1.5px solid #E5E5E5',fontWeight:600}}>Données + Règles humaines</div>
              <span style={{color:'#999'}}>→</span>
              <div style={{padding:'8px 14px',background:'#D7FFB8',borderRadius:20,fontWeight:600,color:'#2B7400'}}>Résultat</div>
            </div>
            <div style={{fontSize:12,color:'#888',marginTop:8}}>L'humain écrit toutes les règles.</div>
          </div>
          <div style={{textAlign:'center',fontSize:28}}>⚡</div>
          <div style={{padding:18,background:'#E8F8FF',borderRadius:16,border:'2.5px solid #1CB0F6'}}>
            <div style={{fontWeight:800,fontSize:12,color:'#0C447C',marginBottom:10,textTransform:'uppercase',letterSpacing:1}}>🔗 Après — Machine Learning</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',fontSize:13}}>
              <div style={{padding:'8px 14px',background:'white',borderRadius:20,border:'1.5px solid #1CB0F6',fontWeight:600}}>Données + Objectif + Architecture</div>
              <span style={{color:'#1CB0F6'}}>→</span>
              <div style={{padding:'8px 14px',background:'#1CB0F6',color:'white',borderRadius:20,fontWeight:700}}>Modèle appris</div>
            </div>
            <div style={{fontSize:12,color:'#0C447C',marginTop:8}}>Le réseau <strong>apprend ses propres règles (paramètres)</strong> à partir des exemples.</div>
          </div>
        </div>
      </Wrap>}

      {/* S19 — Black box */}
      {s === 19 && <Wrap onNext={bbAnswer!==null?next:undefined} canNext={bbAnswer!==null} nextLabel="Phase suivante →">
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:14,color:'#1a1a2e'}}>🔲 Le problème de la boîte noire</h3>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
          <div style={{padding:14,background:'#D7FFB8',borderRadius:14,border:'2px solid #58CC02',textAlign:'center'}}>
            <div style={{fontSize:28,marginBottom:6}}>✨</div>
            <div style={{fontWeight:700,fontSize:13,color:'#2B7400'}}>On gagne</div>
            <div style={{fontSize:12,color:'#2B7400',marginTop:4}}>La capacité d'apprendre</div>
          </div>
          <div style={{padding:14,background:'#FFDFE0',borderRadius:14,border:'2px solid #FF4B4B',textAlign:'center'}}>
            <div style={{fontSize:28,marginBottom:6}}>🔲</div>
            <div style={{fontWeight:700,fontSize:13,color:'#CC0000'}}>On perd</div>
            <div style={{fontSize:12,color:'#CC0000',marginTop:4}}>L'explicabilité</div>
          </div>
        </div>
        <Card>
          <div style={{fontStyle:'italic',fontSize:14,marginBottom:10,color:'#1a1a2e'}}>« Pourquoi ma candidature a-t-elle été rejetée par le système IA ? »</div>
          <div style={{padding:10,background:'#F0F0F0',borderRadius:8,fontFamily:'monospace',fontSize:12,color:'#666'}}>w₂₃₇ × 0.728 + w₄₁₅ × -1.234 … = -0.43 → REJETÉ</div>
        </Card>
        <div style={{fontWeight:700,fontSize:14,margin:'16px 0 10px'}}>C'est une explication satisfaisante pour le candidat ?</div>
        <div style={{display:'flex',gap:10}}>
          {['Oui, c\'est suffisant 🤷','Non, pas du tout 😤'].map((opt,i)=>(
            <button key={i} onClick={()=>setBbAnswer(i===1)} style={{flex:1,padding:'14px',borderRadius:14,border:`2.5px solid ${bbAnswer===(i===1)?'#1CB0F6':'#E5E5E5'}`,background:bbAnswer===(i===1)?'#E8F8FF':'white',cursor:'pointer',fontWeight:600,fontSize:13,color:'#1a1a2e'}}>{opt}</button>
          ))}
        </div>
        {bbAnswer!==null && <Card color="#D7FFB8" border="#58CC02" style={{marginTop:12}}><div style={{fontWeight:700,fontSize:13,color:'#2B7400',marginBottom:4}}>✓ Exactement !</div><div style={{fontSize:13,color:'#2B7400',lineHeight:1.65}}>C'est le défi de l'explicabilité. Il existe tout un domaine de recherche dédié à l'<strong>IA explicable (XAI)</strong> pour approcher ce problème.</div></Card>}
      </Wrap>}

      {/* S20 — Transition to GenAI */}
      {s === 20 && <Wrap onNext={next} nextLabel="Découvrir l'IA générative →">
        <div style={{textAlign:'center',padding:'16px 0'}}>
          <h3 style={{fontSize:20,fontWeight:900,marginBottom:18,color:'#1a1a2e'}}>Les conditions de l'IA générative</h3>
          {[['🌐','Internet','Milliards de textes, images, données'],['📚','Big Data','Volumes sans précédent'],['⚡','GPU & Cloud','Calcul massivement parallèle'],['🔀','Transformer (2017)','Nouvelle architecture révolutionnaire'],['✨','IA GÉNÉRATIVE','Des modèles capables de créer']].map(([icon,label,sub],i,arr)=>(
            <div key={i}>
              <div style={{display:'inline-flex',alignItems:'center',gap:12,padding:'10px 20px',background:i===arr.length-1?'#1a1a2e':'white',borderRadius:14,color:i===arr.length-1?'white':'#1a1a2e',border:i===arr.length-1?'none':'1.5px solid #E5E5E5',marginBottom:4}}>
                <span style={{fontSize:18}}>{icon}</span>
                <div style={{textAlign:'left'}}><div style={{fontSize:13,fontWeight:700}}>{label}</div><div style={{fontSize:11,color:i===arr.length-1?'rgba(255,255,255,0.7)':'#888'}}>{sub}</div></div>
              </div>
              {i<arr.length-1&&<div style={{color:'#999',fontSize:14,lineHeight:1}}>↓</div>}
            </div>
          ))}
        </div>
      </Wrap>}

      {/* S21 — Gen AI intro */}
      {s === 21 && <Wrap onNext={next}>
        <PhaseTag bg="#FBEAF0" color="#72243E">✨ Âge 4 — IA Générative</PhaseTag>
        <h2 style={{fontSize:22,fontWeight:900,marginBottom:12,color:'#1a1a2e'}}>La machine ne reconnaît plus seulement. Elle <em>crée</em>.</h2>
        <p style={{fontSize:13,color:'#444',lineHeight:1.75,marginBottom:14}}>L'IA générative existait avant ChatGPT. Ce qui a changé, c'est l'<strong>échelle</strong> : des réseaux entraînés sur des volumes de données sans précédent. On se concentre sur les <strong>LLM</strong> — Large Language Models.</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[['🔤','1. TOKENS','L\'unité de base','#EEEDFE','#3C3489'],['🎲','2. PROBABILITÉS','Comment le texte est généré','#FAEEDA','#633806'],['📍','3. VECTEURS','Comment le sens est représenté','#E6F1FB','#0C447C'],['👁️','4. ATTENTION','Comment le contexte est traité','#E1F5EE','#085041']].map(([icon,t,sub,bg,tc])=>(
            <div key={t} style={{padding:14,background:bg,borderRadius:14,textAlign:'center'}}>
              <div style={{fontSize:24,marginBottom:5}}>{icon}</div>
              <div style={{fontSize:12,fontWeight:800,color:tc}}>{t}</div>
              <div style={{fontSize:11,color:tc,marginTop:3,opacity:0.8}}>{sub}</div>
            </div>
          ))}
        </div>
      </Wrap>}

      {/* S22 — Tokens */}
      {s === 22 && <Wrap onNext={next}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:8,color:'#1a1a2e'}}>🔤 1. Les tokens</h3>
        <p style={{fontSize:13,color:'#666',lineHeight:1.65,marginBottom:14}}>Quand vous tapez un texte, le modèle commence par le <strong>découper en tokens</strong> : des unités élémentaires qu'il va manipuler.</p>
        <Card color="#F8F5FF" border="#C5C0EF">
          <div style={{fontSize:11,fontWeight:700,color:'#3C3489',marginBottom:8,textTransform:'uppercase',letterSpacing:1}}>Tokenisation de « Bonjour le monde ! »</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {[['Bon','#EEEDFE','#3C3489'],['jour','#E6F1FB','#0C447C'],[',','#FAEEDA','#633806'],['le','#E1F5EE','#085041'],['monde','#FBEAF0','#72243E'],['!','#EAF3DE','#27500A']].map(([t,bg,tc],i)=>(
              <div key={i} style={{padding:'8px 14px',background:bg,borderRadius:10,fontWeight:700,fontSize:15,color:tc,fontFamily:'monospace'}}>{t}</div>
            ))}
          </div>
          <div style={{fontSize:11,color:'#666',marginTop:8}}>6 tokens pour 4 mots — le découpage dépend du système de tokenisation.</div>
        </Card>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:10}}>
          <Card>
            <div style={{fontWeight:600,fontSize:13,marginBottom:4}}>Pourquoi pas des mots entiers ?</div>
            <div style={{fontSize:12,color:'#666',lineHeight:1.6}}>Certains mots rares seraient absents du vocabulaire. Découper en sous-unités permet de traiter n'importe quel texte avec un vocabulaire fini (~50.000 tokens pour les grands modèles).</div>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:13,marginBottom:4}}>Génération token par token</div>
            <div style={{fontSize:12,color:'#666',lineHeight:1.6}}>Le modèle génère le texte UN token à la fois. Il calcule les probabilités, choisit un token, l'ajoute au contexte, recommence. C'est pourquoi le texte apparaît progressivement.</div>
          </Card>
        </div>
      </Wrap>}

      {/* S23 — Marble bag */}
      {s === 23 && <Wrap onNext={marbles.length>=6?next:undefined} canNext={marbles.length>=6}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:4,color:'#1a1a2e'}}>🎲 2. Les probabilités — le sac de billes</h3>
        <p style={{fontSize:13,color:'#666',marginBottom:14,lineHeight:1.65}}>Comment le modèle choisit-il le prochain token ? Une intuition simple d'abord.</p>
        <div style={{padding:20,background:'white',borderRadius:16,border:'1.5px solid #E5E5E5',textAlign:'center',marginBottom:14}}>
          <div style={{fontSize:52,marginBottom:8}}>🎒</div>
          <div style={{fontSize:14,color:'#444',marginBottom:4,fontWeight:600}}>Sac opaque : billes rouges 🔴 et vertes 🟢</div>
          <div style={{fontSize:13,color:'#666',marginBottom:14}}>Quelle est la probabilité que la prochaine soit rouge ?</div>
          {marbles.length<6 ? (
            <button onClick={()=>setMarbles(m=>[...m,'🔴'])} style={{padding:'14px 28px',background:'#FF4B4B',color:'white',border:'none',borderRadius:12,fontWeight:800,cursor:'pointer',fontSize:15,boxShadow:'0 4px 0 #CC0000'}}>
              Piocher ({6-marbles.length} restantes)
            </button>
          ) : <div style={{fontSize:16,fontWeight:800,color:'#58CC02'}}>✓ 6 tirages effectués !</div>}
        </div>
        {marbles.length>0 && (
          <div>
            <div style={{fontSize:28,letterSpacing:6,textAlign:'center',marginBottom:10}}>{marbles.join(' ')}</div>
            <Card color={marbles.length>=6?'#D7FFB8':'#F8F9FF'} border={marbles.length>=6?'#58CC02':'#E5E5E5'}>
              <div style={{fontSize:13,lineHeight:1.65,color:marbles.length>=6?'#2B7400':'#444'}}>
                {marbles.length<6?'Continue à piocher…':`${marbles.filter(m=>m==='🔴').length} rouges sur 6 tirages. Ces observations modifient ton estimation ! C'est la <strong>probabilité conditionnelle</strong> : P(rouge | j'ai observé X rouges) ≠ P(rouge) sans observation.`}
              </div>
            </Card>
            {marbles.length>=6&&<div style={{marginTop:8,padding:10,background:'#F8F9FF',borderRadius:10,fontSize:12,color:'#888',lineHeight:1.5}}>💡 Analogie pédagogique — un LLM ne met pas ses tokens dans un sac. Il calcule des distributions de probabilités sur des dizaines de milliers de tokens.</div>}
          </div>
        )}
      </Wrap>}

      {/* S24 — Word prediction */}
      {s === 24 && <Wrap onNext={wordChoice!==null?next:undefined} canNext={wordChoice!==null}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:4,color:'#1a1a2e'}}>🎮 La prédiction en action</h3>
        <p style={{fontSize:13,color:'#666',marginBottom:16,lineHeight:1.6}}>Quel token suit naturellement ce contexte ? Le modèle calcule une probabilité pour chaque option.</p>
        <div style={{padding:'20px',background:'#1a1a2e',borderRadius:16,textAlign:'center',marginBottom:18}}>
          <h3 style={{fontSize:26,fontWeight:900,color:'white',margin:0,letterSpacing:-0.5}}>Bonjour, comment ça…</h3>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[{t:'🐘 éléphant',p:0,ok:false},{t:'👍 va',p:78,ok:true},{t:'💻 ordinateur',p:2,ok:false},{t:'🥫 mayonnaise',p:1,ok:false}].map((w,i)=>(
            <button key={i} onClick={()=>setWordChoice(i)} style={{
              padding:'16px 12px', borderRadius:14, fontWeight:700, fontSize:14,
              cursor:wordChoice===null?'pointer':'default',
              border:`2.5px solid ${wordChoice===null?'#E5E5E5':w.ok?'#58CC02':i===wordChoice?'#FF4B4B':'#E5E5E5'}`,
              background:wordChoice===null?'white':w.ok?'#D7FFB8':i===wordChoice?'#FFDFE0':'white',
              color:'#1a1a2e', transition:'all .15s',
            }}>
              <div>{w.t}</div>
              {wordChoice!==null&&<div style={{fontSize:11,marginTop:5,color:w.ok?'#2B7400':'#999',fontWeight:600}}>{w.ok?`${w.p}% de probabilité`:'peu probable'}</div>}
            </button>
          ))}
        </div>
        {wordChoice!==null&&<Card color="#D7FFB8" border="#58CC02" style={{marginTop:14}}><div style={{fontSize:13,color:'#2B7400',lineHeight:1.65}}><strong>Le modèle ne "comprend" pas la phrase</strong> comme un humain. Il calcule des distributions de probabilités sur des dizaines de milliers de tokens, à partir des patterns appris pendant l'entraînement. Token après token, une phrase entière se construit.</div></Card>}
      </Wrap>}

      {/* S25 — Rabbit */}
      {s === 25 && <Wrap onNext={rabbitCtx!==null?next:undefined} canNext={rabbitCtx!==null}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:10,color:'#1a1a2e'}}>🐰 3. Le défi du lapin</h3>
        <div style={{padding:'16px',background:'#1a1a2e',borderRadius:16,textAlign:'center',marginBottom:16}}>
          <div style={{fontSize:18,fontWeight:800,color:'white'}}>« Qu'est-ce que je fais de mon lapin ? »</div>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.6)',marginTop:4}}>Exactement la même phrase. Deux contextes radicalement différents.</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          {[{icon:'👦🎄🧸',label:'Enfant + Noël\n+ peluche',ctx:0,bg:'#E6F1FB',bc:'#1CB0F6',tc:'#0C447C'},
            {icon:'🏹🐇🍳',label:'Chasseur + forêt\n+ gibier',ctx:1,bg:'#FAEEDA',bc:'#EF9F27',tc:'#633806'}].map(({icon,label,ctx,bg,bc,tc})=>(
            <button key={ctx} onClick={()=>setRabbitCtx(ctx)} style={{
              padding:18, borderRadius:16,
              border:`2.5px solid ${rabbitCtx===ctx?bc:'#E5E5E5'}`,
              background:rabbitCtx===ctx?bg:'white',
              cursor:'pointer', textAlign:'center',
            }}>
              <div style={{fontSize:32,marginBottom:8}}>{icon}</div>
              <div style={{fontSize:13,fontWeight:700,color:rabbitCtx===ctx?tc:'#1a1a2e',whiteSpace:'pre-line',lineHeight:1.4}}>{label}</div>
            </button>
          ))}
        </div>
        {rabbitCtx!==null&&<Card color="#D7FFB8" border="#58CC02"><div style={{fontWeight:700,color:'#2B7400',marginBottom:4}}>✓ Le contexte change tout !</div><div style={{fontSize:13,color:'#2B7400',lineHeight:1.65}}>Le même mot "lapin" prend un sens complètement différent selon le contexte. C'est précisément ce que les <strong>vecteurs contextuels</strong> permettent de capturer.</div></Card>}
      </Wrap>}

      {/* S26 — Vectors */}
      {s === 26 && <Wrap onNext={next}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:8,color:'#1a1a2e'}}>📍 4. Les vecteurs — carte mathématique du sens</h3>
        <p style={{fontSize:13,color:'#444',lineHeight:1.65,marginBottom:12}}>Les tokens sont transformés en <strong>vecteurs</strong> : des séries de coordonnées dans un espace à des centaines de dimensions. Le sens est encodé géométriquement.</p>
        <Card color="#F0F0F8" border="#C5C0EF">
          <div style={{fontSize:11,fontWeight:700,color:'#3C3489',marginBottom:10,textTransform:'uppercase',letterSpacing:1}}>Même mot, vecteurs différents</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div style={{padding:'12px 14px',background:'#E6F1FB',borderRadius:10,fontSize:13,color:'#0C447C'}}>
              <strong>👦 + 🎄 + 🧸 + lapin</strong> → vecteur orienté vers "jouet, enfance, affection"
            </div>
            <div style={{textAlign:'center',fontSize:12,color:'#999'}}>≠ sens différent</div>
            <div style={{padding:'12px 14px',background:'#FAEEDA',borderRadius:10,fontSize:13,color:'#633806'}}>
              <strong>🏹 + 🐇 + 🍳 + lapin</strong> → vecteur orienté vers "gibier, chasse, cuisine"
            </div>
          </div>
        </Card>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:10}}>
          {[{t:'Proximité = similarité',d:'"Chat" et "chaton" ont des vecteurs proches. "Chat" et "marteau" sont loin. Le sens est une géométrie.'},
            {t:'Arithmetic of meaning',d:'Dans certains espaces : roi — homme + femme ≈ reine. Les relations sémantiques sont mathématiques.'},
          ].map(({t,d})=>(
            <Card key={t}>
              <div style={{fontWeight:600,fontSize:13,marginBottom:4}}>{t}</div>
              <div style={{fontSize:12,color:'#666',lineHeight:1.6}}>{d}</div>
            </Card>
          ))}
        </div>
        <div style={{padding:10,background:'#F8F9FF',borderRadius:10,fontSize:12,color:'#888',marginTop:4}}>⚠️ Il n'existe pas un "vecteur doudou" préprogrammé. Ce sont des représentations mathématiques <em>apprises</em> par le modèle à partir de milliards de textes.</div>
      </Wrap>}

      {/* S27 — GPT reveal */}
      {s === 27 && <Wrap onNext={gptReveal>=3?next:undefined} canNext={gptReveal>=3}>
        <div style={{textAlign:'center',marginBottom:20}}>
          <h3 style={{fontSize:40,fontWeight:900,letterSpacing:8,color:'#1a1a2e',marginBottom:6}}>GPT</h3>
          <p style={{fontSize:13,color:'#999'}}>Appuie sur chaque lettre pour la révéler</p>
        </div>
        {[{l:'G',w:'Generative',d:'Le modèle génère du contenu nouveau — texte, images, code — il ne se contente pas de classer.',bg:'#FBEAF0',bc:'#F0997B',tc:'#72243E'},
          {l:'P',w:'Pre-trained',d:'Pré-entraîné sur d\'énormes corpus (internet, livres, code…) avant d\'être affiné pour des usages spécifiques.',bg:'#FAEEDA',bc:'#EF9F27',tc:'#633806'},
          {l:'T',w:'Transformer',d:'L\'architecture du réseau — introduite en 2017 dans le papier "Attention is all you need". C\'est là que tout a changé.',bg:'#E6F1FB',bc:'#1CB0F6',tc:'#0C447C'},
        ].map((item,i)=>(
          <div key={i} onClick={()=>gptReveal===i&&setGptReveal(i+1)} style={{
            display:'flex', gap:14, alignItems:'flex-start',
            padding:'16px', background:gptReveal>i?item.bg:'white',
            border:`2.5px solid ${gptReveal>i?item.bc:'#E5E5E5'}`,
            borderRadius:16, marginBottom:10,
            cursor:gptReveal===i?'pointer':'default', transition:'all .2s',
          }}>
            <div style={{
              width:48, height:48, borderRadius:14, flexShrink:0,
              background:gptReveal>i?item.tc:'#F0F0F0',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:900, fontSize:24, color:gptReveal>i?'white':'#CCC',
            }}>{item.l}</div>
            {gptReveal>i ? (
              <div>
                <div style={{fontWeight:800,fontSize:16,color:item.tc,marginBottom:4}}>{item.w}</div>
                <div style={{fontSize:13,color:item.tc,lineHeight:1.65}}>{item.d}</div>
              </div>
            ) : <div style={{paddingTop:12,fontSize:14,color:'#CCC',fontStyle:'italic'}}>Appuie pour révéler…</div>}
          </div>
        ))}
      </Wrap>}

      {/* S28 — Attention */}
      {s === 28 && <Wrap onNext={next} nextLabel="Phase suivante →">
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:8,color:'#1a1a2e'}}>👁️ L'Attention — le cœur du Transformer</h3>
        <p style={{fontSize:13,color:'#666',lineHeight:1.65,marginBottom:14}}>Le mécanisme d'attention permet au modèle de savoir <strong>quelles parties du contexte sont importantes</strong> pour comprendre chaque élément.</p>
        <Card color="#F0F0F8" border="#C5C0EF">
          <div style={{fontSize:11,fontWeight:700,color:'#3C3489',marginBottom:10,textTransform:'uppercase',letterSpacing:1}}>Exemple : comprendre "lui"</div>
          <div style={{fontSize:15,lineHeight:2.2,fontStyle:'italic',marginBottom:12}}>
            « <span style={{background:'#FFE8A3',padding:'2px 6px',borderRadius:6}}>L'enfant</span>{' '}prend{' '}
            <span style={{background:'#B8EAFF',padding:'2px 6px',borderRadius:6}}>son lapin</span>{' '}
            avant d'aller dormir avec{' '}
            <span style={{background:'#EEEDFE',padding:'4px 8px',borderRadius:6,fontWeight:800,border:'2px solid #534AB7'}}>lui</span>. »
          </div>
          <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
            {[['L\'enfant','45%','#FFE8A3','#8B5E00'],['son lapin','28%','#B8EAFF','#0C447C'],['prend','5%','#F0F0F0','#888'],['avant','4%','#F0F0F0','#888'],['dormir','4%','#F0F0F0','#888']].map(([t,p,bg,tc])=>(
              <div key={t} style={{padding:'6px 10px',background:bg,borderRadius:20,fontSize:12,fontWeight:600,color:tc}}>{t} {p}</div>
            ))}
          </div>
          <div style={{fontSize:12,color:'#666'}}>Pour comprendre "lui", le modèle regarde surtout "enfant" (45%) et "lapin" (28%).</div>
        </Card>
        <Card style={{marginTop:10}}>
          <div style={{fontSize:12,fontWeight:600,textAlign:'center',color:'#444'}}>
            TOKENS → VECTEURS → <strong style={{color:'#534AB7'}}>ATTENTION</strong> → RÉSEAU → PROBABILITÉS → <strong>LLM</strong>
          </div>
        </Card>
      </Wrap>}

      {/* S29 — Agents */}
      {s === 29 && <Wrap onNext={next}>
        <PhaseTag bg="#EAF3DE" color="#27500A">🤖 Et maintenant ?</PhaseTag>
        <h3 style={{fontSize:20,fontWeight:900,marginBottom:14,color:'#1a1a2e'}}>Du chatbot à l'agent IA</h3>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <div style={{padding:16,background:'#F0F0F0',borderRadius:16}}>
            <div style={{fontSize:28,marginBottom:6}}>💬</div>
            <div style={{fontWeight:800,fontSize:13,marginBottom:8}}>CHATBOT</div>
            {['Question →','Réponse','Question →','Réponse'].map((t,i)=><div key={i} style={{fontSize:12,color:'#666',marginBottom:2}}>{t}</div>)}
            <div style={{fontSize:11,color:'#999',marginTop:6,fontStyle:'italic'}}>L'utilisateur initie chaque action</div>
          </div>
          <div style={{padding:16,background:'#EAF3DE',borderRadius:16,border:'2px solid #97C459'}}>
            <div style={{fontSize:28,marginBottom:6}}>🤖</div>
            <div style={{fontWeight:800,fontSize:13,marginBottom:8,color:'#27500A'}}>AGENT IA</div>
            {['📋 Objectif','🧠 Planifie','🔧 Utilise un outil','⚡ Agit','📊 Évalue','🔁 Continue…'].map((t,i)=><div key={i} style={{fontSize:12,color:'#27500A',marginBottom:2}}>{t}</div>)}
          </div>
        </div>
        <Card>
          <div style={{fontSize:13,color:'#444',lineHeight:1.65}}>Exemple : au lieu de demander "quel est mon agenda ?" et copier-coller — un agent peut consulter le calendrier, rédiger l'email de convocation et l'envoyer, sans intervention à chaque étape. Son autonomie dépend des autorisations accordées.</div>
        </Card>
      </Wrap>}

      {/* S30 — World models */}
      {s === 30 && <Wrap onNext={next} nextLabel="Voir la synthèse →">
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:10,color:'#1a1a2e'}}>🌍 World Models</h3>
        <div style={{padding:16,background:'#1a1a2e',borderRadius:16,textAlign:'center',marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:700,color:'white',lineHeight:1.5}}>Comprendre des milliards de textes suffit-il vraiment pour comprendre le monde ?</div>
        </div>
        <p style={{fontSize:13,color:'#444',lineHeight:1.7,marginBottom:12}}>Yann LeCun et d'autres chercheurs défendent l'idée que les LLM ont une limite : ils apprennent du texte, alors qu'un humain apprend du monde de manière <strong>physique, sensorielle et causale</strong>.</p>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:14}}>
          {[['👁️','Vision'],['✋','Toucher'],['🌍','Espace 3D'],['⏱️','Temps'],['🧱','Physique'],['➡️','Causalité']].map(([icon,label])=>(
            <div key={label} style={{padding:'8px 14px',background:'white',borderRadius:20,fontSize:13,display:'flex',gap:6,alignItems:'center',border:'1.5px solid #E5E5E5'}}>
              <span>{icon}</span><span style={{fontWeight:500}}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <Card color="#F0F0F8" border="#C5C0EF">
            <div style={{fontSize:12,fontWeight:700,color:'#3C3489',marginBottom:4}}>LLM actuel — question posée</div>
            <div style={{fontFamily:'monospace',fontSize:13,color:'#3C3489'}}>P(token suivant | contexte textuel)</div>
          </Card>
          <div style={{textAlign:'center',fontSize:20}}>↓ ambition</div>
          <Card color="#EAF3DE" border="#97C459">
            <div style={{fontSize:12,fontWeight:700,color:'#27500A',marginBottom:4}}>World Model — ambition</div>
            <div style={{fontFamily:'monospace',fontSize:13,color:'#27500A'}}>P(état suivant | état actuel + action)</div>
          </Card>
        </div>
      </Wrap>}

      {/* S31 — Summary + quiz prompt */}
      {s >= 31 && <Wrap onNext={s<36?next:()=>setStep(TOTAL_LEARNING)} nextLabel={s<36?'Suite →':'Lancer le quiz →'}>
        {s===31 && <>
          <h3 style={{fontSize:20,fontWeight:900,marginBottom:18,textAlign:'center',color:'#1a1a2e'}}>Synthèse des 4 âges</h3>
          <p style={{fontSize:13,color:'#666',lineHeight:1.65,marginBottom:14,textAlign:'center'}}>Voici les 4 grandes transitions qui ont changé la façon dont nous demandons aux machines de résoudre des problèmes.</p>
        </>}
        {s===31 && [
          {icon:'💻',n:'1',t:'Informatique traditionnelle',b:"L'humain écrit toutes les règles. La machine les exécute. Traçable mais limité aux situations anticipées.",bg:'#EEEDFE',c:'#3C3489'},
        ].map(({icon,n,t,b,bg,c})=>(
          <div key={n} style={{display:'flex',gap:12,padding:'14px 16px',background:bg,borderRadius:14,marginBottom:10}}>
            <div style={{minWidth:30,height:30,borderRadius:'50%',background:c,color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0}}>{n}</div>
            <div><div style={{fontWeight:800,fontSize:13,color:c}}>{icon} {t}</div><div style={{fontSize:12,color:c,marginTop:4,lineHeight:1.55}}>{b}</div></div>
          </div>
        ))}
        {s===32 && [
          {icon:'🧪',n:'2',t:'Systèmes experts',b:"L'humain formalise l'expertise en base de règles + faits. Un moteur d'inférence les applique. Raisonnement explicable mais domaine unique.",bg:'#FAEEDA',c:'#633806'},
        ].map(({icon,n,t,b,bg,c})=>(
          <div key={n} style={{display:'flex',gap:12,padding:'14px 16px',background:bg,borderRadius:14,marginBottom:10}}>
            <div style={{minWidth:30,height:30,borderRadius:'50%',background:c,color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0}}>{n}</div>
            <div><div style={{fontWeight:800,fontSize:13,color:c}}>{icon} {t}</div><div style={{fontSize:12,color:c,marginTop:4,lineHeight:1.55}}>{b}</div></div>
          </div>
        ))}
        {s===33 && [
          {icon:'🔗',n:'3',t:'Réseaux de neurones',b:"La machine apprend ses paramètres à partir de données et d'un objectif. Généralisation puissante mais boîte noire.",bg:'#E6F1FB',c:'#0C447C'},
        ].map(({icon,n,t,b,bg,c})=>(
          <div key={n} style={{display:'flex',gap:12,padding:'14px 16px',background:bg,borderRadius:14,marginBottom:10}}>
            <div style={{minWidth:30,height:30,borderRadius:'50%',background:c,color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0}}>{n}</div>
            <div><div style={{fontWeight:800,fontSize:13,color:c}}>{icon} {t}</div><div style={{fontSize:12,color:c,marginTop:4,lineHeight:1.55}}>{b}</div></div>
          </div>
        ))}
        {s===34 && [
          {icon:'✨',n:'4',t:'IA générative',b:"De très grands réseaux génèrent de nouveaux contenus. Tokens + vecteurs + attention + Transformer.",bg:'#FBEAF0',c:'#72243E'},
        ].map(({icon,n,t,b,bg,c})=>(
          <div key={n} style={{display:'flex',gap:12,padding:'14px 16px',background:bg,borderRadius:14,marginBottom:10}}>
            <div style={{minWidth:30,height:30,borderRadius:'50%',background:c,color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0}}>{n}</div>
            <div><div style={{fontWeight:800,fontSize:13,color:c}}>{icon} {t}</div><div style={{fontSize:12,color:c,marginTop:4,lineHeight:1.55}}>{b}</div></div>
          </div>
        ))}
        {s===35 && [
          {icon:'🤖',n:'→',t:"Agents IA + World Models",b:'Modèles qui agissent avec des outils pour poursuivre des objectifs. Et des représentations plus riches du monde pour anticiper les conséquences.',bg:'#EAF3DE',c:'#27500A'},
        ].map(({icon,n,t,b,bg,c})=>(
          <div key={n} style={{display:'flex',gap:12,padding:'14px 16px',background:bg,borderRadius:14,marginBottom:10}}>
            <div style={{minWidth:30,height:30,borderRadius:'50%',background:c,color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0}}>{n}</div>
            <div><div style={{fontWeight:800,fontSize:13,color:c}}>{icon} {t}</div><div style={{fontSize:12,color:c,marginTop:4,lineHeight:1.55}}>{b}</div></div>
          </div>
        ))}
        {s===36 && (
          <div style={{textAlign:'center',padding:'10px 0'}}>
            <div style={{fontSize:52,marginBottom:14}}>🚀</div>
            <h2 style={{fontSize:24,fontWeight:900,marginBottom:10,color:'#1a1a2e'}}>Contenu terminé !</h2>
            <p style={{fontSize:14,color:'#666',lineHeight:1.7,marginBottom:16}}>Tu as parcouru les 4 âges de l'informatique et de l'IA. Place au <strong>quiz final</strong> : 20 questions pour valider ta maîtrise du sujet.</p>
            <div style={{padding:'14px 20px',background:'#D7FFB8',borderRadius:14,display:'inline-block',marginBottom:8}}>
              <div style={{fontWeight:800,fontSize:14,color:'#2B7400'}}>🏆 Score parfait = badge MAÎTRISE IA</div>
              <div style={{fontSize:12,color:'#3D8A00',marginTop:4}}>visible sur ton profil dans l'annuaire</div>
            </div>
          </div>
        )}
      </Wrap>}
    </div>
  )
}
