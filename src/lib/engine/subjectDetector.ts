/**
 * Subject Detection Engine
 * Automatically scores domain vocabulary, terms, and symbols to assign subject classification.
 */

export type SubjectCategory =
  | 'MATHEMATICS'
  | 'PHYSICS'
  | 'CHEMISTRY'
  | 'BIOLOGY'
  | 'BOTANY'
  | 'ZOOLOGY'
  | 'COMPUTER_SCIENCE'
  | 'GENERAL_APTITUDE';

export interface SubjectDetectionResult {
  primarySubject: SubjectCategory;
  scores: Record<SubjectCategory, number>;
  confidence: number;
}

const KEYWORD_MAP: Record<SubjectCategory, string[]> = {
  MATHEMATICS: [
    'integral', 'derivative', 'matrix', 'determinant', 'vector', 'calculus', 'probability',
    'permutation', 'combination', 'trigonometry', 'logarithm', 'polynomial', 'binomial',
    'limit', 'summation', 'eigenvalue', 'differentiate', 'integrate', 'sin(', 'cos(', 'tan('
  ],
  PHYSICS: [
    'velocity', 'acceleration', 'force', 'mass', 'momentum', 'impedance', 'resistance',
    'capacitance', 'inductance', 'wavelength', 'frequency', 'electric field', 'magnetic field',
    'torque', 'refractive index', 'gravitational', 'kinetic energy', 'potential energy', 'rad/s'
  ],
  CHEMISTRY: [
    'reaction', 'compound', 'oxidation', 'reduction', 'molarity', 'normality', 'catalyst',
    'equilibrium', 'orbital', 'configuration', 'stoichiometry', 'polyatomic', 'valency',
    'covalent', 'ionic', 'acid', 'base', 'pH', 'enthalpy', 'entropy', 'KMnO4', 'H2SO4'
  ],
  BIOLOGY: [
    'cell', 'tissue', 'organ', 'gene', 'chromosome', 'dna', 'rna', 'mitosis', 'meiosis',
    'atp', 'adp', 'nadh', 'fadh2', 'respiration', 'photosynthesis', 'enzyme', 'homo sapiens'
  ],
  BOTANY: [
    'plant', 'xylem', 'phloem', 'chloroplast', 'stomata', 'angiosperm', 'gymnosperm',
    'floral formula', 'calyx', 'corolla', 'androecium', 'gynoecium', 'mangifera indica', 'solanum'
  ],
  ZOOLOGY: [
    'animal', 'pedigree', 'genetics', 'allele', 'phenotype', 'genotype', 'crossing over',
    'panthera', 'drosophila', 'hemoglobin', 'neuron', 'synapse', 'hormone', 'pituitary'
  ],
  COMPUTER_SCIENCE: [
    'algorithm', 'binary', 'database', 'sql', 'recursion', 'pointer', 'array', 'complexity',
    'tree', 'graph', 'compiler', 'operating system', 'network', 'protocol', 'stack', 'queue'
  ],
  GENERAL_APTITUDE: [
    'blood relation', 'coding decoding', 'syllogism', 'data interpretation', 'pie chart',
    'bar graph', 'venn diagram', 'seating arrangement', 'direction sense', 'number series'
  ]
};

export function detectSubjectCategory(text: string): SubjectDetectionResult {
  const scores: Record<SubjectCategory, number> = {
    MATHEMATICS: 0,
    PHYSICS: 0,
    CHEMISTRY: 0,
    BIOLOGY: 0,
    BOTANY: 0,
    ZOOLOGY: 0,
    COMPUTER_SCIENCE: 0,
    GENERAL_APTITUDE: 0
  };

  if (!text || typeof text !== 'string') {
    return { primarySubject: 'PHYSICS', scores, confidence: 0.5 };
  }

  const lower = text.toLowerCase();

  for (const [subject, keywords] of Object.entries(KEYWORD_MAP)) {
    const key = subject as SubjectCategory;
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        scores[key] += 10;
      }
    }
  }

  // Symbol heuristic weighting
  if (/[∫∑√±≤≥≠∞]/.test(text) || /\\(int|sum|lim|frac|matrix|det)\b/.test(text)) {
    scores.MATHEMATICS += 25;
  }
  if (/[αβγδεθλµπσϕχωΔΩ]/.test(text) || /\\(omega|alpha|beta|gamma|vec|hat)\b/.test(text)) {
    scores.PHYSICS += 20;
  }
  if (/[₀₁₂₃₄₅₆₇₈₉][⁺⁻]|[⁺⁻][₀₁₂₃₄₅₆₇₈₉]/.test(text) || /[A-Z][a-z]?\d*[\^\_]/.test(text)) {
    scores.CHEMISTRY += 25;
  }
  if (/\b([A-Z][a-z]{3,})\s+([a-z]{3,})\b/.test(text)) {
    scores.BIOLOGY += 15;
  }

  let highestSubject: SubjectCategory = 'PHYSICS';
  let maxScore = -1;

  for (const [subject, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      highestSubject = subject as SubjectCategory;
    }
  }

  const confidence = maxScore > 0 ? Math.min(0.99, 0.5 + maxScore / 100) : 0.5;

  return {
    primarySubject: highestSubject,
    scores,
    confidence
  };
}
