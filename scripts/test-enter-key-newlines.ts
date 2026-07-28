import { formatCleanText } from '../src/lib/pasteUtils';
import assert from 'assert';

console.log('Testing Enter key newlines and alignment preservation...');

// Case 1: Trailing newline when user presses Enter
const textWithEnter = 'Question line 1\n';
const formatted1 = formatCleanText(textWithEnter);
assert.strictEqual(formatted1, 'Question line 1\n', `Expected trailing newline preserved, got: ${JSON.stringify(formatted1)}`);

// Case 2: Multi-line question without period ending line 1
const textMultiLine = 'A dipole of dipole moment P\nplaced in electric field E\nFind period of oscillation';
const formatted2 = formatCleanText(textMultiLine);
assert.strictEqual(formatted2.includes('\nplaced in electric field E\n'), true, `Expected lines NOT to be merged, got: ${JSON.stringify(formatted2)}`);

// Case 3: Math auto-conversion on line 2
const textWithMath = 'Line 1\n(x^2+3x+2)/(x-1) = (2x+5)/3\nLine 3';
const formatted3 = formatCleanText(textWithMath);
assert.strictEqual(formatted3.includes('Line 1\n'), true);
assert.strictEqual(formatted3.includes('Line 3'), true);
assert.strictEqual(formatted3.includes('\\frac{x^2+3x+2}{x-1}'), true);

console.log('✅ ALL ENTER KEY AND NEWLINE ALIGNMENT TESTS PASSED!');
