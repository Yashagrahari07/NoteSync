import React from 'react';
import { FaStickyNote, FaThumbtack, FaUser, FaUsers } from 'react-icons/fa';

const DashboardStats = ({ notes }) => {
  const stats = [
    {
      title: 'Total Notes',
      value: notes.length,
      icon: FaStickyNote,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'My Notes',
      value: notes.filter(note => note.owner === note.createdBy).length,
      icon: FaUser,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Shared Notes',
      value: notes.filter(note => note.owner !== note.createdBy).length,
      icon: FaUsers,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Pinned Notes',
      value: notes.filter(note => note.isPinned).length,
      icon: FaThumbtack,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`text-xl ${stat.textColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
