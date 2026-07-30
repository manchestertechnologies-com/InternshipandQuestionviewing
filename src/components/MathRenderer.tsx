'use client';

/**
 * MathRenderer — Backward-Compatible Wrapper
 * ===========================================
 * This component is now a thin wrapper over QuestionRenderer.
 *
 * All existing callers continue to work unchanged.
 * New code should use <QuestionRenderer> directly.
 *
 * The subject defaults to 'Physics' (the most common mixed-content subject)
 * which uses the math/physics KaTeX pipeline.
 */

import React from 'react';
import QuestionRenderer from '@/components/QuestionRenderer';

interface MathRendererProps {
  text: string;
  className?: string;
  inline?: boolean;
  subject?: string;
}

export default function MathRenderer({
  text,
  className = '',
  inline = false,
  subject = 'Physics',
}: MathRendererProps) {
  return (
    <QuestionRenderer
      text={text}
      subject={subject}
      inline={inline}
      className={className}
    />
  );
}
