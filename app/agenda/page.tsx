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
  nom_manuel?: string
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
  const [ajoutManuelRole, setAjoutManuelRole] = useState<'observateur' | 'coanimateur'>('observateur')
  const [ajoutManuelNom, setAjoutManuelNom] = useState('')
  const [showAjoutManuel, setShowAjoutManuel] = useState(false)
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

  const refreshSelected = async (id: string) => {
    const { data } = await supabase
      .from('interventions')
      .select(`*, animateur:animateurs(*), candidatures(*, animateur:animateurs(*))`)
      .eq('id', id)
      .single()
    setSelectedIntervention(data)
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

  const handleAjoutManuel = async () => {
    if (!ajoutManuelNom.trim() || !selectedIntervention || !me) return
    await supabase.from('candidatures').insert({
      intervention_id: selectedIntervention.id,
      animateur_id: me.id,
      role: ajoutManuelRole,
      statut: 'accepte',
      nom_manuel: ajoutManuelNom.trim()
    })
    setAjoutManuelNom('')
    setShowAjoutManuel(false)
    await loadInterventions()
    await refreshSelected(selectedIntervention.id)
  }

  const handleStatutCandidature = async (candidatureId: string, statut: 'accepte' | 'refuse') => {
    await supabase.from('candidatures').update({ statut }).eq('id', candidatureId)
    await loadInterventions()
    if (selectedIntervention) await refreshSelected(selectedIntervention.id)
  }

  const handleSupprimerCandidature = async (candidatureId: string) => {
    await supabase.from('candidatures').delete().eq('id', candidatureId)
    await loadInterventions()
    if (selectedIntervention) await refreshSelected(selectedIntervention.id)
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
                  👁 {selectedIntervention.nb_observateurs} observateur{selectedIntervention.nb_observateurs > 1 ? 's' : ''}
                </span>
              )}
              {selectedIntervention.cherche_coanimateur && (
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#E1F5EE', color: '#085041', border: '0.5px solid #5DCAA5' }}>
                  ⚡ {selectedIntervention.nb_coanimateurs} co-animateur{selectedIntervention.nb_coanimateurs > 1 ? 's' : ''}
                </span>
              )}
              {!selectedIntervention.cherche_observateurs && !selectedIntervention.cherche_coanimateur && (
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>Aucun besoin déclaré</span>
              )}
            </div>
          </div>

          <hr className="divider" />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Participants</div>
            {selectedIntervention.animateur_id === me?.id && (
              <button className="btn btn-sm" onClick={() => setShowAjoutManuel(v => !v)}>
                {showAjoutManuel ? 'Annuler' : '+ Ajouter manuellement'}
              </button>
            )}
          </div>

          {showAjoutManuel && selectedIntervention.animateur_id === me?.id && (
            <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '12px', marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 160 }}>
                <label className="form-label">Prénom et nom</label>
                <input className="form-input" value={ajoutManuelNom} onChange={e => setAjoutManuelNom(e.target.value)}
                  placeholder="Marie Dupont" onKeyDown={e => e.key === 'Enter' && handleAjoutManuel()} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Rôle</label>
                <select className="form-input" value={ajoutManuelRole} onChange={e => setAjoutManuelRole(e.target.value as 'observateur' | 'coanimateur')}>
                  {selectedIntervention.cherche_observateurs && <option value="observateur">👁 Observateur</option>}
                  {selectedIntervention.cherche_coanimateur && <option value="coanimateur">⚡ Co-animateur</option>}
                </select>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleAjoutManuel}>Ajouter</button>
            </div>
          )}

          {(selectedIntervention.candidatures || []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(selectedIntervention.candidatures || []).map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'var(--bg2)', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12 }}>{c.role === 'observateur' ? '👁' : '⚡'}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>
                      {c.nom_manuel ? `${c.nom_manuel} (ajouté manuellement)` : c.animateur?.nom}
                    </span>
                    <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20,
                      background: c.statut === 'accepte' ? '#E1F5EE' : c.statut === 'refuse' ? '#FAECE7' : '#F3F4F6',
                      color: c.statut === 'accepte' ? '#085041' : c.statut === 'refuse' ? '#993C1D' : '#6B7280',
                      border: `0.5px solid ${c.statut === 'accepte' ? '#5DCAA5' : c.statut === 'refuse' ? '#F0997B' : '#D1D5DB'}`
                    }}>
                      {c.statut === 'accepte' ? 'Accepté' : c.statut === 'refuse' ? 'Refusé' : 'En attente'}
                    </span>
                  </div>
                  {selectedIntervention.animateur_id === me?.id && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      {c.statut === 'en_attente' && (
                        <>
                          <button className="btn btn-sm" style={{ color: '#085041', borderColor: '#5DCAA5' }}
                            onClick={() => handleStatutCandidature(c.id, 'accepte')}>Accepter</button>
                          <button className="btn btn-sm" style={{ color: '#993C1D', borderColor: '#F0997B' }}
                            onClick={() => handleStatutCandidature(c.id, 'refuse')}>Refuser</button>
                        </>
                      )}
                      <button className="btn btn-sm" style={{ color: 'var(--text3)' }}
                        onClick={() => handleSupprimerCandidature(c.id)}>×</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>Aucun participant pour l'instant.</div>
          )}
        </div>
      )}

      {candidaterModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: 420, width: '100%' }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Candidater à cette intervention</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1.25rem' }}>
              {candidaterModal.lieu} · {new Date(candidaterModal.date).toLocaleDateString('fr-FR')} à {candidaterModal.heure.slice(0, 5)}
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Je souhaite participer en tant que :</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {candidaterModal.cherche_observateurs && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${candidaterRole === 'observateur' ? '#85B7EB' : 'var(--border)'}`, background: candidaterRole === 'observateur' ? '#E6F1FB' : 'var(--bg)' }}
                    onClick={() => setCandidaterRole('observateur')}>
                    <input type="radio" checked={candidaterRole === 'observateur'} onChange={() => setCandidaterRole('observateur')} />
                    <span>👁 Observateur</span>
                  </label>
                )}
                {candidaterModal.cherche_coanimateur && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${candidaterRole === 'coanimateur' ? '#5DCAA5' : 'var(--border)'}`, background: candidaterRole === 'coanimateur' ? '#E1F5EE' : 'var(--bg)' }}
                    onClick={() => setCandidaterRole('coanimateur')}>
                    <input type="radio" checked={candidaterRole === 'coanimateur'} onChange={() => setCandidaterRole('coanimateur')} />
                    <span>⚡ Co-animateur</span>
                  </label>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setCandidaterModal(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleCandidater}>Confirmer ma candidature</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, padding: '2rem 1rem', overflowY: 'auto' }}>
          <div className="card" style={{ maxWidth: 520, width: '100%' }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: '1.25rem' }}>
              {editMode ? "Modifier l'intervention" : 'Déclarer une intervention'}
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Lieu *</label>
                  <input className="form-input" value={fLieu} onChange={e => setFLieu(e.target.value)} required placeholder="Ex: Paris 8e, Salle de conf. A" />
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input className="form-input" type="date" value={fDate} onChange={e => setFDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Heure *</label>
                  <input className="form-input" type="time" value={fHeure} onChange={e => setFHeure(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Entreprise / Organisation</label>
                  <input className="form-input" value={fEntreprise} onChange={e => setFEntreprise(e.target.value)} placeholder="Nom de l'entreprise" />
                </div>
                <div className="form-group">
                  <label className="form-label">Nb de participants</label>
                  <input className="form-input" type="number" min="1" value={fNbParticipants} onChange={e => setFNbParticipants(e.target.value)} placeholder="Ex: 20" />
                </div>
              </div>
              <hr className="divider" />
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Je recherche</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={fObservateurs} onChange={e => setFObservateurs(e.target.checked)} />
                  <span style={{ fontSize: 13 }}>👁 Des observateurs</span>
                </label>
                {fObservateurs && (
                  <div className="form-group" style={{ marginBottom: 0, paddingLeft: 24 }}>
                    <label className="form-label">Nombre d'observateurs souhaités</label>
                    <input className="form-input" type="number" min="1" value={fNbObs} onChange={e => setFNbObs(e.target.value)} style={{ width: 100 }} />
                  </div>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={fCoAnim} onChange={e => setFCoAnim(e.target.checked)} />
                  <span style={{ fontSize: 13 }}>⚡ Un ou des co-animateurs</span>
                </label>
                {fCoAnim && (
                  <div className="form-group" style={{ marginBottom: 0, paddingLeft: 24 }}>
                    <label className="form-label">Nombre de co-animateurs souhaités</label>
                    <input className="form-input" type="number" min="1" value={fNbCoAnim} onChange={e => setFNbCoAnim(e.target.value)} style={{ width: 100 }} />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => { setShowForm(false); resetForm() }}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement…' : editMode ? 'Modifier' : 'Déclarer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
