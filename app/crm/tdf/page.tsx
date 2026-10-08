'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useLanguage } from '@/lib/i18n'

/* ── TYPES ─────────────────────────────────────────────────── */
type Region = { id: string; nom: string }
type Animateur = { id: string; nom: string; photo_url: string | null; is_admin: boolean }
type TdfAnimateur = { id: string; region_id: string; animateur_id: string; role: string | null; animateur: Animateur }
type Organisation = {
  id: string; region_id: string; nom: string; secteur: string | null
  taille: string | null; referent_id: string | null; commentaire: string | null
  statut: string; prospection_active: boolean; prospection_started_at: string | null
  created_by: string; created_at: string
  referent?: { nom: string } | null
}
type Etape = { id: string; organisation_id: string; etape: number; label: string; statut: string; due_at: string | null; fait_at: string | null; notes: string | null }
type TdfDoc = { id: string; region_id: string | null; nom: string; file_url: string; file_name: string; is_global: boolean; uploaded_by: string; created_at: string }

const STATUTS: Record<string, { label: string; bg: string; color: string; border: string }> = {
  a_contacter: { label: 'À contacter', bg: '#F0F0F4', color: '#555', border: '#CCC' },
  contacte: { label: 'Contacté', bg: '#E6F1FB', color: '#0C447C', border: '#85B7EB' },
  rdv_fait: { label: 'RDV fait', bg: '#FAEEDA', color: '#633806', border: '#EF9F27' },
  accepte: { label: 'Accepté ✓', bg: '#D7FFB8', color: '#2B7400', border: '#58CC02' },
  refuse: { label: 'Refusé', bg: '#FFDFE0', color: '#CC0000', border: '#FF4B4B' },
}
const ETAPE_LABELS = ['1er mail de contact', 'Mail de relance', '2ème mail de relance', 'Mail de clôture']
const ETAPE_DELAIS = [0, 2, 5, 8] // jours depuis démarrage

/* ── SVG MAP ────────────────────────────────────────────────── */
const REGIONS_SVG: Record<string, { path: string; cx: number; cy: number }> = {
  hdf: { cx: 330, cy: 100, path: "M285,55 L415,55 L425,115 L360,125 L310,118 L280,100 Z" },
  nor: { cx: 235, cy: 160, path: "M155,80 L285,55 L310,118 L270,145 L205,148 L150,128 Z" },
  bre: { cx: 115, cy: 220, path: "M40,145 L155,128 L170,160 L158,195 L100,215 L40,200 Z" },
  idf: { cx: 350, cy: 175, path: "M310,118 L390,112 L400,168 L340,180 L305,162 Z" },
  ges: { cx: 445, cy: 200, path: "M415,55 L495,72 L520,150 L475,190 L430,185 L390,168 L400,112 L425,115 Z" },
  pdl: { cx: 190, cy: 268, path: "M155,148 L270,145 L285,190 L272,230 L188,242 L130,218 L125,188 L158,195 Z" },
  cen: { cx: 310, cy: 250, path: "M270,145 L400,168 L388,242 L310,258 L268,230 L285,190 Z" },
  bfc: { cx: 415, cy: 278, path: "M390,168 L475,190 L498,262 L432,280 L388,255 L388,242 Z" },
  naq: { cx: 195, cy: 380, path: "M125,242 L272,242 L310,258 L305,368 L270,395 L202,402 L135,370 L108,305 L118,255 Z" },
  ara: { cx: 415, cy: 370, path: "M388,255 L498,262 L535,328 L500,400 L458,388 L425,348 L348,335 L305,368 L310,258 L388,255 Z" },
  occ: { cx: 315, cy: 448, path: "M270,395 L305,368 L348,335 L425,348 L458,388 L462,435 L390,458 L300,458 L258,430 Z" },
  pac: { cx: 465, cy: 440, path: "M458,388 L500,400 L535,390 L558,425 L518,455 L462,460 L462,435 Z" },
  cor: { cx: 518, cy: 505, path: "M500,485 L518,468 L538,492 L530,535 L510,535 Z" },
}

