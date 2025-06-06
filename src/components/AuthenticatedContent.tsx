import React from 'react';
import { useApp } from '../context/appExports';
import RFGunDisplay from './RFGunDisplay';
import TabNavigator from './TabNavigator';
import LocationSelector from './LocationSelector';
import Scanner from './Scanner';
import History from './History';

const AuthenticatedContent: React.FC = () => {
  const { activeTab } = useApp();
  
  return (
    <div className="w-full max-w-4xl mx-auto py-6">
      <TabNavigator />
      <LocationSelector />
      
      <RFGunDisplay>
        {activeTab === 'scan' ? <Scanner /> : <History />}
      </RFGunDisplay>
    </div>
  );
};

export default AuthenticatedContent; 