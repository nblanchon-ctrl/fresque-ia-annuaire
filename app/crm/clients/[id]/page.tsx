'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const SECTEURS = [
  'Agriculture & Agroalimentaire','Collectivités & Service public','Défense & Sécurité',
  'Education & Formation','Energie','Finance & Assurance','Immobilier & Construction',
  'Industrie & Manufacturing','Juridique & Conseil','Luxe & Mode','Médias & Communication',
  'Numérique & Tech','Pharmaceutique','Recherche & Enseignement supérieur','Retail & Commerce',
  'Santé','Syndicats & Associations','Tourisme & Hôtellerie','Transport & Mobilité','Autre',
]
const REGIONS = [
  'Auvergne-Rhône-Alpes','Bourgogne-Franche-Comté','Bretagne','Centre-Val de Loire',
  'Grand Est','Hauts-de-France','Île-de-France','Normandie','Nouvelle-Aquitaine',
  'Occitanie','Pays de la Loire',"Provence-Alpes-Côte d'Azur",'Europe','International',
]
const SIZES = [
  {key:'micro',label:'< 50 salariés',short:'< 50'},
  {key:'pme',label:'50 – 500 salariés',short:'PME'},
  {key:'eti',label:'500 – 2000 salariés',short:'ETI'},
  {key:'grand_groupe',label:'> 2000 salariés',short:'Grand groupe'},
]
const STATUS_COLORS: Record<string,{bg:string;color:string;border:string;label:string}> = {
  client:         {bg:'#D7FFB8',color:'#2B7400',border:'#58CC02',label:'Client ✓'},
  prospect_chaud: {bg:'#FFDFE0',color:'#CC0000',border:'#FF4B4B',label:'Prospect chaud 🔥'},
}

type Animateur = {id:string;prenom:string;nom:string;photo_url:string|null;email:string}
type Commentaire = {id:string;contenu:string;created_at:string;animateur_id:string|null;animateur?:Animateur|null}
type CRMClient = {
  id:string;name:string;logo_url:string|null;size:string|null;secteur:string|null
  region:string|null;tags:string[];status:string;created_at:string;created_by:string|null
  notes:string|null;animateur?:Animateur|null
}

