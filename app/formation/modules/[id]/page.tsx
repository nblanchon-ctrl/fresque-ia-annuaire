'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

const TOTAL_LEARNING = 31
const QUIZ = [
  {
    q: "Dans l'informatique traditionnelle, qui ecrit les regles que la machine applique ?",
    opts: [
      "Le developpeur humain qui programme explicitement chaque instruction",
      "Le reseau de neurones qui deduit les regles a partir des donnees",
      "L'algorithme d'inference qui genere ses propres regles automatiquement",
      "L'utilisateur dont le comportement est enregistre par le systeme"
    ],
    correct: 0,
    expl: "Dans l'informatique traditionnelle, ce sont les developpeurs humains qui ecrivent explicitement chaque regle. La machine se contente de les executer, sans aucune capacite d'apprentissage ou d'adaptation."
  },
  {
    q: "Quel est le principal avantage d'un systeme a regles explicites ?",
    opts: [
      "Il apprend continuellement a partir de nouvelles donnees sans intervention",
      "Il ne commet jamais d'erreur quel que soit le probleme traite",
      "Le chemin ayant conduit a une decision peut etre retrace et explique",
      "Il comprend le langage naturel sans aucune configuration prealable"
    ],
    correct: 2,
    expl: "La tracabilite est l'avantage cle : puisque chaque regle est ecrite explicitement, on peut retracer exactement quelles conditions ont conduit a quel resultat. C'est fondamental pour l'audit et la conformite."
  },
  {
    q: "Dans un systeme expert, quel est le role du moteur d'inference ?",
    opts: [
      "Il enrichit automatiquement la base de faits avec de nouvelles donnees",
      "Il confronte les faits disponibles aux regles pour deduire une conclusion",
      "Il remplace la base de connaissances quand elle devient trop ancienne",
      "Il entraine un reseau neuronal sur les cas traites precedemment"
    ],
    correct: 1,
    expl: "Le moteur d'inference confronte les faits disponibles aux regles de la base de connaissances pour produire de nouvelles conclusions. C'est le composant algorithmique central du systeme expert."
  },
  {
    q: "Quel enseignement principal tire-t-on du cas Deep Blue aux echecs en 1997 ?",
    opts: [
      "Les systemes experts peuvent apprendre et progresser de facon autonome",
      "Une IA peut devenir experte dans tous les domaines en meme temps",
      "Les machines ont definitivement depasse les humains dans la cognition",
      "Une machine peut exceller dans un domaine precis sans rien savoir d'autre"
    ],
    correct: 3,
    expl: "Deep Blue illustre parfaitement la specialisation extreme : extraordinairement performant aux echecs, totalement incapable de faire autre chose. C'est la limite fondamentale des IA specialisees de cette epoque."
  },
  {
    q: "Qu'est-ce qui change fondamentalement avec le machine learning ?",
    opts: [
      "La machine n'a plus besoin de donnees pour produire des resultats fiables",
      "Le modele apprend lui-meme ses parametres a partir de donnees et d'un objectif",
      "Les developpeurs n'interviennent plus du tout dans la conception du systeme",
      "Le materiel informatique remplace totalement le logiciel dans le traitement"
    ],
    correct: 1,
    expl: "La rupture fondamentale : au lieu d'ecrire toutes les regles explicitement, on fournit des donnees et un objectif, et le modele apprend ses propres parametres. L'humain definit l'architecture, pas les regles."
  },
  {
    q: "Qu'est-ce qu'un neurone artificiel, fondamentalement ?",
    opts: [
      "Une cellule biologique cultivee en laboratoire pour le calcul numerique",
      "Une copie fidele d'un neurone du cerveau humain implementee sur puce",
      "Un composant dote d'une forme minimale de conscience et d'intention",
      "Une fonction mathematique qui pondere des entrees et produit une sortie"
    ],
    correct: 3,
    expl: "Un neurone artificiel est essentiellement une fonction mathematique. Il recoit des entrees, les multiplie par des poids, applique une fonction d'activation et produit une sortie. Ce n'est pas une reproduction du cerveau."
  },
  {
    q: "Dans un reseau neuronal, que represente un poids (weight) ?",
    opts: [
      "La quantite de memoire allouee a ce neurone dans le serveur de calcul",
      "Le nombre total d'exemples utilises pour entrainer ce neurone specifique",
      "Une valeur numerique qui regle l'influence d'un signal sur le calcul",
      "L'identifiant unique attribue a chaque connexion dans le reseau neuronal"
    ],
    correct: 2,
    expl: "Les poids sont comme des curseurs de volume : ils determinent l'influence de chaque signal entrant. Au depart aleatoires, ils sont ajustes progressivement pendant l'entrainement pour reduire les erreurs."
  },
  {
    q: "Pendant l'entrainement d'un reseau, qu'optimise-t-on principalement ?",
    opts: [
      "L'ecart entre la prediction du modele et la reponse attendue sur les exemples",
      "La vitesse d'execution de chaque couche pour economiser de l'energie",
      "La quantite de donnees stockees dans la memoire du processeur graphique",
      "Le nombre total de connexions actives dans l'architecture du reseau"
    ],
    correct: 0,
    expl: "L'entrainement consiste a ajuster progressivement les poids pour minimiser l'erreur entre ce que le modele predit et ce qu'on attendait. Ce processus, repete des millions de fois, constitue l'apprentissage."
  },
  {
    q: "A quoi sert la retropropagation (backpropagation) dans l'entrainement ?",
    opts: [
      "Elle convertit le reseau en systeme expert des que l'erreur depasse un seuil",
      "Elle calcule la contribution de chaque poids a l'erreur pour les corriger",
      "Elle efface les exemples mal classes une fois le modele suffisamment entraine",
      "Elle traduit automatiquement les sorties du modele en langage naturel lisible"
    ],
    correct: 1,
    expl: "La retropropagation propage le signal d'erreur en sens inverse dans le reseau pour calculer la contribution de chaque poids a l'erreur totale. Combinee a la descente de gradient, elle permet d'ajuster les poids."
  },
  {
    q: "Que designe le probleme de la 'boite noire' en deep learning ?",
    opts: [
      "Un serveur dont le code source est protege par une licence proprietaire",
      "Un modele qui refuse de traiter certaines categories de donnees sensibles",
      "Une architecture dont les poids sont cryptes pour des raisons de securite",
      "La difficulte a expliquer en termes humains pourquoi un modele a decide ainsi"
    ],
    correct: 3,
    expl: "Un reseau avec des milliards de parametres prend des decisions impossibles a resumer en regles simples. On sait comment il est construit, mais expliquer pourquoi il produit un resultat particulier est tres difficile."
  },
  {
    q: "Qu'est-ce qu'un token dans le contexte des LLM ?",
    opts: [
      "L'unite elementaire en laquelle le texte est decoupe avant d'etre traite",
      "La reponse complete generee par le modele a chaque interaction utilisateur",
      "Un neurone particulier active lors de la reconnaissance d'un mot precis",
      "Un compteur interne qui limite la longueur des reponses du modele"
    ],
    correct: 0,
    expl: "Le texte est decoupe en tokens : un mot entier, une partie de mot, un signe de ponctuation. C'est l'unite elementaire que le modele manipule. Il genere le texte un token a la fois, en calculant le suivant."
  },
  {
    q: "Pourquoi 'va' suit naturellement 'Bonjour, comment ca...' pour un LLM ?",
    opts: [
      "Le systeme d'exploitation impose cette continuation par defaut au modele",
      "Tous les messages de salutation se terminent toujours de la meme facon",
      "Le modele calcule que 'va' a la probabilite la plus elevee dans ce contexte",
      "Le mot 'va' est statistiquement le terme le plus courant en langue francaise"
    ],
    correct: 2,
    expl: "Le modele calcule a chaque etape une distribution de probabilites sur tous les tokens possibles en fonction du contexte. 'Bonjour, comment ca va ?' etant tres frequent dans les donnees, P('va') est elevee."
  },
  {
    q: "A quoi sert l'analogie du sac de billes dans ce module ?",
    opts: [
      "A montrer que les GPU fonctionnent comme des tirages aleatoires paralleles",
      "A illustrer comment les tokens sont physiquement stockes dans la memoire",
      "A prouver que l'IA genere du texte entierement au hasard sans logique",
      "A introduire l'idee que les observations passees modifient nos estimations"
    ],
    correct: 3,
    expl: "Le sac de billes illustre la probabilite conditionnelle : nos observations modifient notre estimation du prochain tirage. C'est exactement ce que fait un LLM : il revise ses probabilites selon le contexte deja genere."
  },
  {
    q: "Pourquoi les tokens sont-ils transformes en vecteurs dans les LLM ?",
    opts: [
      "Pour encoder numeriquement les tokens en capturant leurs relations de sens",
      "Pour generer des images correspondant a chaque mot du texte analyse",
      "Pour reduire la taille du vocabulaire et simplifier les calculs du modele",
      "Pour stocker les donnees du texte dans un format compresse et indexable"
    ],
    correct: 0,
    expl: "Les vecteurs permettent de representer les tokens comme des coordonnees dans un espace a des centaines de dimensions. Dans cet espace, les relations de sens sont encodees : des mots proches semantiquement ont des vecteurs proches."
  },
  {
    q: "Que montre principalement l'exemple du lapin avec l'enfant et le chasseur ?",
    opts: [
      "Que l'IA peut adapter ses recommandations selon le profil de l'utilisateur",
      "Que le meme mot peut prendre un sens tres different selon son contexte",
      "Que les modeles de langage distinguent mieux les animaux que les humains",
      "Que chaque token du vocabulaire possede une signification fixe et universelle"
    ],
    correct: 1,
    expl: "Le mot 'lapin' prend un sens completement different selon que le contexte evoque un enfant avec une peluche ou un chasseur revenant de la foret. C'est exactement ce que les vecteurs contextuels permettent de capturer."
  },
  {
    q: "Que signifie le T de l'acronyme GPT ?",
    opts: [
      "Token : l'unite de base que le modele manipule lors de la generation",
      "Training : la phase d'apprentissage sur de grandes quantites de donnees",
      "Transformer : l'architecture du reseau introduite en 2017 par Google",
      "Technology : le type de technologie utilise dans les grands modeles actuels"
    ],
    correct: 2,
    expl: "GPT signifie Generative Pre-trained Transformer. Le Transformer est l'architecture introduite en 2017 dans le papier 'Attention is all you need', revolutionnaire grace a son mecanisme d'attention."
  },
  {
    q: "Quel mecanisme est au coeur de l'architecture Transformer ?",
    opts: [
      "L'attention : calculer quelles parties du contexte sont les plus pertinentes",
      "La retropropagation : corriger les erreurs en remontant dans le reseau",
      "L'inference : appliquer des regles symboliques a une base de faits connue",
      "La tokenisation : decouper le texte en unites elementaires traitables"
    ],
    correct: 0,
    expl: "Le mecanisme d'attention permet au modele de calculer, pour chaque element d'une sequence, sa pertinence par rapport a tous les autres elements. Cela permet de capturer des dependances a longue distance dans le texte."
  },
  {
    q: "Quelle definition correspond le mieux a un agent IA ?",
    opts: [
      "Un chatbot avance qui produit des reponses plus longues que la moyenne",
      "Un systeme combinant modele, outils et memoire pour agir vers un objectif",
      "Une base de donnees enrichie en continu par apprentissage automatique",
      "Un modele uniquement capable de generer du texte en reponse a des questions"
    ],
    correct: 1,
    expl: "Un agent IA combine un modele generatif avec des instructions, des outils (calendrier, email, recherche...) et une memoire. Il peut enchainer des actions de facon autonome pour atteindre un objectif defini."
  },
  {
    q: "Pourquoi des chercheurs travaillent-ils sur les world models ?",
    opts: [
      "Pour cartographier numeriquement l'ensemble des connaissances humaines",
      "Pour creer des robots capables de remplacer tous les emplois physiques",
      "Pour developper des systemes capables d'anticiper les consequences d'une action",
      "Pour augmenter le volume de texte disponible pour entrainer les LLM existants"
    ],
    correct: 2,
    expl: "Les world models visent a doter les machines de representations plus riches du monde physique (espace, temps, causalite) permettant d'anticiper les consequences d'actions avant de les executer."
  },
  {
    q: "Quelle phrase resume le mieux l'evolution decrite dans ce module ?",
    opts: [
      "Les ordinateurs sont devenus autonomes et n'ont plus besoin de programmation",
      "Chaque nouvelle technologie IA a rendu la precedente completement obsolete",
      "L'intelligence artificielle fonctionne desormais sans intervention humaine",
      "Nous sommes passes de regles programmees a des systemes qui apprennent leurs parametres"
    ],
    correct: 3,
    expl: "L'evolution centrale : de regles ecrites explicitement par des humains, nous sommes passes a des systemes qui apprennent leurs propres parametres a partir de donnees. Les technologies precedentes coexistent toujours."
  },
]


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
  { atStep: 11, icon: '🧪', title: 'Systèmes experts explorés !', sub: 'Tu sais ce qu'est un moteur d'inférence et pourquoi Deep Blue est fascinant.', color: '#633806', bg: '#FAEEDA' },
  { atStep: 20, icon: '🔗', title: 'Réseaux de neurones maîtrisés !', sub: 'Tu comprends comment une machine apprend — et ce qu'est la boîte noire.', color: '#0C447C', bg: '#E6F1FB' },
  { atStep: 29, icon: '✨', title: 'IA générative découverte !', sub: 'Tokens, vecteurs, attention, Transformer… tu as tout compris.', color: '#72243E', bg: '#FBEAF0' },
  { atStep: 31, icon: '🚀', title: 'Contenu terminé !\nPlace au quiz.', sub: '20 questions pour valider ta maîtrise. Un score parfait débloque le badge IA MASTER.', color: '#27500A', bg: '#EAF3DE' },
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
        <button onClick={onNext} style={{width:'100%',padding:'15px',borderRadius:16,border:'none',background:'#58CC02',color:'white',fontWeight:800,fontSize:15,cursor:'pointer',boxShadow:'0 4px 0 #3D8A00'}}>{last ? 'Voir mes résultats →' : 'Continuer →'}</button>
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
  const [step, setStep] = useState(0)
  const [humorMsg, setHumorMsg] = useState<string|null>(null)
  const [celebration, setCelebration] = useState<{atStep:number,icon:string,title:string,sub:string,color:string,bg:string}|null>(null)
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
      supabase.from('modules').select('titre').eq('id', id as string).single().then(({ data }) => {
        if (data) setModuleTitle(data.titre)
        setLoading(false)
      })
    })
  }, [id])

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'white', borderBottom: '0.5px solid var(--border)' }}>
        <a href="/formation/modules" style={{ fontSize: 16, color: '#AFAFAF', fontWeight: 700, textDecoration: 'none', lineHeight: 1 }}>✕</a>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#555', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{moduleTitle}</span>
        <LanguageSwitch />
      </div>
      {!isResult && <ProgressBar step={step} phase={phase} />}
    </div>
  )

  // ── QUIZ ────────────────────────────────────────────────────────────────────
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
          <div style={{ fontSize: 12, fontWeight: 600, color: '#534AB7', marginBottom: 12 }}>Question {qIdx + 1} / {QUIZ.length} &nbsp;·&nbsp; ✓ {score}</div>
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
      <div style={{ minHeight: '100vh', background: '#F7F7F7' }}>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} @keyframes pcbGlow{0%,100%{filter:drop-shadow(0 0 6px #00B86B) drop-shadow(0 0 12px #003A8C)}50%{filter:drop-shadow(0 0 14px #00B86B) drop-shadow(0 0 28px #0066CC)}}`}</style>
        {celebration && <CelebrationModal data={celebration} onContinue={closeCelebration}/>}
        {header}
        <div style={{ padding: '24px 16px 40px', maxWidth: 700, margin: '0 auto' }}>
          {perfect ? (
            <div style={{ textAlign: 'center', marginBottom: 24, animation: 'fadeIn .5s ease' }}>
              <div style={{ marginBottom: 12 }}><AIChipBadge size={96} /></div>
              <div style={{ display: 'inline-block', background: '#534AB7', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20, marginBottom: 8, letterSpacing: 1 }}>BADGE DÉBLOQUÉ ✦</div>
              <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>MAÎTRISE IA 🧠</h2>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#534AB7', marginBottom: 8 }}>20 / 20 : 100 %</div>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>Parfait ! Tu maîtrises les fondamentaux des 4 âges de l'IA.</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>{pct >= 80 ? '🎯' : '💪'}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#534AB7', marginBottom: 8 }}>{total} / {QUIZ.length}</div>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>{pct >= 80 ? 'Beau parcours ! Quelques notions méritent encore un peu d\'entraînement.' : pct >= 60 ? 'Bon début ! Revois les questions manquées pour progresser.' : "Continue à apprendre ! Le module t\'attend pour une révision."}</p>
            </div>
          )}
          {wrongs.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 10 }}>Questions manquées :</div>
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
    <div style={{ minHeight: '100vh', background: '#F7F7F7' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {celebration && <CelebrationModal data={celebration} onContinue={closeCelebration}/>}
      {header}

      {/* STEP 0 : Cover */}
      {s === 0 && <Wrap onNext={next} onPrev={step>0?prev:undefined} nextLabel="Commencer →">
        <div style={{ textAlign: 'center', padding: '12px 0', animation: 'fadeIn .4s ease' }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>💡</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10, lineHeight: 1.3 }}>Sans technologie,<br/>pas d'intelligence artificielle.</h1>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 20 }}>Comment sommes-nous passés d'ordinateurs auxquels il fallait expliquer précisément quoi faire à des IA capables de dialoguer, créer et générer ?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            {[['💻','Informatique traditionnelle'],['🧪','Systèmes experts'],['🔗','Réseaux de neurones'],['✨','IA générative'],['🤖','Et maintenant ?']].map(([icon,label],i)=>(
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: 'white', borderRadius: 12, width: '100%', maxWidth: 280, border: '0.5px solid #E5E5E5' }}>
                <span style={{ fontSize: 18 }}>{icon}</span><span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 16, fontSize: 12, color: '#888' }}>Ces technologies coexistent et se combinent. Ce n'est pas une histoire linéaire.</p>
        </div>
      </Wrap>}

      {/* STEP 1 : Traditional computing intro */}
      {s === 1 && <Wrap onNext={next} onPrev={step>0?prev:undefined}>
        <Tag color="var(--accent-bg)"><span style={{ color: '#3C3489' }}>💻 ÂGE 1 : Informatique traditionnelle</span></Tag>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>« Dis-moi exactement quoi faire. »</h2>
        <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 16 }}>Dans l'informatique traditionnelle, <strong>l'humain écrit les instructions</strong>. La machine les exécute fidèlement.</p>
        <div style={{ background: '#F0F0F4', borderRadius: 12, padding: 14, marginBottom: 14, fontFamily: 'monospace', fontSize: 15, fontWeight: 600 }}>SI [condition] → ALORS [action]</div>
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>Dès 1890, IBM se développait grâce aux machines à cartes perforées : trier, classer, gérer de grandes quantités d'information. Une informatique de <strong>traitement déterministe</strong>.</p>
      </Wrap>}

      {/* STEP 2 : Cat decision tree */}
      {s === 2 && <Wrap onNext={catStep >= 3 ? next : undefined} onPrev={prev} canNext={catStep >= 3} nextLabel="Suite →">
        {humorMsg && (
          <div style={{position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.65)',padding:20}}>
            <div style={{background:'white',borderRadius:24,padding:'32px 28px',textAlign:'center',maxWidth:320,boxShadow:'0 20px 50px rgba(0,0,0,0.3)'}}>
              <div style={{fontSize:52,marginBottom:12}}>🤔</div>
              <h3 style={{fontSize:17,fontWeight:900,color:'#1a1a2e',marginBottom:10,lineHeight:1.4}}>{humorMsg}</h3>
              <p style={{fontSize:13,color:'#888',marginBottom:20}}>Regarde bien l'animal : réessaie !</p>
              <button onClick={()=>setHumorMsg(null)} style={{width:'100%',padding:'14px',borderRadius:14,background:'#58CC02',color:'white',border:'none',fontWeight:800,fontSize:15,cursor:'pointer',boxShadow:'0 4px 0 #3D8A00'}}>Ah oui, pardon ! 😅</button>
            </div>
          </div>
        )}
        <div style={{textAlign:'center',marginBottom:16}}>
          <div style={{fontSize:48,marginBottom:6}}>🐱</div>
          <h3 style={{fontSize:17,fontWeight:700}}>Comment classer cet animal ?</h3>
          <p style={{fontSize:13,color:'#555',marginTop:4}}>Réponds aux questions pour construire l'arbre de décision !</p>
        </div>
        {catStep < 3 && (
          <div style={{padding:'18px 16px',background:'#EEEDFE',borderRadius:14,marginBottom:14,textAlign:'center',border:'2px solid var(--accent)'}}>
            <div style={{fontSize:12,color:'#555',marginBottom:6}}>Question {catStep+1} / 3</div>
            <div style={{fontWeight:800,fontSize:18,color:'#3C3489'}}>
              {['A-t-il des poils ?','A-t-il des oreilles dressées ?','A-t-il une queue ?'][catStep]}
            </div>
          </div>
        )}
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:12}}>
          {[['A-t-il des poils ?'],['A-t-il des oreilles dressées ?'],['A-t-il une queue ?'],['🐱 CHAT !']].map(([q],i)=> i < catStep || (catStep >= 3 && i===3) ? (
            <div key={i} style={{padding:'10px 14px',borderRadius:10,background:i===3?'#E1F5EE':'#F0F0F4',border:`1.5px solid ${i===3?'#5DCAA5':'#E5E5E5'}`,display:'flex',justifyContent:'space-between',alignItems:'center',animation:'fadeIn .3s ease'}}>
              <span style={{fontSize:i===3?15:13,fontWeight:i===3?700:500}}>{q}</span>
              <span style={{fontSize:13,color:'#2B7400',fontWeight:600}}>{i<3?'✓ OUI':'✅'}</span>
            </div>
          ) : null)}
        </div>
        {catStep < 3 && (
          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>setCatStep(s=>s+1)} style={{flex:1,padding:'15px',borderRadius:14,background:'#58CC02',color:'white',border:'none',fontWeight:800,fontSize:16,cursor:'pointer',boxShadow:'0 4px 0 #3D8A00'}}>OUI 👍</button>
            <button onClick={()=>setHumorMsg(['Ha bon ? Dans quel monde vis-tu ? 🌍 Ce chat est CLAIREMENT poilu !','Sans oreilles, il entend sa gamelle comment ? 🙉 Regarde mieux !','Une queue invisible ? Un chat quantique ? ⚛️ Il en a bien une !'][catStep])} style={{flex:1,padding:'15px',borderRadius:14,background:'white',color:'#888',border:'2px solid #E5E5E5',fontWeight:800,fontSize:16,cursor:'pointer'}}>NON 👎</button>
          </div>
        )}
        {catStep >= 3 && <div style={{marginTop:10,padding:12,background:'#EEEDFE',borderRadius:10,fontSize:13,color:'#3C3489'}}>💡 L'idée fondamentale : <strong>les règles ont été définies à l'avance par des humains.</strong></div>}
      </Wrap>}

      {s === 3 && <Wrap onNext={next} onPrev={step>0?prev:undefined}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:6,color:'#1a1a2e'}}>Le 0 et le 1 : fondement du calcul</h3>
        <p style={{fontSize:13,color:'#666',lineHeight:1.65,marginBottom:14}}>Tous les ordinateurs fonctionnent en binaire. À l'échelle des circuits électroniques, tout est soit <strong>1</strong> (le courant passe) soit <strong>0</strong> (le courant ne passe pas).</p>
        <div style={{display:'flex',gap:12,justifyContent:'center',marginBottom:16}}>
          {[
            ['0','Le courant ne passe pas','Circuit ouvert','#1a1a18','white','#9CA3AF'],
            ['1','Le courant passe','Circuit fermé','var(--accent)','white','#CECBF6']
          ].map(([n,d,e,bg,c,dc],i)=>(
            <div key={i} style={{flex:1,textAlign:'center',padding:'18px 14px',background:bg,color:c,borderRadius:14,boxShadow:'0 4px 12px rgba(0,0,0,0.15)'}}>
              <div style={{fontSize:44,fontWeight:900}}>{n}</div>
              <div style={{fontSize:14,margin:'6px 0'}}>🔴</div>
              <div style={{fontSize:12,color:dc,lineHeight:1.4}}>{d}</div>
            </div>
          ))}
        </div>
        <div style={{background:'#E6F1FB',borderRadius:14,padding:'14px 16px',marginBottom:12,border:'1.5px solid #85B7EB'}}>
          <div style={{fontWeight:800,fontSize:13,color:'#0C447C',marginBottom:8}}>🔗 Le lien avec l'arbre de décision</div>
          <p style={{fontSize:13,color:'#0C447C',lineHeight:1.7,marginBottom:10}}>Dans un arbre de décision, chaque condition donne une réponse <strong>OUI ou NON</strong>. Au niveau des circuits électroniques, ce OUI/NON se traduit directement en binaire :</p>
          <div style={{display:'flex',gap:10}}>
            <div style={{flex:1,padding:'10px 12px',background:'white',borderRadius:10,textAlign:'center'}}>
              <div style={{fontWeight:800,fontSize:14,color:'#2B7400',marginBottom:4}}>OUI ✓</div>
              <div style={{fontSize:22,fontWeight:900,color:'#534AB7'}}>= 1</div>
              <div style={{fontSize:11,color:'#0C447C',marginTop:4}}>courant passe<br/>circuit fermé</div>
            </div>
            <div style={{flex:1,padding:'10px 12px',background:'white',borderRadius:10,textAlign:'center'}}>
              <div style={{fontWeight:800,fontSize:14,color:'#CC0000',marginBottom:4}}>NON ✗</div>
              <div style={{fontSize:22,fontWeight:900,color:'#1a1a2e'}}>= 0</div>
              <div style={{fontSize:11,color:'#0C447C',marginTop:4}}>courant ne passe pas<br/>circuit ouvert</div>
            </div>
          </div>
        </div>
        <div style={{background:'#FFF9E6',borderRadius:14,padding:'14px 16px',border:'1.5px solid #FFC800'}}>
          <div style={{fontWeight:800,fontSize:13,color:'#8B5E00',marginBottom:8}}>{"⚡ La nuance importante"}</div>
          <p style={{fontSize:13,color:'#8B5E00',lineHeight:1.7,margin:0}}>Le binaire (0/1) est le <strong>niveau matériel</strong> : la langue des circuits. L'arbre de décision (OUI/NON) est le <strong>niveau logique</strong> : la structure du programme. Les deux sont liés mais distincts : un programme peut avoir des dizaines de choix possibles (pas seulement oui/non), tous représentés en 0 et 1 dans les circuits. Le 0 et le 1 sont le <em>substrat</em>, pas la structure du raisonnement.</p>
        </div>
      </Wrap>}

      {/* STEP 4 : Dog challenge */}
      {s === 4 && <Wrap onNext={dogAnswer!==null?next:undefined} onPrev={prev} canNext={dogAnswer!==null}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🐶</div>
          <h3 style={{ fontSize: 17, fontWeight: 700 }}>Mini-défi</h3>
          <p style={{ fontSize: 14, color: '#555', marginTop: 8, lineHeight: 1.6 }}>On vient de construire un système pour reconnaître un chat. Si on lui présente un chien : <strong>fonctionne-t-il automatiquement ?</strong></p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {['Oui, forcément 😎','Pas forcément 🤔'].map((opt,i)=>(
            <button key={i} onClick={()=>{ if(dogAnswer===null) setDogAnswer(i===1) }} disabled={dogAnswer!==null} style={{ flex:1, padding:'14px 10px', borderRadius:12, textAlign:'left' as const, border:`2.5px solid ${dogAnswer!==null?(i===1?'#58CC02':(dogAnswer===false&&i!==1)?'#FF4B4B':'#E5E5E5'):'#E5E5E5'}`, background:dogAnswer!==null&&i===1?'#D7FFB8':dogAnswer===false&&i!==1?'#FFDFE0':'white', cursor:dogAnswer===null?'pointer':'default', fontWeight:600, fontSize:13, color:'#1a1a2e' }}>{opt}</button>
          ))}
        </div>
        {dogAnswer===true && (
          <div style={{marginTop:12,padding:16,background:'#D7FFB8',borderRadius:14,border:'1.5px solid #58CC02'}}>
            <div style={{fontWeight:800,fontSize:14,color:'#2B7400',marginBottom:8}}>✓ Exactement ! Les règles manquent de précision.</div>
            <div style={{fontSize:13,color:'#2B7400',lineHeight:1.7}}>Pour distinguer chat et chien, il faudrait des règles supplémentaires : taille, forme du museau, aboiement… Pour des centaines d'espèces, des <strong>milliers de règles</strong> impossibles à maintenir. C'est cette limite qui a poussé les chercheurs vers une autre approche : <em>et si la machine apprenait elle-même les règles à partir d'exemples ?</em></div>
          </div>
        )}
        {dogAnswer===false && (
          <div style={{marginTop:12,padding:16,background:'#FFDFE0',borderRadius:14,border:'1.5px solid #FF4B4B'}}>
            <div style={{fontWeight:800,fontSize:14,color:'#CC0000',marginBottom:8}}>✗ Pas tout à fait…</div>
            <div style={{fontSize:13,color:'#990000',lineHeight:1.7}}>La vitesse et la lecture des données ne sont pas en cause. Le vrai problème : les <strong>règles ne sont pas assez précises</strong> pour distinguer un chat d'un chien : qui a aussi des poils, des oreilles et une queue !</div>
          </div>
        )}
      </Wrap>}

      {/* STEP 5 : Advantages/limits */}
      {s === 5 && <Wrap onNext={next} onPrev={prev} nextLabel="Phase suivante →">
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:6,color:'#1a1a2e'}}>À retenir : L'informatique traditionnelle</h3>
        <p style={{fontSize:13,color:'#666',lineHeight:1.65,marginBottom:14}}>Avant de passer aux systèmes experts, voici les deux points essentiels à bien comprendre.</p>
        <div style={{background:'white',borderRadius:16,border:'1.5px solid #E5E5E5',overflow:'hidden',marginBottom:14}}>
          <div style={{padding:'14px 16px',background:'#D7FFB8',borderBottom:'2px solid #58CC02'}}>
            <div style={{fontWeight:800,fontSize:15,color:'#2B7400'}}>{"👍 Avantage majeur : la traçabilité"}</div>
          </div>
          <div style={{padding:'14px 16px'}}>
            <p style={{fontSize:13,color:'#444',lineHeight:1.7,marginBottom:10}}>Puisque chaque règle est écrite explicitement par un humain, il est possible de <strong>retracer précisément le chemin</strong> qui a conduit à un résultat. Si le programme prend une mauvaise décision, on peut revenir en arrière, étape par étape, et identifier quelle règle est défaillante.</p>
            <div style={{background:'#F0FFF0',borderRadius:10,padding:'10px 12px',fontSize:12,color:'#2B7400',lineHeight:1.6}}>
              <strong>{"Exemple :"}</strong>{" un logiciel de paye calcule un mauvais salaire. Le comptable peut ouvrir le code, lire les règles et trouver exactement où l'erreur s'est produite. C'est ce qui permet l'audit, la conformité réglementaire et la certification de systèmes critiques (avionique, médical, nucléaire)."}
            </div>
          </div>
        </div>
        <div style={{background:'white',borderRadius:16,border:'1.5px solid #E5E5E5',overflow:'hidden',marginBottom:14}}>
          <div style={{padding:'14px 16px',background:'#FFDFE0',borderBottom:'2px solid #FF4B4B'}}>
            <div style={{fontWeight:800,fontSize:15,color:'#CC0000'}}>{"⚠️ Limite fondamentale : la complexité"}</div>
          </div>
          <div style={{padding:'14px 16px'}}>
            <p style={{fontSize:13,color:'#444',lineHeight:1.7,marginBottom:10}}>Pour des tâches dites <em>perceptuelles</em> : reconnaître un visage, comprendre une phrase, conduire une voiture : il faudrait formaliser des millions de règles implicites que <strong>{"l'humain lui-même ne sait pas énoncer"}</strong>. Comment décrire en règles ce qui fait qu'un visage ressemble à quelqu'un ?</p>
            <div style={{background:'#FFF0F0',borderRadius:10,padding:'10px 12px',fontSize:12,color:'#CC0000',lineHeight:1.6}}>
              <strong>{"Ce qu'on vient de voir avec le chien :"}</strong>{" 3 règles ne suffisent pas à distinguer un chat d'un chien. Pour être fiable, il faudrait des milliers de règles très précises : impossible à maintenir manuellement à grande échelle."}
            </div>
          </div>
        </div>
        <div style={{background:'#EEEDFE',borderRadius:14,padding:'14px 16px',border:'1.5px solid #C5C0EF'}}>
          <div style={{fontWeight:800,fontSize:13,color:'#3C3489',marginBottom:6}}>{"💡 Cette informatique est toujours partout"}</div>
          <div style={{fontSize:13,color:'#3C3489',lineHeight:1.65}}>{"Logiciels de comptabilité, GPS, systèmes de réservation, feux de circulation, bancomats… L'informatique traditionnelle reste le fondement de la majorité des systèmes en production. Les âges suivants s'y ajoutent, ils ne la remplacent pas."}</div>
        </div>
      </Wrap>}

      {/* STEP 6 : Transition to expert systems */}
      {s === 6 && <Wrap onNext={next} onPrev={step>0?prev:undefined} nextLabel="Découvrir le 2e âge →">
        <div style={{ textAlign:'center', padding:'20px 0', animation:'fadeIn .4s ease' }}>
          <div style={{ fontSize:36, marginBottom:14 }}>💭</div>
          <h3 style={{ fontSize:20, fontWeight:800, marginBottom:10 }}>Et si on mettait directement l'expertise humaine dans la machine ?</h3>
          <p style={{ fontSize:14, color:'#555', lineHeight:1.7 }}>Plutôt que de programmer toutes les situations possibles, que se passerait-il si on formalisait le raisonnement d'un expert ?</p>
        </div>
      </Wrap>}

      {/* STEP 7 : Expert systems intro */}
      {s === 7 && <Wrap onNext={next} onPrev={step>0?prev:undefined}>
        <div style={{display:'inline-block',background:'#FAEEDA',color:'#633806',fontSize:12,fontWeight:800,padding:'4px 14px',borderRadius:20,marginBottom:12,textTransform:'uppercase',letterSpacing:1}}>
          🧪 Âge 2 : Systèmes experts (années 1960-1980)
        </div>
        <h2 style={{fontSize:22,fontWeight:900,marginBottom:12,color:'#1a1a2e'}}>{"« Mettons l'expert dans la machine. »"}</h2>
        <p style={{fontSize:13,color:'#444',lineHeight:1.75,marginBottom:14}}>
          {"Après les succès de l'informatique traditionnelle, les chercheurs se posent une question ambitieuse : et si, au lieu de programmer toutes les règles une par une, on capturait directement l'expertise d'un spécialiste humain : médecin, ingénieur, juriste : et on la rendait exploitable par un ordinateur ?"}
        </p>
        <div style={{background:'white',borderRadius:14,border:'1.5px solid #EF9F27',padding:'14px 16px',marginBottom:14}}>
          <div style={{fontWeight:800,fontSize:13,color:'#633806',marginBottom:8}}>🎓 Le métier d'ingénieur de la connaissance</div>
          <p style={{fontSize:13,color:'#633806',lineHeight:1.7,margin:0}}>
            {"Un nouveau métier apparaît : l'ingénieur de la connaissance. Son rôle : rencontrer des experts, recueillir leur savoir, et le traduire en quelque chose qu'un ordinateur peut manipuler."}
          </p>
        </div>
        <div style={{background:'#FFF9E6',borderRadius:14,border:'1.5px solid #FFC800',padding:'14px 16px',marginBottom:14}}>
          <div style={{fontWeight:800,fontSize:13,color:'#8B5E00',marginBottom:10}}>🎭 Mets-toi dans la peau de cet ingénieur</div>
          <p style={{fontSize:13,color:'#8B5E00',lineHeight:1.7,marginBottom:10}}>
            {"Imagine : tu es ingénieur de la connaissance. Tu viens de rencontrer un médecin expert en maladies infectieuses. Tu lui poses deux séries de questions."}
          </p>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div style={{background:'white',borderRadius:10,padding:'10px 12px'}}>
              <div style={{fontWeight:700,fontSize:12,color:'#633806',marginBottom:4}}>{"① Première série : comment fonctionnez-vous ?"}</div>
              <div style={{fontSize:12,color:'#8B5E00',lineHeight:1.6}}>{"« Quelles décisions prenez-vous ? Sur quels critères ? » Il te répond : SI température > 38,5°C ET toux sèche ET test positif → ALORS envisager protocole A. Tu notes tout. → Tu crées la BASE DE RÈGLES."}</div>
            </div>
            <div style={{background:'white',borderRadius:10,padding:'10px 12px'}}>
              <div style={{fontWeight:700,fontSize:12,color:'#633806',marginBottom:4}}>{"② Deuxième série : sur quels faits vous appuyez-vous ?"}</div>
              <div style={{fontSize:12,color:'#8B5E00',lineHeight:1.6}}>{"« Quelles informations consultez-vous ? » Il te cite : résultats d'analyses, réglementations en vigueur, historique du patient… → Tu crées la BASE DE FAITS."}</div>
            </div>
            <div style={{background:'#EF9F27',borderRadius:10,padding:'10px 12px'}}>
              <div style={{fontWeight:700,fontSize:12,color:'white',marginBottom:4}}>{"③ Le liant : le moteur d'inférence"}</div>
              <div style={{fontSize:12,color:'white',lineHeight:1.6}}>{"Il faut maintenant un algorithme qui lie les deux bases : un peu comme une recette de cuisine qui relie ingrédients et instructions. Cet algorithme s'appelle le MOTEUR D'INFÉRENCE."}</div>
            </div>
          </div>
        </div>
        <div style={{padding:'12px 14px',background:'#F0F0F4',borderRadius:10,fontSize:12,color:'#555',lineHeight:1.6}}>
          {"🍳 Un algorithme, c'est comme une recette : une suite structurée d'instructions permettant de passer d'ingrédients (les faits) à un résultat (la conclusion), en appliquant des étapes définies (les règles)."}
        </div>
      </Wrap>}

      {s === 8 && <Wrap onNext={expertStep>=3?next:undefined} onPrev={prev} canNext={expertStep>=3}>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>🎮 Construis le système expert</h3>
        <p style={{ fontSize:12, color:'#555', marginBottom:14 }}>Clique pour découvrir chaque composant</p>
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
              <button onClick={()=>setExpertStep(s=>s+1)} style={{ width:'100%', padding:'14px', borderRadius:12, background:'#F0F0F4', border:'2px dashed var(--border)', cursor:'pointer', color:'#555', fontSize:13, fontWeight:500 }}>
                {['① Révéler la base de règles','② Révéler la base de faits','③ Révéler le moteur d\'inférence'][i]}
              </button>
            )}
          </div>
        ))}
        {expertStep>=3 && <div style={{ textAlign:'center', padding:10, background:'#F0F0F4', borderRadius:10, fontSize:12, fontWeight:600 }}>FAITS + RÈGLES ⚙️ MOTEUR → CONCLUSION</div>}
      </Wrap>}

      {/* STEP 9 : Algorithm recipe */}
      {s === 9 && <Wrap onNext={next} onPrev={step>0?prev:undefined}>
        <div style={{ textAlign:'center', marginBottom:16 }}><div style={{ fontSize:44 }}>🍳</div></div>
        <h3 style={{ fontSize:17, fontWeight:700, marginBottom:10 }}>L'algorithme, c'est comme une recette</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div style={{ padding:12, background:'#F0F0F4', borderRadius:12, textAlign:'center' }}>
            <div style={{ fontSize:22 }}>📖</div>
            <div style={{ fontWeight:600, fontSize:12, marginTop:4 }}>RECETTE</div>
            <div style={{ fontSize:11, color:'#555', marginTop:4 }}>Ingrédients + instructions → plat</div>
          </div>
          <div style={{ padding:12, background:'#EEEDFE', borderRadius:12, textAlign:'center' }}>
            <div style={{ fontSize:22 }}>💻</div>
            <div style={{ fontWeight:600, fontSize:12, marginTop:4, color:'#3C3489' }}>ALGORITHME</div>
            <div style={{ fontSize:11, color:'#3C3489', marginTop:4 }}>Données + instructions → résultat</div>
          </div>
        </div>
        <div style={{ padding:12, background:'#F0F0F4', borderRadius:10, fontSize:12, color:'#555' }}>⚠️ C'est une analogie. Un algorithme est une <strong>procédure structurée pour résoudre un problème</strong>, pas littéralement une recette.</div>
      </Wrap>}

      {/* STEP 10 : Deep Blue */}
      {s === 10 && <Wrap onNext={next} onPrev={prev} nextLabel="Phase suivante →">
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:14,color:'#1a1a2e'}}>{"♟️ Deep Blue : un exemple de système expert"}</h3>
        <div style={{background:'white',borderRadius:16,border:'1.5px solid #E5E5E5',overflow:'hidden',marginBottom:14}}>
          <div style={{padding:'14px 16px',background:'#1a1a2e',display:'flex',gap:12,alignItems:'center'}}>
            <div style={{fontSize:36}}>♟️</div>
            <div>
              <div style={{fontWeight:800,fontSize:16,color:'white'}}>Deep Blue vs Kasparov</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.6)'}}>IBM, 1997 : 6 parties jouées</div>
            </div>
          </div>
          <div style={{padding:'14px 16px'}}>
            <p style={{fontSize:13,color:'#444',lineHeight:1.7,marginBottom:10}}>
              {"Deep Blue est un excellent exemple de système expert poussé à l'extrême. Il bat le champion du monde d'échecs Garry Kasparov : l'un des meilleurs joueurs de l'histoire : lors d'un match historique en 1997. Techniquement, il combine une recherche exhaustive dans l'arbre des coups possibles, des fonctions d'évaluation conçues avec des grands maîtres, et du matériel informatique très spécialisé."}
            </p>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
          <div style={{padding:14,background:'#D7FFB8',borderRadius:14,border:'2px solid #58CC02',textAlign:'center'}}>
            <div style={{fontWeight:700,fontSize:12,color:'#2B7400',marginBottom:6}}>Aux échecs ♟️</div>
            <div style={{fontSize:22}}>⭐⭐⭐⭐⭐</div>
            <div style={{fontSize:11,color:'#2B7400',marginTop:4}}>Champion mondial battu</div>
          </div>
          <div style={{padding:14,background:'#FFDFE0',borderRadius:14,border:'2px solid #FF4B4B',textAlign:'center'}}>
            <div style={{fontWeight:700,fontSize:12,color:'#CC0000',marginBottom:6}}>{"Préparer des crêpes 🥞"}</div>
            <div style={{fontSize:22,fontWeight:800,color:'#CC0000'}}>0 %</div>
            <div style={{fontSize:11,color:'#CC0000',marginTop:4}}>Aucune compétence</div>
          </div>
        </div>
        <div style={{background:'#1a1a2e',borderRadius:12,padding:'14px 16px',marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:14,color:'white',textAlign:'center',lineHeight:1.5}}>
            {"Une machine peut être extraordinaire dans un domaine très précis sans savoir faire quoi que ce soit d'autre."}
          </div>
        </div>
        <div style={{background:'#E6F1FB',borderRadius:14,padding:'14px 16px',border:'1.5px solid #85B7EB'}}>
          <div style={{fontWeight:800,fontSize:13,color:'#0C447C',marginBottom:8}}>🎯 Posture animateur</div>
          <p style={{fontSize:13,color:'#0C447C',lineHeight:1.7,margin:0}}>
            {"Quand tu animeras la Fresque de l'IA, les participants n'ont souvent jamais entendu parler de Deep Blue. L'anecdote des crêpes est un excellent outil pédagogique : elle illustre immédiatement, avec humour, la limite fondamentale des IA spécialisées. Elle ouvre aussi la question : alors comment créer une IA qui sache faire plusieurs choses ? C'est précisément ce que le 3e âge va apporter."}
          </p>
        </div>
      </Wrap>}

      {s === 11 && <Wrap onNext={next} onPrev={step>0?prev:undefined} nextLabel="Découvrir les réseaux →">
        <div style={{ textAlign:'center', padding:'20px 0', animation:'fadeIn .4s ease' }}>
          <div style={{ fontSize:36, marginBottom:14 }}>🤔</div>
          <h3 style={{ fontSize:20, fontWeight:800, marginBottom:10 }}>Et si nous arrêtions de donner toutes les règles à la machine ?</h3>
          <p style={{ fontSize:16, color:'#534AB7', fontWeight:700 }}>Et si elle pouvait apprendre ?</p>
        </div>
      </Wrap>}

      {/* STEP 12 : Neural networks intro + timeline */}
      {s === 12 && <Wrap onNext={next} onPrev={prev}>
        <div style={{display:'inline-block',background:'#E6F1FB',color:'#0C447C',fontSize:12,fontWeight:800,padding:'4px 14px',borderRadius:20,marginBottom:12,textTransform:'uppercase',letterSpacing:1}}>
          🔗 Âge 3 : Réseaux de neurones
        </div>
        <h2 style={{fontSize:22,fontWeight:900,marginBottom:12,color:'#1a1a2e'}}>{"« Et si on dupliquait le cerveau humain ? »"}</h2>
        <p style={{fontSize:13,color:'#444',lineHeight:1.75,marginBottom:14}}>
          {"En 1956, à l'atelier de Dartmouth College, des chercheurs se réunissent autour d'une ambition folle : créer des machines capables d'imiter l'intelligence humaine. L'idée centrale ? Dupliquer le cerveau humain."}
        </p>
        <div style={{background:'white',borderRadius:14,border:'1.5px solid #E5E5E5',padding:'14px 16px',marginBottom:14}}>
          <div style={{fontWeight:800,fontSize:13,color:'#1a1a2e',marginBottom:8}}>Le problème des systèmes experts</div>
          <p style={{fontSize:13,color:'#444',lineHeight:1.7,margin:0}}>
            {"L'informatique traditionnelle et les systèmes experts fonctionnent bien. Mais notre cerveau, lui, ne se limite pas à un seul domaine. Un médecin peut aussi jouer de la guitare, conduire une voiture, apprendre une nouvelle langue. Si l'objectif est de dupliquer le cerveau humain, les systèmes experts sont trop limités : ils n'excellent que dans UN domaine précis."}
          </p>
        </div>
        <div style={{background:'#E6F1FB',borderRadius:14,border:'1.5px solid #1CB0F6',padding:'14px 16px',marginBottom:14}}>
          <div style={{fontWeight:800,fontSize:13,color:'#0C447C',marginBottom:8}}>{"💡 L'idée clé : imiter la structure du cerveau"}</div>
          <p style={{fontSize:13,color:'#0C447C',lineHeight:1.7,margin:0}}>
            {"Notre cerveau contient environ 86 milliards de neurones connectés entre eux par des synapses. Ces connexions se renforcent ou s'affaiblissent selon l'expérience. Pourquoi ne pas recréer cette architecture artificielle ? Des unités interconnectées qui apprennent par l'expérience : c'est l'idée fondatrice des réseaux de neurones artificiels."}
          </p>
        </div>
        <div style={{background:'#FFF9E6',borderRadius:14,border:'1.5px solid #FFC800',padding:'14px 16px'}}>
          <div style={{fontWeight:800,fontSize:13,color:'#8B5E00',marginBottom:8}}>🕰️ Plonge dans les années 70</div>
          <p style={{fontSize:13,color:'#8B5E00',lineHeight:1.7,marginBottom:8}}>
            {"Imagine : nous sommes dans les années 1970. Rien n'est virtualisé. Pas de GPU, pas de cloud, pas de Python. Tu es chercheur et tu veux construire un réseau de neurones artificiel."}
          </p>
          <p style={{fontSize:13,color:'#8B5E00',lineHeight:1.7,marginBottom:8}}>
            {"Tu t'assieds à une table avec des potentiomètres (des boutons de réglage électroniques), des fils électriques pour représenter les connexions synaptiques, et des ampoules pour visualiser les signaux. Tu dois câbler à la main chaque connexion entre tes neurones artificiels. Tu tournes les potentiomètres pour ajuster les poids : littéralement à la main."}
          </p>
          <p style={{fontSize:12,color:'#8B5E00',lineHeight:1.6,margin:0,fontStyle:'italic'}}>
            {"🎯 Posture animateur : quand tu raconteras cela, tu peux faire un geste de tourner un bouton imaginaire. Les participants réalisent alors que l'apprentissage automatique n'a pas toujours été automatique..."}
          </p>
        </div>
      </Wrap>}

      {s === 13 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:8,color:'#1a1a2e'}}>Cerveau biologique vs Réseau artificiel</h3>
        <p style={{fontSize:13,color:'#444',lineHeight:1.65,marginBottom:14}}>
          Attention : s'inspirer du cerveau ne veut pas dire le copier. Les pionniers des réseaux de neurones ont pris des inspirations biologiques tres libres. Voici pourquoi c'est important a comprendre.
        </p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          {[
            {icon:'🧠',t:'CERVEAU BIOLOGIQUE',items:['86 milliards de neurones','Connexions synaptiques biologiques','Apprentissage par l\'experience','Consomme environ 20W','Tres difficile a observer'],bg:'#F8F8F8',bc:'#999',tc:'#1a1a2e'},
            {icon:'🔗',t:'RESEAU ARTIFICIEL',items:['Unites mathematiques (fonctions)','Connexions numeriques ponderees','Apprentissage par gradient','Necessite des GPU puissants','Entierement observable et modifiable'],bg:'#E6F1FB',bc:'#1CB0F6',tc:'#0C447C'}
          ].map(({icon,t,items,bg,bc,tc})=>(
            <div key={t} style={{padding:14,background:bg,borderRadius:14,border:`2px solid ${bc}`}}>
              <div style={{fontSize:28,marginBottom:6}}>{icon}</div>
              <div style={{fontWeight:800,fontSize:11,color:tc,marginBottom:8,textTransform:'uppercase' as const,letterSpacing:0.5}}>{t}</div>
              {items.map(item=><div key={item} style={{fontSize:11,color:tc,marginBottom:3,lineHeight:1.4}}>• {item}</div>)}
            </div>
          ))}
        </div>
        <div style={{background:'#FFDFE0',borderRadius:14,border:'1.5px solid #FF4B4B',padding:'14px 16px',marginBottom:12}}>
          <div style={{fontWeight:800,fontSize:13,color:'#CC0000',marginBottom:6}}>Ce que ce n'est PAS</div>
          <p style={{fontSize:13,color:'#990000',lineHeight:1.65,margin:0}}>
            Un reseau de neurones artificiel n'est PAS un cerveau miniature, n'a PAS de conscience, ne "pense" PAS. C'est une architecture mathematique qui s'inspire tres librement de certaines intuitions biologiques. Un neurone artificiel, c'est fondamentalement une fonction : elle recoit des entrees, les pondere, et produit une sortie.
          </p>
        </div>
        <div style={{background:'#E6F1FB',borderRadius:14,padding:'14px 16px',border:'1.5px solid #1CB0F6'}}>
          <div style={{fontWeight:800,fontSize:13,color:'#0C447C',marginBottom:6}}>Posture animateur</div>
          <p style={{fontSize:12,color:'#0C447C',lineHeight:1.6,margin:0}}>
            Quand tu animes la Fresque de l'IA, tu rencontreras souvent cette confusion : "Les IA ont-elles une conscience ?" C'est le bon moment pour recentrer : non, un reseau de neurones artificiel ne ressemble que tres vaguement a un cerveau, et uniquement dans sa structure, pas dans son fonctionnement biologique.
          </p>
        </div>
      </Wrap>}

      {s === 14 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:10,color:'#1a1a2e'}}>Couches, poids, et apprentissage profond</h3>
        <p style={{fontSize:13,color:'#444',lineHeight:1.65,marginBottom:14}}>
          {"Le néocortex humain : la partie du cerveau associée au raisonnement complexe : est organisé en 6 à 7 couches de neurones. Alors que les premiers réseaux artificiels n'avaient qu'une couche, les chercheurs se sont dit : pourquoi ne pas empiler plusieurs couches interconnectées ?"}
        </p>
        <div style={{background:'#F0F0F4',borderRadius:12,padding:'12px',marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'#555',marginBottom:8,textTransform:'uppercase',letterSpacing:1}}>Architecture multicouche</div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:4,flexWrap:'wrap'}}>
            {[['📷','ENTRÉE','données brutes'],['●●','COUCHE 1','caractéristiques simples'],['●●','COUCHE 2','formes'],['●●','COUCHE n','concepts'],['🎯','SORTIE','résultat']].map(([icon,label,sub],i,arr)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:4,flex:1}}>
                {i>0&&<div style={{color:'#888',fontSize:12,flexShrink:0}}>→</div>}
                <div style={{flex:1,padding:'8px 4px',background:i===0||i===arr.length-1?'#1CB0F6':'white',borderRadius:10,textAlign:'center',border:`1.5px solid ${i===0||i===arr.length-1?'#1CB0F6':'#E5E5E5'}`}}>
                  <div style={{fontSize:14}}>{icon}</div>
                  <div style={{fontSize:9,fontWeight:700,color:i===0||i===arr.length-1?'white':'#1a1a2e',marginTop:2}}>{label}</div>
                  <div style={{fontSize:8,color:i===0||i===arr.length-1?'rgba(255,255,255,0.8)':'#888'}}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'flex-start',gap:12,padding:14,background:'white',borderRadius:14,border:'1.5px solid #E5E5E5',marginBottom:14}}>
          <div style={{fontSize:28,flexShrink:0}}>🎚️</div>
          <div>
            <div style={{fontWeight:700,fontSize:14,marginBottom:4,color:'#1a1a2e'}}>Les poids = boutons de réglage</div>
            <div style={{fontSize:13,color:'#444',lineHeight:1.65}}>{"Chaque connexion entre neurones a un poids numérique. Au départ aléatoires, ces poids sont ajustés progressivement pendant l'entraînement : exactement comme on tournait les potentiomètres à la main dans les années 70, mais ici de façon automatique, des millions de fois."}</div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div style={{padding:14,background:'#E6F1FB',borderRadius:12,border:'1px solid #1CB0F6'}}>
            <div style={{fontWeight:800,fontSize:13,color:'#0C447C',marginBottom:6}}>🔗 Machine Learning</div>
            <div style={{fontSize:12,color:'#0C447C',lineHeight:1.55}}>{"Réseau avec peu de couches. Apprend à partir d'exemples. Efficace sur des tâches structurées (classification, prédiction)."}</div>
          </div>
          <div style={{padding:14,background:'#EEEDFE',borderRadius:12,border:'1px solid #534AB7'}}>
            <div style={{fontWeight:800,fontSize:13,color:'#3C3489',marginBottom:6}}>🧠 Deep Learning</div>
            <div style={{fontSize:12,color:'#3C3489',lineHeight:1.55}}>{"Réseau avec BEAUCOUP de couches (d'où 'deep'). Chaque couche apprend des représentations de plus en plus abstraites. Base des LLM et des IA génératives."}</div>
          </div>
        </div>
      </Wrap>}

      {s === 15 && <Wrap onNext={next} onPrev={step>0?prev:undefined}>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>🎮 Apprenons à reconnaître un chat</h3>
        <p style={{ fontSize:12, color:'#555', marginBottom:14 }}>Le réseau fait des erreurs au début… puis il apprend !</p>
        {[{p:'CAMION',pct:8,ok:false},{p:'CHIEN',pct:31,ok:false},{p:'FÉLIN 🟠',pct:74,ok:false},{p:'CHAT ✅',pct:96,ok:true}].map((a,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:a.ok?'#E1F5EE':'var(--bg2)', border:`1.5px solid ${a.ok?'#5DCAA5':'#E5E5E5'}`, borderRadius:10, marginBottom:8, animation:'fadeIn .3s ease' }}>
            <span style={{ fontSize:18 }}>🐱</span>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:13, fontWeight:600 }}>→ {a.p}</span>
                <span style={{ fontSize:11, color:'#555' }}>{a.pct}%</span>
              </div>
              <div style={{ height:4, background:'#F7F7F7', borderRadius:2, overflow:'hidden' }}>
                <div style={{ width:`${a.pct}%`, height:'100%', background:a.ok?'#5DCAA5':'var(--accent)', borderRadius:2 }}/>
              </div>
            </div>
            <span style={{ fontSize:14 }}>{a.ok?'✅':'❌'}</span>
          </div>
        ))}
        <div style={{ padding:10, background:'#EEEDFE', borderRadius:10, fontSize:12, color:'#3C3489', marginTop:4 }}>IMAGE → PRÉDICTION → ERREUR → AJUSTEMENT → RECOMMENCER. Des millions de fois.</div>
      </Wrap>}

      {/* STEP 16 : Generalization */}
      {s === 16 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:8,color:'#1a1a2e'}}>🎯 La généralisation : pourquoi c'est fondamental</h3>
        <p style={{fontSize:13,color:'#444',lineHeight:1.65,marginBottom:14}}>
          {"Imaginons que notre réseau soit maintenant capable de reconnaître parfaitement les chats qu'il a déjà vus pendant l'entraînement. Très bien. Mais à quoi cela sert-il si, face à un chat qu'il n'a jamais vu, il échoue ?"}
        </p>
        <div style={{background:'white',borderRadius:14,border:'1.5px solid #E5E5E5',padding:'14px 16px',marginBottom:14}}>
          <div style={{fontWeight:800,fontSize:13,color:'#1a1a2e',marginBottom:8}}>{"L'enjeu : passer de l'exemple à la règle générale"}</div>
          <p style={{fontSize:13,color:'#444',lineHeight:1.7,marginBottom:8}}>
            {"Un réseau qui mémorise ses exemples d'entraînement est comme un élève qui apprend les réponses par cœur sans comprendre. Il échoue dès qu'on lui pose une question légèrement différente. La généralisation, c'est la capacité à appliquer ce qu'on a appris à des situations nouvelles : c'est l'intelligence."}
          </p>
          <p style={{fontSize:13,color:'#444',lineHeight:1.7,margin:0}}>
            {"Pour y parvenir, on expose le réseau à des milliers, voire des millions d'images de chats différents : chats noirs, blancs, tigrés, photographiés de côté, dans la pénombre, stylisés… C'est l'industrialisation de l'apprentissage."}
          </p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
          {[['🐈','Chat noir','jamais vu'],['🐈‍⬛','Chat de nuit','jamais vu'],['🐱','Chat de côté','jamais vu'],['😺','Chat stylisé','jamais vu']].map(([icon,label,note],i)=>(
            <div key={i} style={{padding:'12px',background:'#D7FFB8',border:'2px solid #58CC02',borderRadius:14,textAlign:'center'}}>
              <div style={{fontSize:28}}>{icon}</div>
              <div style={{fontSize:12,fontWeight:700,color:'#2B7400',marginTop:5}}>{label}</div>
              <div style={{fontSize:10,color:'#3D8A00',marginTop:2}}>{note}</div>
              <div style={{fontSize:12,fontWeight:800,color:'#2B7400',marginTop:4}}>CHAT ✓ (96%)</div>
            </div>
          ))}
        </div>
        <div style={{background:'#E6F1FB',borderRadius:14,padding:'14px 16px',border:'1.5px solid #1CB0F6'}}>
          <div style={{fontWeight:800,fontSize:13,color:'#0C447C',marginBottom:8}}>🎯 Posture animateur</div>
          <p style={{fontSize:12,color:'#0C447C',lineHeight:1.6,margin:0}}>
            {"Quand tu expliques la généralisation à des apprenants, une bonne question à poser est : 'Est-ce que vous pensez que ce réseau reconnaîtrait un chat photographié sous la neige ?' Cela crée un moment de réflexion sur la différence entre mémorisation et compréhension : un enjeu clé pour comprendre les limites et les forces de l'IA."}
          </p>
        </div>
      </Wrap>}

      {s === 17 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:8,color:'#1a1a2e'}}>Comment les poids sont-ils ajustes ?</h3>
        <p style={{fontSize:13,color:'#444',lineHeight:1.65,marginBottom:14}}>
          Quand le reseau fait une erreur, il faut savoir QUELS poids ont contribue a cette erreur, et COMMENT les corriger. Deux mecanismes rendent cela possible.
        </p>
        <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:14}}>
          <div style={{padding:16,background:'#E6F1FB',borderRadius:14,border:'2px solid #1CB0F6'}}>
            <div style={{fontWeight:800,fontSize:14,color:'#0C447C',marginBottom:8}}>Propagation avant (Forward pass)</div>
            <p style={{fontSize:13,color:'#0C447C',lineHeight:1.65,marginBottom:8}}>L'image traverse le reseau couche par couche, de gauche a droite. A la fin, le reseau produit une prediction : "CAMION a 8%". On sait que c'est faux, puisque c'est un chat.</p>
            <div style={{background:'white',borderRadius:8,padding:'8px 10px',fontSize:12,color:'#0C447C'}}>
              Entree (image) → Couche 1 → Couche 2 → ... → Sortie (prediction)
            </div>
          </div>
          <div style={{padding:16,background:'#FFDFE0',borderRadius:14,border:'2px solid #FF4B4B'}}>
            <div style={{fontWeight:800,fontSize:14,color:'#CC0000',marginBottom:8}}>Retropropagation (Backpropagation)</div>
            <p style={{fontSize:13,color:'#990000',lineHeight:1.65,marginBottom:8}}>L'erreur est calculee. Puis l'algorithme remonte en sens inverse dans le reseau pour calculer, pour chaque poids, sa contribution a l'erreur. Un peu comme remonter une chaine d'erreurs : "C'est ce poids-la qui a surtout tout fausse."</p>
            <div style={{background:'white',borderRadius:8,padding:'8px 10px',fontSize:12,color:'#CC0000'}}>
              Erreur → Couche finale → ... → Couche 1 (chaque poids est corrige)
            </div>
          </div>
        </div>
        <div style={{padding:14,background:'#F0F0F4',borderRadius:12,marginBottom:12}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:6,color:'#1a1a2e'}}>La descente de gradient</div>
          <p style={{fontSize:13,color:'#555',lineHeight:1.65,margin:0}}>
            Une fois qu'on sait comment chaque poids a contribue a l'erreur, on l'ajuste dans la bonne direction pour la reduire. Ce processus s'appelle la descente de gradient. Repete des millions de fois, le reseau converge vers une bonne solution.
          </p>
        </div>
        <div style={{background:'#D7FFB8',borderRadius:12,padding:'12px 14px',border:'1.5px solid #58CC02'}}>
          <p style={{fontSize:13,color:'#2B7400',margin:0,lineHeight:1.6}}>
            Un grand modele comme GPT necessite des semaines d'entrainement sur des milliers de GPU. La retropropagation tourne en boucle, des milliards de fois, sur des teraoctets de texte.
          </p>
        </div>
      </Wrap>}

      {s === 18 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:8,color:'#1a1a2e'}}>Le probleme de la boite noire</h3>
        <p style={{fontSize:13,color:'#444',lineHeight:1.65,marginBottom:14}}>
          On a gagne quelque chose d'immense : la capacite d'apprendre. Mais on a perdu quelque chose qu'on avait avec l'informatique traditionnelle et les systemes experts : l'explicabilite.
        </p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
          <div style={{padding:14,background:'#D7FFB8',borderRadius:14,border:'2px solid #58CC02',textAlign:'center'}}>
            <div style={{fontSize:28,marginBottom:6}}>On gagne</div>
            <div style={{fontWeight:800,fontSize:14,color:'#2B7400',marginBottom:4}}>La capacite d'apprendre</div>
            <div style={{fontSize:12,color:'#1A5200'}}>Le modele generalise, reconnait des situations inedites, s'ameliore avec les donnees</div>
          </div>
          <div style={{padding:14,background:'#FFDFE0',borderRadius:14,border:'2px solid #FF4B4B',textAlign:'center'}}>
            <div style={{fontSize:28,marginBottom:6}}>On perd</div>
            <div style={{fontWeight:800,fontSize:14,color:'#CC0000',marginBottom:4}}>L'explicabilite</div>
            <div style={{fontSize:12,color:'#990000'}}>Impossible d'expliquer "pourquoi" le modele a pris cette decision precise</div>
          </div>
        </div>
        <div style={{background:'white',borderRadius:14,border:'1.5px solid #E5E5E5',marginBottom:14,overflow:'hidden'}}>
          <div style={{padding:'12px 16px',background:'#1a1a2e'}}>
            <div style={{fontWeight:700,fontSize:13,color:'white'}}>Scenario reel : recrutement par IA</div>
          </div>
          <div style={{padding:'14px 16px'}}>
            <p style={{fontSize:13,color:'#444',lineHeight:1.65,marginBottom:10}}>
              Une entreprise utilise un reseau de neurones pour trier les candidatures. Un candidat est refuse. Il demande : "Pourquoi ?"
            </p>
            <div style={{background:'#F0F0F4',borderRadius:8,padding:'10px 12px',fontFamily:'monospace',fontSize:12,color:'#555',marginBottom:10}}>
              w237 x 0.728 + w415 x -1.234 + w881 x 0.091... = -0.43 → REFUSE
            </div>
            <p style={{fontSize:13,color:'#CC0000',fontWeight:600}}>Ce n'est pas une explication acceptable pour un etre humain.</p>
          </div>
        </div>
        <div style={{background:'#EEEDFE',borderRadius:14,padding:'14px 16px',border:'1.5px solid #C5C0EF'}}>
          <div style={{fontWeight:800,fontSize:13,color:'#3C3489',marginBottom:6}}>Un domaine de recherche entier : l'IA explicable (XAI)</div>
          <p style={{fontSize:13,color:'#3C3489',lineHeight:1.65,margin:0}}>
            Des methodes comme LIME, SHAP ou les cartes d'activation permettent d'approximer des explications pour certains modeles. Ce n'est pas parfait, mais c'est un enjeu majeur dans tous les secteurs ou l'IA prend des decisions qui affectent des personnes : credit, sante, justice, recrutement.
          </p>
        </div>
      </Wrap>}

      {s === 19 && <Wrap onNext={next} onPrev={prev} nextLabel="Decouvrir l'IA generative →">
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:12,color:'#1a1a2e'}}>Le grand changement de paradigme</h3>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
          <div style={{padding:'14px 16px',background:'#F0F0F4',borderRadius:12}}>
            <div style={{fontWeight:800,fontSize:12,color:'#888',marginBottom:8,textTransform:'uppercase' as const,letterSpacing:1}}>Avant</div>
            <div style={{display:'flex',flexWrap:'wrap' as const,gap:8,alignItems:'center',fontSize:13}}>
              <div style={{padding:'6px 12px',background:'white',borderRadius:20,border:'1.5px solid #E5E5E5',fontWeight:600}}>Donnees + Regles humaines</div>
              <span style={{color:'#888'}}>→</span>
              <div style={{padding:'6px 12px',background:'#D7FFB8',borderRadius:20,fontWeight:600,color:'#2B7400'}}>Resultat</div>
            </div>
            <div style={{fontSize:12,color:'#888',marginTop:8}}>L'humain ecrit toutes les regles. La machine les applique.</div>
          </div>
          <div style={{textAlign:'center' as const,fontSize:28}}>⚡</div>
          <div style={{padding:'14px 16px',background:'#E8F8FF',borderRadius:12,border:'2.5px solid #1CB0F6'}}>
            <div style={{fontWeight:800,fontSize:12,color:'#0C447C',marginBottom:8,textTransform:'uppercase' as const,letterSpacing:1}}>Apres (Machine Learning)</div>
            <div style={{display:'flex',flexWrap:'wrap' as const,gap:8,alignItems:'center',fontSize:13}}>
              <div style={{padding:'6px 12px',background:'white',borderRadius:20,border:'1.5px solid #1CB0F6',fontWeight:600}}>Donnees + Objectif + Architecture</div>
              <span style={{color:'#1CB0F6'}}>→</span>
              <div style={{padding:'6px 12px',background:'#1CB0F6',color:'white',borderRadius:20,fontWeight:700}}>Modele appris</div>
            </div>
            <div style={{fontSize:12,color:'#0C447C',marginTop:8}}>Le reseau apprend ses propres regles a partir des exemples.</div>
          </div>
        </div>
        <div style={{background:'#FFF9E6',borderRadius:14,padding:'14px 16px',border:'1.5px solid #FFC800'}}>
          <div style={{fontWeight:800,fontSize:13,color:'#8B5E00',marginBottom:6}}>Posture animateur</div>
          <p style={{fontSize:12,color:'#8B5E00',lineHeight:1.6,margin:0}}>
            Quand tu expliques cette bascule a des apprenants, insiste sur le fait que ce n'est pas "l'IA qui prend le pouvoir" : c'est toujours un humain qui choisit les donnees, l'architecture et l'objectif. La machine optimise, elle ne decide pas.
          </p>
        </div>
      </Wrap>}

      {s === 20 && <Wrap onNext={next} onPrev={prev}>
        <div style={{display:'inline-block',background:'#FBEAF0',color:'#72243E',fontSize:12,fontWeight:800,padding:'4px 14px',borderRadius:20,marginBottom:12,textTransform:'uppercase' as const,letterSpacing:1}}>
          Age 4 : IA Generative
        </div>
        <h2 style={{fontSize:22,fontWeight:900,marginBottom:12,color:'#1a1a2e'}}>La machine ne reconnait plus seulement. Elle cree.</h2>
        <p style={{fontSize:13,color:'#444',lineHeight:1.75,marginBottom:14}}>
          Trois ingredients se combinent a partir des annees 2010 pour produire quelque chose de radicalement nouveau. L'IA generative existait avant ChatGPT : mais c'est la combinaison de ces trois facteurs qui a tout change.
        </p>
        <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:16}}>
          {[
            ['🌐','Internet et Big Data','Des milliards de textes, images, codes disponibles pour l\'entrainement'],
            ['⚡','GPU et cloud computing','La puissance de calcul necessaire devient accessible'],
            ['🔀','L\'architecture Transformer (2017)','Une innovation cle qui a revolutionne la facon dont les reseaux traitent le langage'],
          ].map(([icon,title,desc],i)=>(
            <div key={i} style={{display:'flex',gap:12,padding:'12px 14px',background:'white',borderRadius:12,border:'1.5px solid #E5E5E5',alignItems:'flex-start'}}>
              <div style={{fontSize:24,flexShrink:0}}>{icon}</div>
              <div>
                <div style={{fontWeight:700,fontSize:13,color:'#1a1a2e',marginBottom:3}}>{title}</div>
                <div style={{fontSize:12,color:'#555',lineHeight:1.5}}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{background:'#FBEAF0',borderRadius:14,padding:'14px 16px',border:'1.5px solid #F0997B',marginBottom:12}}>
          <div style={{fontWeight:800,fontSize:13,color:'#72243E',marginBottom:6}}>Ce que l'IA generative sait faire</div>
          <div style={{display:'flex',flexWrap:'wrap' as const,gap:6}}>
            {['Ecrire du texte','Generer des images','Composer de la musique','Coder','Traduire','Resumer','Dialoguer'].map(cap=>(
              <div key={cap} style={{padding:'5px 12px',background:'white',borderRadius:20,fontSize:12,fontWeight:600,color:'#72243E',border:'1px solid #F0997B'}}>{cap}</div>
            ))}
          </div>
        </div>
        <p style={{fontSize:13,color:'#555',lineHeight:1.65}}>
          On se concentre ici sur les LLM (Large Language Models). Pour comprendre comment ils fonctionnent, 4 notions cles : tokens, probabilites, vecteurs, attention.
        </p>
      </Wrap>}

      {s === 21 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:8,color:'#1a1a2e'}}>1. Les tokens : l'unite elementaire</h3>
        <p style={{fontSize:13,color:'#444',lineHeight:1.65,marginBottom:14}}>
          Quand tu envoies un message a ChatGPT, il ne le lit pas comme toi. La premiere chose qu'il fait, c'est decouper ton texte en petites unites appelees tokens. Comprendre les tokens, c'est comprendre pourquoi l'IA "pense" differemment de nous.
        </p>
        <div style={{background:'#F8F5FF',borderRadius:14,border:'1.5px solid #C5C0EF',padding:'14px 16px',marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'#3C3489',marginBottom:8,textTransform:'uppercase' as const,letterSpacing:1}}>Tokenisation de "Bonjour le monde !"</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap' as const,marginBottom:10}}>
            {[['Bon','#EEEDFE','#3C3489'],['jour','#E6F1FB','#0C447C'],[',','#FAEEDA','#633806'],['le','#E1F5EE','#085041'],['monde','#FBEAF0','#72243E'],['!','#EAF3DE','#27500A']].map(([t,bg,tc],i)=>(
              <div key={i} style={{padding:'8px 14px',background:bg,borderRadius:10,fontWeight:700,fontSize:15,color:tc,fontFamily:'monospace'}}>{t}</div>
            ))}
          </div>
          <div style={{fontSize:12,color:'#555'}}>6 tokens pour 4 mots : le decoupage depend du systeme de tokenisation utilise.</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:14}}>
          <div style={{padding:'12px 14px',background:'white',borderRadius:12,border:'1.5px solid #E5E5E5'}}>
            <div style={{fontWeight:700,fontSize:13,color:'#1a1a2e',marginBottom:4}}>Pourquoi pas des mots entiers ?</div>
            <div style={{fontSize:12,color:'#555',lineHeight:1.6}}>Certains mots rares seraient absents du vocabulaire. En decoupant en sous-unites, on peut traiter n'importe quel texte avec un vocabulaire fini (environ 50 000 tokens pour les grands modeles).</div>
          </div>
          <div style={{padding:'12px 14px',background:'white',borderRadius:12,border:'1.5px solid #E5E5E5'}}>
            <div style={{fontWeight:700,fontSize:13,color:'#1a1a2e',marginBottom:4}}>Generation token par token</div>
            <div style={{fontSize:12,color:'#555',lineHeight:1.6}}>Le modele genere le texte UN token a la fois. Il calcule les probabilites du token suivant, le choisit, l'ajoute au contexte, recommence. C'est pourquoi le texte "apparait" progressivement quand tu utilises ChatGPT.</div>
          </div>
        </div>
        <div style={{background:'#E6F1FB',borderRadius:12,padding:'12px 14px',border:'1.5px solid #1CB0F6'}}>
          <div style={{fontWeight:700,fontSize:12,color:'#0C447C',marginBottom:4}}>Posture animateur</div>
          <div style={{fontSize:12,color:'#0C447C',lineHeight:1.6}}>Quand tu demandes a ChatGPT combien fait "9.11 vs 9.9", il peut se tromper car il "voit" des tokens, pas des nombres au sens mathematique. C'est un tres bon exemple pour montrer que l'IA ne "comprend" pas, elle predit.</div>
        </div>
      </Wrap>}

      {s === 22 && <Wrap onNext={marbles.length>=6?next:undefined} onPrev={prev} canNext={marbles.length>=6}>
        <h3 style={{ fontSize:17, fontWeight:700, marginBottom:4 }}>🎲 Le sac de billes</h3>
        <p style={{ fontSize:12, color:'#555', marginBottom:14 }}>Pioche des billes pour comprendre les probabilités</p>
        <div style={{ textAlign:'center', padding:'18px', background:'#F0F0F4', borderRadius:14, marginBottom:14 }}>
          <div style={{ fontSize:44, marginBottom:6 }}>🎒</div>
          <div style={{ fontSize:12, color:'#555', marginBottom:10 }}>Billes rouges 🔴 et vertes 🟢 à l'intérieur</div>
          {marbles.length<6 ? (
            <Btn onClick={()=>setMarbles(m=>[...m,'🔴'])} full={false}>Piocher ({6-marbles.length} restantes)</Btn>
          ) : <div style={{ fontSize:13, fontWeight:600, color:'#534AB7' }}>6 tirages effectués !</div>}
        </div>
        {marbles.length>0 && (
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:22, letterSpacing:4, marginBottom:8 }}>{marbles.join(' ')}</div>
            <div style={{ padding:10, background:'#F0F0F4', borderRadius:10, fontSize:13, lineHeight:1.6 }}>
              {marbles.length<6 ? 'Continue…' : `${marbles.filter(m=>m==='🔴').length} rouges sur 6 tirages. Ces observations modifient-elles ton estimation ? Oui ! C'est l'intuition de la probabilité conditionnelle.`}
            </div>
          </div>
        )}
        {marbles.length>=6 && <div style={{ padding:10, background:'#F0F0F4', borderRadius:10, fontSize:11, color:'var(--text3)' }}>💡 Analogie pédagogique : un LLM ne met évidemment pas ses tokens dans un sac !</div>}
      </Wrap>}

      {/* STEP 23 : Word prediction */}
      {s === 23 && <Wrap onNext={wordChoice!==null?next:undefined} onPrev={prev} canNext={wordChoice!==null}>
        <div style={{ textAlign:'center', marginBottom:18 }}>
          <h3 style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>Bonjour, comment ça…</h3>
          <p style={{ fontSize:13, color:'#555' }}>Quel token suit naturellement ?</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[{t:'🐘 éléphant',ok:false},{t:'👍 va',ok:true},{t:'💻 ordinateur',ok:false},{t:'🥫 mayonnaise',ok:false}].map((w,i)=>(
            <button key={i} onClick={()=>setWordChoice(i)} style={{
              padding:'14px 10px', borderRadius:12, fontWeight:600, fontSize:14, cursor:wordChoice===null?'pointer':'default',
              border:`2px solid ${wordChoice===null?'#E5E5E5':i===wordChoice&&w.ok?'#5DCAA5':i===wordChoice&&!w.ok?'#F0997B':w.ok&&wordChoice!==null?'#5DCAA5':'#E5E5E5'}`,
              background:wordChoice===null?'var(--bg)':i===wordChoice&&w.ok?'#E1F5EE':i===wordChoice&&!w.ok?'#FAECE7':w.ok&&wordChoice!==null?'#E1F5EE':'var(--bg)',
              color:'var(--text)'
            }}>{w.t}{wordChoice!==null&&w.ok&&' ✓'}</button>
          ))}
        </div>
        {wordChoice!==null && <div style={{ marginTop:14, padding:12, background:'#E1F5EE', borderRadius:10, fontSize:13, lineHeight:1.6, color:'#085041' }}><strong>À partir du contexte, le modèle calcule une distribution de probabilités sur les tokens susceptibles de suivre.</strong> Token après token, une phrase entière se construit.</div>}
      </Wrap>}

      {/* STEP 24 : Rabbit */}
      {s === 24 && <Wrap onNext={rabbitCtx!==null?next:undefined} onPrev={prev} canNext={rabbitCtx!==null}>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>🐰 Le défi du lapin</h3>
        <p style={{ fontSize:15, fontWeight:700, marginBottom:10, textAlign:'center' }}>« Qu'est-ce que je fais de mon lapin ? »</p>
        <p style={{ fontSize:13, color:'#555', marginBottom:12 }}>La réponse devrait être différente selon le contexte. Lequel ?</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[{icon:'👦🎄🧸',label:'Enfant + Noël + peluche',ctx:0},{icon:'🏹🐇🍳',label:'Chasseur + gibier + cuisine',ctx:1}].map(({icon,label,ctx})=>(
            <button key={ctx} onClick={()=>setRabbitCtx(ctx)} style={{ padding:'16px', borderRadius:12, border:`2px solid ${rabbitCtx===ctx?'var(--accent)':'#E5E5E5'}`, background:rabbitCtx===ctx?'var(--accent-bg)':'var(--bg2)', cursor:'pointer', textAlign:'center' }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
              <div style={{ fontSize:12, fontWeight:500 }}>{label}</div>
            </button>
          ))}
        </div>
        {rabbitCtx!==null && <div style={{ marginTop:14, padding:12, background:'#E1F5EE', borderRadius:10, fontSize:13, lineHeight:1.6, color:'#085041' }}><strong>Exact !</strong> Le même mot « lapin » n'est pas interprété de la même façon selon le contexte. C'est là qu'interviennent les vecteurs.</div>}
      </Wrap>}

      {/* STEP 25 : Vectors */}
      {s === 25 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:8,color:'#1a1a2e'}}>3. Les vecteurs : la carte mathematique du sens</h3>
        <p style={{fontSize:13,color:'#444',lineHeight:1.65,marginBottom:14}}>
          Les tokens sont des mots. Mais un ordinateur ne manipule que des nombres. Comment transformer "lapin" en quelque chose qu'un reseau peut traiter ? C'est le role des vecteurs.
        </p>
        <div style={{background:'white',borderRadius:14,border:'1.5px solid #E5E5E5',padding:'14px 16px',marginBottom:14}}>
          <div style={{fontWeight:800,fontSize:13,color:'#1a1a2e',marginBottom:8}}>Un vecteur, c'est une adresse dans un espace a des centaines de dimensions</div>
          <p style={{fontSize:13,color:'#444',lineHeight:1.7,marginBottom:10}}>
            Imagine un espace mathematique avec 768 dimensions (ou 1024, ou 4096 selon les modeles). Chaque token est place a une "adresse" precise dans cet espace. Et les adresses proches ont des sens proches.
          </p>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div style={{padding:'10px 12px',background:'#E6F1FB',borderRadius:10,fontSize:13,color:'#0C447C'}}>
              "chat" et "chaton" : vecteurs proches (meme famille semantique)
            </div>
            <div style={{padding:'10px 12px',background:'#FFDFE0',borderRadius:10,fontSize:13,color:'#CC0000'}}>
              "chat" et "marteau" : vecteurs tres eloignes
            </div>
            <div style={{padding:'10px 12px',background:'#FFF9E6',borderRadius:10,fontSize:13,color:'#8B5E00'}}>
              "roi" - "homme" + "femme" ≈ "reine" (dans certains espaces vectoriels)
            </div>
          </div>
        </div>
        <div style={{background:'white',borderRadius:14,border:'1.5px solid #E5E5E5',padding:'14px 16px',marginBottom:14}}>
          <div style={{fontWeight:800,fontSize:13,color:'#1a1a2e',marginBottom:8}}>Vecteurs contextuels : "lapin" n'a pas toujours la meme adresse</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div style={{padding:'10px 12px',background:'#E6F1FB',borderRadius:10,fontSize:13,color:'#0C447C'}}>
              "enfant + Noel + peluche + lapin" → vecteur oriente vers jouet, affection
            </div>
            <div style={{padding:'10px 12px',background:'#FAEEDA',borderRadius:10,fontSize:13,color:'#633806'}}>
              "chasseur + gibier + cuisine + lapin" → vecteur oriente vers gastronomie, nature
            </div>
          </div>
        </div>
        <div style={{background:'#F0F0F4',borderRadius:10,padding:'10px 12px',fontSize:12,color:'#555',lineHeight:1.6}}>
          Il n'existe pas un "vecteur jouet" et un "vecteur cuisine" preprogrammes. Ce sont des representations mathematiques que le modele a apprises en lisant des milliards de textes. Personne ne les a ecrites a la main.
        </div>
      </Wrap>}

      {s === 26 && <Wrap onNext={gptReveal>=3?next:undefined} onPrev={prev} canNext={gptReveal>=3}>
        <div style={{ textAlign:'center', marginBottom:18 }}>
          <h3 style={{ fontSize:34, fontWeight:900, letterSpacing:5 }}>GPT</h3>
          <p style={{ fontSize:12, color:'#555' }}>Clique pour révéler chaque lettre</p>
        </div>
        {[{l:'G',w:'Generative',d:'Le modèle génère du contenu'},{l:'P',w:'Pre-trained',d:'Pré-entraîné sur de très grandes quantités de données'},{l:'T',w:'Transformer',d:"L'architecture du modèle (2017)"}].map((item,i)=>(
          <div key={i} onClick={()=>gptReveal===i&&setGptReveal(i+1)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:gptReveal>i?'var(--accent-bg)':'var(--bg2)', border:`1.5px solid ${gptReveal>i?'var(--accent)':'#E5E5E5'}`, borderRadius:12, marginBottom:10, cursor:gptReveal===i?'pointer':'default' }}>
            <div style={{ width:38, height:38, borderRadius:10, background:gptReveal>i?'var(--accent)':'#F7F7F7', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:18, color:gptReveal>i?'white':'var(--text3)', flexShrink:0 }}>{item.l}</div>
            {gptReveal>i ? <div><div style={{ fontWeight:700, fontSize:14, color:'#3C3489' }}>{item.w}</div><div style={{ fontSize:12, color:'#555', marginTop:2 }}>{item.d}</div></div> : <div style={{ fontSize:13, color:'var(--text3)' }}>Appuie pour révéler</div>}
          </div>
        ))}
      </Wrap>}

      {/* STEP 27 : Attention */}
      {s === 27 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:8,color:'#1a1a2e'}}>4. L'Attention : le coeur du Transformer</h3>
        <p style={{fontSize:13,color:'#444',lineHeight:1.65,marginBottom:14}}>
          En 2017, une equipe de Google publie un article intitule "Attention is all you need". C'est une revolution. L'innovation cle : le mecanisme d'attention, qui permet au modele de savoir quelles parties du contexte sont les plus pertinentes pour comprendre chaque element.
        </p>
        <div style={{background:'#F0F0F4',borderRadius:14,padding:'14px 16px',marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'#555',marginBottom:10,textTransform:'uppercase' as const,letterSpacing:1}}>Exemple : comprendre "lui"</div>
          <div style={{fontSize:15,lineHeight:2.2,fontStyle:'italic',marginBottom:12}}>
            " <span style={{background:'#FFE8A3',padding:'2px 6px',borderRadius:6}}>L'enfant</span> prend <span style={{background:'#B8EAFF',padding:'2px 6px',borderRadius:6}}>son lapin</span> avant d'aller dormir avec <span style={{background:'#EEEDFE',padding:'4px 8px',borderRadius:6,fontWeight:800,border:'2px solid #534AB7'}}>lui</span>. "
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap' as const,marginBottom:8}}>
            {[['L\'enfant','45%','#FFE8A3','#8B5E00'],['son lapin','28%','#B8EAFF','#0C447C'],['prend','5%','#F0F0F4','#888'],['dormir','4%','#F0F0F4','#888']].map(([t,p,bg,tc])=>(
              <div key={t} style={{padding:'5px 10px',background:bg,borderRadius:20,fontSize:12,fontWeight:600,color:tc}}>{t} {p}</div>
            ))}
          </div>
          <div style={{fontSize:12,color:'#555'}}>Pour comprendre "lui", le modele regarde surtout "enfant" (45%) et "lapin" (28%). C'est l'attention.</div>
        </div>
        <div style={{padding:'12px 14px',background:'white',borderRadius:12,border:'1.5px solid #E5E5E5',marginBottom:12}}>
          <div style={{fontWeight:700,fontSize:13,color:'#1a1a2e',marginBottom:6}}>Le Transformer en resume</div>
          <div style={{fontSize:12,color:'#555',textAlign:'center' as const,fontWeight:600}}>
            TOKENS → VECTEURS → <span style={{color:'#534AB7'}}>ATTENTION</span> → RESEAU → PROBABILITES → LLM
          </div>
        </div>
        <div style={{background:'#EEEDFE',borderRadius:14,padding:'14px 16px',border:'1.5px solid #C5C0EF'}}>
          <div style={{fontWeight:800,fontSize:13,color:'#3C3489',marginBottom:6}}>Posture animateur</div>
          <p style={{fontSize:12,color:'#3C3489',lineHeight:1.6,margin:0}}>
            Pour expliquer l'attention simplement : "Le modele lit toute la phrase en meme temps, mais il 'fait attention' a certains mots plus qu'a d'autres selon ce qu'il cherche a comprendre." C'est une bonne formulation accessible.
          </p>
        </div>
      </Wrap>}

      {s === 28 && <Wrap onNext={next} onPrev={prev}>
        <div style={{display:'inline-block',background:'#EAF3DE',color:'#27500A',fontSize:12,fontWeight:800,padding:'4px 14px',borderRadius:20,marginBottom:12,textTransform:'uppercase' as const,letterSpacing:1}}>
          Et maintenant ?
        </div>
        <h3 style={{fontSize:20,fontWeight:900,marginBottom:14,color:'#1a1a2e'}}>Des chatbots aux agents IA</h3>
        <p style={{fontSize:13,color:'#444',lineHeight:1.65,marginBottom:14}}>
          Tu utilises un chatbot depuis des mois ? Tres bien. Mais tu n'as encore rien vu. Les agents IA representent une evolution fondamentale : ils ne se contentent plus de repondre, ils agissent.
        </p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <div style={{padding:16,background:'#F0F0F4',borderRadius:16}}>
            <div style={{fontSize:28,marginBottom:6}}>💬</div>
            <div style={{fontWeight:800,fontSize:13,marginBottom:8,color:'#1a1a2e'}}>CHATBOT</div>
            {['Tu poses une question','L\'IA genere une reponse','Tu poses une autre question','L\'IA genere une reponse'].map((t,i)=><div key={i} style={{fontSize:12,color:'#555',marginBottom:2}}>{t}</div>)}
            <div style={{fontSize:11,color:'#888',marginTop:6,fontStyle:'italic'}}>L'utilisateur orchestre chaque etape.</div>
          </div>
          <div style={{padding:16,background:'#EAF3DE',borderRadius:16,border:'2px solid #97C459'}}>
            <div style={{fontSize:28,marginBottom:6}}>🤖</div>
            <div style={{fontWeight:800,fontSize:13,marginBottom:8,color:'#27500A'}}>AGENT IA</div>
            {['Objectif defini','Planification autonome','Utilise des outils','Agit, evalue, corrige','Continue jusqu\'au but'].map((t,i)=><div key={i} style={{fontSize:12,color:'#27500A',marginBottom:2}}>→ {t}</div>)}
          </div>
        </div>
        <div style={{background:'white',borderRadius:14,border:'1.5px solid #E5E5E5',padding:'14px 16px',marginBottom:14}}>
          <div style={{fontWeight:800,fontSize:13,color:'#1a1a2e',marginBottom:8}}>Exemple concret</div>
          <p style={{fontSize:13,color:'#444',lineHeight:1.7,marginBottom:8}}>
            Au lieu de demander "quels sont mes rendez-vous ?" et copier-coller la reponse dans un email, un agent peut : consulter ton agenda, identifier les participants, chercher leurs coordonnees, rediger l'email de convocation et l'envoyer. Sans que tu interviennes a chaque etape.
          </p>
          <div style={{fontSize:12,color:'#CC0000',fontWeight:600}}>
            Attention : son niveau d'autonomie depend des autorisations accordees et des controles mis en place. Un agent ne "prend pas toutes les decisions a notre place".
          </div>
        </div>
        <div style={{background:'#E6F1FB',borderRadius:14,padding:'14px 16px',border:'1.5px solid #1CB0F6'}}>
          <div style={{fontWeight:800,fontSize:13,color:'#0C447C',marginBottom:6}}>Posture animateur</div>
          <p style={{fontSize:12,color:'#0C447C',lineHeight:1.6,margin:0}}>
            En 2025, presque toutes les grandes entreprises experimentent les agents IA. Quand tu animes la Fresque, une bonne question a poser est : "Quelle difference faites-vous entre un chatbot et un agent ?" La confusion est frequente, et la corriger cree un vrai moment de comprehension.
          </p>
        </div>
      </Wrap>}

      {s === 29 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:10,color:'#1a1a2e'}}>Les World Models : comprendre le monde avant d'agir</h3>
        <div style={{padding:'14px 16px',background:'#1a1a2e',borderRadius:14,textAlign:'center' as const,marginBottom:14}}>
          <div style={{fontSize:15,fontWeight:700,color:'white',lineHeight:1.5}}>
            Comprendre des milliards de textes suffit-il vraiment pour comprendre le monde ?
          </div>
        </div>
        <p style={{fontSize:13,color:'#444',lineHeight:1.7,marginBottom:14}}>
          Yann LeCun, directeur de la recherche en IA chez Meta, defend une these provocante : les LLM ont une limite fondamentale. Ils apprennent a partir de texte, alors qu'un humain apprend du monde de facon sensorielle, physique et causale. Un enfant de 2 ans comprend la gravite, la permanence des objets, la causalite : sans avoir lu un seul livre.
        </p>
        <div style={{display:'flex',flexWrap:'wrap' as const,gap:8,marginBottom:14}}>
          {[['👁️','Vision'],['✋','Toucher'],['🌍','Espace 3D'],['⏱️','Temps'],['🧱','Physique'],['➡️','Causalite']].map(([icon,label])=>(
            <div key={label} style={{padding:'8px 14px',background:'white',borderRadius:20,fontSize:13,display:'flex',gap:6,alignItems:'center' as const,border:'1.5px solid #E5E5E5'}}>
              <span>{icon}</span><span style={{fontWeight:500}}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
          <div style={{padding:'12px 14px',background:'#F0F0F4',borderRadius:12}}>
            <div style={{fontSize:12,fontWeight:700,color:'#555',marginBottom:4}}>LLM actuel : prediction du token suivant</div>
            <div style={{fontFamily:'monospace',fontSize:13,color:'#555'}}>P(token suivant | contexte textuel)</div>
          </div>
          <div style={{textAlign:'center' as const,fontSize:20}}>↓ ambition des world models</div>
          <div style={{padding:'12px 14px',background:'#EAF3DE',borderRadius:12}}>
            <div style={{fontSize:12,fontWeight:700,color:'#27500A',marginBottom:4}}>World Model : anticiper l'etat suivant du monde</div>
            <div style={{fontFamily:'monospace',fontSize:13,color:'#27500A'}}>P(etat suivant | etat actuel + action)</div>
          </div>
        </div>
        <div style={{background:'#EEEDFE',borderRadius:12,padding:'12px 14px',border:'1.5px solid #C5C0EF'}}>
          <p style={{fontSize:12,color:'#3C3489',lineHeight:1.6,margin:0}}>
            Les IA modernes sont deja multimodales (texte + image + son). Mais l'ambition des world models va plus loin : des representations internes permettant a une machine d'anticiper les consequences d'une action avant de l'executer. C'est une voie cle vers des robots et agents plus autonomes et plus surs.
          </p>
        </div>
      </Wrap>}

      {s === 30 && <Wrap onNext={()=>setStep(TOTAL_LEARNING)} onPrev={prev} nextLabel="Passer au quiz final →">
        <h3 style={{fontSize:20,fontWeight:900,marginBottom:8,textAlign:'center' as const,color:'#1a1a2e'}}>Synthese : les 4 ages de l'informatique</h3>
        <p style={{fontSize:13,color:'#555',lineHeight:1.65,marginBottom:16,textAlign:'center' as const}}>
          Ce que tu viens d'apprendre, en une image. Ces technologies se completent, elles ne se remplacent pas.
        </p>
        {[
          {icon:'💻',n:'1',t:'Informatique traditionnelle',b:"L'humain ecrit toutes les instructions. La machine les execute. Tracable, deterministe, limite aux situations anticipees.",bg:'#EEEDFE',c:'#3C3489'},
          {icon:'🧪',n:'2',t:'Systemes experts',b:"L'ingenieur de la connaissance formalise l'expertise en base de regles + base de faits + moteur d'inference. Raisonnement explicable, mais domaine unique.",bg:'#FAEEDA',c:'#633806'},
          {icon:'🔗',n:'3',t:'Reseaux de neurones',b:"La machine apprend ses parametres a partir de donnees et d'un objectif. Puissant mais boite noire.",bg:'#E6F1FB',c:'#0C447C'},
          {icon:'✨',n:'4',t:'IA generative',b:"De tres grands reseaux generent du contenu nouveau. Tokens + vecteurs + attention + Transformer.",bg:'#FBEAF0',c:'#72243E'},
          {icon:'🤖',n:'→',t:"Agents et world models",b:"Les modeles agissent avec des outils pour atteindre des objectifs. Les world models cherchent a anticiper les consequences d'une action avant de l'executer.",bg:'#EAF3DE',c:'#27500A'},
        ].map(({icon,n,t,b,bg,c})=>(
          <div key={n} style={{display:'flex',gap:12,padding:'12px 14px',background:bg,borderRadius:14,marginBottom:10,alignItems:'flex-start'}}>
            <div style={{minWidth:30,height:30,borderRadius:'50%',background:c,color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0}}>{n}</div>
            <div>
              <div style={{fontWeight:800,fontSize:13,color:c,marginBottom:3}}>{icon} {t}</div>
              <div style={{fontSize:12,color:c,lineHeight:1.6}}>{b}</div>
            </div>
          </div>
        ))}
        <div style={{background:'#1a1a2e',borderRadius:14,padding:'16px',marginTop:4,textAlign:'center' as const}}>
          <p style={{fontSize:14,fontWeight:700,color:'white',margin:0,lineHeight:1.6}}>
            Nous n'avons pas rendu les ordinateurs "plus intelligents". Nous avons change la maniere dont nous leur demandons de resoudre un probleme.
          </p>
        </div>
      </Wrap>}    </div>
  )
}
