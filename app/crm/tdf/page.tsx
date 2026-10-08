'use client'
import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

type Region = { id: string; nom: string }
type AnimateurLight = { id: string; nom: string; photo_url: string | null; is_admin: boolean }
type TdfAnim = { id: string; region_id: string; animateur_id: string; role: string | null; animateur: AnimateurLight }
type Org = { id: string; region_id: string; nom: string; secteur: string | null; taille: string | null; referent_id: string | null; commentaire: string | null; statut: string; prospection_active: boolean; prospection_started_at: string | null; created_by: string; created_at: string; referent?: { nom: string } | null }
type Etape = { id: string; organisation_id: string; etape: number; label: string; statut: string; due_at: string | null; fait_at: string | null; notes: string | null; fait_par: string | null }
type Doc = { id: string; region_id: string | null; nom: string; file_url: string; file_name: string; is_global: boolean; uploaded_by: string; created_at: string }

const REGIONS: Region[] = [
  { id: 'idf', nom: 'Île-de-France' }, { id: 'hdf', nom: 'Hauts-de-France' },
  { id: 'nor', nom: 'Normandie' }, { id: 'bre', nom: 'Bretagne' },
  { id: 'pdl', nom: 'Pays de la Loire' }, { id: 'cen', nom: 'Centre-Val de Loire' },
  { id: 'ges', nom: 'Grand Est' }, { id: 'bfc', nom: 'Bourgogne-Franche-Comté' },
  { id: 'naq', nom: 'Nouvelle-Aquitaine' }, { id: 'ara', nom: 'Auvergne-Rhône-Alpes' },
  { id: 'occ', nom: 'Occitanie' }, { id: 'pac', nom: 'PACA' }, { id: 'cor', nom: 'Corse' },
]

const STATUTS: Record<string, { label: string; bg: string; color: string; border: string }> = {
  a_contacter: { label: 'À contacter', bg: '#F0F0F4', color: '#555', border: '#CCC' },
  contacte: { label: 'Contacté', bg: '#E6F1FB', color: '#0C447C', border: '#85B7EB' },
  rdv_fait: { label: 'RDV fait', bg: '#FAEEDA', color: '#633806', border: '#EF9F27' },
  accepte: { label: 'Accepté ✓', bg: '#D7FFB8', color: '#2B7400', border: '#58CC02' },
  refuse: { label: 'Refusé', bg: '#FFDFE0', color: '#CC0000', border: '#FF4B4B' },
}
const ETAPE_LABELS = ['1er mail de contact', 'Mail de relance', '2ème mail de relance', 'Mail de clôture']
const ETAPE_DELAIS = [0, 3, 6, 10]

// Carte France SVG — paths géographiquement précis, viewBox 0 0 660 780
const REGIONS_DATA: Record<string, { d: string; cx: number; cy: number; abbr: string }> = {
  hdf: {
    d: 'M344,44 L388,36 L442,34 L492,38 L524,44 L542,62 L536,84 L528,120 L518,144 L456,162 L406,158 L372,150 L350,138 L340,116 L336,88 L340,64 Z',
    cx: 434, cy: 98, abbr: 'Hauts-de-France'
  },
  nor: {
    d: 'M178,76 L224,62 L270,52 L310,48 L344,44 L340,64 L336,88 L340,116 L350,138 L372,150 L368,172 L338,188 L298,204 L260,210 L226,206 L194,192 L170,168 L162,148 L172,120 L174,100 Z',
    cx: 264, cy: 136, abbr: 'Normandie'
  },
  bre: {
    d: 'M58,172 L102,160 L142,156 L172,162 L178,172 L194,192 L192,218 L186,248 L168,278 L146,298 L114,312 L78,304 L50,280 L36,254 L34,228 L44,208 L52,190 Z',
    cx: 128, cy: 234, abbr: 'Bretagne'
  },
  idf: {
    d: 'M372,150 L408,158 L432,156 L458,162 L464,180 L466,202 L452,220 L426,230 L396,232 L368,222 L354,206 L354,182 L368,172 Z',
    cx: 410, cy: 192, abbr: 'Île-de-France'
  },
  ges: {
    d: 'M456,162 L518,144 L528,120 L536,84 L542,62 L558,64 L582,74 L614,92 L638,118 L650,152 L648,184 L638,226 L618,262 L590,282 L558,294 L530,282 L508,258 L494,234 L488,212 L474,198 L466,202 L464,180 L458,162 Z',
    cx: 554, cy: 196, abbr: 'Grand Est'
  },
  pdl: {
    d: 'M172,162 L194,192 L192,218 L186,248 L188,270 L196,282 L228,292 L260,302 L284,302 L312,294 L332,272 L342,250 L340,228 L340,206 L338,188 L298,204 L260,210 L226,206 L194,192 Z',
    cx: 234, cy: 272, abbr: 'Pays de la Loire'
  },
  cen: {
    d: 'M338,188 L368,172 L354,182 L354,206 L368,222 L396,232 L426,230 L452,220 L466,202 L474,198 L488,212 L494,234 L496,262 L480,290 L456,306 L422,314 L388,316 L356,308 L334,294 L332,272 L342,250 L340,228 L340,206 Z',
    cx: 410, cy: 264, abbr: 'Centre-Val de Loire'
  },
  bfc: {
    d: 'M456,162 L464,180 L466,202 L488,212 L494,234 L508,258 L530,282 L558,294 L590,282 L618,262 L638,226 L648,184 L650,152 L638,118 L614,92 L582,74 L558,64 L542,62 L536,84 L528,120 L518,144 L456,162 Z',
    cx: 548, cy: 284, abbr: 'Bourgogne-FC'
  },
  naq: {
    d: 'M196,282 L228,292 L260,302 L284,302 L312,294 L334,294 L356,308 L354,330 L350,360 L344,390 L336,418 L318,448 L294,468 L268,476 L238,472 L208,462 L184,444 L162,416 L148,390 L136,358 L130,326 L134,298 L148,278 L168,268 L188,270 Z',
    cx: 250, cy: 388, abbr: 'Nouvelle-Aquitaine'
  },
  ara: {
    d: 'M494,262 L508,258 L530,282 L558,294 L590,282 L616,296 L634,318 L638,348 L626,378 L610,406 L588,428 L568,446 L546,458 L520,464 L496,458 L474,446 L458,428 L448,406 L446,380 L450,358 L454,336 L458,314 L462,294 L480,290 L496,262 Z',
    cx: 536, cy: 374, abbr: 'Auvergne-Rhône-Alpes'
  },
  occ: {
    d: 'M336,418 L354,330 L356,308 L388,316 L422,314 L456,306 L462,294 L458,314 L454,336 L450,358 L446,380 L448,406 L438,430 L416,458 L390,474 L362,482 L334,484 L308,478 L286,468 L268,476 L294,468 L318,448 Z',
    cx: 386, cy: 430, abbr: 'Occitanie'
  },
  pac: {
    d: 'M458,428 L474,446 L496,458 L520,464 L546,458 L566,456 L580,464 L584,482 L568,498 L546,508 L520,512 L494,508 L468,500 L450,486 L440,466 L438,444 L438,430 L448,406 L458,428 Z',
    cx: 514, cy: 472, abbr: 'PACA'
  },
  cor: {
    d: 'M580,520 L594,504 L610,496 L624,498 L636,514 L636,538 L626,558 L610,572 L594,576 L580,566 L572,548 L572,532 Z',
    cx: 604, cy: 536, abbr: 'Corse'
  },
}

