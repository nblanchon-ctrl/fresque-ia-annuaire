'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'

type Ani = { id:string; nom:string; photo_url:string|null; email:string }
type Membre = { animateur_id:string; role:string|null; notes_role:string|null; ani?:Ani }
type SousGroupe = { id:string; name:string; type:string|null; description:string|null; created_by:string|null }
type Prospect = { id:string; name:string; secteur:string|null; region:string|null; statut:string; added_by:string|null; sous_groupe_id:string|null; created_at:string; ani?:Ani; contacts?:PContact[]; commentaires?:Comm[] }
type PContact = { id:string; name:string; email:string|null; phone:string|null; role_poste:string|null }
type Comm = { id:string; contenu:string; created_at:string; animateur_id:string|null; ani?:Ani }
type EAction = { id:string; titre:string; description:string|null; deadline:string|null; statut:string; animateur_id:string|null; ani?:Ani }
type JourJ = { id:string; name:string; organisation:string|null; email:string|null; phone:string|null; notes:string|null; transferred:boolean; sous_groupe_id:string|null }
type Doc = { id:string; categorie:string; nom:string; file_name:string; file_url:string; file_type:string|null; file_size:number|null; is_external:boolean; uploaded_by:string|null; created_at:string; ani?:Ani }
type Evenement = { id:string; name:string; date_debut:string; date_fin:string|null; description:string|null; created_by:string|null }

const STATUTS = {
  contacte:   {labelFr:'Contacte',    labelEn:'Contacted',  bg:'#E6F1FB',color:'#0C447C',border:'#85B7EB'},
  rdv_fait:   {labelFr:'RDV fait',    labelEn:'Meeting done', bg:'#FAEEDA',color:'#633806',border:'#EF9F27'},
  accepte:    {labelFr:'Accepte',     labelEn:'Accepted',     bg:'#D7FFB8',color:'#2B7400',border:'#58CC02'},
  refuse:     {labelFr:'Refuse',      labelEn:'Declined',     bg:'#FFDFE0',color:'#CC0000',border:'#FF4B4B'},
  en_attente: {labelFr:'En attente',  labelEn:'Pending',      bg:'#F0F0F4',color:'#555',   border:'#CCC'},
}
const STATUT_ORDER = ['contacte','rdv_fait','accepte','refuse','en_attente']
const SG_TYPES_FR = ['Regional','Thematique','Secteur','Autre']
const SG_TYPES_EN = ['Regional','Thematic','Sector','Other']

