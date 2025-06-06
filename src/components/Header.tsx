import React from 'react';
import { Wifi, WifiOff, RefreshCw, User } from 'lucide-react';
import { useAuth } from '../context/authExports';
import { useNetwork } from '../context/networkExports';
import { useSync } from '../context/syncExports';
import { useApp } from '../context/appExports';

const Header: React.FC = () => {
  const { auth, user, logout } = useAuth();
  const { network, toggleNetworkStatus } = useNetwork();
  const { pendingOperations, syncPendingOperations } = useSync();
  const { currentLocationName } = useApp();

  return (
    <header className="bg-gray-800 text-white p-3 shadow-md">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-lg md:text-xl font-bold">THFC CODE SCANNER</h1>
          
          {/* Network Status */}
          <div className="flex items-center ml-2 md:ml-4">
            {network.isOnline ? (
              <Wifi size={16} className="text-green-400 mr-1" />
            ) : (
              <WifiOff size={16} className="text-orange-400 mr-1" />
            )}
            <span className={network.isOnline ? "text-green-400" : "text-orange-400"}>
              {network.isOnline ? 'Online' : `Offline - ${pendingOperations.length}`}
            </span>
          </div>

          {/* User and Location Display */}
          {auth.isLoggedIn && (
            <div className="hidden md:flex items-center space-x-2 ml-4">
              {user && (
                <div className="flex items-center px-2 py-1 bg-gray-700 rounded text-sm">
                  <User size={14} className="mr-1" />
                  <span className="flex flex-col">
                    <span>{user.fullName || user.email}</span>
                    <span className="text-xs text-gray-400">{user.role}</span>
                  </span>
                </div>
              )}
              {currentLocationName && (
                <div className="px-2 py-1 bg-gray-700 rounded text-sm">
                  Location: {currentLocationName}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Sync button (only visible when offline operations exist and we're online) */}
          {network.isOnline && pendingOperations.length > 0 && (
            <button 
              onClick={() => syncPendingOperations()}
              className="bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-1 rounded flex items-center justify-center"
              aria-label="Sync pending operations"
            >
              <RefreshCw size={20} className="md:mr-1" />
              <span className="hidden md:inline">SYNC ({pendingOperations.length})</span>
            </button>
          )}

          {/* Network toggle (for testing) */}
          <button 
            onClick={toggleNetworkStatus}
            className={`w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-1 rounded flex items-center justify-center ${
              network.isOnline 
                ? 'bg-gray-600 hover:bg-gray-700' 
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
            aria-label={network.isOnline ? 'Toggle offline' : 'Toggle online'}
          >
            {network.isOnline ? (
              <>
                <WifiOff size={20} className="md:mr-1" />
                <span className="hidden md:inline">OFFLINE</span>
              </>
            ) : (
              <>
                <Wifi size={20} className="md:mr-1" />
                <span className="hidden md:inline">ONLINE</span>
              </>
            )}
          </button>

          {/* Logout button */}
          {auth.isLoggedIn && (
            <button 
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded min-w-[48px] min-h-[48px] text-sm md:text-base"
            >
              LOGOUT
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;