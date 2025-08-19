import React, { useState } from 'react';
import ProfileInfo from './Cards/ProfileInfo';
import { useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar/SearchBar';
import NotificationDropdown from './NotificationDropdown';
import MobileSearchModal from './MobileSearchModal';
import { MdSearch } from 'react-icons/md';
import { logout } from '../services/authService';

const Navbar = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

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
    <div className='bg-white/95 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 py-3 shadow-sm border-b border-gray-200/50 sticky top-0 z-40'>
      {/* Logo */}
      <button 
        onClick={handleLogoClick}
        className="flex items-center space-x-2 hover:scale-105 transition-transform duration-200 flex-shrink-0"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-sm">N</span>
        </div>
        <h2 className='text-lg lg:text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent'>
          NoteSync
        </h2>
      </button>

      {/* Search Bar - Hidden on mobile */}
      <div className="hidden md:block flex-1 max-w-2xl mx-4 lg:mx-8">
        <SearchBar 
          value={searchQuery} 
          onChange={({ target }) => {
            setSearchQuery(target.value);
          }} 
          handleSearch={handleSearch}
          onClearSearch={onClearSearch}
        />
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2 lg:gap-4">
        {token && (
          <>
            {/* Mobile Search Button */}
            <button 
              onClick={() => setIsMobileSearchOpen(true)}
              className="md:hidden p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <MdSearch className="text-xl" />
            </button>
            
            <NotificationDropdown />
            
            <button
              onClick={() => navigate("/join-note")}
              className="hidden sm:inline-flex items-center gap-2 px-3 lg:px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium text-sm"
            >
              <span className="hidden lg:inline">Join Note</span>
              <span className="lg:hidden">Join</span>
            </button>
          </>
        )}

        {token ? (
          <ProfileInfo onLogout={handleLogout} />
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="px-3 lg:px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium text-sm"
          >
            Login
          </button>
        )}
      </div>

      {/* Mobile Search Modal */}
      <MobileSearchModal
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
        onSearch={(query) => {
          setSearchQuery(query);
          if (onSearch) onSearch(query);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={onClearSearch}
      />
    </div>
  );
};

export default Navbar;
