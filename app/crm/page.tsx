'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const SECTEURS = ['Santé','Energie','Recherche','Transport','Finance','Industrie','Education','Numérique','Retail','Immobilier','Agriculture','Autre']
const REGIONS = ['Île-de-France','Auvergne-Rhône-Alpes','Provence-Alpes-Côte d\'Azur','Occitanie','Bretagne','Grand Est','Hauts-de-France','Normandie','Nouvelle-Aquitaine','Pays de la Loire','Centre-Val de Loire','Bourgogne-Franche-Comté','Europe','International']
const SIZES = [
  { key: 'micro', label: '< 50 salariés', short: 'Micro' },
  { key: 'pme', label: '50 – 500 salariés', short: 'PME' },
  { key: 'eti', label: '500 – 2000 salariés', short: 'ETI' },
  { key: 'grand_groupe', label: '> 2000 salariés', short: 'Grand groupe' },
]
const STATUS_COLORS: Record<string, { bg: string, color: string, label: string }> = {
  client:        { bg: '#D7FFB8', color: '#2B7400', label: 'Client ✓' },
  prospect_chaud:{ bg: '#FFDFE0', color: '#CC0000', label: 'Prospect chaud 🔥' },
}

type Animateur = { id: string, prenom: string, nom: string, photo_url: string | null, email: string }
type CRMClient = {
  id: string, name: string, logo_url: string | null, size: string | null,
  secteur: string | null, region: string | null, tags: string[], status: string,
  created_at: string, created_by: string | null,
  animateur?: Animateur | null
}

