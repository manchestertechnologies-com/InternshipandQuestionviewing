/**
 * Biology Parser Engine
 * =====================
 * Handles Biology, Botany, and Zoology content.
 *
 * Key behaviors:
 * - Preserves all plain text structure (paragraphs, lists, tables).
 * - Italicizes binomial nomenclature (Homo sapiens → *Homo sapiens*).
 * - Formats genetics notation (F1 → F₁, F2 → F₂, P1 → P₁).
 * - Formats biochemical terms (FADH2 → FADH₂, NADH2 → NADH₂, ATP, ADP).
 * - Does NOT touch mathematics — no LaTeX conversion.
 * - Does NOT touch chemistry — no chemical formula processing.
 * - Scientific names are preserved with proper italic formatting.
 *
 * Output: HTML-compatible string with biology-specific formatting.
 */

// Recognized biology genus names for binomial nomenclature detection
const KNOWN_GENERA = new Set([
  'homo', 'panthera', 'felis', 'canis', 'pisum', 'solanum', 'mangifera',
  'oryza', 'triticum', 'zea', 'escherichia', 'drosophila', 'arabidopsis',
  'saccharomyces', 'plasmodium', 'entamoeba', 'taenia', 'ascaris',
  'periplaneta', 'rana', 'columba', 'pavo', 'naja', 'labeo', 'hirudinaria',
  'hydra', 'obelia', 'aurelia', 'fasciola', 'ancylostoma', 'wuchereria',
  'hirudo', 'palamnaeus', 'scorpio', 'limulus', 'asterias', 'echinus',
  'balanoglossus', 'ascidia', 'branchiostoma', 'petromyzon', 'myxine',
  'scyliorhinus', 'pristis', 'carcharodon', 'trygon', 'catla',
  'clarias', 'betta', 'pterophyllum', 'bufo', 'hyla', 'salamandra',
  'typhlonectes', 'chelone', 'testudo', 'chameleon', 'calotes', 'alligator',
  'crocodilus', 'hemidactylus', 'corvus', 'psittacula', 'struthio',
  'aptenodytes', 'neophron', 'ornithorhynchus', 'tachyglossus', 'macropus',
  'pteropus', 'camelus', 'macaca', 'rattus', 'equus', 'elephas', 'balaenoptera',
  'chlamydomonas', 'volvox', 'ulothrix', 'spirogyra', 'chara', 'ectocarpus',
  'dictyota', 'laminaria', 'sargassum', 'fucus', 'porphyra', 'polysiphonia',
  'polytrichum', 'sphagnum', 'funaria', 'marchantia', 'riccia', 'selaginella',
  'equisetum', 'pteris', 'dryopteris', 'adiantum', 'cycas', 'pinus', 'ginkgo',
  'cedrus', 'gnetum', 'ephedra', 'welwitschia', 'capsella',
  'brassica', 'hibiscus', 'gossypium', 'crotalaria', 'phaseolus', 'cajanus',
  'glycine', 'arachis', 'lathyrus', 'lycopersicon', 'capsicum', 'nicotiana',
]);

// Words that look like genus names but are NOT biology terms
const NOT_GENERA_STARTERS = new Set([
  'option', 'choice', 'question', 'section', 'part', 'statement',
  'assertion', 'reason', 'the', 'when', 'in', 'for', 'if', 'with',
  'by', 'from', 'which', 'where', 'this', 'that', 'these', 'those',
  'given', 'find', 'calculate', 'determine', 'consider',
]);

/**
 * Formats binomial nomenclature into italic HTML.
 * Genus species → <em>Genus species</em>
 */
function formatBinomialNomenclature(text: string): string {
  return text.replace(/\b([A-Z][a-z]{2,})\s+([a-z]{3,})\b/g, (match, genus, species) => {
    const gLow = genus.toLowerCase();
    if (NOT_GENERA_STARTERS.has(gLow)) return match;
    if (KNOWN_GENERA.has(gLow) || (genus.length >= 4 && species.length >= 4)) {
      return `<em>${genus} ${species}</em>`;
    }
    return match;
  });
}

/**
 * Formats genetics notation.
 * F1 → F₁, F2 → F₂, P1 → P₁
 */
function formatGeneticsNotation(text: string): string {
  return text.replace(/\b([FP])([123])\b/g, (_, letter, num) => {
    const subDigits: Record<string, string> = { '1': '₁', '2': '₂', '3': '₃' };
    return letter + (subDigits[num] ?? num);
  });
}

/**
 * Formats biochemical terms with subscripts.
 * FADH2 → FADH₂, NADH2 → NADH₂, CO2 → CO₂ in biology context
 */
function formatBiochemicalTerms(text: string): string {
  let res = text;

  // Specific biochemical molecules
  res = res.replace(/\bFADH2\b/g, 'FADH₂');
  res = res.replace(/\bNADH2\b/g, 'NADH₂');
  res = res.replace(/\bNADPH2\b/g, 'NADPH₂');
  res = res.replace(/\bH2O\b/g, 'H₂O');
  res = res.replace(/\bCO2\b/g, 'CO₂');
  res = res.replace(/\bO2\b/g, 'O₂');

  return res;
}

/**
 * Main biology render pipeline.
 * Processes biology/botany/zoology content with structure-preserving formatting.
 */
export function parseBiology(text: string): string {
  if (!text) return '';

  let res = text;

  // 1. Format biochemical terms first (specific molecules)
  res = formatBiochemicalTerms(res);

  // 2. Format genetics notation
  res = formatGeneticsNotation(res);

  // 3. Format binomial nomenclature
  res = formatBinomialNomenclature(res);

  return res;
}

/**
 * Check if text contains biology-specific content.
 */
export function isBiologyContent(text: string): boolean {
  if (/\b(cell|tissue|organ|gene|chromosome|dna|rna|mitosis|meiosis)\b/i.test(text)) return true;
  if (/\b(atp|adp|nadh|fadh|photosynthesis|respiration|enzyme|protein)\b/i.test(text)) return true;
  if (/\b(xylem|phloem|chloroplast|stomata|angiosperm|gymnosperm)\b/i.test(text)) return true;
  if (/\b(allele|phenotype|genotype|pedigree|crossing)\b/i.test(text)) return true;
  // Binomial name detection: Capital + lowercase 4+ chars followed by space + lowercase 4+ chars
  // but not preceded by math keywords
  if (/\b([A-Z][a-z]{3,})\s+([a-z]{3,})\b/.test(text) &&
      !/\b(calculate|find|determine|integral|derivative|evaluate|prove)\b/i.test(text)) return true;
  return false;
}
