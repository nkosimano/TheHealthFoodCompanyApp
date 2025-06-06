import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authExports';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { handleAuthCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        const success = await handleAuthCallback(code);
        if (success) {
          navigate('/');
        } else {
          setError('Authentication failed. Please try again.');
        }
      } else {
        const errorDescription = urlParams.get('error_description') || 'An unknown error occurred.';
        setError(errorDescription);
      }
    };

    processAuth();
  }, [handleAuthCallback, navigate]);

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600">Authentication Error</h2>
        <p className="text-gray-700">{error}</p>
        <button 
          onClick={() => navigate('/')} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      <p className="ml-4 text-xl">Authenticating...</p>
    </div>
  );
}; 