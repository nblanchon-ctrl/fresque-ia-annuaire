'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

const TOTAL_LEARNING = 16

const QUIZ = [
  {
    q: "Pourquoi une intelligence artificielle n'est-elle pas juridiquement responsable aujourd'hui ?",
    opts: [
      "Parce qu'elle ne possede pas de personnalite juridique reconnue par le droit",
      "Parce que ses createurs ont signe des contrats la protegeant de toute poursuite",
      "Parce que la technologie evolue trop vite pour que les tribunaux puissent suivre",
      "Parce que les IA sont des logiciels non saisissables physiquement"
    ],
    correct: 0,
    expl: "La personnalite juridique est la cle. Elle permet d'etre titulaire de droits et d'obligations. Les personnes physiques (humains) et morales (entreprises) en ont une. Les IA, non. Sans personnalite juridique, impossible de les poursuivre ou les condamner."
  },
  {
    q: "Qu'est-ce que la personnalite juridique permet ?",
    opts: [
      "D'exercer une profession reglementee sans diplome specifique",
      "D'etre titulaire de droits et d'obligations reconnus par le droit",
      "De beneficier automatiquement de toutes les aides sociales disponibles",
      "De signer un contrat de travail sans intermediaire"
    ],
    correct: 1,
    expl: "La personnalite juridique permet au droit de s'adresser a une entite : lui reconnaitre des droits et lui imposer des obligations. Sans elle, une entite est juridiquement invisible."
  },
  {
    q: "En droit, responsabilite et conscience sont-elles synonymes ?",
    opts: [
      "Oui, on ne peut etre responsable que si on avait conscience de ses actes",
      "Non, on peut devoir reparer un dommage sans l'avoir consciemment voulu",
      "Oui, mais uniquement en matiere penale pour les crimes graves",
      "Non, mais seulement dans les pays de droit civil continental"
    ],
    correct: 1,
    expl: "Responsabilite et conscience sont distinctes. Notre droit connait de nombreux cas de responsabilite sans intention : responsabilite du fait des choses, des parents, etc. L'intention compte surtout en droit penal, pas pour toute responsabilite."
  },
  {
    q: "Qu'avait envisage le Parlement europeen dans sa resolution de 2017 sur la robotique ?",
    opts: [
      "D'interdire tout developpement d'IA autonome en Europe",
      "De creer un impot special sur les robots remplacant des emplois",
      "D'examiner a terme un statut juridique specifique pour certains robots autonomes",
      "De transferer la regulation de l'IA a l'ONU"
    ],
    correct: 2,
    expl: "En 2017, le Parlement europeen a evoque la possibilite d'un statut juridique pour certains robots tres autonomes, sans en faire le droit positif. La question de la personnalite juridique des machines est prise au serieux, mais n'est pas encore tranchee."
  },
  {
    q: "Si une IA contribue a une mauvaise decision medicale, sur qui le droit cherche-t-il la responsabilite ?",
    opts: [
      "Exclusivement sur le patient qui a accepte d'etre soigne par une IA",
      "Sur personne : les IA medicales beneficient d'une immunite totale",
      "Potentiellement sur le concepteur, l'editeur, l'hopital ou le medecin selon les cas",
      "Uniquement sur l'ingenieur ayant code le dernier correctif"
    ],
    correct: 2,
    expl: "Puisque l'IA n'est pas responsable, le droit cherche parmi les humains : concepteur, editeur, etablissement de sante, professionnel. Plusieurs acteurs peuvent etre responsables simultanement."
  },
  {
    q: "La Convention europeenne des droits de l'homme date de :",
    opts: [
      "1789, apres la Revolution francaise",
      "1945, au lendemain de la guerre",
      "1950, apres les atrocites de la Seconde Guerre mondiale",
      "2000, avec la Charte des droits fondamentaux de l'UE"
    ],
    correct: 2,
    expl: "La CEDH date de 1950, adoptee par le Conseil de l'Europe. Ces textes anciens s'appliquent aujourd'hui a des realites technologiques que leurs auteurs n'imaginaient pas du tout."
  },
  {
    q: "Quel est le principal apport de l'article 22 du RGPD face a l'IA ?",
    opts: [
      "Il oblige toutes les entreprises a nommer un DPO",
      "Il interdit completement tout traitement automatise de donnees",
      "Il encadre certaines decisions fondees exclusivement sur un traitement automatise",
      "Il cree une autorite europeenne independante de regulation de l'IA"
    ],
    correct: 2,
    expl: "L'article 22 du RGPD encadre les decisions prises exclusivement par algorithme (sans intervention humaine) qui produisent des effets juridiques sur une personne. C'est un outil existant avant l'AI Act pour limiter les decisions purement algorithmiques."
  },
  {
    q: "Quelle est la logique centrale de l'AI Act europeen ?",
    opts: [
      "Interdire tout systeme ne pouvant expliquer ses decisions",
      "Classer les systemes d'IA selon les risques et adapter les obligations en consequence",
      "Imposer une taxe sur les entreprises developpant de l'IA en Europe",
      "Creer un label 'IA de confiance' attribue par les Etats membres"
    ],
    correct: 1,
    expl: "L'AI Act classe les systemes d'IA par niveau de risque : certaines pratiques sont interdites, les systemes a haut risque ont des obligations renforcees, d'autres ont des obligations de transparence. C'est une approche par les risques."
  },
  {
    q: "Quel grand principe oriente l'objectif declare de l'AI Act ?",
    opts: [
      "Assurer la suprematie technologique europeenne",
      "Promouvoir une IA centree sur l'humain et protectrice des droits fondamentaux",
      "Simplifier au maximum les regles pour favoriser les startups",
      "Transferer la gouvernance de l'IA a l'ONU"
    ],
    correct: 1,
    expl: "L'AI Act affirme vouloir promouvoir une IA centree sur l'humain et digne de confiance, tout en protegerant les droits fondamentaux de la Charte europeenne. L'IA est un outil au service de l'humain, pas l'inverse."
  },
  {
    q: "Qu'est-ce que le 'Digital Omnibus' ?",
    opts: [
      "Un bus autonome sans conducteur deploye en Europe",
      "Un accord international UE/Etats-Unis sur l'IA",
      "Des mesures de simplification du cadre numerique europeen dont l'AI Act",
      "Un consortium d'entreprises pour financer la recherche en IA"
    ],
    correct: 2,
    expl: "Le Digital Omnibus designe des mesures proposees pour simplifier l'application du cadre numerique europeen. Il illustre la tension : comment proteger les citoyens sans freiner l'innovation face aux acteurs americains et chinois ?"
  },
  {
    q: "Historiquement, la protection des droits fondamentaux visait surtout a proteger l'individu contre :",
    opts: [
      "Les citoyens plus riches ou plus instruits",
      "Les entreprises etrangeres sur le marche national",
      "La puissance publique susceptible d'abuser de son pouvoir",
      "Les mouvements religieux influencant la politique"
    ],
    correct: 2,
    expl: "Les grands textes fondamentaux (CEDH, Declaration de 1789) visaient a proteger l'individu contre l'Etat : arrestation arbitraire, censure, discrimination. La numerisation a fait emerger un second defi : l'individu face aux grandes entreprises privees detenant des pouvoirs comparables."
  },
  {
    q: "Quel type de pouvoir les grandes plateformes numeriques exercent-elles desormais ?",
    opts: [
      "Un pouvoir militaire et diplomatique comparable aux Etats",
      "Le pouvoir de selectionner l'information, de profiler et d'influencer des decisions",
      "Un pouvoir fiscal direct sur leurs utilisateurs",
      "Le pouvoir legislatif de creer leurs propres lois"
    ],
    correct: 1,
    expl: "Les grandes plateformes peuvent rendre un contenu visible ou invisible, collecter et exploiter des donnees, profiler des individus et influencer des decisions. Avec l'IA generative, elles participent directement a la production du savoir et a la prise de decision."
  },
  {
    q: "Comment distingue-t-on la conscience de sa simulation chez une IA ?",
    opts: [
      "En mesurant la vitesse de ses reponses emotionnelles",
      "En verifiant si elle utilise des neurones biologiques",
      "C'est le probleme : nous ne disposons pas de critere etabli pour le faire",
      "En lui soumettant le test de Turing pendant 48 heures"
    ],
    correct: 2,
    expl: "Nous ne disposons meme pas d'une definition stabilisee de la conscience humaine. Comment determiner qu'une machine est consciente et non qu'elle simule des comportements conscients ? Une IA peut produire des phrases evoquant des emotions sans experience subjective."
  },
  {
    q: "Quelle question fondamentale le droit de l'IA cherche-t-il finalement a repondre ?",
    opts: [
      "Comment breveter un algorithme d'apprentissage ?",
      "Quelle puissance minimale doit avoir une IA pour etre reglementee ?",
      "Quelle place voulons-nous donner a la machine dans les decisions concernant les humains ?",
      "Comment taxer les benefices generes par les systemes d'IA ?"
    ],
    correct: 2,
    expl: "Derriere toutes les regles techniques se cache une question fondamentale : quelle place voulons-nous donner a la machine dans les decisions qui concernent des etres humains ? C'est une question juridique, ethique, politique et philosophique a la fois."
  },
  {
    q: "Le RGPD est-il un texte specifiquement consacre a l'intelligence artificielle ?",
    opts: [
      "Oui, il a ete concu specialement pour encadrer les IA generatives",
      "Oui, mais uniquement pour les IA traitant des donnees de sante",
      "Non, mais il s'applique des qu'une IA traite des donnees personnelles",
      "Non, le RGPD est un texte purement commercial sans lien avec l'IA"
    ],
    correct: 2,
    expl: "Le RGPD n'est pas un texte sur l'IA. Il date d'ailleurs d'avant l'explosion de l'IA generative. Mais des qu'un systeme d'IA traite des donnees a caractere personnel, le RGPD s'applique et peut devenir central, notamment via son article 22 sur les decisions automatisees."
  },
]

