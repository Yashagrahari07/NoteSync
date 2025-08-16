import React from 'react';

const HeroIllustration = ({ className = "w-full h-full" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 600 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background gradient */}
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E3F2FD" />
          <stop offset="100%" stopColor="#F3E5F5" />
        </linearGradient>
        <linearGradient id="noteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2B85FF" />
          <stop offset="100%" stopColor="#1976D2" />
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF863E" />
          <stop offset="100%" stopColor="#FF9800" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="600" height="400" fill="url(#bgGradient)" rx="20" />

      {/* Floating notes */}
      <g transform="translate(50, 80)">
        {/* Note 1 */}
        <rect x="0" y="0" width="120" height="80" rx="8" fill="url(#noteGradient)" opacity="0.9" />
        <rect x="8" y="12" width="60" height="4" rx="2" fill="white" opacity="0.8" />
        <rect x="8" y="20" width="80" height="3" rx="1.5" fill="white" opacity="0.6" />
        <rect x="8" y="26" width="70" height="3" rx="1.5" fill="white" opacity="0.6" />
        <rect x="8" y="32" width="50" height="3" rx="1.5" fill="white" opacity="0.6" />
        <rect x="8" y="38" width="90" height="3" rx="1.5" fill="white" opacity="0.6" />
        <rect x="8" y="44" width="40" height="3" rx="1.5" fill="white" opacity="0.6" />
        <rect x="8" y="50" width="75" height="3" rx="1.5" fill="white" opacity="0.6" />
        <rect x="8" y="56" width="65" height="3" rx="1.5" fill="white" opacity="0.6" />
        <rect x="8" y="62" width="55" height="3" rx="1.5" fill="white" opacity="0.6" />
      </g>

      <g transform="translate(200, 120)">
        {/* Note 2 */}
        <rect x="0" y="0" width="100" height="70" rx="8" fill="url(#accentGradient)" opacity="0.9" />
        <rect x="8" y="10" width="50" height="3" rx="1.5" fill="white" opacity="0.8" />
        <rect x="8" y="16" width="70" height="3" rx="1.5" fill="white" opacity="0.6" />
        <rect x="8" y="22" width="60" height="3" rx="1.5" fill="white" opacity="0.6" />
        <rect x="8" y="28" width="45" height="3" rx="1.5" fill="white" opacity="0.6" />
        <rect x="8" y="34" width="80" height="3" rx="1.5" fill="white" opacity="0.6" />
        <rect x="8" y="40" width="35" height="3" rx="1.5" fill="white" opacity="0.6" />
        <rect x="8" y="46" width="65" height="3" rx="1.5" fill="white" opacity="0.6" />
        <rect x="8" y="52" width="55" height="3" rx="1.5" fill="white" opacity="0.6" />
      </g>

      <g transform="translate(350, 60)">
        {/* Note 3 */}
        <rect x="0" y="0" width="110" height="75" rx="8" fill="url(#noteGradient)" opacity="0.8" />
        <rect x="8" y="10" width="55" height="3" rx="1.5" fill="white" opacity="0.8" />
        <rect x="8" y="16" width="75" height="3" rx="1.5" fill="white" opacity="0.6" />
        <rect x="8" y="22" width="65" height="3" rx="1.5" fill="white" opacity="0.6" />
        <rect x="8" y="28" width="50" height="3" rx="1.5" fill="white" opacity="0.6" />
        <rect x="8" y="34" width="85" height="3" rx="1.5" fill="white" opacity="0.6" />
        <rect x="8" y="40" width="45" height="3" rx="1.5" fill="white" opacity="0.6" />
        <rect x="8" y="46" width="70" height="3" rx="1.5" fill="white" opacity="0.6" />
        <rect x="8" y="52" width="60" height="3" rx="1.5" fill="white" opacity="0.6" />
        <rect x="8" y="58" width="40" height="3" rx="1.5" fill="white" opacity="0.6" />
      </g>

      {/* Connection lines */}
      <g stroke="#2B85FF" strokeWidth="2" opacity="0.3">
        <line x1="170" y1="120" x2="200" y2="155" />
        <line x1="320" y1="97" x2="350" y2="97" />
        <line x1="170" y1="160" x2="350" y2="135" />
      </g>

      {/* Floating icons */}
      <g transform="translate(450, 200)">
        {/* Sync icon */}
        <circle cx="25" cy="25" r="20" fill="url(#noteGradient)" opacity="0.8" />
        <path
          d="M15 25 L25 15 L35 25 M15 25 L25 35 L35 25"
          stroke="white"
          strokeWidth="2"
          fill="none"
        />
      </g>

      <g transform="translate(80, 280)">
        {/* Users icon */}
        <circle cx="20" cy="20" r="15" fill="url(#accentGradient)" opacity="0.8" />
        <circle cx="35" cy="20" r="12" fill="url(#accentGradient)" opacity="0.8" />
        <circle cx="50" cy="20" r="10" fill="url(#accentGradient)" opacity="0.8" />
        <path
          d="M20 35 C20 28 25 22 32 22 M35 32 C35 26 39 21 45 21 M50 30 C50 25 53 21 58 21"
          stroke="white"
          strokeWidth="2"
          fill="none"
        />
      </g>

      {/* Decorative elements */}
      <circle cx="100" cy="100" r="3" fill="#2B85FF" opacity="0.4" />
      <circle cx="500" cy="80" r="2" fill="#EF863E" opacity="0.4" />
      <circle cx="450" cy="300" r="2.5" fill="#2B85FF" opacity="0.4" />
      <circle cx="150" cy="320" r="2" fill="#EF863E" opacity="0.4" />
      <circle cx="520" cy="250" r="1.5" fill="#2B85FF" opacity="0.4" />
    </svg>
  );
};

export default HeroIllustration;