function FranceMap({ selected, counts, onSelect }: { selected: string | null; counts: Record<string, number>; onSelect: (id: string) => void }) {
  const [hovered, setHovered] = React.useState<string | null>(null)

  // Contour global France pour clipPath et ombre
  const FRANCE_OUTLINE = 'M344,44 L388,36 L442,34 L492,38 L524,44 L542,62 L558,64 L582,74 L614,92 L638,118 L650,152 L648,184 L638,226 L618,262 L590,282 L558,294 L530,282 L508,258 L494,234 L496,262 L480,290 L456,306 L458,314 L454,336 L450,358 L446,380 L448,406 L438,430 L416,458 L390,474 L362,482 L334,484 L308,478 L286,468 L268,476 L294,468 L318,448 L336,418 L344,390 L350,360 L354,330 L356,308 L388,316 L422,314 L462,294 L462,294 L432,282 L388,316 L356,308 L334,294 L332,272 L342,250 L340,228 L340,206 L338,188 L298,204 L260,210 L226,206 L194,192 L192,218 L186,248 L188,270 L196,282 L196,282 L168,268 L148,278 L134,298 L130,326 L136,358 L148,390 L162,416 L184,444 L208,462 L238,472 L268,476 L286,468 L268,476 L238,472 L208,462 L184,444 L162,416 L148,390 L136,358 L130,326 L134,298 L148,278 L168,268 L196,282 L228,292 L260,302 L284,302 L312,294 L332,272 L340,228 L340,206 L338,188 L368,172 L354,182 L354,206 L368,222 L396,232 L426,230 L452,220 L466,202 L488,212 L494,234 L508,258 L530,282 L558,294 L590,282 L618,262 L638,226 L648,184 L650,152 L638,118 L614,92 L582,74 L558,64 L542,62 L524,44 L492,38 L442,34 L388,36 L344,44 L340,64 L336,88 L340,116 L350,138 L372,150 L368,172 L338,188 L298,204 L260,210 L226,206 L194,192 L172,162 L172,162 L178,172 L194,192 L192,218 L186,248 L188,270 L168,268 L148,278 L134,298 L130,326 L148,390 L162,416 L208,462 L268,476 L318,448 L336,418 L344,390 L354,330 L388,316 L456,306 L480,290 L496,262 L494,234 L508,258 L530,282 Z'

  // Contour simplifié pour clipPath
  const CLIP = 'M344,44 L524,44 L558,64 L650,152 L638,226 L590,282 L508,258 L496,262 L456,306 L446,380 L438,430 L390,474 L334,484 L268,476 L130,326 L134,298 L168,268 L188,270 L196,282 L312,294 L332,272 L340,206 L338,188 L298,204 L226,206 L194,192 L172,162 L140,156 L90,174 L52,190 L36,228 L52,278 L114,312 L168,278 L188,270 L130,326 L162,416 L268,476 L334,484 Z M572,520 L592,502 L620,498 L636,516 L634,550 L614,572 L590,574 L572,556 L566,536 Z'

  // Nœuds pour le réseau low-poly (distribués sur France)
  const NODES: [number, number][] = [
    [344,44],[442,34],[524,44],[558,64],[582,74],[614,92],[638,118],[650,152],[648,184],[638,226],
    [618,262],[590,282],[558,294],[530,282],[508,258],[494,234],[480,290],[456,306],[446,380],
    [438,430],[416,458],[390,474],[362,482],[334,484],[308,478],[268,476],[238,472],[208,462],
    [184,444],[162,416],[148,390],[136,358],[130,326],[134,298],[148,278],[168,268],[196,282],
    [228,292],[260,302],[312,294],[332,272],[340,228],[338,188],[298,204],[260,210],[226,206],
    [194,192],[172,162],[140,156],[90,174],[52,190],[36,228],[52,278],[114,312],
    // Nœuds intérieurs
    [404,100],[460,130],[520,180],[580,200],[560,240],[500,210],[450,160],
    [380,150],[350,140],[310,120],[290,80],[370,80],
    [280,200],[340,180],[400,200],[440,240],[490,280],[460,250],[400,240],
    [350,220],[300,240],[260,260],[220,270],[300,300],[360,290],[420,300],
    [470,330],[440,360],[400,350],[360,340],[320,350],[280,360],[240,350],
    [200,360],[170,340],[200,300],[240,310],[280,330],[320,310],[360,280],
    [400,260],[440,280],[470,260],[490,240],[460,200],[420,180],[380,200],
    [340,260],[300,280],[260,300],[220,320],[190,310],[160,300],[180,270],
    [380,400],[340,420],[310,440],[360,460],[400,430],[430,400],[450,420],
    [470,380],[490,350],[500,380],[460,440],[420,456],[380,468],
    [604,536],[592,504],[618,496],[634,518],[632,548],[612,570],[590,572],[574,554],[568,534]
  ]

  // Triangles pour le réseau low-poly (arêtes reliant les nœuds)
  const EDGES: [number,number][] = [
    [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,14],
    [14,15],[15,16],[16,17],[17,18],[18,19],[19,20],[20,21],[21,22],[22,23],[23,24],[24,25],[25,26],
    [26,27],[27,28],[28,29],[29,30],[30,31],[31,32],[32,33],[33,34],[34,35],[35,36],[36,37],[37,38],
    [38,39],[39,40],[40,41],[41,42],[42,43],[43,44],[44,45],[45,46],[46,47],[47,48],[48,49],[49,50],
    [50,51],[51,52],[52,53],[0,53],[53,47],[52,36],[51,48],[50,49],
    // Lignes intérieures vers nœuds centraux
    [0,54],[54,55],[55,56],[56,57],[57,58],[58,59],[59,60],[60,61],[61,62],[62,63],
    [54,63],[55,64],[64,65],[65,66],[66,67],[67,68],[68,69],[69,70],[70,71],[71,72],
    [72,73],[73,74],[74,75],[75,76],[76,77],[77,78],[78,79],[79,80],[80,81],[81,82],
    [82,83],[83,84],[84,85],[85,86],[86,87],[87,88],[88,89],[89,90],[90,91],[91,92],
    [92,93],[93,94],[94,95],[95,96],[96,97],[97,98],[98,99],[99,100],[100,101],[101,102],
    [54,62],[55,60],[56,59],[57,67],[58,66],[60,70],[61,71],[62,72],[63,61],
    [64,72],[65,73],[66,74],[67,75],[68,76],[69,77],[70,78],[71,79],[72,80],
    [73,81],[74,82],[75,83],[76,84],[77,85],[78,86],[79,87],[80,88],[81,89],
    [82,90],[83,91],[84,92],[85,93],[86,94],[87,95],[88,96],[89,97],[90,98],
    [54,1],[55,2],[56,6],[57,7],[58,8],[59,9],[60,10],[61,11],[54,48],
    [103,104],[104,105],[105,106],[106,107],[107,108],[108,109],[109,110],[110,103]
  ]

  const getRegionColor = (id: string) => {
    if (selected === id) return '#534AB7'
    if (hovered === id) return 'rgba(100,85,210,0.35)'
    const n = counts[id] || 0
    return n > 0 ? 'rgba(59,130,246,0.18)' : 'rgba(220,225,240,0.55)'
  }

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 520 }}>
      <svg viewBox="40 30 650 580" style={{ width: '100%', filter: 'drop-shadow(0 12px 32px rgba(83,74,183,0.18))' }}>
        <defs>
          {/* Fond dégradé radial */}
          <radialGradient id="bgGrad" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#F0F4FF"/>
            <stop offset="100%" stopColor="#D8E4F0"/>
          </radialGradient>
          {/* Dégradé surface carte */}
          <linearGradient id="mapGrad" x1="0%" y1="0%" x2="60%" y2="100%">
            <stop offset="0%" stopColor="#F5F7FF"/>
            <stop offset="100%" stopColor="#E2E8F4"/>
          </linearGradient>
          {/* Ombre portée */}
          <linearGradient id="shadowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8898C0" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#8898C0" stopOpacity="0"/>
          </linearGradient>
          {/* clipPath France */}
          <clipPath id="franceClip">
            <path d="M344,44 L524,44 L558,64 L614,92 L650,152 L648,184 L638,226 L618,262 L590,282 L558,294 L508,258 L494,234 L480,290 L456,306 L446,380 L438,430 L390,474 L334,484 L268,476 L208,462 L162,416 L130,326 L148,278 L196,282 L312,294 L332,272 L340,206 L298,204 L226,206 L172,162 L140,156 L90,174 L36,228 L52,278 L114,312 L168,278 L196,282 L130,326 L162,416 L268,476 L334,484 Z"/>
          </clipPath>
          <clipPath id="corseClip">
            <path d="M572,520 L592,502 L624,496 L638,516 L636,550 L612,574 L588,574 L568,552 L564,532 Z"/>
          </clipPath>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>

        {/* Fond global */}
        <rect x="30" y="20" width="680" height="610" fill="url(#bgGrad)" rx="16"/>

        {/* Ombre portée 3D (décalée vers le bas-droite) */}
        <path d="M350,58 L530,58 L564,78 L618,106 L656,166 L654,198 L644,240 L624,276 L596,296 L564,308 L514,272 L500,248 L486,304 L462,320 L452,394 L444,444 L396,488 L340,498 L274,490 L214,476 L168,430 L136,340 L154,292 L202,296 L318,308 L338,286 L346,220 L304,218 L232,220 L178,176 L146,170 L96,188 L42,242 L58,292 L120,326 L174,292 L202,296 L136,340 L168,430 L274,490 L340,498 Z"
          fill="url(#shadowGrad)" transform="translate(8,18)" opacity="0.6"/>

        {/* Surface principale France */}
        <path d="M344,44 L524,44 L558,64 L614,92 L650,152 L648,184 L638,226 L618,262 L590,282 L558,294 L508,258 L494,234 L480,290 L456,306 L446,380 L438,430 L390,474 L334,484 L268,476 L208,462 L162,416 L130,326 L148,278 L196,282 L312,294 L332,272 L340,206 L298,204 L226,206 L172,162 L140,156 L90,174 L36,228 L52,278 L114,312 L168,278 L196,282 L130,326 L162,416 L268,476 L334,484 Z"
          fill="url(#mapGrad)" stroke="#C8D4E8" strokeWidth="1.5"/>

        {/* Réseau triangulaire low-poly — lignes bleues */}
        <g clipPath="url(#franceClip)" opacity="0.7">
          {EDGES.filter(([a,b]) => a < NODES.length && b < NODES.length && a >= 0 && b >= 0).map(([a,b], i) => {
            const [x1,y1] = NODES[a] || [0,0]
            const [x2,y2] = NODES[b] || [0,0]
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3B82F6" strokeWidth="0.7" opacity="0.55"/>
          })}
          {/* Petits points aux nœuds */}
          {NODES.slice(0,54).map(([cx,cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="1.8" fill="#3B82F6" opacity="0.6"/>
          ))}
        </g>

        {/* Régions cliquables (overlay semi-transparent) */}
        {Object.entries(REGIONS_DATA).filter(([id]) => id !== 'cor').map(([id, { d, cx, cy, abbr }]) => {
          const sel = selected === id
          const hov = hovered === id
          const n = counts[id] || 0
          return (
            <g key={id} onClick={() => onSelect(id)} onMouseEnter={() => setHovered(id)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
              <path d={d} fill={getRegionColor(id)} stroke={sel ? '#534AB7' : hov ? '#7B72D4' : 'rgba(83,74,183,0.25)'} strokeWidth={sel ? 2 : 1} strokeLinejoin="round" style={{ transition: 'all .18s' }}/>
              {/* Badge nombre d'orgs */}
              {(n > 0 || sel) && (
                <g>
                  <circle cx={cx} cy={cy - 10} r={12} fill={sel ? '#534AB7' : '#3B82F6'} opacity={sel ? 1 : 0.85}/>
                  {n > 0 && <text x={cx} y={cy - 6} textAnchor="middle" fontSize="10" fill="white" fontWeight="800">{n}</text>}
                  {sel && n === 0 && <text x={cx} y={cy - 6} textAnchor="middle" fontSize="9" fill="white" fontWeight="800">✓</text>}
                </g>
              )}
              {/* Label région */}
              <text x={cx} y={cy + (n > 0 || sel ? 6 : 2)} textAnchor="middle"
                fontSize={abbr.length > 14 ? 7 : abbr.length > 10 ? 8 : 9}
                fill={sel ? '#3C3489' : '#2C3E6B'}
                fontWeight={sel ? '800' : '600'}
                style={{ pointerEvents: 'none', userSelect: 'none', transition: 'all .15s' }}
              >{abbr}</text>
            </g>
          )
        })}

        {/* Bord extérieur France */}
        <path d="M344,44 L524,44 L558,64 L614,92 L650,152 L648,184 L638,226 L618,262 L590,282 L558,294 L508,258 L494,234 L480,290 L456,306 L446,380 L438,430 L390,474 L334,484 L268,476 L208,462 L162,416 L130,326 L148,278 L196,282 L312,294 L332,272 L340,206 L298,204 L226,206 L172,162 L140,156 L90,174 L36,228 L52,278 L114,312 L168,278 L196,282 L130,326 L162,416 L268,476 L334,484 Z"
          fill="none" stroke="#8898C0" strokeWidth="2" strokeLinejoin="round"/>

        {/* Corse */}
        <g>
          {/* Ombre Corse */}
          <path d="M572,520 L592,502 L624,496 L638,516 L636,550 L612,574 L588,574 L568,552 L564,532 Z"
            fill="url(#shadowGrad)" transform="translate(6,14)" opacity="0.5"/>
          {/* Surface Corse */}
          <path d="M572,520 L592,502 L624,496 L638,516 L636,550 L612,574 L588,574 L568,552 L564,532 Z"
            fill="url(#mapGrad)" stroke="#C8D4E8" strokeWidth="1.5"/>
          {/* Réseau Corse */}
          <g clipPath="url(#corseClip)" opacity="0.7">
            <line x1="572" y1="520" x2="624" y2="496" stroke="#3B82F6" strokeWidth="0.7" opacity="0.55"/>
            <line x1="624" y1="496" x2="638" y2="516" stroke="#3B82F6" strokeWidth="0.7" opacity="0.55"/>
            <line x1="572" y1="520" x2="638" y2="516" stroke="#3B82F6" strokeWidth="0.7" opacity="0.55"/>
            <line x1="572" y1="520" x2="612" y2="574" stroke="#3B82F6" strokeWidth="0.7" opacity="0.55"/>
            <line x1="638" y1="516" x2="636" y2="550" stroke="#3B82F6" strokeWidth="0.7" opacity="0.55"/>
            <line x1="636" y1="550" x2="612" y2="574" stroke="#3B82F6" strokeWidth="0.7" opacity="0.55"/>
            <line x1="612" y1="574" x2="568" y2="552" stroke="#3B82F6" strokeWidth="0.7" opacity="0.55"/>
            <line x1="572" y1="520" x2="636" y2="550" stroke="#3B82F6" strokeWidth="0.7" opacity="0.55"/>
            <circle cx="572" cy="520" r="1.8" fill="#3B82F6" opacity="0.6"/>
            <circle cx="624" cy="496" r="1.8" fill="#3B82F6" opacity="0.6"/>
            <circle cx="638" cy="516" r="1.8" fill="#3B82F6" opacity="0.6"/>
            <circle cx="636" cy="550" r="1.8" fill="#3B82F6" opacity="0.6"/>
            <circle cx="612" cy="574" r="1.8" fill="#3B82F6" opacity="0.6"/>
          </g>
          {/* Corse cliquable */}
          <path d="M572,520 L592,502 L624,496 L638,516 L636,550 L612,574 L588,574 L568,552 L564,532 Z"
            fill={getRegionColor('cor')}
            stroke={selected === 'cor' ? '#534AB7' : hovered === 'cor' ? '#7B72D4' : 'rgba(83,74,183,0.25)'}
            strokeWidth={selected === 'cor' ? 2 : 1}
            onClick={() => onSelect('cor')}
            onMouseEnter={() => setHovered('cor')}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer', transition: 'all .18s' }}/>
          <text x="604" y="538" textAnchor="middle" fontSize="8" fill={selected === 'cor' ? '#3C3489' : '#2C3E6B'} fontWeight={selected === 'cor' ? '800' : '600'} style={{ pointerEvents: 'none' }}>Corse</text>
          {counts['cor'] > 0 && (
            <g>
              <circle cx="604" cy="522" r="11" fill={selected === 'cor' ? '#534AB7' : '#3B82F6'} opacity="0.85"/>
              <text x="604" y="526" textAnchor="middle" fontSize="9" fill="white" fontWeight="800">{counts['cor']}</text>
            </g>
          )}
        </g>

        {/* Drapeau FR en bas gauche */}
        <g transform="translate(52,570)">
          <rect x="0" y="0" width="36" height="24" rx="3" fill="white" stroke="#ddd" strokeWidth="0.5"/>
          <rect x="0" y="0" width="12" height="24" rx="3" fill="#002395"/>
          <rect x="0" y="0" width="12" height="24" fill="#002395"/>
          <rect x="12" y="0" width="12" height="24" fill="white"/>
          <rect x="24" y="0" width="12" height="24" rx="3" fill="#ED2939"/>
          <rect x="24" y="0" width="12" height="24" fill="#ED2939"/>
          <rect x="0" y="0" width="36" height="24" rx="3" fill="none" stroke="#C8D4E8" strokeWidth="0.8"/>
        </g>
        <text x="96" y="587" fontSize="11" fill="#4A5568" fontWeight="700">France</text>

        {/* Légende */}
        <g transform="translate(52,608)">
          <circle cx="6" cy="6" r="5" fill="#3B82F6" opacity="0.8"/>
          <text x="14" y="10" fontSize="9" fill="#6B7A99">Cliquez sur une région</text>
        </g>
      </svg>
    </div>
  )
}


