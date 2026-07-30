// Recognized biology genus names & binomial patterns
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
  'cedrus', 'gnetum', 'ephedra', 'welwitschia', 'capsella', 'mustard',
  'brassica', 'hibiscus', 'gossypium', 'crotalaria', 'phaseolus', 'cajanus',
  'glycine', 'arachis', 'lathyrus', 'lycopersicon',
  'capsicum', 'nicotiana', 'meandrina', 'fungia', 'tubipora', 'metridium',
  'adamsia', 'pennatula', 'gorgonia', 'physalia'
]);

export function formatBiologyTaxonomy(text: string): string {
  if (!text) return '';
  let res = text;

  // 1. Binomial Nomenclature (Genus species -> *Genus species*)
  res = res.replace(/\b([A-Z][a-z]{2,})\s+([a-z]{3,})\b/g, (match, genus, species) => {
    const gLow = genus.toLowerCase();
    if (KNOWN_GENERA.has(gLow) || (genus.length >= 4 && species.length >= 4 && !/^(Option|Choice|Question|Section|Part|Statement|Assertion|Reason|The|When|In|For|If|With|By|From|Which|Where)$/i.test(genus))) {
      return `*${genus} ${species}*`;
    }
    return match;
  });

  // 2. Genetics Generations (F1 -> F_1, F2 -> F_2, P1 -> P_1, P2 -> P_2)
  res = res.replace(/\b([FP])([123])\b/g, '$1_$2');

  // 3. Biochemical terms with subscripts (FADH2 -> FADH₂, NADPH -> NADPH, ATP -> ATP)
  res = res.replace(/\bFADH2\b/g, 'FADH₂');
  res = res.replace(/\bNADH2\b/g, 'NADH₂');

  return res;
}

const test1 = `The scientific name of mango is Mangifera indica and human is Homo sapiens.`;
const test2 = `In a monohybrid cross, the F1 generation produces F2 offspring in a 3:1 ratio.`;
const test3 = `Cellular respiration converts ADP to ATP using FADH2 and NADH.`;

console.log('Bio 1:', formatBiologyTaxonomy(test1));
console.log('Bio 2:', formatBiologyTaxonomy(test2));
console.log('Bio 3:', formatBiologyTaxonomy(test3));
