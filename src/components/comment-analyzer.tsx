'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from './ui/textarea';
import { analyzeCommentAction } from '@/app/actions';
import { WandSparkles, Loader2 } from 'lucide-react';
import type { AnalyzeCommentOutput } from '@/ai/flows/comment-analysis';
import { Separator } from './ui/separator';

interface CommentAnalyzerProps {
  comment: string;
  onCommentUpdate: (newComment: string) => void;
  children?: React.ReactNode;
}

export function CommentAnalyzer({ comment, onCommentUpdate, children }: CommentAnalyzerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeCommentOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!comment) {
      setError('Please enter a comment to analyze.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeCommentAction({ comment });
      if ('error' in result) {
        throw new Error(result.error);
      }
      setAnalysisResult(result);
    } catch (e: any) {
      setError(e.message || 'Failed to analyze comment. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseImprovedComment = () => {
    if (analysisResult?.improvedComment) {
      onCommentUpdate(analysisResult.improvedComment);
      setIsOpen(false);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state on close
      setAnalysisResult(null);
      setIsLoading(false);
      setError(null);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="icon" aria-label="Analyze Comment">
            <WandSparkles className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>AI Comment Assistant</DialogTitle>
          <DialogDescription>
            Analyze your comment to ensure it's positive and constructive.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Original Comment</h3>
            <Textarea readOnly value={comment || 'No comment provided.'} />
          </div>

          {analysisResult ? null : (
            <Button onClick={handleAnalyze} disabled={isLoading || !comment}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Comment'
              )}
            </Button>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          
          {isLoading && !analysisResult && (
             <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          )}

          {analysisResult && (
            <div className="grid gap-4">
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Analysis</h3>
                <p className="text-sm text-muted-foreground p-3 bg-secondary rounded-md">{analysisResult.analysis}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Suggested Improvement</h3>
                <Textarea readOnly value={analysisResult.improvedComment} rows={4} className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"/>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          {analysisResult && (
            <Button type="button" onClick={handleUseImprovedComment}>
              Use Improved Comment
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}