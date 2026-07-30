import { describe, it } from 'node:test';
import assert from 'node:assert';
import { detectContentFormat } from '../src/lib/engine/contentDetector';
import { normalizeUniversalPayload } from '../src/lib/engine/universalNormalizer';
import { detectSubjectCategory } from '../src/lib/engine/subjectDetector';
import { parseContentBySubject } from '../src/lib/engine/subjectParsers';
import { splitQuestionBlock } from '../src/lib/engine/questionSplitter';
import { validateQuestionPayload } from '../src/lib/engine/validationEngine';

describe('Modular AST Engine Pipeline Suite', () => {
  it('1. Content Detection Engine correctly classifies MS Word and LaTeX formats', () => {
    const wordHtml = '<p class="MsoNormal" style="mso-margin-top-alt:auto">Question text</p>';
    const detectWord = detectContentFormat(wordHtml);
    assert.strictEqual(detectWord.format, 'WORD_HTML');
    assert.strictEqual(detectWord.confidence > 0.9, true);

    const latexSrc = 'Calculate integral \\int_0^1 x^2 dx = \\frac{1}{3}';
    const detectLatex = detectContentFormat(latexSrc);
    assert.strictEqual(detectLatex.format, 'LATEX_SOURCE');
    assert.strictEqual(detectLatex.hasLaTeX, true);
  });

  it('2. Universal Normalizer cleans Word HTML without destroying structure', () => {
    const wordPayload = '<p class="MsoNormal"><b>Bold Question</b> with <i>italics</i></p>';
    const normalized = normalizeUniversalPayload(wordPayload);
    assert.strictEqual(normalized.cleanContent.includes('<b>Bold Question</b>'), true);
    assert.strictEqual(normalized.cleanContent.includes('<i>italics</i>'), true);
    assert.strictEqual(normalized.cleanContent.includes('MsoNormal'), false);
  });

  it('3. Subject Detection Engine correctly scores Mathematics and Chemistry', () => {
    const mathText = 'Calculate derivative of matrix and integral of sin(x) log(x)';
    const mathSubj = detectSubjectCategory(mathText);
    assert.strictEqual(mathSubj.primarySubject, 'MATHEMATICS');

    const chemText = 'Find oxidation state of KMnO4 and TiF6^2- in reaction equilibrium';
    const chemSubj = detectSubjectCategory(chemText);
    assert.strictEqual(chemSubj.primarySubject, 'CHEMISTRY');
  });

  it('4. Subject Parsers handle domain-specific tokens', () => {
    const mathRes = parseContentBySubject('Solve sqrt(x^2 + 1)', 'MATHEMATICS');
    assert.strictEqual(mathRes.renderedText.includes('\\sqrt{'), true);

    const chemRes = parseContentBySubject('TiF6^2-', 'CHEMISTRY');
    assert.strictEqual(chemRes.renderedText.includes('TiF_{6}^{2-}'), true);
  });

  it('5. Question Splitter isolates Question, Options A-D, Answer, and Solution', () => {
    const blockText = `Find the value of x in 2x + 4 = 10
(1) 3
(2) 4
(3) 5
(4) 6
Answer: (1)
Detailed Solution: 2x = 6 => x = 3`;

    const splitted = splitQuestionBlock(blockText);
    assert.strictEqual(splitted.questionText, 'Find the value of x in 2x + 4 = 10');
    assert.strictEqual(splitted.optionA, '3');
    assert.strictEqual(splitted.optionB, '4');
    assert.strictEqual(splitted.optionC, '5');
    assert.strictEqual(splitted.optionD, '6');
    assert.strictEqual(splitted.correctAnswer, 'A');
    assert.strictEqual(splitted.detailedSolution.includes('x = 3'), true);
  });

  it('6. Validation Engine flags unclosed brackets and missing options', () => {
    const report = validateQuestionPayload({
      questionText: 'Solve \\sqrt{x^2 + 1',
      optionA: '1',
      optionB: '1', // Duplicate option warning
    });

    assert.strictEqual(report.warnings.length > 0, true);
    assert.strictEqual(report.warnings.some(w => w.code === 'UNBALANCED_BRACKETS'), true);
    assert.strictEqual(report.warnings.some(w => w.code === 'DUPLICATE_OPTIONS'), true);
  });
});
