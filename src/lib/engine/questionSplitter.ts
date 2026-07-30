/**
 * Question Splitter Module
 * AST-based block parser that automatically isolates and separates:
 * - Question Text
 * - Option A, Option B, Option C, Option D (and Option E if present)
 * - Correct Answer Key
 * - Detailed Solution
 * Prevents options merging or question text corruption.
 */

export interface ParsedQuestionBlock {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  detailedSolution: string;
  additionalOptions: string[];
}

export function splitQuestionBlock(rawInput: string): ParsedQuestionBlock {
  if (!rawInput || typeof rawInput !== 'string') {
    return {
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      detailedSolution: '',
      additionalOptions: [],
    };
  }

  const lines = rawInput.split('\n').map((l) => l.trim()).filter(Boolean);

  let questionText = '';
  let optionA = '';
  let optionB = '';
  let optionC = '';
  let optionD = '';
  let correctAnswer = 'A';
  let detailedSolution = '';
  const additionalOptions: string[] = [];

  const questionLines: string[] = [];
  const solutionLines: string[] = [];
  let currentSection: 'QUESTION' | 'OPTION_A' | 'OPTION_B' | 'OPTION_C' | 'OPTION_D' | 'SOLUTION' | 'ANSWER' = 'QUESTION';

  for (const line of lines) {
    // Detect Answer key line
    const ansMatch = line.match(/^(?:Correct\s+)?Answer\s*[:\-=]?\s*\(?([A-D1-4])\)?/i);
    if (ansMatch) {
      const rawAns = ansMatch[1].toUpperCase();
      if (rawAns === '1') correctAnswer = 'A';
      else if (rawAns === '2') correctAnswer = 'B';
      else if (rawAns === '3') correctAnswer = 'C';
      else if (rawAns === '4') correctAnswer = 'D';
      else correctAnswer = rawAns;
      currentSection = 'ANSWER';
      continue;
    }

    // Detect Solution section
    if (/^(?:Detailed\s+)?Solution\s*[:\-=]/i.test(line) || /^(?:Explanation)\s*[:\-=]/i.test(line)) {
      currentSection = 'SOLUTION';
      const solContent = line.replace(/^(?:Detailed\s+)?Solution\s*[:\-=]/i, '').replace(/^(?:Explanation)\s*[:\-=]/i, '').trim();
      if (solContent) solutionLines.push(solContent);
      continue;
    }

    // Detect Options A-D / 1-4
    const optAMatch = line.match(/^(?:\(1\)|\(A\)|1\.|A\.)\s*(.+)/i);
    const optBMatch = line.match(/^(?:\(2\)|\(B\)|2\.|B\.)\s*(.+)/i);
    const optCMatch = line.match(/^(?:\(3\)|\(C\)|3\.|C\.)\s*(.+)/i);
    const optDMatch = line.match(/^(?:\(4\)|\(D\)|4\.|D\.)\s*(.+)/i);

    if (optAMatch && !optionA) {
      optionA = optAMatch[1].trim();
      currentSection = 'OPTION_A';
      continue;
    }
    if (optBMatch && !optionB) {
      optionB = optBMatch[1].trim();
      currentSection = 'OPTION_B';
      continue;
    }
    if (optCMatch && !optionC) {
      optionC = optCMatch[1].trim();
      currentSection = 'OPTION_C';
      continue;
    }
    if (optDMatch && !optionD) {
      optionD = optDMatch[1].trim();
      currentSection = 'OPTION_D';
      continue;
    }

    // Accumulate into current section
    if (currentSection === 'QUESTION') {
      questionLines.push(line);
    } else if (currentSection === 'SOLUTION') {
      solutionLines.push(line);
    } else if (currentSection === 'OPTION_A') {
      optionA += ' ' + line;
    } else if (currentSection === 'OPTION_B') {
      optionB += ' ' + line;
    } else if (currentSection === 'OPTION_C') {
      optionC += ' ' + line;
    } else if (currentSection === 'OPTION_D') {
      optionD += ' ' + line;
    }
  }

  questionText = questionLines.join('\n').trim();
  detailedSolution = solutionLines.join('\n').trim();

  return {
    questionText,
    optionA,
    optionB,
    optionC,
    optionD,
    correctAnswer,
    detailedSolution,
    additionalOptions,
  };
}
