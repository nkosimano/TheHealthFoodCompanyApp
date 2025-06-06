import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-gray-300 p-2 md:p-3 text-center text-sm fixed bottom-0 w-full">
      <div className="max-w-4xl mx-auto">
        <p>© {new Date().getFullYear()} THFC Code Scanner</p>
        <p className="text-xs mt-1">Version 1.0.0</p>
      </div>
    </footer>
  );
};

export default Footer;