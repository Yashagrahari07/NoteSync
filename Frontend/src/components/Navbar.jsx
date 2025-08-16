import React, { useState } from 'react';
import ProfileInfo from './Cards/ProfileInfo';
import { useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar/SearchBar';
import { logout } from '../services/authService';

const Navbar = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err.message);
    }
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const onClearSearch = () => {
    setSearchQuery("");
    if (onSearch) {
      onSearch("");
    }
  };

  const handleLogoClick = () => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('authToken='))
      ?.split('=')[1];
    
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  const token = document.cookie
    .split('; ')
    .find((row) => row.startsWith('authToken='))
    ?.split('=')[1];

  return (
    <div className='bg-white/90 backdrop-blur-md flex items-center justify-between px-6 py-3 drop-shadow-lg border-b border-gray-200/50'>
      {/* Logo */}
      <button 
        onClick={handleLogoClick}
        className="flex items-center space-x-2 hover:scale-105 transition-transform duration-200"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">N</span>
        </div>
        <h2 className='text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent'>
          NoteSync
        </h2>
      </button>

      <SearchBar 
        value={searchQuery} 
        onChange={({ target }) => {
          setSearchQuery(target.value);
        }} 
        handleSearch={handleSearch}
        onClearSearch={onClearSearch}
      />

      <div className="flex items-center gap-4">
        {token && (
          <button
            onClick={() => navigate("/join-note")}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
          >
            Join Note
          </button>
        )}

        {token ? (
          <ProfileInfo onLogout={handleLogout} />
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
          >
            Login
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
