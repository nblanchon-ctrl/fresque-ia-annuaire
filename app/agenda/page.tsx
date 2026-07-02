'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Animateur } from '@/lib/types'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

type TypeEvenement = 'fresque' | 'cafe_ia' | 'rencontre' | 'soiree' | 'seminaire' | 'autre'

interface Intervention {
  id: string
  animateur_id: string
  type_evenement: TypeEvenement
  lieu: string
  date: string
  heure: string
  entreprise?: string
  nb_participants?: number
  cherche_observateurs: boolean
  nb_observateurs: number
  cherche_coanimateur: boolean
  nb_coanimateurs: number
  description?: string
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

const EVENT_TYPES: { value: TypeEvenement; emoji: string; labelFr: string; labelEn: string; color: string; textColor: string; border: string }[] = [
  { value: 'fresque', emoji: '🌍', labelFr: 'Fresque de l\'IA', labelEn: 'AI Fresco', color: '#EEEDFE', textColor: '#3C3489', border: '#AFA9EC' },
  { value: 'cafe_ia', emoji: '☕', labelFr: 'Café IA', labelEn: 'AI Café', color: '#FAEEDA', textColor: '#633806', border: '#EF9F27' },
  { value: 'rencontre', emoji: '🤝', labelFr: 'Rencontre', labelEn: 'Meetup', color: '#E1F5EE', textColor: '#085041', border: '#5DCAA5' },
  { value: 'soiree', emoji: '🥂', labelFr: 'Soirée / Verre', labelEn: 'Social evening', color: '#FBEAF0', textColor: '#72243E', border: '#F0997B' },
  { value: 'seminaire', emoji: '🎓', labelFr: 'Séminaire', labelEn: 'Seminar', color: '#E6F1FB', textColor: '#0C447C', border: '#85B7EB' },
  { value: 'autre', emoji: '📌', labelFr: 'Autre', labelEn: 'Other', color: '#F1EFE8', textColor: '#444441', border: '#C9C7C0' },
]

function getEventType(value: TypeEvenement) {
  return EVENT_TYPES.find(e => e.value === value) || EVENT_TYPES[0]
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const start = firstDay === 0 ? 6 : firstDay - 1
  return { start, daysInMonth }
}

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
const DAYS_EN = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export default function AgendaPage() {
  const { t, lang } = useLanguage()
  const MONTHS = lang === 'en' ? MONTHS_EN : MONTHS_FR
  const DAYS = lang === 'en' ? DAYS_EN : DAYS_FR
  const dateLocale = lang === 'en' ? 'en-US' : 'fr-FR'

  const [me, setMe] = useState<Animateur | null>(null)
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [allEmails, setAllEmails] = useState<string[]>([])
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

  // Form state
  const [fType, setFType] = useState<TypeEvenement>('fresque')
  const [fLieu, setFLieu] = useState('')
  const [fDate, setFDate] = useState('')
  const [fHeure, setFHeure] = useState('')
  const [fEntreprise, setFEntreprise] = useState('')
  const [fNbParticipants, setFNbParticipants] = useState('')
  const [fObservateurs, setFObservateurs] = useState(false)
  const [fNbObs, setFNbObs] = useState('1')
  const [fCoAnim, setFCoAnim] = useState(false)
  const [fNbCoAnim, setFNbCoAnim] = useState('1')
  const [fDescription, setFDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const { data: meData } = await supabase.from('animateurs').select('*').eq('id', user.id).single()
      setMe(meData)
      await loadInterventions()
      const { data: animateursData } = await supabase.from('animateurs').select('email')
      setAllEmails((animateursData || []).map(a => a.email).filter((e): e is string => !!e))
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
    if (i.type_evenement !== 'fresque') return false
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
    setFType('fresque'); setFLieu(''); setFDate(''); setFHeure(''); setFEntreprise('')
    setFNbParticipants(''); setFObservateurs(false); setFNbObs('1')
    setFCoAnim(false); setFNbCoAnim('1'); setFDescription('')
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
    setFType(i.type_evenement || 'fresque')
    setFLieu(i.lieu)
    setFDate(i.date)
    setFHeure(i.heure.slice(0, 5))
    setFEntreprise(i.entreprise || '')
    setFNbParticipants(i.nb_participants?.toString() || '')
    setFObservateurs(i.cherche_observateurs)
    setFNbObs(i.nb_observateurs.toString())
    setFCoAnim(i.cherche_coanimateur)
    setFNbCoAnim(i.nb_coanimateurs.toString())
    setFDescription(i.description || '')
    setEditMode(true)
    setShowForm(true)
    setSelectedIntervention(i)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!me) return
    setSaving(true)
    const payload = {
      type_evenement: fType,
      lieu: fLieu, date: fDate, heure: fHeure,
      entreprise: fEntreprise || null,
      description: fDescription || null,
      nb_participants: fNbParticipants ? parseInt(fNbParticipants) : null,
      cherche_observateurs: fType === 'fresque' ? fObservateurs : false,
      nb_observateurs: fType === 'fresque' && fObservateurs ? parseInt(fNbObs) : 0,
      cherche_coanimateur: fType === 'fresque' ? fCoAnim : false,
      nb_coanimateurs: fType === 'fresque' && fCoAnim ? parseInt(fNbCoAnim) : 0,
      updated_at: new Date().toISOString()
    }
    if (editMode && selectedIntervention) {
      await supabase.from('interventions').update(payload).eq('id', selectedIntervention.id)
    } else {
      await supabase.from('interventions').insert({ ...payload, animateur_id: me.id })
      const autresEmails = allEmails.filter(e => e !== me.email)
      if (autresEmails.length > 0) {
        const et = getEventType(fType)
        const etLabel = lang === 'en' ? et.labelEn : et.labelFr
        const sujet = `${et.emoji} ${etLabel} - ${fLieu}`
        const dateStr = new Date(fDate).toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        const corps = lang === 'en'
          ? `Hello,\n\n${me.nom} has just posted a new event on the community calendar:\n\nType: ${etLabel}\nLocation: ${fLieu}\nDate: ${dateStr}\nTime: ${fHeure}${fEntreprise ? `\nOrganization: ${fEntreprise}` : ''}${fNbParticipants ? `\nParticipants: ${fNbParticipants}` : ''}\n\nSee the calendar:\n${window.location.origin}/agenda\n\nSee you there!`
          : `Bonjour,\n\n${me.nom} vient de créer un nouvel événement sur l'agenda de la communauté :\n\nType : ${etLabel}\nLieu : ${fLieu}\nDate : ${dateStr}\nHeure : ${fHeure}${fEntreprise ? `\nOrganisation : ${fEntreprise}` : ''}${fNbParticipants ? `\nParticipants : ${fNbParticipants}` : ''}\n\nConsultez l'agenda :\n${window.location.origin}/agenda\n\nÀ bientôt !`
        const mailto = `mailto:?bcc=${encodeURIComponent(autresEmails.join(','))}&subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`
        window.location.href = mailto
      }
    }
    await loadInterventions()
    setShowForm(false)
    resetForm()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('agenda.confirmDeleteIntervention'))) return
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
    const organisateurEmail = candidaterModal.animateur?.email
    if (organisateurEmail) {
      const sujet = `Candidature pour votre intervention - ${candidaterModal.lieu}`
      const corps = `Bonjour ${candidaterModal.animateur?.nom || ''},\n\n${me.nom} souhaite participer à votre intervention en tant que ${candidaterRole === 'observateur' ? 'observateur' : 'co-animateur'}.\n\nLieu : ${candidaterModal.lieu}\nDate : ${new Date(candidaterModal.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\nHeure : ${candidaterModal.heure.slice(0, 5)}\n\nConnectez-vous à l'agenda pour accepter ou refuser :\n${window.location.origin}/agenda\n\nÀ bientôt !`
      window.location.href = `mailto:${organisateurEmail}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`
    }
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

  if (loading) return <div className="container"><div className="empty"><p>{t('common.loading')}</p></div></div>

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <a href="/annuaire" style={{ fontSize: 13, color: 'var(--text2)' }}>← {t('espace.title')}</a>
          </div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>{t('espace.agenda')}</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>{t('agenda.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <LanguageSwitch />
          <button className="btn btn-sm btn-primary" onClick={() => openNewForm()}>+ {lang === 'en' ? 'New event' : 'Nouvel événement'}</button>
        </div>
      </div>

      {/* Légende types d'événements */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        {EVENT_TYPES.map(et => (
          <span key={et.value} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12, padding: '3px 10px', borderRadius: 20,
            background: et.color, color: et.textColor, border: `0.5px solid ${et.border}`
          }}>
            {et.emoji} {lang === 'en' ? et.labelEn : et.labelFr}
          </span>
        ))}
      </div>

      {/* Légende statuts */}
      <div style={{ display: 'flex', gap: 16, marginBottom: '1rem', fontSize: 12, color: 'var(--text2)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F472B6', display: 'inline-block' }}></span>
          {t('agenda.available')}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#9CA3AF', display: 'inline-block' }}></span>
          {t('agenda.full')}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent)', display: 'inline-block' }}></span>
          {t('agenda.today')}
        </span>
      </div>

      {/* Calendrier */}
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
                  minHeight: 48, borderRadius: 8, padding: '4px',
                  cursor: hasAny ? 'pointer' : 'default',
                  background: isSelected ? 'var(--accent-bg)' : isToday ? 'var(--accent)' : 'transparent',
                  border: isSelected ? '1.5px solid var(--accent)' : '0.5px solid transparent',
                  transition: 'all .15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
                }}>
                <span style={{ fontSize: 13, fontWeight: isToday ? 600 : 400, color: isToday ? 'white' : 'var(--text)' }}>{day}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                  {dayInterventions.map(inv => {
                    const et = getEventType(inv.type_evenement)
                    return (
                      <span key={inv.id} style={{ fontSize: 10 }} title={lang === 'en' ? et.labelEn : et.labelFr}>
                        {et.emoji}
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Liste du jour sélectionné */}
      {selectedDay && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontWeight: 500, fontSize: 15 }}>
              {selectedDay} {MONTHS[viewMonth]} {viewYear}
            </div>
            <button className="btn btn-sm btn-primary" onClick={() => openNewForm(selectedDay)}>
              + {lang === 'en' ? 'Event this day' : 'Événement ce jour'}
            </button>
          </div>
          {interventionsForDay(selectedDay).length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>{t('agenda.noIntervention')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {interventionsForDay(selectedDay).map(inv => {
                const complet = isComplet(inv)
                const isMine = inv.animateur_id === me?.id
                const jaiCandidate = dejaCandidate(inv)
                const et = getEventType(inv.type_evenement)
                return (
                  <div key={inv.id} className="card" style={{
                    cursor: 'pointer',
                    borderColor: selectedIntervention?.id === inv.id ? 'var(--accent)' : undefined,
                    borderLeft: `3px solid ${et.border}`
                  }} onClick={() => setSelectedIntervention(inv)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 20, background: et.color, color: et.textColor, border: `0.5px solid ${et.border}` }}>
                            {et.emoji} {lang === 'en' ? et.labelEn : et.labelFr}
                          </span>
                        </div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{inv.lieu}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                          {inv.heure.slice(0, 5)} {inv.entreprise && `· ${inv.entreprise}`}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                          {t('agenda.by')} <strong>{inv.animateur?.nom}</strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        {inv.type_evenement === 'fresque' && (
                          complet ? (
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#F3F4F6', color: '#6B7280', border: '0.5px solid #D1D5DB' }}>{t('agenda.full')}</span>
                          ) : (
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#FCE7F3', color: '#BE185D', border: '0.5px solid #F9A8D4' }}>{t('agenda.available')}</span>
                          )
                        )}
                        {inv.type_evenement === 'fresque' && !isMine && !complet && !jaiCandidate && (
                          <button className="btn btn-sm btn-primary" onClick={e => { e.stopPropagation(); setCandidaterModal(inv) }}>
                            {t('agenda.candidate')}
                          </button>
                        )}
                        {inv.type_evenement === 'fresque' && jaiCandidate && !isMine && (
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '0.5px solid #AFA9EC' }}>{t('agenda.candidateSent')}</span>
                        )}
                        {isMine && (
                          <button className="btn btn-sm" onClick={e => { e.stopPropagation(); openEditForm(inv) }}>{t('common.edit')}</button>
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

      {/* Détail événement sélectionné */}
      {selectedIntervention && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          {(() => {
            const et = getEventType(selectedIntervention.type_evenement)
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: et.color, color: et.textColor, border: `0.5px solid ${et.border}`, display: 'inline-block', marginBottom: 6 }}>
                      {et.emoji} {lang === 'en' ? et.labelEn : et.labelFr}
                    </span>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{selectedIntervention.lieu}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 3 }}>
                      {new Date(selectedIntervention.date).toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} {lang === 'en' ? 'at' : 'à'} {selectedIntervention.heure.slice(0, 5)}
                    </div>
                    {selectedIntervention.entreprise && <div style={{ fontSize: 13, color: 'var(--text2)' }}>{selectedIntervention.entreprise}</div>}
                    {selectedIntervention.nb_participants && <div style={{ fontSize: 13, color: 'var(--text2)' }}>{selectedIntervention.nb_participants} {t('agenda.participants').toLowerCase()}</div>}
                    <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{t('agenda.organizedBy')} <strong>{selectedIntervention.animateur?.nom}</strong></div>
                    {selectedIntervention.description && (
                      <p style={{ fontSize: 13, color: 'var(--text)', marginTop: 8, lineHeight: 1.6, padding: '10px 12px', background: 'var(--bg2)', borderRadius: 8 }}>
                        {selectedIntervention.description}
                      </p>
                    )}
                  </div>
                  {selectedIntervention.animateur_id === me?.id && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" onClick={() => openEditForm(selectedIntervention)}>{t('common.edit')}</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(selectedIntervention.id)}>{t('common.delete')}</button>
                    </div>
                  )}
                </div>

                {/* Candidatures (seulement pour les fresques) */}
                {selectedIntervention.type_evenement === 'fresque' && (
                  <>
                    <hr className="divider" />
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{t('agenda.search')}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {selectedIntervention.cherche_observateurs && (
                          <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#E6F1FB', color: '#0C447C', border: '0.5px solid #85B7EB' }}>
                            👁 {selectedIntervention.nb_observateurs} {selectedIntervention.nb_observateurs > 1 ? t('agenda.observerPlural') : t('agenda.observer')}
                          </span>
                        )}
                        {selectedIntervention.cherche_coanimateur && (
                          <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#E1F5EE', color: '#085041', border: '0.5px solid #5DCAA5' }}>
                            ⚡ {selectedIntervention.nb_coanimateurs} {selectedIntervention.nb_coanimateurs > 1 ? t('agenda.coanimatorPlural') : t('agenda.coanimator')}
                          </span>
                        )}
                        {!selectedIntervention.cherche_observateurs && !selectedIntervention.cherche_coanimateur && (
                          <span style={{ fontSize: 12, color: 'var(--text2)' }}>{t('agenda.noNeedDeclared')}</span>
                        )}
                      </div>
                    </div>

                    <hr className="divider" />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{t('agenda.participants')}</div>
                      {selectedIntervention.animateur_id === me?.id && (
                        <button className="btn btn-sm" onClick={() => setShowAjoutManuel(v => !v)}>
                          {showAjoutManuel ? t('common.cancel') : t('agenda.addManually')}
                        </button>
                      )}
                    </div>

                    {showAjoutManuel && selectedIntervention.animateur_id === me?.id && (
                      <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '12px', marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 160 }}>
                          <label className="form-label">{t('agenda.manualName')}</label>
                          <input className="form-input" value={ajoutManuelNom} onChange={e => setAjoutManuelNom(e.target.value)}
                            placeholder="Marie Dupont" onKeyDown={e => e.key === 'Enter' && handleAjoutManuel()} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">{t('agenda.role')}</label>
                          <select className="form-input" value={ajoutManuelRole} onChange={e => setAjoutManuelRole(e.target.value as 'observateur' | 'coanimateur')}>
                            {selectedIntervention.cherche_observateurs && <option value="observateur">👁 {t('badge.observer')}</option>}
                            {selectedIntervention.cherche_coanimateur && <option value="coanimateur">⚡ {t('badge.coanimator')}</option>}
                          </select>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={handleAjoutManuel}>{t('common.add')}</button>
                      </div>
                    )}

                    {(selectedIntervention.candidatures || []).length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(selectedIntervention.candidatures || []).map(c => (
                          <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'var(--bg2)', flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 12 }}>{c.role === 'observateur' ? '👁' : '⚡'}</span>
                              <span style={{ fontSize: 13, fontWeight: 500 }}>
                                {c.nom_manuel ? `${c.nom_manuel} ${t('agenda.addedManually')}` : c.animateur?.nom}
                              </span>
                              <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20,
                                background: c.statut === 'accepte' ? '#E1F5EE' : c.statut === 'refuse' ? '#FAECE7' : '#F3F4F6',
                                color: c.statut === 'accepte' ? '#085041' : c.statut === 'refuse' ? '#993C1D' : '#6B7280',
                                border: `0.5px solid ${c.statut === 'accepte' ? '#5DCAA5' : c.statut === 'refuse' ? '#F0997B' : '#D1D5DB'}`
                              }}>
                                {c.statut === 'accepte' ? t('agenda.accepted') : c.statut === 'refuse' ? t('agenda.rejected') : t('agenda.pending')}
                              </span>
                            </div>
                            {selectedIntervention.animateur_id === me?.id && (
                              <div style={{ display: 'flex', gap: 6 }}>
                                {c.statut === 'en_attente' && (
                                  <>
                                    <button className="btn btn-sm" style={{ color: '#085041', borderColor: '#5DCAA5' }}
                                      onClick={() => handleStatutCandidature(c.id, 'accepte')}>{t('agenda.accept')}</button>
                                    <button className="btn btn-sm" style={{ color: '#993C1D', borderColor: '#F0997B' }}
                                      onClick={() => handleStatutCandidature(c.id, 'refuse')}>{t('agenda.reject')}</button>
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
                      <div style={{ fontSize: 13, color: 'var(--text2)' }}>{t('agenda.noParticipants')}</div>
                    )}
                  </>
                )}
              </>
            )
          })()}
        </div>
      )}

      {/* Modal candidature */}
      {candidaterModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: 420, width: '100%' }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{t('agenda.candidateModalTitle')}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1.25rem' }}>
              {candidaterModal.lieu} · {new Date(candidaterModal.date).toLocaleDateString(dateLocale)} {lang === 'en' ? 'at' : 'à'} {candidaterModal.heure.slice(0, 5)}
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{t('agenda.candidateAs')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {candidaterModal.cherche_observateurs && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${candidaterRole === 'observateur' ? '#85B7EB' : 'var(--border)'}`, background: candidaterRole === 'observateur' ? '#E6F1FB' : 'var(--bg)' }}
                    onClick={() => setCandidaterRole('observateur')}>
                    <input type="radio" checked={candidaterRole === 'observateur'} onChange={() => setCandidaterRole('observateur')} />
                    <span>👁 {t('badge.observer')}</span>
                  </label>
                )}
                {candidaterModal.cherche_coanimateur && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${candidaterRole === 'coanimateur' ? '#5DCAA5' : 'var(--border)'}`, background: candidaterRole === 'coanimateur' ? '#E1F5EE' : 'var(--bg)' }}
                    onClick={() => setCandidaterRole('coanimateur')}>
                    <input type="radio" checked={candidaterRole === 'coanimateur'} onChange={() => setCandidaterRole('coanimateur')} />
                    <span>⚡ {t('badge.coanimator')}</span>
                  </label>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setCandidaterModal(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleCandidater}>{t('agenda.confirmCandidacy')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire création/édition */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, padding: '2rem 1rem', overflowY: 'auto' }}>
          <div className="card" style={{ maxWidth: 540, width: '100%' }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: '1.25rem' }}>
              {editMode ? (lang === 'en' ? 'Edit event' : "Modifier l'événement") : (lang === 'en' ? 'New event' : 'Nouvel événement')}
            </div>
            <form onSubmit={handleSave}>
              {/* Type d'événement */}
              <div className="form-group">
                <label className="form-label">{lang === 'en' ? 'Event type *' : "Type d'événement *"}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {EVENT_TYPES.map(et => (
                    <div key={et.value} onClick={() => setFType(et.value)}
                      style={{
                        padding: '10px 8px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                        border: fType === et.value ? `1.5px solid ${et.border}` : '0.5px solid var(--border)',
                        background: fType === et.value ? et.color : 'var(--bg)',
                        transition: 'all .15s'
                      }}>
                      <div style={{ fontSize: 20, marginBottom: 2 }}>{et.emoji}</div>
                      <div style={{ fontSize: 11, fontWeight: 500, color: fType === et.value ? et.textColor : 'var(--text2)' }}>
                        {lang === 'en' ? et.labelEn : et.labelFr}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">{t('agenda.place')}</label>
                  <input className="form-input" value={fLieu} onChange={e => setFLieu(e.target.value)} required placeholder={t('agenda.placePlaceholder')} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('agenda.date')}</label>
                  <input className="form-input" type="date" value={fDate} onChange={e => setFDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('agenda.time')}</label>
                  <input className="form-input" type="time" value={fHeure} onChange={e => setFHeure(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('agenda.company')}</label>
                  <input className="form-input" value={fEntreprise} onChange={e => setFEntreprise(e.target.value)} placeholder={t('agenda.companyPlaceholder')} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('agenda.nbParticipants')}</label>
                  <input className="form-input" type="number" min="1" value={fNbParticipants} onChange={e => setFNbParticipants(e.target.value)} placeholder="Ex: 20" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">{lang === 'en' ? 'Description' : 'Description'}</label>
                  <textarea className="form-input" value={fDescription} onChange={e => setFDescription(e.target.value)}
                    placeholder={lang === 'en' ? 'Describe the event, its goals, what to expect…' : "Décrivez l'événement, ses objectifs, ce que les participants peuvent en attendre…"} />
                </div>
              </div>

              {/* Candidatures seulement pour Fresque */}
              {fType === 'fresque' && (
                <>
                  <hr className="divider" />
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>{t('agenda.iSearch')}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="checkbox" checked={fObservateurs} onChange={e => setFObservateurs(e.target.checked)} />
                      <span style={{ fontSize: 13 }}>👁 {t('agenda.observersNeeded')}</span>
                    </label>
                    {fObservateurs && (
                      <div className="form-group" style={{ marginBottom: 0, paddingLeft: 24 }}>
                        <label className="form-label">{t('agenda.nbObservers')}</label>
                        <input className="form-input" type="number" min="1" value={fNbObs} onChange={e => setFNbObs(e.target.value)} style={{ width: 100 }} />
                      </div>
                    )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="checkbox" checked={fCoAnim} onChange={e => setFCoAnim(e.target.checked)} />
                      <span style={{ fontSize: 13 }}>⚡ {t('agenda.coanimatorsNeeded')}</span>
                    </label>
                    {fCoAnim && (
                      <div className="form-group" style={{ marginBottom: 0, paddingLeft: 24 }}>
                        <label className="form-label">{t('agenda.nbCoanimators')}</label>
                        <input className="form-input" type="number" min="1" value={fNbCoAnim} onChange={e => setFNbCoAnim(e.target.value)} style={{ width: 100 }} />
                      </div>
                    )}
                  </div>
                </>
              )}

              <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '10px 12px', marginBottom: '1rem', fontSize: 12, color: 'var(--text2)' }}>
                ✉️ {lang === 'en' ? 'After saving, your email client will open to notify all facilitators.' : 'Après validation, votre client mail s\'ouvrira pour notifier l\'ensemble des animateurs.'}
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => { setShowForm(false); resetForm() }}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? t('agenda.saving') : editMode ? t('agenda.editSubmit') : t('agenda.declareSubmit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
