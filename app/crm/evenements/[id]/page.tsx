'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const SECTEURS = ['Santé','Energie','Recherche','Transport','Finance','Industrie','Education','Numérique','Retail','Immobilier','Agriculture','Autre']
const REGIONS = ['Île-de-France','Auvergne-Rhône-Alpes','Provence-Alpes-Côte d\'Azur','Occitanie','Bretagne','Grand Est','Hauts-de-France','Normandie','Nouvelle-Aquitaine','Pays de la Loire','Centre-Val de Loire','Bourgogne-Franche-Comté','Europe','International']
const SIZES = [
  { key: 'micro', label: '< 50', short: 'Micro' },
  { key: 'pme', label: '50 – 500', short: 'PME' },
  { key: 'eti', label: '500 – 2000', short: 'ETI' },
  { key: 'grand_groupe', label: '> 2000', short: 'Grand gr.' },
]

type Animateur = { id: string, prenom: string, nom: string, photo_url: string | null, email: string }
type Contact = { id: string, name: string, email: string | null, phone: string | null, role_poste: string | null, added_by: string | null, created_at: string, animateur?: Animateur | null }
type Entreprise = { id: string, name: string, secteur: string | null, region: string | null, size: string | null, notes: string | null, added_by: string | null, created_at: string, animateur?: Animateur | null, contacts: Contact[] }
type Evenement = { id: string, name: string, date_debut: string, date_fin: string | null, description: string | null, created_by: string | null }

