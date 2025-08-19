import React from 'react';
import { MdAdd, MdSearch, MdThumbUp } from 'react-icons/md';

const EmptyState = ({ showPinnedOnly, ownershipFilter, onCreateNote }) => {
  if (showPinnedOnly) {
    return (
      <div className="text-center py-20">
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <MdThumbUp className="text-4xl text-yellow-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          No pinned notes yet
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Pin your important notes to keep them easily accessible at the top of your dashboard
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          <span>Click the pin icon on any note to pin it</span>
        </div>
      </div>
    );
  }

  const getEmptyStateContent = () => {
    switch (ownershipFilter) {
      case 'owned':
        return {
          icon: <MdAdd className="text-4xl text-green-500" />,
          bgColor: 'bg-green-100',
          title: 'No notes created yet',
          description: 'Create your first note to get started with NoteSync',
          showButton: true
        };
      case 'shared':
        return {
          icon: <MdSearch className="text-4xl text-purple-500" />,
          bgColor: 'bg-purple-100',
          title: 'No shared notes',
          description: 'You haven\'t been added to any shared notes yet',
          showButton: false
        };
      default:
        return {
          icon: <MdAdd className="text-4xl text-blue-500" />,
          bgColor: 'bg-blue-100',
          title: 'Create your first note',
          description: 'Start organizing your thoughts, ideas, and important information with NoteSync',
          showButton: true
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <div className="text-center py-20">
      <div className={`w-24 h-24 ${content.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
        {content.icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        {content.title}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {content.description}
      </p>
      {content.showButton && (
        <button
          onClick={onCreateNote}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium inline-flex items-center gap-2"
        >
          <MdAdd className="text-lg" />
          Create Note
        </button>
      )}
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <MdAdd className="text-xl text-green-600" />
          </div>
          <h4 className="font-medium text-gray-800 mb-1">Create Notes</h4>
          <p className="text-sm text-gray-600">Write and organize your thoughts</p>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <MdSearch className="text-xl text-purple-600" />
          </div>
          <h4 className="font-medium text-gray-800 mb-1">Search & Find</h4>
          <p className="text-sm text-gray-600">Quickly locate your notes</p>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <MdThumbUp className="text-xl text-yellow-600" />
          </div>
          <h4 className="font-medium text-gray-800 mb-1">Pin Important</h4>
          <p className="text-sm text-gray-600">Keep important notes at the top</p>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
