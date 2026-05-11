'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Animateur } from '@/lib/types'

interface Intervention {
  id: string
  animateur_id: string
  lieu: string
  date: string
  heure: string
  entreprise?: string
  nb_participants?: number
  cherche_observateurs: boolean
  nb_observateurs: number
  cherche_coanimateur: boolean
  nb_coanimateurs: number
  statut: 'ouvert' | 'complet' | 'annule'
  created_at: string
  animateur?: Animateur
  candidatures?: Candidature[]
}

interface Candidature {
  id: string
  intervention_id: string
  animateur_id: string
  role: 'observateur' | 'coanimateur'
  statut: 'en_attente' | 'accepte' | 'refuse'
  animateur?: Animateur
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const start = firstDay === 0 ? 6 : firstDay - 1
  return { start, daysInMonth }
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

export default function AgendaPage() {
  const [me, setMe] = useState<Animateur | null>(null)
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)
  const [today] = useState(new Date())
  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(new Date().getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null)
  const [candidaterModal, setCandidaterModal] = useState<Intervention | null>(null)
  const [candidaterRole, setCandidaterRole] = useState<'observateur' | 'coanimateur'>('observateur')
  const [editMode, setEditMode] = useState(false)
  const supabase = createClient()

  const [fLieu, setFLieu] = useState('')
  const [fDate, setFDate] = useState('')
  const [fHeure, setFHeure] = useState('')
  const [fEntreprise, setFEntreprise] = useState('')
  const [fNbParticipants, setFNbParticipants] = useState('')
  const [fObservateurs, setFObservateurs] = useState(false)
  const [fNbObs, setFNbObs] = useState('1')
  const [fCoAnim, setFCoAnim] = useState(false)
  const [fNbCoAnim, setFNbCoAnim] = useState('1')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const { data: meData } = await supabase.from('animateurs').select('*').eq('id', user.id).single()
      setMe(meData)
      await loadInterventions()
      setLoading(false)
    }
    load()
  }, [])

  const loadInterventions = async () => {
    const { data } = await supabase
      .from('interventions')
      .select(`*, animateur:animateurs(*), candidatures(*, animateur:animateurs(*))`)
      .order('date')
    setInterventions(data || [])
  }

  const interventionsForDay = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return interventions.filter(i => i.date === dateStr)
  }

  const isComplet = (i: Intervention) => {
    const acceptesObs = (i.candidatures || []).filter(c => c.role === 'observateur' && c.statut === 'accepte').length
    const acceptesCo = (i.candidatures || []).filter(c => c.role === 'coanimateur' && c.statut === 'accepte').length
    const needObs = i.cherche_observateurs ? i.nb_observateurs : 0
    const needCo = i.cherche_coanimateur ? i.nb_coanimateurs : 0
    return acceptesObs >= needObs && acceptesCo >= needCo && (needObs + needCo > 0)
  }

  const dejaCandidate = (i: Intervention) => {
    return (i.candidatures || []).some(c => c.animateur_id === me?.id)
  }

  const resetForm = () => {
    setFLieu(''); setFDate(''); setFHeure(''); setFEntreprise('')
    setFNbParticipants(''); setFObservateurs(false); setFNbObs('1')
    setFCoAnim(false); setFNbCoAnim('1')
  }

  const openNewForm = (day?: number) => {
    resetForm()
    if (day) {
      setFDate(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
    }
    setEditMode(false)
    setShowForm(true)
    setSelectedIntervention(null)
  }

  const openEditForm = (i: Intervention) => {
    setFLieu(i.lieu)
    setFDate(i.date)
    setFHeure(i.heure.slice(0, 5))
    setFEntreprise(i.entreprise || '')
    setFNbParticipants(i.nb_participants?.toString() || '')
    setFObservateurs(i.cherche_observateurs)
    setFNbObs(i.nb_observateurs.toString())
    setFCoAnim(i.cherche_coanimateur)
    setFNbCoAnim(i.nb_coanimateurs.toString())
    setEditMode(true)
    setShowForm(true)
    setSelectedIntervention(i)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!me) return
    setSaving(true)
    const payload = {
      lieu: fLieu, date: fDate, heure: fHeure,
      entreprise: fEntreprise || null,
      nb_participants: fNbParticipants ? parseInt(fNbParticipants) : null,
      cherche_observateurs: fObservateurs,
      nb_observateurs: fObservateurs ? parseInt(fNbObs) : 0,
      cherche_coanimateur: fCoAnim,
      nb_coanimateurs: fCoAnim ? parseInt(fNbCoAnim) : 0,
      updated_at: new Date().toISOString()
    }
    if (editMode && selectedIntervention) {
      await supabase.from('interventions').update(payload).eq('id', selectedIntervention.id)
    } else {
      await supabase.from('interventions').insert({ ...payload, animateur_id: me.id })
    }
    await loadInterventions()
    setShowForm(false)
    resetForm()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette intervention ?')) return
    await supabase.from('interventions').delete().eq('id', id)
    await loadInterventions()
    setSelectedIntervention(null)
  }

  const handleCandidater = async () => {
    if (!me || !candidaterModal) return
    await supabase.from('candidatures').insert({
      intervention_id: candidaterModal.id,
      animateur_id: me.id,
      role: candidaterRole
    })
    await loadInterventions()
    setCandidaterModal(null)
  }

  const handleStatutCandidature = async (candidatureId: string, statut: 'accepte' | 'refuse') => {
    await supabase.from('candidatures').update({ statut }).eq('id', candidatureId)
    await loadInterventions()
    if (selectedIntervention) {
      const { data } = await supabase
        .from('interventions')
        .select(`*, animateur:animateurs(*), candidatures(*, animateur:animateurs(*))`)
        .eq('id', selectedIntervention.id)
        .single()
      setSelectedIntervention(data)
    }
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
    setSelectedDay(null); setSelectedIntervention(null)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
    setSelectedDay(null); setSelectedIntervention(null)
  }

  const { start, daysInMonth } = getMonthDays(viewYear, viewMonth)
  const cells = Array(start).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))
  while (cells.length % 7 !== 0) cells.push(null)

  if (loading) return <div className="container"><div className="empty"><p>Chargement…</p></div></div>

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>Agenda des interventions</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>Fresques de l'IA planifiées par la communauté</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/annuaire" className="btn btn-sm">← Annuaire</a>
          <button className="btn btn-sm btn-primary" onClick={() => openNewForm()}>+ Déclarer une intervention</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: '1rem', fontSize: 12, color: 'var(--text2)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#F472B6', display: 'inline-block' }}></span>
          Places disponibles
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#9CA3AF', display: 'inline-block' }}></span>
          Complet
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--accent)', display: 'inline-block' }}></span>
          Aujourd'hui
        </span>
      </div>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <button className="btn btn-sm" onClick={prevMonth}>‹</button>
          <span style={{ fontWeight: 600, fontSize: 16 }}>{MONTHS[viewMonth]} {viewYear}</span>
          <button className="btn btn-sm" onClick={nextMonth}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 500, color: 'var(--text2)', padding: '4px 0' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()
            const dayInterventions = interventionsForDay(day)
            const hasAny = dayInterventions.length > 0
            const isSelected = selectedDay === day
            return (
              <div key={i} onClick={() => {
                setSelectedDay(day)
                setSelectedIntervention(null)
                if (dayInterventions.length === 1) setSelectedIntervention(dayInterventions[0])
              }}
                style={{
                  minHeight: 44, borderRadius: 8, padding: '6px 4px',
                  cursor: hasAny ? 'pointer' : 'default',
                  background: isSelected ? 'var(--accent-bg)' : isToday ? 'var(--accent)' : 'transparent',
                  border: isSelected ? '1.5px solid var(--accent)' : '0.5px solid transparent',
                  transition: 'all .15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3
                }}>
                <span style={{ fontSize: 13, fontWeight: isToday ? 600 : 400, color: isToday ? 'white' : 'var(--text)' }}>{day}</span>
                {dayInterventions.map(inv => (
                  <span key={inv.id} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: isComplet(inv) ? '#9CA3AF' : '#F472B6',
                    display: 'inline-block'
                  }} />
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {selectedDay && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontWeight: 500, fontSize: 15 }}>
              {selectedDay} {MONTHS[viewMonth]} {viewYear}
            </div>
            <button className="btn btn-sm btn-primary" onClick={() => openNewForm(selectedDay)}>+ Intervention ce jour</button>
          </div>
          {interventionsForDay(selectedDay).length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>Aucune intervention prévue ce jour.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {interventionsForDay(selectedDay).map(inv => {
                const complet = isComplet(inv)
                const isMine = inv.animateur_id === me?.id
                const jaiCandidate = dejaCandidate(inv)
                return (
                  <div key={inv.id} className="card" style={{
                    cursor: 'pointer',
                    borderColor: selectedIntervention?.id === inv.id ? 'var(--accent)' : undefined,
                    borderLeft: `3px solid ${complet ? '#9CA3AF' : '#F472B6'}`
                  }} onClick={() => setSelectedIntervention(inv)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{inv.lieu}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                          {inv.heure.slice(0, 5)} {inv.entreprise && `· ${inv.entreprise}`} {inv.nb_participants && `· ${inv.nb_participants} participants`}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                          Par <strong>{inv.animateur?.nom}</strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        {complet ? (
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#F3F4F6', color: '#6B7280', border: '0.5px solid #D1D5DB' }}>Complet</span>
                        ) : (
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#FCE7F3', color: '#BE185D', border: '0.5px solid #F9A8D4' }}>Disponible</span>
                        )}
                        {!isMine && !complet && !jaiCandidate && (
                          <button className="btn btn-sm btn-primary" onClick={e => { e.stopPropagation(); setCandidaterModal(inv) }}>
                            Candidater
                          </button>
                        )}
                        {jaiCandidate && !isMine && (
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '0.5px solid #AFA9EC' }}>Candidature envoyée</span>
                        )}
                        {isMine && (
                          <button className="btn btn-sm" onClick={e => { e.stopPropagation(); openEditForm(inv) }}>Modifier</button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {selectedIntervention && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{selectedIntervention.lieu}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 3 }}>
                {new Date(selectedIntervention.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {selectedIntervention.heure.slice(0, 5)}
              </div>
              {selectedIntervention.entreprise && <div style={{ fontSize: 13, color: 'var(--text2)' }}>Entreprise : {selectedIntervention.entreprise}</div>}
              {selectedIntervention.nb_participants && <div style={{ fontSize: 13, color: 'var(--text2)' }}>{selectedIntervention.nb_participants} participants</div>}
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Organisé par <strong>{selectedIntervention.animateur?.nom}</strong></div>
            </div>
            {selectedIntervention.animateur_id === me?.id && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm" onClick={() => openEditForm(selectedIntervention)}>Modifier</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(selectedIntervention.id)}>Supprimer</button>
              </div>
            )}
          </div>

          <hr className="divider" />

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Recherche</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selectedIntervention.cherche_observateurs && (
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#E6F1FB', color: '#0C447C', border: '0.5px solid #85B7EB' }}>
                  👁 {selectedIntervention.nb_observateurs} observateur{selectedInterventio
