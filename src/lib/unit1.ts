// ── Unit 1 (Area & Surface Area) — practice generators ─────────────
// These questions are built in CODE, not by the AI: the numbers, the diagram and
// the worked solution all come from the same calculation, so the answer key cannot
// be wrong. Numeric answers can also be asked as type-ins (no choices to guess).
// School: White Oak Math 6, Amplify Desmos Math Unit 1 (district assessment 9/29).
// Questions are generated from code (not AI) so every answer is guaranteed correct,
// and each comes with an SVG diagram drawn from the same numbers.

import type { Question } from './types'

export const SCHOOL_TOPIC = 'area_figures' // Unit 1 / MD skill bucket in types.ts

const C = {
  fill: '#00d4ff18', stroke: '#00d4ff', height: '#f7971e', text: '#e8eaf6', muted: '#8b93b8', grid: '#2e3350',
}

const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const fmt = (n: number) => String(Math.round(n * 100) / 100)
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

// Right-triangle side sets (height, horizontal offset, slanted side) so the slanted side is a whole number.
const TRIPLES: [number, number, number][] = [
  [4, 3, 5], [8, 6, 10], [12, 5, 13], [12, 9, 15], [8, 15, 17], [6, 8, 10], [3, 4, 5], [5, 12, 13],
]

/** A single plain number like "60 sq cm" or "$96.00" can also be typed in instead of picked. */
export function asEntry(right: string): Question['entry'] {
  const m = /^\$?(\d+(?:\.\d+)?)\s*(.*)$/.exec(right.trim())
  if (!m) return undefined
  const rest = m[2].trim()
  if (/\d/.test(rest)) return undefined // more than one number in the answer — keep it multiple choice
  return { value: parseFloat(m[1]), unit: rest || undefined, label: right }
}

/** Build a 4-choice question. `wrong` = common-mistake answers; duplicates are replaced. */
function build(q: Omit<Question, 'choices' | 'correct' | 'topic' | 'testType'>, right: string, wrong: string[], fillers: string[] = []): Question {
  const opts: string[] = [right]
  for (const w of [...wrong, ...fillers]) { if (opts.length < 4 && !opts.includes(w)) opts.push(w) }
  let bump = 1
  while (opts.length < 4) { const f = `${fmt(parseFloat(right) + bump * 2)}${right.replace(/^[-\d.]+/, '')}`; if (!opts.includes(f)) opts.push(f); bump++ }
  const order = shuffle(opts)
  const letters = ['A', 'B', 'C', 'D']
  const correct = order.indexOf(right)
  return {
    entry: asEntry(right),
    ...q,
    topic: SCHOOL_TOPIC,
    testType: 'school' as Question['testType'],
    choices: order.map((c, i) => `${letters[i]}. ${c}`),
    correct,
    explanation: `${q.explanation} The answer is ${letters[correct]}. ${right}.`,
  }
}

// ── SVG helpers ─────────────────────────────────────────────────
function svgWrap(inner: string, w = 340, h = 212) {
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:420px" xmlns="http://www.w3.org/2000/svg" font-family="system-ui" font-size="14">${inner}</svg>`
}
const label = (x: number, y: number, t: string, color = C.text, anchor = 'middle') =>
  `<text x="${x}" y="${y}" fill="${color}" text-anchor="${anchor}" font-weight="700">${t}</text>`

/** Keep diagrams readable: real proportions, clamped so nothing gets too flat or too slanted. */
function visual(b: number, h: number, off: number) {
  const W = 200 // drawn base width
  const H = Math.max(70, Math.min(120, (h / b) * W))
  const O = Math.max(0.2 * W, Math.min(0.45 * W, (off / b) * W))
  return { W, H, O }
}
const NOTE = label(330, 205, 'not drawn to scale', C.muted, 'end').replace('font-weight="700"', 'font-size="11"')

/** Parallelogram with base along the bottom, top shifted right. Labels are optional strings. */
function paraSvg(b: number, h: number, off: number, labels: { base?: string; side?: string; height?: string; top?: string } = {}) {
  const { W, H, O } = visual(b, h, off)
  const x0 = 60, yB = 170
  const P = [[x0, yB], [x0 + W, yB], [x0 + W + O, yB - H], [x0 + O, yB - H]]
  const hx = x0 + O
  let s = `<polygon points="${P.map(p => p.join(',')).join(' ')}" fill="${C.fill}" stroke="${C.stroke}" stroke-width="2.5"/>`
  if (labels.height) {
    s += `<line x1="${hx}" y1="${yB - H}" x2="${hx}" y2="${yB}" stroke="${C.height}" stroke-width="2" stroke-dasharray="6 4"/>`
    s += `<polyline points="${hx},${yB - 10} ${hx + 10},${yB - 10} ${hx + 10},${yB}" fill="none" stroke="${C.height}" stroke-width="1.5"/>`
    s += label(hx + 14, yB - H / 2 + 5, labels.height, C.height, 'start')
  }
  if (labels.base) s += label(x0 + W / 2, yB + 22, labels.base)
  if (labels.top) s += label(x0 + O + W / 2, yB - H - 10, labels.top)
  if (labels.side) s += label(x0 + O / 2 - 8, yB - H / 2 + 5, labels.side, C.text, 'end')
  return svgWrap(s + NOTE)
}

