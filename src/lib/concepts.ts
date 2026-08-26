export interface ConceptCard {
  title: string
  emoji: string
  steps: string[]
  example: string
  tip: string
}

export const CONCEPT_CARDS: Record<string, ConceptCard> = {
  rational_numbers: {
    title: 'Operations with Rational Numbers',
    emoji: '➕➖',
    steps: [
      'To ADD/SUBTRACT negatives: same sign → add and keep sign. Different signs → subtract smaller from larger, keep sign of larger.',
      'To MULTIPLY/DIVIDE: same signs → positive result. Different signs → negative result.',
      'For FRACTIONS: find common denominator first, then add/subtract numerators.',
      'ABSOLUTE VALUE: always positive — it\'s the distance from zero.',
    ],
    example: '-3 + (-5) = -8 (same sign, add) | -3 + 7 = 4 (different signs, 7-3=4, keep positive)',
    tip: '💡 Think of a number line — going left is negative, right is positive!',
  },
  proportional: {
    title: 'Proportional Relationships & Percent Change',
    emoji: '📐',
    steps: [
      'CONSTANT OF PROPORTIONALITY (k): k = y ÷ x. If k is the same for all pairs, it\'s proportional.',
      'PERCENT CHANGE: ((New - Original) ÷ Original) × 100',
      'PERCENT INCREASE: result is positive. PERCENT DECREASE: result is negative.',
      'SIMPLE INTEREST: I = P × r × t (Principal × rate × time)',
    ],
    example: 'Original: $50, New: $65. Change = (65-50)/50 × 100 = 30% increase',
    tip: '💡 For percent change, always divide by the ORIGINAL (starting) value!',
  },
  expressions_equations: {
    title: 'Two-Step Equations & Inequalities',
    emoji: '🔢',
    steps: [
      'SOLVING EQUATIONS: undo operations in reverse order (PEMDAS backwards).',
      'Step 1: Add or subtract to isolate the variable term.',
      'Step 2: Multiply or divide to solve for the variable.',
      'INEQUALITIES: same steps, but flip the sign when multiplying/dividing by a NEGATIVE.',
      'CHECK: substitute your answer back into the original equation.',
    ],
    example: '2x + 3 = 11 → subtract 3: 2x = 8 → divide by 2: x = 4 ✓',
    tip: '💡 Whatever you do to one side, do to the other side!',
  },
  geometry: {
    title: 'Circles, Angles & Area/Volume',
    emoji: '📏',
    steps: [
      'CIRCLE: Area = π × r² | Circumference = 2 × π × r (use π ≈ 3.14)',
      'COMPLEMENTARY angles: add to 90°. SUPPLEMENTARY: add to 180°.',
      'VERTICAL angles: always equal. TRIANGLE angles: always add to 180°.',
      'SURFACE AREA: sum of ALL face areas.',
      'VOLUME of prism: Base Area × height.',
    ],
    example: 'Circle radius = 5: Area = 3.14 × 5² = 3.14 × 25 = 78.5 sq units',
    tip: '💡 r is radius (center to edge), d is diameter (edge to edge). d = 2r!',
  },
  statistics_probability: {
    title: 'Probability & Statistics',
    emoji: '🎲',
    steps: [
      'PROBABILITY = favorable outcomes ÷ total outcomes (always between 0 and 1)',
      'THEORETICAL: what should happen. EXPERIMENTAL: what actually happened.',
      'INDEPENDENT events: P(A and B) = P(A) × P(B)',
      'DEPENDENT events: P(A then B) = P(A) × P(B after A happened)',
      'MEDIAN: arrange in order first, then find middle value.',
    ],
    example: 'P(rolling 3 on a die) = 1/6 ≈ 0.167 or 16.7%',
    tip: '💡 Always SORT the data before finding median or range!',
  },
  number_operations: {
    title: 'Number Operations & Exponents',
    emoji: '🧮',
    steps: [
      'EXPONENTS: base^power means multiply base by itself "power" times. 2³ = 2×2×2 = 8',
      'SCIENTIFIC NOTATION: a × 10^n where 1 ≤ a < 10',
      'SQUARE ROOTS: √25 = 5 because 5² = 25. Perfect squares: 1,4,9,16,25,36,49,64,81,100',
      'ORDER OF OPERATIONS (PEMDAS): Parentheses → Exponents → Multiply/Divide → Add/Subtract',
    ],
    example: '3² × (4 + 1) - 6 = 9 × 5 - 6 = 45 - 6 = 39',
    tip: '💡 PEMDAS: Please Excuse My Dear Aunt Sally!',
  },
  ratio_proportion: {
    title: 'Ratios, Rates & Proportional Reasoning',
    emoji: '📐',
    steps: [
      'UNIT RATE: divide to find "per 1". 150 miles in 3 hours = 50 mph.',
      'SLOPE = rise ÷ run = change in y ÷ change in x',
      'PERCENT CHANGE: ((New - Original) ÷ Original) × 100',
      'TAX/TIP: multiply total by decimal. 20% tip on $45 = 0.20 × 45 = $9',
      'DISCOUNT: multiply by (1 - discount%). 30% off $80 = 0.70 × 80 = $56',
    ],
    example: 'Slope from (0,0) to (3,6): rise = 6, run = 3, slope = 6/3 = 2',
    tip: '💡 Slope is the constant of proportionality k in y = kx!',
  },
  algebra: {
    title: 'Algebra & Linear Functions',
    emoji: '🔢',
    steps: [
      'SLOPE-INTERCEPT: y = mx + b (m = slope, b = y-intercept)',
      'SLOPE: m = (y₂ - y₁) ÷ (x₂ - x₁)',
      'To GRAPH: plot b on y-axis, then use slope (rise/run) to find next points.',
      'FUNCTION: each input has exactly ONE output. Check with vertical line test.',
      'COMBINING LIKE TERMS: only combine terms with same variable and exponent.',
    ],
    example: 'y = 2x + 3: slope=2 (up 2, right 1), y-intercept=3 (starts at (0,3))',
    tip: '💡 "b" in y=mx+b is where the line crosses the y-axis (x=0)!',
  },
  geometry_adv: {
    title: 'Advanced Geometry & Transformations',
    emoji: '📏',
    steps: [
      'PYTHAGOREAN THEOREM: a² + b² = c² (c is always the longest side, hypotenuse)',
      'TRANSFORMATIONS: Translation (slide), Reflection (flip), Rotation (turn), Dilation (resize)',
      'DILATION: multiply all coordinates by scale factor k.',
      'REFLECTION over x-axis: (x, y) → (x, -y). Over y-axis: (x, y) → (-x, y)',
      'ROTATION 90° clockwise: (x, y) → (y, -x)',
    ],
    example: 'Right triangle: legs 3 and 4. Hypotenuse: √(3²+4²) = √(9+16) = √25 = 5',
    tip: '💡 3-4-5 is the most common Pythagorean triple — memorize it!',
  },
  data_probability: {
    title: 'Data Analysis & Probability',
    emoji: '🎲',
    steps: [
      'SCATTER PLOT: positive correlation (both go up), negative (one up, one down), no correlation.',
      'TREND LINE (line of best fit): draw through middle of data, roughly equal points above and below.',
      'COMPOUND PROBABILITY — Independent: P(A and B) = P(A) × P(B)',
      'COMPOUND PROBABILITY — Dependent: P(A then B) = P(A) × P(B|A)',
      'STATISTICAL INFERENCE: a random sample should represent the whole population.',
    ],
    example: 'Bag: 3 red, 2 blue. P(red then blue, no replace) = 3/5 × 2/4 = 6/20 = 3/10',
    tip: '💡 "Without replacement" means dependent events — the second probability changes!',
  },
}
