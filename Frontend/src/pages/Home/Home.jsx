import React from 'react';
import Navbar from '../../components/Navbar';
import NoteCard from '../../components/Cards/NoteCard';
import { MdAdd } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const handleAddNoteClick = () => {
    navigate('/create-note');
  };

  return (
    <>
      <Navbar />

      <div className='container mx-auto mt-8 px-4'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          <NoteCard 
            title='Meeting on 7th May' 
            date='3rd May 2025' 
            content='Meeting on 7th May' 
            tags='#Meeting'
            onEdit={() => {}}
            onDelete={() => {}}
            onPinNote={() => {}}
          />
        </div>
      </div>

      <button className='w-16 h-16 flex items-center justify-center rounded-2xl bg-primary hover:bg-blue-600 absolute right-10 bottom-10' onClick={handleAddNoteClick}>
        <MdAdd className='text-[32px] text-white' />
      </button>
    </>
  );
};

export default Home;
