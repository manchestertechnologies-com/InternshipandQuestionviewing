import { normalizeLatexShortcuts, smartConvertRaw } from '../src/lib/mathParser';

function convertChemicalFormulasToLaTeX(text: string): string {
  let res = text;
  // 1. Caret charges: TiF6 ^(2-), CoF6^(3-), NiCl4^(2-), Cu^(2-), NiCl4^2, CoF6^3-
  res = res.replace(/([A-Z][a-z]?(?:\d+)?)\s*\^\(?(\d*[-+]|[-+]\d+|\d+)\)?/g, (m, base, charge) => {
    let cleanCharge = charge;
    if (/^\d+$/.test(charge)) cleanCharge += '-';
    return `${base}^{${cleanCharge}}`;
  });

  // 2. Element numbers: TiF6 -> TiF_6, CoF6 -> CoF_6, NiCl4 -> NiCl_4, Cu2 -> Cu_2
  res = res.replace(/([A-Z][a-z]?)(\d+)(?=[A-Z\s^{()\-]|$)/g, '$1_{$2}');

  // 3. Remove space in formula parts: Cu_2 Cl_2 -> Cu_2Cl_2
  res = res.replace(/([A-Z][a-z]?_\{\d+\})\s+([A-Z][a-z]?_\{\d+\})/g, '$1$2');

  return res;
}

const input1 = `34. Amongst TiF6 ^(2-),CoF6^(3-),Cu^(2-) Cl and NiCl4^(2-) (At. No. Ti = 22, Co = 27,Cu = 29,Ni = 28), the colourless species are`;
const input2 = `(1) TiF6 ^(2-) and Cu2 Cl2`;
const input3 = `(2) Cu2 Cl2 and NiCl4^2`;
const input4 = `(3) TiF6 ^(2-) and CoF6^(3-)`;
const input5 = `(4) CoF6^(3-) and NiCl4^(2-)`;

console.log('F1:', convertChemicalFormulasToLaTeX(input1));
console.log('F2:', convertChemicalFormulasToLaTeX(input2));
console.log('F3:', convertChemicalFormulasToLaTeX(input3));
console.log('F4:', convertChemicalFormulasToLaTeX(input4));
console.log('F5:', convertChemicalFormulasToLaTeX(input5));
