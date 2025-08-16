import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import NoteCard from '../../components/Cards/NoteCard';
import DashboardStats from '../../components/DashboardStats';
import EmptyState from '../../components/EmptyState';
import { MdAdd, MdSearch, MdFilterList, MdViewList, MdViewModule } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { getAllNotes, createNote, deleteNote, togglePinNote } from '../../services/noteService';

const Home = () => {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('updated'); // 'updated', 'created', 'title'
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [ownershipFilter, setOwnershipFilter] = useState('all'); // 'all', 'owned', 'shared'
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await getAllNotes();
        setNotes(data);
        setFilteredNotes(data);
      } catch (err) {
        console.error('Failed to fetch notes:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const handleAddNoteClick = async () => {
    try {
      const newNote = await createNote();
      navigate(`/edit-note/${newNote._id}`);
    } catch (err) {
      console.error('Failed to create note:', err.message);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteNote(noteId);
      setNotes((prevNotes) => prevNotes.filter((note) => note._id !== noteId));
      setFilteredNotes((prevNotes) => prevNotes.filter((note) => note._id !== noteId));
    } catch (err) {
      console.error('Failed to delete note:', err.message);
    }
  };

  const handlePinNote = async (noteId) => {
    try {
      const updatedNote = await togglePinNote(noteId);

      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note._id === updatedNote._id ? updatedNote : note
        )
      );

      setFilteredNotes((prevNotes) =>
        prevNotes.map((note) =>
          note._id === updatedNote._id ? updatedNote : note
        )
      );
    } catch (err) {
      console.error("Failed to pin/unpin note:", err.message);
    }
  };

  const handleSearch = (query) => {
    if (!query) {
      setFilteredNotes(notes);
    } else {
      const lowerCaseQuery = query.toLowerCase();
      setFilteredNotes(
        notes.filter(
          (note) =>
            note.title.toLowerCase().includes(lowerCaseQuery) ||
            note.content.toLowerCase().includes(lowerCaseQuery) ||
            note.tags.some((tag) => tag.toLowerCase().includes(lowerCaseQuery))
        )
      );
    }
  };

  const sortNotes = (notesToSort) => {
    return [...notesToSort].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created':
          return new Date(b.createdOn) - new Date(a.createdOn);
        case 'updated':
        default:
          return new Date(b.updatedOn) - new Date(a.updatedOn);
      }
    });
  };

  const filterAndSortNotes = () => {
    let filtered = notes;
    
    // Filter by ownership
    if (ownershipFilter === 'owned') {
      filtered = filtered.filter(note => note.owner === note.createdBy);
    } else if (ownershipFilter === 'shared') {
      filtered = filtered.filter(note => note.owner !== note.createdBy);
    }
    
    // Filter by pinned status
    if (showPinnedOnly) {
      filtered = filtered.filter(note => note.isPinned);
    }
    
    return sortNotes(filtered);
  };

  useEffect(() => {
    setFilteredNotes(filterAndSortNotes());
  }, [notes, sortBy, showPinnedOnly, ownershipFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar onSearch={handleSearch} />

      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Stats */}
        <DashboardStats notes={notes} />

        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {ownershipFilter === 'owned' ? 'My Notes' : 
                 ownershipFilter === 'shared' ? 'Shared Notes' : 'All Notes'}
              </h1>
              <p className="text-gray-600">
                {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'} • {notes.filter(note => note.isPinned).length} pinned
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-gray-600 hover:text-primary'
                  }`}
                >
                  <MdViewModule className="text-lg" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-gray-600 hover:text-primary'
                  }`}
                >
                  <MdViewList className="text-lg" />
                </button>
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="updated">Last Updated</option>
                <option value="created">Date Created</option>
                <option value="title">Title</option>
              </select>

              {/* Pinned Filter */}
              <button
                onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  showPinnedOnly
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <MdFilterList className="inline mr-1" />
                Pinned Only
              </button>

              {/* Ownership Filter */}
              <div className="flex items-center bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                <button
                  onClick={() => setOwnershipFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    ownershipFilter === 'all'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:text-primary'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setOwnershipFilter('owned')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    ownershipFilter === 'owned'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:text-primary'
                  }`}
                >
                  My Notes
                </button>
                <button
                  onClick={() => setOwnershipFilter('shared')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    ownershipFilter === 'shared'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:text-primary'
                  }`}
                >
                  Shared
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your notes...</p>
            </div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <EmptyState 
            showPinnedOnly={showPinnedOnly}
            ownershipFilter={ownershipFilter}
            onCreateNote={handleAddNoteClick}
          />
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'space-y-4'
          }>
                         {filteredNotes.map((note) => (
               <NoteCard
                 key={note._id}
                 title={note.title}
                 date={new Date(note.updatedOn).toLocaleDateString()}
                 content={note.content}
                 tags={note.tags.join(', ')}
                 isPinned={note.isPinned}
                 viewMode={viewMode}
                 owner={note.owner}
                 createdBy={note.createdBy}
                 onEdit={() => navigate(`/edit-note/${note._id}`)}
                 onDelete={() => handleDeleteNote(note._id)}
                 onPinNote={() => handlePinNote(note._id)}
               />
             ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        className='fixed right-8 bottom-8 w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 z-10'
        onClick={handleAddNoteClick}
      >
        <MdAdd className='text-3xl' />
      </button>
    </div>
  );
};

export default Home;