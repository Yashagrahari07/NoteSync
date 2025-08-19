import React, { useState, useRef, useEffect } from 'react';
import { FaMagnifyingGlass } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";
import { MdSearch } from "react-icons/md";

const SearchBar = ({ value, onChange, handleSearch, onClearSearch }) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    onClearSearch();
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-96 transition-all duration-200 ${
      isFocused ? 'scale-105' : 'scale-100'
    }`}>
      <div className={`relative flex items-center px-4 py-2 bg-white rounded-xl border-2 transition-all duration-200 ${
        isFocused 
          ? 'border-primary shadow-lg shadow-primary/20' 
          : 'border-gray-200 hover:border-gray-300'
      }`}>
        <MdSearch className={`text-lg transition-colors duration-200 ${
          isFocused ? 'text-primary' : 'text-gray-400'
        }`} />
        
        <input 
          ref={inputRef}
          type='text' 
          placeholder='Search notes, tags, or content...' 
          className='w-full ml-3 text-sm bg-transparent outline-none placeholder-gray-400'
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyPress={handleKeyPress}
        />

        {value && (
          <button
            onClick={handleClear}
            className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            <IoMdClose className='text-lg text-gray-400 hover:text-gray-600' />
          </button>
        )}
      </div>
      
      {/* Search suggestions dropdown */}
      {isFocused && value && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-50">
          <div className="p-3">
            <div className="text-xs text-gray-500 mb-2">Quick search tips:</div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Use quotes for exact phrases</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Search by tags with #tag</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>Filter by date: today, yesterday</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
