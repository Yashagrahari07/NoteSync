import React from 'react';

const AuthIllustration = ({ className = "w-full h-full" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 500 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="authGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2B85FF" />
          <stop offset="100%" stopColor="#1976D2" />
        </linearGradient>
        <linearGradient id="authGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF863E" />
          <stop offset="100%" stopColor="#FF9800" />
        </linearGradient>
        <linearGradient id="authGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4CAF50" />
          <stop offset="100%" stopColor="#388E3C" />
        </linearGradient>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E3F2FD" />
          <stop offset="100%" stopColor="#F3E5F5" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="500" height="400" fill="url(#bgGradient)" rx="20" />

      {/* Main device/computer */}
      <g transform="translate(100, 80)">
        {/* Computer screen */}
        <rect x="0" y="0" width="200" height="120" rx="8" fill="url(#authGradient1)" opacity="0.9" />
        <rect x="8" y="8" width="184" height="104" rx="4" fill="white" />
        
        {/* Screen content - login form */}
        <rect x="20" y="20" width="160" height="8" rx="4" fill="url(#authGradient1)" opacity="0.3" />
        <rect x="20" y="35" width="120" height="6" rx="3" fill="url(#authGradient1)" opacity="0.2" />
        <rect x="20" y="45" width="140" height="6" rx="3" fill="url(#authGradient1)" opacity="0.2" />
        <rect x="20" y="55" width="100" height="6" rx="3" fill="url(#authGradient1)" opacity="0.2" />
        <rect x="20" y="70" width="80" height="8" rx="4" fill="url(#authGradient1)" opacity="0.3" />
        <rect x="20" y="85" width="100" height="6" rx="3" fill="url(#authGradient1)" opacity="0.2" />
        <rect x="20" y="95" width="60" height="8" rx="4" fill="url(#authGradient2)" opacity="0.8" />
      </g>

      {/* Floating elements */}
      <g transform="translate(320, 60)">
        {/* Lock icon */}
        <circle cx="25" cy="25" r="20" fill="url(#authGradient3)" opacity="0.8" />
        <rect x="18" y="15" width="14" height="12" rx="2" fill="white" />
        <circle cx="25" cy="25" r="4" fill="white" />
        <rect x="23" y="25" width="4" height="8" fill="white" />
      </g>

      <g transform="translate(50, 250)">
        {/* User icon */}
        <circle cx="20" cy="20" r="15" fill="url(#authGradient2)" opacity="0.8" />
        <circle cx="20" cy="15" r="6" fill="white" />
        <path
          d="M8 35 C8 28 13 22 20 22 C27 22 32 28 32 35"
          stroke="white"
          strokeWidth="2"
          fill="none"
        />
      </g>

      <g transform="translate(380, 280)">
        {/* Shield icon */}
        <path
          d="M25 5 L40 10 L40 25 C40 35 25 40 25 40 C25 40 10 35 10 25 L10 10 Z"
          fill="url(#authGradient1)" 
          opacity="0.8"
        />
        <path
          d="M20 25 L25 30 L30 20"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Connection lines */}
      <g stroke="#2B85FF" strokeWidth="2" opacity="0.3" strokeDasharray="5,5">
        <line x1="300" y1="85" x2="340" y2="65" />
        <line x1="65" y1="270" x2="100" y2="200" />
        <line x1="390" y1="300" x2="300" y2="200" />
      </g>

      {/* Decorative elements */}
      <circle cx="80" cy="80" r="3" fill="#2B85FF" opacity="0.4" />
      <circle cx="420" cy="120" r="2" fill="#EF863E" opacity="0.4" />
      <circle cx="120" cy="320" r="2.5" fill="#2B85FF" opacity="0.4" />
      <circle cx="400" cy="200" r="2" fill="#EF863E" opacity="0.4" />
      <circle cx="60" cy="180" r="1.5" fill="#4CAF50" opacity="0.4" />
      
      {/* Floating particles */}
      <circle cx="150" cy="50" r="1" fill="#2B85FF" opacity="0.6" />
      <circle cx="350" cy="150" r="1" fill="#EF863E" opacity="0.6" />
      <circle cx="200" cy="350" r="1" fill="#4CAF50" opacity="0.6" />
      <circle cx="450" cy="80" r="1" fill="#2B85FF" opacity="0.6" />
    </svg>
  );
};

export default AuthIllustration;
