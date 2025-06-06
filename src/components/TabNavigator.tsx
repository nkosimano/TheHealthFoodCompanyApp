import React from 'react';
import { Scan, History } from 'lucide-react';
import { useApp } from '../context/appExports';

const TabNavigator: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  return (
    <div className="flex border-b border-gray-700 mb-6">
      <button
        onClick={() => setActiveTab('scan')}
        className={`flex items-center px-4 py-2 border-b-2 ${
          activeTab === 'scan'
            ? 'border-green-500 text-green-400'
            : 'border-transparent text-gray-400 hover:text-green-300'
        }`}
      >
        <Scan size={18} className="mr-2" />
        Scan & Adjust
      </button>
      
      <button
        onClick={() => setActiveTab('history')}
        className={`flex items-center px-4 py-2 border-b-2 ${
          activeTab === 'history'
            ? 'border-green-500 text-green-400'
            : 'border-transparent text-gray-400 hover:text-green-300'
        }`}
      >
        <History size={18} className="mr-2" />
        History
      </button>
    </div>
  );
};

export default TabNavigator;