export default function CRMPage() {
  const supabase = createClient()
  const router = useRouter()
  const [clients, setClients] = useState<CRMClient[]>([])
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<Animateur | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [animateurs, setAnimateurs] = useState<Animateur[]>([])

  // Filters
  const [search, setSearch] = useState('')
  const [filterSize, setFilterSize] = useState('')
  const [filterSecteur, setFilterSecteur] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Modal creation
  const [showModal, setShowModal] = useState(false)
  const [showStatusPopup, setShowStatusPopup] = useState(false)
  const [newClientId, setNewClientId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', size: '', secteur: '', region: '', tags: '', logo_url: '' })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      supabase.auth.getUser(),
      supabase.from('animateurs').select('*'),
    ]).then(async ([{ data: { user } }, { data: anis }]) => {
      const all = (anis || []) as Animateur[]
      setAnimateurs(all)
      if (user) {
        const me = all.find(a => a.id === user.id) || null
        setMe(me)
        const { data: adminData } = await supabase.from('animateurs').select('is_admin').eq('id', user.id).single()
        setIsAdmin(adminData?.is_admin || false)
      }
      await loadClients(all)
      setLoading(false)
    })
  }, [])

  async function loadClients(anis?: Animateur[]) {
    const list = anis || animateurs
    const { data } = await supabase.from('crm_clients').select('*').order('created_at', { ascending: false })
    const enriched = (data || []).map(c => ({
      ...c,
      animateur: list.find(a => a.id === c.created_by) || null
    }))
    setClients(enriched)
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleCreate() {
    if (!form.name.trim() || !me) return
    setSaving(true)
    let logo_url = form.logo_url || null
    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const path = `logos/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('crm-logos').upload(path, logoFile, { upsert: true })
      if (!error) {
        const { data: urlData } = supabase.storage.from('crm-logos').getPublicUrl(path)
        logo_url = urlData.publicUrl
      }
    }
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    const { data, error } = await supabase.from('crm_clients').insert({
      name: form.name.trim(), logo_url, size: form.size || null,
      secteur: form.secteur || null, region: form.region || null,
      tags, status: 'prospect_chaud', created_by: me.id,
    }).select().single()
    setSaving(false)
    if (!error && data) {
      setNewClientId(data.id)
      setShowModal(false)
      setShowStatusPopup(true)
      setForm({ name: '', size: '', secteur: '', region: '', tags: '', logo_url: '' })
      setLogoFile(null); setLogoPreview('')
    }
  }

  async function setClientStatus(status: string) {
    if (!newClientId) return
    await supabase.from('crm_clients').update({ status }).eq('id', newClientId)
    setShowStatusPopup(false)
    setNewClientId(null)
    await loadClients()
  }

  async function deleteClient(id: string) {
    if (!confirm('Supprimer ce client ?')) return
    await supabase.from('crm_clients').delete().eq('id', id)
    setClients(c => c.filter(x => x.id !== id))
  }

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.name.toLowerCase().includes(q) ||
      (c.tags || []).some(t => t.toLowerCase().includes(q)) ||
      (c.secteur || '').toLowerCase().includes(q)
    const matchSize = !filterSize || c.size === filterSize
    const matchSecteur = !filterSecteur || c.secteur === filterSecteur
    const matchStatus = !filterStatus || c.status === filterStatus
    return matchSearch && matchSize && matchSecteur && matchStatus
  })

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 15, color: '#888' }}>Chargement…</div>

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7' }}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popIn{0%{transform:scale(0.85);opacity:0}100%{transform:scale(1);opacity:1}}
        .client-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.12)!important}
        .filter-btn{padding:7px 14px;borderRadius:20px;border:1.5px solid #E5E5E5;background:white;fontSize:13px;cursor:pointer;fontWeight:500;transition:all .15s}
        .filter-btn.active{background:#1a1a2e;color:white;border-color:#1a1a2e;fontWeight:700}
      `}</style>

      {/* HEADER */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E5E5', padding: '0 16px', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/" style={{ color: '#888', textDecoration: 'none', fontSize: 20 }}>←</Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🤝</span>
              <span style={{ fontWeight: 900, fontSize: 17, color: '#1a1a2e' }}>CRM</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/crm/evenements" style={{ padding: '8px 14px', borderRadius: 10, background: '#F0F0F4', color: '#1a1a2e', textDecoration: 'none', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
              🗓 Événements
            </Link>
            <button onClick={() => setShowModal(true)} style={{ padding: '8px 16px', borderRadius: 10, background: '#1a1a2e', color: 'white', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              + Nouveau client
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>
        {/* SEARCH */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#888' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, secteur, tags…"
            style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: 12, border: '1.5px solid #E5E5E5', fontSize: 14, background: 'white', boxSizing: 'border-box', outline: 'none' }} />
        </div>

        {/* FILTERS */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <button className={`filter-btn ${filterStatus === '' ? 'active' : ''}`} onClick={() => setFilterStatus('')}>Tous</button>
          <button className={`filter-btn ${filterStatus === 'client' ? 'active' : ''}`} onClick={() => setFilterStatus(filterStatus === 'client' ? '' : 'client')} style={{ borderColor: '#58CC02', color: filterStatus === 'client' ? 'white' : '#2B7400', background: filterStatus === 'client' ? '#58CC02' : '#D7FFB8' }}>Client ✓</button>
          <button className={`filter-btn ${filterStatus === 'prospect_chaud' ? 'active' : ''}`} onClick={() => setFilterStatus(filterStatus === 'prospect_chaud' ? '' : 'prospect_chaud')} style={{ borderColor: '#FF4B4B', color: filterStatus === 'prospect_chaud' ? 'white' : '#CC0000', background: filterStatus === 'prospect_chaud' ? '#FF4B4B' : '#FFDFE0' }}>Prospect chaud 🔥</button>
          <div style={{ width: 1, background: '#E5E5E5', margin: '0 4px' }} />
          {SIZES.map(s => (
            <button key={s.key} className={`filter-btn ${filterSize === s.key ? 'active' : ''}`} onClick={() => setFilterSize(filterSize === s.key ? '' : s.key)}>{s.short}</button>
          ))}
          <div style={{ width: 1, background: '#E5E5E5', margin: '0 4px' }} />
          <select value={filterSecteur} onChange={e => setFilterSecteur(e.target.value)} style={{ padding: '7px 12px', borderRadius: 20, border: '1.5px solid #E5E5E5', fontSize: 13, cursor: 'pointer', background: filterSecteur ? '#1a1a2e' : 'white', color: filterSecteur ? 'white' : '#1a1a2e' }}>
            <option value="">Tous secteurs</option>
            {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* COUNT */}
        <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
          {filtered.length} client{filtered.length !== 1 ? 's' : ''} {search || filterSize || filterSecteur || filterStatus ? '(filtrés)' : 'au total'}
        </div>

        {/* GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {filtered.map(client => {
            const s = STATUS_COLORS[client.status] || STATUS_COLORS.prospect_chaud
            const sz = SIZES.find(x => x.key === client.size)
            const canEdit = isAdmin || client.created_by === me?.id
            return (
              <div key={client.id} className="client-card" style={{ background: 'white', borderRadius: 16, border: '1.5px solid #E5E5E5', overflow: 'hidden', transition: 'all .2s', animation: 'fadeIn .3s ease', cursor: 'pointer' }}>
                {/* Status bar */}
                <div style={{ height: 4, background: client.status === 'client' ? '#58CC02' : '#FF4B4B' }} />
                <div style={{ padding: '16px 16px 12px' }}>
                  {/* Logo + name */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, border: '1.5px solid #E5E5E5', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F8F8', flexShrink: 0, overflow: 'hidden' }}>
                      {client.logo_url ? <img src={client.logo_url} alt={client.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 24 }}>🏢</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#1a1a2e', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</div>
                      <div style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, background: s.bg, color: s.color, fontSize: 11, fontWeight: 700 }}>{s.label}</div>
                    </div>
                  </div>
                  {/* Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                    {sz && <span style={{ padding: '3px 9px', borderRadius: 20, background: '#E6F1FB', color: '#0C447C', fontSize: 11, fontWeight: 600 }}>{sz.short}</span>}
                    {client.secteur && <span style={{ padding: '3px 9px', borderRadius: 20, background: '#EEEDFE', color: '#3C3489', fontSize: 11, fontWeight: 600 }}>{client.secteur}</span>}
                    {client.region && <span style={{ padding: '3px 9px', borderRadius: 20, background: '#F0F0F4', color: '#555', fontSize: 11 }}>{client.region}</span>}
                    {(client.tags || []).slice(0, 2).map(t => <span key={t} style={{ padding: '3px 9px', borderRadius: 20, background: '#FFF9E6', color: '#8B5E00', fontSize: 11 }}>#{t}</span>)}
                  </div>
                  {/* Creator */}
                  {client.animateur && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#F8F8F8', borderRadius: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#E5E5E5' }}>
                        {client.animateur.photo_url ? <img src={client.animateur.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 12 }}>👤</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.animateur.prenom} {client.animateur.nom}</div>
                        <div style={{ fontSize: 10, color: '#888' }}>{new Date(client.created_at).toLocaleDateString('fr-FR')}</div>
                      </div>
                      <a href={`mailto:${client.animateur.email}`} style={{ fontSize: 14, textDecoration: 'none' }} title={client.animateur.email} onClick={e => e.stopPropagation()}>✉️</a>
                    </div>
                  )}
                </div>
                {/* Actions */}
                {canEdit && (
                  <div style={{ borderTop: '1px solid #F0F0F0', padding: '8px 12px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button onClick={() => router.push(`/crm/clients/${client.id}`)} style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid #E5E5E5', background: 'white', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Modifier</button>
                    <button onClick={() => deleteClient(client.id)} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: '#FFDFE0', color: '#CC0000', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Supprimer</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Aucun client trouvé</div>
            <div style={{ fontSize: 13 }}>{clients.length === 0 ? 'Ajoutez votre premier client !' : 'Essayez de modifier vos filtres.'}</div>
          </div>
        )}
      </div>

      {/* MODAL CREATION */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', animation: 'popIn .25s ease' }}>
            <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Nouveau client</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Logo upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div onClick={() => fileRef.current?.click()} style={{ width: 72, height: 72, borderRadius: 14, border: '2px dashed #E5E5E5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0, background: '#F8F8F8' }}>
                  {logoPreview ? <img src={logoPreview} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 28 }}>🏢</span>}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Logo de l'entreprise</div>
                  <button onClick={() => fileRef.current?.click()} style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #E5E5E5', background: 'white', fontSize: 12, cursor: 'pointer' }}>Choisir une image</button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Nom de l'entreprise *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex : Renault, AXA, CHU Lyon…" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Taille</label>
                  <select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} style={{ width: '100%', padding: '10px 10px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, boxSizing: 'border-box' }}>
                    <option value="">Sélectionner</option>
                    {SIZES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Secteur</label>
                  <select value={form.secteur} onChange={e => setForm({ ...form, secteur: e.target.value })} style={{ width: '100%', padding: '10px 10px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, boxSizing: 'border-box' }}>
                    <option value="">Sélectionner</option>
                    {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Région</label>
                <select value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, boxSizing: 'border-box' }}>
                  <option value="">Sélectionner</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Tags <span style={{ fontWeight: 400, color: '#888' }}>(séparés par des virgules)</span></label>
                <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="Ex : innovation, RH, durabilité…" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
              </div>

              <button onClick={handleCreate} disabled={!form.name.trim() || saving} style={{ padding: '14px', borderRadius: 14, background: form.name.trim() ? '#1a1a2e' : '#E5E5E5', color: form.name.trim() ? 'white' : '#888', border: 'none', fontWeight: 800, fontSize: 15, cursor: form.name.trim() ? 'pointer' : 'default', marginTop: 4 }}>
                {saving ? 'Enregistrement…' : 'Créer le client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP STATUS */}
      {showStatusPopup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: '32px 24px', maxWidth: 380, width: '100%', textAlign: 'center', animation: 'popIn .3s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Quel est le statut de ce client ?</h3>
            <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 24 }}>Cette information permet à toute la communauté de savoir où en est la relation.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => setClientStatus('client')} style={{ padding: '16px', borderRadius: 14, background: '#D7FFB8', border: '2px solid #58CC02', color: '#2B7400', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                ✅ Fresque déjà réalisée — Client
              </button>
              <button onClick={() => setClientStatus('prospect_chaud')} style={{ padding: '16px', borderRadius: 14, background: '#FFDFE0', border: '2px solid #FF4B4B', color: '#CC0000', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                🔥 Prospect chaud — En cours
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
