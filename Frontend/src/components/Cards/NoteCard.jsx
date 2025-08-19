import React, { useState, useRef, useEffect } from "react";
import { FaThumbtack, FaEdit, FaTrash, FaEllipsisH, FaTag, FaUser, FaUsers } from "react-icons/fa";
import { MdAccessTime } from "react-icons/md";

const NoteCard = ({ title, date, content, tags, onEdit, onDelete, onPinNote, isPinned, viewMode = 'grid', owner, createdBy }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const isOwned = owner === createdBy;

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-3 mb-2">
                 <h3 className="text-lg font-semibold text-gray-800 truncate">{title}</h3>
                 <div className="flex items-center gap-1">
                   {isOwned ? (
                     <FaUser className="text-green-500 text-sm" title="My Note" />
                   ) : (
                     <FaUsers className="text-purple-500 text-sm" title="Shared Note" />
                   )}
                   {isPinned && (
                     <FaThumbtack className="text-yellow-500 text-sm flex-shrink-0" />
                   )}
                 </div>
               </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <MdAccessTime className="text-sm" />
                  <span>{formatDate(date)}</span>
                </div>
                {tags && (
                  <div className="flex items-center gap-1">
                    <FaTag className="text-sm" />
                    <span>{tags}</span>
                  </div>
                )}
              </div>
              
              <p className="text-gray-600 line-clamp-2 mb-4">
                {truncateText(content, 150)}
              </p>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={onEdit}
                className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors duration-200"
                title="Edit note"
              >
                <FaEdit className="text-sm" />
              </button>
              <button
                onClick={onPinNote}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  isPinned 
                    ? 'text-yellow-500 bg-yellow-50' 
                    : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                }`}
                title={isPinned ? 'Unpin note' : 'Pin note'}
              >
                <FaThumbtack className="text-sm" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="Delete note"
              >
                <FaTrash className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 group h-full flex flex-col">
      <div className="p-6 flex-1">
                 <div className="flex items-start justify-between mb-3">
           <div className="flex-1">
             <div className="flex items-center gap-2 mb-1">
               {isOwned ? (
                 <FaUser className="text-green-500 text-xs" title="My Note" />
               ) : (
                 <FaUsers className="text-purple-500 text-xs" title="Shared Note" />
               )}
             </div>
             <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
               {title}
             </h3>
           </div>
           <div className="flex items-center gap-1 ml-2">
            <button
              onClick={onPinNote}
              className={`p-1.5 rounded-lg transition-colors duration-200 ${
                isPinned 
                  ? 'text-yellow-500 bg-yellow-50' 
                  : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
              }`}
              title={isPinned ? 'Unpin note' : 'Pin note'}
            >
              <FaThumbtack className="text-sm" />
            </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <FaEllipsisH className="text-sm" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={() => {
                      onEdit();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FaEdit className="text-xs" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <FaTrash className="text-xs" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <MdAccessTime className="text-sm" />
          <span>{formatDate(date)}</span>
        </div>
        
        <p className="text-gray-600 line-clamp-3 mb-4 flex-1">
          {truncateText(content, 120)}
        </p>
        
        {tags && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
            <FaTag className="text-xs" />
            <span className="truncate">{tags}</span>
          </div>
        )}
      </div>
      
      <div className="px-6 pb-4">
        <button
          onClick={onEdit}
          className="w-full py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium text-sm"
        >
          Open Note
        </button>
      </div>
    </div>
  );
};

export default NoteCard;
