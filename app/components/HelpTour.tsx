'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const steps = [
  { title:'Bienvenue dans votre Espace Animateur', body:'Découvrez les principales rubriques, les ressources pédagogiques et les outils de collaboration de La Fresque de l’IA.', href:'/annuaire', target:'a[href="/dashboard"]' },
  { title:'Votre profil animateur', body:'Depuis « Mon profil », actualisez votre photo, votre présentation, vos coordonnées et vos informations professionnelles.', href:'/dashboard', target:'form' },
  { title:'L’annuaire des animateurs', body:'Retrouvez les membres du réseau, consultez leurs fiches et identifiez les animateurs avec lesquels échanger ou collaborer.', href:'/annuaire', target:'a[href="/annuaire"]' },
  { title:'L’agenda du réseau', body:'Consultez les événements, les interventions et les rencontres à venir dans la rubrique Agenda.', href:'/agenda', target:'a[href="/agenda"]' },
  { title:'Mattermost : échanger avec la communauté', body:'Mattermost est l’espace de discussion de la communauté : échangez avec les autres animateurs, posez vos questions et partagez vos expériences. Le bouton ouvre Mattermost dans un autre site.', href:'https://community.lafresquedelia.com/la-fresque-de-lia/channels/town-square', target:'a[href*="community.lafresquedelia.com"]' },
  { title:'Le Drive : vos ressources documentaires', body:'Accédez au Drive partagé pour retrouver les propositions commerciales, les supports d’animation et les autres documents utiles à vos Fresques de l’IA.', href:'https://drive.google.com/drive/u/0/folders/15CjtB5Mw-vdrBguv4VdQtWgMU7A6lEq4', target:'a[href*="drive.google.com"]' },
  { title:'Le référentiel des cartes', body:'Retrouvez l’ensemble des cartes du jeu de La Fresque de l’IA dans un référentiel dédié, avec une explication pour chaque carte. Ce lien ouvre le référentiel sur un autre site.', href:'https://fresquedelia.ovh/', target:'a[href*="fresquedelia.ovh"]' },
  { title:'La formation et les modules pédagogiques', body:'Consultez les modules de formation pour approfondir les notions abordées pendant vos animations.', href:'/formation', target:'a[href="/formation"]' },
  { title:'Les CRM', body:'Les espaces CRM permettent de suivre les relations avec les organisations, la prospection et les événements.', href:'/crm', target:'a[href="/crm"]' },
  { title:'Le Tour de France', body:'Dans le CRM Tour de France, sélectionnez une région pour retrouver les organisations, les documents et les actions de prospection.', href:'/crm/tdf', target:'.tdf-page-root' },
  { title:'Le planning éditorial', body:'Depuis le CRM Tour de France, ouvrez le planning éditorial pour consulter les publications nationales et locales et copier les textes.', href:'/crm/tdf', target:'.tdf-page-root' },
  { title:'Votre centre d’aide', body:'Le bouton « Besoin d’aide ? » vous permet de relancer cette visite à tout moment ou de consulter les questions fréquentes.', href:'/annuaire', target:'#fresque-help-button' },
]
const faqs = [
  ['Compte et profil', [
    ['Comment modifier mon profil ?', 'Ouvrez « Mon profil » depuis l’espace animateur, modifiez vos informations puis enregistrez.'],
    ['Comment ajouter une photo ?', 'Dans « Mon profil », sélectionnez une photo puis enregistrez votre profil.'],
    ['Comment changer mon mot de passe ?', 'La rubrique « Mon profil » contient une section de changement de mot de passe.'],
  ]],
  ['Annuaire, agenda et communauté', [
    ['Où retrouver les autres animateurs ?', 'Ouvrez l’annuaire pour rechercher les animateurs du réseau et consulter leurs profils.'],
    ['Où consulter les événements ?', 'Ouvrez « Agenda » depuis l’espace animateur pour retrouver les événements et rencontres à venir.'],
    ['À quoi sert Mattermost ?', 'Mattermost est le chat de la communauté : il permet de discuter avec les autres animateurs, de poser des questions et de partager des expériences. Le lien ouvre un service externe.'],
  ]],
  ['Ressources, cartes et formation', [
    ['Où trouver les modules de formation ?', 'Ouvrez la rubrique « Formation » depuis votre espace animateur.'],
    ['Où trouver les propositions commerciales et les supports d’animation ?', 'Cliquez sur « Drive » depuis l’accueil de l’espace animateur. Vous y trouverez les ressources documentaires partagées, notamment les propositions commerciales et les supports d’animation.'],
    ['Où retrouver toutes les cartes de La Fresque de l’IA ?', 'Ouvrez « Cartes de la fresque » depuis l’accueil pour accéder au référentiel des cartes, avec une explication pour chacune.'],
    ['Le Drive et le référentiel sont-ils dans l’application ?', 'Non, ces boutons donnent accès à des ressources hébergées sur des sites externes.'],
  ]],
  ['CRM et Tour de France', [
    ['Comment accéder au Tour de France ?', 'Ouvrez le CRM puis sélectionnez « Tour de France ».'],
    ['Comment ajouter une organisation ?', 'Dans le CRM Tour de France, sélectionnez la région concernée, puis ouvrez la partie prospection pour ajouter une organisation.'],
    ['Où sont les documents partagés ?', 'Les documents sont accessibles depuis les espaces documentaires du CRM Tour de France, selon les droits de votre compte.'],
    ['Où trouver les publications LinkedIn ?', 'Ouvrez « Planning éditorial » dans le CRM Tour de France pour consulter les publications nationales et locales.'],
  ]],
  ['Aide', [
    ['Comment revoir la visite guidée ?', 'Cliquez sur « Besoin d’aide ? », puis sur « Déclencher la démo de l’outil ».'],
    ['Pourquoi une fonctionnalité est-elle inaccessible ?', 'Certaines rubriques dépendent des droits associés à votre compte. Contactez l’administrateur de votre espace si nécessaire.'],
  ]],
] as const