function triSvg(b: number, h: number, off: number, labels: { base: string; height: string }) {
  const { W, H, O } = visual(b, h, off)
  const x0 = 60, yB = 170
  const apex = [x0 + O, yB - H]
  let s = `<polygon points="${x0},${yB} ${x0 + W},${yB} ${apex.join(',')}" fill="${C.fill}" stroke="${C.stroke}" stroke-width="2.5"/>`
  s += `<line x1="${apex[0]}" y1="${apex[1]}" x2="${apex[0]}" y2="${yB}" stroke="${C.height}" stroke-width="2" stroke-dasharray="6 4"/>`
  s += `<polyline points="${apex[0]},${yB - 10} ${apex[0] + 10},${yB - 10} ${apex[0] + 10},${yB}" fill="none" stroke="${C.height}" stroke-width="1.5"/>`
  s += label(apex[0] + 14, yB - H / 2 + 5, labels.height, C.height, 'start')
  s += label(x0 + W / 2, yB + 22, labels.base)
  return svgWrap(s + NOTE)
}

// ── Generators ──────────────────────────────────────────────────
type Gen = () => Question

// 1. Basic area — the slanted side is the classic trap.
const areaBasic: Gen = () => {
  const [h, off, s] = pick(TRIPLES)
  const b = rnd(off + 3, off + 12)
  const u = pick(['cm', 'in', 'ft', 'm'])
  return build({
    subtopic: 'Area of a parallelogram',
    question: `A parallelogram has a base of ${b} ${u}, a slanted side of ${s} ${u}, and a height of ${h} ${u}. What is its area?`,
    diagram: paraSvg(b, h, off, { base: `${b} ${u}`, side: `${s} ${u}`, height: `${h} ${u}` }),
    explanation: `Area of a parallelogram = base × height. The height is the dashed line that makes a right angle with the base — NOT the slanted side. ${b} × ${h} = ${b * h}. The ${s} ${u} slanted side is extra information.`,
  }, `${b * h} sq ${u}`, [`${b * s} sq ${u}`, `${fmt((b * h) / 2)} sq ${u}`, `${2 * (b + s)} sq ${u}`, `${b + h} sq ${u}`])
}

// 2. Which two measurements?
const whichMeasurements: Gen = () => {
  const [h, off, s] = pick(TRIPLES)
  const b = rnd(off + 4, off + 10)
  return build({
    subtopic: 'Finding the height',
    question: `To find the area of this parallelogram, which two measurements should you multiply?`,
    diagram: paraSvg(b, h, off, { base: `${b}`, side: `${s}`, height: `${h}` }),
    explanation: `You multiply the base by the height. The height must be perpendicular (a right angle, the little square) to the base. Here that is the dashed ${h}, not the slanted ${s}. Base × height = ${b} × ${h}.`,
  }, `${b} and ${h}`, [`${b} and ${s}`, `${s} and ${h}`, `${b}, ${s}, and ${h}`])
}

// 3. Missing height.
const missingHeight: Gen = () => {
  const b = rnd(5, 16), h = rnd(3, 12), A = b * h
  const u = pick(['cm', 'in', 'ft', 'm'])
  return build({
    subtopic: 'Missing height',
    question: `A parallelogram has an area of ${A} square ${u} and a base of ${b} ${u}. What is its height?`,
    diagram: paraSvg(b, h, Math.max(2, Math.round(b / 3)), { base: `${b} ${u}`, height: `? ${u}` }),
    explanation: `Area = base × height, so ${A} = ${b} × h. Work backwards by dividing: h = ${A} ÷ ${b} = ${h}. Check: ${b} × ${h} = ${A} ✓.`,
  }, `${h} ${u}`, [`${A - b} ${u}`, `${fmt((2 * A) / b)} ${u}`, `${fmt(A / b / 2)} ${u}`, `${A + b} ${u}`])
}

// 4. Missing base (decimals allowed for the advanced kids).
const missingBase: Gen = () => {
  const h = pick([4, 5, 6, 8, 10])
  const b = pick([6.5, 7.5, 8.5, 9, 12, 13.5, 14])
  const A = b * h
  const u = pick(['cm', 'ft', 'm'])
  return build({
    subtopic: 'Missing base',
    question: `The area of a parallelogram is ${fmt(A)} square ${u}. Its height is ${h} ${u}. How long is its base?`,
    diagram: paraSvg(b, h, Math.max(2, b / 3), { base: `? ${u}`, height: `${h} ${u}` }),
    explanation: `Area = base × height, so ${fmt(A)} = b × ${h}. Divide both sides by ${h}: b = ${fmt(A)} ÷ ${h} = ${fmt(b)}.`,
  }, `${fmt(b)} ${u}`, [`${fmt(A - h)} ${u}`, `${fmt((2 * A) / h)} ${u}`, `${fmt(b / 2)} ${u}`, `${fmt(b + 1)} ${u}`])
}