export default function CRMClientDetailPage() {
  const {id} = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [client, setClient] = useState<CRMClient|null>(null)
  const [commentaires, setCommentaires] = useState<Commentaire[]>([])
  const [me, setMe] = useState<Animateur|null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({name:'',size:'',secteur:'',secteurAutre:'',region:'',tags:'',notes:'',status:''})
  const [saving, setSaving] = useState(false)

  useEffect(()=>{
    Promise.all([
      supabase.auth.getUser(),
      supabase.from('animateurs').select('*'),
      supabase.from('crm_clients').select('*').eq('id',id as string).single(),
      supabase.from('crm_client_commentaires').select('*').eq('client_id',id as string).order('created_at'),
    ]).then(async([{data:{user}},{data:anis},{data:clientData},{data:comms}])=>{
      const all=(anis||[]) as Animateur[]
      if(user){
        const myAni=all.find(a=>a.id===user.id)||null
        setMe(myAni)
        const {data:ad}=await supabase.from('animateurs').select('is_admin').eq('id',user.id).single()
        setIsAdmin(ad?.is_admin||false)
      }
      if(clientData){
        const enriched={...clientData,animateur:all.find(a=>a.id===clientData.created_by)||null}
        setClient(enriched)
        setEditForm({
          name:clientData.name,size:clientData.size||'',secteur:clientData.secteur||'',
          secteurAutre:'',region:clientData.region||'',
          tags:(clientData.tags||[]).join(', '),notes:clientData.notes||'',status:clientData.status,
        })
      }
      setCommentaires((comms||[]).map(c=>({...c,animateur:all.find(a=>a.id===c.animateur_id)||null})))
      setLoading(false)
    })
  },[id])

  async function postComment(){
    if(!newComment.trim()||!me||!client) return
    setPostingComment(true)
    const {data,error}=await supabase.from('crm_client_commentaires').insert({
      client_id:client.id,animateur_id:me.id,contenu:newComment.trim(),
    }).select().single()
    setPostingComment(false)
    if(!error&&data){
      setCommentaires(prev=>[...prev,{...data,animateur:me}])
      setNewComment('')
    }
  }

  async function deleteComment(commentId:string){
    await supabase.from('crm_client_commentaires').delete().eq('id',commentId)
    setCommentaires(prev=>prev.filter(c=>c.id!==commentId))
  }

  async function saveEdit(){
    if(!client) return
    setSaving(true)
    const finalSecteur=editForm.secteur==='Autre'&&editForm.secteurAutre.trim()
      ?`Autre — ${editForm.secteurAutre.trim()}`:editForm.secteur||null
    const tags=editForm.tags.split(',').map(t=>t.trim()).filter(Boolean)
    const {error}=await supabase.from('crm_clients').update({
      name:editForm.name.trim(),size:editForm.size||null,secteur:finalSecteur,
      region:editForm.region||null,tags,notes:editForm.notes.trim()||null,status:editForm.status,
    }).eq('id',client.id)
    setSaving(false)
    if(!error){
      setClient(prev=>prev?{...prev,name:editForm.name,size:editForm.size||null,secteur:finalSecteur,region:editForm.region||null,tags,notes:editForm.notes||null,status:editForm.status}:prev)
      setEditMode(false)
    }
  }

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',color:'#888'}}>Chargement…</div>
  if(!client) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}>Client introuvable</div>

  const canEdit=isAdmin||client.created_by===me?.id
  const s=STATUS_COLORS[client.status]||STATUS_COLORS.prospect_chaud
  const sz=SIZES.find(x=>x.key===client.size)

  return (
    <div style={{minHeight:'100vh',background:'#F7F7F7'}}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} @keyframes popIn{0%{transform:scale(0.9);opacity:0}100%{transform:scale(1);opacity:1}}`}</style>

      {/* HEADER */}
      <div style={{background:'white',borderBottom:'1px solid #E5E5E5',padding:'0 16px',position:'sticky',top:0,zIndex:30}}>
        <div style={{maxWidth:720,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',height:56}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <Link href="/crm" style={{color:'#888',textDecoration:'none',fontSize:20}}>←</Link>
            <div style={{fontWeight:800,fontSize:16,color:'#1a1a2e',maxWidth:260,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{client.name}</div>
          </div>
          {canEdit&&!editMode&&(
            <button onClick={()=>setEditMode(true)} style={{padding:'7px 16px',borderRadius:10,border:'1.5px solid #E5E5E5',background:'white',fontWeight:600,fontSize:13,cursor:'pointer'}}>
              Modifier
            </button>
          )}
        </div>
      </div>

      <div style={{maxWidth:720,margin:'0 auto',padding:'20px 16px 80px'}}>
        {/* FICHE CLIENT */}
        {!editMode ? (
          <div style={{background:'white',borderRadius:16,border:'1.5px solid #E5E5E5',overflow:'hidden',marginBottom:16,animation:'fadeIn .3s ease'}}>
            <div style={{height:4,background:client.status==='client'?'#58CC02':'#FF4B4B'}}/>
            <div style={{padding:'20px'}}>
              {/* Logo + nom + statut */}
              <div style={{display:'flex',gap:16,alignItems:'flex-start',marginBottom:18}}>
                <div style={{width:72,height:72,borderRadius:16,border:'1.5px solid #E5E5E5',display:'flex',alignItems:'center',justifyContent:'center',background:'white',flexShrink:0,overflow:'hidden'}}>
                  {client.logo_url&&client.logo_url.startsWith('http')
                    ?<img src={client.logo_url} alt={client.name} style={{width:'100%',height:'100%',objectFit:'contain',padding:4}} onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>
                    :<span style={{fontSize:32}}>🏢</span>}
                </div>
                <div style={{flex:1}}>
                  <h1 style={{fontSize:22,fontWeight:900,margin:'0 0 8px',color:'#1a1a2e'}}>{client.name}</h1>
                  <div style={{display:'inline-block',padding:'4px 12px',borderRadius:20,background:s.bg,color:s.color,border:`1.5px solid ${s.border}`,fontSize:13,fontWeight:700}}>{s.label}</div>
                </div>
              </div>

              {/* Info badges */}
              <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16}}>
                {sz&&<div style={{padding:'6px 14px',borderRadius:20,background:'#E6F1FB',color:'#0C447C',fontSize:13,fontWeight:600}}>{sz.label}</div>}
                {client.secteur&&<div style={{padding:'6px 14px',borderRadius:20,background:'#EEEDFE',color:'#3C3489',fontSize:13,fontWeight:600}}>{client.secteur}</div>}
                {client.region&&<div style={{padding:'6px 14px',borderRadius:20,background:'#F0F0F4',color:'#555',fontSize:13}}>{client.region}</div>}
              </div>

              {/* Tags */}
              {(client.tags||[]).length>0&&(
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:16}}>
                  {(client.tags||[]).map(t=><span key={t} style={{padding:'4px 12px',borderRadius:20,background:'#FFF9E6',color:'#8B5E00',fontSize:12,fontWeight:600}}>#{t}</span>)}
                </div>
              )}

              {/* Note initiale du créateur */}
              {client.notes&&(
                <div style={{background:'#F8F9FF',borderRadius:12,padding:'14px 16px',marginBottom:16,border:'1.5px solid #E5E5E5'}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#888',marginBottom:6,textTransform:'uppercase',letterSpacing:0.5}}>Note du créateur</div>
                  <div style={{fontSize:14,color:'#1a1a2e',lineHeight:1.65}}>{client.notes}</div>
                </div>
              )}

              {/* Créateur */}
              {client.animateur&&(
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'#F8F8F8',borderRadius:12}}>
                  <div style={{width:40,height:40,borderRadius:'50%',overflow:'hidden',flexShrink:0,background:'#E5E5E5'}}>
                    {client.animateur.photo_url?<img src={client.animateur.photo_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%',fontSize:16}}>👤</span>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:'#1a1a2e'}}>{client.animateur.prenom} {client.animateur.nom}</div>
                    <div style={{fontSize:12,color:'#888'}}>Ajouté le {new Date(client.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
                  </div>
                  <a href={`mailto:${client.animateur.email}`} style={{padding:'7px 14px',borderRadius:10,background:'white',border:'1.5px solid #E5E5E5',color:'#1a1a2e',textDecoration:'none',fontSize:13,fontWeight:600}}>✉️ Contacter</a>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* EDIT MODE */
          <div style={{background:'white',borderRadius:16,border:'1.5px solid #1a1a2e',overflow:'hidden',marginBottom:16,animation:'popIn .2s ease'}}>
            <div style={{padding:'16px 20px',borderBottom:'1px solid #F0F0F0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{fontWeight:800,fontSize:15}}>Modifier la fiche</div>
              <button onClick={()=>setEditMode(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#888'}}>✕</button>
            </div>
            <div style={{padding:20,display:'flex',flexDirection:'column',gap:13}}>
              <div>
                <label style={{fontSize:13,fontWeight:600,display:'block',marginBottom:5}}>Nom *</label>
                <input value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})}
                  style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #E5E5E5',fontSize:14,boxSizing:'border-box',outline:'none'}}/>
              </div>
              <div>
                <label style={{fontSize:13,fontWeight:600,display:'block',marginBottom:5}}>Statut</label>
                <div style={{display:'flex',gap:8}}>
                  {[{v:'client',label:'Client ✓'},{v:'prospect_chaud',label:'Prospect 🔥'}].map(opt=>(
                    <button key={opt.v} onClick={()=>setEditForm({...editForm,status:opt.v})}
                      style={{flex:1,padding:'10px',borderRadius:10,border:`2px solid ${editForm.status===opt.v?(opt.v==='client'?'#58CC02':'#FF4B4B'):'#E5E5E5'}`,background:editForm.status===opt.v?(opt.v==='client'?'#D7FFB8':'#FFDFE0'):'white',color:editForm.status===opt.v?(opt.v==='client'?'#2B7400':'#CC0000'):'#888',fontWeight:700,fontSize:13,cursor:'pointer'}}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div>
                  <label style={{fontSize:13,fontWeight:600,display:'block',marginBottom:5}}>Taille</label>
                  <select value={editForm.size} onChange={e=>setEditForm({...editForm,size:e.target.value})}
                    style={{width:'100%',padding:'10px',borderRadius:10,border:'1.5px solid #E5E5E5',fontSize:13,boxSizing:'border-box'}}>
                    <option value="">Sélectionner</option>
                    {SIZES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:13,fontWeight:600,display:'block',marginBottom:5}}>Secteur</label>
                  <select value={editForm.secteur} onChange={e=>setEditForm({...editForm,secteur:e.target.value,secteurAutre:''})}
                    style={{width:'100%',padding:'10px',borderRadius:10,border:'1.5px solid #E5E5E5',fontSize:13,boxSizing:'border-box'}}>
                    <option value="">Sélectionner</option>
                    {SECTEURS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {editForm.secteur==='Autre'&&(
                <div>
                  <label style={{fontSize:13,fontWeight:600,display:'block',marginBottom:5}}>Précisez</label>
                  <input value={editForm.secteurAutre} onChange={e=>setEditForm({...editForm,secteurAutre:e.target.value})} placeholder="Ex : Culture, Sports…"
                    style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #E5E5E5',fontSize:13,boxSizing:'border-box',outline:'none'}}/>
                </div>
              )}
              <div>
                <label style={{fontSize:13,fontWeight:600,display:'block',marginBottom:5}}>Région</label>
                <select value={editForm.region} onChange={e=>setEditForm({...editForm,region:e.target.value})}
                  style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #E5E5E5',fontSize:13,boxSizing:'border-box'}}>
                  <option value="">Sélectionner</option>
                  {REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:13,fontWeight:600,display:'block',marginBottom:4}}>Tags</label>
                <input value={editForm.tags} onChange={e=>setEditForm({...editForm,tags:e.target.value})} placeholder="tag1, tag2, tag3…"
                  style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #E5E5E5',fontSize:13,boxSizing:'border-box',outline:'none'}}/>
              </div>
              <div>
                <label style={{fontSize:13,fontWeight:600,display:'block',marginBottom:4}}>Note</label>
                <textarea value={editForm.notes} onChange={e=>setEditForm({...editForm,notes:e.target.value})} rows={3}
                  style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #E5E5E5',fontSize:13,boxSizing:'border-box',resize:'vertical',fontFamily:'inherit',outline:'none'}}/>
              </div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setEditMode(false)} style={{flex:1,padding:'12px',borderRadius:12,border:'1.5px solid #E5E5E5',background:'white',fontWeight:600,fontSize:14,cursor:'pointer'}}>Annuler</button>
                <button onClick={saveEdit} disabled={!editForm.name.trim()||saving}
                  style={{flex:2,padding:'12px',borderRadius:12,border:'none',background:'#1a1a2e',color:'white',fontWeight:800,fontSize:14,cursor:'pointer'}}>
                  {saving?'Enregistrement…':'Sauvegarder'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* COMMENTAIRES */}
        <div style={{background:'white',borderRadius:16,border:'1.5px solid #E5E5E5',overflow:'hidden'}}>
          <div style={{padding:'14px 18px',borderBottom:'1px solid #F0F0F0',display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:18}}>💬</span>
            <span style={{fontWeight:800,fontSize:15,color:'#1a1a2e'}}>Commentaires de la communauté</span>
            <span style={{fontSize:13,color:'#888',fontWeight:400}}>({commentaires.length})</span>
          </div>
          <div style={{padding:'16px 18px',display:'flex',flexDirection:'column',gap:12}}>
            {commentaires.length===0&&(
              <div style={{textAlign:'center',padding:'24px 0',color:'#888'}}>
                <div style={{fontSize:32,marginBottom:8}}>💬</div>
                <div style={{fontSize:13}}>Soyez le premier à commenter cette fiche.</div>
              </div>
            )}
            {commentaires.map(c=>(
              <div key={c.id} style={{display:'flex',gap:10,animation:'fadeIn .3s ease'}}>
                <div style={{width:34,height:34,borderRadius:'50%',overflow:'hidden',flexShrink:0,background:'#E5E5E5',marginTop:2}}>
                  {c.animateur?.photo_url?<img src={c.animateur.photo_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%',fontSize:13}}>👤</span>}
                </div>
                <div style={{flex:1,background:'#F8F9FF',borderRadius:12,padding:'10px 14px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                    <div>
                      <span style={{fontWeight:700,fontSize:13,color:'#1a1a2e'}}>{c.animateur?.prenom} {c.animateur?.nom}</span>
                      <span style={{fontSize:11,color:'#888',marginLeft:8}}>{new Date(c.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}</span>
                    </div>
                    {(me?.id===c.animateur_id||isAdmin)&&(
                      <button onClick={()=>deleteComment(c.id)} style={{background:'none',border:'none',color:'#CCC',cursor:'pointer',fontSize:14}} title="Supprimer">✕</button>
                    )}
                  </div>
                  <div style={{fontSize:13,color:'#1a1a2e',lineHeight:1.65}}>{c.contenu}</div>
                </div>
              </div>
            ))}

            {/* Add comment */}
            {me&&(
              <div style={{display:'flex',gap:10,marginTop:4}}>
                <div style={{width:34,height:34,borderRadius:'50%',overflow:'hidden',flexShrink:0,background:'#E5E5E5',marginTop:2}}>
                  {me.photo_url?<img src={me.photo_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%',fontSize:13}}>👤</span>}
                </div>
                <div style={{flex:1}}>
                  <textarea value={newComment} onChange={e=>setNewComment(e.target.value)}
                    placeholder="Ajouter un commentaire sur ce client : contexte, avancement, informations utiles…"
                    rows={3} style={{width:'100%',padding:'10px 12px',borderRadius:12,border:'1.5px solid #E5E5E5',fontSize:13,boxSizing:'border-box',resize:'none',fontFamily:'inherit',outline:'none'}}
                    onKeyDown={e=>{if(e.key==='Enter'&&e.metaKey)postComment()}}/>
                  <div style={{display:'flex',justifyContent:'flex-end',marginTop:6}}>
                    <button onClick={postComment} disabled={!newComment.trim()||postingComment}
                      style={{padding:'8px 20px',borderRadius:10,border:'none',background:newComment.trim()?'#1a1a2e':'#E5E5E5',color:newComment.trim()?'white':'#888',fontWeight:700,fontSize:13,cursor:newComment.trim()?'pointer':'default'}}>
                      {postingComment?'Publication…':'Publier'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
