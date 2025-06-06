import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet
} from 'react-router-dom';
import { AuthProvider } from './context/auth/AuthProvider';
import { useAuth } from './context/auth/useAuth';
import { AppProvider } from './context/appExports';
import { NetworkProvider } from './context/networkExports';
import { SyncProvider } from './context/syncExports';
import Header from './components/Header';
import Footer from './components/Footer';
import ZohoLogin from './components/ZohoLogin';
import { AuthCallback } from './components/AuthCallback';
import AuthenticatedContent from './components/AuthenticatedContent';
import ErrorBoundary from './components/ErrorBoundary';

// Root layout that includes all providers
const RootLayout = () => (
  <NetworkProvider>
    <AuthProvider>
      <SyncProvider>
        <AppProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow bg-gray-100 p-4">
              <Outlet />
            </main>
            <Footer />
          </div>
        </AppProvider>
      </SyncProvider>
    </AuthProvider>
  </NetworkProvider>
);

// Component to handle routing logic
const AppRouter: React.FC = () => {
  const { auth } = useAuth();

  // Add a check to ensure auth is not undefined before accessing isLoggedIn
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

// Create the browser router
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { path: '/', element: <AppRouter /> },
      { path: '/auth/callback', element: <AuthCallback /> }
    ],
  },
]);

// The final App component
function App(): JSX.Element {
  return <RouterProvider router={router} />;
}

export default App;