// 5. Same parallelogram, other base–height pair (advanced; common on Unit 1 assessments).
const otherPair: Gen = () => {
  const sets: [number, number, number, number][] = [ // [base1, height1, base2, height2]
    [10, 6, 12, 5], [12, 4, 8, 6], [15, 8, 12, 10], [9, 8, 12, 6], [16, 6, 12, 8], [10, 9, 15, 6], [14, 6, 12, 7], [20, 6, 15, 8],
  ]
  const [b1, h1, b2, h2] = pick(sets)
  const off = Math.min(Math.sqrt(Math.max(b2 * b2 - h1 * h1, 1)), b1 - 2)
  return build({
    subtopic: 'Two base–height pairs',
    question: `A parallelogram has sides of ${b1} cm and ${b2} cm. The height to the ${b1} cm side is ${h1} cm. What is the height to the ${b2} cm side?`,
    diagram: paraSvg(b1, h1, off, { base: `${b1} cm`, side: `${b2} cm`, height: `${h1} cm` }),
    explanation: `Any side can be the base — the area stays the same. Area = ${b1} × ${h1} = ${b1 * h1} sq cm. Now use the other side as the base: ${b2} × h = ${b1 * h1}, so h = ${b1 * h1} ÷ ${b2} = ${h2} cm.`,
  }, `${h2} cm`, [`${h1} cm`, `${b1 * h1} cm`, `${fmt((b2 * h1) / b1)} cm`, `${b1} cm`])
}

// 6. Triangle = half a parallelogram.
const triangleHalf: Gen = () => {
  const b = pick([6, 8, 10, 12, 14, 9, 7]), h = pick([4, 5, 6, 8, 10, 3])
  const u = pick(['cm', 'in', 'm'])
  return build({
    subtopic: 'Triangles are half a parallelogram',
    question: `Two copies of this triangle fit together to make a parallelogram. The triangle has a base of ${b} ${u} and a height of ${h} ${u}. What is the area of the triangle?`,
    diagram: triSvg(b, h, Math.round(b * 0.35), { base: `${b} ${u}`, height: `${h} ${u}` }),
    explanation: `Two identical triangles make a parallelogram with area ${b} × ${h} = ${b * h}. One triangle is half of that: ${b * h} ÷ 2 = ${fmt((b * h) / 2)}. So Area of a triangle = ½ × base × height.`,
  }, `${fmt((b * h) / 2)} sq ${u}`, [`${b * h} sq ${u}`, `${b + h} sq ${u}`, `${2 * b * h} sq ${u}`])
}

// 7. Coordinate plane (uses negatives — matches their 7th-grade-level work).
const coordinates: Gen = () => {
  const x1 = rnd(-6, -1), y1 = rnd(-5, -1), b = rnd(4, 8), h = rnd(3, 7), off = rnd(1, 3)
  const pts = [[x1, y1], [x1 + b, y1], [x1 + b + off, y1 + h], [x1 + off, y1 + h]]
  const names = ['A', 'B', 'C', 'D']
  const list = pts.map((p, i) => `${names[i]}(${p[0]}, ${p[1]})`).join(', ')
  return build({
    subtopic: 'Parallelograms on the coordinate plane',
    question: `A parallelogram has vertices ${list}. What is its area in square units?`,
    explanation: `Side AB is horizontal, so it is the base: from x = ${x1} to x = ${x1 + b} is ${b} units. The height is the vertical distance from y = ${y1} up to y = ${y1 + h}: ${y1 + h} − (${y1}) = ${h} units. Area = ${b} × ${h} = ${b * h}.`,
  }, `${b * h} square units`, [`${fmt((b * h) / 2)} square units`, `${(b + off) * h} square units`, `${b * (h + off)} square units`, `${2 * (b + h)} square units`])
}

// 8. Word problem with money (multi-step).
const wordProblem: Gen = () => {
  const b = pick([7.5, 6, 9, 12.5, 8]), h = pick([4, 6, 8]), s = h + pick([1, 2, 3]), price = pick([2.5, 3.2, 4, 1.75])
  const A = b * h, cost = A * price
  const thing = pick([
    { what: 'garden bed', mat: 'sod' }, { what: 'patio', mat: 'paving stone' }, { what: 'mural section', mat: 'paint' },
  ])
  return build({
    subtopic: 'Area word problem',
    question: `A ${thing.what} is shaped like a parallelogram. Its base is ${fmt(b)} m, its slanted side is ${s} m, and its height is ${h} m. ${thing.mat[0].toUpperCase() + thing.mat.slice(1)} costs $${price.toFixed(2)} per square meter. How much will it cost to cover the whole ${thing.what}?`,
    diagram: paraSvg(b, h, Math.max(1.5, Math.sqrt(s * s - h * h)), { base: `${fmt(b)} m`, side: `${s} m`, height: `${h} m` }),
    explanation: `Step 1: Area = base × height = ${fmt(b)} × ${h} = ${fmt(A)} sq m (ignore the ${s} m slanted side). Step 2: Cost = ${fmt(A)} × $${price.toFixed(2)} = $${cost.toFixed(2)}.`,
  }, `$${cost.toFixed(2)}`, [`$${(b * s * price).toFixed(2)}`, `$${(A * price / 2).toFixed(2)}`, `$${A.toFixed(2)}`, `$${((b + h) * price).toFixed(2)}`])
}

