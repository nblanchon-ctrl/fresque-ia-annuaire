'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export const CGU_VERSION = '2026-11-05-v1'
const PUBLIC = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/offline']
export default function LegalGate({children}:{children:React.ReactNode}) {
 const pathname=usePathname()
 const exempt=PUBLIC.includes(pathname) || pathname.startsWith('/legal/')
 const [status,setStatus]=useState<'loading'|'ok'|'pending'|'error'>('loading')
 const [checked,setChecked]=useState(false)
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 const [uid,setUid]=useState('')
 useEffect(()=>{
   if(exempt){setStatus('ok');return}
   let active=true
   setStatus('loading')
   const sb=createClient()
   sb.auth.getUser().then(async({data,error})=>{
     if(!active)return
     if(error||!data.user){setStatus('ok');return}
     setUid(data.user.id)
     const result=await sb.from('animateur_cgu_acceptations').select('id').eq('user_id',data.user.id).eq('version',CGU_VERSION).maybeSingle()
     if(!active)return
     if(result.error){setMessage('Impossible de vérifier les CGU : '+result.error.message);setStatus('error')}
     else setStatus(result.data?'ok':'pending')
   }).catch(e=>{if(active){setMessage(String(e));setStatus('error')}})
   return ()=>{active=false}
 },[pathname,exempt])
 async function accept(){
  if(!checked||busy||!uid)return
  setBusy(true);setMessage('')
  const sb=createClient()
  const {error}=await sb.from('animateur_cgu_acceptations').insert({user_id:uid,version:CGU_VERSION})
  if(error){setMessage('Enregistrement impossible : '+error.message);setBusy(false);return}
  setStatus('ok');setBusy(false)
 }
 if(exempt||status==='ok')return <>{children}</>
 return <div style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:20,background:'#F4F6FB'}}><div role='dialog' aria-modal='true' aria-label='Acceptation des CGU' style={{width:'100%',maxWidth:550,background:'white',borderRadius:18,padding:30,boxShadow:'0 12px 50px #17255422',lineHeight:1.6}}><h1 style={{fontSize:24,color:'#25234C'}}>Bienvenue sur votre espace Galances</h1>{status==='loading'?<p>Vérification des conditions d’utilisation…</p>:status==='error'?<><p style={{color:'#B91C1C'}}>{message}</p><button onClick={()=>window.location.reload()}>Réessayer</button></>:<><p>Avant d’accéder à la plateforme, prenez connaissance de ses Conditions générales d’utilisation et de sa Politique de confidentialité.</p><p>Les CGU définissent les règles d’accès et d’utilisation. La politique de confidentialité explique comment vos données sont traitées et comment exercer vos droits.</p><p><a href='/legal/cgu' target='_blank' rel='noopener noreferrer'>Consulter les CGU</a> · <a href='/legal/confidentialite' target='_blank' rel='noopener noreferrer'>Consulter la Politique de confidentialité</a></p><label style={{display:'flex',alignItems:'flex-start',gap:10,margin:'20px 0'}}><input type='checkbox' checked={checked} onChange={e=>setChecked(e.target.checked)} style={{marginTop:6}}/>J’ai lu et j’accepte les Conditions générales d’utilisation (version du 5 novembre 2026).</label>{message&&<p role='alert' style={{color:'#B91C1C'}}>{message}</p>}<button disabled={!checked||busy} onClick={accept} style={{width:'100%',padding:14,border:0,borderRadius:9,background:checked?'#4338CA':'#CBD5E1',color:'white',fontWeight:700,cursor:checked?'pointer':'not-allowed'}}>{busy?'Enregistrement…':'Accepter et accéder à la plateforme'}</button></>}</div></div>
}
