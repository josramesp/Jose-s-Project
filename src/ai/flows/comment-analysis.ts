'use server';
/**
 * @fileOverview A flow that analyzes teacher comments and suggests improvements to ensure they are positive and constructive.
 *
 * - analyzeComment - Analyzes a comment and returns suggestions for improvement.
 * - AnalyzeCommentInput - The input type for the analyzeComment function.
 * - AnalyzeCommentOutput - The return type for the analyzeComment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCommentInputSchema = z.object({
  comment: z
    .string()
    .describe('The comment to be analyzed.'),
});
export type AnalyzeCommentInput = z.infer<typeof AnalyzeCommentInputSchema>;

const AnalyzeCommentOutputSchema = z.object({
  improvedComment: z
    .string()
    .describe('The improved comment with suggestions incorporated.'),
  analysis: z.string().describe('The analysis of the original comment.'),
});
export type AnalyzeCommentOutput = z.infer<typeof AnalyzeCommentOutputSchema>;

export async function analyzeComment(input: AnalyzeCommentInput): Promise<AnalyzeCommentOutput> {
  return analyzeCommentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCommentPrompt',
  input: {schema: AnalyzeCommentInputSchema},
  output: {schema: AnalyzeCommentOutputSchema},
  prompt: `You are an AI assistant designed to help teachers write positive and constructive comments for their students.

You will receive a comment and provide an improved version of the comment, as well as an analysis of the original comment.

Original Comment: {{{comment}}}

Improved Comment:`,
});

const analyzeCommentFlow = ai.defineFlow(
  {
    name: 'analyzeCommentFlow',
    inputSchema: AnalyzeCommentInputSchema,
    outputSchema: AnalyzeCommentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);