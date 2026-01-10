import { memo, useMemo } from 'react';
import { FileText, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditorStatsProps {
  content: string;
  className?: string;
  showReadingTime?: boolean;
}

function EditorStatsComponent({ content, className, showReadingTime = true }: EditorStatsProps) {
  const stats = useMemo(() => {
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    const words = textContent.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const charCount = textContent.length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words/min

    return {
      wordCount,
      charCount,
      readingTime,
    };
  }, [content]);

  return (
    <div className={cn('flex items-center gap-4 text-sm text-muted-foreground', className)}>
      <div className="flex items-center gap-1.5">
        <FileText className="h-4 w-4" />
        <span>
          {stats.wordCount.toLocaleString()} {stats.wordCount === 1 ? 'word' : 'words'}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span>{stats.charCount.toLocaleString()} characters</span>
      </div>
      {showReadingTime && (
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          <span>
            {stats.readingTime} {stats.readingTime === 1 ? 'min' : 'mins'} read
          </span>
        </div>
      )}
    </div>
  );
}

export const EditorStats = memo(EditorStatsComponent);

