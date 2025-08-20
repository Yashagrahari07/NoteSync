import React from 'react';

const TypingIndicator = ({ typingUsers }) => {
  if (!typingUsers || typingUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 italic">
      <div className="flex items-center gap-1">
        {typingUsers.map((user, index) => (
          <span key={user.userId} className="font-medium">
            {user.userFullname}
            {index < typingUsers.length - 2 && ', '}
            {index === typingUsers.length - 2 && ' and '}
          </span>
        ))}
      </div>
      <span>is typing</span>
      <div className="flex items-center gap-1">
        <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce"></div>
        <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
};

export default TypingIndicator;