// 9. Concept checks (static, hand-written).
const CONCEPTS: { q: string; right: string; wrong: string[]; why: string }[] = [
  {
    q: 'Two parallelograms both have a base of 9 cm and a height of 5 cm. One leans far to the right and the other barely leans. How do their areas compare?',
    right: 'They have the same area',
    wrong: ['The one that leans more has more area', 'The one that leans more has less area', 'You need the slanted sides to know'],
    why: 'Area only depends on base × height. Both are 9 × 5 = 45 sq cm, no matter how much they lean. Cutting off the triangle on one end and sliding it over turns either one into the same 9 × 5 rectangle.',
  },
  {
    q: 'Why does "base × height" work for a parallelogram?',
    right: 'You can cut off a triangle and move it to make a rectangle with the same base and height',
    wrong: ['Because a parallelogram is always a rectangle', 'Because you multiply all the sides together', 'Because the slanted side equals the height'],
    why: 'Cut a right triangle off one end and slide it to the other end. The pieces rearrange into a rectangle with the same base and height, and rearranging does not change area.',
  },
  {
    q: 'Which statement about the HEIGHT of a parallelogram is always true?',
    right: 'It is perpendicular (makes a right angle) to the base',
    wrong: ['It is one of the sides', 'It is always inside the shape', 'It is the longest segment in the shape'],
    why: 'The height is the perpendicular distance between the base and the opposite side. It is often NOT a side, and for a very slanted parallelogram it can even be drawn outside the shape.',
  },
  {
    q: 'A rectangle is 8 in by 5 in. Its sides are pushed over (keeping the 8 in base and 5 in sides) to make a slanted parallelogram. What happens to the area?',
    right: 'It gets smaller, because the height is now less than 5 in',
    wrong: ['It stays 40 sq in', 'It gets bigger', 'It stays the same because the sides did not change'],
    why: 'The 5 in sides are now slanted, so the perpendicular height is shorter than 5 in. Area = 8 × (height less than 5), which is less than 40. Same side lengths do NOT mean the same area.',
  },
  {
    q: 'A parallelogram has an area of 48 sq ft. Which could NOT be its base and height?',
    right: 'base 7 ft, height 7 ft',
    wrong: ['base 12 ft, height 4 ft', 'base 6 ft, height 8 ft', 'base 16 ft, height 3 ft'],
    why: 'Base × height must equal 48. 12×4 = 48, 6×8 = 48, 16×3 = 48, but 7×7 = 49.',
  },
]
const conceptCheck: Gen = () => {
  const c = pick(CONCEPTS)
  return build({ subtopic: 'Concept check', question: c.q, explanation: c.why }, c.right, c.wrong)
}

const PARALLELOGRAM_GENS: Gen[] = [areaBasic, whichMeasurements, missingHeight, missingBase, otherPair, triangleHalf, coordinates, wordProblem, conceptCheck]


// ══ More Unit 1 types, matching the district assessment / end-of-unit review ══

// ── Extra SVG helpers ───────────────────────────────────────────
/** A label with a dark chip behind it, so it stays readable on top of a shape. */
function chip(x: number, y: number, t: string, color = C.text, anchor = 'middle') {
  const w = t.length * 8 + 10
  const dx = anchor === 'start' ? 0 : anchor === 'end' ? -w : -w / 2
  return `<rect x="${x + dx}" y="${y - 13}" width="${w}" height="18" rx="5" fill="#1a1d27" opacity="0.9"/>` + label(x, y, t, color, anchor)
}

/** Obtuse triangle: the height lands OUTSIDE the base (homework Q1). */
function obtuseTriSvg(b: number, h: number, out: number, labels: { base: string; height: string; outside?: string; side?: string; hyp?: string }) {
  const k = Math.min(215 / (b + out), 115 / h)
  const xFoot = 75, yB = 165
  const B1 = [xFoot + out * k, yB], B2 = [B1[0] + b * k, yB], apex = [xFoot, yB - h * k]
  let s = `<polygon points="${B1.join(',')} ${B2.join(',')} ${apex.join(',')}" fill="${C.fill}" stroke="${C.stroke}" stroke-width="2.5"/>`
  s += `<line x1="${xFoot}" y1="${yB}" x2="${B1[0]}" y2="${yB}" stroke="${C.muted}" stroke-width="1.5" stroke-dasharray="4 4"/>`
  s += `<line x1="${xFoot}" y1="${apex[1]}" x2="${xFoot}" y2="${yB}" stroke="${C.height}" stroke-width="2" stroke-dasharray="6 4"/>`
  s += `<polyline points="${xFoot},${yB - 10} ${xFoot + 10},${yB - 10} ${xFoot + 10},${yB}" fill="none" stroke="${C.height}" stroke-width="1.5"/>`
  s += label(xFoot - 10, yB - (h * k) / 2, labels.height, C.height, 'end')
  s += label((B1[0] + B2[0]) / 2, yB + 24, labels.base)
  if (labels.outside) s += label((xFoot + B1[0]) / 2, yB + 24, labels.outside, C.muted)
  if (labels.side) s += chip((apex[0] + B1[0]) / 2 + 8, (apex[1] + yB) / 2 + 12, labels.side, C.muted, 'start')
  if (labels.hyp) s += chip((apex[0] + B2[0]) / 2 + 18, (apex[1] + yB) / 2 - 12, labels.hyp, C.muted, 'start')
  return svgWrap(s + NOTE, 340, 205)
}

