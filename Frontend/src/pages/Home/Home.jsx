import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import NoteCard from '../../components/Cards/NoteCard';
import { MdAdd } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { getAllNotes, createNote, deleteNote, togglePinNote } from '../../services/noteService';

const Home = () => {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <>
      <Navbar onSearch={handleSearch} />

      <div className='container mx-auto mt-8 px-4'>
        {loading ? (
          <p>Loading notes...</p>
        ) : filteredNotes.length === 0 ? (
          <p className='text-center text-gray-500'>No notes found.</p>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {filteredNotes.map((note) => (
              <NoteCard
                key={note._id}
                title={note.title}
                date={new Date(note.updatedOn).toLocaleDateString()}
                content={note.content}
                tags={note.tags.join(', ')}
                isPinned={note.isPinned}
                onEdit={() => navigate(`/edit-note/${note._id}`)}
                onDelete={() => handleDeleteNote(note._id)}
                onPinNote={() => handlePinNote(note._id)}
              />
            ))}
          </div>
        )}
      </div>

      <button
        className='w-16 h-16 flex items-center justify-center rounded-2xl bg-primary hover:bg-blue-600 absolute right-10 bottom-10'
        onClick={handleAddNoteClick}
      >
        <MdAdd className='text-[32px] text-white' />
      </button>
    </>
  );
};

export default Home;