import React from 'react';
import { useAuth } from '../context/authExports';

export const LoginButton: React.FC = () => {
  const { login } = useAuth();

  return (
    <button
      onClick={login}
      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-lg font-semibold transition-colors duration-300"
    >
      LOGIN WITH ZOHO
    </button>
  );
}; 