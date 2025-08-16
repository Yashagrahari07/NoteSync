import React from 'react';

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Floating circles */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-primary/20 rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-20 w-6 h-6 bg-secondary/20 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-40 left-20 w-3 h-3 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-20 right-10 w-5 h-5 bg-secondary/25 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
      
      {/* Floating squares */}
      <div className="absolute top-60 left-1/4 w-2 h-2 bg-primary/15 rotate-45 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute top-80 right-1/3 w-3 h-3 bg-secondary/20 rotate-45 animate-bounce" style={{ animationDelay: '0.8s' }}></div>
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/2 w-32 h-32 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-1/4 right-1/3 w-24 h-24 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
    </div>
  );
};

export default AnimatedBackground;
