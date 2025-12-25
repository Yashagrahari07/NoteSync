import { useState, useEffect } from 'react';
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
import { ArrowLeft, Pin, Users, Plus, X, MoreVertical, Save, Trash2 } from 'lucide-react';
import { useNote, useUpdateNote, useTogglePinNote, useAddCollaborator, useRemoveCollaborator } from '@/hooks/api/useNotes';
import { useSocket } from '@/hooks/socket/useSocket';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TypingIndicator } from '@/components/features/notes/TypingIndicator';
import { ActiveUsers } from '@/components/features/notes/ActiveUsers';
import { VersionHistory } from '@/components/features/notes/VersionHistory';
import { useAuthStore } from '@/stores/auth.store';

export default function EditNote() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; userFullname: string; timestamp: number }>>([]);
  const [activeUsers, setActiveUsers] = useState<Array<{ userId: string; fullname: string }>>([]);

  const { data: note, isLoading } = useNote(noteId || '');
  const updateNoteMutation = useUpdateNote();
  const togglePinMutation = useTogglePinNote();
  const addCollaboratorMutation = useAddCollaborator();
  const removeCollaboratorMutation = useRemoveCollaborator();
  const { socket, emitOptimized, emitTypingStart, emitTypingStop } = useSocket(noteId);
  const { user } = useAuthStore();

  // Initialize state from note data
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setTags(note.tags || []);
    }
  }, [note]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNoteUpdate = (data: { title?: string; content?: string; tags?: string[] }) => {
      if (data.title !== undefined && data.title !== title) {
        setTitle(data.title);
      }
      if (data.content !== undefined && data.content !== content) {
        setContent(data.content);
      }
      if (data.tags !== undefined) {
        setTags(data.tags);
      }
    };

    const handleUserJoined = (data: { user: { userId: string; fullname: string }; activeUsers: Array<{ userId: string; fullname: string }> }) => {
      setActiveUsers(data.activeUsers);
    };

    const handleUserLeft = (data: { user: { userId: string; fullname: string }; activeUsers: Array<{ userId: string; fullname: string }> }) => {
      setActiveUsers(data.activeUsers);
    };

    const handleUserTyping = (data: { userId: string; userFullname: string; timestamp: number }) => {
      setTypingUsers((prev) => {
        const filtered = prev.filter((u) => u.userId !== data.userId);
        return [...filtered, data];
      });
    };

    const handleUserStoppedTyping = (data: { userId: string; timestamp: number }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    };

    socket.on('noteUpdated', handleNoteUpdate);
    socket.on('userJoined', handleUserJoined);
    socket.on('userLeft', handleUserLeft);
    socket.on('userTyping', handleUserTyping);
    socket.on('userStoppedTyping', handleUserStoppedTyping);

    return () => {
      socket.off('noteUpdated', handleNoteUpdate);
      socket.off('userJoined', handleUserJoined);
      socket.off('userLeft', handleUserLeft);
      socket.off('userTyping', handleUserTyping);
      socket.off('userStoppedTyping', handleUserStoppedTyping);
    };
  }, [socket, title, content]);

  const handleSave = async () => {
    if (!noteId) return;

    setIsSaving(true);
    try {
      await updateNoteMutation.mutateAsync({
        noteId,
        title,
        content,
        tags,
      });
      toast.success('Note saved');
    } catch (error) {
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (socket && noteId) {
      emitOptimized('editNote', { noteId, title: newTitle }, 500);
      emitTypingStart(noteId);
      setTimeout(() => emitTypingStop(noteId), 2000);
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    // RichTextEditor already handles socket emission
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
      setTags(updatedTags);
      setNewTag('');
      if (noteId) {
        updateNoteMutation.mutate({ noteId, tags: updatedTags });
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(updatedTags);
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
                className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto flex-1 min-w-0"
              />
            </div>
            <div className="flex items-center gap-2">
              {activeUsers.length > 0 && (
                <ActiveUsers users={activeUsers} currentUserId={user?._id} />
              )}
              {noteId && <VersionHistory noteId={noteId} />}
              <Button
                variant={note.isPinned ? 'default' : 'outline'}
                size="sm"
                onClick={handlePinToggle}
              >
                <Pin className={`h-4 w-4 ${note.isPinned ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Save className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
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
                        <p className="text-sm font-medium">Collaborators:</p>
                        <div className="space-y-2">
                          {note.collaborators.map((collab) => (
                            <div key={collab.userId} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                              <div className="text-sm text-foreground">
                                <span className="font-medium">{collab.fullname}</span>
                                <span className="text-muted-foreground ml-2">({collab.email})</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveCollaborator(collab.userId, collab.fullname)}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
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
                  <DropdownMenuItem onClick={handlePinToggle}>
                    <Pin className="mr-2 h-4 w-4" />
                    {note.isPinned ? 'Unpin' : 'Pin'} Note
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Typing Indicator */}
        <TypingIndicator typingUsers={typingUsers} />
        
        {/* Tags */}
        <div className="mb-6 space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-2">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
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
      </div>
    </div>
  );
}

