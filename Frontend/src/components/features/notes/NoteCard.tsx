import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Pin, Edit, Trash2, MoreVertical, User, Users, Clock } from 'lucide-react';
import type { Note } from '@/types/note.types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface NoteCardProps {
  note: Note;
  onEdit: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  onPin: (noteId: string) => void;
  viewMode?: 'grid' | 'list';
}

function NoteCardComponent({ note, onEdit, onDelete, onPin, viewMode = 'grid' }: NoteCardProps) {
  const isOwned = note.userId === note.owner.userId;

  const formattedDate = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(note.updatedOn), { addSuffix: true });
    } catch {
      return new Date(note.updatedOn).toLocaleDateString();
    }
  }, [note.updatedOn]);

  const truncatedContent = useMemo(() => {
    const text = note.content.replace(/<[^>]*>/g, '');
    const maxLength = viewMode === 'list' ? 150 : 120;
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }, [note.content, viewMode]);

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="hover:shadow-md hover:border-primary/20 transition-all duration-200 border border-border cursor-pointer hover:scale-[1.01]" onClick={() => onEdit(note._id)}>
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <TooltipProvider>
                    {isOwned ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <User className="h-3 w-3 text-[hsl(var(--success))]" />
                        </TooltipTrigger>
                        <TooltipContent>My Note</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Users className="h-3 w-3 text-[hsl(var(--info))]" />
                        </TooltipTrigger>
                        <TooltipContent>Shared Note</TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>
                  <h3 className="text-base font-semibold truncate">{note.title}</h3>
                  {note.isPinned && (
                    <Pin className="h-3 w-3 text-[hsl(var(--warning))] fill-[hsl(var(--warning))]" />
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formattedDate}</span>
                  </div>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {note.tags[0]}
                      </Badge>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {truncatedContent}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onPin(note._id); }}
                  className={cn('h-7 w-7 p-0', note.isPinned && 'text-[hsl(var(--warning))]')}
                >
                  <Pin className={`h-4 w-4 ${note.isPinned ? 'fill-current' : ''}`} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(note._id); }} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Grid view
  return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className="h-full"
      >
      <Card className="h-full flex flex-col hover:shadow-md hover:border-primary/20 transition-all duration-200 border border-border group cursor-pointer hover:scale-[1.02]" onClick={() => onEdit(note._id)}>
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <TooltipProvider>
                  {isOwned ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <User className="h-3 w-3 text-[hsl(var(--success))] shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>My Note</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Users className="h-3 w-3 text-[hsl(var(--info))] shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>Shared Note</TooltipContent>
                    </Tooltip>
                  )}
                </TooltipProvider>
                {note.isPinned && (
                  <Pin className="h-3 w-3 text-[hsl(var(--warning))] fill-[hsl(var(--warning))] shrink-0" />
                )}
              </div>
              <h3 className="text-base font-semibold line-clamp-2 mb-2">{note.title}</h3>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-7 w-7 p-0 shrink-0 hover:bg-accent">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin(note._id); }}>
                  <Pin className="mr-2 h-4 w-4" />
                  {note.isPinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(note._id); }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(note._id); }} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-2 flex-1">
            {truncatedContent}
          </p>

          <div className="flex items-center justify-between gap-2 mt-auto">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
            {note.tags && note.tags.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {note.tags[0]}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export const NoteCard = memo(NoteCardComponent);