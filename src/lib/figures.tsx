'use client'
import { QuestionFigure } from './types'

const dash = '#f7971e'      // the perpendicular height is always orange + dashed
const textC = '#e8eaf6'
const mutedC = '#8b93b8'

// Small right-angle square where the height meets the base
function RightAngle({ x, y }: { x: number; y: number }) {
  return <path d={`M ${x} ${y - 12} L ${x + 12} ${y - 12} L ${x + 12} ${y}`} fill="none" stroke={dash} strokeWidth={2} />
}

/**
 * Renders the diagram for a figure-based question.
 * The AI only supplies NUMBERS (base, height, slant, ...) — the shape itself is
 * drawn here with fixed geometry, so a figure can never come back malformed.
 * Labels carry the real measurements, which is why every figure says
 * "not drawn to scale".
 */
export function FigureSVG({ figure, accent = '#6c63ff' }: { figure: QuestionFigure; accent?: string }) {
  const u = figure.unit ? ` ${figure.unit}` : ''
  const label = (n?: number) => (n === undefined || n === null ? '' : `${n}${u}`)

  const stroke = accent
  const fillOpacity = 0.14
  const showH = figure.showHeight !== false

  const T = (x: number, y: number, text: string, anchor: 'start' | 'middle' | 'end' = 'middle', color = textC) => (
    <text x={x} y={y} textAnchor={anchor} fill={color} fontSize={14} fontWeight={700} fontFamily="system-ui">{text}</text>
  )

  let shape: React.ReactNode = null

  if (figure.type === 'parallelogram') {
    shape = (
      <>
        <polygon points="50,160 230,160 270,70 90,70" fill={accent} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" />
        {showH && figure.height !== undefined && (
          <>
            <line x1={90} y1={70} x2={90} y2={160} stroke={dash} strokeWidth={2.5} strokeDasharray="7 5" />
            <RightAngle x={90} y={160} />
            {T(60, 118, `h = ${label(figure.height)}`, 'end', dash)}
          </>
        )}
        {figure.base !== undefined && T(140, 184, `b = ${label(figure.base)}`, 'middle')}
        {figure.slant !== undefined && T(276, 118, label(figure.slant), 'start', mutedC)}
      </>
    )
  } else if (figure.type === 'triangle') {
    shape = (
      <>
        <polygon points="50,160 230,160 140,70" fill={accent} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" />
        {showH && figure.height !== undefined && (
          <>
            <line x1={140} y1={70} x2={140} y2={160} stroke={dash} strokeWidth={2.5} strokeDasharray="7 5" />
            <RightAngle x={140} y={160} />
            {T(86, 118, `h = ${label(figure.height)}`, 'end', dash)}
          </>
        )}
        {figure.base !== undefined && T(140, 184, `b = ${label(figure.base)}`, 'middle')}
        {figure.slant !== undefined && T(196, 104, label(figure.slant), 'start', mutedC)}
      </>
    )
  } else if (figure.type === 'rectangle') {
    shape = (
      <>
        <rect x={60} y={70} width={180} height={90} fill={accent} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={2.5} />
        {figure.base !== undefined && T(150, 184, label(figure.base), 'middle')}
        {figure.width !== undefined && T(252, 118, label(figure.width), 'start')}
      </>
    )
  } else if (figure.type === 'trapezoid') {
    shape = (
      <>
        <polygon points="50,160 260,160 220,70 100,70" fill={accent} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" />
        {figure.base2 !== undefined && T(160, 60, `b₁ = ${label(figure.base2)}`, 'middle')}
        {showH && figure.height !== undefined && (
          <>
            <line x1={100} y1={70} x2={100} y2={160} stroke={dash} strokeWidth={2.5} strokeDasharray="7 5" />
            <RightAngle x={100} y={160} />
            {T(66, 118, `h = ${label(figure.height)}`, 'end', dash)}
          </>
        )}
        {figure.base !== undefined && T(155, 184, `b₂ = ${label(figure.base)}`, 'middle')}
      </>
    )
  }

  if (figure.type === 'prism') {
    // Oblique rectangular prism: front face 160×90, depth offset (60, −45)
    shape = (
      <>
        {/* hidden back edges */}
        <path d="M 100 35 L 100 125 L 260 125 M 40 170 L 100 125" fill="none" stroke={stroke} strokeWidth={1.5} strokeDasharray="5 5" opacity={0.6} />
        {/* top + right faces */}
        <polygon points="40,80 200,80 260,35 100,35" fill={accent} fillOpacity={0.22} stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" />
        <polygon points="200,80 260,35 260,125 200,170" fill={accent} fillOpacity={0.08} stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" />
        {/* front face */}
        <rect x={40} y={80} width={160} height={90} fill={accent} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={2.5} />
        {figure.base !== undefined && T(120, 190, `l = ${label(figure.base)}`, 'middle')}
        {figure.height !== undefined && T(32, 130, `h = ${label(figure.height)}`, 'end')}
        {figure.width !== undefined && T(238, 164, `w = ${label(figure.width)}`, 'start')}
      </>
    )
  }

  if (!shape) return null

  return (
    <div style={{ background: '#22263a', border: '1px solid #2e3350', borderRadius: 14, padding: 16, marginBottom: 20 }}>
      <svg viewBox="-60 0 420 200" style={{ width: '100%', maxWidth: 420, display: 'block', margin: '0 auto' }} role="img"
        aria-label={`${figure.type} diagram`}>
        {shape}
      </svg>
      <div style={{ textAlign: 'center', fontSize: 11, color: mutedC, marginTop: 6 }}>
        {figure.caption ? `${figure.caption} · ` : ''}Figure not drawn to scale
      </div>
    </div>
  )
}
