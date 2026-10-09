'use client'
import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

type Region = { id: string; nom: string }
type AnimateurLight = { id: string; nom: string; photo_url: string | null; is_admin: boolean }
type TdfAnim = { id: string; region_id: string; animateur_id: string; role: string | null; animateur: AnimateurLight }
type Org = { id: string; region_id: string; nom: string; secteur: string | null; taille: string | null; referent_id: string | null; commentaire: string | null; statut: string; prospection_active: boolean; prospection_started_at: string | null; created_by: string; created_at: string; referent?: { nom: string } | null }
type Etape = { id: string; organisation_id: string; etape: number; label: string; statut: string; due_at: string | null; fait_at: string | null; notes: string | null; fait_par: string | null }
type Doc = { id: string; region_id: string | null; nom: string; file_url: string; file_name: string; is_global: boolean; uploaded_by: string; created_at: string }

const REGIONS: Region[] = [
  {id:'idf',nom:'Île-de-France'},{id:'hdf',nom:'Hauts-de-France'},{id:'nor',nom:'Normandie'},
  {id:'bre',nom:'Bretagne'},{id:'pdl',nom:'Pays de la Loire'},{id:'cen',nom:'Centre-Val de Loire'},
  {id:'ges',nom:'Grand Est'},{id:'bfc',nom:'Bourgogne-Franche-Comté'},{id:'naq',nom:'Nouvelle-Aquitaine'},
  {id:'ara',nom:'Auvergne-Rhône-Alpes'},{id:'occ',nom:'Occitanie'},{id:'pac',nom:'PACA'},{id:'cor',nom:'Corse'},
]

const STATUTS: Record<string,{label:string;bg:string;color:string;border:string}> = {
  a_contacter:{label:'À contacter',bg:'#F0F0F4',color:'#555',border:'#CCC'},
  contacte:{label:'Contacté',bg:'#E6F1FB',color:'#0C447C',border:'#85B7EB'},
  rdv_fait:{label:'RDV fait',bg:'#FAEEDA',color:'#633806',border:'#EF9F27'},
  accepte:{label:'Accepté ✓',bg:'#D7FFB8',color:'#2B7400',border:'#58CC02'},
  refuse:{label:'Refusé',bg:'#FFDFE0',color:'#CC0000',border:'#FF4B4B'},
}
const ETAPE_LABELS = ['1er mail de contact','Mail de relance','2ème mail de relance','Mail de clôture']
const ETAPE_DELAIS = [0,3,6,10]

/* ════════════════════════════════════════════════════
   CARTE DE FRANCE — paths SVG précis (Lambert-93 simplifié)
   ViewBox: 0 0 680 760
   ════════════════════════════════════════════════════ */
const REG: Record<string,{d:string;cx:number;cy:number;label:string}> = {
  hdf:{
    d:'M 270,28 L 302,20 L 342,16 L 382,20 L 415,28 L 432,38 L 445,55 L 452,75 L 448,98 L 440,118 L 428,138 L 408,155 L 385,168 L 362,178 L 338,185 L 315,188 L 295,185 L 278,175 L 268,160 L 262,142 L 260,122 L 262,98 L 265,72 L 266,50 Z',
    cx:358,cy:102,label:'Hauts-de-France'
  },
  nor:{
    d:'M 170,148 L 192,132 L 215,122 L 242,115 L 268,115 L 278,128 L 278,145 L 278,160 L 278,175 L 295,185 L 315,188 L 338,185 L 362,178 L 385,168 L 395,185 L 392,205 L 380,225 L 360,242 L 335,255 L 308,262 L 280,265 L 252,262 L 225,255 L 200,242 L 180,228 L 168,212 L 162,195 L 165,178 Z',
    cx:282,cy:192,label:'Normandie'
  },
  bre:{
    d:'M 62,225 L 88,208 L 118,196 L 148,188 L 172,188 L 188,198 L 195,215 L 195,235 L 188,258 L 175,280 L 155,300 L 132,316 L 105,325 L 78,320 L 55,305 L 40,285 L 35,262 L 38,242 L 48,230 Z',
    cx:118,cy:258,label:'Bretagne'
  },
  idf:{
    d:'M 338,185 L 362,178 L 385,168 L 405,172 L 420,182 L 428,198 L 425,218 L 415,232 L 398,242 L 378,248 L 358,248 L 340,242 L 328,228 L 325,212 L 328,198 Z',
    cx:376,cy:212,label:'Île-de-France'
  },
  ges:{
    d:'M 405,172 L 432,165 L 445,155 L 452,138 L 452,118 L 448,98 L 452,75 L 455,58 L 462,42 L 478,38 L 498,45 L 518,58 L 535,78 L 548,102 L 555,128 L 555,155 L 548,180 L 535,202 L 518,222 L 500,238 L 480,248 L 460,252 L 440,248 L 425,238 L 420,222 L 420,205 L 420,182 L 405,172 Z',
    cx:488,cy:152,label:'Grand Est'
  },
  pdl:{
    d:'M 168,215 L 180,228 L 200,242 L 225,255 L 252,262 L 280,265 L 308,262 L 325,265 L 335,278 L 335,298 L 325,315 L 308,328 L 288,338 L 265,342 L 240,342 L 215,338 L 192,328 L 172,315 L 158,300 L 152,282 L 155,262 L 162,245 L 168,232 Z',
    cx:242,cy:298,label:'Pays de la Loire'
  },
  cen:{
    d:'M 325,212 L 340,242 L 358,248 L 378,248 L 398,242 L 415,232 L 425,218 L 428,232 L 432,252 L 435,272 L 432,292 L 422,308 L 408,322 L 388,332 L 365,338 L 342,342 L 318,342 L 298,338 L 280,328 L 270,315 L 268,298 L 270,278 L 278,262 L 290,252 L 308,248 L 325,245 Z',
    cx:368,cy:285,label:'Centre-Val de Loire'
  },
  bfc:{
    d:'M 425,218 L 440,212 L 460,215 L 480,222 L 500,238 L 518,255 L 528,278 L 530,302 L 525,325 L 512,345 L 495,358 L 475,368 L 452,372 L 430,368 L 412,358 L 402,342 L 398,322 L 400,302 L 405,282 L 408,262 L 408,245 L 415,232 L 425,218 Z',
    cx:468,cy:292,label:'Bourgogne-FC'
  },
  naq:{
    d:'M 152,282 L 172,278 L 198,272 L 225,268 L 252,268 L 278,272 L 298,282 L 312,298 L 322,318 L 325,338 L 322,362 L 315,388 L 302,412 L 285,432 L 265,448 L 242,458 L 218,462 L 195,458 L 172,448 L 152,432 L 135,412 L 122,388 L 115,362 L 115,338 L 118,312 L 125,290 L 138,278 Z',
    cx:222,cy:372,label:'Nouvelle-Aquitaine'
  },
  ara:{
    d:'M 402,302 L 415,295 L 430,292 L 452,295 L 475,305 L 495,322 L 510,342 L 518,365 L 518,388 L 510,410 L 498,428 L 480,442 L 460,452 L 438,458 L 418,458 L 398,448 L 382,432 L 370,412 L 362,390 L 358,368 L 360,348 L 365,328 L 375,312 L 388,302 Z',
    cx:440,cy:375,label:'Auvergne-Rhône-Alpes'
  },
  occ:{
    d:'M 265,432 L 285,415 L 308,402 L 325,388 L 340,372 L 355,358 L 368,348 L 382,348 L 395,358 L 400,375 L 402,395 L 400,415 L 392,432 L 378,448 L 360,460 L 338,468 L 315,472 L 292,472 L 268,468 L 248,458 L 235,445 L 230,430 L 235,418 L 248,410 Z',
    cx:322,cy:428,label:'Occitanie'
  },
  pac:{
    d:'M 418,432 L 435,418 L 452,408 L 468,402 L 482,400 L 498,402 L 512,412 L 522,428 L 525,448 L 518,465 L 505,478 L 488,488 L 468,492 L 448,490 L 430,480 L 418,465 L 412,448 Z',
    cx:468,cy:448,label:'PACA'
  },
  cor:{
    d:'M 548,495 L 562,478 L 578,472 L 595,475 L 608,488 L 615,505 L 615,525 L 608,542 L 595,555 L 578,560 L 562,555 L 550,542 L 544,525 L 544,510 Z',
    cx:580,cy:516,label:'Corse'
  },
}

