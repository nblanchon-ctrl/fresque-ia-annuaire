'use client'
import React, {useEffect,useMemo,useState} from 'react'
import {editorialPosts, type EditorialPost} from './editorial-data'

const months=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
const weekdays=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
const fmt=(iso:string)=>{const [y,m,d]=iso.split('-').map(Number);return `${d} ${months[m-1]} ${y}`}
export default function EditorialPlanning({onBack}:{onBack:()=>void}){
 const [scope,setScope]=useState<'national'|'local'|null>(null)
 const [month,setMonth]=useState(9)
 const [year,setYear]=useState(2026)
 const [active,setActive]=useState<EditorialPost|null>(null)
 const [copied,setCopied]=useState(false)
 useEffect(()=>{if(active)document.getElementById('ed-post-detail')?.scrollIntoView({behavior:'smooth',block:'start'})},[active])
 const [showRelative,setShowRelative]=useState(true)
 const items=useMemo(()=>editorialPosts.filter(p=>p.scope===scope),[scope])
 const dated=items.filter(p=>p.date)
 const relative=items.filter(p=>!p.date)
 const first=(new Date(year,month,1).getDay()+6)%7
 const days=new Date(year,month+1,0).getDate()
 const cells=Array.from({length:Math.ceil((first+days)/7)*7},(_,i)=>i-first+1)
 const postsByDay=(day:number)=>dated.filter(p=>p.date===`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`)
 const move=(n:number)=>{const d=new Date(year,month+n,1);setYear(d.getFullYear());setMonth(d.getMonth());setActive(null)}
 const choose=(next:'national'|'local')=>{setScope(next);setActive(null);setYear(2026);setMonth(9)}
 const copy=async()=>{if(!active)return;try{await navigator.clipboard.writeText(active.body);setCopied(true);setTimeout(()=>setCopied(false),2000)}catch{window.prompt('Copiez le texte du post :',active.body)}}
 return <section className="ed-root">
  <style>{`
   .ed-root{max-width:1200px;margin:0 auto;padding:28px 20px 60px;color:#1c2540}
   .ed-root *{box-sizing:border-box}.ed-back{border:1px solid #dfe4ef;background:white;color:#4338ca;border-radius:10px;padding:10px 15px;font-weight:700;cursor:pointer}
   .ed-heading{font-size:clamp(23px,3vw,34px);font-weight:850;margin:18px 0 6px}.ed-sub{color:#66728a;line-height:1.6;margin:0 0 22px}
   .ed-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.ed-choice{background:white;border:1px solid #e0e6f1;border-radius:18px;padding:26px;text-align:left;cursor:pointer;box-shadow:0 5px 18px #2435630d}
   .ed-choice:hover{border-color:#4338ca}.ed-choice strong{display:block;font-size:21px;margin:10px 0}.ed-choice span{color:#66728a;line-height:1.5}
   .ed-toolbar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:18px}
   .ed-monthnav{display:flex;align-items:center;gap:14px}.ed-monthnav button{border:1px solid #dce2ef;background:white;border-radius:9px;padding:8px 12px;cursor:pointer;font-size:19px;color:#27334d}.ed-monthnav strong{min-width:155px;text-align:center;text-transform:capitalize}
   .ed-calendar{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border:1px solid #e0e6f1;border-radius:15px;overflow:hidden;background:white}
   .ed-weekday{text-align:center;padding:12px 2px;background:#eef1fb;font-weight:750;font-size:12px;color:#4a5771}
   .ed-day{min-height:105px;padding:10px 7px;border-top:1px solid #edf0f6;border-right:1px solid #edf0f6;min-width:0}.ed-day.empty{background:#f9fafd}.ed-daynum{font-size:13px;font-weight:700;color:#55617a}
   .ed-post{display:flex;align-items:flex-start;gap:6px;border:0;background:#fff1f1;color:#912828;border-radius:8px;width:100%;padding:7px 6px;margin-top:7px;cursor:pointer;text-align:left;font-size:11px;font-weight:700;line-height:1.35;overflow-wrap:anywhere}
   .ed-dot{display:inline-block;background:#e33239;width:9px;height:9px;min-width:9px;border-radius:50%;margin-top:2px}
   .ed-post:hover{background:#ffe2e3}.ed-panel{margin-top:18px;background:white;border:1px solid #e0e6f1;border-radius:15px;padding:22px;min-width:0}
   .ed-panel h3{font-size:20px;margin:8px 0}.ed-label{font-size:12px;color:#59677d;font-weight:700}.ed-body{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.8;color:#27334d;background:#f7f9fd;padding:18px;border-radius:12px;margin:16px 0}
   .ed-copy{border:0;background:#4338ca;color:white;border-radius:10px;padding:12px 18px;font-weight:750;cursor:pointer}.ed-close{border:1px solid #dce2ef;background:white;color:#44516a;border-radius:10px;padding:10px 14px;cursor:pointer}
   .ed-rel{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px;margin-top:12px}.ed-rel button{background:#f7f9fd;border:1px solid #e0e6f1;border-radius:10px;text-align:left;padding:12px;color:#24334c;cursor:pointer;line-height:1.5}
   @media(max-width:650px){.ed-root{padding:16px 10px 40px}.ed-choices{grid-template-columns:1fr}.ed-day{min-height:65px;padding:5px 3px}.ed-weekday{font-size:10px}.ed-post{font-size:0;justify-content:center;padding:6px 2px}.ed-post .ed-dot{margin:0;width:10px;height:10px}.ed-post .ed-post-title{display:none}.ed-monthnav strong{min-width:125px}.ed-panel{padding:14px}.ed-toolbar{align-items:flex-start}}
  `}</style>
  <button className="ed-back" onClick={scope?()=>{setScope(null);setActive(null)}:onBack}>← {scope?'Choisir un planning':'Retour à la carte'}</button>
  <h1 className="ed-heading">📅 Planning éditorial LinkedIn</h1>
  <p className="ed-sub">Tour de France de la Fresque de l’IA · Publications proposées, non programmées automatiquement.</p>
  {!scope?<div className="ed-choices">
   <button className="ed-choice" onClick={()=>choose('national')}><div style={{fontSize:30}}>🇫🇷</div><strong>Planning national</strong><span>50 ébauches pour la page nationale, du 13 octobre 2026 au 1er avril 2027. Deux publications par semaine, dont deux facultatives.</span></button>
   <button className="ed-choice" onClick={()=>choose('local')}><div style={{fontSize:30}}>📍</div><strong>Planning local</strong><span>15 modèles à adapter par les animateurs : mobilisation des partenaires, invitations et retours de rencontres.</span></button>
  </div>:<>
   <div className="ed-toolbar"><div><strong style={{fontSize:19}}>{scope==='national'?'🇫🇷 National':'📍 Local'}</strong><div style={{fontSize:12,color:'#66728a',marginTop:5}}>{items.length} modèles · Cliquez sur une pastille rouge pour lire et copier le texte.</div></div><div className="ed-monthnav"><button aria-label="Mois précédent" onClick={()=>move(-1)}>‹</button><strong>{months[month]} {year}</strong><button aria-label="Mois suivant" onClick={()=>move(1)}>›</button></div></div>
   <div className="ed-calendar">{weekdays.map(w=><div key={w} className="ed-weekday">{w}</div>)}{cells.map((day,i)=><div key={i} className={'ed-day'+(day<1||day>days?' empty':'')}>{day>=1&&day<=days&&<><span className="ed-daynum">{day}</span>{postsByDay(day).map(p=><button key={p.id} className="ed-post" title={p.title} onClick={()=>{setActive(p);setCopied(false)}}><span className="ed-dot"/><span className="ed-post-title">{p.title}</span></button>)}</>}</div>)}</div>
   {scope==='local'&&relative.length>0&&<div className="ed-panel"><button className="ed-close" onClick={()=>setShowRelative(!showRelative)}>{showRelative?'▾':'▸'} Publications liées à la date de votre rencontre ({relative.length})</button>{showRelative&&<><p style={{fontSize:13,color:'#66728a'}}>Ces modèles sont repérés par J–35, J–7 ou J+2 : leur date dépend de votre rencontre. Ils ne sont donc pas placés arbitrairement dans le calendrier.</p><div className="ed-rel">{relative.map(p=><button key={p.id} onClick={()=>{setActive(p);setCopied(false)}}><span style={{color:'#e33239',fontWeight:800}}>●</span> <strong>{p.relative}</strong><div>{p.title}</div></button>)}</div></>}</div>}
   {active&&<div className="ed-panel" id="ed-post-detail"><div className="ed-label">{active.id} · {active.date?fmt(active.date):active.relative} · {active.category}</div><h3>{active.title}</h3>{/\[[^\]]+\]/.test(active.body)&&<p style={{color:'#a05a13',fontSize:12,fontWeight:700}}>⚠️ Ce modèle contient des champs entre crochets à personnaliser avant publication.</p>}<div className="ed-body">{active.body}</div><div style={{display:'flex',gap:10,flexWrap:'wrap'}}><button className="ed-copy" onClick={copy}>{copied?'✓ Copié !':'📋 Copier le post'}</button><button className="ed-close" onClick={()=>setActive(null)}>Fermer</button></div></div>}
   <p style={{fontSize:12,color:'#69758c',marginTop:18}}>Les dates correspondent au planning proposé, et non à des publications déjà effectuées. Vérifiez les informations locales, les partenaires et les liens avant publication.</p>
  </>}
 </section>
}
