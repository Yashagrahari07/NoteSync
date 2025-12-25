import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { NoteCard } from '@/components/features/notes/NoteCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Grid3x3, List, Star } from 'lucide-react';
import { useNotes, useDeleteNote, useTogglePinNote, useCreateNote } from '@/hooks/api/useNotes';
import { useUIStore } from '@/stores/ui.store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  const [filter, setFilter] = useState<'all' | 'pinned' | 'owned' | 'shared'>('all');
  
  // Build query params for server-side filtering
  const queryParams = useMemo(() => {
    const params: any = {
      sortBy: sortBy === 'updated' ? 'updatedOn' : sortBy === 'created' ? 'createdOn' : 'title',
      sortOrder: -1,
    };

    if (searchQuery) {
      params.search = searchQuery;
    }

    // Set filterType based on filter state
    if (filter === 'owned') {
      params.filterType = 'owned';
    } else if (filter === 'shared') {
      params.filterType = 'shared';
    } else {
      params.filterType = 'all';
    }

    // Pinned filter can be combined with filterType
    if (filter === 'pinned') {
      params.isPinned = true;
    }

    return params;
  }, [searchQuery, sortBy, filter]);

  const { data: notes = [], isLoading } = useNotes(queryParams);
  const deleteNoteMutation = useDeleteNote();
  const togglePinMutation = useTogglePinNote();
  const createNoteMutation = useCreateNote();

  // Backend handles all filtering now, no client-side filtering needed
  const filteredNotes = notes;

  const handleCreateNote = async () => {
    try {
      const newNote = await createNoteMutation.mutateAsync({
        title: 'Untitled Note',
        content: '',
      });
      navigate(`/edit-note/${newNote._id}`);
      toast.success('Note created successfully');
    } catch (error) {
      toast.error('Failed to create note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNoteMutation.mutateAsync(noteId);
      toast.success('Note deleted successfully');
    } catch (error: any) {
      if (error?.response?.status === 403) {
        toast.error('You cannot delete this note. Only the owner can delete shared notes.');
      } else {
        toast.error('Failed to delete note');
      }
    }
  };

  const handlePinNote = async (noteId: string) => {
    try {
      await togglePinMutation.mutateAsync(noteId);
    } catch (error) {
      toast.error('Failed to pin/unpin note');
    }
  };

  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex relative">
        <Sidebar />
        <main
          className={cn(
            'flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-300 ease-in-out w-full',
            sidebarOpen && 'md:ml-64'
          )}
        >
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">All Notes</h1>
                <p className="text-muted-foreground mt-1">
                  {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
                </p>
              </div>
              <Button onClick={handleCreateNote} variant="outline" className="gap-2" size="lg">
                <Plus className="h-4 w-4" />
                New Note
              </Button>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated">Last Updated</SelectItem>
                    <SelectItem value="created">Date Created</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
                <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                  <TabsList>
                    <TabsTrigger value="grid">
                      <Grid3x3 className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="list">
                      <List className="h-4 w-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Filter Tabs */}
            <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pinned" className="gap-2">
                  <Star className="h-3 w-3" />
                  Pinned
                </TabsTrigger>
                <TabsTrigger value="owned">My Notes</TabsTrigger>
                <TabsTrigger value="shared">Shared</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Notes Grid/List */}
            {isLoading ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className={viewMode === 'grid' ? 'h-48' : 'h-24'} />
                ))}
              </div>
            ) : filteredNotes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="rounded-full bg-muted p-6 mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No notes found</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  {searchQuery
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first note'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleCreateNote} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Note
                  </Button>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}
              >
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    onEdit={(noteId) => navigate(`/edit-note/${noteId}`)}
                    onDelete={handleDeleteNote}
                    onPin={handlePinNote}
                    viewMode={viewMode}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