/* ── Composant carte ─────────────────────────────────── */
function FranceMap({selected,counts,onSelect}:{selected:string|null;counts:Record<string,number>;onSelect:(id:string)=>void}) {
  const [hov,setHov] = React.useState<string|null>(null)

  const fill = (id:string) => {
    if (id===selected) return '#4338CA'
    if (id===hov) return '#818CF8'
    const n = counts[id]||0
    if (n>0) return '#BFDBFE'
    return '#E8EDF8'
  }
  const stroke = (id:string) => id===selected?'#312E81':id===hov?'#4338CA':'#94A3C0'
  const sw = (id:string) => id===selected||id===hov?2:1

  return (
    <div style={{position:'relative',width:'100%',maxWidth:540}}>
      <svg viewBox="0 0 680 590" style={{width:'100%',overflow:'visible'}}>
        <defs>
          {/* Fond */}
          <radialGradient id="bg" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#F0F4FF"/>
            <stop offset="100%" stopColor="#C8D8EE"/>
          </radialGradient>
          {/* Gradient surface */}
          <linearGradient id="surf" x1="15%" y1="5%" x2="85%" y2="95%">
            <stop offset="0%" stopColor="#F8FAFF"/>
            <stop offset="100%" stopColor="#D8E4F4"/>
          </linearGradient>
          {/* Ombre */}
          <filter id="sh" x="-8%" y="-8%" width="116%" height="120%">
            <feDropShadow dx="3" dy="6" stdDeviation="6" floodColor="#4338CA" floodOpacity="0.18"/>
          </filter>
          {/* Glow sélection */}
          <filter id="sel" x="-12%" y="-12%" width="124%" height="124%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#4338CA" floodOpacity="0.5"/>
          </filter>
          {/* Low-poly triangulation overlay */}
          <clipPath id="fr">
            <path d="M270,28 L452,22 L478,38 L548,102 L555,180 L518,260 L530,340 L512,428 L525,448 L488,492 L338,500 L195,488 L115,380 L120,310 L155,265 L115,260 L40,285 L38,240 L118,190 L165,185 L195,215 L252,215 L265,155 Z"/>
          </clipPath>
        </defs>

        {/* Fond marin */}
        <rect width="680" height="590" fill="url(#bg)" rx="14"/>

        {/* Texture vagues mer subtile */}
        {[0,1,2,3].map(i=>(
          <ellipse key={i} cx={80+i*180} cy={540} rx={60+i*20} ry={8} fill="rgba(148,180,220,0.25)" style={{transform:`scaleX(${1+i*0.2})`}}/>
        ))}

        {/* Textes mer */}
        <text x="80" y="420" fontSize="12" fill="#6B9EC8" fontStyle="italic" opacity="0.7" transform="rotate(-8,80,420)">Atlantique</text>
        <text x="86" y="200" fontSize="11" fill="#6B9EC8" fontStyle="italic" opacity="0.6" transform="rotate(-5,86,200)">Manche</text>
        <text x="560" y="490" fontSize="10" fill="#6B9EC8" fontStyle="italic" opacity="0.6">Méditerranée</text>

        {/* Ombre portée France */}
        <path
          d="M278,38 L460,32 L486,48 L556,112 L563,190 L526,270 L538,350 L520,438 L533,458 L496,502 L346,510 L203,498 L123,390 L128,320 L163,275 L123,270 L48,295 L46,250 L126,200 L173,195 L203,225 L260,225 L273,165 Z"
          fill="rgba(67,56,202,0.12)" transform="translate(7,14)" style={{filter:'blur(8px)'}}
        />

        {/* Régions */}
        {Object.entries(REG).map(([id,{d,cx,cy,label}])=>{
          const n=counts[id]||0
          const sel=selected===id
          return (
            <g key={id}
              onClick={()=>onSelect(id)}
              onMouseEnter={()=>setHov(id)}
              onMouseLeave={()=>setHov(null)}
              style={{cursor:'pointer'}}
              filter={sel?'url(#sel)':undefined}
            >
              <path d={d} fill={fill(id)} stroke={stroke(id)} strokeWidth={sw(id)} strokeLinejoin="round" style={{transition:'fill .2s,stroke .2s'}}/>
              {/* Badge organisations */}
              {n>0&&(
                <g>
                  <circle cx={cx} cy={cy-10} r={12} fill={sel?'white':'#3B4FD8'} stroke={sel?'#4338CA':'none'} strokeWidth="1.5"/>
                  <text x={cx} y={cy-6} textAnchor="middle" fontSize="10" fill={sel?'#4338CA':'white'} fontWeight="800">{n}</text>
                </g>
              )}
              {/* Label */}
              <text x={cx} y={cy+(n>0?5:1)} textAnchor="middle"
                fontSize={label.length>18?7:label.length>14?8:label.length>10?9:10}
                fill={sel?'white':hov===id?'#1E1B4B':'#1E3356'}
                fontWeight={sel?800:600}
                style={{pointerEvents:'none',userSelect:'none',transition:'fill .2s'}}
              >{label}</text>
            </g>
          )
        })}

        {/* Contour extérieur France (par-dessus pour finition) */}
        <path
          d="M270,28 L302,20 L342,16 L382,20 L415,28 L432,38 L445,55 L455,58 L462,42 L478,38 L498,45 L518,58 L535,78 L548,102 L555,128 L555,155 L548,180 L535,202 L518,222 L500,238 L480,248 L460,252 L440,248 L425,238 L420,222 L420,205 L408,262 L408,282 L405,302 L402,342 L398,375 L402,395 L400,415 L392,432 L378,448 L360,460 L338,468 L315,472 L292,472 L268,468 L248,458 L235,445 L230,430 L235,418 L265,432 L285,415 L265,448 L242,458 L218,462 L195,458 L172,448 L152,432 L135,412 L122,388 L115,362 L115,338 L118,312 L125,290 L138,278 L152,282 L138,278 L125,290 L115,338 L115,260 L88,270 L62,262 L40,285 L35,262 L38,242 L48,230 L62,225 L88,208 L118,196 L148,188 L172,188 L168,212 L162,195 L165,178 L170,148 L192,132 L215,122 L242,115 L268,115 L278,128 L278,145 L265,122 L265,72 L266,50 L270,28 Z"
          fill="none" stroke="#7B93C5" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" opacity="0.8"
        />

        {/* Lignes low-poly décoratives */}
        <g opacity="0.35" clipPath="url(#fr)">
          {[
            [340,16,480,245],[480,245,555,155],[555,155,445,55],[445,55,340,16],
            [340,16,270,28],[270,28,172,188],[172,188,195,215],[195,215,340,16],
            [340,16,325,212],[325,212,480,245],[195,215,325,212],[325,212,265,432],
            [265,432,115,362],[115,362,152,282],[152,282,195,215],[480,245,402,302],
            [402,302,412,448],[412,448,265,432],[265,432,480,245],[480,245,340,16],
            [402,302,265,432],[325,212,402,302],[152,282,325,212],[115,362,265,432],
          ].map(([x1,y1,x2,y2],i)=>(
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3B4FD8" strokeWidth="0.8"/>
          ))}
          {[[340,16],[480,245],[555,155],[445,55],[270,28],[172,188],[195,215],[325,212],[265,432],[115,362],[152,282],[402,302],[412,448]].map(([cx,cy],i)=>(
            <circle key={i} cx={cx} cy={cy} r="2.5" fill="#3B4FD8" opacity="0.7"/>
          ))}
        </g>

        {/* Drapeau + label */}
        <g transform="translate(24,545)">
          <rect width="38" height="26" rx="3" fill="white" stroke="#C8D4E8" strokeWidth="0.8"/>
          <rect width="13" height="26" rx="3" fill="#002395"/>
          <rect x="13" width="12" height="26" fill="white"/>
          <rect x="25" width="13" height="26" rx="3" fill="#ED2939"/>
          <rect width="38" height="26" rx="3" fill="none" stroke="#C8D4E8" strokeWidth="0.8"/>
        </g>
        <text x="70" y="562" fontSize="12" fill="#334E7A" fontWeight="700">France métropolitaine</text>
      </svg>

      {/* Légende */}
      <div style={{display:'flex',gap:16,justifyContent:'center',marginTop:8,fontSize:11,color:'#6B7A99'}}>
        <span style={{display:'flex',alignItems:'center',gap:4}}>
          <span style={{width:12,height:12,borderRadius:3,background:'#E8EDF8',border:'1px solid #94A3C0',display:'inline-block'}}/>
          Aucune organisation
        </span>
        <span style={{display:'flex',alignItems:'center',gap:4}}>
          <span style={{width:12,height:12,borderRadius:3,background:'#BFDBFE',border:'1px solid #60A5FA',display:'inline-block'}}/>
          Avec organisations
        </span>
        <span style={{display:'flex',alignItems:'center',gap:4}}>
          <span style={{width:12,height:12,borderRadius:3,background:'#4338CA',display:'inline-block'}}/>
          Sélectionnée
        </span>
      </div>
    </div>
  )
}

