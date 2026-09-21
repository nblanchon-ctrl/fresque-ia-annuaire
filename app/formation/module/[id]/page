'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

interface Module {
  id: string
  titre: string
  titre_en?: string
  description?: string
  description_en?: string
  contenu?: string
  contenu_en?: string
  video_url?: string
}

interface Question {
  id: string
  question: string
  question_en?: string
  options: string[]
  options_en?: string[]
  correct_index: number
  ordre: number
}

type Step = 'intro' | 'contenu' | 'quiz' | 'result'

export default function ModulePage() {
  const { id } = useParams<{ id: string }>()
  const { lang } = useLanguage()
  const [module, setModule] = useState<Module | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [progression, setProgression] = useState<{ completed: boolean; attempts: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('intro')
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<{ correct: number; total: number; passed: boolean } | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      setUserId(user.id)
      const [{ data: mod }, { data: qs }, { data: prog }] = await Promise.all([
        supabase.from('modules').select('*').eq('id', id).single(),
        supabase.from('quiz_questions').select('*').eq('module_id', id).order('ordre'),
        supabase.from('progressions').select('*').eq('animateur_id', user.id).eq('module_id', id).single()
      ])
      setModule(mod)
      setQuestions(qs || [])
      setProgression(prog || null)
      setLoading(false)
    }
    load()
  }, [id])

  const handleAnswer = (questionId: string, optionIndex: number) => {
    if (result) return
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }))
  }

  const handleSubmitQuiz = async () => {
    if (!userId || !module) return
    const correct = questions.filter(q => answers[q.id] === q.correct_index).length
    const total = questions.length
    const passed = correct === total

    setSaving(true)

    // Upsert progression
    const attempts = (progression?.attempts || 0) + 1
    await supabase.from('progressions').upsert({
      animateur_id: userId,
      module_id: module.id,
      completed: passed,
      completed_at: passed ? new Date().toISOString() : null,
      attempts,
    }, { onConflict: 'animateur_id,module_id' })

    setProgression({ completed: passed, attempts })
    setResult({ correct, total, passed })
    setStep('result')
    setSaving(false)
  }

  const resetQuiz = () => {
    setAnswers({})
    setResult(null)
    setStep('quiz')
  }

  if (loading) return <div className="container"><div className="empty"><p>Chargement…</p></div></div>
  if (!module) return <div className="container"><div className="empty"><p>Module introuvable.</p></div></div>

  const titre = lang === 'en' && module.titre_en ? module.titre_en : module.titre
  const contenu = lang === 'en' && module.contenu_en ? module.contenu_en : module.contenu
  const allAnswered = questions.every(q => answers[q.id] !== undefined)

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <a href="/formation/modules" style={{ fontSize: 13, color: 'var(--text2)' }}>
              ← {lang === 'en' ? 'Modules' : 'Modules'}
            </a>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>{titre}</h1>
          {progression?.completed && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#E1F5EE', color: '#085041', border: '0.5px solid #5DCAA5', marginTop: 6 }}>
              🏅 {lang === 'en' ? 'Completed' : 'Module validé'}
            </span>
          )}
        </div>
        <LanguageSwitch />
      </div>

      {/* Navigation par étapes */}
      {step !== 'result' && (
        <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem' }}>
          {[
            { key: 'intro', label: lang === 'en' ? 'Overview' : 'Aperçu' },
            { key: 'contenu', label: lang === 'en' ? 'Content' : 'Contenu' },
            { key: 'quiz', label: 'Quiz' },
          ].map(s => (
            <div key={s.key}
              onClick={() => s.key !== 'quiz' || step === 'quiz' ? setStep(s.key as Step) : null}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                cursor: 'pointer',
                background: step === s.key ? 'var(--accent)' : 'var(--bg2)',
                color: step === s.key ? 'white' : 'var(--text2)',
                border: '0.5px solid ' + (step === s.key ? 'transparent' : 'var(--border)'),
              }}>
              {s.label}
            </div>
          ))}
        </div>
      )}

      {/* INTRO */}
      {step === 'intro' && (
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: '1rem' }}>
            {lang === 'en' ? 'About this module' : 'À propos de ce module'}
          </div>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            {lang === 'en' && module.description_en ? module.description_en : module.description || ''}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text2)' }}>
              <span>📝</span> {questions.length} {lang === 'en' ? 'quiz question(s)' : 'question(s) de quiz'}
            </div>
            {module.video_url && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text2)' }}>
                <span>🎥</span> {lang === 'en' ? 'Video available' : 'Vidéo disponible'}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--danger)' }}>
              <span>🎯</span> {lang === 'en' ? '100% required to validate' : '100% de bonnes réponses requis'}
            </div>
          </div>
          <hr className="divider" style={{ margin: '1.25rem 0' }} />
          <button className="btn btn-primary" onClick={() => setStep('contenu')} style={{ width: '100%' }}>
            {lang === 'en' ? 'Start module →' : 'Suivre le module →'}
          </button>
        </div>
      )}

      {/* CONTENU */}
      {step === 'contenu' && (
        <div>
          {/* Vidéo si disponible */}
          {module.video_url && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '0.75rem' }}>
                🎥 {lang === 'en' ? 'Summary video' : 'Vidéo résumé'}
              </div>
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 8, overflow: 'hidden', background: '#000' }}>
                <iframe
                  src={module.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Contenu texte */}
          {contenu && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '0.75rem' }}>
                📖 {lang === 'en' ? 'Module content' : 'Contenu du module'}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                {contenu}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
            <button className="btn" onClick={() => setStep('intro')}>← {lang === 'en' ? 'Back' : 'Retour'}</button>
            <button className="btn btn-primary" onClick={() => setStep('quiz')}>
              {lang === 'en' ? 'Take the quiz →' : 'Passer le quiz →'}
            </button>
          </div>
        </div>
      )}

      {/* QUIZ */}
      {step === 'quiz' && (
        <div>
          <div className="card" style={{ marginBottom: '1rem', background: 'var(--accent-bg)', border: '0.5px solid #AFA9EC' }}>
            <div style={{ fontSize: 13, color: 'var(--accent-text)', fontWeight: 500 }}>
              🎯 {lang === 'en' ? '100% of correct answers required to validate this module.' : '100% de bonnes réponses requis pour valider ce module.'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: '1.5rem' }}>
            {questions.map((q, qi) => {
              const question = lang === 'en' && q.question_en ? q.question_en : q.question
              const options = lang === 'en' && q.options_en ? q.options_en : q.options
              return (
                <div key={q.id} className="card">
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: '1rem' }}>
                    {qi + 1}. {question}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {options.map((opt, oi) => (
                      <div key={oi} onClick={() => handleAnswer(q.id, oi)}
                        style={{
                          padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                          fontSize: 14, lineHeight: 1.5,
                          border: answers[q.id] === oi ? '1.5px solid var(--accent)' : '0.5px solid var(--border)',
                          background: answers[q.id] === oi ? 'var(--accent-bg)' : 'var(--bg2)',
                          color: answers[q.id] === oi ? 'var(--accent-text)' : 'var(--text)',
                          transition: 'all .15s',
                        }}>
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
            <button className="btn" onClick={() => setStep('contenu')}>← {lang === 'en' ? 'Back to content' : 'Retour au contenu'}</button>
            <button className="btn btn-primary" disabled={!allAnswered || saving} onClick={handleSubmitQuiz}>
              {saving ? '…' : (lang === 'en' ? 'Submit my answers' : 'Valider mes réponses')}
            </button>
          </div>
        </div>
      )}

      {/* RÉSULTAT */}
      {step === 'result' && result && (
        <div>
          {result.passed ? (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', border: '1.5px solid #5DCAA5' }}>
              {/* Macaron */}
              <div style={{
                width: 100, height: 100, borderRadius: '50%', margin: '0 auto 1.25rem',
                background: 'linear-gradient(135deg, #085041, #5DCAA5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 44,
                boxShadow: '0 4px 20px rgba(8,80,65,0.35)',
              }}>
                🏅
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#085041', marginBottom: 8 }}>
                {lang === 'en' ? 'Module validated!' : 'Module validé !'}
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: '0.5rem' }}>
                {result.correct}/{result.total} {lang === 'en' ? 'correct answers' : 'bonnes réponses'} — 100% ✓
              </p>
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1.5rem' }}>
                {lang === 'en'
                  ? 'You have earned a badge for this module. It appears in your progress dashboard.'
                  : 'Vous avez obtenu un macaron pour ce module. Il apparaît dans votre tableau de bord de progression.'}
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="/formation/progression" className="btn btn-primary">
                  {lang === 'en' ? 'View my progress' : 'Voir ma progression'}
                </a>
                <a href="/formation/modules" className="btn">
                  {lang === 'en' ? 'Other modules' : 'Autres modules'}
                </a>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem', border: '1.5px solid var(--border2)' }}>
              <div style={{ fontSize: 44, marginBottom: '1rem' }}>😕</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                {lang === 'en' ? 'Not quite there yet…' : 'Pas encore…'}
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: '0.5rem' }}>
                {result.correct}/{result.total} {lang === 'en' ? 'correct answers' : 'bonnes réponses'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1.5rem' }}>
                {lang === 'en'
                  ? '100% is required. Review the content and try again!'
                  : '100% est requis pour valider le module. Révisez le contenu et réessayez !'}
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={resetQuiz}>
                  {lang === 'en' ? 'Try again' : 'Réessayer le quiz'}
                </button>
                <button className="btn" onClick={() => setStep('contenu')}>
                  {lang === 'en' ? 'Review content' : 'Revoir le contenu'}
                </button>
              </div>
            </div>
          )}

          {/* Récapitulatif des réponses */}
          {!result.passed && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem', color: 'var(--text2)' }}>
                {lang === 'en' ? 'Your answers:' : 'Vos réponses :'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {questions.map((q, qi) => {
                  const question = lang === 'en' && q.question_en ? q.question_en : q.question
                  const options = lang === 'en' && q.options_en ? q.options_en : q.options
                  const isCorrect = answers[q.id] === q.correct_index
                  return (
                    <div key={q.id} style={{
                      padding: '12px 14px', borderRadius: 10,
                      background: isCorrect ? '#E1F5EE' : '#FAECE7',
                      border: `0.5px solid ${isCorrect ? '#5DCAA5' : '#F0997B'}`,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                        {qi + 1}. {question}
                      </div>
                      <div style={{ fontSize: 12, color: isCorrect ? '#085041' : '#993C1D' }}>
                        {isCorrect ? '✓' : '✗'} {lang === 'en' ? 'Your answer:' : 'Votre réponse :'} <strong>{options[answers[q.id]]}</strong>
                      </div>
                      {!isCorrect && (
                        <div style={{ fontSize: 12, color: '#085041', marginTop: 3 }}>
                          ✓ {lang === 'en' ? 'Correct answer:' : 'Bonne réponse :'} <strong>{options[q.correct_index]}</strong>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