/** Rectangle with a triangular notch cut out of the bottom — on grid paper (Q4) or plain (Q7). */
function notchedSvg(W: number, H: number, nb: number, nh: number, grid: boolean, labels: { top: string; side: string; notch: string; notchBase?: string }) {
  const cw = grid ? Math.min(30, 230 / W, 150 / H) : 190 / W
  const ch = grid ? cw : 150 / H
  const x0 = 60, y0 = 34, w = W * cw, h = H * ch
  const midL = x0 + (w - nb * cw) / 2, midR = midL + nb * cw, midX = (midL + midR) / 2
  let s = ''
  if (grid) {
    for (let i = 0; i <= W; i++) s += `<line x1="${x0 + i * cw}" y1="${y0}" x2="${x0 + i * cw}" y2="${y0 + h}" stroke="${C.grid}" stroke-width="1"/>`
    for (let j = 0; j <= H; j++) s += `<line x1="${x0}" y1="${y0 + j * ch}" x2="${x0 + w}" y2="${y0 + j * ch}" stroke="${C.grid}" stroke-width="1"/>`
  }
  const pts = [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [midR, y0 + h], [midX, y0 + h - nh * ch], [midL, y0 + h], [x0, y0 + h]]
  s += `<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="${C.fill}" stroke="${C.stroke}" stroke-width="2.5"/>`
  s += label(x0 + w / 2, y0 - 12, labels.top)
  s += label(x0 + w + 12, y0 + h / 2, labels.side, C.text, 'start')
  s += `<line x1="${midX}" y1="${y0 + h - nh * ch}" x2="${midX}" y2="${y0 + h}" stroke="${C.height}" stroke-width="2"/>`
  s += chip(midX + 10, y0 + h - (nh * ch) / 2 + 5, labels.notch, C.height, 'start')
  if (labels.notchBase) { 
    s += `<line x1="${midL}" y1="${y0 + h + 12}" x2="${midR}" y2="${y0 + h + 12}" stroke="${C.height}" stroke-width="1.5" stroke-dasharray="4 3"/>`
    s += label(midX, y0 + h + 30, labels.notchBase, C.height)
  }
  return svgWrap(s, 340, y0 + h + (labels.notchBase ? 42 : 22))
}

/** Rectangular prism drawn in 3D (homework Q5). */
function prismSvg(l: number, w: number, hh: number, u = 'cm') {
  const k = Math.min(180 / l, 90 / hh, 70 / w)
  const L = l * k, H = hh * k, D = w * k * 0.7
  const x0 = 70, y0 = 60 + D
  const F = [[x0, y0], [x0 + L, y0], [x0 + L, y0 + H], [x0, y0 + H]]
  let s = `<polygon points="${F.map(p => p.join(',')).join(' ')}" fill="${C.fill}" stroke="${C.stroke}" stroke-width="2.5"/>`
  s += `<polygon points="${x0},${y0} ${x0 + D},${y0 - D} ${x0 + L + D},${y0 - D} ${x0 + L},${y0}" fill="#00d4ff10" stroke="${C.stroke}" stroke-width="2"/>`
  s += `<polygon points="${x0 + L},${y0} ${x0 + L + D},${y0 - D} ${x0 + L + D},${y0 + H - D} ${x0 + L},${y0 + H}" fill="#00d4ff10" stroke="${C.stroke}" stroke-width="2"/>`
  s += label(x0 + L / 2, y0 + H + 22, `${l} ${u}`)
  s += label(x0 - 10, y0 + H / 2 + 5, `${hh} ${u}`, C.text, 'end')
  s += label(x0 + L + D + 10, y0 + H - D / 2 + 14, `${w} ${u}`, C.text, 'start')
  return svgWrap(s, 340, y0 + H + 34)
}

/** Net of a square pyramid: square with a triangle on each side (homework Q6). */
function pyramidNetSvg(sideLabel: string, triLabel: string) {
  const cx = 150, cy = 110, q = 38, t = 44
  const top = cy - q, bot = cy + q
  let s = `<rect x="${cx - q}" y="${top}" width="${2 * q}" height="${2 * q}" fill="${C.fill}" stroke="${C.stroke}" stroke-width="2.5"/>`
  const tri = (pts: number[][]) => `<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="#00d4ff10" stroke="${C.stroke}" stroke-width="2"/>`
  s += tri([[cx - q, top], [cx + q, top], [cx, top - t]])
  s += tri([[cx - q, bot], [cx + q, bot], [cx, bot + t]])
  s += tri([[cx - q, top], [cx - q, bot], [cx - q - t, cy]])
  s += tri([[cx + q, top], [cx + q, bot], [cx + q + t, cy]])
  s += `<line x1="${cx + q}" y1="${cy}" x2="${cx + q + t}" y2="${cy}" stroke="${C.height}" stroke-width="2" stroke-dasharray="5 4"/>`
  s += `<polyline points="${cx + q},${cy - 10} ${cx + q + 10},${cy - 10} ${cx + q + 10},${cy}" fill="none" stroke="${C.height}" stroke-width="1.5"/>`
  s += chip(cx + q + t / 2 + 6, cy - 14, triLabel, C.height)
  s += label(cx, cy + 5, sideLabel)
  s += label(cx, bot + 20, sideLabel)
  return svgWrap(s, 340, 212)
}