function FranceMap({ selected, counts, onSelect }: { selected: string | null; counts: Record<string, number>; onSelect: (id: string) => void }) {
  return (
    <svg viewBox="0 0 580 560" style={{ width: '100%', maxWidth: 500, cursor: 'pointer' }}>
      <defs>
        <filter id="shadow">
          <feDropShadow dx="1" dy="2" stdDeviation="3" floodOpacity="0.15"/>
        </filter>
      </defs>
      {/* Fond mer */}
      <rect width="580" height="560" fill="#EBF5FB" rx="8"/>
      {/* Régions */}
      {Object.entries(REGIONS_SVG).map(([id, { path, cx, cy }]) => {
        const isSelected = selected === id
        const count = counts[id] || 0
        const fill = isSelected ? '#534AB7' : count > 0 ? '#A8D5F5' : 'white'
        const stroke = isSelected ? '#3C3489' : '#94A9C5'
        return (
          <g key={id} onClick={() => onSelect(id)} filter="url(#shadow)">
            <path d={path} fill={fill} stroke={stroke} strokeWidth={isSelected ? 2.5 : 1.5} strokeLinejoin="round" style={{ transition: 'all .2s' }}/>
            {count > 0 && !isSelected && (
              <circle cx={cx} cy={cy - 10} r="10" fill="#534AB7"/>
            )}
            {count > 0 && !isSelected && (
              <text x={cx} y={cy - 6} textAnchor="middle" fontSize="9" fill="white" fontWeight="800">{count}</text>
            )}
            <text x={cx} y={cy + (count > 0 && !isSelected ? 4 : 0)} textAnchor="middle" fontSize="8.5" fill={isSelected ? 'white' : '#1a1a2e'} fontWeight="600" pointerEvents="none" style={{ userSelect: 'none' }}>
              {id === 'idf' ? 'Île-de-France' : id === 'hdf' ? 'Hauts-de-France' : id === 'nor' ? 'Normandie' : id === 'bre' ? 'Bretagne' : id === 'pdl' ? 'Pays de la Loire' : id === 'cen' ? 'Centre-VdL' : id === 'ges' ? 'Grand Est' : id === 'bfc' ? 'BFC' : id === 'naq' ? 'Nouvelle-Aq.' : id === 'occ' ? 'Occitanie' : id === 'ara' ? 'ARA' : id === 'pac' ? 'PACA' : 'Corse'}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ── PAGE PRINCIPALE ───────────────────────────────────────── */
export default function TDFPage() {
  const { lang } = useLanguage()
  const supabase = createClient()

  const [me, setMe] = useState<Animateur | null>(null)
  const [allAnimateurs, setAllAnimateurs] = useState<Animateur[]>([])
  const [regions] = useState<Region[]>([
    { id: 'idf', nom: 'Île-de-France' }, { id: 'hdf', nom: 'Hauts-de-France' },
    { id: 'nor', nom: 'Normandie' }, { id: 'bre', nom: 'Bretagne' },
    { id: 'pdl', nom: 'Pays de la Loire' }, { id: 'cen', nom: 'Centre-Val de Loire' },
    { id: 'ges', nom: 'Grand Est' }, { id: 'bfc', nom: 'Bourgogne-Franche-Comté' },
    { id: 'naq', nom: 'Nouvelle-Aquitaine' }, { id: 'ara', nom: 'Auvergne-Rhône-Alpes' },
    { id: 'occ', nom: 'Occitanie' }, { id: 'pac', nom: 'Provence-Alpes-Côte d\'Azur' },
    { id: 'cor', nom: 'Corse' },
  ])
  const [selected, setSelected] = useState<string | null>(null)
  const [tab, setTab] = useState<'animateurs' | 'crm' | 'docs'>('animateurs')
  const [tdfAnimateurs, setTdfAnimateurs] = useState<TdfAnimateur[]>([])
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [etapes, setEtapes] = useState<Etape[]>([])
  const [docs, setDocs] = useState<TdfDoc[]>([])
  const [orgCounts, setOrgCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Forms
  const [myRole, setMyRole] = useState('')
  const [showOrgForm, setShowOrgForm] = useState(false)
  const [orgForm, setOrgForm] = useState({ nom: '', secteur: '', taille: '', referent_id: '', commentaire: '' })
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null)
  const [etapeNote, setEtapeNote] = useState<Record<string, string>>({})
  const [docUploading, setDocUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/crm'; return }
      const [{ data: meData }, { data: animData }, { data: tdfData }, { data: orgData }, { data: docData }] = await Promise.all([
        supabase.from('animateurs').select('id,nom,photo_url,is_admin').eq('id', user.id).single(),
        supabase.from('animateurs').select('id,nom,photo_url,is_admin').order('nom'),
        supabase.from('tdf_animateurs').select('*,animateur:animateurs(id,nom,photo_url,is_admin)'),
        supabase.from('tdf_organisations').select('*,referent:animateurs(nom)').order('created_at', { ascending: false }),
        supabase.from('tdf_documents').select('*').order('created_at', { ascending: false }),
      ])
      setMe(meData)
      setAllAnimateurs(animData || [])
      setTdfAnimateurs((tdfData as TdfAnimateur[]) || [])
      setOrganisations((orgData as Organisation[]) || [])
      setDocs(docData || [])
      // Compter orgs par région
      const counts: Record<string, number> = {}
      ;(orgData || []).forEach((o: Organisation) => { counts[o.region_id] = (counts[o.region_id] || 0) + 1 })
      setOrgCounts(counts)
      setLoading(false)
    }
    init()
  }, [])

  // Charger étapes quand on ouvre une org
  const loadEtapes = async (orgId: string) => {
    const { data } = await supabase.from('tdf_etapes').select('*').eq('organisation_id', orgId).order('etape')
    if (data) setEtapes(prev => [...prev.filter(e => e.organisation_id !== orgId), ...data])
  }

  const selectedRegion = regions.find(r => r.id === selected)
  const regionAnimateurs = tdfAnimateurs.filter(a => a.region_id === selected)
  const regionOrgs = organisations.filter(o => o.region_id === selected)
  const regionDocs = docs.filter(d => d.region_id === selected || d.is_global)
  const isMemberOfRegion = regionAnimateurs.some(a => a.animateur_id === me?.id)

  /* Actions animateurs */
  const joinRegion = async () => {
    if (!me || !selected) return
    setSaving(true)
    const { data } = await supabase.from('tdf_animateurs').insert({ region_id: selected, animateur_id: me.id, role: myRole || null }).select('*,animateur:animateurs(id,nom,photo_url,is_admin)').single()
    if (data) setTdfAnimateurs(prev => [...prev, data as TdfAnimateur])
    setSaving(false)
  }
  const leaveRegion = async () => {
    if (!me || !selected) return
    await supabase.from('tdf_animateurs').delete().eq('region_id', selected).eq('animateur_id', me.id)
    setTdfAnimateurs(prev => prev.filter(a => !(a.region_id === selected && a.animateur_id === me.id)))
  }

  /* Actions organisations */
  const addOrg = async () => {
    if (!me || !selected || !orgForm.nom.trim()) return
    setSaving(true)
    const { data } = await supabase.from('tdf_organisations').insert({ ...orgForm, region_id: selected, created_by: me.id, referent_id: orgForm.referent_id || null }).select('*,referent:animateurs(nom)').single()
    if (data) {
      setOrganisations(prev => [data as Organisation, ...prev])
      setOrgCounts(prev => ({ ...prev, [selected]: (prev[selected] || 0) + 1 }))
    }
    setOrgForm({ nom: '', secteur: '', taille: '', referent_id: '', commentaire: '' })
    setShowOrgForm(false)
    setSaving(false)
  }

  const startProspection = async (org: Organisation) => {
    const now = new Date()
    const etapesData = ETAPE_LABELS.map((label, i) => {
      const due = new Date(now)
      due.setDate(due.getDate() + ETAPE_DELAIS[i])
      return { organisation_id: org.id, etape: i + 1, label, due_at: due.toISOString(), statut: 'en_attente' }
    })
    await supabase.from('tdf_etapes').upsert(etapesData, { onConflict: 'organisation_id,etape' })
    await supabase.from('tdf_organisations').update({ prospection_active: true, prospection_started_at: now.toISOString(), statut: 'contacte' }).eq('id', org.id)
    setOrganisations(prev => prev.map(o => o.id === org.id ? { ...o, prospection_active: true, statut: 'contacte', prospection_started_at: now.toISOString() } : o))
    loadEtapes(org.id)
    setExpandedOrg(org.id)
  }

  const validateEtape = async (etape: Etape, newStatut: string) => {
    if (!me) return
    const update = { statut: newStatut, fait_at: newStatut === 'fait' ? new Date().toISOString() : null, fait_par: me.id, notes: etapeNote[etape.id] || etape.notes }
    await supabase.from('tdf_etapes').update(update).eq('id', etape.id)
    setEtapes(prev => prev.map(e => e.id === etape.id ? { ...e, ...update } : e))
    // Mise à jour statut org si clôture
    const orgEtapes = etapes.filter(e => e.organisation_id === etape.organisation_id)
    if (etape.etape === 4 && newStatut === 'fait') {
      await supabase.from('tdf_organisations').update({ statut: 'contacte' }).eq('id', etape.organisation_id)
    }
  }

  const updateOrgStatut = async (orgId: string, statut: string) => {
    await supabase.from('tdf_organisations').update({ statut }).eq('id', orgId)
    setOrganisations(prev => prev.map(o => o.id === orgId ? { ...o, statut } : o))
  }

  /* Upload documents */
  const uploadDoc = async (e: React.ChangeEvent<HTMLInputElement>, isGlobal = false) => {
    const file = e.target.files?.[0]
    if (!file || !me) return
    setDocUploading(true)
    const path = `${selected || 'global'}/${Date.now()}_${file.name}`
    const { data: up } = await supabase.storage.from('tdf-docs').upload(path, file, { upsert: true })
    if (up) {
      const { data: url } = supabase.storage.from('tdf-docs').getPublicUrl(path)
      const { data: doc } = await supabase.from('tdf_documents').insert({ region_id: isGlobal ? null : selected, nom: file.name.replace(/\.[^.]+$/, ''), file_url: url.publicUrl, file_name: file.name, is_global: isGlobal, uploaded_by: me.id }).select().single()
      if (doc) setDocs(prev => [doc, ...prev])
    }
    setDocUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const deleteDoc = async (doc: TdfDoc) => {
    if (!confirm(`Supprimer "${doc.nom}" ?`)) return
    await supabase.from('tdf_documents').delete().eq('id', doc.id)
    setDocs(prev => prev.filter(d => d.id !== doc.id))
  }

  const daysLate = (etape: Etape) => {
    if (!etape.due_at || etape.statut === 'fait') return 0
    const due = new Date(etape.due_at)
    const now = new Date()
    const diff = Math.floor((now.getTime() - due.getTime()) / 86400000)
    return diff > 0 ? diff : 0
  }

  if (loading) return <div className="container"><div className="empty"><p>Chargement…</p></div></div>

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7' }}>
      <style>{`
        @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
        .tdf-tab{padding:8px 14px;border:none;background:none;cursor:pointer;fontWeight:600;fontSize:13;borderBottom:2px solid transparent;color:#888;transition:all .15s}
        .tdf-tab.active{borderBottom:2px solid #534AB7;color:#534AB7}
      `}</style>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E5E5', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <a href="/crm" style={{ color: '#888', fontSize: 16, textDecoration: 'none' }}>←</a>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#1a1a2e' }}>🗺️ Tour de France — Fresque de l'IA</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Cliquez sur une région pour gérer l'équipe et la prospection</div>
        </div>
        {me?.is_admin && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#534AB7', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {docUploading ? '⏳' : '+ Doc global'}
              <input type="file" style={{ display: 'none' }} onChange={e => uploadDoc(e, true)} disabled={docUploading}/>
            </label>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
        {/* Carte */}
        <div style={{ flex: selected ? '0 0 420px' : 1, padding: 24, overflowY: 'auto', transition: 'flex .3s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <FranceMap selected={selected} counts={orgCounts} onSelect={id => { setSelected(id); setTab('animateurs') }}/>
          {/* Légende */}
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#888' }}>
            <span>⚪ Sans activité</span>
            <span style={{ color: '#0C447C' }}>🔵 Organisations</span>
            <span style={{ color: '#534AB7' }}>🟣 Sélectionnée</span>
          </div>
          {/* Stats globales */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, width: '100%', maxWidth: 480 }}>
            {[
              { label: 'Animateurs inscrits', val: tdfAnimateurs.length, icon: '👥' },
              { label: 'Organisations', val: organisations.length, icon: '🏢' },
              { label: 'Acceptées', val: organisations.filter(o => o.statut === 'accepte').length, icon: '✅' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'white', borderRadius: 12, padding: '10px 14px', textAlign: 'center', border: '1px solid #E5E5E5' }}>
                <div style={{ fontSize: 20 }}>{stat.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#534AB7' }}>{stat.val}</div>
                <div style={{ fontSize: 10, color: '#888', lineHeight: 1.3 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel région */}
        {selected && selectedRegion && (
          <div style={{ flex: 1, background: 'white', borderLeft: '1px solid #E5E5E5', display: 'flex', flexDirection: 'column', animation: 'slideIn .25s ease', overflowY: 'hidden' }}>
            {/* Panel header */}
            <div style={{ padding: '16px 20px 0', borderBottom: '1px solid #E5E5E5' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: '#1a1a2e' }}>{selectedRegion.nom}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{regionAnimateurs.length} animateur(s) · {regionOrgs.length} organisation(s)</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#888', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ display: 'flex', gap: 0 }}>
                {(['animateurs', 'crm', 'docs'] as const).map(t => (
                  <button key={t} className={`tdf-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                    {t === 'animateurs' ? `👥 Équipe (${regionAnimateurs.length})` : t === 'crm' ? `🏢 Prospection (${regionOrgs.length})` : `📄 Docs (${regionDocs.length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Panel body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

              {/* TAB ANIMATEURS */}
              {tab === 'animateurs' && (
                <div>
                  {!isMemberOfRegion ? (
                    <div style={{ background: '#EEEDFE', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#534AB7', marginBottom: 10 }}>Rejoindre cette région</div>
                      <input value={myRole} onChange={e => setMyRole(e.target.value)} placeholder="Votre rôle (optionnel : Coordinateur, Contact local...)" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #AFA9EC', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }}/>
                      <button onClick={joinRegion} disabled={saving} style={{ padding: '8px 16px', background: '#534AB7', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        {saving ? '...' : "S'inscrire sur cette région"}
                      </button>
                    </div>
                  ) : (
                    <div style={{ background: '#E1F5EE', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#085041', fontWeight: 600 }}>✓ Vous êtes inscrit sur cette région</span>
                      <button onClick={leaveRegion} style={{ fontSize: 11, color: '#CC0000', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Se désinscrire</button>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {regionAnimateurs.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#888', fontSize: 13, padding: '20px 0' }}>Aucun animateur inscrit sur cette région</div>
                    )}
                    {regionAnimateurs.map(ta => {
                      const anim = ta.animateur
                      return (
                        <div key={ta.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', background: '#F8F8F8', borderRadius: 12, border: '0.5px solid #E5E5E5' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#534AB7', flexShrink: 0, overflow: 'hidden' }}>
                            {anim.photo_url ? <img src={anim.photo_url} alt={anim.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : anim.nom.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{anim.nom}</div>
                            {ta.role && <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{ta.role}</div>}
                          </div>
                          {anim.is_admin && <span style={{ fontSize: 10, background: '#534AB7', color: 'white', padding: '2px 6px', borderRadius: 20, fontWeight: 700 }}>Admin</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* TAB CRM */}
              {tab === 'crm' && (
                <div>
                  {/* Filtres statut */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    {Object.entries(STATUTS).map(([key, s]) => (
                      <span key={key} style={{ padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 11, fontWeight: 600 }}>
                        {s.label} ({regionOrgs.filter(o => o.statut === key).length})
                      </span>
                    ))}
                  </div>

                  {/* Bouton ajouter org */}
                  <button onClick={() => setShowOrgForm(v => !v)} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px dashed #AFA9EC', background: showOrgForm ? '#EEEDFE' : 'white', color: '#534AB7', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 14 }}>
                    {showOrgForm ? 'Fermer ×' : '+ Ajouter une organisation'}
                  </button>

                  {/* Formulaire organisation */}
                  {showOrgForm && (
                    <div style={{ background: '#F8F9FF', borderRadius: 14, padding: '14px', border: '1.5px solid #AFA9EC', marginBottom: 14 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <div style={{ gridColumn: '1/-1' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#534AB7', marginBottom: 3 }}>Nom de l'organisation *</div>
                          <input value={orgForm.nom} onChange={e => setOrgForm(f => ({ ...f, nom: e.target.value }))} placeholder="Ex : CHU Lyon, Renault..." style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #E5E5E5', fontSize: 13, boxSizing: 'border-box' }}/>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 3 }}>Secteur</div>
                          <input value={orgForm.secteur} onChange={e => setOrgForm(f => ({ ...f, secteur: e.target.value }))} placeholder="Santé, Industrie..." style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #E5E5E5', fontSize: 13, boxSizing: 'border-box' }}/>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 3 }}>Taille</div>
                          <select value={orgForm.taille} onChange={e => setOrgForm(f => ({ ...f, taille: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #E5E5E5', fontSize: 13 }}>
                            <option value="">—</option>
                            <option value="micro">{'< 50 salariés'}</option>
                            <option value="pme">50–500</option>
                            <option value="eti">500–2000</option>
                            <option value="grand">{'> 2000'}</option>
                          </select>
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 3 }}>Référent (animateur responsable)</div>
                          <select value={orgForm.referent_id} onChange={e => setOrgForm(f => ({ ...f, referent_id: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #E5E5E5', fontSize: 13 }}>
                            <option value="">Non assigné</option>
                            {regionAnimateurs.map(ta => <option key={ta.animateur_id} value={ta.animateur_id}>{ta.animateur.nom}</option>)}
                          </select>
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 3 }}>Commentaire</div>
                          <textarea value={orgForm.commentaire} onChange={e => setOrgForm(f => ({ ...f, commentaire: e.target.value }))} rows={2} placeholder="Contexte, contact, notes..." style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #E5E5E5', fontSize: 13, resize: 'none', boxSizing: 'border-box' }}/>
                        </div>
                      </div>
                      <button onClick={addOrg} disabled={saving || !orgForm.nom.trim()} style={{ padding: '8px 18px', background: orgForm.nom.trim() ? '#534AB7' : '#E5E5E5', color: orgForm.nom.trim() ? 'white' : '#aaa', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        {saving ? '...' : 'Ajouter →'}
                      </button>
                    </div>
                  )}

                  {/* Liste organisations */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {regionOrgs.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#888', fontSize: 13, padding: '20px 0' }}>Aucune organisation pour cette région</div>
                    )}
                    {regionOrgs.map(org => {
                      const st = STATUTS[org.statut] || STATUTS.a_contacter
                      const orgEtapes = etapes.filter(e => e.organisation_id === org.id)
                      const isExpanded = expandedOrg === org.id
                      return (
                        <div key={org.id} style={{ borderRadius: 14, border: `1.5px solid ${st.border}`, background: 'white', overflow: 'hidden' }}>
                          <div style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 4 }}>{org.nom}</div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                                  {org.secteur && <span style={{ fontSize: 10, background: '#F0F0F4', color: '#555', padding: '2px 8px', borderRadius: 20 }}>{org.secteur}</span>}
                                  {org.taille && <span style={{ fontSize: 10, background: '#F0F0F4', color: '#555', padding: '2px 8px', borderRadius: 20 }}>{org.taille}</span>}
                                  {org.referent && <span style={{ fontSize: 10, background: '#EEEDFE', color: '#534AB7', padding: '2px 8px', borderRadius: 20 }}>👤 {org.referent.nom}</span>}
                                </div>
                                {org.commentaire && <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>{org.commentaire}</div>}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                                <select value={org.statut} onChange={e => updateOrgStatut(org.id, e.target.value)} style={{ padding: '3px 8px', borderRadius: 20, border: `1px solid ${st.border}`, background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                  {Object.entries(STATUTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                                </select>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                              {!org.prospection_active ? (
                                <button onClick={() => startProspection(org)} style={{ padding: '6px 12px', background: '#58CC02', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                                  🚀 Lancer la prospection
                                </button>
                              ) : (
                                <button onClick={() => { setExpandedOrg(isExpanded ? null : org.id); if (!isExpanded) loadEtapes(org.id) }} style={{ padding: '6px 12px', background: '#E6F1FB', color: '#0C447C', border: '1px solid #85B7EB', borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                                  {isExpanded ? '▲ Masquer' : `▼ Suivi prospection (${orgEtapes.filter(e => e.statut === 'fait').length}/4)`}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Étapes de prospection */}
                          {isExpanded && org.prospection_active && (
                            <div style={{ borderTop: '1px solid #E5E5E5', background: '#FAFAFA', padding: '12px 14px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {ETAPE_LABELS.map((label, i) => {
                                  const etape = orgEtapes.find(e => e.etape === i + 1)
                                  if (!etape) return (
                                    <div key={i} style={{ padding: '8px 12px', background: '#F0F0F0', borderRadius: 8, fontSize: 12, color: '#aaa' }}>
                                      {i + 1}. {label} — chargement...
                                    </div>
                                  )
                                  const late = daysLate(etape)
                                  const bgColor = etape.statut === 'fait' ? '#E1F5EE' : etape.statut === 'en_attente' ? 'white' : '#F0F0F4'
                                  const borderColor = etape.statut === 'fait' ? '#5DCAA5' : late > 0 ? '#FF4B4B' : '#E5E5E5'
                                  return (
                                    <div key={etape.id} style={{ padding: '10px 12px', background: bgColor, borderRadius: 10, border: `1.5px solid ${borderColor}` }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <div style={{ fontWeight: 700, fontSize: 12, color: etape.statut === 'fait' ? '#085041' : '#1a1a2e' }}>
                                          {etape.statut === 'fait' ? '✓' : i + 1}. {label}
                                        </div>
                                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                          {late > 0 && etape.statut !== 'fait' && (
                                            <span style={{ fontSize: 10, background: '#FF4B4B', color: 'white', padding: '2px 6px', borderRadius: 20, fontWeight: 700 }}>
                                              {late}j de retard
                                            </span>
                                          )}
                                          {etape.due_at && <span style={{ fontSize: 10, color: '#888' }}>Prévu: {new Date(etape.due_at).toLocaleDateString('fr-FR')}</span>}
                                        </div>
                                      </div>
                                      {etape.statut !== 'fait' && (
                                        <div>
                                          <input
                                            value={etapeNote[etape.id] || ''}
                                            onChange={e => setEtapeNote(prev => ({ ...prev, [etape.id]: e.target.value }))}
                                            placeholder="Note (optionnel)..."
                                            style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #E5E5E5', fontSize: 11, marginBottom: 6, boxSizing: 'border-box' }}
                                          />
                                          <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => validateEtape(etape, 'fait')} style={{ padding: '5px 10px', background: '#58CC02', color: 'white', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                                              ✓ Envoyé
                                            </button>
                                            <button onClick={() => validateEtape(etape, 'skip')} style={{ padding: '5px 10px', background: '#F0F0F0', color: '#888', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 11, cursor: 'pointer' }}>
                                              Passer
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                      {etape.statut === 'fait' && etape.fait_at && (
                                        <div style={{ fontSize: 10, color: '#085041' }}>
                                          Envoyé le {new Date(etape.fait_at).toLocaleDateString('fr-FR')}
                                          {etape.notes && <span> · {etape.notes}</span>}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* TAB DOCUMENTS */}
              {tab === 'docs' && (
                <div>
                  {/* Upload */}
                  {(isMemberOfRegion || me?.is_admin) && (
                    <label style={{ display: 'block', padding: '10px 14px', background: '#F8F9FF', border: '1.5px dashed #AFA9EC', borderRadius: 12, textAlign: 'center', cursor: 'pointer', marginBottom: 14, fontSize: 13, color: '#534AB7', fontWeight: 700 }}>
                      {docUploading ? '⏳ Upload en cours...' : '+ Ajouter un document à cette région'}
                      <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => uploadDoc(e, false)} disabled={docUploading}/>
                    </label>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {regionDocs.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#888', fontSize: 13, padding: '20px 0' }}>Aucun document disponible</div>
                    )}
                    {regionDocs.map(doc => (
                      <div key={doc.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', background: '#F8F8F8', borderRadius: 12, border: '0.5px solid #E5E5E5' }}>
                        <div style={{ fontSize: 22, flexShrink: 0 }}>
                          {/\.pdf$/i.test(doc.file_name) ? '📄' : /\.(doc|docx)$/i.test(doc.file_name) ? '📝' : /\.(xls|xlsx)$/i.test(doc.file_name) ? '📊' : '📁'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nom}</div>
                          <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>
                            {doc.is_global ? '🌍 Disponible partout' : '📍 Région uniquement'} · {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 10px', background: '#534AB7', color: 'white', borderRadius: 6, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>↓ Ouvrir</a>
                          {(me?.is_admin || doc.uploaded_by === me?.id) && (
                            <button onClick={() => deleteDoc(doc)} style={{ padding: '5px 8px', background: 'none', border: '1px solid #FFDFE0', color: '#CC0000', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>×</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
