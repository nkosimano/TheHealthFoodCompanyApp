import React from 'react';
import { useAuth } from '../context/authExports';
import AuthenticatedContent from './AuthenticatedContent';
import ZohoLogin from './ZohoLogin';

const AppContent: React.FC = () => {
  const { auth } = useAuth();

  if (!auth) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  return auth.isLoggedIn ? <AuthenticatedContent /> : <ZohoLogin />;
};

export default AppContent; 