export default function HelpTour() {
  const pathname = usePathname()
  const [userId, setUserId] = useState<string | null>(null)
  const [panel, setPanel] = useState<'closed'|'menu'|'faq'|'tour'>('closed')
  const [step, setStep] = useState(0)
  const [expanded, setExpanded] = useState('')
  const [highlight, setHighlight] = useState<DOMRect | null>(null)
  const isPublic = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/offline'].includes(pathname || '/')
  useEffect(() => {
    if (isPublic) { setUserId(null); setPanel('closed'); return }
    let active = true
    const client = createClient()
    client.auth.getUser().then(({data}) => {
      if (!active || !data.user) return
      setUserId(data.user.id)
      const pending = sessionStorage.getItem(`fresque-tour-step-${data.user.id}`)
      if (pending !== null) { sessionStorage.removeItem(`fresque-tour-step-${data.user.id}`); setStep(Number(pending)); setPanel('tour'); return }
      const key = `fresque-help-tour-v1-${data.user.id}`
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, 'started')
        setStep(0)
        setPanel('tour')
      }
    }).catch(()=>{})
    return () => { active = false }
  }, [isPublic])
  useEffect(() => {
    if (panel !== 'tour') { setHighlight(null); return }
    const update = () => {
      const target = document.querySelector(steps[step].target)
      setHighlight(target ? target.getBoundingClientRect() : null)
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true) }
  }, [panel, step, pathname])
  const finish = () => { if(userId) localStorage.setItem(`fresque-help-tour-v1-${userId}`, 'completed'); setPanel('closed') }
  const move = (next:number) => { if(next >= steps.length) { finish(); return }; setStep(Math.max(0,next)) }
  if (isPublic || !userId) return null
  const current = steps[step]
  return <>
    <button id="fresque-help-button" onClick={()=>setPanel(panel==='closed'?'menu':'closed')} style={{position:'fixed',bottom:20,right:20,zIndex:11000,background:'#534AB7',color:'#fff',border:0,borderRadius:30,padding:'12px 17px',boxShadow:'0 5px 22px #2223',cursor:'pointer',fontWeight:700,fontSize:13}}>❔ Besoin d’aide ?</button>
    {panel !== 'closed' && <div style={{position:'fixed',inset:0,zIndex:10990,background:panel==='tour'?'rgba(10,18,38,.57)':'rgba(10,18,38,.28)'}} onClick={()=>setPanel('closed')} />}
    {panel==='tour' && highlight && highlight.width>0 && <div aria-hidden="true" style={{position:'fixed',left:Math.max(0,highlight.left-6),top:Math.max(0,highlight.top-6),width:highlight.width+12,height:highlight.height+12,border:'3px solid #7B6AF0',borderRadius:12,boxShadow:'0 0 0 5px #fff9',pointerEvents:'none',zIndex:10995}} />}
    {panel==='tour' && <div role="dialog" aria-modal="true" aria-label="Visite guidée" style={{position:'fixed',zIndex:11001,left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'min(440px,calc(100vw - 32px))',background:'white',borderRadius:18,padding:24,boxShadow:'0 18px 65px #0004',color:'#20223A'}}>
      <div style={{fontSize:12,color:'#6A619D',fontWeight:700,marginBottom:12}}>VISITE GUIDÉE · {step+1} / {steps.length}</div>
      <h2 style={{fontSize:21,margin:'0 0 12px'}}>{current.title}</h2>
      <p style={{fontSize:14,lineHeight:1.65,color:'#4C5164'}}>{current.body}</p>
      {pathname!==current.href && <a href={current.href} target={current.href.startsWith('http') ? '_blank' : undefined} rel={current.href.startsWith('http') ? 'noopener noreferrer' : undefined} onClick={()=>{if(userId) sessionStorage.setItem(`fresque-tour-step-${userId}`,String(step))}} style={{display:'inline-block',fontSize:13,color:'#534AB7',fontWeight:700,marginBottom:12}}>Ouvrir cette rubrique ↗</a>}
      <div style={{height:5,background:'#ECEAF6',borderRadius:6,overflow:'hidden',margin:'14px 0'}}><div style={{width:`${(step+1)/steps.length*100}%`,height:'100%',background:'#534AB7'}} /></div>
      <div style={{display:'flex',gap:8,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap'}}><button onClick={finish} style={plain}>Passer la visite</button><div style={{display:'flex',gap:8}}><button onClick={()=>move(step-1)} disabled={step===0} style={plain}>Précédent</button><button onClick={()=>move(step+1)} style={primary}>{step===steps.length-1?'Terminer':'Suivant →'}</button></div></div>
    </div>}
    {(panel==='menu'||panel==='faq') && <div role="dialog" aria-label="Centre d’aide" style={{position:'fixed',zIndex:11001,bottom:78,right:16,width:'min(440px,calc(100vw - 32px))',maxHeight:'min(650px,calc(100vh - 110px))',overflowY:'auto',background:'white',borderRadius:18,padding:22,boxShadow:'0 18px 65px #0003',color:'#20223A'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><h2 style={{fontSize:20,margin:0}}>❔ Centre d’aide</h2><button onClick={()=>setPanel('closed')} style={plain} aria-label="Fermer">✕</button></div>
      {panel==='menu'?<><p style={{fontSize:14,color:'#616579'}}>Découvrez votre espace ou retrouvez une réponse à vos questions.</p><button style={{...primary,width:'100%',margin:'8px 0'}} onClick={()=>{setStep(0);setPanel('tour')}}>▶ Déclencher la démo de l’outil</button><button style={{...plain,width:'100%',padding:12,border:'1px solid #ddd',borderRadius:9}} onClick={()=>setPanel('faq')}>📖 Questions fréquentes (FAQ)</button></>:<><button style={plain} onClick={()=>setPanel('menu')}>← Retour</button>{faqs.map(([group,items],i)=><section key={group} style={{marginTop:18}}><h3 style={{fontSize:15,marginBottom:8}}>{group}</h3>{items.map(([q,a],j)=>{const key=`${i}-${j}`;return <div key={key} style={{borderBottom:'1px solid #E8E8EE'}}><button onClick={()=>setExpanded(expanded===key?'':key)} style={{...plain,textAlign:'left',width:'100%',padding:'11px 0',display:'flex',justifyContent:'space-between',gap:8}}>{q}<span>{expanded===key?'−':'+'}</span></button>{expanded===key&&<p style={{fontSize:13,lineHeight:1.6,color:'#5B6070',margin:'0 0 12px'}}>{a}</p>}</div>})}</section>)}</>}
    </div>}
  </>
}
const plain: React.CSSProperties = {background:'transparent',border:0,cursor:'pointer',color:'#534AB7',fontWeight:600,fontSize:13,padding:'8px 5px'}
const primary: React.CSSProperties = {background:'#534AB7',border:0,borderRadius:9,cursor:'pointer',color:'white',fontWeight:700,fontSize:13,padding:'10px 15px'}
