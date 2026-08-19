'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Animateur } from '@/lib/types'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

interface Document {
  id: string
  auteur_id: string
  categorie: string
  titre: string
  description?: string
  type: 'fichier' | 'lien'
  url: string
  nom_fichier?: string
  created_at: string
  auteur?: Animateur
}

const CATEGORIE_CONFIG = {
  droit: {
    icon: '⚖️',
    labelFr: 'Veille IA & Droit',
    labelEn: 'Legal Watch',
    color: '#E6F1FB',
    textColor: '#0C447C',
    border: '#85B7EB',
  },
  usage: {
    icon: '🔍',
    labelFr: "Veille Cas d'usage IA",
    labelEn: 'AI Use Cases Watch',
    color: '#E1F5EE',
    textColor: '#085041',
    border: '#5DCAA5',
  },
}

export default function VeilleCategoriePage() {
  const { categorie } = useParams<{ categorie: string }>()
  const { lang } = useLanguage()
  const [me, setMe] = useState<Animateur | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [allEmails, setAllEmails] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [fTitre, setFTitre] = useState('')
  const [fDescription, setFDescription] = useState('')
  const [fType, setFType] = useState<'fichier' | 'lien'>('lien')
  const [fLien, setFLien] = useState('')
  const [fFichier, setFFichier] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const config = CATEGORIE_CONFIG[categorie as keyof typeof CATEGORIE_CONFIG] || CATEGORIE_CONFIG.droit

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const [{ data: meData }, { data: docs }, { data: animateursData }] = await Promise.all([
        supabase.from('animateurs').select('*').eq('id', user.id).single(),
        supabase.from('documents').select('*, auteur:animateurs(nom)').eq('categorie', categorie).order('created_at', { ascending: false }),
        supabase.from('animateurs').select('email')
      ])
      setMe(meData)
      setDocuments(docs || [])
      setAllEmails((animateursData || []).map(a => a.email).filter((e): e is string => !!e))
      setLoading(false)
    }
    load()
  }, [categorie])

  const resetForm = () => {
    setFTitre(''); setFDescription(''); setFType('lien'); setFLien(''); setFFichier(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!me) return
    setSaving(true)

    let url = fLien
    let nom_fichier = undefined

    if (fType === 'fichier' && fFichier) {
      setUploading(true)
      const ext = fFichier.name.split('.').pop()
      const path = `${categorie}/${Date.now()}_${fFichier.name}`
      const { error: upErr } = await supabase.storage.from('documents').upload(path, fFichier)
      if (!upErr) {
        const { data } = supabase.storage.from('documents').getPublicUrl(path)
        url = data.publicUrl
        nom_fichier = fFichier.name
      }
      setUploading(false)
    }

    const { data: newDoc } = await supabase.from('documents').insert({
      auteur_id: me.id,
      categorie,
      titre: fTitre,
      description: fDescription || null,
      type: fType,
      url,
      nom_fichier,
    }).select('*, auteur:animateurs(nom)').single()

    if (newDoc) {
      setDocuments(prev => [newDoc, ...prev])

      // Email notification
      const autresEmails = allEmails.filter(e => e !== me.email)
      if (autresEmails.length > 0) {
        const catLabelFr = config.labelFr
        const catLabelEn = config.labelEn
        const sujet = lang === 'en'
          ? `📄 New document available - ${catLabelEn}`
          : `📄 Nouveau document disponible - ${catLabelFr}`
        const corps = `Bonjour / Hello,

${lang === 'en' ? `${me.nom} has just added a new document in` : `${me.nom} vient d'ajouter un nouveau document dans`} "${lang === 'en' ? catLabelEn : catLabelFr}" :

${lang === 'en' ? 'Title' : 'Titre'} : ${fTitre}${fDescription ? `\n${lang === 'en' ? 'Description' : 'Description'} : ${fDescription}` : ''}
${lang === 'en' ? 'Link' : 'Lien'} : ${url}

${lang === 'en' ? 'Access the AI Watch section:' : 'Accédez à la section Veille IA :'}
${window.location.origin}/veille/${categorie}

À bientôt / See you soon !`

        const mailto = `mailto:?bcc=${encodeURIComponent(autresEmails.join(','))}&subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`
        window.location.href = mailto
      }

      setShowForm(false)
      resetForm()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'en' ? 'Delete this document?' : 'Supprimer ce document ?')) return
    await supabase.from('documents').delete().eq('id', id)
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  if (loading) return <div className="container"><div className="empty"><p>Chargement…</p></div></div>

  return (
    <div className="container" style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <a href="/veille" style={{ fontSize: 13, color: 'var(--text2)' }}>
              ← {lang === 'en' ? 'AI Watch' : 'Veille IA'}
            </a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 28 }}>{config.icon}</span>
            <h1 style={{ fontSize: 22, fontWeight: 600 }}>
              {lang === 'en' ? config.labelEn : config.labelFr}
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>
            {documents.length} document{documents.length > 1 ? 's' : ''} disponible{documents.length > 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <LanguageSwitch />
          {me?.is_admin && (
            <button className="btn btn-sm btn-primary" onClick={() => setShowForm(v => !v)}>
              {showForm ? (lang === 'en' ? 'Cancel' : 'Annuler') : `+ ${lang === 'en' ? 'Add a document' : 'Ajouter un document'}`}
            </button>
          )}
        </div>
      </div>

      {/* Formulaire d'ajout (admin seulement) */}
      {me?.is_admin && showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: '1rem' }}>
            {lang === 'en' ? 'New document' : 'Nouveau document'}
          </div>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">{lang === 'en' ? 'Title *' : 'Titre *'}</label>
              <input className="form-input" value={fTitre} onChange={e => setFTitre(e.target.value)} required
                placeholder={lang === 'en' ? 'Document title' : 'Titre du document'} />
            </div>
            <div className="form-group">
              <label className="form-label">{lang === 'en' ? 'Description' : 'Description'}</label>
              <textarea className="form-input" value={fDescription} onChange={e => setFDescription(e.target.value)}
                placeholder={lang === 'en' ? 'Brief description of the document…' : 'Brève description du document…'} />
            </div>

            {/* Type : lien ou fichier */}
            <div className="form-group">
              <label className="form-label">{lang === 'en' ? 'Type *' : 'Type *'}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['lien', 'fichier'] as const).map(type => (
                  <div key={type} onClick={() => setFType(type)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                      border: fType === type ? `1.5px solid ${config.border}` : '0.5px solid var(--border)',
                      background: fType === type ? config.color : 'var(--bg)',
                      transition: 'all .15s'
                    }}>
                    <div style={{ fontSize: 20, marginBottom: 2 }}>{type === 'lien' ? '🔗' : '📄'}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: fType === type ? config.textColor : 'var(--text2)' }}>
                      {type === 'lien' ? (lang === 'en' ? 'Link' : 'Lien web') : (lang === 'en' ? 'File' : 'Fichier')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {fType === 'lien' ? (
              <div className="form-group">
                <label className="form-label">URL *</label>
                <input className="form-input" type="url" value={fLien} onChange={e => setFLien(e.target.value)} required
                  placeholder="https://…" />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">{lang === 'en' ? 'File *' : 'Fichier *'} (PDF, Word, etc.)</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
                    {fFichier ? fFichier.name : (lang === 'en' ? 'Choose a file' : 'Choisir un fichier')}
                  </button>
                  {fFichier && <span style={{ fontSize: 12, color: 'var(--text2)' }}>{(fFichier.size / 1024 / 1024).toFixed(1)} Mo</span>}
                </div>
                <input ref={fileRef} type="file" style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                  onChange={e => setFFichier(e.target.files?.[0] || null)} />
              </div>
            )}

            <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '10px 12px', marginBottom: '1rem', fontSize: 12, color: 'var(--text2)' }}>
              ✉️ {lang === 'en' ? 'After saving, your email client will open to notify all facilitators.' : "Après validation, votre client mail s'ouvrira pour notifier l'ensemble des animateurs."}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn" onClick={() => { setShowForm(false); resetForm() }}>
                {lang === 'en' ? 'Cancel' : 'Annuler'}
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                {saving || uploading ? (lang === 'en' ? 'Saving…' : 'Enregistrement…') : (lang === 'en' ? 'Add' : 'Ajouter')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des documents */}
      {documents.length === 0 ? (
        <div className="empty">
          <p>{lang === 'en' ? 'No document yet.' : 'Aucun document pour l\'instant.'}</p>
          {me?.is_admin && (
            <p style={{ fontSize: 13, marginTop: 8 }}>
              {lang === 'en' ? 'Click "+ Add a document" to get started.' : 'Cliquez sur "+ Ajouter un document" pour commencer.'}
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {documents.map(doc => (
            <div key={doc.id} className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: config.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20
              }}>
                {doc.type === 'lien' ? '🔗' : '📄'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <a href={doc.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 15, fontWeight: 500, color: 'var(--accent)', display: 'block', marginBottom: 2 }}>
                  {doc.titre}
                </a>
                {doc.description && (
                  <p style={{ fontSize: 13, color: 'var(--text2)', margin: '4px 0', lineHeight: 1.5 }}>{doc.description}</p>
                )}
                {doc.nom_fichier && (
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{doc.nom_fichier}</span>
                )}
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                  {lang === 'en' ? 'Added by' : 'Ajouté par'} {doc.auteur?.nom} · {new Date(doc.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                  {doc.type === 'lien' ? (lang === 'en' ? 'Open' : 'Ouvrir') : (lang === 'en' ? 'Download' : 'Télécharger')}
                </a>
                {me?.is_admin && (
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(doc.id)}>×</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
