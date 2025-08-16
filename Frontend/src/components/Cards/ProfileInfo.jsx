import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getInitials } from '../../utils/helper';
import { FaUser, FaCog, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';
import { MdEmail, MdAccessTime } from 'react-icons/md';

const ProfileInfo = ({ onLogout }) => {
  const { user } = useSelector((state) => state.auth);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently joined';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-blue-600 text-white font-semibold text-sm shadow-md">
            {getInitials(user?.fullname || 'Guest')}
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        
        {/* User Info */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-gray-800 truncate max-w-32">
            {user?.fullname || 'Guest User'}
          </p>
          <p className="text-xs text-gray-500 truncate max-w-32">
            {user?.email || 'guest@example.com'}
          </p>
        </div>
        
        {/* Dropdown Arrow */}
        <FaChevronDown className={`text-xs text-gray-400 transition-transform duration-200 ${
          isDropdownOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
          {/* User Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-blue-600 text-white font-semibold text-lg">
                {getInitials(user?.fullname || 'Guest')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">
                  {user?.fullname || 'Guest User'}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {user?.email || 'guest@example.com'}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <MdAccessTime className="text-xs text-gray-400" />
                  <span className="text-xs text-gray-400">
                    Joined {formatDate(user?.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200">
              <FaUser className="text-gray-400" />
              <span>View Profile</span>
            </button>
            
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200">
              <FaCog className="text-gray-400" />
              <span>Settings</span>
            </button>
            
            <div className="border-t border-gray-100 my-2"></div>
            
            <button 
              onClick={() => {
                onLogout();
                setIsDropdownOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <FaSignOutAlt className="text-red-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileInfo;