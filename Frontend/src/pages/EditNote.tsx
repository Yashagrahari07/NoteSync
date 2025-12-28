import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { RichTextEditor } from '@/components/features/notes/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Pin, Users, Plus, X, MoreVertical, Trash2, History } from 'lucide-react';
import { useNote, useUpdateNote, useTogglePinNote, useAddCollaborator, useRemoveCollaborator, useDeleteNote } from '@/hooks/api/useNotes';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TypingIndicator } from '@/components/features/notes/TypingIndicator';
import { ActiveUsers } from '@/components/features/notes/ActiveUsers';
import { VersionHistory } from '@/components/features/notes/VersionHistory';
import { NoteMetadata } from '@/components/features/notes/NoteMetadata';
import { EditorStats } from '@/components/features/notes/EditorStats';
import { useAuthStore } from '@/stores/auth.store';
import { useNoteEditingStore } from '@/stores/noteEditing.store';
import { useDebouncedCallback } from 'use-debounce';

export default function EditNote() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const [newTag, setNewTag] = useState('');
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const isSavingRef = useRef(false);
  const previousSaveDataRef = useRef<{ title: string; content: string; description: string; tags: string[] } | null>(null);

  const { data: note, isLoading } = useNote(noteId || '');
  const updateNoteMutation = useUpdateNote();
  const togglePinMutation = useTogglePinNote();
  const addCollaboratorMutation = useAddCollaborator();
  const removeCollaboratorMutation = useRemoveCollaborator();
  const deleteNoteMutation = useDeleteNote();
  const { user } = useAuthStore();

  // Zustand store for note editing
  const {
    title,
    content,
    description,
    tags,
    activeUsers,
    typingUsers,
    setNote,
    updateTitle,
    updateDescription,
    updateTags,
    initializeSocket,
    cleanupSocket,
  } = useNoteEditingStore();

  // Initialize socket only when noteId changes (not when note data updates)
  useEffect(() => {
    if (noteId) {
      initializeSocket(noteId);
    }

    return () => {
      cleanupSocket();
    };
  }, [noteId, initializeSocket, cleanupSocket]);

  // Update store data when note changes (without reinitializing socket)
  useEffect(() => {
    if (note && noteId) {
      setNote(note);
    }
  }, [note, noteId, setNote]);

  // Listen for additional socket events (collaborator changes, conflicts, etc.)
  useEffect(() => {
    const socket = useNoteEditingStore.getState().socket;
    if (!socket) return;

    const handleLiveEdit = (_data: { note: any; editor: { fullname: string; userId: string }; timestamp: number }) => {
      // Typing indicator in UI already shows who is editing
      // No need for toast notification
    };

    const handleCollaboratorAdded = (data: { note: any; collaborator: { userId: string; fullname: string; email: string }; timestamp: number }) => {
      toast.success(`${data.collaborator.fullname} was added as a collaborator`, { duration: 3000 });
    };

    const handleCollaboratorRemoved = (data: { note: any; collaborator: { userId: string; fullname: string; email: string }; timestamp: number }) => {
      toast.info(`${data.collaborator.fullname} was removed as a collaborator`, { duration: 3000 });
    };

    const handleOperationApplied = (data: { operation: any; conflicts: any[]; resolution: any; updatedContent: string; timestamp: number }) => {
      if (data.conflicts && data.conflicts.length > 0) {
        toast.warning('Conflicts detected and resolved', { duration: 3000 });
      }
    };

    const handleConflictResolved = (_data: { conflicts: any[]; resolution: any; timestamp: number }) => {
      toast.success('Conflicts resolved successfully', { duration: 3000 });
    };

    const handleVersionRestored = (data: { note: any; version: number; restoredBy: string; timestamp: number }) => {
      toast.success(`Note restored to version ${data.version}`, { duration: 3000 });
    };

    const handleRateLimitExceeded = (data: { message: string; retryAfter: number; code: string }) => {
      toast.error(data.message || 'Rate limit exceeded. Please slow down.', { duration: 5000 });
    };


    socket.on('liveEdit', handleLiveEdit);
    socket.on('collaboratorAdded', handleCollaboratorAdded);
    socket.on('collaboratorRemoved', handleCollaboratorRemoved);
    socket.on('operationApplied', handleOperationApplied);
    socket.on('conflictResolved', handleConflictResolved);
    socket.on('versionRestored', handleVersionRestored);
    socket.on('rateLimitExceeded', handleRateLimitExceeded);

    return () => {
      socket.off('liveEdit', handleLiveEdit);
      socket.off('collaboratorAdded', handleCollaboratorAdded);
      socket.off('collaboratorRemoved', handleCollaboratorRemoved);
      socket.off('operationApplied', handleOperationApplied);
      socket.off('conflictResolved', handleConflictResolved);
      socket.off('versionRestored', handleVersionRestored);
      socket.off('rateLimitExceeded', handleRateLimitExceeded);
    };
  }, [user?._id]);

  // Autosave function with debouncing
  const performSave = async () => {
    if (!noteId || isSavingRef.current) return;

    const currentData = { title, content, description, tags };
    
    // Skip if data hasn't changed
    if (previousSaveDataRef.current) {
      const hasChanged = 
        previousSaveDataRef.current.title !== currentData.title ||
        previousSaveDataRef.current.content !== currentData.content ||
        previousSaveDataRef.current.description !== currentData.description ||
        JSON.stringify(previousSaveDataRef.current.tags) !== JSON.stringify(currentData.tags);
      
      if (!hasChanged) {
        return;
      }
    }

    isSavingRef.current = true;
    
    try {
      await updateNoteMutation.mutateAsync({
        noteId,
        ...currentData,
      });
      
      previousSaveDataRef.current = currentData;
    } catch (error) {
      toast.error('Failed to autosave note');
    } finally {
      isSavingRef.current = false;
    }
  };

  // Debounced autosave (2 seconds after user stops typing)
  const debouncedAutosave = useDebouncedCallback(performSave, 2000);

  // Initialize previous data when note loads
  // NOTE: Do NOT initialize lastSaved from note.updatedOn
  // lastSaved should only be set when the CURRENT USER saves (in performSave)
  // Initializing from note.updatedOn would show "Saved" for watchers who never saved
  useEffect(() => {
    if (note && noteId && !previousSaveDataRef.current) {
      previousSaveDataRef.current = { title, content, description, tags };
      // Don't set lastSaved here - it will be set when user actually saves
    }
  }, [note, noteId, title, content, description, tags]);

  // Trigger autosave when content changes (but not on initial load)
  useEffect(() => {
    if (noteId && note && previousSaveDataRef.current) {
      // Check if data actually changed
      const currentData = { title, content, description, tags };
      const hasChanged = 
        previousSaveDataRef.current.title !== currentData.title ||
        previousSaveDataRef.current.content !== currentData.content ||
        previousSaveDataRef.current.description !== currentData.description ||
        JSON.stringify(previousSaveDataRef.current.tags) !== JSON.stringify(currentData.tags);
      
      if (hasChanged) {
        debouncedAutosave();
      }
    }
  }, [title, content, description, tags, noteId, debouncedAutosave, note]);

  const handleTitleChange = (newTitle: string) => {
    updateTitle(newTitle);
  };

  const handleContentChange = (_newContent: string) => {
    // RichTextEditor handles content updates and WebSocket emission
  };

  const handlePinToggle = async () => {
    if (!noteId) return;
    try {
      await togglePinMutation.mutateAsync(noteId);
      toast.success(note?.isPinned ? 'Note unpinned' : 'Note pinned');
    } catch (error) {
      toast.error('Failed to toggle pin');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      updateTags(updatedTags);
      setNewTag('');
      if (noteId) {
        updateNoteMutation.mutate({ noteId, tags: updatedTags });
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    updateTags(updatedTags);
    if (noteId) {
      updateNoteMutation.mutate({ noteId, tags: updatedTags });
    }
  };

  const handleAddCollaborator = async () => {
    if (!noteId || !collaboratorEmail.trim()) return;

    try {
      await addCollaboratorMutation.mutateAsync({
        noteId,
        email: collaboratorEmail.trim(),
      });
      toast.success('Collaborator added successfully');
      setCollaboratorEmail('');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add collaborator');
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string, collaboratorName: string) => {
    if (!noteId) return;

    if (!confirm(`Are you sure you want to remove ${collaboratorName} from this note?`)) {
      return;
    }

    try {
      await removeCollaboratorMutation.mutateAsync({
        noteId,
        collaboratorId,
      });
      toast.success('Collaborator removed successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to remove collaborator');
    }
  };

  const handleDeleteNote = async () => {
    if (!noteId) return;

    try {
      await deleteNoteMutation.mutateAsync(noteId);
      toast.success('Note deleted successfully');
      navigate('/dashboard');
    } catch (error: any) {
      if (error?.response?.status === 403) {
        toast.error('You cannot delete this note. Only the owner can delete shared notes.');
      } else {
        toast.error('Failed to delete note');
      }
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-foreground">Note not found</h2>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled Note"
                className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto flex-1 min-w-0 text-foreground"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={note.isPinned ? 'default' : 'outline'}
                size="sm"
                onClick={handlePinToggle}
              >
                <Pin className={`h-4 w-4 ${note.isPinned ? 'fill-current' : ''}`} />
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Collaborator</DialogTitle>
                    <DialogDescription>
                      Enter the email address of the person you want to share this note with.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={collaboratorEmail}
                        onChange={(e) => setCollaboratorEmail(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddCollaborator();
                          }
                        }}
                      />
                      <Button onClick={handleAddCollaborator}>Add</Button>
                    </div>
                    {note.collaborators && note.collaborators.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Collaborators:</p>
                        <div className="space-y-2">
                          {note.collaborators.map((collab) => (
                            <div key={collab.userId} className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                              <div className="text-sm text-foreground">
                                <span className="font-medium">{collab.fullname}</span>
                                <span className="text-muted-foreground ml-2">({collab.email})</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveCollaborator(collab.userId, collab.fullname)}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {noteId && (
                    <DropdownMenuItem onClick={() => setShowVersionHistory(true)}>
                      <History className="mr-2 h-4 w-4" />
                      Version History
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Note
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Typing Indicator */}
            <TypingIndicator typingUsers={typingUsers} />
            
            {/* Editor Stats */}
            <EditorStats content={content} />
            
            {/* Tags */}
        <div className="mb-6 space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-2">
                {tag}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 h-5 w-5 p-0 hover:bg-destructive/20 rounded-full"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Add tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTag();
                  }
                }}
                className="w-32 h-8"
              />
              <Button size="sm" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

            {/* Editor */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <RichTextEditor
                content={content}
                onChange={handleContentChange}
                noteId={noteId || ''}
              />
            </motion.div>

            {/* Motivation Quote */}
            {note.quote && note.quote.text && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mt-6 p-6 rounded-lg border border-border/50 bg-muted/30"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl text-primary/50 leading-none mt-1">"</div>
                  <div className="flex-1">
                    <p className="text-lg italic text-foreground mb-2">
                      {note.quote.text}
                    </p>
                    {note.quote.author && (
                      <p className="text-sm text-muted-foreground text-right">
                        — {note.quote.author}
                      </p>
                    )}
                  </div>
                  <div className="text-4xl text-primary/50 leading-none mt-1 rotate-180">"</div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Note Metadata */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Active Users */}
              {activeUsers.length > 0 && (
                <div className="p-4 rounded-lg border border-border/50 bg-card">
                  <ActiveUsers users={activeUsers} currentUserId={user?._id} />
                </div>
              )}
              
              <NoteMetadata 
                note={note} 
                content={content} 
                description={description}
                onDescriptionChange={updateDescription}
                onDescriptionSave={(newDescription) => {
                  if (noteId) {
                    updateNoteMutation.mutate({ noteId, description: newDescription });
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Version History Dialog */}
      {noteId && (
        <VersionHistory 
          noteId={noteId} 
          open={showVersionHistory} 
          onOpenChange={setShowVersionHistory}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{note.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}