export default function TDFPage() {
  const supabase = createClient()
  const [me,setMe]=useState<AnimateurLight|null>(null)
  const [tdfAnims,setTdfAnims]=useState<TdfAnim[]>([])
  const [orgs,setOrgs]=useState<Org[]>([])
  const [etapes,setEtapes]=useState<Etape[]>([])
  const [docs,setDocs]=useState<Doc[]>([])
  const [selected,setSelected]=useState<string|null>(null)
  const [tab,setTab]=useState<'equipe'|'crm'|'docs'>('equipe')
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)
  const [saving,setSaving]=useState(false)
  const [myRole,setMyRole]=useState('')
  const [showOrgForm,setShowOrgForm]=useState(false)
  const [orgForm,setOrgForm]=useState({nom:'',secteur:'',taille:'',referent_id:'',commentaire:''})
  const [expandedOrg,setExpandedOrg]=useState<string|null>(null)
  const [etapeNotes,setEtapeNotes]=useState<Record<string,string>>({})
  const [docUploading,setDocUploading]=useState(false)
  const fileRef=useRef<HTMLInputElement>(null)
  const fileGlobalRef=useRef<HTMLInputElement>(null)

  useEffect(()=>{
    const init=async()=>{
      try{
        const {data:{user}}=await supabase.auth.getUser()
        if(!user){window.location.href='/crm';return}
        const [{data:meData},{data:tdfData,error:e2},{data:orgData,error:e3},{data:docData}]=await Promise.all([
          supabase.from('animateurs').select('id,nom,photo_url,is_admin').eq('id',user.id).single(),
          supabase.from('tdf_animateurs').select('*,animateur:animateurs(id,nom,photo_url,is_admin)'),
          supabase.from('tdf_organisations').select('*,referent:animateurs(nom)').order('created_at',{ascending:false}),
          supabase.from('tdf_documents').select('*').order('created_at',{ascending:false}),
        ])
        if(e2?.code==='42P01'||e3?.code==='42P01'){setError('Tables manquantes. Exécutez SQL_TDF.sql dans Supabase.');setLoading(false);return}
        if(e2)console.warn('tdf_animateurs:',e2.message)
        if(e3)console.warn('tdf_organisations:',e3.message)
        setMe(meData)
        setTdfAnims((tdfData as TdfAnim[])||[])
        setOrgs((orgData as Org[])||[])
        setDocs(docData||[])
      }catch(err){setError('Erreur de connexion.')}
      setLoading(false)
    }
    init()
  },[])

  const reg=REGIONS.find(r=>r.id===selected)
  const regAnims=tdfAnims.filter(a=>a.region_id===selected)
  const regOrgs=orgs.filter(o=>o.region_id===selected)
  const regDocs=docs.filter(d=>d.region_id===selected||d.is_global)
  const isMember=regAnims.some(a=>a.animateur_id===me?.id)
  const orgCounts=orgs.reduce((acc,o)=>({...acc,[o.region_id]:(acc[o.region_id]||0)+1}),{} as Record<string,number>)

  const joinRegion=async()=>{
    if(!me||!selected)return;setSaving(true)
    const {data,error}=await supabase.from('tdf_animateurs').insert({region_id:selected,animateur_id:me.id,role:myRole||null}).select('*,animateur:animateurs(id,nom,photo_url,is_admin)').single()
    if(!error&&data)setTdfAnims(prev=>[...prev,data as TdfAnim])
    setSaving(false);setMyRole('')
  }
  const leaveRegion=async()=>{
    if(!me||!selected||!confirm('Se désinscrire ?'))return
    await supabase.from('tdf_animateurs').delete().eq('region_id',selected).eq('animateur_id',me.id)
    setTdfAnims(prev=>prev.filter(a=>!(a.region_id===selected&&a.animateur_id===me.id)))
  }
  const addOrg=async()=>{
    if(!me||!selected||!orgForm.nom.trim())return;setSaving(true)
    const {data,error}=await supabase.from('tdf_organisations').insert({...orgForm,region_id:selected,created_by:me.id,secteur:orgForm.secteur||null,taille:orgForm.taille||null,referent_id:orgForm.referent_id||null,commentaire:orgForm.commentaire||null}).select('*,referent:animateurs(nom)').single()
    if(!error&&data)setOrgs(prev=>[data as Org,...prev])
    setOrgForm({nom:'',secteur:'',taille:'',referent_id:'',commentaire:''});setShowOrgForm(false);setSaving(false)
  }
  const startProspection=async(org:Org)=>{
    const now=new Date()
    const rows=ETAPE_LABELS.map((label,i)=>{const due=new Date(now);due.setDate(due.getDate()+ETAPE_DELAIS[i]);return{organisation_id:org.id,etape:i+1,label,due_at:due.toISOString(),statut:'en_attente',fait_at:null,notes:null,fait_par:null}})
    await supabase.from('tdf_etapes').upsert(rows,{onConflict:'organisation_id,etape'})
    await supabase.from('tdf_organisations').update({prospection_active:true,prospection_started_at:now.toISOString(),statut:'contacte'}).eq('id',org.id)
    setOrgs(prev=>prev.map(o=>o.id===org.id?{...o,prospection_active:true,statut:'contacte'}:o))
    const {data}=await supabase.from('tdf_etapes').select('*').eq('organisation_id',org.id).order('etape')
    if(data)setEtapes(prev=>[...prev.filter(e=>e.organisation_id!==org.id),...data])
    setExpandedOrg(org.id)
  }
  const validateEtape=async(etape:Etape,statut:string)=>{
    if(!me)return
    const update={statut,fait_at:statut==='fait'?new Date().toISOString():null,fait_par:me.id,notes:etapeNotes[etape.id]||etape.notes}
    await supabase.from('tdf_etapes').update(update).eq('id',etape.id)
    setEtapes(prev=>prev.map(e=>e.id===etape.id?{...e,...update}:e))
  }
  const changeStatut=async(orgId:string,statut:string)=>{
    await supabase.from('tdf_organisations').update({statut}).eq('id',orgId)
    setOrgs(prev=>prev.map(o=>o.id===orgId?{...o,statut}:o))
  }
  const deleteOrg=async(org:Org)=>{
    if(!confirm(`Supprimer "${org.nom}" ?`))return
    await supabase.from('tdf_organisations').delete().eq('id',org.id)
    setOrgs(prev=>prev.filter(o=>o.id!==org.id))
  }
  const uploadDoc=async(file:File,isGlobal:boolean)=>{
    if(!me){alert('Non connecté');return}
    setDocUploading(true)
    try{
      const path=`${isGlobal?'global':selected||'global'}/${Date.now()}_${file.name}`
      const {data:up,error:upErr}=await supabase.storage.from('tdf-docs').upload(path,file,{upsert:true})
      if(upErr){
        // Bucket peut ne pas exister — insérer sans file_url
        console.warn('Storage error:',upErr.message)
        const {data:doc,error:dbErr}=await supabase.from('tdf_documents').insert({
          region_id:isGlobal?null:selected,
          nom:file.name.replace(/\.[^.]+$/,''),
          file_url:'',file_name:file.name,
          is_global:isGlobal,uploaded_by:me.id
        }).select().single()
        if(dbErr){alert('Erreur ajout : '+dbErr.message)}
        else if(doc){setDocs(prev=>[doc,...prev])}
      } else {
        const {data:urlData}=supabase.storage.from('tdf-docs').getPublicUrl(path)
        const {data:doc,error:dbErr}=await supabase.from('tdf_documents').insert({
          region_id:isGlobal?null:selected,
          nom:file.name.replace(/\.[^.]+$/,''),
          file_url:urlData.publicUrl,file_name:file.name,
          is_global:isGlobal,uploaded_by:me.id
        }).select().single()
        if(dbErr){alert('Erreur ajout : '+dbErr.message)}
        else if(doc){setDocs(prev=>[doc,...prev])}
      }
    }catch(err){alert('Erreur inattendue : '+String(err))}
    setDocUploading(false)
    if(fileRef.current)fileRef.current.value=''
    if(fileGlobalRef.current)fileGlobalRef.current.value=''
  }
  const deleteDoc=async(doc:Doc)=>{
    if(!confirm(`Supprimer "${doc.nom}" ?`))return
    await supabase.from('tdf_documents').delete().eq('id',doc.id)
    setDocs(prev=>prev.filter(d=>d.id!==doc.id))
  }
  const daysLate=(e:Etape)=>(!e.due_at||e.statut==='fait')?0:Math.max(0,Math.floor((Date.now()-new Date(e.due_at).getTime())/86400000))

  if(loading)return<div className="container"><div className="empty"><p>Chargement…</p></div></div>
  if(error)return<div className="container"><div className="card" style={{background:'#FFDFE0',border:'1.5px solid #FF4B4B',marginTop:24}}><div style={{fontWeight:700,color:'#CC0000',marginBottom:8}}>⚠️ {error}</div></div><a href="/crm" className="btn" style={{marginTop:16,display:'inline-flex'}}>← Retour</a></div>

  return(
    <div style={{minHeight:'100vh',background:'#F1F5FB'}}>
      <style>{`.ttab{padding:9px 14px;border:none;background:none;cursor:pointer;font-weight:600;font-size:13px;border-bottom:2.5px solid transparent;color:#888;transition:all .15s}.ttab.act{border-bottom-color:#4338CA;color:#4338CA}@keyframes slIn{from{transform:translateX(30px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

      {/* Header */}
      <div style={{background:'white',borderBottom:'1px solid #E5E5E5',padding:'14px 24px',display:'flex',alignItems:'center',gap:14,position:'sticky',top:0,zIndex:30,boxShadow:'0 1px 6px rgba(67,56,202,0.08)'}}>
        <a href="/crm" style={{color:'#888',fontSize:18,textDecoration:'none',fontWeight:700}}>←</a>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:17,color:'#1a1a2e'}}>🗺️ Tour de France — Fresque de l'IA</div>
          <div style={{fontSize:11,color:'#888',marginTop:1}}>Cliquez sur une région pour gérer l'équipe et la prospection</div>
        </div>
        <div style={{display:'flex',gap:14,alignItems:'center'}}>
          <div style={{display:'flex',gap:10,fontSize:12}}>
            <span style={{fontWeight:700,color:'#4338CA'}}>👥 {tdfAnims.length}</span>
            <span style={{fontWeight:700,color:'#1E3A5F'}}>🏢 {orgs.length}</span>
            <span style={{fontWeight:700,color:'#2B7400'}}>✅ {orgs.filter(o=>o.statut==='accepte').length}</span>
          </div>
          {me?.is_admin&&(
            <label style={{display:'flex',gap:6,padding:'6px 14px',background:'#4338CA',color:'white',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',alignItems:'center'}}>
              {docUploading?'⏳':'+ Doc global'}
              <input ref={fileGlobalRef} type="file" style={{display:'none'}} onChange={e=>{if(e.target.files?.[0])uploadDoc(e.target.files[0],true)}}/>
            </label>
          )}
        </div>
      </div>

      <div style={{display:'flex',height:'calc(100vh - 65px)',overflow:'hidden'}}>
        {/* Colonne carte */}
        <div style={{width:selected?460:'100%',transition:'width .3s',padding:'20px 24px',overflowY:'auto',display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
          <FranceMap selected={selected} counts={orgCounts} onSelect={id=>{ setSelected(s=>s===id?null:id); setTab('equipe'); setExpandedOrg(null) }}/>
          {!selected&&(
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,width:'100%',maxWidth:460}}>
              {[{icon:'👥',val:tdfAnims.length,label:'Animateurs inscrits',color:'#4338CA'},{icon:'🏢',val:orgs.length,label:'Organisations',color:'#1E3A5F'},{icon:'✅',val:orgs.filter(o=>o.statut==='accepte').length,label:'Acceptées',color:'#2B7400'}].map(s=>(
                <div key={s.label} style={{background:'white',borderRadius:14,padding:'14px',textAlign:'center',border:'1px solid #E5E5E5',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                  <div style={{fontSize:22}}>{s.icon}</div>
                  <div style={{fontWeight:800,fontSize:22,color:s.color}}>{s.val}</div>
                  <div style={{fontSize:10,color:'#888',lineHeight:1.3,marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panneau région */}
        {selected&&reg&&(
          <div style={{flex:1,background:'white',borderLeft:'1px solid #E8EDF8',display:'flex',flexDirection:'column',animation:'slIn .2s ease',minWidth:0,boxShadow:'-4px 0 16px rgba(67,56,202,0.06)'}}>
            <div style={{padding:'14px 20px 0',borderBottom:'1px solid #E8EDF8',flexShrink:0}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div>
                  <div style={{fontWeight:800,fontSize:16,color:'#1a1a2e'}}>{reg.nom}</div>
                  <div style={{fontSize:11,color:'#888'}}>{regAnims.length} animateur(s) · {regOrgs.length} organisation(s)</div>
                </div>
                <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',fontSize:22,color:'#888',cursor:'pointer'}}>×</button>
              </div>
              <div style={{display:'flex'}}>
                {(['equipe','crm','docs'] as const).map(t=>(
                  <button key={t} className={`ttab${tab===t?' act':''}`} onClick={()=>setTab(t)}>
                    {t==='equipe'?`👥 Équipe (${regAnims.length})`:t==='crm'?`🏢 Prospection (${regOrgs.length})`:`📄 Docs (${regDocs.length})`}
                  </button>
                ))}
              </div>
            </div>

            <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>

              {tab==='equipe'&&(
                <div>
                  {!isMember?(
                    <div style={{background:'#F0F1FF',borderRadius:14,padding:'14px',marginBottom:14,border:'1px solid #C7D2FE'}}>
                      <div style={{fontWeight:700,fontSize:14,color:'#4338CA',marginBottom:8}}>Rejoindre cette région</div>
                      <input value={myRole} onChange={e=>setMyRole(e.target.value)} placeholder="Rôle (optionnel)" style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1.5px solid #A5B4FC',fontSize:13,marginBottom:8,boxSizing:'border-box' as const}}/>
                      <button onClick={joinRegion} disabled={saving} style={{padding:'8px 16px',background:'#4338CA',color:'white',border:'none',borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer'}}>{saving?'...':'M\'inscrire →'}</button>
                    </div>
                  ):(
                    <div style={{background:'#E0F2FE',borderRadius:10,padding:'10px 14px',marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:13,color:'#0C4A6E',fontWeight:600}}>✓ Inscrit sur cette région</span>
                      <button onClick={leaveRegion} style={{fontSize:11,color:'#CC0000',background:'none',border:'none',cursor:'pointer'}}>Quitter</button>
                    </div>
                  )}
                  {regAnims.length===0?<div style={{textAlign:'center',color:'#888',fontSize:13,padding:24}}>Aucun animateur inscrit</div>:
                  regAnims.map(ta=>{
                    const a=ta.animateur
                    const ini=a.nom.split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2)
                    return(
                      <div key={ta.id} style={{display:'flex',gap:12,alignItems:'center',padding:'10px 12px',background:'#F8F9FF',borderRadius:12,border:'0.5px solid #E5E5E5',marginBottom:8}}>
                        <div style={{width:36,height:36,borderRadius:'50%',background:'#E0E7FF',color:'#4338CA',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,flexShrink:0,overflow:'hidden'}}>
                          {a.photo_url?<img src={a.photo_url} alt={a.nom} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:ini}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:600,fontSize:13}}>{a.nom}</div>
                          {ta.role&&<div style={{fontSize:11,color:'#888'}}>{ta.role}</div>}
                        </div>
                        {a.is_admin&&<span style={{fontSize:10,background:'#4338CA',color:'white',padding:'2px 6px',borderRadius:20,fontWeight:700}}>Admin</span>}
                      </div>
                    )
                  })}
                </div>
              )}

              {tab==='crm'&&(
                <div>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap' as const,marginBottom:12}}>
                    {Object.entries(STATUTS).map(([k,s])=>{const n=regOrgs.filter(o=>o.statut===k).length;return n>0?<span key={k} style={{padding:'3px 9px',borderRadius:20,background:s.bg,color:s.color,border:`1px solid ${s.border}`,fontSize:11,fontWeight:600}}>{s.label} {n}</span>:null})}
                  </div>
                  <button onClick={()=>setShowOrgForm(v=>!v)} style={{width:'100%',padding:'9px',borderRadius:10,border:'1.5px dashed #A5B4FC',background:showOrgForm?'#F0F1FF':'white',color:'#4338CA',fontWeight:700,fontSize:13,cursor:'pointer',marginBottom:12}}>
                    {showOrgForm?'× Fermer':'+ Ajouter une organisation'}
                  </button>
                  {showOrgForm&&(
                    <div style={{background:'#F8F9FF',borderRadius:14,padding:'14px',border:'1.5px solid #C7D2FE',marginBottom:14}}>
                      <div style={{display:'flex',flexDirection:'column' as const,gap:8}}>
                        <input value={orgForm.nom} onChange={e=>setOrgForm(f=>({...f,nom:e.target.value}))} placeholder="Nom de l'organisation *" style={{width:'100%',padding:'7px 10px',borderRadius:8,border:'1.5px solid #E5E5E5',fontSize:13,boxSizing:'border-box' as const}}/>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                          <input value={orgForm.secteur} onChange={e=>setOrgForm(f=>({...f,secteur:e.target.value}))} placeholder="Secteur" style={{padding:'7px 10px',borderRadius:8,border:'1.5px solid #E5E5E5',fontSize:13}}/>
                          <select value={orgForm.taille} onChange={e=>setOrgForm(f=>({...f,taille:e.target.value}))} style={{padding:'7px 10px',borderRadius:8,border:'1.5px solid #E5E5E5',fontSize:13}}>
                            <option value="">Taille</option><option value="micro">&lt;50</option><option value="pme">50–500</option><option value="eti">500–2000</option><option value="grand">&gt;2000</option>
                          </select>
                        </div>
                        <select value={orgForm.referent_id} onChange={e=>setOrgForm(f=>({...f,referent_id:e.target.value}))} style={{width:'100%',padding:'7px 10px',borderRadius:8,border:'1.5px solid #E5E5E5',fontSize:13}}>
                          <option value="">Référent…</option>
                          {regAnims.map(ta=><option key={ta.animateur_id} value={ta.animateur_id}>{ta.animateur.nom}</option>)}
                        </select>
                        <textarea value={orgForm.commentaire} onChange={e=>setOrgForm(f=>({...f,commentaire:e.target.value}))} rows={2} placeholder="Commentaire…" style={{width:'100%',padding:'7px 10px',borderRadius:8,border:'1.5px solid #E5E5E5',fontSize:13,resize:'none' as const,boxSizing:'border-box' as const}}/>
                        <button onClick={addOrg} disabled={saving||!orgForm.nom.trim()} style={{alignSelf:'flex-start' as const,padding:'7px 16px',background:orgForm.nom.trim()?'#4338CA':'#E5E5E5',color:orgForm.nom.trim()?'white':'#aaa',border:'none',borderRadius:8,fontWeight:700,fontSize:13,cursor:orgForm.nom.trim()?'pointer':'default'}}>{saving?'...':'Ajouter →'}</button>
                      </div>
                    </div>
                  )}
                  {regOrgs.length===0?<div style={{textAlign:'center',color:'#888',fontSize:13,padding:24}}>Aucune organisation</div>:
                  regOrgs.map(org=>{
                    const st=STATUTS[org.statut]||STATUTS.a_contacter
                    const orgEtapes=etapes.filter(e=>e.organisation_id===org.id).sort((a,b)=>a.etape-b.etape)
                    const isExp=expandedOrg===org.id
                    return(
                      <div key={org.id} style={{borderRadius:14,border:`1.5px solid ${st.border}`,background:'white',overflow:'hidden',marginBottom:10}}>
                        <div style={{padding:'12px 14px'}}>
                          <div style={{display:'flex',gap:8,justifyContent:'space-between',alignItems:'flex-start'}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontWeight:700,fontSize:14}}>{org.nom}</div>
                              <div style={{display:'flex',gap:5,flexWrap:'wrap' as const,marginTop:4}}>
                                {org.secteur&&<span style={{fontSize:10,background:'#F0F0F4',color:'#555',padding:'2px 7px',borderRadius:20}}>{org.secteur}</span>}
                                {org.referent&&<span style={{fontSize:10,background:'#EEF2FF',color:'#4338CA',padding:'2px 7px',borderRadius:20}}>👤 {org.referent.nom}</span>}
                              </div>
                              {org.commentaire&&<div style={{fontSize:11,color:'#888',marginTop:4}}>{org.commentaire}</div>}
                            </div>
                            <select value={org.statut} onChange={e=>changeStatut(org.id,e.target.value)} style={{padding:'3px 8px',borderRadius:20,border:`1px solid ${st.border}`,background:st.bg,color:st.color,fontSize:11,fontWeight:700,cursor:'pointer',flexShrink:0}}>
                              {Object.entries(STATUTS).map(([k,s])=><option key={k} value={k}>{s.label}</option>)}
                            </select>
                          </div>
                          <div style={{marginTop:10,display:'flex',gap:8}}>
                            {!org.prospection_active?(
                              <button onClick={()=>startProspection(org)} style={{padding:'6px 12px',background:'#58CC02',color:'white',border:'none',borderRadius:8,fontWeight:700,fontSize:11,cursor:'pointer'}}>🚀 Lancer la prospection</button>
                            ):(
                              <button onClick={async()=>{setExpandedOrg(isExp?null:org.id);if(!isExp){const{data}=await supabase.from('tdf_etapes').select('*').eq('organisation_id',org.id).order('etape');if(data)setEtapes(prev=>[...prev.filter(e=>e.organisation_id!==org.id),...data])}}} style={{padding:'6px 12px',background:'#EEF2FF',color:'#4338CA',border:'1px solid #A5B4FC',borderRadius:8,fontWeight:700,fontSize:11,cursor:'pointer'}}>
                                {isExp?'▲ Masquer':`▼ Suivi (${orgEtapes.filter(e=>e.statut==='fait').length}/4)`}
                              </button>
                            )}
                            {(me?.is_admin||org.created_by===me?.id)&&<button onClick={()=>deleteOrg(org)} style={{fontSize:11,color:'#CC0000',background:'none',border:'none',cursor:'pointer'}}>supprimer</button>}
                          </div>
                        </div>
                        {isExp&&org.prospection_active&&(
                          <div style={{borderTop:'1px solid #F0F0F0',background:'#FAFBFF',padding:'10px 14px',display:'flex',flexDirection:'column' as const,gap:8}}>
                            {ETAPE_LABELS.map((label,i)=>{
                              const etape=orgEtapes.find(e=>e.etape===i+1)
                              if(!etape)return<div key={i} style={{fontSize:11,color:'#aaa',padding:'6px 0'}}>{i+1}. {label}…</div>
                              const late=daysLate(etape);const done=etape.statut==='fait'
                              return(
                                <div key={etape.id} style={{padding:'10px 12px',background:done?'#E1F5EE':'white',borderRadius:10,border:`1.5px solid ${done?'#5DCAA5':late>0?'#FF4B4B':'#E5E5E5'}`}}>
                                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:done?4:8}}>
                                    <div style={{fontWeight:700,fontSize:12,color:done?'#085041':'#1a1a2e'}}>{done?'✓ ':(`${i+1}. `)}{label}</div>
                                    <div style={{display:'flex',gap:5,alignItems:'center'}}>
                                      {late>0&&!done&&<span style={{fontSize:9,background:'#FF4B4B',color:'white',padding:'2px 6px',borderRadius:20,fontWeight:700}}>{late}j retard</span>}
                                      {etape.due_at&&<span style={{fontSize:9,color:'#888'}}>Prévu: {new Date(etape.due_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span>}
                                    </div>
                                  </div>
                                  {done?<div style={{fontSize:10,color:'#085041'}}>Fait le {new Date(etape.fait_at!).toLocaleDateString('fr-FR')}{etape.notes?` · ${etape.notes}`:''}</div>:(
                                    <div>
                                      <input value={etapeNotes[etape.id]||''} onChange={e=>setEtapeNotes(p=>({...p,[etape.id]:e.target.value}))} placeholder="Note…" style={{width:'100%',padding:'5px 8px',borderRadius:6,border:'1px solid #E5E5E5',fontSize:11,marginBottom:6,boxSizing:'border-box' as const}}/>
                                      <div style={{display:'flex',gap:6}}>
                                        <button onClick={()=>validateEtape(etape,'fait')} style={{padding:'5px 10px',background:'#58CC02',color:'white',border:'none',borderRadius:6,fontWeight:700,fontSize:11,cursor:'pointer'}}>✓ Envoyé</button>
                                        <button onClick={()=>validateEtape(etape,'skip')} style={{padding:'5px 10px',background:'#F0F0F0',color:'#888',border:'none',borderRadius:6,fontSize:11,cursor:'pointer'}}>Passer</button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {tab==='docs'&&(
                <div>
                  {(isMember||me?.is_admin)&&(
                    <label style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'10px',background:'#F0F1FF',border:'1.5px dashed #A5B4FC',borderRadius:12,textAlign:'center' as const,cursor:'pointer',marginBottom:14,fontSize:13,color:'#4338CA',fontWeight:700,gap:6}}>
                      {docUploading?'⏳ Upload...':'+ Document pour cette région'}
                      <input ref={fileRef} type="file" style={{display:'none'}} onChange={e=>{if(e.target.files?.[0])uploadDoc(e.target.files[0],false)}}/>
                    </label>
                  )}
                  {regDocs.length===0?<div style={{textAlign:'center',color:'#888',fontSize:13,padding:24}}>Aucun document</div>:
                  regDocs.map(doc=>(
                    <div key={doc.id} style={{display:'flex',gap:10,alignItems:'center',padding:'10px 12px',background:'#F8F8F8',borderRadius:12,border:'0.5px solid #E5E5E5',marginBottom:8}}>
                      <span style={{fontSize:22,flexShrink:0}}>{/\.pdf$/i.test(doc.file_name)?'📄':/\.(doc|docx)$/i.test(doc.file_name)?'📝':/\.(xls|xlsx)$/i.test(doc.file_name)?'📊':'📁'}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:600,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{doc.nom}</div>
                        <div style={{fontSize:10,color:'#888'}}>{doc.is_global?'🌍 Global':'📍 Région'} · {new Date(doc.created_at).toLocaleDateString('fr-FR')}</div>
                      </div>
                      <div style={{display:'flex',gap:6,flexShrink:0}}>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{padding:'5px 10px',background:'#4338CA',color:'white',borderRadius:6,fontSize:11,fontWeight:700,textDecoration:'none'}}>Ouvrir</a>
                        {(me?.is_admin||doc.uploaded_by===me?.id)&&<button onClick={()=>deleteDoc(doc)} style={{padding:'5px 8px',background:'none',border:'1px solid #FFDFE0',color:'#CC0000',borderRadius:6,fontSize:11,cursor:'pointer'}}>×</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
