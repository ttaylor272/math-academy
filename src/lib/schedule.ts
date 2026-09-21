import { TopicKey } from './types'

// White Oak Middle School — Math 6 Units of Study (Amplify Desmos Math), 2026–27.
// Dates come from the class handout and are "subject to change" — edit here if the teachers shift them.
export interface SchoolUnit {
  unit: number
  title: string
  topic: TopicKey          // which stats bucket practice for this unit feeds
  start: string            // YYYY-MM-DD
  end: string              // YYYY-MM-DD
  assessment?: string      // district assessment date, if any
  summary: string          // what the class covers (also fed to the question generator)
}

export const SCHOOL_UNITS: SchoolUnit[] = [
  {
    unit: 1, title: 'Area and Surface Area', topic: 'area_figures',
    start: '2026-08-27', end: '2026-09-29', assessment: '2026-09-29',
    summary: 'Area of polygons by decomposing, rearranging, enclosing and composing shapes (parallelograms, triangles, trapezoids); representing polyhedra with nets and finding surface area.',
  },
  {
    unit: 2, title: 'Introducing Ratios', topic: 'ratios_basic',
    start: '2026-09-30', end: '2026-10-27',
    summary: 'The concept of a ratio, represented with double number lines, tables and tape diagrams; ratio reasoning to solve problems.',
  },
  {
    unit: 3, title: 'Rates and Percentages', topic: 'rates_percentages',
    start: '2026-10-28', end: '2026-11-20',
    summary: 'Unit rates; equivalent ratios share the same unit rate; representations of percentages to find a missing percent, part or whole.',
  },
  {
    unit: 4, title: 'Dividing Fractions', topic: 'dividing_fractions',
    start: '2026-11-30', end: '2027-01-08',
    summary: 'Dividing fractions by fractions: "how many groups?" and "how many in 1 group?", tape diagrams, common denominators, multiplying by the reciprocal.',
  },
  {
    unit: 5, title: 'Decimal Arithmetic', topic: 'decimal_arithmetic',
    start: '2027-01-11', end: '2027-02-10',
    summary: 'Strategies for adding, subtracting, multiplying and dividing decimals.',
  },
  {
    unit: 6, title: 'Expressions and Equations', topic: 'expressions_6',
    start: '2027-02-11', end: '2027-03-17', assessment: '2027-03-17',
    summary: 'The equal sign as balance; balanced operations to solve for unknowns; equivalent expressions, including ones with two variables or exponents.',
  },
]

/** Today's date in Maryland as YYYY-MM-DD (works the same on Vercel's UTC servers and in the browser). */
export function todayET(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

/** Whole days from `from` to `iso` (both YYYY-MM-DD). Negative if `iso` is in the past. */
export function daysUntil(iso: string, from: string = todayET()): number {
  const [y1, m1, d1] = from.split('-').map(Number)
  const [y2, m2, d2] = iso.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000)
}

/**
 * The unit the boys are in right now. During a break between units (e.g. Thanksgiving)
 * it returns the NEXT unit so practice previews what's coming. Null once the year's units are done.
 */
export function getCurrentUnit(today: string = todayET()): SchoolUnit | null {
  for (const u of SCHOOL_UNITS) {
    if (today < u.start || today <= u.end) return u
  }
  return null
}

export function getUnitForTopic(topic: string): SchoolUnit | undefined {
  return SCHOOL_UNITS.find(u => u.topic === topic)
}

/** "Tue 9/29" */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const wd = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
  return `${wd} ${m}/${d}`
}

/** An upcoming district assessment within `withinDays`, if any. */
export function upcomingAssessment(withinDays = 14, today: string = todayET()) {
  for (const u of SCHOOL_UNITS) {
    if (!u.assessment) continue
    const days = daysUntil(u.assessment, today)
    if (days >= 0 && days <= withinDays) return { unit: u, days }
  }
  return null
}
