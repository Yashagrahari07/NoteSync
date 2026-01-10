import { memo, useMemo, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Copy, Calendar, User, FileText, Clock, Hash, FileText as DescriptionIcon, Save } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useDebouncedCallback } from 'use-debounce';
import type { Note } from '@/types/note.types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NoteMetadataProps {
  note: Note;
  content: string;
  description?: string;
  onDescriptionChange?: (description: string) => void;
  onDescriptionSave?: (description: string) => void;
  className?: string;
}

function NoteMetadataComponent({ 
  note, 
  content, 
  description = '', 
  onDescriptionChange,
  onDescriptionSave,
  className 
}: NoteMetadataProps) {
  const [localDescription, setLocalDescription] = useState(description);
  const [isSavingDescription, setIsSavingDescription] = useState(false);

  // Update local state when prop changes
  useMemo(() => {
    setLocalDescription(description || '');
  }, [description]);

  const handleDescriptionChange = useCallback((value: string) => {
    setLocalDescription(value);
    onDescriptionChange?.(value);
  }, [onDescriptionChange]);

  const debouncedSave = useDebouncedCallback((value: string) => {
    if (onDescriptionSave && value !== description) {
      setIsSavingDescription(true);
      onDescriptionSave(value);
      setTimeout(() => setIsSavingDescription(false), 500);
    }
  }, 1000);

  const handleDescriptionBlur = useCallback(() => {
    if (localDescription !== description && onDescriptionSave) {
      setIsSavingDescription(true);
      onDescriptionSave(localDescription);
      setTimeout(() => setIsSavingDescription(false), 500);
    }
  }, [localDescription, description, onDescriptionSave]);
  // Calculate statistics
  const stats = useMemo(() => {
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    const words = textContent.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const charCount = textContent.length;
    const charCountNoSpaces = textContent.replace(/\s/g, '').length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words/min

    return {
      wordCount,
      charCount,
      charCountNoSpaces,
      readingTime,
    };
  }, [content]);

  const copyNoteId = () => {
    navigator.clipboard.writeText(note._id);
    toast.success('Note ID copied to clipboard');
  };

  const formatDate = (date: string | Date) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return {
        relative: formatDistanceToNow(dateObj, { addSuffix: true }),
        absolute: format(dateObj, 'PPp'),
      };
    } catch {
      return {
        relative: 'Unknown',
        absolute: 'Unknown',
      };
    }
  };

  // Always use createdOn for created date, never fallback to updatedOn
  // If createdOn doesn't exist, show "Unknown" instead of using updatedOn
  const createdDate = note.createdOn 
    ? formatDate(note.createdOn) 
    : { relative: 'Unknown', absolute: 'Unknown' };
  const updatedDate = formatDate(note.updatedOn);

  return (
    <Card className={cn('border-border/50', className)}>
      <CardContent className="p-4 space-y-4">
        {/* Owner */}
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {note.owner?.fullname?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {note.owner?.fullname || 'Unknown User'}
            </p>
            <p className="text-xs text-muted-foreground">Owner</p>
          </div>
        </div>

        <Separator />

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DescriptionIcon className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Description</p>
            {isSavingDescription && (
              <Save className="h-3 w-3 text-muted-foreground animate-pulse" />
            )}
          </div>
          <Textarea
            value={localDescription}
            onChange={(e) => {
              handleDescriptionChange(e.target.value);
              debouncedSave(e.target.value);
            }}
            onBlur={handleDescriptionBlur}
            placeholder="Add a description for this note..."
            className="min-h-20 text-sm resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {localDescription.length}/500
          </p>
        </div>

        <Separator />

        {/* Dates */}
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm text-foreground">{createdDate.relative}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{createdDate.absolute}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Last Updated</p>
              <p className="text-sm text-foreground">{updatedDate.relative}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{updatedDate.absolute}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Statistics */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Words</span>
            </div>
            <span className="text-sm font-medium text-foreground">{stats.wordCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground ml-6">Characters</span>
            <span className="text-sm font-medium text-foreground">{stats.charCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground ml-6">Reading Time</span>
            <span className="text-sm font-medium text-foreground">
              {stats.readingTime} {stats.readingTime === 1 ? 'min' : 'mins'}
            </span>
          </div>
        </div>

        <Separator />

        {/* Note ID */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Hash className="h-3 w-3" />
            Note ID
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded font-mono truncate">
              {note._id}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyNoteId}
              className="h-8 w-8 p-0 shrink-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Tags</p>
              <div className="flex flex-wrap gap-1">
                {note.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export const NoteMetadata = memo(NoteMetadataComponent);

