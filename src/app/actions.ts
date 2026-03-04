'use server';

import { analyzeComment, AnalyzeCommentInput, AnalyzeCommentOutput } from '@/ai/flows/comment-analysis';

export async function analyzeCommentAction(input: AnalyzeCommentInput): Promise<AnalyzeCommentOutput | { error: string }> {
  try {
    const output = await analyzeComment(input);
    return output;
  } catch (error) {
    console.error('Error in analyzeCommentAction:', error);
    // Instead of throwing, return a structured error object.
    // This is a more robust way to handle errors in Server Actions.
    return { error: 'Failed to analyze comment due to a server error.' };
  }
}