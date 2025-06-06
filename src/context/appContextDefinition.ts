import { createContext } from 'react';
import { LocationInfo, CustomFieldDefinition, AdjustmentReason } from '../types';

export interface AppContextType {
  locations: LocationInfo[];
  currentLocationName: string;
  customFields: CustomFieldDefinition[];
  adjustmentReasons: AdjustmentReason[];
  activeTab: 'scan' | 'history';
  setActiveTab: (tab: 'scan' | 'history') => void;
  isLoading: boolean;
  fetchSettingsData: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined); 