// ── Triangle with the height outside (homework Q1) ───────────────
const triangleOutsideHeight: Gen = () => {
  const h = pick([6, 8, 5, 10, 4]), b = pick([3, 4, 5, 6, 7])
  const out = pick([2, 3, 4].filter(n => n !== b && n !== h)) ?? 2
  const side = Math.round(Math.sqrt(h * h + out * out) * 10) / 10
  const hyp = Math.round(Math.sqrt(h * h + (out + b) * (out + b)) * 10) / 10
  return build({
    subtopic: 'Height outside the triangle',
    question: `What is the area of the shaded triangle? Its base is ${b} cm and its height is ${h} cm. (Triangle area = b × h ÷ 2)`,
    diagram: obtuseTriSvg(b, h, out, { base: `${b} cm`, height: `${h} cm`, outside: `${out} cm`, side: `${side} cm`, hyp: `${hyp} cm` }),
    explanation: `The height is the dashed ${h} cm line — it is allowed to land OUTSIDE the triangle, and the ${out} cm piece is not part of the base. Use only the base that belongs to the triangle: ${b} × ${h} ÷ 2 = ${fmt((b * h) / 2)}.`,
  }, `${fmt((b * h) / 2)} cm²`, [`${b * h} cm²`, `${fmt(((b + out) * h) / 2)} cm²`, `${fmt((b * side) / 2)} cm²`, `${fmt((out * h) / 2)} cm²`])
}

// ── Polygon on a grid: decompose or subtract (homework Q4) ───────
const gridPolygon: Gen = () => {
  const W = rnd(5, 8), H = rnd(4, 6), nb = pick([2, 4, 6].filter(n => n <= W - 2)), nh = rnd(1, Math.min(3, H - 2))
  const A = W * H - (nb * nh) / 2
  return build({
    subtopic: 'Area of a polygon on a grid',
    question: `Each square on the grid is 1 square unit. What is the area of this polygon?`,
    diagram: notchedSvg(W, H, nb, nh, true, { top: `${W} units`, side: `${H} units`, notch: `${nh}`, notchBase: `${nb}` }),
    explanation: `Start with the whole rectangle: ${W} × ${H} = ${W * H} square units. Then subtract the triangle that was cut out of the bottom: base ${nb}, height ${nh}, so ${nb} × ${nh} ÷ 2 = ${fmt((nb * nh) / 2)}. ${W * H} − ${fmt((nb * nh) / 2)} = ${fmt(A)} square units.`,
  }, `${fmt(A)} square units`, [`${W * H} square units`, `${fmt(W * H - nb * nh)} square units`, `${fmt(W * H + (nb * nh) / 2)} square units`, `${2 * (W + H)} square units`])
}

// ── Surface area of a rectangular prism (homework Q5) ────────────
const prismSurfaceArea: Gen = () => {
  const l = rnd(4, 9), w = rnd(2, 5), h = rnd(2, 6)
  const SA = 2 * (l * w + l * h + w * h)
  return build({
    subtopic: 'Surface area of a prism',
    question: `What is the surface area of this rectangular prism?`,
    diagram: prismSvg(l, w, h),
    explanation: `Surface area = the areas of all 6 faces. Opposite faces match, so: 2 × (${l}×${w}) + 2 × (${l}×${h}) + 2 × (${w}×${h}) = ${2 * l * w} + ${2 * l * h} + ${2 * w * h} = ${SA} square cm. (Multiplying all three, ${l}×${w}×${h}, would give the VOLUME instead.)`,
  }, `${SA} sq cm`, [`${l * w * h} sq cm`, `${SA / 2} sq cm`, `${l * w + l * h + w * h} sq cm`, `${2 * (l + w + h)} sq cm`])
}

