'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

type Region = { id: string; nom: string }
type AnimateurLight = { id: string; nom: string; photo_url: string | null; is_admin: boolean }
type TdfAnim = { id: string; region_id: string; animateur_id: string; role: string | null; animateur: AnimateurLight }
type Org = { id: string; region_id: string; nom: string; secteur: string | null; taille: string | null; referent_id: string | null; commentaire: string | null; statut: string; prospection_active: boolean; prospection_started_at: string | null; created_by: string; created_at: string; referent?: { nom: string } | null }
type Etape = { id: string; organisation_id: string; etape: number; label: string; statut: string; due_at: string | null; fait_at: string | null; notes: string | null; fait_par: string | null }
type Doc = { id: string; region_id: string | null; nom: string; file_url: string; file_name: string; is_global: boolean; uploaded_by: string; created_at: string }

const REGIONS: Region[] = [
  { id: 'idf', nom: 'Île-de-France' }, { id: 'hdf', nom: 'Hauts-de-France' },
  { id: 'nor', nom: 'Normandie' }, { id: 'bre', nom: 'Bretagne' },
  { id: 'pdl', nom: 'Pays de la Loire' }, { id: 'cen', nom: 'Centre-Val de Loire' },
  { id: 'ges', nom: 'Grand Est' }, { id: 'bfc', nom: 'Bourgogne-Franche-Comté' },
  { id: 'naq', nom: 'Nouvelle-Aquitaine' }, { id: 'ara', nom: 'Auvergne-Rhône-Alpes' },
  { id: 'occ', nom: 'Occitanie' }, { id: 'pac', nom: 'PACA' }, { id: 'cor', nom: 'Corse' },
]

const STATUTS: Record<string, { label: string; bg: string; color: string; border: string }> = {
  a_contacter: { label: 'À contacter', bg: '#F0F0F4', color: '#555', border: '#CCC' },
  contacte: { label: 'Contacté', bg: '#E6F1FB', color: '#0C447C', border: '#85B7EB' },
  rdv_fait: { label: 'RDV fait', bg: '#FAEEDA', color: '#633806', border: '#EF9F27' },
  accepte: { label: 'Accepté ✓', bg: '#D7FFB8', color: '#2B7400', border: '#58CC02' },
  refuse: { label: 'Refusé', bg: '#FFDFE0', color: '#CC0000', border: '#FF4B4B' },
}
const ETAPE_LABELS = ['1er mail de contact', 'Mail de relance', '2ème mail de relance', 'Mail de clôture']
const ETAPE_DELAIS = [0, 3, 6, 10]

// Carte France SVG simplifiée — coordonnées normalisées 580x620
const SVG_REGIONS: Record<string, { d: string; cx: number; cy: number; abbr: string }> = {
  hdf: { d: 'M283,52 L418,52 L428,118 L362,128 L308,120 L278,102 Z', cx: 355, cy: 90, abbr: 'Hts-de-France' },
  nor: { d: 'M152,78 L283,52 L308,120 L268,148 L202,150 L148,130 Z', cx: 235, cy: 105, abbr: 'Normandie' },
  bre: { d: 'M38,148 L152,130 L168,165 L155,200 L98,218 L38,205 Z', cx: 112, cy: 175, abbr: 'Bretagne' },
  idf: { d: 'M308,120 L392,115 L402,172 L342,182 L302,165 Z', cx: 355, cy: 150, abbr: 'Île-de-France' },
  ges: { d: 'M418,52 L498,68 L522,152 L478,192 L432,188 L392,172 L402,115 L428,118 Z', cx: 458, cy: 135, abbr: 'Grand Est' },
  pdl: { d: 'M152,150 L268,148 L284,192 L272,235 L186,248 L128,220 L122,192 L155,200 Z', cx: 202, cy: 198, abbr: 'Pays-de-Loire' },
  cen: { d: 'M268,148 L402,172 L390,245 L312,260 L270,238 L272,235 L284,192 Z', cx: 330, cy: 210, abbr: 'Centre-VdL' },
  bfc: { d: 'M392,172 L478,192 L502,268 L435,285 L390,258 L390,245 Z', cx: 438, cy: 232, abbr: 'BFC' },
  naq: { d: 'M122,248 L272,248 L312,275 L308,378 L272,398 L205,408 L132,372 L105,308 L115,258 Z', cx: 200, cy: 330, abbr: 'Nouvelle-Aq.' },
  ara: { d: 'M390,258 L502,268 L538,332 L502,408 L462,395 L428,352 L350,338 L308,378 L312,275 L390,258 Z', cx: 422, cy: 340, abbr: 'ARA' },
  occ: { d: 'M272,398 L308,378 L350,338 L428,352 L462,395 L465,440 L392,462 L302,462 L260,432 Z', cx: 368, cy: 418, abbr: 'Occitanie' },
  pac: { d: 'M462,395 L502,408 L538,395 L558,428 L520,458 L465,462 L465,440 Z', cx: 505, cy: 428, abbr: 'PACA' },
  cor: { d: 'M502,488 L520,468 L540,494 L532,538 L512,538 Z', cx: 522, cy: 508, abbr: 'Corse' },
}