export default function TDFPage() {
  const supabase = createClient()
  const [me, setMe] = useState<AnimateurLight | null>(null)
  const [allAnims, setAllAnims] = useState<AnimateurLight[]>([])
  const [tdfAnims, setTdfAnims] = useState<TdfAnim[]>([])
  const [orgs, setOrgs] = useState<Org[]>([])
  const [etapes, setEtapes] = useState<Etape[]>([])
  const [docs, setDocs] = useState<Doc[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [tab, setTab] = useState<'equipe' | 'crm' | 'docs'>('equipe')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [myRole, setMyRole] = useState('')
  const [showOrgForm, setShowOrgForm] = useState(false)
  const [orgForm, setOrgForm] = useState({ nom: '', secteur: '', taille: '', referent_id: '', commentaire: '' })
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null)
  const [etapeNotes, setEtapeNotes] = useState<Record<string, string>>({})
  const [docUploading, setDocUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const fileGlobalRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { window.location.href = '/crm'; return }

        const [{ data: meData, error: e1 }, { data: animData }, { data: tdfData, error: e2 }, { data: orgData, error: e3 }, { data: docData, error: e4 }] = await Promise.all([
          supabase.from('animateurs').select('id,nom,photo_url,is_admin').eq('id', user.id).single(),
          supabase.from('animateurs').select('id,nom,photo_url,is_admin').order('nom'),
          supabase.from('tdf_animateurs').select('*,animateur:animateurs(id,nom,photo_url,is_admin)'),
          supabase.from('tdf_organisations').select('*,referent:animateurs(nom)').order('created_at', { ascending: false }),
          supabase.from('tdf_documents').select('*').order('created_at', { ascending: false }),
        ])

        if (e2) console.error('tdf_animateurs:', e2.message)
        if (e3) console.error('tdf_organisations:', e3.message)
        if (e4) console.error('tdf_documents:', e4.message)
        // Vérification stricte uniquement si relation absente
        if (e2?.code === '42P01' || e3?.code === '42P01') {
          setError('Tables manquantes (code 42P01). Exécutez SQL_TDF.sql. Détail : ' + (e2?.message || e3?.message))
          setLoading(false); return
        }
        setMe(meData)
        setAllAnims(animData || [])
        setTdfAnims((tdfData as TdfAnim[]) || [])
        setOrgs((orgData as Org[]) || [])
        setDocs(docData || [])
      } catch (err) {
        setError('Erreur de chargement. Vérifiez que le SQL_TDF.sql a bien été exécuté.')
      }
      setLoading(false)
    }
    init()
  }, [])

  const reg = REGIONS.find(r => r.id === selected)
  const regAnims = tdfAnims.filter(a => a.region_id === selected)
  const regOrgs = orgs.filter(o => o.region_id === selected)
  const regDocs = docs.filter(d => d.region_id === selected || d.is_global)
  const isMember = regAnims.some(a => a.animateur_id === me?.id)
  const orgCounts = orgs.reduce((acc, o) => ({ ...acc, [o.region_id]: (acc[o.region_id] || 0) + 1 }), {} as Record<string, number>)

  const joinRegion = async () => {
    if (!me || !selected) return
    setSaving(true)
    const { data, error } = await supabase.from('tdf_animateurs').insert({ region_id: selected, animateur_id: me.id, role: myRole || null }).select('*,animateur:animateurs(id,nom,photo_url,is_admin)').single()
    if (!error && data) setTdfAnims(prev => [...prev, data as TdfAnim])
    setSaving(false); setMyRole('')
  }

  const leaveRegion = async () => {
    if (!me || !selected || !confirm('Se désinscrire de cette région ?')) return
    await supabase.from('tdf_animateurs').delete().eq('region_id', selected).eq('animateur_id', me.id)
    setTdfAnims(prev => prev.filter(a => !(a.region_id === selected && a.animateur_id === me.id)))
  }

  const addOrg = async () => {
    if (!me || !selected || !orgForm.nom.trim()) return
    setSaving(true)
    const payload = { nom: orgForm.nom, secteur: orgForm.secteur || null, taille: orgForm.taille || null, referent_id: orgForm.referent_id || null, commentaire: orgForm.commentaire || null, region_id: selected, created_by: me.id }
    const { data, error } = await supabase.from('tdf_organisations').insert(payload).select('*,referent:animateurs(nom)').single()
    if (!error && data) setOrgs(prev => [data as Org, ...prev])
    setOrgForm({ nom: '', secteur: '', taille: '', referent_id: '', commentaire: '' })
    setShowOrgForm(false); setSaving(false)
  }

  const startProspection = async (org: Org) => {
    const now = new Date()
    const rows = ETAPE_LABELS.map((label, i) => {
      const due = new Date(now); due.setDate(due.getDate() + ETAPE_DELAIS[i])
      return { organisation_id: org.id, etape: i + 1, label, due_at: due.toISOString(), statut: 'en_attente', fait_at: null, notes: null, fait_par: null }
    })
    await supabase.from('tdf_etapes').upsert(rows, { onConflict: 'organisation_id,etape' })
    await supabase.from('tdf_organisations').update({ prospection_active: true, prospection_started_at: now.toISOString(), statut: 'contacte' }).eq('id', org.id)
    setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, prospection_active: true, statut: 'contacte', prospection_started_at: now.toISOString() } : o))
    setEtapes(prev => [...prev.filter(e => e.organisation_id !== org.id), ...rows.map((r, i) => ({ ...r, id: `tmp-${i}` }))])
    setExpandedOrg(org.id)
    // Reload real etapes
    const { data } = await supabase.from('tdf_etapes').select('*').eq('organisation_id', org.id).order('etape')
    if (data) setEtapes(prev => [...prev.filter(e => e.organisation_id !== org.id), ...data])
  }

  const validateEtape = async (etape: Etape, statut: string) => {
    if (!me) return
    const update = { statut, fait_at: statut === 'fait' ? new Date().toISOString() : null, fait_par: me.id, notes: etapeNotes[etape.id] || etape.notes }
    await supabase.from('tdf_etapes').update(update).eq('id', etape.id)
    setEtapes(prev => prev.map(e => e.id === etape.id ? { ...e, ...update } : e))
  }

  const changeStatut = async (orgId: string, statut: string) => {
    await supabase.from('tdf_organisations').update({ statut }).eq('id', orgId)
    setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, statut } : o))
  }

  const deleteOrg = async (org: Org) => {
    if (!confirm(`Supprimer "${org.nom}" ?`)) return
    await supabase.from('tdf_organisations').delete().eq('id', org.id)
    setOrgs(prev => prev.filter(o => o.id !== org.id))
  }

  const uploadDoc = async (file: File, isGlobal: boolean) => {
    if (!me) return
    setDocUploading(true)
    const path = `${selected || 'global'}/${Date.now()}_${file.name}`
    const { data: up, error: upErr } = await supabase.storage.from('tdf-docs').upload(path, file, { upsert: true })
    if (!upErr && up) {
      const { data: urlData } = supabase.storage.from('tdf-docs').getPublicUrl(path)
      const { data: doc } = await supabase.from('tdf_documents').insert({ region_id: isGlobal ? null : selected, nom: file.name.replace(/\.[^.]+$/, ''), file_url: urlData.publicUrl, file_name: file.name, is_global: isGlobal, uploaded_by: me.id }).select().single()
      if (doc) setDocs(prev => [doc, ...prev])
    }
    setDocUploading(false)
  }

  const deleteDoc = async (doc: Doc) => {
    if (!confirm(`Supprimer "${doc.nom}" ?`)) return
    await supabase.from('tdf_documents').delete().eq('id', doc.id)
    setDocs(prev => prev.filter(d => d.id !== doc.id))
  }

  const daysLate = (etape: Etape) => {
    if (!etape.due_at || etape.statut === 'fait') return 0
    return Math.max(0, Math.floor((Date.now() - new Date(etape.due_at).getTime()) / 86400000))
  }

  if (loading) return <div className="container"><div className="empty"><p>Chargement du Tour de France…</p></div></div>

  if (error) return (
    <div className="container">
      <div className="card" style={{ background: '#FFDFE0', border: '1.5px solid #FF4B4B', marginTop: 24 }}>
        <div style={{ fontWeight: 700, color: '#CC0000', marginBottom: 8 }}>⚠️ Configuration requise</div>
        <p style={{ fontSize: 13, color: '#990000', lineHeight: 1.6, margin: 0 }}>{error}</p>
      </div>
      <a href="/crm" className="btn" style={{ marginTop: 16, display: 'inline-flex' }}>← Retour au CRM</a>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7' }}>
      <style>{`
        .tdf-tab{padding:9px 14px;border:none;background:none;cursor:pointer;font-weight:600;font-size:13px;border-bottom:2.5px solid transparent;color:#888;transition:all .15s}
        .tdf-tab.act{border-bottom-color:#534AB7;color:#534AB7}
        @keyframes slideIn{from{transform:translateX(30px);opacity:0}to{transform:translateX(0);opacity:1}}
      `}</style>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E5E5', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', top: 0, zIndex: 30 }}>
        <a href="/crm" style={{ color: '#888', fontSize: 18, textDecoration: 'none', fontWeight: 700 }}>←</a>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: '#1a1a2e' }}>🗺️ Tour de France — Fresque de l'IA</div>
          <div style={{ fontSize: 11, color: '#888' }}>Cliquez sur une région pour gérer l'équipe et la prospection</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#888' }}>
            <span>👥 {tdfAnims.length}</span>
            <span>🏢 {orgs.length}</span>
            <span style={{ color: '#2B7400' }}>✅ {orgs.filter(o => o.statut === 'accepte').length}</span>
          </div>
          {me?.is_admin && (
            <label style={{ display: 'flex', gap: 6, padding: '6px 12px', background: '#534AB7', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', alignItems: 'center' }}>
              {docUploading ? '⏳' : '+ Doc global'}
              <input ref={fileGlobalRef} type="file" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadDoc(e.target.files[0], true) }}/>
            </label>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
        {/* Colonne carte */}
        <div style={{ width: selected ? 420 : '100%', transition: 'width .3s', padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <FranceMap selected={selected} counts={orgCounts} onSelect={id => { setSelected(s => s === id ? null : id); setTab('equipe'); setExpandedOrg(null) }}/>
          <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#888' }}>
            <span>⬜ Sans activité</span>
            <span style={{ color: '#0C447C' }}>🔵 Organisations ({orgs.length})</span>
            <span style={{ color: '#534AB7' }}>🟣 Sélectionnée</span>
          </div>
          {!selected && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%', maxWidth: 420 }}>
              {[
                { icon: '👥', val: tdfAnims.length, label: 'Animateurs inscrits' },
                { icon: '🏢', val: orgs.length, label: 'Organisations' },
                { icon: '✅', val: orgs.filter(o => o.statut === 'accepte').length, label: 'Acceptées' },
              ].map(s => (
                <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: '12px', textAlign: 'center', border: '1px solid #E5E5E5' }}>
                  <div style={{ fontSize: 20 }}>{s.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: '#534AB7' }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: '#888', lineHeight: 1.3, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panneau région */}
        {selected && reg && (
          <div style={{ flex: 1, background: 'white', borderLeft: '1px solid #E5E5E5', display: 'flex', flexDirection: 'column', animation: 'slideIn .2s ease', minWidth: 0 }}>
            {/* En-tête panneau */}
            <div style={{ padding: '14px 18px 0', borderBottom: '1px solid #E5E5E5', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#1a1a2e' }}>{reg.nom}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{regAnims.length} animateur(s) · {regOrgs.length} organisation(s)</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
              <div style={{ display: 'flex' }}>
                {([['equipe', `👥 Équipe (${regAnims.length})`], ['crm', `🏢 Prospection (${regOrgs.length})`], ['docs', `📄 Docs (${regDocs.length})`]] as const).map(([t, label]) => (
                  <button key={t} className={`tdf-tab${tab === t ? ' act' : ''}`} onClick={() => setTab(t)}>{label}</button>
                ))}
              </div>
            </div>

            {/* Corps panneau */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>

              {/* ── ÉQUIPE ── */}
              {tab === 'equipe' && (
                <div>
                  {!isMember ? (
                    <div style={{ background: '#EEEDFE', borderRadius: 14, padding: '14px', marginBottom: 14 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#534AB7', marginBottom: 8 }}>Rejoindre cette région</div>
                      <input value={myRole} onChange={e => setMyRole(e.target.value)} placeholder="Rôle optionnel (Coordinateur, Contact local...)" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #AFA9EC', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }}/>
                      <button onClick={joinRegion} disabled={saving} style={{ padding: '8px 16px', background: '#534AB7', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        {saving ? '...' : "M'inscrire sur cette région"}
                      </button>
                    </div>
                  ) : (
                    <div style={{ background: '#E1F5EE', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#085041', fontWeight: 600 }}>✓ Vous êtes inscrit sur cette région</span>
                      <button onClick={leaveRegion} style={{ fontSize: 11, color: '#CC0000', background: 'none', border: 'none', cursor: 'pointer' }}>Se désinscrire</button>
                    </div>
                  )}
                  {regAnims.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#888', fontSize: 13, padding: 24 }}>Aucun animateur inscrit</div>
                  ) : regAnims.map(ta => {
                    const a = ta.animateur
                    const initials = a.nom.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
                    return (
                      <div key={ta.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', background: '#F8F8F8', borderRadius: 12, border: '0.5px solid #E5E5E5', marginBottom: 8 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EEEDFE', color: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0, overflow: 'hidden' }}>
                          {a.photo_url ? <img src={a.photo_url} alt={a.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : initials}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{a.nom}</div>
                          {ta.role && <div style={{ fontSize: 11, color: '#888' }}>{ta.role}</div>}
                        </div>
                        {a.is_admin && <span style={{ fontSize: 10, background: '#534AB7', color: 'white', padding: '2px 6px', borderRadius: 20, fontWeight: 700 }}>Admin</span>}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── CRM / PROSPECTION ── */}
              {tab === 'crm' && (
                <div>
                  {/* Compteurs statuts */}
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                    {Object.entries(STATUTS).map(([k, s]) => {
                      const n = regOrgs.filter(o => o.statut === k).length
                      return n > 0 ? (
                        <span key={k} style={{ padding: '3px 9px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 11, fontWeight: 600 }}>{s.label} {n}</span>
                      ) : null
                    })}
                  </div>

                  <button onClick={() => setShowOrgForm(v => !v)} style={{ width: '100%', padding: '9px', borderRadius: 10, border: '1.5px dashed #AFA9EC', background: showOrgForm ? '#EEEDFE' : 'white', color: '#534AB7', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 12 }}>
                    {showOrgForm ? '× Fermer' : '+ Ajouter une organisation'}
                  </button>

                  {showOrgForm && (
                    <div style={{ background: '#F8F9FF', borderRadius: 14, padding: '14px', border: '1.5px solid #AFA9EC', marginBottom: 14 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#534AB7', marginBottom: 3 }}>Nom *</div>
                          <input value={orgForm.nom} onChange={e => setOrgForm(f => ({ ...f, nom: e.target.value }))} placeholder="CHU Lyon, Renault..." style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E5E5E5', fontSize: 13, boxSizing: 'border-box' }}/>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 3 }}>Secteur</div>
                            <input value={orgForm.secteur} onChange={e => setOrgForm(f => ({ ...f, secteur: e.target.value }))} placeholder="Santé, Industrie..." style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E5E5E5', fontSize: 13, boxSizing: 'border-box' }}/>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 3 }}>Taille</div>
                            <select value={orgForm.taille} onChange={e => setOrgForm(f => ({ ...f, taille: e.target.value }))} style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E5E5E5', fontSize: 13 }}>
                              <option value="">—</option>
                              <option value="micro">&lt; 50</option>
                              <option value="pme">50–500</option>
                              <option value="eti">500–2000</option>
                              <option value="grand">&gt; 2000</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 3 }}>Référent</div>
                          <select value={orgForm.referent_id} onChange={e => setOrgForm(f => ({ ...f, referent_id: e.target.value }))} style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E5E5E5', fontSize: 13 }}>
                            <option value="">Non assigné</option>
                            {regAnims.map(ta => <option key={ta.animateur_id} value={ta.animateur_id}>{ta.animateur.nom}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 3 }}>Commentaire</div>
                          <textarea value={orgForm.commentaire} onChange={e => setOrgForm(f => ({ ...f, commentaire: e.target.value }))} rows={2} placeholder="Contexte, contact..." style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E5E5E5', fontSize: 13, resize: 'none', boxSizing: 'border-box' }}/>
                        </div>
                        <button onClick={addOrg} disabled={saving || !orgForm.nom.trim()} style={{ alignSelf: 'flex-start', padding: '7px 16px', background: orgForm.nom.trim() ? '#534AB7' : '#E5E5E5', color: orgForm.nom.trim() ? 'white' : '#aaa', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: orgForm.nom.trim() ? 'pointer' : 'default' }}>
                          {saving ? '...' : 'Ajouter →'}
                        </button>
                      </div>
                    </div>
                  )}

                  {regOrgs.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#888', fontSize: 13, padding: 24 }}>Aucune organisation pour cette région</div>
                  ) : regOrgs.map(org => {
                    const st = STATUTS[org.statut] || STATUTS.a_contacter
                    const orgEtapes = etapes.filter(e => e.organisation_id === org.id).sort((a, b) => a.etape - b.etape)
                    const isExp = expandedOrg === org.id
                    const canDelete = me?.is_admin || org.created_by === me?.id
                    return (
                      <div key={org.id} style={{ borderRadius: 14, border: `1.5px solid ${st.border}`, background: 'white', overflow: 'hidden', marginBottom: 10 }}>
                        <div style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{org.nom}</div>
                              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                                {org.secteur && <span style={{ fontSize: 10, background: '#F0F0F4', color: '#555', padding: '2px 7px', borderRadius: 20 }}>{org.secteur}</span>}
                                {org.referent && <span style={{ fontSize: 10, background: '#EEEDFE', color: '#534AB7', padding: '2px 7px', borderRadius: 20 }}>👤 {org.referent.nom}</span>}
                              </div>
                              {org.commentaire && <div style={{ fontSize: 11, color: '#888', marginTop: 4, lineHeight: 1.4 }}>{org.commentaire}</div>}
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                              <select value={org.statut} onChange={e => changeStatut(org.id, e.target.value)} style={{ padding: '3px 8px', borderRadius: 20, border: `1px solid ${st.border}`, background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                {Object.entries(STATUTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                              </select>
                              {canDelete && <button onClick={() => deleteOrg(org)} style={{ fontSize: 10, color: '#CC0000', background: 'none', border: 'none', cursor: 'pointer' }}>supprimer</button>}
                            </div>
                          </div>
                          <div style={{ marginTop: 10 }}>
                            {!org.prospection_active ? (
                              <button onClick={() => startProspection(org)} style={{ padding: '6px 12px', background: '#58CC02', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>🚀 Lancer la prospection</button>
                            ) : (
                              <button onClick={async () => { setExpandedOrg(isExp ? null : org.id); if (!isExp) { const { data } = await supabase.from('tdf_etapes').select('*').eq('organisation_id', org.id).order('etape'); if (data) setEtapes(prev => [...prev.filter(e => e.organisation_id !== org.id), ...data]) } }} style={{ padding: '6px 12px', background: '#E6F1FB', color: '#0C447C', border: '1px solid #85B7EB', borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                                {isExp ? '▲ Masquer' : `▼ Suivi (${orgEtapes.filter(e => e.statut === 'fait').length}/4)`}
                              </button>
                            )}
                          </div>
                        </div>
                        {isExp && org.prospection_active && (
                          <div style={{ borderTop: '1px solid #F0F0F0', background: '#FAFAFA', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {ETAPE_LABELS.map((label, i) => {
                              const etape = orgEtapes.find(e => e.etape === i + 1)
                              if (!etape) return <div key={i} style={{ fontSize: 11, color: '#aaa', padding: '6px 0' }}>{i + 1}. {label} — chargement...</div>
                              const late = daysLate(etape)
                              const done = etape.statut === 'fait'
                              return (
                                <div key={etape.id} style={{ padding: '10px 12px', background: done ? '#E1F5EE' : 'white', borderRadius: 10, border: `1.5px solid ${done ? '#5DCAA5' : late > 0 ? '#FF4B4B' : '#E5E5E5'}` }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: done ? 4 : 8 }}>
                                    <div style={{ fontWeight: 700, fontSize: 12, color: done ? '#085041' : '#1a1a2e' }}>{done ? '✓ ' : `${i + 1}. `}{label}</div>
                                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                                      {late > 0 && !done && <span style={{ fontSize: 9, background: '#FF4B4B', color: 'white', padding: '2px 6px', borderRadius: 20, fontWeight: 700 }}>{late}j retard</span>}
                                      {etape.due_at && <span style={{ fontSize: 9, color: '#888' }}>Prévu: {new Date(etape.due_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>}
                                    </div>
                                  </div>
                                  {done ? (
                                    <div style={{ fontSize: 10, color: '#085041' }}>Fait le {new Date(etape.fait_at!).toLocaleDateString('fr-FR')}{etape.notes ? ` · ${etape.notes}` : ''}</div>
                                  ) : (
                                    <div>
                                      <input value={etapeNotes[etape.id] || ''} onChange={e => setEtapeNotes(p => ({ ...p, [etape.id]: e.target.value }))} placeholder="Note optionnelle..." style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #E5E5E5', fontSize: 11, marginBottom: 6, boxSizing: 'border-box' }}/>
                                      <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => validateEtape(etape, 'fait')} style={{ padding: '5px 10px', background: '#58CC02', color: 'white', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>✓ Envoyé</button>
                                        <button onClick={() => validateEtape(etape, 'skip')} style={{ padding: '5px 10px', background: '#F0F0F0', color: '#888', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>Passer</button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── DOCUMENTS ── */}
              {tab === 'docs' && (
                <div>
                  {(isMember || me?.is_admin) && (
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', background: '#F8F9FF', border: '1.5px dashed #AFA9EC', borderRadius: 12, textAlign: 'center', cursor: 'pointer', marginBottom: 14, fontSize: 13, color: '#534AB7', fontWeight: 700, gap: 6 }}>
                      {docUploading ? '⏳ Upload...' : '+ Ajouter un document pour cette région'}
                      <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadDoc(e.target.files[0], false) }}/>
                    </label>
                  )}
                  {regDocs.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#888', fontSize: 13, padding: 24 }}>Aucun document disponible</div>
                  ) : regDocs.map(doc => (
                    <div key={doc.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', background: '#F8F8F8', borderRadius: 12, border: '0.5px solid #E5E5E5', marginBottom: 8 }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>
                        {/\.pdf$/i.test(doc.file_name) ? '📄' : /\.(doc|docx)$/i.test(doc.file_name) ? '📝' : /\.(xls|xlsx)$/i.test(doc.file_name) ? '📊' : /\.(jpg|jpeg|png|gif)$/i.test(doc.file_name) ? '🖼️' : '📁'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nom}</div>
                        <div style={{ fontSize: 10, color: '#888' }}>
                          {doc.is_global ? '🌍 Global' : '📍 Région'} · {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 10px', background: '#534AB7', color: 'white', borderRadius: 6, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>Ouvrir</a>
                        {(me?.is_admin || doc.uploaded_by === me?.id) && (
                          <button onClick={() => deleteDoc(doc)} style={{ padding: '5px 8px', background: 'none', border: '1px solid #FFDFE0', color: '#CC0000', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>×</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
