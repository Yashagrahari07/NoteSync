import React from 'react';
import { useSelector } from 'react-redux';
import { getInitials } from '../../utils/helper';

const ProfileInfo = ({ onLogout }) => {
  const { user } = useSelector((state) => state.auth); // Extract user data from Redux

  return (
    <div className='flex items-center gap-3'>
      <div className='w-12 h-12 flex items-center justify-center rounded-full text-slate-950 font-medium bg-slate-100'>
        {getInitials(user?.fullname || 'Guest')} {/* Use initials from user or fallback to 'Guest' */}
      </div>
        
      <div>
        <p className='text-sm font-medium'>{user?.fullname || 'Guest'}</p> {/* Display user's full name */}
        <button className='text-sm text-slate-700 underline' onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileInfo;