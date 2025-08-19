import React, { useState, useEffect } from 'react';
import { MdSearch, MdClose } from 'react-icons/md';
import { IoMdClose } from 'react-icons/io';

const MobileSearchModal = ({ isOpen, onClose, onSearch, searchQuery, onSearchChange, onClearSearch }) => {
  const [inputValue, setInputValue] = useState(searchQuery);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSearch = () => {
    onSearch(inputValue);
    onClose();
  };

  const handleClear = () => {
    setInputValue('');
    onClearSearch();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Search Notes</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <div className="relative flex items-center px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus-within:border-primary transition-colors duration-200">
            <MdSearch className="text-xl text-gray-400" />
            
            <input 
              type="text" 
              placeholder="Search notes, tags, or content..." 
              className="w-full ml-3 bg-transparent outline-none text-sm placeholder-gray-400"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
            />

            {inputValue && (
              <button
                onClick={handleClear}
                className="ml-2 p-1 rounded-full hover:bg-gray-200 transition-colors duration-200"
              >
                <IoMdClose className="text-lg text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Search Tips */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Search Tips:</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>Use quotes for exact phrases</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Search by tags with #tag</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>Filter by date: today, yesterday</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSearch}
            className="flex-1 px-4 py-2 bg-primary text-white hover:bg-blue-600 rounded-lg transition-colors duration-200 font-medium"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileSearchModal;
