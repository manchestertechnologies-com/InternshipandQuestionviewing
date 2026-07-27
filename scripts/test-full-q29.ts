import { textToLaTeX, isMathExpression } from '../src/lib/mathParser';
import katex from 'katex';

const fullQuestion = `A dipole of dipole moment P and moment of inertia I is placed in a uniform electric field \\vec{E}. If it is displaced slightly from its stable equilibrium position, the period of oscillation of dipole is`;

const fullQuestionWithDollars = `A dipole of dipole moment $P$ and moment of inertia $I$ is placed in a uniform electric field $\\vec{E}$. If it is displaced slightly from its stable equilibrium position, the period of oscillation of dipole is`;

console.log('isMathExpression(fullQuestion):', isMathExpression(fullQuestion));
console.log('textToLaTeX(fullQuestion):', textToLaTeX(fullQuestion));

try {
  const html = katex.renderToString(textToLaTeX(fullQuestion), { throwOnError: false });
  console.log('KaTeX rendered HTML length for fullQuestion:', html.length);
} catch (e) {
  console.error('KaTeX error:', e);
}

console.log('\nisMathExpression(fullQuestionWithDollars):', isMathExpression(fullQuestionWithDollars));
console.log('textToLaTeX(fullQuestionWithDollars):', textToLaTeX(fullQuestionWithDollars));

try {
  const html2 = katex.renderToString(textToLaTeX(fullQuestionWithDollars), { throwOnError: false });
  console.log('KaTeX rendered HTML length for fullQuestionWithDollars:', html2.length);
} catch (e) {
  console.error('KaTeX error:', e);
}
