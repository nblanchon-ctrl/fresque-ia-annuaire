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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-b
