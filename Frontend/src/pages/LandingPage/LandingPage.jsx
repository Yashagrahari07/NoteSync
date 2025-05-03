import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className='min-h-screen bg-gray-100 flex flex-col justify-between'>
      <header className='bg-primary text-white p-4'>
        <div className='max-w-7xl mx-auto flex justify-between items-center'>
          <h1 className='text-3xl font-semibold'>NoteSync</h1>
          <button onClick={handleGetStarted} className='bg-secondary px-4 py-2 rounded-md hover:bg-blue-600'>
            Get Started
          </button>
        </div>
      </header>

      <section className='flex-grow flex flex-col justify-center items-center text-center'>
        <h2 className='text-4xl font-bold mt-10 text-gray-800'>Collaborate in Real-Time</h2>
        <p className='text-lg text-gray-600 mt-4'>
          A simple, real-time collaborative notes application that lets you create, edit, and share notes with others.
        </p>
        <p className='text-lg text-gray-600 mt-4'>
          Create, update, and delete notes seamlessly while working together in real-time.
        </p>

        <div className='mt-10'>
          <button 
            onClick={handleGetStarted} 
            className='bg-primary text-white px-6 py-3 rounded-lg text-xl hover:bg-blue-600'>
            Get Started Now
          </button>
        </div>
      </section>

      <footer className='bg-gray-800 text-white py-4'>
        <div className='max-w-7xl mx-auto text-center'>
          <p>&copy; 2025 Real-Time Collaborative Notes App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
