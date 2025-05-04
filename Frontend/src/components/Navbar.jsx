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

  const token = document.cookie
    .split('; ')
    .find((row) => row.startsWith('authToken='))
    ?.split('=')[1];

  return (
    <div className='bg-white flex items-center justify-between px-6 py-2 drop-shadow-2xl'>
      <h2 className='text-xl font-medium text-block py-2'>NoteSync</h2>

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
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-700"
          >
            Join Note
          </button>
        )}

        {token ? (
          <ProfileInfo onLogout={handleLogout} />
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700"
          >
            Login
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