// ── Find the mistake (homework Q5 Part A) ────────────────────────
const findTheMistake: Gen = () => {
  const kind = pick(['volume', 'half', 'slant', 'notDoubled'] as const)
  const l = rnd(4, 8), w = rnd(2, 4), h = rnd(2, 5)
  if (kind === 'volume') return build({
    subtopic: 'Find the mistake',
    question: `To find the SURFACE AREA of a ${l} cm by ${w} cm by ${h} cm rectangular prism, Sofia wrote: L × W × H = ${l} × ${w} × ${h} = ${l * w * h} square centimeters. What mistake did she make?`,
    diagram: prismSvg(l, w, h),
    explanation: `L × W × H is the formula for VOLUME (how much fits inside), measured in cubic units. Surface area is the total of the 6 faces: 2(${l}×${w}) + 2(${l}×${h}) + 2(${w}×${h}) = ${2 * (l * w + l * h + w * h)} square cm.`,
  }, 'She found the volume instead of the surface area', [
    'She used the wrong numbers for the sides', 'She should have divided by 2 at the end', 'She should have added the three numbers instead',
  ])
  if (kind === 'half') { const b = rnd(6, 12), hh = rnd(3, 8)
    return build({
      subtopic: 'Find the mistake',
      question: `Noah says the area of a TRIANGLE with a base of ${b} in and a height of ${hh} in is ${b * hh} square inches. What mistake did he make?`,
      diagram: triSvg(b, hh, Math.round(b * 0.4), { base: `${b} in`, height: `${hh} in` }),
      explanation: `${b} × ${hh} = ${b * hh} is the area of the PARALLELOGRAM made from two copies of this triangle. One triangle is half: ${b * hh} ÷ 2 = ${fmt((b * hh) / 2)} square inches.`,
    }, 'He forgot to divide by 2 — a triangle is half a parallelogram', [
      'He used the slanted side instead of the height', 'He added instead of multiplying', 'He should have multiplied by 2 instead',
    ]) }
  if (kind === 'slant') { const [hh, off, sl] = pick(TRIPLES); const b = off + rnd(3, 8)
    return build({
      subtopic: 'Find the mistake',
      question: `Lin says this parallelogram has an area of ${b * sl} square cm because she multiplied ${b} × ${sl}. What mistake did she make?`,
      diagram: paraSvg(b, hh, off, { base: `${b} cm`, side: `${sl} cm`, height: `${hh} cm` }),
      explanation: `She multiplied the base by the slanted SIDE. The height is the perpendicular dashed line, ${hh} cm: ${b} × ${hh} = ${b * hh} square cm.`,
    }, 'She used the slanted side instead of the height', [
      'She forgot to divide by 2', 'She used the wrong base', 'She should have added the sides',
    ]) }
  const s2 = rnd(3, 6), t = rnd(4, 8)
  return build({
    subtopic: 'Find the mistake',
    question: `A cube-shaped box has 6 square faces, each ${s2} cm by ${s2} cm. Diego says the surface area is ${s2 * s2} square cm. What mistake did he make?`,
    explanation: `${s2} × ${s2} = ${s2 * s2} is the area of ONE face. There are 6 faces, so the surface area is 6 × ${s2 * s2} = ${6 * s2 * s2} square cm.`,
  }, 'He found the area of only one face instead of all 6', [
    `He multiplied when he should have added ${t}`, 'He forgot to divide by 2', 'He used the wrong side length',
  ])
}

// ── Nets and polyhedra (homework Q6) ─────────────────────────────
const netPyramidArea: Gen = () => {
  const s2 = pick([5, 6, 7, 8]), t = pick([4, 6, 8, 10])
  const SA = s2 * s2 + 4 * ((s2 * t) / 2)
  return build({
    subtopic: 'Surface area from a net',
    question: `This net is made of four identical triangles and a square. The square's sides are ${s2} cm, and each triangle has a height of ${t} cm. What is the surface area of the polyhedron it folds into?`,
    diagram: pyramidNetSvg(`${s2} cm`, `${t} cm`),
    explanation: `Square: ${s2} × ${s2} = ${s2 * s2}. Each triangle: ${s2} × ${t} ÷ 2 = ${fmt((s2 * t) / 2)}, and there are 4 of them: 4 × ${fmt((s2 * t) / 2)} = ${fmt(4 * ((s2 * t) / 2))}. Total surface area = ${s2 * s2} + ${fmt(4 * ((s2 * t) / 2))} = ${fmt(SA)} square cm.`,
  }, `${fmt(SA)} sq cm`, [`${fmt(s2 * s2 + (s2 * t) / 2)} sq cm`, `${fmt(s2 * s2 + 4 * s2 * t)} sq cm`, `${fmt(4 * ((s2 * t) / 2))} sq cm`, `${fmt(SA + 10)} sq cm`])
}

const NETS: { q: string; right: string; wrong: string[]; why: string }[] = [
  { q: 'A net is made of four identical triangles and one square. What polyhedron does it fold into?', right: 'Square pyramid',
    wrong: ['Triangular prism', 'Cube', 'Rectangular prism'],
    why: 'The square is the base and the four triangles fold up to meet at one point on top — that is a square pyramid.' },
  { q: 'A net is made of two identical triangles and three rectangles. What polyhedron does it fold into?', right: 'Triangular prism',
    wrong: ['Square pyramid', 'Triangular pyramid', 'Cube'],
    why: 'The two triangles are the two ends (bases) and the three rectangles wrap around them — a triangular prism.' },
  { q: 'A net is made of six identical squares. What polyhedron does it fold into?', right: 'Cube',
    wrong: ['Square pyramid', 'Rectangular prism that is not a cube', 'Triangular prism'],
    why: 'Six identical squares fold into a cube — every face is the same square.' },
  { q: 'Which measurement do you need to find the surface area of a polyhedron from its net?', right: 'The area of every face in the net, added together',
    wrong: ['Length × width × height', 'The area of the biggest face times the number of faces', 'The perimeter of the net'],
    why: 'Surface area is the total of all the faces. A net is handy because it lays all the faces out flat so you can find each area and add them.' },
]
const netConcept: Gen = () => {
  const n = pick(NETS)
  return build({ subtopic: 'Nets & polyhedra', question: n.q, explanation: n.why }, n.right, n.wrong)
}

