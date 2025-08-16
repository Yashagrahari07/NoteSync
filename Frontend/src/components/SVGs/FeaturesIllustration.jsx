import React from 'react';

const FeaturesIllustration = ({ className = "w-full h-full" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="featureGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2B85FF" />
          <stop offset="100%" stopColor="#1976D2" />
        </linearGradient>
        <linearGradient id="featureGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF863E" />
          <stop offset="100%" stopColor="#FF9800" />
        </linearGradient>
        <linearGradient id="featureGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4CAF50" />
          <stop offset="100%" stopColor="#388E3C" />
        </linearGradient>
      </defs>

      {/* Real-time collaboration feature */}
      <g transform="translate(50, 50)">
        <rect x="0" y="0" width="100" height="80" rx="12" fill="url(#featureGradient1)" opacity="0.1" stroke="url(#featureGradient1)" strokeWidth="2" />
        <circle cx="25" cy="25" r="8" fill="url(#featureGradient1)" />
        <circle cx="45" cy="25" r="8" fill="url(#featureGradient1)" />
        <circle cx="65" cy="25" r="8" fill="url(#featureGradient1)" />
        <rect x="15" y="40" width="70" height="4" rx="2" fill="url(#featureGradient1)" />
        <rect x="15" y="48" width="50" height="4" rx="2" fill="url(#featureGradient1)" />
        <rect x="15" y="56" width="60" height="4" rx="2" fill="url(#featureGradient1)" />
        <rect x="15" y="64" width="40" height="4" rx="2" fill="url(#featureGradient1)" />
      </g>

      {/* Instant sync feature */}
      <g transform="translate(200, 50)">
        <rect x="0" y="0" width="100" height="80" rx="12" fill="url(#featureGradient2)" opacity="0.1" stroke="url(#featureGradient2)" strokeWidth="2" />
        <circle cx="50" cy="30" r="15" fill="url(#featureGradient2)" />
        <path
          d="M42 30 L48 36 L58 24"
          stroke="white"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="20" y="50" width="60" height="4" rx="2" fill="url(#featureGradient2)" />
        <rect x="20" y="58" width="45" height="4" rx="2" fill="url(#featureGradient2)" />
        <rect x="20" y="66" width="55" height="4" rx="2" fill="url(#featureGradient2)" />
      </g>

      {/* Secure sharing feature */}
      <g transform="translate(125, 160)">
        <rect x="0" y="0" width="100" height="80" rx="12" fill="url(#featureGradient3)" opacity="0.1" stroke="url(#featureGradient3)" strokeWidth="2" />
        <rect x="35" y="15" width="30" height="20" rx="4" fill="url(#featureGradient3)" />
        <circle cx="50" cy="25" r="3" fill="white" />
        <rect x="45" y="30" width="10" height="2" rx="1" fill="white" />
        <rect x="20" y="45" width="60" height="4" rx="2" fill="url(#featureGradient3)" />
        <rect x="20" y="53" width="50" height="4" rx="2" fill="url(#featureGradient3)" />
        <rect x="20" y="61" width="65" height="4" rx="2" fill="url(#featureGradient3)" />
      </g>

      {/* Connection lines */}
      <g stroke="#2B85FF" strokeWidth="2" opacity="0.3" strokeDasharray="5,5">
        <line x1="150" y1="90" x2="200" y2="90" />
        <line x1="100" y1="130" x2="175" y2="160" />
        <line x1="300" y1="130" x2="225" y2="160" />
      </g>

      {/* Decorative elements */}
      <circle cx="30" cy="30" r="2" fill="#2B85FF" opacity="0.3" />
      <circle cx="370" cy="40" r="1.5" fill="#EF863E" opacity="0.3" />
      <circle cx="380" cy="200" r="2" fill="#4CAF50" opacity="0.3" />
      <circle cx="20" cy="250" r="1.5" fill="#2B85FF" opacity="0.3" />
    </svg>
  );
};

export default FeaturesIllustration;