function Avatar({ani,size=28}:{ani?:Ani|null;size?:number}) {
  return (
    <div style={{width:size,height:size,borderRadius:'50%',overflow:'hidden',background:'#E5E5E5',flexShrink:0}}>
      {ani?.photo_url
        ?<img src={ani.photo_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        :<span style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%',fontSize:size*0.4}}>u</span>}
    </div>
  )
}

function fileEmoji(type:string|null, name:string) {
  if (!type && !name) return '📄'
  const t = (type||'').toLowerCase()
  const n = (name||'').toLowerCase()
  if (t.includes('image') || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(n)) return '🖼️'
  if (t.includes('pdf') || n.endsWith('.pdf')) return '📕'
  if (t.includes('html') || /\.html?$/.test(n)) return '🌐'
  if (t.includes('word') || /\.docx?$/.test(n)) return '📝'
  if (t.includes('sheet') || t.includes('excel') || /\.(xlsx?|csv)$/.test(n)) return '📊'
  if (t.includes('zip') || t.includes('archive') || /\.(zip|rar|7z)$/.test(n)) return '📦'
  if (t.includes('markdown') || n.endsWith('.md')) return '📃'
  if (t.includes('video') || /\.(mp4|mov|avi)$/.test(n)) return '🎬'
  return '📄'
}

function isHtml(type:string|null, name:string) {
  return (type||'').includes('html') || /\.html?$/.test((name||'').toLowerCase())
}
function isImage(type:string|null, name:string) {
  return (type||'').includes('image') || /\.(png|jpg|jpeg|gif|webp|svg)$/.test((name||'').toLowerCase())
}
function isPdf(type:string|null, name:string) {
  return (type||'').includes('pdf') || (name||'').toLowerCase().endsWith('.pdf')
}

function formatSize(bytes:number|null) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes+'B'
  if (bytes < 1024*1024) return Math.round(bytes/1024)+'KB'
  return (bytes/(1024*1024)).toFixed(1)+'MB'
}

function DocViewer({doc, onClose}:{doc:Doc; onClose:()=>void}) {
  const [htmlContent, setHtmlContent] = React.useState<string|null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(()=>{
    if (isHtml(doc.file_type, doc.file_name)) {
      setLoading(true)
      fetch(doc.file_url)
        .then(r=>r.text())
        .then(html=>{
          // Inject base tag so relative links don't break
          const withBase = html.replace('<head>', `<head><base href="${doc.file_url}">`)
          setHtmlContent(withBase)
        })
        .catch(()=>setHtmlContent('<p style="padding:2rem;color:#888">Impossible de charger le document.</p>'))
        .finally(()=>setLoading(false))
    }
  },[doc])

  return (
    <div style={{position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.8)',display:'flex',flexDirection:'column'}}>
      {/* Header */}
      <div style={{background:'#1a1a2e',padding:'12px 16px',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
        <span style={{fontSize:20}}>{fileEmoji(doc.file_type,doc.file_name)}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:14,color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{doc.nom}</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>{doc.file_name}</div>
        </div>
        <a href={doc.file_url} download={doc.file_name}
          style={{padding:'6px 14px',borderRadius:8,background:'rgba(255,255,255,0.15)',color:'white',textDecoration:'none',fontSize:12,fontWeight:600}}>
          ↓ Télécharger
        </a>
        <button onClick={onClose} style={{background:'rgba(255,255,255,0.15)',border:'none',color:'white',fontSize:18,cursor:'pointer',width:32,height:32,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
      </div>
      {/* Content */}
      <div style={{flex:1,overflow:'hidden',background:'white'}}>
        {loading&&<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#888',fontSize:14}}>Chargement...</div>}
        {!loading&&isHtml(doc.file_type,doc.file_name)&&htmlContent&&(
          <iframe srcDoc={htmlContent} style={{width:'100%',height:'100%',border:'none'}} sandbox="allow-same-origin"/>
        )}
        {!loading&&isImage(doc.file_type,doc.file_name)&&(
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',padding:16,background:'#F0F0F0'}}>
            <img src={doc.file_url} style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',borderRadius:8,boxShadow:'0 4px 20px rgba(0,0,0,0.2)'}}/>
          </div>
        )}
        {!loading&&isPdf(doc.file_type,doc.file_name)&&(
          <iframe src={doc.file_url} style={{width:'100%',height:'100%',border:'none'}}/>
        )}
        {!loading&&!isHtml(doc.file_type,doc.file_name)&&!isImage(doc.file_type,doc.file_name)&&!isPdf(doc.file_type,doc.file_name)&&!htmlContent&&(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:16}}>
            <span style={{fontSize:64}}>{fileEmoji(doc.file_type,doc.file_name)}</span>
            <div style={{fontSize:16,fontWeight:600,color:'#1a1a2e'}}>{doc.nom}</div>
            <div style={{fontSize:13,color:'#888'}}>Aperçu non disponible pour ce type de fichier.</div>
            <a href={doc.file_url} download={doc.file_name}
              style={{padding:'10px 24px',borderRadius:12,background:'#1a1a2e',color:'white',textDecoration:'none',fontSize:14,fontWeight:700}}>
              ↓ Télécharger
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

type DocSectionProps = {
  title:string; emoji:string; desc:string; categorie:string
  docs:Doc[]; me:Ani|null; isAdmin:boolean; uploading:boolean
  onUpload:(files:FileList)=>void; onDelete:(id:string,url:string)=>void
  onAddLink:(nom:string,url:string,categorie:'kit_com'|'documentation')=>void
}

function DocSection({title,emoji,desc,categorie,docs,me,isAdmin,uploading,onUpload,onDelete,onAddLink}:DocSectionProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [viewingDoc, setViewingDoc] = React.useState<Doc|null>(null)
  const [showLinkForm, setShowLinkForm] = React.useState(false)
  const [linkNom, setLinkNom] = React.useState('')
  const [linkUrl, setLinkUrl] = React.useState('')
  return (
    <div style={{background:'white',borderRadius:16,border:'1.5px solid #E5E5E5',overflow:'hidden'}}>
      {viewingDoc&&<DocViewer doc={viewingDoc} onClose={()=>setViewingDoc(null)}/>}
      <div style={{padding:'14px 18px',borderBottom:'1px solid #F0F0F0',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,flexWrap:'wrap'}}>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:15}}>{emoji} {title}</div>
          <div style={{fontSize:12,color:'#888',marginTop:2}}>{desc}</div>
        </div>
        <div style={{display:'flex',gap:6,flexShrink:0}}>
          <button onClick={()=>setShowLinkForm(v=>!v)}
            style={{padding:'6px 12px',borderRadius:10,background:showLinkForm?'#534AB7':'#EEEDFE',color:showLinkForm?'white':'#3C3489',border:'1.5px solid #AFA9EC',fontWeight:600,fontSize:12,cursor:'pointer'}}>
            🔗 Lien
          </button>
          <button onClick={()=>inputRef.current?.click()} disabled={uploading}
            style={{padding:'6px 12px',borderRadius:10,background:uploading?'#E5E5E5':'#1a1a2e',color:uploading?'#888':'white',border:'none',fontWeight:600,fontSize:12,cursor:uploading?'default':'pointer'}}>
            {uploading?'⏳':'📎 Fichier'}
          </button>
        </div>
        <input ref={inputRef} type="file" multiple style={{display:'none'}} onChange={e=>e.target.files&&onUpload(e.target.files)}/>
      </div>
      {showLinkForm&&(
        <div style={{padding:'12px 16px',background:'#F8F9FF',borderBottom:'1px solid #F0F0F0',display:'flex',gap:8,flexWrap:'wrap',alignItems:'flex-end'}}>
          <div style={{flex:2,minWidth:140}}>
            <div style={{fontSize:11,fontWeight:600,marginBottom:4,color:'#555'}}>Nom du lien</div>
            <input value={linkNom} onChange={e=>setLinkNom(e.target.value)} placeholder="Ex : Kit de com Tour de France"
              style={{width:'100%',padding:'7px 10px',borderRadius:8,border:'1.5px solid #E5E5E5',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
          </div>
          <div style={{flex:3,minWidth:180}}>
            <div style={{fontSize:11,fontWeight:600,marginBottom:4,color:'#555'}}>URL</div>
            <input value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} placeholder="https://..."
              style={{width:'100%',padding:'7px 10px',borderRadius:8,border:'1.5px solid #E5E5E5',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
          </div>
          <button onClick={()=>{if(linkNom&&linkUrl){onAddLink(linkNom,linkUrl,categorie as 'kit_com'|'documentation');setLinkNom('');setLinkUrl('');setShowLinkForm(false)}}}
            disabled={!linkNom.trim()||!linkUrl.trim()}
            style={{padding:'7px 16px',borderRadius:8,background:linkNom&&linkUrl?'#534AB7':'#E5E5E5',color:linkNom&&linkUrl?'white':'#888',border:'none',fontWeight:700,fontSize:12,cursor:linkNom&&linkUrl?'pointer':'default'}}>
            Ajouter
          </button>
        </div>
      )}
      <div style={{padding:'8px 16px 12px'}}>
        {docs.length===0&&!uploading&&(
          <div style={{textAlign:'center',padding:'24px',color:'#888',fontSize:13}}>
            <div style={{fontSize:32,marginBottom:8}}>📂</div>
            Aucun document — cliquez sur "+ Ajouter" pour uploader des fichiers.
          </div>
        )}
        {docs.map(d=>(
          <div key={d.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:12,border:'1.5px solid #F0F0F0',background:'#FAFAFA',marginBottom:6,transition:'all .15s',cursor:'pointer'}}
            onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='#1a1a2e';(e.currentTarget as HTMLDivElement).style.background='#F5F5FF'}}
            onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='#F0F0F0';(e.currentTarget as HTMLDivElement).style.background='#FAFAFA'}}
            onClick={()=>!d.is_external&&setViewingDoc(d)}>
            <span style={{fontSize:26,flexShrink:0}}>{d.is_external?'🔗':fileEmoji(d.file_type,d.file_name)}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:'#1a1a2e',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.nom}</div>
              <div style={{fontSize:11,color:'#888',marginTop:1}}>
                {d.ani?.nom}
                {d.file_size?<span> · {formatSize(d.file_size)}</span>:null}
                <span> · {new Date(d.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            <div style={{display:'flex',gap:5,flexShrink:0}} onClick={e=>e.stopPropagation()}>
              {d.is_external
                ? <a href={d.file_url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
                    style={{padding:'5px 12px',borderRadius:8,background:'#E6F1FB',color:'#0C447C',textDecoration:'none',fontSize:12,fontWeight:600}}>
                    Ouvrir ↗
                  </a>
                : <>
                    <button onClick={()=>setViewingDoc(d)}
                      style={{padding:'5px 12px',borderRadius:8,background:'#E6F1FB',color:'#0C447C',border:'none',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                      Ouvrir
                    </button>
                    <a href={d.file_url} download={d.file_name} onClick={e=>e.stopPropagation()}
                      style={{padding:'5px 10px',borderRadius:8,background:'#F0F0F4',color:'#555',textDecoration:'none',fontSize:12,fontWeight:600}}>
                      ↓
                    </a>
                  </>
              }
              {(me?.id===d.uploaded_by||isAdmin)&&(
                <button onClick={e=>{e.stopPropagation();onDelete(d.id,d.file_url)}}
                  style={{padding:'5px 10px',borderRadius:8,background:'#FFDFE0',color:'#CC0000',border:'none',fontSize:12,cursor:'pointer',fontWeight:600}}>
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CRMEvenementPage() {
  const {id} = useParams()
  const { lang } = useLanguage()
  const t2 = (fr: string, en: string) => lang === 'en' ? en : fr
  const SG_TYPES = lang === 'en' ? SG_TYPES_EN : SG_TYPES_FR
  const supabase = createClient()
  const [event, setEvent] = useState<Evenement|null>(null)
  const [animateurs, setAnimateurs] = useState<Ani[]>([])
  const [me, setMe] = useState<Ani|null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'organisation'|'prospection'|'sousgroupes'|'jourj'|'documents'>('organisation')
  const [membres, setMembres] = useState<Membre[]>([])
  const [actions, setActions] = useState<EAction[]>([])
  const [editMembre, setEditMembre] = useState<string|null>(null)
  const [membreForm, setMembreForm] = useState({role:'',notes_role:''})
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [sgFilter, setSgFilter] = useState('global')
  const [showProspectModal, setShowProspectModal] = useState(false)
  const [prospectForm, setProspectForm] = useState({name:'',secteur:'',region:'',statut:'contacte',sous_groupe_id:''})
  const [expandedProspect, setExpandedProspect] = useState<string|null>(null)
  const [newComment, setNewComment] = useState<Record<string,string>>({})
  const [showContactModal, setShowContactModal] = useState<string|null>(null)
  const [contactForm, setContactForm] = useState({name:'',email:'',phone:'',role_poste:''})
  const [sousGroupes, setSousGroupes] = useState<SousGroupe[]>([])
  const [showSGModal, setShowSGModal] = useState(false)
  const [sgForm, setSgForm] = useState({name:'',type:'',description:''})
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionForm, setActionForm] = useState({titre:'',description:'',deadline:'',animateur_id:''})
  const [jourJList, setJourJList] = useState<JourJ[]>([])
  const [showJJModal, setShowJJModal] = useState(false)
  const [jjForm, setJjForm] = useState({name:'',organisation:'',email:'',phone:'',notes:'',sous_groupe_id:''})
  const [showAddMembre, setShowAddMembre] = useState(false)
  // Documents
  const [documents, setDocuments] = useState<Doc[]>([])
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [docCategorie, setDocCategorie] = useState<'kit_com'|'documentation'>('kit_com')

  const load = useCallback(async () => {
    const [{data:{user}},{data:anis},{data:ev},{data:membs},{data:prosp},{data:pcontacts},{data:comms},{data:acts},{data:sgs},{data:jj},{data:docs}] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('animateurs').select('id,nom,photo_url,email'),
      supabase.from('crm_evenements').select('*').eq('id',id as string).single(),
      supabase.from('crm_evenement_animateurs').select('*').eq('evenement_id',id as string),
      supabase.from('crm_evenement_prospects').select('*').eq('evenement_id',id as string).order('created_at'),
      supabase.from('crm_prospect_contacts').select('*'),
      supabase.from('crm_prospect_commentaires').select('*').order('created_at'),
      supabase.from('crm_evenement_actions').select('*').eq('evenement_id',id as string).order('deadline',{ascending:true,nullsFirst:false}),
      supabase.from('crm_evenement_sous_groupes').select('*').eq('evenement_id',id as string).order('created_at'),
      supabase.from('crm_jour_j').select('*').eq('evenement_id',id as string).order('created_at'),
      supabase.from('crm_evenement_documents').select('*').eq('evenement_id',id as string).order('created_at'),
    ])
    const all = (anis||[]) as Ani[]
    setAnimateurs(all)
    setEvent(ev)
    if (user) {
      const myAni = all.find(a=>a.id===user.id)||null
      setMe(myAni)
      const {data:ad} = await supabase.from('animateurs').select('is_admin').eq('id',user.id).single()
      setIsAdmin(ad?.is_admin||false)
    }
    setMembres((membs||[]).map(m=>({...m,ani:all.find(a=>a.id===m.animateur_id)})))
    setProspects((prosp||[]).map(p=>({
      ...p, ani:all.find(a=>a.id===p.added_by),
      contacts:(pcontacts||[]).filter((c:PContact&{prospect_id:string})=>c.prospect_id===p.id),
      commentaires:(comms||[]).filter((c:Comm&{prospect_id:string})=>c.prospect_id===p.id).map((c:Comm&{prospect_id:string})=>({...c,ani:all.find(a=>a.id===c.animateur_id)})),
    })))
    setActions((acts||[]).map(a=>({...a,ani:all.find(x=>x.id===a.animateur_id)})))
    setSousGroupes((sgs||[]) as SousGroupe[])
    setJourJList((jj||[]) as JourJ[])
    setDocuments((docs||[]).map((d:Doc)=>({...d,ani:all.find(a=>a.id===d.uploaded_by)})))
    setLoading(false)
  },[id])

  useEffect(()=>{load()},[load])

  async function addMembre(animId:string) {
    await supabase.from('crm_evenement_animateurs').insert({evenement_id:id,animateur_id:animId})
    const ani=animateurs.find(a=>a.id===animId)
    setMembres(prev=>[...prev,{animateur_id:animId,role:null,notes_role:null,ani}])
    setShowAddMembre(false)
  }
  async function removeMembre(animId:string) {
    if(!confirm('Retirer ce membre ?')) return
    await supabase.from('crm_evenement_animateurs').delete().eq('evenement_id',id).eq('animateur_id',animId)
    setMembres(prev=>prev.filter(m=>m.animateur_id!==animId))
  }
  async function saveMembre(animId:string) {
    await supabase.from('crm_evenement_animateurs').update({role:membreForm.role||null,notes_role:membreForm.notes_role||null}).eq('evenement_id',id).eq('animateur_id',animId)
    setMembres(prev=>prev.map(m=>m.animateur_id===animId?{...m,role:membreForm.role||null,notes_role:membreForm.notes_role||null}:m))
    setEditMembre(null)
  }
  async function addAction() {
    if(!actionForm.titre.trim()||!me) return
    const {data}=await supabase.from('crm_evenement_actions').insert({evenement_id:id,titre:actionForm.titre.trim(),description:actionForm.description||null,deadline:actionForm.deadline||null,animateur_id:actionForm.animateur_id||null,statut:'a_faire',created_by:me.id}).select().single()
    if(data){const ani=animateurs.find(a=>a.id===data.animateur_id);setActions(prev=>[...prev,{...data,ani}].sort((a,b)=>!a.deadline?1:!b.deadline?-1:new Date(a.deadline).getTime()-new Date(b.deadline).getTime()))}
    setShowActionModal(false);setActionForm({titre:'',description:'',deadline:'',animateur_id:''})
  }
  async function toggleAction(actionId:string,current:string) {
    const next=current==='a_faire'?'en_cours':current==='en_cours'?'fait':'a_faire'
    await supabase.from('crm_evenement_actions').update({statut:next}).eq('id',actionId)
    setActions(prev=>prev.map(a=>a.id===actionId?{...a,statut:next}:a))
  }
  async function addProspect() {
    if(!prospectForm.name.trim()||!me) return
    const {data}=await supabase.from('crm_evenement_prospects').insert({evenement_id:id,name:prospectForm.name.trim(),secteur:prospectForm.secteur||null,region:prospectForm.region||null,statut:prospectForm.statut,added_by:me.id,sous_groupe_id:prospectForm.sous_groupe_id||null}).select().single()
    if(data) setProspects(prev=>[...prev,{...data,ani:me,contacts:[],commentaires:[]}])
    setShowProspectModal(false);setProspectForm({name:'',secteur:'',region:'',statut:'contacte',sous_groupe_id:''})
  }
  async function updateStatut(pId:string,statut:string) {
    await supabase.from('crm_evenement_prospects').update({statut}).eq('id',pId)
    setProspects(prev=>prev.map(p=>p.id===pId?{...p,statut}:p))
  }
  async function postComment(pId:string) {
    const txt=newComment[pId]?.trim(); if(!txt||!me) return
    const {data}=await supabase.from('crm_prospect_commentaires').insert({prospect_id:pId,animateur_id:me.id,contenu:txt}).select().single()
    if(data){setProspects(prev=>prev.map(p=>p.id===pId?{...p,commentaires:[...(p.commentaires||[]),{...data,ani:me}]}:p));setNewComment(prev=>({...prev,[pId]:''}))}
  }
  async function addContact(pId:string) {
    if(!contactForm.name.trim()||!me) return
    const {data}=await supabase.from('crm_prospect_contacts').insert({prospect_id:pId,...contactForm,added_by:me.id}).select().single()
    if(data) setProspects(prev=>prev.map(p=>p.id===pId?{...p,contacts:[...(p.contacts||[]),data]}:p))
    setShowContactModal(null);setContactForm({name:'',email:'',phone:'',role_poste:''})
  }
  async function addSG() {
    if(!sgForm.name.trim()||!me) return
    const {data}=await supabase.from('crm_evenement_sous_groupes').insert({evenement_id:id,name:sgForm.name.trim(),type:sgForm.type||null,description:sgForm.description||null,created_by:me.id}).select().single()
    if(data) setSousGroupes(prev=>[...prev,data as SousGroupe])
    setShowSGModal(false);setSgForm({name:'',type:'',description:''})
  }
  async function uploadDoc(file: File, categorie: 'kit_com'|'documentation') {
    if (!me) return
    setUploadingDoc(true)
    const ext = file.name.split('.').pop()
    const path = `${id}/${categorie}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`
    const {error:upErr} = await supabase.storage.from('event-docs').upload(path, file, {upsert:true})
    if (upErr) { setUploadingDoc(false); return }
    const {data:urlData} = supabase.storage.from('event-docs').getPublicUrl(path)
    const {data} = await supabase.from('crm_evenement_documents').insert({
      evenement_id:id, categorie, nom:file.name.replace(/\.[^/.]+$/,''),
      file_name:file.name, file_url:urlData.publicUrl,
      file_type:file.type||null, file_size:file.size||null, uploaded_by:me.id,
    }).select().single()
    if (data) setDocuments(prev=>[...prev,{...data,ani:me}])
    setUploadingDoc(false)
  }

  async function addExternalLink(nom:string, url:string, categorie:'kit_com'|'documentation') {
    if (!me||!nom.trim()||!url.trim()) return
    const fullUrl = url.startsWith('http') ? url : 'https://'+url
    const {data} = await supabase.from('crm_evenement_documents').insert({
      evenement_id:id, categorie, nom:nom.trim(),
      file_name:nom.trim(), file_url:fullUrl,
      file_type:'external', file_size:null,
      is_external:true, uploaded_by:me.id,
    }).select().single()
    if (data) setDocuments(prev=>[...prev,{...data,is_external:true,ani:me}])
  }

  async function deleteDoc(docId:string, fileUrl:string) {
    if (!confirm('Supprimer ce document ?')) return
    // Supprimer en base immédiatement (met à jour l'UI)
    const { error } = await supabase.from('crm_evenement_documents').delete().eq('id', docId)
    if (error) { alert('Erreur : ' + error.message); return }
    setDocuments(prev => prev.filter(d => d.id !== docId))
    // Supprimer du Storage en arrière-plan (non bloquant)
    try {
      const match = fileUrl.split('/object/public/event-docs/')
      if (match[1]) {
        const path = decodeURIComponent(match[1].split('?')[0])
        await supabase.storage.from('event-docs').remove([path])
      }
    } catch {}
  }

  async function addJourJ() {
    if(!jjForm.name.trim()||!me) return
    const {data}=await supabase.from('crm_jour_j').insert({evenement_id:id,...jjForm,added_by:me.id,transferred:false,sous_groupe_id:jjForm.sous_groupe_id||null}).select().single()
    if(data) setJourJList(prev=>[...prev,data as JourJ])
    setShowJJModal(false);setJjForm({name:'',organisation:'',email:'',phone:'',notes:'',sous_groupe_id:''})
  }
  async function transferToGlobal(jj:JourJ) {
    if(!me) return
    await supabase.from('crm_clients').insert({name:jj.name||(jj.organisation||'Contact Jour J'),notes:jj.notes||null,status:'prospect_chaud',created_by:me.id,referent_id:me.id})
    await supabase.from('crm_jour_j').update({transferred:true}).eq('id',jj.id)
    setJourJList(prev=>prev.map(j=>j.id===jj.id?{...j,transferred:true}:j))
  }

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',color:'#888'}}>Chargement...</div>
  if(!event) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}>Evenement introuvable</div>

  const nonMembres=animateurs.filter(a=>!membres.find(m=>m.animateur_id===a.id))
  const filteredProspects=prospects.filter(p=>sgFilter==='global'?!p.sous_groupe_id:p.sous_groupe_id===sgFilter)

  const TAB_KEYS = ['organisation','prospection','sousgroupes','jourj','documents'] as const
  const TAB_LABELS = {
    organisation:{fr:'Membres & Planning',en:'Members & Planning'},
    prospection:{fr:'Prospection',en:'Prospection'},
    sousgroupes:{fr:'Sous-groupes',en:'Sub-groups'},
    jourj:{fr:'Jour J',en:'Day J'},
    documents:{fr:'Documents',en:'Documents'},
  }

  return (
    <div style={{minHeight:'100vh',background:'#F7F7F7'}}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popIn{0%{transform:scale(0.88);opacity:0}100%{transform:scale(1);opacity:1}}
        .ev-tab{padding:10px 16px;border:none;background:transparent;cursor:pointer;font-size:13px;font-weight:500;color:#888;border-bottom:2.5px solid transparent;white-space:nowrap}
        .ev-tab.active{color:#1a1a2e;font-weight:800;border-bottom-color:#1a1a2e}
        .modal-bg{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;padding:16px}
        .modal-box{background:white;border-radius:20px;width:100%;max-width:440px;animation:popIn .25s ease}
        .modal-head{padding:18px 20px 0;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
        .modal-body{padding:0 20px 20px;display:flex;flex-direction:column;gap:12px}
        .fi{width:100%;padding:9px 12px;border-radius:10px;border:1.5px solid #E5E5E5;font-size:13px;box-sizing:border-box;outline:none;font-family:inherit}
        .fi-sm{width:100%;padding:8px 10px;border-radius:10px;border:1.5px solid #E5E5E5;font-size:12px;box-sizing:border-box;outline:none;font-family:inherit}
        .btn-main{padding:12px;border-radius:12px;border:none;font-weight:800;font-size:14px;cursor:pointer}
        .prospect-card{background:white;border-radius:14px;border:1.5px solid #E5E5E5;overflow:hidden;animation:fadeIn .3s ease;margin-bottom:10px}
        .action-row{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;border:1.5px solid #E5E5E5;background:white;margin-bottom:6px}
      `}</style>

      {/* HEADER */}
      <div style={{background:'white',borderBottom:'1px solid #E5E5E5',padding:'0 16px',position:'sticky',top:0,zIndex:30}}>
        <div style={{maxWidth:900,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',height:52}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <Link href="/crm/evenements" style={{color:'#888',textDecoration:'none',fontSize:20}}>&#8592;</Link>
            <div>
              <div style={{fontWeight:800,fontSize:15,color:'#1a1a2e'}}>{event.name}</div>
              <div style={{fontSize:11,color:'#888'}}>{new Date(event.date_debut).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}{event.date_fin&&event.date_fin!==event.date_debut&&` - ${new Date(event.date_fin).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}`}</div>
            </div>
          </div>
          <div style={{display:'flex',gap:6}}>
            <span style={{padding:'3px 10px',borderRadius:20,background:'#F0F0F4',fontSize:11,color:'#555',fontWeight:600}}>{membres.length} {t2('membres','members')}</span>
            <span style={{padding:'3px 10px',borderRadius:20,background:'#F0F0F4',fontSize:11,color:'#555',fontWeight:600}}>{prospects.length} {t2('prospects','prospects')}</span>
          </div>
        </div>
        <div style={{maxWidth:900,margin:'0 auto',display:'flex',gap:0,overflowX:'auto',borderTop:'1px solid #F0F0F0'}}>
          {TAB_KEYS.map(k=>(
            <button key={k} className={`ev-tab${tab===k?' active':''}`} onClick={()=>setTab(k as typeof tab)}>{lang==='en'?TAB_LABELS[k].en:TAB_LABELS[k].fr}</button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:900,margin:'0 auto',padding:'20px 16px 80px'}}>

        {/* ══ ORGANISATION ══ */}
        {tab==='organisation'&&<div>
          {/* Membres */}
          <div style={{background:'white',borderRadius:16,border:'1.5px solid #E5E5E5',overflow:'hidden',marginBottom:16}}>
            <div style={{padding:'14px 18px',borderBottom:'1px solid #F0F0F0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontWeight:800,fontSize:15}}>{t2("Membres de l'evenement",'Event members')}</span>
              <button onClick={()=>setShowAddMembre(!showAddMembre)} style={{padding:'6px 14px',borderRadius:10,background:'#1a1a2e',color:'white',border:'none',fontWeight:600,fontSize:12,cursor:'pointer'}}>{showAddMembre?t2('Fermer','Close'):'+ '+t2('Ajouter','Add')}</button>
            </div>
            {showAddMembre&&nonMembres.length>0&&(
              <div style={{padding:'10px 16px',background:'#F8F9FF',borderBottom:'1px solid #F0F0F0',display:'flex',flexWrap:'wrap',gap:6}}>
                {nonMembres.map(a=>(
                  <button key={a.id} onClick={()=>addMembre(a.id)} style={{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',borderRadius:20,border:'1.5px solid #E5E5E5',background:'white',cursor:'pointer',fontSize:12,fontWeight:600}}>
                    <Avatar ani={a} size={20}/>{a.nom}
                  </button>
                ))}
              </div>
            )}
            <div style={{padding:'8px 16px'}}>
              {membres.map(m=>(
                <div key={m.animateur_id} style={{border:'1.5px solid #E5E5E5',borderRadius:12,overflow:'hidden',marginBottom:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px'}}>
                    <Avatar ani={m.ani} size={36}/>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:13}}>{m.ani?.nom}</div>
                      {m.role&&<div style={{fontSize:12,color:'#534AB7',fontWeight:600}}>{m.role}</div>}
                      {m.notes_role&&<div style={{fontSize:11,color:'#888',marginTop:2}}>{m.notes_role}</div>}
                    </div>
                    <div style={{display:'flex',gap:5}}>
                      <button onClick={()=>{setEditMembre(editMembre===m.animateur_id?null:m.animateur_id);setMembreForm({role:m.role||'',notes_role:m.notes_role||''})}} style={{padding:'4px 10px',borderRadius:8,border:'1.5px solid #E5E5E5',background:'white',fontSize:11,cursor:'pointer',fontWeight:600}}>{editMembre===m.animateur_id?t2('Fermer','Close'):t2('Role','Role')}</button>
                      {(isAdmin||event.created_by===me?.id)&&<button onClick={()=>removeMembre(m.animateur_id)} style={{padding:'4px 10px',borderRadius:8,border:'none',background:'#FFDFE0',color:'#CC0000',fontSize:11,cursor:'pointer',fontWeight:600}}>{t2('Retirer','Remove')}</button>}
                    </div>
                  </div>
                  {editMembre===m.animateur_id&&(
                    <div style={{padding:'12px 14px',background:'#F8F9FF',borderTop:'1px solid #F0F0F0',display:'flex',flexDirection:'column',gap:8}}>
                      <input value={membreForm.role} onChange={e=>setMembreForm(f=>({...f,role:e.target.value}))} placeholder={t2("Role dans l'evenement (ex : Coordinateur, Accueil...)","Role in the event (e.g. Coordinator, Welcome...)")} className="fi" style={{fontSize:12}}/>
                      <textarea value={membreForm.notes_role} onChange={e=>setMembreForm(f=>({...f,notes_role:e.target.value}))} placeholder={t2("Notes d'organisation pour ce role...","Organisation notes for this role...")} rows={2} className="fi" style={{resize:'none'}}/>
                      <button onClick={()=>saveMembre(m.animateur_id)} style={{alignSelf:'flex-end',padding:'6px 16px',borderRadius:8,background:'#1a1a2e',color:'white',border:'none',fontWeight:700,fontSize:12,cursor:'pointer'}}>{t2('Sauvegarder','Save')}</button>
                    </div>
                  )}
                </div>
              ))}
              {membres.length===0&&<div style={{textAlign:'center',padding:'16px',color:'#888',fontSize:13}}>Aucun membre — ajoutez des animateurs.</div>}
            </div>
          </div>
          {/* Planning */}
          <div style={{background:'white',borderRadius:16,border:'1.5px solid #E5E5E5',overflow:'hidden'}}>
            <div style={{padding:'14px 18px',borderBottom:'1px solid #F0F0F0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontWeight:800,fontSize:15}}>{t2('Planning partage','Shared planning')}</span>
              <button onClick={()=>setShowActionModal(true)} style={{padding:'6px 14px',borderRadius:10,background:'#1a1a2e',color:'white',border:'none',fontWeight:600,fontSize:12,cursor:'pointer'}}>+ {t2('Action','Action')}</button>
            </div>
            <div style={{padding:'12px 16px'}}>
              {actions.length===0&&<div style={{textAlign:'center',padding:'16px',color:'#888',fontSize:13}}>{t2('Aucune action planifiee.','No planned actions.')}</div>}
              {actions.map(a=>{
                const isLate=a.deadline&&a.statut!=='fait'&&new Date(a.deadline)<new Date()
                const sColor={a_faire:'#555',en_cours:'#633806',fait:'#2B7400'}[a.statut]||'#555'
                const sBg={a_faire:'#F0F0F4',en_cours:'#FAEEDA',fait:'#D7FFB8'}[a.statut]||'#F0F0F4'
                return (
                  <div key={a.id} className="action-row" style={{borderColor:isLate?'#FF4B4B':'#E5E5E5',background:isLate?'#FFF5F5':'white'}}>
                    <button onClick={()=>toggleAction(a.id,a.statut)} style={{width:22,height:22,borderRadius:'50%',border:`2px solid ${sColor}`,background:a.statut==='fait'?sColor:'white',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:11}}>
                      {a.statut==='fait'?'v':''}
                    </button>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:a.statut==='fait'?'#888':'#1a1a2e',textDecoration:a.statut==='fait'?'line-through':'none'}}>{a.titre}</div>
                      {a.description&&<div style={{fontSize:11,color:'#888'}}>{a.description}</div>}
                    </div>
                    {a.ani&&<Avatar ani={a.ani} size={22}/>}
                    {a.deadline&&<div style={{fontSize:11,fontWeight:700,color:isLate?'#CC0000':'#888',flexShrink:0}}>{isLate?'! ':''}{new Date(a.deadline).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>}
                    <span style={{padding:'2px 8px',borderRadius:20,background:sBg,color:sColor,fontSize:10,fontWeight:700,flexShrink:0}}>{(lang==='en'?{'a_faire':'To do','en_cours':'In progress','fait':'Done'}:{'a_faire':'A faire','en_cours':'En cours','fait':'Fait'})[a.statut]}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>}

        {/* ══ PROSPECTION ══ */}
        {tab==='prospection'&&<div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
            <button onClick={()=>setSgFilter('global')} style={{padding:'6px 14px',borderRadius:20,border:`1.5px solid ${sgFilter==='global'?'#1a1a2e':'#E5E5E5'}`,background:sgFilter==='global'?'#1a1a2e':'white',color:sgFilter==='global'?'white':'#555',fontSize:12,cursor:'pointer',fontWeight:600}}>Global</button>
            {sousGroupes.map(sg=>(
              <button key={sg.id} onClick={()=>setSgFilter(sg.id)} style={{padding:'6px 14px',borderRadius:20,border:`1.5px solid ${sgFilter===sg.id?'#534AB7':'#E5E5E5'}`,background:sgFilter===sg.id?'#534AB7':'white',color:sgFilter===sg.id?'white':'#555',fontSize:12,cursor:'pointer',fontWeight:600}}>{sg.name}</button>
            ))}
            <button onClick={()=>{setShowProspectModal(true);setProspectForm(f=>({...f,sous_groupe_id:sgFilter==='global'?'':sgFilter}))}} style={{marginLeft:'auto',padding:'7px 16px',borderRadius:10,background:'#1a1a2e',color:'white',border:'none',fontWeight:700,fontSize:12,cursor:'pointer'}}>+ {t2('Organisation','Organisation')}</button>
          </div>
          {STATUT_ORDER.map(statut=>{
            const s=STATUTS[statut]
            const groupe=filteredProspects.filter(p=>p.statut===statut)
            if(groupe.length===0) return null
            return (
              <div key={statut} style={{marginBottom:20}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <div style={{padding:'3px 12px',borderRadius:20,background:s.bg,color:s.color,fontWeight:800,fontSize:12,border:`1.5px solid ${s.border}`}}>{(lang==='en'?s.labelEn:s.labelFr)}</div>
                  <div style={{fontSize:12,color:'#888'}}>{groupe.length}</div>
                </div>
                {groupe.map(p=>(
                  <div key={p.id} className="prospect-card">
                    <div style={{padding:'12px 16px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,marginBottom:8}}>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:800,fontSize:14,marginBottom:4}}>{p.name}</div>
                          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                            {p.secteur&&<span style={{padding:'2px 8px',borderRadius:20,background:'#EEEDFE',color:'#3C3489',fontSize:11,fontWeight:600}}>{p.secteur}</span>}
                            {p.region&&<span style={{padding:'2px 8px',borderRadius:20,background:'#F0F0F4',color:'#555',fontSize:11}}>{p.region}</span>}
                          </div>
                        </div>
                        <div style={{display:'flex',gap:4,flexWrap:'wrap',justifyContent:'flex-end',maxWidth:200}}>
                          {STATUT_ORDER.filter(ns=>ns!==p.statut).map(ns=>(
                            <button key={ns} onClick={()=>updateStatut(p.id,ns)} style={{padding:'3px 8px',borderRadius:20,border:`1px solid ${STATUTS[ns].border}`,background:STATUTS[ns].bg,color:STATUTS[ns].color,fontSize:10,cursor:'pointer',fontWeight:700}}>
                              {(lang==='en'?STATUTS[ns].labelEn:STATUTS[ns].labelFr)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button onClick={()=>setExpandedProspect(expandedProspect===p.id?null:p.id)} style={{background:'none',border:'none',cursor:'pointer',fontSize:12,color:'#534AB7',fontWeight:600,padding:0}}>
                        {expandedProspect===p.id?t2('Reduire','Collapse'):t2('Voir','View')} ({(p.contacts||[]).length} {t2('contacts','contacts')}, {(p.commentaires||[]).length} {t2('commentaires','comments')})
                      </button>
                    </div>
                    {expandedProspect===p.id&&(
                      <div style={{borderTop:'1px solid #F0F0F0',padding:'12px 16px',background:'#FAFAFA'}}>
                        <div style={{marginBottom:12}}>
                          <div style={{fontWeight:700,fontSize:12,color:'#555',marginBottom:6}}>Contacts</div>
                          {(p.contacts||[]).map(c=>(
                            <div key={c.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 10px',background:'white',borderRadius:8,marginBottom:4,border:'1px solid #E5E5E5'}}>
                              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700}}>{c.name}</div>{c.role_poste&&<div style={{fontSize:11,color:'#888'}}>{c.role_poste}</div>}</div>
                              {c.email&&<a href={`mailto:${c.email}`} style={{fontSize:12,textDecoration:'none'}}>mail</a>}
                              {c.phone&&<a href={`tel:${c.phone}`} style={{fontSize:12,textDecoration:'none'}}>tel</a>}
                            </div>
                          ))}
                          <button onClick={()=>setShowContactModal(p.id)} style={{width:'100%',padding:'5px',borderRadius:8,border:'1.5px dashed #CCC',background:'transparent',fontSize:12,color:'#888',cursor:'pointer'}}>+ Contact</button>
                        </div>
                        <div>
                          <div style={{fontWeight:700,fontSize:12,color:'#555',marginBottom:6}}>Commentaires</div>
                          {(p.commentaires||[]).map(c=>(
                            <div key={c.id} style={{display:'flex',gap:8,marginBottom:6}}>
                              <Avatar ani={c.ani} size={24}/>
                              <div style={{flex:1,background:'white',borderRadius:8,padding:'7px 10px',border:'1px solid #E5E5E5'}}>
                                <div style={{fontSize:10,color:'#888',marginBottom:2}}>{c.ani?.nom} - {new Date(c.created_at).toLocaleDateString('fr-FR')}</div>
                                <div style={{fontSize:12}}>{c.contenu}</div>
                              </div>
                            </div>
                          ))}
                          <div style={{display:'flex',gap:8}}>
                            <Avatar ani={me} size={26}/>
                            <input value={newComment[p.id]||''} onChange={e=>setNewComment(prev=>({...prev,[p.id]:e.target.value}))} placeholder={t2('Ajouter un commentaire...','Add a comment...')} style={{flex:1,padding:'7px 10px',borderRadius:8,border:'1.5px solid #E5E5E5',fontSize:12,outline:'none'}} onKeyDown={e=>{if(e.key==='Enter')postComment(p.id)}}/>
                            <button onClick={()=>postComment(p.id)} style={{padding:'7px 12px',borderRadius:8,background:'#1a1a2e',color:'white',border:'none',fontSize:12,cursor:'pointer'}}>ok</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
          {filteredProspects.length===0&&<div style={{textAlign:'center',padding:'40px',color:'#888',background:'white',borderRadius:16,border:'1.5px solid #E5E5E5'}}><div style={{fontSize:32,marginBottom:8}}>?</div><div style={{fontWeight:700}}>{t2('Aucune organisation','No organisation')}</div></div>}
        </div>}

        {/* ══ SOUS-GROUPES ══ */}
        {tab==='sousgroupes'&&<div>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
            <button onClick={()=>setShowSGModal(true)} style={{padding:'8px 16px',borderRadius:10,background:'#1a1a2e',color:'white',border:'none',fontWeight:700,fontSize:13,cursor:'pointer'}}>+ {t2('Sous-groupe','Sub-group')}</button>
          </div>
          {sousGroupes.length===0&&<div style={{textAlign:'center',padding:'40px',color:'#888',background:'white',borderRadius:16,border:'1.5px solid #E5E5E5'}}><div style={{fontWeight:700}}>{t2('Aucun sous-groupe','No sub-groups')}</div><div style={{fontSize:13,marginTop:4}}>{t2('Creez des sous-ensembles regionaux, thematiques ou par secteur.','Create regional, thematic or sector sub-groups.')}</div></div>}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(250px,1fr))',gap:12}}>
            {sousGroupes.map(sg=>{
              const sgp=prospects.filter(p=>p.sous_groupe_id===sg.id)
              return (
                <div key={sg.id} style={{background:'white',borderRadius:16,border:'1.5px solid #E5E5E5',overflow:'hidden'}}>
                  <div style={{padding:'14px 16px',borderBottom:'1px solid #F0F0F0'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                      <div style={{fontWeight:800,fontSize:14}}>{sg.name}</div>
                      <button onClick={async()=>{if(!confirm('Supprimer ?')) return;await supabase.from('crm_evenement_sous_groupes').delete().eq('id',sg.id);setSousGroupes(prev=>prev.filter(s=>s.id!==sg.id))}} style={{background:'none',border:'none',cursor:'pointer',color:'#CCC',fontSize:14}}>x</button>
                    </div>
                    {sg.type&&<span style={{padding:'2px 8px',borderRadius:20,background:'#EEEDFE',color:'#3C3489',fontSize:11,fontWeight:600}}>{sg.type}</span>}
                    {sg.description&&<div style={{fontSize:12,color:'#888',marginTop:6}}>{sg.description}</div>}
                  </div>
                  <div style={{padding:'10px 16px'}}>
                    <div style={{fontSize:12,color:'#888',marginBottom:6}}>{sgp.length} organisation{sgp.length!==1?'s':''}</div>
                    <button onClick={()=>{setTab('prospection');setSgFilter(sg.id)}} style={{width:'100%',padding:'7px',borderRadius:8,border:'1.5px solid #E5E5E5',background:'white',fontSize:12,cursor:'pointer',fontWeight:600,color:'#534AB7'}}>{t2('Voir la prospection','View prospecting')}</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>}

        {/* ══ JOUR J ══ */}
        {tab==='jourj'&&<div>
          <div style={{background:'#E6F1FB',borderRadius:12,padding:'12px 14px',marginBottom:14,border:'1.5px solid #85B7EB'}}>
            <div style={{fontWeight:700,fontSize:13,color:'#0C447C',marginBottom:3}}>{t2('Mode Jour J','Day J Mode')}</div>
            <div style={{fontSize:12,color:'#0C447C'}}>{t2('Enregistrez les personnes rencontrees. Elles pourront etre transferees dans le CRM global.','Record the people you meet. They can be transferred to the global CRM.')}</div>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
            <button onClick={()=>setShowJJModal(true)} style={{padding:'8px 16px',borderRadius:10,background:'#1a1a2e',color:'white',border:'none',fontWeight:700,fontSize:13,cursor:'pointer'}}>+ t2('Contact','Contact')</button>
          </div>
          {jourJList.length===0&&<div style={{textAlign:'center',padding:'40px',color:'#888',background:'white',borderRadius:16,border:'1.5px solid #E5E5E5'}}><div style={{fontWeight:700}}>{t2('Aucun contact enregistre','No contacts recorded')}</div></div>}
          {jourJList.map(jj=>(
            <div key={jj.id} style={{background:'white',borderRadius:12,border:`1.5px solid ${jj.transferred?'#58CC02':'#E5E5E5'}`,padding:'12px 16px',display:'flex',gap:12,alignItems:'flex-start',marginBottom:8,animation:'fadeIn .3s ease'}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14}}>{jj.name}</div>
                {jj.organisation&&<div style={{fontSize:12,color:'#534AB7',fontWeight:600}}>{jj.organisation}</div>}
                <div style={{display:'flex',gap:10,marginTop:4,flexWrap:'wrap'}}>
                  {jj.email&&<a href={`mailto:${jj.email}`} style={{fontSize:12,color:'#0C447C',textDecoration:'none'}}>{jj.email}</a>}
                  {jj.phone&&<a href={`tel:${jj.phone}`} style={{fontSize:12,color:'#0C447C',textDecoration:'none'}}>{jj.phone}</a>}
                </div>
                {jj.notes&&<div style={{fontSize:12,color:'#888',marginTop:4}}>{jj.notes}</div>}
              </div>
              {jj.transferred
                ?<span style={{padding:'4px 10px',borderRadius:20,background:'#D7FFB8',color:'#2B7400',fontSize:11,fontWeight:700,flexShrink:0}}>{t2('Dans le CRM','In CRM')}</span>
                :<button onClick={()=>transferToGlobal(jj)} style={{padding:'5px 12px',borderRadius:8,background:'#1a1a2e',color:'white',border:'none',fontSize:11,cursor:'pointer',fontWeight:600,flexShrink:0}}>{t2('CRM global','Global CRM')}</button>}
            </div>
          ))}
        </div>}
        {/* ══ DOCUMENTS ══ */}
        {tab==='documents'&&<div style={{display:'flex',flexDirection:'column',gap:16}}>
          <DocSection title={t2('Kit de com','Comms kit')} emoji="📢"
            desc={t2("Cadrage, argumentaires, modeles d'invitation, prospection...",'Framing, arguments, invitation templates, prospecting...')}
            categorie="kit_com" docs={documents.filter(d=>d.categorie==='kit_com')}
            me={me} isAdmin={isAdmin} uploading={uploadingDoc&&docCategorie==='kit_com'}
            onUpload={files=>{setDocCategorie('kit_com');Array.from(files).forEach(f=>uploadDoc(f,'kit_com'))}}
            onAddLink={addExternalLink}
            onDelete={deleteDoc}/>
          <DocSection title={t2('Documentation','Documentation')} emoji="📁"
            desc={t2('Visuels, images, supports de presentation, ressources graphiques...','Visuals, images, presentation materials, graphic resources...')}
            categorie="documentation" docs={documents.filter(d=>d.categorie==='documentation')}
            me={me} isAdmin={isAdmin} uploading={uploadingDoc&&docCategorie==='documentation'}
            onUpload={files=>{setDocCategorie('documentation');Array.from(files).forEach(f=>uploadDoc(f,'documentation'))}}
            onAddLink={addExternalLink}
            onDelete={deleteDoc}/>
        </div>}
      </div>

      {/* MODALS */}
      {showActionModal&&<div className="modal-bg"><div className="modal-box">
        <div className="modal-head"><div style={{fontWeight:900,fontSize:15}}>Nouvelle action</div><button onClick={()=>setShowActionModal(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#888'}}>x</button></div>
        <div className="modal-body">
          <input value={actionForm.titre} onChange={e=>setActionForm(f=>({...f,titre:e.target.value}))} placeholder={t2('Action *','Action *')} className="fi"/>
          <textarea value={actionForm.description} onChange={e=>setActionForm(f=>({...f,description:e.target.value}))} placeholder={t2('Description','Description')} rows={2} className="fi" style={{resize:'none'}}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div><label style={{fontSize:11,fontWeight:600,display:'block',marginBottom:3}}>Deadline</label><input type="date" value={actionForm.deadline} onChange={e=>setActionForm(f=>({...f,deadline:e.target.value}))} className="fi-sm"/></div>
            <div><label style={{fontSize:11,fontWeight:600,display:'block',marginBottom:3}}>Assigne a</label><select value={actionForm.animateur_id} onChange={e=>setActionForm(f=>({...f,animateur_id:e.target.value}))} className="fi-sm"><option value="">Non assigne</option>{membres.map(m=><option key={m.animateur_id} value={m.animateur_id}>{m.ani?.nom}</option>)}</select></div>
          </div>
          <button onClick={addAction} disabled={!actionForm.titre.trim()} className="btn-main" style={{background:actionForm.titre.trim()?'#1a1a2e':'#E5E5E5',color:actionForm.titre.trim()?'white':'#888'}}>{t2('Ajouter','Add')}</button>
        </div>
      </div></div>}

      {showProspectModal&&<div className="modal-bg"><div className="modal-box">
        <div className="modal-head"><div style={{fontWeight:900,fontSize:15}}>Nouvelle organisation</div><button onClick={()=>setShowProspectModal(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#888'}}>x</button></div>
        <div className="modal-body">
          <input value={prospectForm.name} onChange={e=>setProspectForm(f=>({...f,name:e.target.value}))} placeholder={t2('Nom *','Name *')} className="fi"/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <input value={prospectForm.secteur} onChange={e=>setProspectForm(f=>({...f,secteur:e.target.value}))} placeholder={t2('Secteur','Sector')} className="fi-sm"/>
            <input value={prospectForm.region} onChange={e=>setProspectForm(f=>({...f,region:e.target.value}))} placeholder={t2('Region','Region')} className="fi-sm"/>
          </div>
          <div><label style={{fontSize:11,fontWeight:600,display:'block',marginBottom:4}}>Statut</label><div style={{display:'flex',gap:5,flexWrap:'wrap'}}>{STATUT_ORDER.map(s=><button key={s} onClick={()=>setProspectForm(f=>({...f,statut:s}))} style={{padding:'4px 10px',borderRadius:20,border:`1.5px solid ${prospectForm.statut===s?STATUTS[s].border:'#E5E5E5'}`,background:prospectForm.statut===s?STATUTS[s].bg:'white',color:prospectForm.statut===s?STATUTS[s].color:'#888',fontSize:11,cursor:'pointer',fontWeight:600}}>{STATUTS[s].label}</button>)}</div></div>
          {sousGroupes.length>0&&<select value={prospectForm.sous_groupe_id} onChange={e=>setProspectForm(f=>({...f,sous_groupe_id:e.target.value}))} className="fi-sm"><option value="">Global</option>{sousGroupes.map(sg=><option key={sg.id} value={sg.id}>{sg.name}</option>)}</select>}
          <button onClick={addProspect} disabled={!prospectForm.name.trim()} className="btn-main" style={{background:prospectForm.name.trim()?'#1a1a2e':'#E5E5E5',color:prospectForm.name.trim()?'white':'#888'}}>{t2('Ajouter','Add')}</button>
        </div>
      </div></div>}

      {showContactModal&&<div className="modal-bg" style={{zIndex:110}}><div className="modal-box" style={{maxWidth:360}}>
        <div className="modal-head"><div style={{fontWeight:900,fontSize:14}}>Ajouter un contact</div><button onClick={()=>setShowContactModal(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#888'}}>x</button></div>
        <div className="modal-body">
          <input value={contactForm.name} onChange={e=>setContactForm(f=>({...f,name:e.target.value}))} placeholder={t2('Nom *','Name *')} className="fi"/>
          <input value={contactForm.role_poste} onChange={e=>setContactForm(f=>({...f,role_poste:e.target.value}))} placeholder={t2('Poste','Position')} className="fi-sm"/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}><input type="email" value={contactForm.email} onChange={e=>setContactForm(f=>({...f,email:e.target.value}))} placeholder={t2('Email','Email')} className="fi-sm"/><input type="tel" value={contactForm.phone} onChange={e=>setContactForm(f=>({...f,phone:e.target.value}))} placeholder={t2('Tel','Phone')} className="fi-sm"/></div>
          <button onClick={()=>addContact(showContactModal)} disabled={!contactForm.name.trim()} className="btn-main" style={{background:contactForm.name.trim()?'#1a1a2e':'#E5E5E5',color:contactForm.name.trim()?'white':'#888'}}>{t2('Ajouter','Add')}</button>
        </div>
      </div></div>}

      {showSGModal&&<div className="modal-bg"><div className="modal-box">
        <div className="modal-head"><div style={{fontWeight:900,fontSize:15}}>Nouveau sous-groupe</div><button onClick={()=>setShowSGModal(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#888'}}>x</button></div>
        <div className="modal-body">
          <input value={sgForm.name} onChange={e=>setSgForm(f=>({...f,name:e.target.value}))} placeholder={t2('Nom *','Name *')} className="fi"/>
          <div><label style={{fontSize:11,fontWeight:600,display:'block',marginBottom:4}}>Type</label><div style={{display:'flex',gap:5,flexWrap:'wrap'}}>{SG_TYPES.map(t=><button key={t} onClick={()=>setSgForm(f=>({...f,type:t}))} style={{padding:'4px 10px',borderRadius:20,border:`1.5px solid ${sgForm.type===t?'#534AB7':'#E5E5E5'}`,background:sgForm.type===t?'#EEEDFE':'white',color:sgForm.type===t?'#3C3489':'#555',fontSize:11,cursor:'pointer',fontWeight:600}}>{t}</button>)}</div></div>
          <textarea value={sgForm.description} onChange={e=>setSgForm(f=>({...f,description:e.target.value}))} placeholder={t2('Description','Description')} rows={2} className="fi" style={{resize:'none'}}/>
          <button onClick={addSG} disabled={!sgForm.name.trim()} className="btn-main" style={{background:sgForm.name.trim()?'#1a1a2e':'#E5E5E5',color:sgForm.name.trim()?'white':'#888'}}>{t2('Creer','Create')}</button>
        </div>
      </div></div>}

      {showJJModal&&<div className="modal-bg"><div className="modal-box">
        <div className="modal-head"><div style={{fontWeight:900,fontSize:15}}>Nouveau contact</div><button onClick={()=>setShowJJModal(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#888'}}>x</button></div>
        <div className="modal-body">
          <input value={jjForm.name} onChange={e=>setJjForm(f=>({...f,name:e.target.value}))} placeholder={t2('Prenom Nom *','First Last *')} className="fi"/>
          <input value={jjForm.organisation} onChange={e=>setJjForm(f=>({...f,organisation:e.target.value}))} placeholder={t2('Organisation','Organisation')} className="fi-sm"/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}><input type="email" value={jjForm.email} onChange={e=>setJjForm(f=>({...f,email:e.target.value}))} placeholder={t2('Email','Email')} className="fi-sm"/><input type="tel" value={jjForm.phone} onChange={e=>setJjForm(f=>({...f,phone:e.target.value}))} placeholder={t2('Tel','Phone')} className="fi-sm"/></div>
          <textarea value={jjForm.notes} onChange={e=>setJjForm(f=>({...f,notes:e.target.value}))} placeholder={t2('Notes...','Notes...')} rows={2} className="fi" style={{resize:'none'}}/>
          {sousGroupes.length>0&&<select value={jjForm.sous_groupe_id} onChange={e=>setJjForm(f=>({...f,sous_groupe_id:e.target.value}))} className="fi-sm"><option value="">Pas de sous-groupe</option>{sousGroupes.map(sg=><option key={sg.id} value={sg.id}>{sg.name}</option>)}</select>}
          <button onClick={addJourJ} disabled={!jjForm.name.trim()} className="btn-main" style={{background:jjForm.name.trim()?'#1a1a2e':'#E5E5E5',color:jjForm.name.trim()?'white':'#888'}}>{t2('Enregistrer','Save')}</button>
        </div>
      </div></div>}
    </div>
  )
}