export default function CRMEvenementDetailPage() {
  const { id } = useParams()
  const supabase = createClient()
  const [event, setEvent] = useState<Evenement | null>(null)
  const [entreprises, setEntreprises] = useState<Entreprise[]>([])
  const [participants, setParticipants] = useState<Animateur[]>([])
  const [animateurs, setAnimateurs] = useState<Animateur[]>([])
  const [me, setMe] = useState<Animateur | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Modals
  const [showAddEntreprise, setShowAddEntreprise] = useState(false)
  const [showAddContact, setShowAddContact] = useState<string | null>(null) // entreprise_id
  const [savingEnt, setSavingEnt] = useState(false)
  const [savingContact, setSavingContact] = useState(false)

  // Forms
  const [entForm, setEntForm] = useState({ name: '', secteur: '', region: '', size: '', notes: '' })
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', role_poste: '' })

  useEffect(() => {
    Promise.all([
      supabase.auth.getUser(),
      supabase.from('animateurs').select('*'),
      supabase.from('crm_evenements').select('*').eq('id', id as string).single(),
      supabase.from('crm_evenement_animateurs').select('animateur_id').eq('evenement_id', id as string),
      supabase.from('crm_evenement_entreprises').select('*').eq('evenement_id', id as string).order('created_at'),
      supabase.from('crm_evenement_contacts').select('*').order('created_at'),
    ]).then(async ([{ data: { user } }, { data: anis }, { data: ev }, { data: parts }, { data: ents }, { data: contacts }]) => {
      const all = (anis || []) as Animateur[]
      setAnimateurs(all)
      setEvent(ev)
      if (user) {
        const myAni = all.find(a => a.id === user.id) || null
        setMe(myAni)
        const { data: adminData } = await supabase.from('animateurs').select('is_admin').eq('id', user.id).single()
        setIsAdmin(adminData?.is_admin || false)
      }
      const partIds = (parts || []).map((p: { animateur_id: string }) => p.animateur_id)
      setParticipants(all.filter(a => partIds.includes(a.id)))

      const enrichedEnts: Entreprise[] = (ents || []).map(ent => ({
        ...ent,
        animateur: all.find(a => a.id === ent.added_by) || null,
        contacts: (contacts || [])
          .filter((c: { entreprise_id: string }) => c.entreprise_id === ent.id)
          .map((c: Contact & { added_by: string | null }) => ({ ...c, animateur: all.find(a => a.id === c.added_by) || null }))
      }))
      setEntreprises(enrichedEnts)
      setLoading(false)
    })
  }, [id])

  async function addEntreprise() {
    if (!entForm.name.trim() || !me) return
    setSavingEnt(true)
    const { data, error } = await supabase.from('crm_evenement_entreprises').insert({
      evenement_id: id as string,
      name: entForm.name.trim(),
      secteur: entForm.secteur || null,
      region: entForm.region || null,
      size: entForm.size || null,
      notes: entForm.notes || null,
      added_by: me.id,
    }).select().single()
    setSavingEnt(false)
    if (!error && data) {
      setEntreprises(prev => [...prev, { ...data, animateur: me, contacts: [] }])
      setEntForm({ name: '', secteur: '', region: '', size: '', notes: '' })
      setShowAddEntreprise(false)
    }
  }

  async function addContact(entreprise_id: string) {
    if (!contactForm.name.trim() || !me) return
    setSavingContact(true)
    const { data, error } = await supabase.from('crm_evenement_contacts').insert({
      entreprise_id,
      name: contactForm.name.trim(),
      email: contactForm.email || null,
      phone: contactForm.phone || null,
      role_poste: contactForm.role_poste || null,
      added_by: me.id,
    }).select().single()
    setSavingContact(false)
    if (!error && data) {
      setEntreprises(prev => prev.map(e => e.id === entreprise_id
        ? { ...e, contacts: [...e.contacts, { ...data, animateur: me }] }
        : e
      ))
      setContactForm({ name: '', email: '', phone: '', role_poste: '' })
      setShowAddContact(null)
    }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 15, color: '#888' }}>Chargement…</div>
  if (!event) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Événement introuvable</div>

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} @keyframes popIn{0%{transform:scale(0.85);opacity:0}100%{transform:scale(1);opacity:1}}`}</style>

      {/* HEADER */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E5E5', padding: '0 16px', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/crm/evenements" style={{ color: '#888', textDecoration: 'none', fontSize: 20 }}>←</Link>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16, color: '#1a1a2e', lineHeight: 1.2 }}>{event.name}</div>
              <div style={{ fontSize: 12, color: '#888' }}>
                {new Date(event.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {event.date_fin && event.date_fin !== event.date_debut && ` → ${new Date(event.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
              </div>
            </div>
          </div>
          <button onClick={() => setShowAddEntreprise(true)} style={{ padding: '8px 14px', borderRadius: 10, background: '#1a1a2e', color: 'white', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + Entreprise
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 16px' }}>
        {/* Description + participants */}
        <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #E5E5E5', padding: '16px 18px', marginBottom: 20 }}>
          {event.description && <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 14, margin: '0 0 14px' }}>{event.description}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#888' }}>Animateurs :</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {participants.map(p => (
                <div key={p.id} title={`${p.prenom} ${p.nom}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#F0F0F4', borderRadius: 20 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', background: '#E5E5E5', flexShrink: 0 }}>
                    {p.photo_url ? <img src={p.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 10 }}>👤</span>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{p.prenom}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[['🏢', entreprises.length.toString(), 'entreprises'], ['👤', entreprises.reduce((a, e) => a + e.contacts.length, 0).toString(), 'contacts'], ['👥', participants.length.toString(), 'animateurs']].map(([icon, val, label]) => (
            <div key={label} style={{ background: 'white', borderRadius: 12, padding: '14px', textAlign: 'center', border: '1.5px solid #E5E5E5' }}>
              <div style={{ fontSize: 22 }}>{icon}</div>
              <div style={{ fontWeight: 900, fontSize: 24, color: '#1a1a2e', marginTop: 4 }}>{val}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ENTREPRISES LIST */}
        {entreprises.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888', background: 'white', borderRadius: 16, border: '1.5px solid #E5E5E5' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🏢</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Aucune entreprise encore</div>
            <div style={{ fontSize: 13 }}>Ajoutez les entreprises que vous contactez lors de cet événement.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {entreprises.map(ent => {
              const sz = SIZES.find(s => s.key === ent.size)
              return (
                <div key={ent.id} style={{ background: 'white', borderRadius: 16, border: '1.5px solid #E5E5E5', overflow: 'hidden', animation: 'fadeIn .3s ease' }}>
                  {/* Entreprise header */}
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: '#1a1a2e', marginBottom: 6 }}>🏢 {ent.name}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {sz && <span style={{ padding: '2px 8px', borderRadius: 20, background: '#E6F1FB', color: '#0C447C', fontSize: 11, fontWeight: 600 }}>{sz.short}</span>}
                        {ent.secteur && <span style={{ padding: '2px 8px', borderRadius: 20, background: '#EEEDFE', color: '#3C3489', fontSize: 11, fontWeight: 600 }}>{ent.secteur}</span>}
                        {ent.region && <span style={{ padding: '2px 8px', borderRadius: 20, background: '#F0F0F4', color: '#555', fontSize: 11 }}>{ent.region}</span>}
                      </div>
                      {ent.notes && <div style={{ fontSize: 12, color: '#888', marginTop: 6, lineHeight: 1.5 }}>{ent.notes}</div>}
                    </div>
                    {ent.animateur && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', background: '#E5E5E5' }}>
                          {ent.animateur.photo_url ? <img src={ent.animateur.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 11 }}>👤</span>}
                        </div>
                        <div style={{ fontSize: 11, color: '#888' }}>{ent.animateur.prenom}<br />{new Date(ent.created_at).toLocaleDateString('fr-FR')}</div>
                      </div>
                    )}
                  </div>

                  {/* Contacts */}
                  <div style={{ padding: '12px 16px' }}>
                    {ent.contacts.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        {ent.contacts.map(c => (
                          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#F8F8F8', borderRadius: 10, marginBottom: 6 }}>
                            {c.animateur && (
                              <div title={`Ajouté par ${c.animateur.prenom} ${c.animateur.nom}`} style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', background: '#E5E5E5', flexShrink: 0 }}>
                                {c.animateur.photo_url ? <img src={c.animateur.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 10 }}>👤</span>}
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>{c.name}</div>
                              {c.role_poste && <div style={{ fontSize: 11, color: '#888' }}>{c.role_poste}</div>}
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                              {c.email && <a href={`mailto:${c.email}`} style={{ fontSize: 14, textDecoration: 'none' }} title={c.email}>✉️</a>}
                              {c.phone && <a href={`tel:${c.phone}`} style={{ fontSize: 14, textDecoration: 'none' }} title={c.phone}>📞</a>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setShowAddContact(ent.id)} style={{ width: '100%', padding: '8px', borderRadius: 10, border: '1.5px dashed #E5E5E5', background: 'transparent', fontSize: 13, color: '#888', cursor: 'pointer', fontWeight: 600 }}>
                      + Ajouter un contact
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL ENTREPRISE */}
      {showAddEntreprise && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', animation: 'popIn .25s ease' }}>
            <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 17, fontWeight: 900, margin: 0 }}>Ajouter une entreprise</h2>
              <button onClick={() => setShowAddEntreprise(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>Nom de l'entreprise *</label>
                <input value={entForm.name} onChange={e => setEntForm({ ...entForm, name: e.target.value })} placeholder="Ex : EDF, Sanofi, SNCF…" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>Secteur</label>
                  <select value={entForm.secteur} onChange={e => setEntForm({ ...entForm, secteur: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, boxSizing: 'border-box' }}>
                    <option value="">Sélectionner</option>
                    {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>Taille</label>
                  <select value={entForm.size} onChange={e => setEntForm({ ...entForm, size: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, boxSizing: 'border-box' }}>
                    <option value="">Sélectionner</option>
                    {SIZES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>Région</label>
                <select value={entForm.region} onChange={e => setEntForm({ ...entForm, region: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, boxSizing: 'border-box' }}>
                  <option value="">Sélectionner</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>Notes</label>
                <textarea value={entForm.notes} onChange={e => setEntForm({ ...entForm, notes: e.target.value })} placeholder="Observations, niveau d'intérêt, prochaine étape…" rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }} />
              </div>
              <button onClick={addEntreprise} disabled={!entForm.name.trim() || savingEnt} style={{ padding: '13px', borderRadius: 12, background: entForm.name.trim() ? '#1a1a2e' : '#E5E5E5', color: entForm.name.trim() ? 'white' : '#888', border: 'none', fontWeight: 800, fontSize: 14, cursor: entForm.name.trim() ? 'pointer' : 'default' }}>
                {savingEnt ? 'Ajout…' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONTACT */}
      {showAddContact && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 420, animation: 'popIn .25s ease' }}>
            <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 17, fontWeight: 900, margin: 0 }}>Ajouter un contact</h2>
              <button onClick={() => setShowAddContact(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>Nom *</label>
                <input value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} placeholder="Prénom Nom" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>Poste</label>
                <input value={contactForm.role_poste} onChange={e => setContactForm({ ...contactForm, role_poste: e.target.value })} placeholder="Ex : DRH, RSI, Directeur Innovation…" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>Email</label>
                  <input type="email" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} placeholder="email@..." style={{ width: '100%', padding: '10px 10px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>Téléphone</label>
                  <input type="tel" value={contactForm.phone} onChange={e => setContactForm({ ...contactForm, phone: e.target.value })} placeholder="06…" style={{ width: '100%', padding: '10px 10px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
                </div>
              </div>
              {me && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#F8F8F8', borderRadius: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', overflow: 'hidden', background: '#E5E5E5', flexShrink: 0 }}>
                    {me.photo_url ? <img src={me.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 10 }}>👤</span>}
                  </div>
                  <span style={{ fontSize: 12, color: '#555' }}>Ajouté par <strong>{me.prenom} {me.nom}</strong></span>
                </div>
              )}
              <button onClick={() => addContact(showAddContact)} disabled={!contactForm.name.trim() || savingContact} style={{ padding: '13px', borderRadius: 12, background: contactForm.name.trim() ? '#1a1a2e' : '#E5E5E5', color: contactForm.name.trim() ? 'white' : '#888', border: 'none', fontWeight: 800, fontSize: 14, cursor: contactForm.name.trim() ? 'pointer' : 'default' }}>
                {savingContact ? 'Ajout…' : 'Ajouter le contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
