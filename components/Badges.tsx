import React from 'react'

export const BADGES = [
  {
    key: 'badge_observateur',
    label: 'Observateur',
    description: 'A observé une fresque',
    icon: '👁',
    bg: '#E6F1FB',
    text: '#0C447C',
    border: '#85B7EB',
  },
  {
    key: 'badge_coanimateur',
    label: 'Co-animateur',
    description: 'A co-animé une fresque',
    icon: '⚡',
    bg: '#E1F5EE',
    text: '#085041',
    border: '#5DCAA5',
  },
]

interface BadgesDisplayProps {
  badge_observateur: boolean
  badge_coanimateur: boolean
  size?: 'sm' | 'md'
}

export function BadgesDisplay({ badge_observateur, badge_coanimateur, size = 'md' }: BadgesDisplayProps) {
  const active = BADGES.filter(b =>
    (b.key === 'badge_observateur' && badge_observateur) ||
    (b.key === 'badge_coanimateur' && badge_coanimateur)
  )
  if (!active.length) return null
  const pad = size === 'sm' ? '2px 8px' : '4px 12px'
  const fs = size === 'sm' ? '11px' : '13px'
  const iconSize = size === 'sm' ? '12px' : '14px'
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {active.map(b => (
        <span key={b.key} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: b.bg, color: b.text, border: `0.5px solid ${b.border}`,
          borderRadius: 20, padding: pad, fontSize: fs, fontWeight: 500,
        }}>
          <span style={{ fontSize: iconSize }}>{b.icon}</span>
          {b.label}
        </span>
      ))}
    </div>
  )
}

interface BadgesEditorProps {
  badge_observateur: boolean
  badge_coanimateur: boolean
  onChange: (key: string, value: boolean) => void
}

export function BadgesEditor({ badge_observateur, badge_coanimateur, onChange }: BadgesEditorProps) {
  const values: Record<string, boolean> = { badge_observateur, badge_coanimateur }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {BADGES.map(b => {
        const active = values[b.key]
        return (
          <div key={b.key} onClick={() => onChange(b.key, !active)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
              borderRadius: 'var(--radius-lg)', border: active ? `1.5px solid ${b.border}` : '0.5px solid var(--border)',
              background: active ? b.bg : 'var(--bg)', cursor: 'pointer', transition: 'all .15s',
            }}>
            <span style={{ fontSize: 24 }}>{b.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: active ? b.text : 'var(--text)' }}>{b.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{b.description}</div>
            </div>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              border: active ? `2px solid ${b.border}` : '1.5px solid var(--border2)',
              background: active ? b.text : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {active && <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>✓</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
