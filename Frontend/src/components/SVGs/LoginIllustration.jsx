import React from 'react';

const LoginIllustration = ({ className = "w-full h-full" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="loginGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2B85FF" />
          <stop offset="100%" stopColor="#1976D2" />
        </linearGradient>
        <linearGradient id="loginGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF863E" />
          <stop offset="100%" stopColor="#FF9800" />
        </linearGradient>
        <linearGradient id="loginGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E3F2FD" />
          <stop offset="100%" stopColor="#F3E5F5" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="400" height="300" fill="url(#loginGradient3)" rx="20" />

      {/* Main login form illustration */}
      <g transform="translate(50, 80)">
        {/* Form container */}
        <rect x="0" y="0" width="120" height="140" rx="12" fill="white" stroke="url(#loginGradient1)" strokeWidth="2" />
        
        {/* Form header */}
        <rect x="0" y="0" width="120" height="30" rx="12" fill="url(#loginGradient1)" />
        <text x="60" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Login</text>
        
        {/* Email input */}
        <rect x="10" y="40" width="100" height="25" rx="6" fill="#F8F9FA" stroke="#E9ECEF" strokeWidth="1" />
        <rect x="15" y="47" width="60" height="3" rx="1.5" fill="#6C757D" />
        <rect x="15" y="52" width="40" height="3" rx="1.5" fill="#6C757D" />
        
        {/* Password input */}
        <rect x="10" y="75" width="100" height="25" rx="6" fill="#F8F9FA" stroke="#E9ECEF" strokeWidth="1" />
        <rect x="15" y="82" width="50" height="3" rx="1.5" fill="#6C757D" />
        <rect x="15" y="87" width="30" height="3" rx="1.5" fill="#6C757D" />
        <rect x="15" y="92" width="35" height="3" rx="1.5" fill="#6C757D" />
        
        {/* Login button */}
        <rect x="10" y="110" width="100" height="25" rx="6" fill="url(#loginGradient1)" />
        <text x="60" y="127" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">Sign In</text>
      </g>

      {/* Floating elements */}
      <g transform="translate(250, 60)">
        {/* User icon */}
        <circle cx="25" cy="25" r="20" fill="url(#loginGradient2)" opacity="0.9" />
        <circle cx="25" cy="20" r="8" fill="white" />
        <path
          d="M10 45 C10 35 15 30 25 30 C35 30 40 35 40 45"
          fill="white"
        />
      </g>

      <g transform="translate(280, 180)">
        {/* Lock icon */}
        <rect x="15" y="25" width="20" height="15" rx="3" fill="url(#loginGradient1)" opacity="0.8" />
        <rect x="20" y="20" width="10" height="10" rx="5" fill="url(#loginGradient1)" opacity="0.8" />
        <circle cx="25" cy="30" r="2" fill="white" />
      </g>

      {/* Connection lines */}
      <g stroke="url(#loginGradient1)" strokeWidth="2" opacity="0.3" strokeDasharray="5,5">
        <line x1="170" y1="150" x2="250" y2="80" />
        <line x1="170" y1="180" x2="280" y2="200" />
      </g>

      {/* Decorative elements */}
      <circle cx="80" cy="50" r="3" fill="url(#loginGradient1)" opacity="0.4" />
      <circle cx="320" cy="100" r="2" fill="url(#loginGradient2)" opacity="0.4" />
      <circle cx="350" cy="250" r="2.5" fill="url(#loginGradient1)" opacity="0.4" />
      <circle cx="50" cy="280" r="2" fill="url(#loginGradient2)" opacity="0.4" />
      
      {/* Floating dots */}
      <circle cx="120" cy="80" r="1.5" fill="url(#loginGradient1)" opacity="0.3" />
      <circle cx="300" cy="120" r="1" fill="url(#loginGradient2)" opacity="0.3" />
      <circle cx="180" cy="220" r="1.5" fill="url(#loginGradient1)" opacity="0.3" />
    </svg>
  );
};

export default LoginIllustration;
