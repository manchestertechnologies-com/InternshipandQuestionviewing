import { textToLaTeX } from '../src/lib/mathParser';

console.log('Testing m=x2-x1/y2-y1:');
console.log(textToLaTeX('m=x2-x1/y2-y1'));

console.log('\nTesting (x²+3x+2)/(x-1)=(2x+5)/3:');
console.log(textToLaTeX('(x²+3x+2)/(x-1)=(2x+5)/3'));

console.log('\nTesting a+b/c+d:');
console.log(textToLaTeX('a+b/c+d'));