function FranceMap({ selected, counts, onSelect }: { selected: string | null; counts: Record<string, number>; onSelect: (id: string) => void }) {
  return (
    <svg viewBox="0 0 580 560" style={{ width: '100%', maxWidth: 480, cursor: 'pointer' }}>
      <rect width="580" height="560" fill="#EBF5FB" rx="8"/>
      {Object.entries(SVG_REGIONS).map(([id, { d, cx, cy, abbr }]) => {
        const sel = selected === id
        const n = counts[id] || 0
        return (
          <g key={id} onClick={() => onSelect(id)}>
            <path d={d} fill={sel ? '#534AB7' : n > 0 ? '#B5D5F5' : '#F0F4F8'} stroke={sel ? '#3C3489' : '#94A9C5'} strokeWidth={sel ? 2.5 : 1.2} strokeLinejoin="round" style={{ transition: 'all .18s' }}/>
            {n > 0 && !sel && (
              <><circle cx={cx} cy={cy - 9} r="10" fill="#534AB7"/>
              <text x={cx} y={cy - 5} textAnchor="middle" fontSize="9" fill="white" fontWeight="800">{n}</text></>
            )}
            <text x={cx} y={cy + (n > 0 && !sel ? 5 : 1)} textAnchor="middle" fontSize={id === 'bfc' || id === 'nor' || id === 'hdf' || id === 'pdl' ? 7.5 : 8.5} fill={sel ? 'white' : '#1a1a2e'} fontWeight="600" style={{ pointerEvents: 'none', userSelect: 'none' }}>
              {abbr}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function TDFPage() {
  const supabase = createClient()
  const [me, setMe] = useState<AnimateurLight | null>(null)
  const [allAnims, setAllAnims] = useState<AnimateurLight[]>([])
  const [tdfAnims, setTdfAnims] = useState<TdfAnim[]>([])
  const [orgs, setOrgs] = useState<Org[]>([])
  const [etapes, setEtapes] = useState<Etape[]>([])
  const [docs, setDocs] = useState<Doc[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [tab, setTab] = useState<'equipe' | 'crm' | 'docs'>('equipe')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [myRole, setMyRole] = useState('')
  const [showOrgForm, setShowOrgForm] = useState(false)
  const [orgForm, setOrgForm] = useState({ nom: '', secteur: '', taille: '', referent_id: '', commentaire: '' })
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null)
  const [etapeNotes, setEtapeNotes] = useState<Record<string, string>>({})
  const [docUploading, setDocUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const fileGlobalRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { window.location.href = '/crm'; return }

        const [{ data: meData, error: e1 }, { data: animData }, { data: tdfData, error: e2 }, { data: orgData, error: e3 }, { data: docData, error: e4 }] = await Promise.all([
          supabase.from('animateurs').select('id,nom,photo_url,is_admin').eq('id', user.id).single(),
          supabase.from('animateurs').select('id,nom,photo_url,is_admin').order('nom'),
          supabase.from('tdf_animateurs').select('*,animateur:animateurs(id,nom,photo_url,is_admin)'),
          supabase.from('tdf_organisations').select('*,referent:animateurs(nom)').order('created_at', { ascending: false }),
          supabase.from('tdf_documents').select('*').order('created_at', { ascending: false }),
        ])

        if (e2 || e3) {
          setError('Les tables Tour de France n\'existent pas encore. Exécutez le SQL_TDF.sql dans Supabase d\'abord.')
          setLoading(false); return
        }
        setMe(meData)
        setAllAnims(animData || [])
        setTdfAnims((tdfData as TdfAnim[]) || [])
        setOrgs((orgData as Org[]) || [])
        setDocs(docData || [])
      } catch (err) {
        setError('Erreur de chargement. Vérifiez que le SQL_TDF.sql a bien été exécuté.')
      }
      setLoading(false)
    }
    init()
  }, [])

  const reg = REGIONS.find(r => r.id === selected)
  const regAnims = tdfAnims.filter(a => a.region_id === selected)
  const regOrgs = orgs.filter(o => o.region_id === selected)
  const regDocs = docs.filter(d => d.region_id === selected || d.is_global)
  const isMember = regAnims.some(a => a.animateur_id === me?.id)
  const orgCounts = orgs.reduce((acc, o) => ({ ...acc, [o.region_id]: (acc[o.region_id] || 0) + 1 }), {} as Record<string, number>)

  const joinRegion = async () => {
    if (!me || !selected) return
    setSaving(true)
    const { data, error } = await supabase.from('tdf_animateurs').insert({ region_id: selected, animateur_id: me.id, role: myRole || null }).select('*,animateur:animateurs(id,nom,photo_url,is_admin)').single()
    if (!error && data) setTdfAnims(prev => [...prev, data as TdfAnim])
    setSaving(false); setMyRole('')
  }

  const leaveRegion = async () => {
    if (!me || !selected || !confirm('Se désinscrire de cette région ?')) return
    await supabase.from('tdf_animateurs').delete().eq('region_id', selected).eq('animateur_id', me.id)
    setTdfAnims(prev => prev.filter(a => !(a.region_id === selected && a.animateur_id === me.id)))
  }

  const addOrg = async () => {
    if (!me || !selected || !orgForm.nom.trim()) return
    setSaving(true)
    const payload = { nom: orgForm.nom, secteur: orgForm.secteur || null, taille: orgForm.taille || null, referent_id: orgForm.referent_id || null, commentaire: orgForm.commentaire || null, region_id: selected, created_by: me.id }
    const { data, error } = await supabase.from('tdf_organisations').insert(payload).select('*,referent:animateurs(nom)').single()
    if (!error && data) setOrgs(prev => [data as Org, ...prev])
    setOrgForm({ nom: '', secteur: '', taille: '', referent_id: '', commentaire: '' })
    setShowOrgForm(false); setSaving(false)
  }

  const startProspection = async (org: Org) => {
    const now = new Date()
    const rows = ETAPE_LABELS.map((label, i) => {
      const due = new Date(now); due.setDate(due.getDate() + ETAPE_DELAIS[i])
      return { organisation_id: org.id, etape: i + 1, label, due_at: due.toISOString(), statut: 'en_attente', fait_at: null, notes: null, fait_par: null }
    })
    await supabase.from('tdf_etapes').upsert(rows, { onConflict: 'organisation_id,etape' })
    await supabase.from('tdf_organisations').update({ prospection_active: true, prospection_started_at: now.toISOString(), statut: 'contacte' }).eq('id', org.id)
    setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, prospection_active: true, statut: 'contacte', prospection_started_at: now.toISOString() } : o))
    setEtapes(prev => [...prev.filter(e => e.organisation_id !== org.id), ...rows.map((r, i) => ({ ...r, id: `tmp-${i}` }))])
    setExpandedOrg(org.id)
    // Reload real etapes
    const { data } = await supabase.from('tdf_etapes').select('*').eq('organisation_id', org.id).order('etape')
    if (data) setEtapes(prev => [...prev.filter(e => e.organisation_id !== org.id), ...data])
  }

  const validateEtape = async (etape: Etape, statut: string) => {
    if (!me) return
    const update = { statut, fait_at: statut === 'fait' ? new Date().toISOString() : null, fait_par: me.id, notes: etapeNotes[etape.id] || etape.notes }
    await supabase.from('tdf_etapes').update(update).eq('id', etape.id)
    setEtapes(prev => prev.map(e => e.id === etape.id ? { ...e, ...update } : e))
  }

  const changeStatut = async (orgId: string, statut: string) => {
    await supabase.from('tdf_organisations').update({ statut }).eq('id', orgId)
    setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, statut } : o))
  }

  const deleteOrg = async (org: Org) => {
    if (!confirm(`Supprimer "${org.nom}" ?`)) return
    await supabase.from('tdf_organisations').delete().eq('id', org.id)
    setOrgs(prev => prev.filter(o => o.id !== org.id))
  }

  const uploadDoc = async (file: File, isGlobal: boolean) => {
    if (!me) return
    setDocUploading(true)
    const path = `${selected || 'global'}/${Date.now()}_${file.name}`
    const { data: up, error: upErr } = await supabase.storage.from('tdf-docs').upload(path, file, { upsert: true })
    if (!upErr && up) {
      const { data: urlData } = supabase.storage.from('tdf-docs').getPublicUrl(path)
      const { data: doc } = await supabase.from('tdf_documents').insert({ region_id: isGlobal ? null : selected, nom: file.name.replace(/\.[^.]+$/, ''), file_url: urlData.publicUrl, file_name: file.name, is_global: isGlobal, uploaded_by: me.id }).select().single()
      if (doc) setDocs(prev => [doc, ...prev])
    }
    setDocUploading(false)
  }

  const deleteDoc = async (doc: Doc) => {
    if (!confirm(`Supprimer "${doc.nom}" ?`)) return
    await supabase.from('tdf_documents').delete().eq('id', doc.id)
    setDocs(prev => prev.filter(d => d.id !== doc.id))
  }

  const daysLate = (etape: Etape) => {
    if (!etape.due_at || etape.statut === 'fait') return 0
    return Math.max(0, Math.floor((Date.now() - new Date(etape.due_at).getTime()) / 86400000))
  }

  if (loading) return <div className="container"><div className="empty"><p>Chargement du Tour de France…</p></div></div>

  if (error) return (
    <div className="container">
      <div className="card" style={{ background: '#FFDFE0', border: '1.5px solid #FF4B4B', marginTop: 24 }}>
        <div style={{ fontWeight: 700, color: '#CC0000', marginBottom: 8 }}>⚠️ Configuration requise</div>
        <p style={{ fontSize: 13, color: '#990000', lineHeight: 1.6, margin: 0 }}>{error}</p>
      </div>
      <a href="/crm" className="btn" style={{ marginTop: 16, display: 'inline-flex' }}>← Retour au CRM</a>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7' }}>
      <style>{`
        .tdf-tab{padding:9px 14px;border:none;background:none;cursor:pointer;font-weight:600;font-size:13px;border-bottom:2.5px solid transparent;color:#888;transition:all .15s}
        .tdf-tab.act{border-bottom-color:#534AB7;color:#534AB7}
        @keyframes slideIn{from{transform:translateX(30px);opacity:0}to{transform:translateX(0);opacity:1}}
      `}</style>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E5E5', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', top: 0, zIndex: 30 }}>
        <a href="/crm" style={{ color: '#888', fontSize: 18, textDecoration: 'none', fontWeight: 700 }}>←</a>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: '#1a1a2e' }}>🗺️ Tour de France — Fresque de l'IA</div>
          <div style={{ fontSize: 11, color: '#888' }}>Cliquez sur une région pour gérer l'équipe et la prospection</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#888' }}>
            <span>👥 {tdfAnims.length}</span>
            <span>🏢 {orgs.length}</span>
            <span style={{ color: '#2B7400' }}>✅ {orgs.filter(o => o.statut === 'accepte').length}</span>
          </div>
          {me?.is_admin && (
            <label style={{ display: 'flex', gap: 6, padding: '6px 12px', background: '#534AB7', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', alignItems: 'center' }}>
              {docUploading ? '⏳' : '+ Doc global'}
              <input ref={fileGlobalRef} type="file" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadDoc(e.target.files[0], true) }}/>
            </label>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
        {/* Colonne carte */}
        <div style={{ width: selected ? 420 : '100%', transition: 'width .3s', padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <FranceMap selected={selected} counts={orgCounts} onSelect={id => { setSelected(s => s === id ? null : id); setTab('equipe'); setExpandedOrg(null) }}/>
          <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#888' }}>
            <span>⬜ Sans activité</span>
            <span style={{ color: '#0C447C' }}>🔵 Organisations ({orgs.length})</span>
            <span style={{ color: '#534AB7' }}>🟣 Sélectionnée</span>
          </div>
          {!selected && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%', maxWidth: 420 }}>
              {[
                { icon: '👥', val: tdfAnims.length, label: 'Animateurs inscrits' },
                { icon: '🏢', val: orgs.length, label: 'Organisations' },
                { icon: '✅', val: orgs.filter(o => o.statut === 'accepte').length, label: 'Acceptées' },
              ].map(s => (
                <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: '12px', textAlign: 'center', border: '1px solid #E5E5E5' }}>
                  <div style={{ fontSize: 20 }}>{s.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: '#534AB7' }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: '#888', lineHeight: 1.3, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panneau région */}
        {selected && reg && (
          <div style={{ flex: 1, background: 'white', borderLeft: '1px solid #E5E5E5', display: 'flex', flexDirection: 'column', animation: 'slideIn .2s ease', minWidth: 0 }}>
            {/* En-tête panneau */}
            <div style={{ padding: '14px 18px 0', borderBottom: '1px solid #E5E5E5', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#1a1a2e' }}>{reg.nom}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{regAnims.length} animateur(s) · {regOrgs.length} organisation(s)</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
              <div style={{ display: 'flex' }}>
                {([['equipe', `👥 Équipe (${regAnims.length})`], ['crm', `🏢 Prospection (${regOrgs.length})`], ['docs', `📄 Docs (${regDocs.length})`]] as const).map(([t, label]) => (
                  <button key={t} className={`tdf-tab${tab === t ? ' act' : ''}`} onClick={() => setTab(t)}>{label}</button>
                ))}
              </div>
            </div>

            {/* Corps panneau */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>

              {/* ── ÉQUIPE ── */}
              {tab === 'equipe' && (
                <div>
                  {!isMember ? (
                    <div style={{ background: '#EEEDFE', borderRadius: 14, padding: '14px', marginBottom: 14 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#534AB7', marginBottom: 8 }}>Rejoindre cette région</div>
                      <input value={myRole} onChange={e => setMyRole(e.target.value)} placeholder="Rôle optionnel (Coordinateur, Contact local...)" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #AFA9EC', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }}/>
                      <button onClick={joinRegion} disabled={saving} style={{ padding: '8px 16px', background: '#534AB7', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        {saving ? '...' : "M'inscrire sur cette région"}
                      </button>
                    </div>
                  ) : (
                    <div style={{ background: '#E1F5EE', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#085041', fontWeight: 600 }}>✓ Vous êtes inscrit sur cette région</span>
                      <button onClick={leaveRegion} style={{ fontSize: 11, color: '#CC0000', background: 'none', border: 'none', cursor: 'pointer' }}>Se désinscrire</button>
                    </div>
                  )}
                  {regAnims.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#888', fontSize: 13, padding: 24 }}>Aucun animateur inscrit</div>
                  ) : regAnims.map(ta => {
                    const a = ta.animateur
                    const initials = a.nom.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
                    return (
                      <div key={ta.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', background: '#F8F8F8', borderRadius: 12, border: '0.5px solid #E5E5E5', marginBottom: 8 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EEEDFE', color: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0, overflow: 'hidden' }}>
                          {a.photo_url ? <img src={a.photo_url} alt={a.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : initials}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{a.nom}</div>
                          {ta.role && <div style={{ fontSize: 11, color: '#888' }}>{ta.role}</div>}
                        </div>
                        {a.is_admin && <span style={{ fontSize: 10, background: '#534AB7', color: 'white', padding: '2px 6px', borderRadius: 20, fontWeight: 700 }}>Admin</span>}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── CRM / PROSPECTION ── */}
              {tab === 'crm' && (
                <div>
                  {/* Compteurs statuts */}
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                    {Object.entries(STATUTS).map(([k, s]) => {
                      const n = regOrgs.filter(o => o.statut === k).length
                      return n > 0 ? (
                        <span key={k} style={{ padding: '3px 9px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 11, fontWeight: 600 }}>{s.label} {n}</span>
                      ) : null
                    })}
                  </div>

                  <button onClick={() => setShowOrgForm(v => !v)} style={{ width: '100%', padding: '9px', borderRadius: 10, border: '1.5px dashed #AFA9EC', background: showOrgForm ? '#EEEDFE' : 'white', color: '#534AB7', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 12 }}>
                    {showOrgForm ? '× Fermer' : '+ Ajouter une organisation'}
                  </button>

                  {showOrgForm && (
                    <div style={{ background: '#F8F9FF', borderRadius: 14, padding: '14px', border: '1.5px solid #AFA9EC', marginBottom: 14 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#534AB7', marginBottom: 3 }}>Nom *</div>
                          <input value={orgForm.nom} onChange={e => setOrgForm(f => ({ ...f, nom: e.target.value }))} placeholder="CHU Lyon, Renault..." style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E5E5E5', fontSize: 13, boxSizing: 'border-box' }}/>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 3 }}>Secteur</div>
                            <input value={orgForm.secteur} onChange={e => setOrgForm(f => ({ ...f, secteur: e.target.value }))} placeholder="Santé, Industrie..." style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E5E5E5', fontSize: 13, boxSizing: 'border-box' }}/>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 3 }}>Taille</div>
                            <select value={orgForm.taille} onChange={e => setOrgForm(f => ({ ...f, taille: e.target.value }))} style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E5E5E5', fontSize: 13 }}>
                              <option value="">—</option>
                              <option value="micro">&lt; 50</option>
                              <option value="pme">50–500</option>
                              <option value="eti">500–2000</option>
                              <option value="grand">&gt; 2000</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 3 }}>Référent</div>
                          <select value={orgForm.referent_id} onChange={e => setOrgForm(f => ({ ...f, referent_id: e.target.value }))} style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E5E5E5', fontSize: 13 }}>
                            <option value="">Non assigné</option>
                            {regAnims.map(ta => <option key={ta.animateur_id} value={ta.animateur_id}>{ta.animateur.nom}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 3 }}>Commentaire</div>
                          <textarea value={orgForm.commentaire} onChange={e => setOrgForm(f => ({ ...f, commentaire: e.target.value }))} rows={2} placeholder="Contexte, contact..." style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E5E5E5', fontSize: 13, resize: 'none', boxSizing: 'border-box' }}/>
                        </div>
                        <button onClick={addOrg} disabled={saving || !orgForm.nom.trim()} style={{ alignSelf: 'flex-start', padding: '7px 16px', background: orgForm.nom.trim() ? '#534AB7' : '#E5E5E5', color: orgForm.nom.trim() ? 'white' : '#aaa', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: orgForm.nom.trim() ? 'pointer' : 'default' }}>
                          {saving ? '...' : 'Ajouter →'}
                        </button>
                      </div>
                    </div>
                  )}

                  {regOrgs.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#888', fontSize: 13, padding: 24 }}>Aucune organisation pour cette région</div>
                  ) : regOrgs.map(org => {
                    const st = STATUTS[org.statut] || STATUTS.a_contacter
                    const orgEtapes = etapes.filter(e => e.organisation_id === org.id).sort((a, b) => a.etape - b.etape)
                    const isExp = expandedOrg === org.id
                    const canDelete = me?.is_admin || org.created_by === me?.id
                    return (
                      <div key={org.id} style={{ borderRadius: 14, border: `1.5px solid ${st.border}`, background: 'white', overflow: 'hidden', marginBottom: 10 }}>
                        <div style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{org.nom}</div>
                              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                                {org.secteur && <span style={{ fontSize: 10, background: '#F0F0F4', color: '#555', padding: '2px 7px', borderRadius: 20 }}>{org.secteur}</span>}
                                {org.referent && <span style={{ fontSize: 10, background: '#EEEDFE', color: '#534AB7', padding: '2px 7px', borderRadius: 20 }}>👤 {org.referent.nom}</span>}
                              </div>
                              {org.commentaire && <div style={{ fontSize: 11, color: '#888', marginTop: 4, lineHeight: 1.4 }}>{org.commentaire}</div>}
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                              <select value={org.statut} onChange={e => changeStatut(org.id, e.target.value)} style={{ padding: '3px 8px', borderRadius: 20, border: `1px solid ${st.border}`, background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                {Object.entries(STATUTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                              </select>
                              {canDelete && <button onClick={() => deleteOrg(org)} style={{ fontSize: 10, color: '#CC0000', background: 'none', border: 'none', cursor: 'pointer' }}>supprimer</button>}
                            </div>
                          </div>
                          <div style={{ marginTop: 10 }}>
                            {!org.prospection_active ? (
                              <button onClick={() => startProspection(org)} style={{ padding: '6px 12px', background: '#58CC02', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>🚀 Lancer la prospection</button>
                            ) : (
                              <button onClick={async () => { setExpandedOrg(isExp ? null : org.id); if (!isExp) { const { data } = await supabase.from('tdf_etapes').select('*').eq('organisation_id', org.id).order('etape'); if (data) setEtapes(prev => [...prev.filter(e => e.organisation_id !== org.id), ...data]) } }} style={{ padding: '6px 12px', background: '#E6F1FB', color: '#0C447C', border: '1px solid #85B7EB', borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                                {isExp ? '▲ Masquer' : `▼ Suivi (${orgEtapes.filter(e => e.statut === 'fait').length}/4)`}
                              </button>
                            )}
                          </div>
                        </div>
                        {isExp && org.prospection_active && (
                          <div style={{ borderTop: '1px solid #F0F0F0', background: '#FAFAFA', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {ETAPE_LABELS.map((label, i) => {
                              const etape = orgEtapes.find(e => e.etape === i + 1)
                              if (!etape) return <div key={i} style={{ fontSize: 11, color: '#aaa', padding: '6px 0' }}>{i + 1}. {label} — chargement...</div>
                              const late = daysLate(etape)
                              const done = etape.statut === 'fait'
                              return (
                                <div key={etape.id} style={{ padding: '10px 12px', background: done ? '#E1F5EE' : 'white', borderRadius: 10, border: `1.5px solid ${done ? '#5DCAA5' : late > 0 ? '#FF4B4B' : '#E5E5E5'}` }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: done ? 4 : 8 }}>
                                    <div style={{ fontWeight: 700, fontSize: 12, color: done ? '#085041' : '#1a1a2e' }}>{done ? '✓ ' : `${i + 1}. `}{label}</div>
                                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                                      {late > 0 && !done && <span style={{ fontSize: 9, background: '#FF4B4B', color: 'white', padding: '2px 6px', borderRadius: 20, fontWeight: 700 }}>{late}j retard</span>}
                                      {etape.due_at && <span style={{ fontSize: 9, color: '#888' }}>Prévu: {new Date(etape.due_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>}
                                    </div>
                                  </div>
                                  {done ? (
                                    <div style={{ fontSize: 10, color: '#085041' }}>Fait le {new Date(etape.fait_at!).toLocaleDateString('fr-FR')}{etape.notes ? ` · ${etape.notes}` : ''}</div>
                                  ) : (
                                    <div>
                                      <input value={etapeNotes[etape.id] || ''} onChange={e => setEtapeNotes(p => ({ ...p, [etape.id]: e.target.value }))} placeholder="Note optionnelle..." style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #E5E5E5', fontSize: 11, marginBottom: 6, boxSizing: 'border-box' }}/>
                                      <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => validateEtape(etape, 'fait')} style={{ padding: '5px 10px', background: '#58CC02', color: 'white', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>✓ Envoyé</button>
                                        <button onClick={() => validateEtape(etape, 'skip')} style={{ padding: '5px 10px', background: '#F0F0F0', color: '#888', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>Passer</button>
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

              {/* ── DOCUMENTS ── */}
              {tab === 'docs' && (
                <div>
                  {(isMember || me?.is_admin) && (
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', background: '#F8F9FF', border: '1.5px dashed #AFA9EC', borderRadius: 12, textAlign: 'center', cursor: 'pointer', marginBottom: 14, fontSize: 13, color: '#534AB7', fontWeight: 700, gap: 6 }}>
                      {docUploading ? '⏳ Upload...' : '+ Ajouter un document pour cette région'}
                      <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadDoc(e.target.files[0], false) }}/>
                    </label>
                  )}
                  {regDocs.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#888', fontSize: 13, padding: 24 }}>Aucun document disponible</div>
                  ) : regDocs.map(doc => (
                    <div key={doc.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', background: '#F8F8F8', borderRadius: 12, border: '0.5px solid #E5E5E5', marginBottom: 8 }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>
                        {/\.pdf$/i.test(doc.file_name) ? '📄' : /\.(doc|docx)$/i.test(doc.file_name) ? '📝' : /\.(xls|xlsx)$/i.test(doc.file_name) ? '📊' : /\.(jpg|jpeg|png|gif)$/i.test(doc.file_name) ? '🖼️' : '📁'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nom}</div>
                        <div style={{ fontSize: 10, color: '#888' }}>
                          {doc.is_global ? '🌍 Global' : '📍 Région'} · {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 10px', background: '#534AB7', color: 'white', borderRadius: 6, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>Ouvrir</a>
                        {(me?.is_admin || doc.uploaded_by === me?.id) && (
                          <button onClick={() => deleteDoc(doc)} style={{ padding: '5px 8px', background: 'none', border: '1px solid #FFDFE0', color: '#CC0000', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>×</button>
                        )}
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
