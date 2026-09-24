'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

type Animateur = { id: string, prenom: string, nom: string, photo_url: string | null, email: string }
type Evenement = {
  id: string, name: string, date_debut: string, date_fin: string | null,
  description: string | null, created_at: string, created_by: string | null,
  animateur?: Animateur | null,
  participants?: Animateur[]
}

export default function CRMEvenementsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [events, setEvents] = useState<Evenement[]>([])
  const [animateurs, setAnimateurs] = useState<Animateur[]>([])
  const [me, setMe] = useState<Animateur | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', date_debut: '', date_fin: '', description: '' })
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])

  useEffect(() => {
    Promise.all([
      supabase.auth.getUser(),
      supabase.from('animateurs').select('*').order('nom'),
    ]).then(async ([{ data: { user } }, { data: anis }]) => {
      const all = (anis || []) as Animateur[]
      setAnimateurs(all)
      if (user) {
        const myAni = all.find(a => a.id === user.id) || null
        setMe(myAni)
        if (myAni) setSelectedParticipants([myAni.id])
        const { data: adminData } = await supabase.from('animateurs').select('is_admin').eq('id', user.id).single()
        setIsAdmin(adminData?.is_admin || false)
      }
      await loadEvents(all)
      setLoading(false)
    })
  }, [])

  async function loadEvents(anis?: Animateur[]) {
    const list = anis || animateurs
    const { data } = await supabase.from('crm_evenements').select('*').order('date_debut', { ascending: false })
    const { data: parts } = await supabase.from('crm_evenement_animateurs').select('*')
    const enriched = (data || []).map(ev => ({
      ...ev,
      animateur: list.find(a => a.id === ev.created_by) || null,
      participants: (parts || []).filter(p => p.evenement_id === ev.id).map(p => list.find(a => a.id === p.animateur_id)).filter(Boolean) as Animateur[]
    }))
    setEvents(enriched)
  }

  function toggleParticipant(id: string) {
    setSelectedParticipants(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.date_debut || !me) return
    setSaving(true)
    const { data, error } = await supabase.from('crm_evenements').insert({
      name: form.name.trim(),
      date_debut: form.date_debut,
      date_fin: form.date_fin || null,
      description: form.description || null,
      created_by: me.id,
    }).select().single()

    if (!error && data) {
      // Add participants
      const partRows = selectedParticipants.map(id => ({ evenement_id: data.id, animateur_id: id }))
      await supabase.from('crm_evenement_animateurs').insert(partRows)

      // Build mailto for other participants
      const others = animateurs.filter(a => selectedParticipants.includes(a.id) && a.id !== me.id)
      if (others.length > 0) {
        const emails = others.map(a => a.email).join(',')
        const subject = encodeURIComponent(`[Fresque IA] Espace événement : ${form.name}`)
        const body = encodeURIComponent(`Bonjour,\n\n${me.prenom} ${me.nom} vous invite à rejoindre l'espace événement "${form.name}" (${form.date_debut}${form.date_fin ? ' → ' + form.date_fin : ''}).\n\nConnectez-vous sur fresque-ia-animateurs.fr/crm/evenements/${data.id} pour y accéder.\n\nBonne animation !\n${me.prenom}`)
        window.open(`mailto:${emails}?subject=${subject}&body=${body}`)
      }

      setSaving(false)
      setShowModal(false)
      setForm({ name: '', date_debut: '', date_fin: '', description: '' })
      router.push(`/crm/evenements/${data.id}`)
    } else {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 15, color: '#888' }}>Chargement…</div>

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} @keyframes popIn{0%{transform:scale(0.85);opacity:0}100%{transform:scale(1);opacity:1}}`}</style>

      {/* HEADER */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E5E5', padding: '0 16px', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/crm" style={{ color: '#888', textDecoration: 'none', fontSize: 20 }}>←</Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🗓</span>
              <span style={{ fontWeight: 900, fontSize: 17, color: '#1a1a2e' }}>Espaces événements</span>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} style={{ padding: '8px 16px', borderRadius: 10, background: '#1a1a2e', color: 'white', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + Nouvel événement
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px' }}>
        {events.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗓</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Aucun espace événement</div>
            <div style={{ fontSize: 13 }}>Créez votre premier espace pour coordonner la prospection lors d'un événement.</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {events.map(ev => (
            <div key={ev.id} onClick={() => router.push(`/crm/evenements/${ev.id}`)} style={{ background: 'white', borderRadius: 16, border: '1.5px solid #E5E5E5', padding: '16px 18px', cursor: 'pointer', transition: 'all .2s', animation: 'fadeIn .3s ease' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#1a1a2e', marginBottom: 4 }}>{ev.name}</div>
                  <div style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
                    {new Date(ev.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {ev.date_fin && ev.date_fin !== ev.date_debut && ` → ${new Date(ev.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                  </div>
                  {ev.description && <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{ev.description}</div>}
                </div>
                <span style={{ fontSize: 22, flexShrink: 0 }}>→</span>
              </div>
              {/* Participants */}
              {ev.participants && ev.participants.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <div style={{ display: 'flex', marginRight: 4 }}>
                    {ev.participants.slice(0, 5).map((p, i) => (
                      <div key={p.id} title={`${p.prenom} ${p.nom}`} style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', border: '2px solid white', marginLeft: i > 0 ? -8 : 0, background: '#E5E5E5' }}>
                        {p.photo_url ? <img src={p.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 11 }}>👤</span>}
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: '#888' }}>{ev.participants.length} animateur{ev.participants.length > 1 ? 's' : ''}</span>
                  {ev.animateur && <span style={{ fontSize: 12, color: '#888', marginLeft: 4 }}>· créé par {ev.animateur.prenom} {ev.animateur.nom}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MODAL CREATION */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', animation: 'popIn .25s ease' }}>
            <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Nouvel espace événement</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Nom de l'événement *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex : Forum IA Paris 2025, Salon de l'Industrie…" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Date de début *</label>
                  <input type="date" value={form.date_debut} onChange={e => setForm({ ...form, date_debut: e.target.value })} style={{ width: '100%', padding: '10px 10px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Date de fin <span style={{ fontWeight: 400, color: '#888' }}>(optionnel)</span></label>
                  <input type="date" value={form.date_fin} onChange={e => setForm({ ...form, date_fin: e.target.value })} style={{ width: '100%', padding: '10px 10px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Description <span style={{ fontWeight: 400, color: '#888' }}>(optionnel)</span></label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Précisions sur l'événement, objectifs, contexte…" rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, boxSizing: 'border-box', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Animateurs participants</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto', padding: '4px 0' }}>
                  {animateurs.map(a => (
                    <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: selectedParticipants.includes(a.id) ? '#E6F1FB' : '#F8F8F8', cursor: 'pointer', transition: 'background .15s' }}>
                      <input type="checkbox" checked={selectedParticipants.includes(a.id)} onChange={() => toggleParticipant(a.id)} style={{ accentColor: '#1a1a2e' }} />
                      <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', background: '#E5E5E5', flexShrink: 0 }}>
                        {a.photo_url ? <img src={a.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 12 }}>👤</span>}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{a.prenom} {a.nom}</span>
                      {a.id === me?.id && <span style={{ fontSize: 11, color: '#888', marginLeft: 'auto' }}>vous</span>}
                    </label>
                  ))}
                </div>
                {selectedParticipants.length > 1 && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: '#E6F1FB', borderRadius: 8, fontSize: 12, color: '#0C447C' }}>
                    Un email sera ouvert pour notifier les {selectedParticipants.length - 1} autre{selectedParticipants.length > 2 ? 's' : ''} animateur{selectedParticipants.length > 2 ? 's' : ''}.
                  </div>
                )}
              </div>

              <button onClick={handleCreate} disabled={!form.name.trim() || !form.date_debut || saving} style={{ padding: '14px', borderRadius: 14, background: form.name.trim() && form.date_debut ? '#1a1a2e' : '#E5E5E5', color: form.name.trim() && form.date_debut ? 'white' : '#888', border: 'none', fontWeight: 800, fontSize: 15, cursor: form.name.trim() && form.date_debut ? 'pointer' : 'default', marginTop: 4 }}>
                {saving ? 'Création…' : 'Créer l\'espace événement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
