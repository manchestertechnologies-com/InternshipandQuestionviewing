import { textToLaTeX } from '../src/lib/mathParser';

const testCases = [
  '1/(2\\pi) \\sqrt{PE/I}',
  '(1/2\\pi)\\sqrt(PE/I)',
  '(1/2π)√(PE/I)',
  '\\frac{1}{2\\pi}\\sqrt{\\frac{PE}{I}}',
  '1/2π √(PE/I)',
  '\\pi \\sqrt{I/PE}',
  'π\\sqrt(I/PE)',
  'π√(I/PE)',
  '\\pi\\sqrt{\\frac{I}{PE}}',
  '\\sqrt{PE/I}',
  '\\sqrt(PE/I)',
  '√(PE/I)',
  '\\sqrt{\\frac{PE}{I}}',
  '2\\pi \\sqrt{I/PE}',
  '2π\\sqrt(I/PE)',
  '2π√(I/PE)',
  '2\\pi\\sqrt{\\frac{I}{PE}}',
  '\\vec{E}',
  'vec{E}'
];

console.log('============================================');
console.log(' TESTING TEXTBOOK QUESTION REGRESSION CASES ');
console.log('============================================\n');

testCases.forEach((tc, idx) => {
  console.log(`[Input ${idx + 1}]: "${tc}"`);
  try {
    const latex = textToLaTeX(tc);
    console.log(`[Output  ]: "${latex}"\n`);
  } catch (e) {
    console.error(`[Error   ]:`, e);
  }
});