// ── Composite sign + "how many kits" (homework Q7) ───────────────
const compositeSign: Gen = () => {
  const W = pick([12, 14, 16, 10]), H = pick([20, 24, 26, 18]), nh = pick([6, 7, 8])
  const A = W * H - (W * nh) / 2
  return build({
    subtopic: 'Composite figure',
    question: `A poster is a ${W} in by ${H} in rectangle with a triangle cut out of the bottom. The cut-out triangle is ${W} in across and ${nh} in tall. What is the area of the poster?`,
    diagram: notchedSvg(W, H, W, nh, false, { top: `${W} in`, side: `${H} in`, notch: `${nh} in` }),
    explanation: `Whole rectangle: ${W} × ${H} = ${W * H} sq in. Cut-out triangle: ${W} × ${nh} ÷ 2 = ${fmt((W * nh) / 2)} sq in. Subtract: ${W * H} − ${fmt((W * nh) / 2)} = ${fmt(A)} sq in.`,
  }, `${fmt(A)} sq in`, [`${W * H} sq in`, `${fmt(W * H - W * nh)} sq in`, `${fmt(W * H + (W * nh) / 2)} sq in`, `${fmt(A / 2)} sq in`])
}

const kitsNeeded: Gen = () => {
  const A = pick([315, 280, 246, 352, 198]), kit = pick([100, 125, 150])
  const total = A * 2
  const exact = total / kit
  const kits = Math.ceil(exact)
  return build({
    subtopic: 'Area in a real situation',
    question: `One side of a sign has an area of ${A} square inches. A painting kit covers ${kit} square inches. How many kits are needed to paint the FRONT and BACK of the sign?`,
    explanation: `Front and back: ${A} × 2 = ${total} sq in. Divide by what one kit covers: ${total} ÷ ${kit} = ${fmt(exact)} kits. You cannot buy part of a kit, so round UP to ${kits}.`,
  }, `${kits} kits`, [`${Math.floor(exact)} kits`, `${Math.ceil(A / kit)} kits`, `${kits + 1} kits`])
}

// ── Base–height pairs for a given area (homework Q3) ─────────────
const pairsForArea: Gen = () => {
  const A = pick([24, 36, 48, 20, 30])
  const pairs: [number, number][] = []
  for (let b = 2; b <= A; b++) if (A % b === 0) pairs.push([b, A / b])
  const good = pick(pairs)
  const bad: string[] = []
  while (bad.length < 3) {
    const b = rnd(2, 12), h = rnd(2, 12)
    const t = `base ${b}, height ${h}`
    if (b * h !== A && !bad.includes(t)) bad.push(t)
  }
  return build({
    subtopic: 'Drawing a parallelogram with a given area',
    question: `You need to draw a parallelogram with an area of exactly ${A} square units. Which base and height would work?`,
    explanation: `Area = base × height, so you need two numbers that multiply to ${A}. ${good[0]} × ${good[1]} = ${A} ✓. Check the others by multiplying — they do not give ${A}.`,
  }, `base ${good[0]}, height ${good[1]}`, bad)
}

const UNIT1_GENS: Gen[] = [triangleOutsideHeight, gridPolygon, prismSurfaceArea, findTheMistake, netPyramidArea, netConcept, compositeSign, kitsNeeded, pairsForArea]

/** `count` questions, mixing parallelogram work with the rest of Unit 1.
 *  `typeIn` is the share of questions (0-1) that hide the choices and ask the
 *  student to type the answer, so a lucky guess out of four is not an option. */
export function generateParallelogramQuestions(count = 5, scope: 'parallelograms' | 'unit1' = 'unit1', typeIn = 0.4): Question[] {
  const pool = scope === 'parallelograms' ? PARALLELOGRAM_GENS : [...PARALLELOGRAM_GENS, ...UNIT1_GENS]
  const order = shuffle(pool)
  const out: Question[] = []
  for (let i = 0; i < count; i++) out.push(order[i % order.length]())

  // Choose which ones become type-in. Concept/mistake questions have no number to
  // type, so they stay multiple choice, and at least one question keeps its choices.
  const eligible = shuffle(out.map((q, i) => (q.entry ? i : -1)).filter(i => i >= 0))
  const cap = typeIn >= 1 ? count : Math.max(count - 1, 0) // a mixed set always keeps at least one multiple choice
  const wanted = Math.min(Math.round(count * typeIn), cap, eligible.length)
  const chosen = new Set(eligible.slice(0, wanted))
  return out.map((q, i) => chosen.has(i)
    // no letters to point at when the choices are hidden
    ? { ...q, explanation: q.explanation.replace(/The answer is [A-D]\. /, 'The answer is ') }
    : { ...q, entry: undefined })
}
export const generateUnit1Questions = generateParallelogramQuestions
