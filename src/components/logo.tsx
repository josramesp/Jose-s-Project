import { BookOpenCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <BookOpenCheck className="h-8 w-8 text-primary" />
      <div className="flex flex-col">
        <h1 className="text-xl font-bold tracking-tighter text-primary">ETNS</h1>
        <p className="text-sm text-muted-foreground -mt-1">Easy Training Nicaraguan School</p>
      </div>
    </div>
  );
}