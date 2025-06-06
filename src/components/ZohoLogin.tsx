import React from 'react';
import { useAuth } from '../context/authExports';

const ZohoLogin: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-black rounded-md w-full">
      <h1 className="text-2xl md:text-3xl font-bold text-green-400 mb-16">THFC SCANNER</h1>
      
      <button
        onClick={() => login()}
        className="bg-blue-600 hover:bg-blue-700 text-white py-4 px-8 rounded-md text-xl font-semibold transition-colors duration-300 w-full max-w-xs"
      >
        LOGIN WITH ZOHO
      </button>
      
      <p className="mt-12 text-gray-300 text-center">
        You will be redirected to Zoho to authenticate.
      </p>
    </div>
  );
};

export default ZohoLogin;