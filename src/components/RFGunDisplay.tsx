import React, { ReactNode } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useNetwork } from '../context/networkExports';
import { useSync } from '../context/syncExports';
import { useAuth } from '../context/authExports';

interface RFGunDisplayProps {
  children: ReactNode;
}

const RFGunDisplay: React.FC<RFGunDisplayProps> = ({ children }) => {
  const { network } = useNetwork();
  const { pendingOperations } = useSync();
  const { auth } = useAuth();

  return (
    <div className="bg-gray-800 border-4 border-gray-700 rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl w-full max-w-2xl mx-auto px-2 md:px-0">
      {/* RF Gun Header - Only show network status when logged in */}
      {auth.isLoggedIn && (
        <div className="bg-gray-900 p-2 flex justify-between items-center border-b border-gray-700">
          <div className="flex items-center">
            {network.isOnline ? (
              <div className="flex items-center text-green-400 text-sm">
                <Wifi size={14} className="mr-1" />
                <span>Online</span>
              </div>
            ) : (
              <div className="flex items-center text-orange-400 text-sm">
                <WifiOff size={14} className="mr-1" />
                <span>Offline - {pendingOperations.length} pending</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RF Gun Display Area */}
      <div className="bg-black p-4 md:p-6 font-mono">
        {children}
      </div>
    </div>
  );
};

export default RFGunDisplay;