const PHASE_CELEBRATIONS = [
  {atStep:4,icon:"⚖️",title:"Bonne base juridique !",sub:"Tu comprends pourquoi les IA ne repondent pas de leurs actes. Passons a la conscience et a la responsabilite.",color:"#0C447C",bg:"#E6F1FB"},
  {atStep:8,icon:"🎯",title:"Question centrale atteinte !",sub:"Si la machine ne repond pas, qui repond ? On explore maintenant les droits fondamentaux.",color:"#2B7400",bg:"#D7FFB8"},
  {atStep:12,icon:"🏛️",title:"Contexte historique maitrise !",sub:"Tu saisis comment des textes anciens s'appliquent a des technologies nouvelles. Place au RGPD et a l'AI Act.",color:"#633806",bg:"#FAEEDA"},
  {atStep:16,icon:"🌍",title:"Introduction complete !",sub:"Tu es pret a explorer les mecanismes juridiques concrets. Le quiz t'attend !",color:"#534AB7",bg:"#EEEDFE"},
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
  { atStep: 6,  icon: '💻', title: 'Age 1 maitrise !', sub: 'Tu comprends maintenant comment les humains ont appris a faire calculer les machines.', color: '#534AB7', bg: '#EEEDFE' },
  { atStep: 11, icon: '🧪', title: 'Systemes experts explores !', sub: "Tu sais ce qu'est un moteur d'inference et pourquoi Deep Blue est fascinant.", color: '#633806', bg: '#FAEEDA' },
  { atStep: 20, icon: '🔗', title: 'Reseaux de neurones maitrise !', sub: "Tu comprends comment une machine apprend et ce qu'est la boite noire.", color: '#0C447C', bg: '#E6F1FB' },
  { atStep: 29, icon: '✨', title: 'IA generative decouverte !', sub: 'Tokens, vecteurs, attention, Transformer. Tu as tout compris.', color: '#72243E', bg: '#FBEAF0' },
  { atStep: 31, icon: '🚀', title: 'Contenu termine ! Place au quiz.', sub: '20 questions pour valider. Un score parfait debloque le badge IA MASTER.', color: '#27500A', bg: '#EAF3DE' },
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

function Wrap({ children, onNext, onPrev, canNext = true, nextLabel = 'Continuer →' }: {
  children: React.ReactNode, onNext?: () => void, onPrev?: () => void, canNext?: boolean, nextLabel?: string
}) {
  return (
    <div style={{ padding: '20px 16px 110px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ animation: 'fadeIn 0.25s ease' }}>{children}</div>
      {(onNext || onPrev) && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px 22px', background: 'white', borderTop: '1px solid #E5E5E5', zIndex: 10 }}>
          <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', gap: 10 }}>
            {onPrev && <button onClick={onPrev} style={{ padding:'15px 18px', borderRadius:16, border:'2px solid #E5E5E5', background:'white', color:'#888', fontWeight:700, fontSize:18, cursor:'pointer', flexShrink:0 }}>←</button>}
            {onNext && <button onClick={onNext} disabled={!canNext} style={{ flex:1, padding:'15px', borderRadius:16, border:'none', background:canNext?'#58CC02':'#E5E5E5', color:canNext?'white':'#AFAFAF', fontWeight:800, fontSize:15, cursor:canNext?'pointer':'default', boxShadow:canNext?'0 4px 0 #3D8A00':'none' }}>{nextLabel}</button>}
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

      {/* STEP 0 — Cover */}
      {s === 0 && <Wrap onNext={next} nextLabel="Commencer →">
        <div style={{textAlign:'center',padding:'12px 0',animation:'fadeIn .4s ease'}}>
          <div style={{fontSize:56,marginBottom:14}}>⚖️</div>
          <h1 style={{fontSize:24,fontWeight:800,marginBottom:10,lineHeight:1.3}}>IA & Droit</h1>
          <p style={{fontSize:14,color:'#555',lineHeight:1.7,marginBottom:20}}>Qui répond quand une intelligence artificielle provoque un dommage ? Ce module explore les fondements juridiques qui encadrent l'IA en Europe.</p>
          <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'center'}}>
            {[['⚖️','Responsabilité & personnalité juridique'],['🧠','La question de la conscience'],['🛡️','Les droits fondamentaux'],['📋','RGPD & AI Act'],['🌍','Géopolitique du droit de l'IA']].map(([icon,label],i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 20px',background:'white',borderRadius:12,width:'100%',maxWidth:300,border:'0.5px solid #E5E5E5'}}>
                <span style={{fontSize:18}}>{icon}</span><span style={{fontSize:14,fontWeight:500}}>{label}</span>
              </div>
            ))}
          </div>
          <p style={{marginTop:16,fontSize:12,color:'#888'}}>Introduction complète avant d'entrer dans les mécanismes concrets.</p>
        </div>
      </Wrap>}

      {/* STEP 1 — L'IA n'a pas de personnalité juridique */}
      {s === 1 && <Wrap onNext={next} onPrev={prev}>
        <Tag color="#E6F1FB"><span style={{color:'#0C447C'}}>⚖️ PARTIE 1 — Responsabilité</span></Tag>
        <h2 style={{fontSize:22,fontWeight:800,marginBottom:12,lineHeight:1.3}}>{"Une IA peut agir…"}<br/>{"mais peut-elle répondre de ses actes ?"}</h2>
        <p style={{fontSize:14,color:'#444',lineHeight:1.7,marginBottom:16}}>Lorsqu'on parle d'intelligence artificielle et de droit, une question surgit immédiatement : <strong>celle de la responsabilité.</strong></p>
        <div style={{background:'#1a1a2e',borderRadius:16,padding:'18px 20px',marginBottom:16}}>
          <div style={{fontWeight:800,fontSize:17,color:'white',textAlign:'center',lineHeight:1.5}}>{"Aujourd'hui, une intelligence artificielle n'est pas juridiquement responsable."}</div>
        </div>
        <p style={{fontSize:14,color:'#444',lineHeight:1.7}}>Pourquoi ? Tout simplement parce qu'une IA n'a pas de <strong>personnalité juridique</strong>. En droit, cette personnalité appartient aux <strong>personnes physiques</strong> (les êtres humains) et aux <strong>personnes morales</strong> (entreprises, associations). Une IA n'entre dans aucune de ces catégories.</p>
      </Wrap>}

      {/* STEP 2 — Peut-on punir une IA ? */}
      {s === 2 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:14,color:'#1a1a2e'}}>{"Peut-on condamner ChatGPT ?"}</h3>
        <p style={{fontSize:13,color:'#555',lineHeight:1.65,marginBottom:16}}>Être responsable signifie que le droit peut imputer à une personne les conséquences de certains actes. Selon les situations, cela peut prendre différentes formes :</p>
        <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:16}}>
          {[
            ['👤','Personne physique','Amende, indemnisation, prison','#EEEDFE','#3C3489'],
            ['🏢','Personne morale','Sanctions financières, interdictions, dissolution','#E1F5EE','#085041'],
            ['🤖','Intelligence artificielle','???','#FFDFE0','#CC0000'],
          ].map(([icon,type,sanction,bg,color],i)=>(
            <div key={i} style={{padding:'14px 16px',background:bg,borderRadius:14,border:`1.5px solid ${color}30`}}>
              <div style={{fontWeight:800,fontSize:14,color,marginBottom:4}}>{icon} {type}</div>
              <div style={{fontSize:13,color}}>{sanction}</div>
            </div>
          ))}
        </div>
        <div style={{background:'#FFF9E6',borderRadius:12,padding:'14px 16px',border:'1.5px solid #FFC800'}}>
          <div style={{fontWeight:700,fontSize:13,color:'#8B5E00'}}>{"🤔 En l'état actuel du droit, la réponse est non."}</div>
          <p style={{fontSize:13,color:'#8B5E00',marginTop:6,lineHeight:1.6,margin:0}}>{"On ne peut pas condamner ChatGPT à trois ans de prison. On ne peut pas demander à un algorithme de verser 100 000 € de dommages. Ni attendre d'un système informatique qu'il assume moralement ses décisions."}</p>
        </div>
      </Wrap>}

      {/* STEP 3 — Et demain ? */}
      {s === 3 && <Wrap onNext={next} onPrev={prev} nextLabel="Phase suivante →">
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:14,color:'#1a1a2e'}}>{"Et demain ? Une IA pourrait-elle devenir responsable ?"}</h3>
        <p style={{fontSize:13,color:'#555',lineHeight:1.65,marginBottom:14}}>La question est plus profonde qu'il n'y paraît. Depuis plusieurs années, la littérature juridique et philosophique s'interroge sur l'éventualité de reconnaître une <strong>personnalité juridique à certaines machines.</strong></p>
        <div style={{background:'white',borderRadius:16,border:'1.5px solid #E5E5E5',overflow:'hidden',marginBottom:14}}>
          <div style={{padding:'12px 16px',background:'#534AB7',color:'white'}}>
            <div style={{fontWeight:800,fontSize:14}}>🏛️ Parlement européen, 2017</div>
          </div>
          <div style={{padding:'14px 16px'}}>
            <p style={{fontSize:13,color:'#444',lineHeight:1.7,margin:0}}>Dans une résolution sur la robotique, le Parlement européen a évoqué la possibilité d'examiner à terme un <strong>statut juridique spécifique</strong> pour certains robots autonomes très sophistiqués. Cette piste n'est pas devenue le droit positif, mais elle ouvre une réflexion importante.</p>
          </div>
        </div>
        <div style={{background:'#F8F9FF',borderRadius:14,padding:'14px 16px',border:'1.5px solid #AFA9EC'}}>
          <div style={{fontWeight:700,fontSize:13,color:'#534AB7',marginBottom:8}}>{"🤔 La question vertigineuse"}</div>
          <p style={{fontSize:13,color:'#534AB7',lineHeight:1.7,margin:0}}>{"À quelles conditions accepterions-nous qu'une machine réponde elle-même de ses actes ? Si elle ne comprend pas ce qu'elle fait, n'éprouve aucune intention et ne possède aucune conscience… dans quelle mesure aurait-il du sens de la punir ?"}</p>
        </div>
      </Wrap>}

      {/* STEP 4 — La conscience [→ CELEBRATION] */}
      {s === 4 && <Wrap onNext={next} onPrev={prev} nextLabel="Phase suivante →">
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:14,color:'#1a1a2e'}}>{"La question de la conscience"}</h3>
        <p style={{fontSize:13,color:'#555',lineHeight:1.65,marginBottom:14}}>La conscience des machines pose une difficulté fondamentale : nous ne disposons même pas d'une définition universelle de ce qu'est la conscience <em>humaine.</em></p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <div style={{padding:14,background:'#E1F5EE',borderRadius:14,border:'1.5px solid #5DCAA5'}}>
            <div style={{fontSize:22,marginBottom:6}}>😮</div>
            <div style={{fontWeight:700,fontSize:12,color:'#085041',marginBottom:4}}>Ce qu'une IA peut faire</div>
            <div style={{fontSize:11,color:'#085041',lineHeight:1.5}}>Produire des phrases donnant l'impression qu'elle ressent, hésite, réfléchit…</div>
          </div>
          <div style={{padding:14,background:'#FFDFE0',borderRadius:14,border:'1.5px solid #FF4B4B'}}>
            <div style={{fontSize:22,marginBottom:6}}>🚫</div>
            <div style={{fontWeight:700,fontSize:12,color:'#CC0000',marginBottom:4}}>Ce qu'on ne peut pas établir</div>
            <div style={{fontSize:11,color:'#CC0000',lineHeight:1.5}}>Qu'elle possède une expérience subjective ou une conscience comparable à la nôtre.</div>
          </div>
        </div>
        <div style={{background:'#1a1a2e',borderRadius:14,padding:'16px 18px',marginBottom:14}}>
          <div style={{fontWeight:800,fontSize:14,color:'white',textAlign:'center',lineHeight:1.5}}>{"Comment distinguer la conscience de sa simulation ?"}</div>
        </div>
        <div style={{background:'#E6F1FB',borderRadius:14,padding:'14px 16px',border:'1.5px solid #85B7EB'}}>
          <div style={{fontWeight:700,fontSize:13,color:'#0C447C',marginBottom:6}}>⚖️ La nuance juridique essentielle</div>
          <p style={{fontSize:13,color:'#0C447C',lineHeight:1.7,margin:0}}>{"Responsabilité et conscience ne sont pas synonymes. Notre droit connaît déjà des situations où l'on répond d'un dommage sans l'avoir voulu. La question d'une personnalité juridique de l'IA est donc plus large que celle de sa conscience."}</p>
        </div>
      </Wrap>}

      {/* STEP 5 — Qui est responsable ? */}
      {s === 5 && <Wrap onNext={next} onPrev={prev}>
        <Tag color="#D7FFB8"><span style={{color:'#2B7400'}}>⚖️ PARTIE 2 — Qui répond ?</span></Tag>
        <h2 style={{fontSize:22,fontWeight:800,marginBottom:12,lineHeight:1.3}}>{"Si la machine n'est pas responsable… qui l'est ?"}</h2>
        <p style={{fontSize:14,color:'#444',lineHeight:1.7,marginBottom:16}}>C'est <strong>la question centrale de ce module.</strong> Puisque le droit ne considère pas l'IA comme une personne responsable, il doit chercher la responsabilité ailleurs.</p>
        <p style={{fontSize:13,color:'#555',lineHeight:1.7,marginBottom:16}}>Depuis longtemps, nos systèmes juridiques organisent la responsabilité autour des personnes qui <strong>conçoivent, fabriquent, déploient, utilisent ou contrôlent</strong> des technologies susceptibles de provoquer des dommages.</p>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {['Son concepteur ?','L'entreprise qui commercialise le système ?','L'organisation qui décide de l'utiliser ?','Le professionnel qui s'appuie sur sa recommandation ?','La personne qui prend finalement la décision ?','Plusieurs acteurs simultanément ?'].map((q,i)=>(
            <div key={i} style={{padding:'10px 14px',background:'white',borderRadius:10,border:'0.5px solid #E5E5E5',fontSize:13,color:'#1a1a2e',fontWeight:i===5?700:400,display:'flex',gap:10,alignItems:'center'}}>
              <span style={{color:'#534AB7',fontWeight:800}}>→</span>{q}
            </div>
          ))}
        </div>
      </Wrap>}

      {/* STEP 6 — Exemples concrets */}
      {s === 6 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:14,color:'#1a1a2e'}}>{"Le droit apparaît quand quelque chose se passe mal"}</h3>
        <p style={{fontSize:13,color:'#555',lineHeight:1.65,marginBottom:14}}>Dans notre usage quotidien de l'IA, ces questions semblent abstraites. Mais elles peuvent surgir brutalement.</p>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
          {[
            ['💼','Un algorithme refuse votre candidature à un emploi'],
            ['🏦','Un système vous refuse un crédit'],
            ['🏥','Une IA médicale contribue à une mauvaise décision'],
            ['👤','Un système de reconnaissance faciale vous identifie à tort'],
            ['⚠️','Un algorithme reproduit une discrimination à votre encontre'],
          ].map(([icon,txt],i)=>(
            <div key={i} style={{display:'flex',gap:12,alignItems:'center',padding:'10px 14px',background:'#FFF9E6',borderRadius:12,border:'1px solid #FFC800'}}>
              <span style={{fontSize:20,flexShrink:0}}>{icon}</span>
              <span style={{fontSize:13,color:'#8B5E00',fontWeight:500}}>{txt}</span>
            </div>
          ))}
        </div>
        <div style={{background:'#1a1a2e',borderRadius:14,padding:'16px 18px'}}>
          <div style={{fontWeight:800,fontSize:16,color:'white',textAlign:'center',marginBottom:4}}>{"Qui est responsable ?"}</div>
          <div style={{fontWeight:600,fontSize:14,color:'rgba(255,255,255,0.7)',textAlign:'center'}}>{"Quels sont mes droits ?"}</div>
        </div>
      </Wrap>}

      {/* STEP 7 — Droits fondamentaux d'abord */}
      {s === 7 && <Wrap onNext={next} onPrev={prev} nextLabel="Phase suivante →">
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:14,color:'#1a1a2e'}}>{"Avant les règles sur l'IA : les droits fondamentaux"}</h3>
        <p style={{fontSize:13,color:'#555',lineHeight:1.65,marginBottom:14}}>Notre parcours ne commencera pas immédiatement par l'AI Act. Nous remonterons d'abord beaucoup plus haut dans la hiérarchie des normes :</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
          {[
            ['🕊️','Dignité humaine'],['🗽','Liberté'],['⚖️','Égalité'],['🚫','Non-discrimination'],
            ['🔒','Vie privée'],['📊','Protection des données'],['📢','Liberté d'expression'],['🏛️','Droit à un recours'],
          ].map(([icon,label],i)=>(
            <div key={i} style={{padding:'10px 12px',background:'white',borderRadius:12,border:'0.5px solid #E5E5E5',display:'flex',gap:8,alignItems:'center'}}>
              <span style={{fontSize:18}}>{icon}</span>
              <span style={{fontSize:12,fontWeight:600,color:'#1a1a2e'}}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{background:'#E6F1FB',borderRadius:14,padding:'14px 16px',border:'1.5px solid #85B7EB'}}>
          <div style={{fontWeight:700,fontSize:13,color:'#0C447C',marginBottom:6}}>🎯 Le rôle du juge</div>
          <p style={{fontSize:13,color:'#0C447C',lineHeight:1.7,margin:0}}>{"Confronté à une situation nouvelle, le juge doit interpréter les textes existants et déterminer comment les principes juridiques s'appliquent à des réalités technologiques que leurs rédacteurs n'avaient parfois jamais imaginées."}</p>
        </div>
      </Wrap>}

      {/* STEP 8 — Textes anciens [→ CELEBRATION] */}
      {s === 8 && <Wrap onNext={next} onPrev={prev} nextLabel="Phase suivante →">
        <Tag color="#FAEEDA"><span style={{color:'#633806'}}>🏛️ PARTIE 3 — Contexte historique</span></Tag>
        <h2 style={{fontSize:20,fontWeight:800,marginBottom:12,lineHeight:1.3}}>{"Des droits anciens confrontés à un monde nouveau"}</h2>
        <p style={{fontSize:13,color:'#555',lineHeight:1.65,marginBottom:14}}>Une partie des textes qui structurent nos libertés ont été pensés dans des sociétés très différentes :</p>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
          {[
            ['1789','📜','Déclaration des droits de l'homme','Révolution française'],
            ['1950','🕊️','Convention européenne des droits de l'homme','Après la 2e Guerre mondiale'],
            ['2000','🇪🇺','Charte des droits fondamentaux de l'UE','Traité de Lisbonne (2009)'],
          ].map(([year,icon,text,ctx])=>(
            <div key={year} style={{display:'flex',gap:12,alignItems:'center',padding:'12px 14px',background:'white',borderRadius:12,border:'0.5px solid #E5E5E5'}}>
              <div style={{fontSize:24,fontWeight:900,color:'#AFA9EC',minWidth:48,textAlign:'center'}}>{year}</div>
              <div>
                <div style={{fontWeight:700,fontSize:13,color:'#1a1a2e'}}>{icon} {text}</div>
                <div style={{fontSize:11,color:'#888',marginTop:2}}>{ctx}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{background:'#FAEEDA',borderRadius:14,padding:'14px 16px',border:'1.5px solid #EF9F27'}}>
          <p style={{fontSize:13,color:'#633806',lineHeight:1.7,margin:0}}>{"Notre environnement informationnel a profondément changé. Ces textes doivent aujourd'hui s'appliquer à des réalités — IA générative, algorithmes de recommandation, profilage de masse — que leurs rédacteurs n'imaginaient pas."}</p>
        </div>
      </Wrap>}

      {/* STEP 9 — Individu vs État */}
      {s === 9 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:14,color:'#1a1a2e'}}>{"De la puissance publique… aux pouvoirs numériques"}</h3>
        <p style={{fontSize:13,color:'#555',lineHeight:1.65,marginBottom:14}}>Historiquement, protéger les libertés fondamentales visait surtout à répondre à une question :</p>
        <div style={{background:'#1a1a2e',borderRadius:14,padding:'16px 18px',marginBottom:14,textAlign:'center'}}>
          <div style={{fontWeight:800,fontSize:16,color:'white',marginBottom:4}}>{"Comment empêcher l'État d'abuser de son pouvoir ?"}</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.6)'}}>{"Police · Justice · Administration · Norme"}</div>
        </div>
        <p style={{fontSize:13,color:'#555',lineHeight:1.65,marginBottom:14}}>Cette question reste fondamentale. Mais la numérisation en a fait apparaître une autre :</p>
        <div style={{background:'#534AB7',borderRadius:14,padding:'16px 18px',textAlign:'center'}}>
          <div style={{fontWeight:800,fontSize:14,color:'white',lineHeight:1.5}}>{"Comment protéger l'individu lorsque certains pouvoirs autrefois réservés aux États sont détenus par des acteurs privés transnationaux ?"}</div>
        </div>
      </Wrap>}

      {/* STEP 10 — Nouveaux pouvoirs */}
      {s === 10 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:14,color:'#1a1a2e'}}>{"L'apparition de nouveaux pouvoirs numériques"}</h3>
        <p style={{fontSize:13,color:'#555',lineHeight:1.65,marginBottom:14}}>Une partie considérable de nos relations se déroule dans des espaces numériques privés. Se sont ainsi constitués des espaces qui ressemblent parfois à de véritables <strong>sociétés parallèles.</strong></p>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
          {[
            ['🔍','Pouvoir de sélectionner l'information et de rendre un contenu visible ou invisible'],
            ['📊','Pouvoir de collecter, exploiter des données et profiler des individus'],
            ['🎯','Pouvoir d'influencer certaines décisions'],
            ['🤖','Avec l'IA : pouvoir de participer directement à la prise de décision'],
          ].map(([icon,txt],i)=>(
            <div key={i} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'10px 14px',background:'#EEEDFE',borderRadius:12,border:'1px solid #AFA9EC'}}>
              <span style={{fontSize:18,flexShrink:0}}>{icon}</span>
              <span style={{fontSize:13,color:'#3C3489',lineHeight:1.55}}>{txt}</span>
            </div>
          ))}
        </div>
        <div style={{background:'#E6F1FB',borderRadius:14,padding:'14px 16px',border:'1.5px solid #85B7EB'}}>
          <p style={{fontSize:13,color:'#0C447C',lineHeight:1.7,margin:0}}>{"C'est cette transformation qui explique la réponse européenne à l'intelligence artificielle. Le droit de l'IA ne peut pas être étudié indépendamment de l'économie et de la géopolitique de l'IA."}</p>
        </div>
      </Wrap>}

      {/* STEP 11 — RGPD */}
      {s === 11 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:14,color:'#1a1a2e'}}>{"Le droit n'est pas resté immobile : le RGPD"}</h3>
        <div style={{background:'white',borderRadius:16,border:'1.5px solid #E5E5E5',overflow:'hidden',marginBottom:14}}>
          <div style={{padding:'12px 16px',background:'#003189',display:'flex',gap:10,alignItems:'center'}}>
            <span style={{fontSize:24}}>🇪🇺</span>
            <div>
              <div style={{fontWeight:800,fontSize:15,color:'white'}}>RGPD</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.6)'}}>Règlement Général sur la Protection des Données · 2018</div>
            </div>
          </div>
          <div style={{padding:'14px 16px'}}>
            <p style={{fontSize:13,color:'#444',lineHeight:1.7,marginBottom:10}}>Le RGPD n'est pas un texte sur l'IA. Mais dès qu'un système d'IA traite des données personnelles, il peut devenir central.</p>
            <div style={{background:'#E6F1FB',borderRadius:10,padding:'12px 14px',border:'1px solid #85B7EB'}}>
              <div style={{fontWeight:700,fontSize:13,color:'#0C447C',marginBottom:4}}>📌 Article 22 — Décisions automatisées</div>
              <p style={{fontSize:12,color:'#0C447C',lineHeight:1.6,margin:0}}>Encadre les décisions fondées <strong>exclusivement</strong> sur un traitement automatisé lorsqu'elles produisent des effets juridiques ou affectent significativement une personne.</p>
            </div>
          </div>
        </div>
        <div style={{background:'#FFF9E6',borderRadius:14,padding:'14px 16px',border:'1.5px solid #FFC800'}}>
          <p style={{fontSize:13,color:'#8B5E00',lineHeight:1.7,margin:0,fontWeight:500}}>{"💡 Le droit de l'IA n'a pas commencé avec l'AI Act."}</p>
        </div>
      </Wrap>}

      {/* STEP 12 — AI Act [→ CELEBRATION] */}
      {s === 12 && <Wrap onNext={next} onPrev={prev} nextLabel="Phase suivante →">
        <Tag color="#EEEDFE"><span style={{color:'#3C3489'}}>📋 PARTIE 4 — AI Act & géopolitique</span></Tag>
        <h2 style={{fontSize:20,fontWeight:800,marginBottom:12,lineHeight:1.3}}>{"Puis arrive l'AI Act"}</h2>
        <p style={{fontSize:13,color:'#555',lineHeight:1.65,marginBottom:14}}>Sa logique est différente du RGPD. Il ne s'intéresse pas seulement aux données personnelles — il construit un cadre autour des <strong>systèmes d'IA, de leurs usages et des risques qu'ils génèrent.</strong></p>
        <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:14}}>
          {[
            ['🚫','Certaines pratiques sont interdites','#FFDFE0','#CC0000'],
            ['⚠️','Certains systèmes = haut risque avec obligations renforcées','#FAEEDA','#633806'],
            ['ℹ️','Certaines utilisations = obligations de transparence','#E6F1FB','#0C447C'],
            ['🤖','Modèles à usage général = règles spécifiques','#EEEDFE','#3C3489'],
          ].map(([icon,txt,bg,color])=>(
            <div key={txt} style={{padding:'12px 14px',background:bg,borderRadius:12,display:'flex',gap:10,alignItems:'center'}}>
              <span style={{fontSize:20,flexShrink:0}}>{icon}</span>
              <span style={{fontSize:13,color,fontWeight:600,lineHeight:1.4}}>{txt}</span>
            </div>
          ))}
        </div>
        <div style={{background:'#534AB7',borderRadius:14,padding:'14px 16px'}}>
          <p style={{fontSize:13,color:'white',lineHeight:1.7,margin:0}}>{"Pour comprendre l'AI Act, il ne suffit pas d'apprendre une pyramide des risques. Il faut se mettre à la place du législateur européen : de quoi cherche-t-il à nous protéger ?"}</p>
        </div>
      </Wrap>}

      {/* STEP 13 — Objectif de l'AI Act */}
      {s === 13 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:14,color:'#1a1a2e'}}>{"De quoi le législateur cherche-t-il vraiment à nous protéger ?"}</h3>
        <p style={{fontSize:13,color:'#555',lineHeight:1.65,marginBottom:14}}>Il suffit de lire l'objectif même de l'AI Act :</p>
        <div style={{background:'#003189',borderRadius:16,padding:'20px 20px',marginBottom:16,textAlign:'center'}}>
          <div style={{fontSize:28,marginBottom:10}}>🇪🇺</div>
          <p style={{fontSize:14,color:'white',lineHeight:1.7,fontStyle:'italic',margin:0}}>{'"Promouvoir une intelligence artificielle centrée sur l'humain et digne de confiance, tout en assurant un niveau élevé de protection de la santé, de la sécurité et des droits fondamentaux."'}</p>
        </div>
        <p style={{fontSize:13,color:'#555',lineHeight:1.65,marginBottom:14}}>{"L'AI Act s'inscrit dans une certaine conception européenne de la relation entre technologie, marché, individu et droits fondamentaux."}</p>
        <div style={{background:'#E6F1FB',borderRadius:14,padding:'14px 16px',border:'1.5px solid #85B7EB'}}>
          <div style={{fontWeight:700,fontSize:13,color:'#0C447C',marginBottom:6}}>🎯 Posture animateur</div>
          <p style={{fontSize:13,color:'#0C447C',lineHeight:1.7,margin:0}}>{"Quand tu présenteras ce module, rappelle que l'AI Act n'est pas une loi contre l'IA. C'est une tentative de faire en sorte que l'IA reste au service de l'humain et respecte ses droits fondamentaux."}</p>
        </div>
      </Wrap>}

      {/* STEP 14 — Tensions actuelles */}
      {s === 14 && <Wrap onNext={next} onPrev={prev}>
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:14,color:'#1a1a2e'}}>{"Mais cette conception européenne est sous tension"}</h3>
        <p style={{fontSize:13,color:'#555',lineHeight:1.65,marginBottom:14}}>Depuis l'entrée en vigueur de l'AI Act, sa mise en œuvre fait l'objet de discussions, d'ajustements et de mesures de simplification.</p>
        <div style={{background:'white',borderRadius:16,border:'1.5px solid #E5E5E5',overflow:'hidden',marginBottom:14}}>
          <div style={{padding:'12px 16px',background:'#F0F0F4',borderBottom:'1px solid #E5E5E5'}}>
            <div style={{fontWeight:800,fontSize:13,color:'#1a1a2e'}}>📰 Le Digital Omnibus</div>
          </div>
          <div style={{padding:'14px 16px'}}>
            <p style={{fontSize:13,color:'#444',lineHeight:1.7,margin:0}}>La Commission européenne a proposé des mesures visant à <strong>simplifier et rendre plus proportionnée</strong> l'application du cadre numérique européen et de l'AI Act. Derrière se joue un débat beaucoup plus large.</p>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {[
            'Comment protéger les citoyens sans freiner excessivement l'innovation ?',
            'Comment imposer des obligations aux entreprises européennes face à la concurrence américaine et chinoise ?',
            'Comment préserver les droits fondamentaux tout en développant une industrie compétitive ?',
          ].map((q,i)=>(
            <div key={i} style={{padding:'10px 14px',background:'#F8F9FF',borderRadius:10,border:'1px solid #AFA9EC',fontSize:13,color:'#534AB7',display:'flex',gap:8,alignItems:'flex-start'}}>
              <span style={{fontWeight:800,flexShrink:0}}>?</span>{q}
            </div>
          ))}
        </div>
      </Wrap>}

      {/* STEP 15 — Récapitulatif du voyage */}
      {s === 15 && <Wrap onNext={next} onPrev={prev} nextLabel="Passer au quiz →">
        <h3 style={{fontSize:18,fontWeight:800,marginBottom:14,color:'#1a1a2e'}}>{"Le voyage que nous allons faire"}</h3>
        <p style={{fontSize:13,color:'#555',lineHeight:1.65,marginBottom:14}}>Nous allons partir d'une question apparemment simple :</p>
        <div style={{background:'#1a1a2e',borderRadius:14,padding:'16px 18px',marginBottom:16,textAlign:'center'}}>
          <div style={{fontWeight:800,fontSize:16,color:'white',lineHeight:1.5}}>{"Qui est responsable lorsqu'une intelligence artificielle produit un dommage ?"}</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
          {[
            ['⚖️','Personnalité juridique, responsabilité, conscience'],
            ['👥','De la machine aux humains et organisations'],
            ['🛡️','Droits fondamentaux et rôle du juge'],
            ['📋','RGPD et AI Act : les réponses concrètes'],
            ['🌍','Innovation, compétitivité et droits fondamentaux'],
          ].map(([icon,txt],i)=>(
            <div key={i} style={{display:'flex',gap:12,alignItems:'center',padding:'10px 14px',background:'white',borderRadius:12,border:'0.5px solid #E5E5E5',animation:'fadeIn .3s ease'}}>
              <span style={{fontSize:20,flexShrink:0}}>{icon}</span>
              <span style={{fontSize:13,fontWeight:500,color:'#1a1a2e'}}>{txt}</span>
            </div>
          ))}
        </div>
        <div style={{background:'#534AB7',borderRadius:14,padding:'16px 18px',textAlign:'center'}}>
          <div style={{fontWeight:800,fontSize:15,color:'white',lineHeight:1.5}}>{"Quelle place voulons-nous donner à la machine dans les décisions qui concernent les êtres humains ?"}</div>
        </div>
      </Wrap>}

    </div>
  )
}
