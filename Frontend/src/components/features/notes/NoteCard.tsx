import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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
        <Card className="hover:shadow-md transition-all duration-200 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <TooltipProvider>
                    {isOwned ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <User className="h-3 w-3 text-green-500" />
                        </TooltipTrigger>
                        <TooltipContent>My Note</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Users className="h-3 w-3 text-purple-500" />
                        </TooltipTrigger>
                        <TooltipContent>Shared Note</TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>
                  <h3 className="text-base font-semibold truncate">{note.title}</h3>
                  {note.isPinned && (
                    <Pin className="h-3 w-3 text-yellow-500 fill-yellow-500" />
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
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPin(note._id)}
                  className={note.isPinned ? 'text-yellow-500' : ''}
                >
                  <Pin className={`h-4 w-4 ${note.isPinned ? 'fill-current' : ''}`} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEdit(note._id)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onDelete(note._id)} className="text-destructive">
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
      <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-200 border-border/50 group">
        <CardContent className="p-6 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <TooltipProvider>
                  {isOwned ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <User className="h-3 w-3 text-green-500" />
                      </TooltipTrigger>
                      <TooltipContent>My Note</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Users className="h-3 w-3 text-purple-500" />
                      </TooltipTrigger>
                      <TooltipContent>Shared Note</TooltipContent>
                    </Tooltip>
                  )}
                </TooltipProvider>
                {note.isPinned && (
                  <Pin className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <h3 className="text-lg font-semibold line-clamp-2 mb-2">{note.title}</h3>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onPin(note._id)}>
                  <Pin className="mr-2 h-4 w-4" />
                  {note.isPinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(note._id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(note._id)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Clock className="h-3 w-3" />
            <span>{formattedDate}</span>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
            {truncatedContent}
          </p>

          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {note.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-6 pt-0">
          <Button
            onClick={() => onEdit(note._id)}
            className="w-full"
            variant="default"
          >
            Open Note
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export const NoteCard = memo(NoteCardComponent);