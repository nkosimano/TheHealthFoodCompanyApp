import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { LocationInfo, CustomFieldDefinition, AdjustmentReason, ActionType } from '../types';
import { useAuth } from './authExports';
import { fetchLocations, fetchItemCustomFields, fetchAdjustmentReasons } from '../services/zohoApi';
import { AppContext, AppContextType } from './appContextDefinition';

export { AppContext };
export type { AppContextType };

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { auth, setLocationId } = useAuth();
  
  const [locations, setLocations] = useState<LocationInfo[]>([]);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [adjustmentReasons, setAdjustmentReasons] = useState<AdjustmentReason[]>([]);
  const [activeTab, setActiveTab] = useState<'scan' | 'history'>('scan');
  const [isLoading, setIsLoading] = useState(false);

  // Get the current location name from locations array
  const currentLocationName = locations.find(
    loc => loc.location_id === auth.current_location_id
  )?.location_name || '';

  const fetchSettingsData = useCallback(async () => {
    if (!auth.organization_id) return;
    
    setIsLoading(true);
    try {
      // Fetch locations
      const locationsData = await fetchLocations(auth.organization_id);
      setLocations(locationsData);
      
      // Set default location if not already set
      if (!auth.current_location_id && locationsData.length > 0) {
        setLocationId(locationsData[0].location_id);
      }
      
      // Fetch custom fields for items
      const customFieldsData = await fetchItemCustomFields(auth.organization_id);
      setCustomFields(customFieldsData);
      
      // Fetch adjustment reasons
      try {
        const reasonsData = await fetchAdjustmentReasons(auth.organization_id);
        setAdjustmentReasons(reasonsData);
      } catch (error) {
        console.warn('Could not fetch adjustment reasons, using defaults', error);
        // Fallback to default reasons
        setAdjustmentReasons([
          { reason_name: 'Purchase', reason_type: ActionType.ADD },
          { reason_name: 'Return from Customer', reason_type: ActionType.ADD },
          { reason_name: 'Inventory Count Correction', reason_type: 'ALL' },
          { reason_name: 'Sale', reason_type: ActionType.REDUCE },
          { reason_name: 'Return to Vendor', reason_type: ActionType.REDUCE },
          { reason_name: 'Damage - Found', reason_type: ActionType.REDUCE },
          { reason_name: 'Theft/Loss', reason_type: ActionType.REDUCE }
        ]);
      }
    } catch (error) {
      console.error('Error fetching settings data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [auth.organization_id, auth.current_location_id, setLocationId]);

  // Fetch settings data when organization_id changes
  useEffect(() => {
    if (auth.isLoggedIn && auth.organization_id) {
      fetchSettingsData();
    }
  }, [auth.isLoggedIn, auth.organization_id, fetchSettingsData]);

  return (
    <AppContext.Provider value={{ 
      locations,
      currentLocationName,
      customFields,
      adjustmentReasons,
      activeTab,
      setActiveTab,
      isLoading,
      fetchSettingsData
    }}>
      {children}
    </AppContext.Provider>
  );
};