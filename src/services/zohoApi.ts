import type {
  ItemInfo,
  LocationInfo,
  CustomFieldDefinition,
  AdjustmentReason,
  ActionType,
  UserInfo
} from '../types';
import { addBreadcrumb, captureError, captureMessage } from './sentryService';

// Base API URLs
const API_BASE = import.meta.env.DEV ? 'http://localhost:7071/api' : '/api';
const ZOHO_INVENTORY_API = `${API_BASE}/zohoInventory`;
const ZOHO_PEOPLE_API = `${API_BASE}/zohoPeople`;

// Variable to store the current auth token for API calls
let authToken = '';

// Set the auth token for API calls
export const setAuthTokenHeader = (token: string): void => {
  authToken = token;
};

interface ZohoLocationFromApi {
  warehouse_id: string;
  warehouse_name: string;
  available_stock?: number;
}

interface ZohoCustomFieldFromApi {
  label: string;
  value: string;
}

interface ZohoItemFromApi {
  item_id: string;
  name: string;
  sku: string;
  locations?: ZohoLocationFromApi[];
  custom_fields?: ZohoCustomFieldFromApi[];
  is_batch_tracked?: boolean;
  shelf_life_in_days?: number;
}

interface ZohoWarehouseFromApi {
  warehouse_id: string;
  warehouse_name: string;
}

interface ZohoCustomFieldDefinitionFromApi {
  customfield_id: string;
  label: string;
  data_type: string;
  is_active: boolean;
}

interface ZohoAdjustmentReasonFromApi {
  reason_id: string;
  name: string;
  type: string;
}

interface ZohoInventoryAdjustmentDetailsFromApi {
  inventory_adjustment_id: string;
}

interface ZohoCreateAdjustmentApiResponse {
  code: number;
  message: string;
  inventory_adjustment?: ZohoInventoryAdjustmentDetailsFromApi;
}

interface ZohoAdjustmentReasonsApiResponse {
  reasons: ZohoAdjustmentReasonFromApi[];
}

interface ZohoCustomFieldsApiResponse {
  customfields: ZohoCustomFieldDefinitionFromApi[];
}

interface ZohoWarehousesApiResponse {
  warehouses: ZohoWarehouseFromApi[];
}

interface ZohoItemsApiResponse {
  items: ZohoItemFromApi[];
}

interface ErrorWithStatusAndOptionalCode extends Error {
  status: number;
  code?: string;
}

// Error mapping for Zoho API errors
const mapZohoError = (error: unknown): {
  status: number;
  code: string;
  message: string;
  userMessage: string;
} => {
  const baseError = {
    status: 500,
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    userMessage: 'An unexpected error occurred. Please try again'
  };

  if (!(error instanceof Error)) {
    return baseError;
  }

  if ('status' in error && typeof error.status === 'number') {
    switch (error.status) {
      case 400:
        return {
          status: 400,
          code: 'BAD_REQUEST',
          message: 'Invalid data sent to Zoho',
          userMessage: 'Please check your input and try again'
        };
      case 401:
        return {
          status: 401,
          code: 'UNAUTHORIZED',
          message: 'Authentication failed',
          userMessage: 'Your session has expired. Please log in again'
        };
      case 404:
        return {
          status: 404,
          code: 'NOT_FOUND',
          message: 'Resource not found',
          userMessage: 'The requested item was not found in Zoho Inventory'
        };
      case 429:
        return {
          status: 429,
          code: 'RATE_LIMIT',
          message: 'Rate limit exceeded',
          userMessage: 'Too many requests. Please wait a moment and try again'
        };
      default:
        return {
          status: error.status,
          code: (error as ErrorWithStatusAndOptionalCode).code || 'API_ERROR',
          message: error.message || 'Unknown API error occurred',
          userMessage: 'An unexpected error occurred. Please try again'
        };
    }
  }

  return baseError;
};

// Generic API call with error handling and token check
const apiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  try {
    if (!authToken) {
      throw new Error('No authentication token available');
    }

    if (!authToken.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/)) {
      throw new Error('Invalid token format');
    }

    addBreadcrumb('api', `Attempting Zoho API call: ${options.method || 'GET'} ${endpoint}`);

    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };

    const response = await fetch(`${ZOHO_INVENTORY_API}${endpoint}`, {
      ...options,
      headers,
      mode: 'cors'
    });

    if (response.status === 401) {
      authToken = '';
      const error = new Error('Authentication failed') as ErrorWithStatusAndOptionalCode;
      error.status = 401;
      error.code = 'AUTH_FAILED';
      throw error;
    }

    if (!response.ok) {
      const error = new Error('API request failed') as ErrorWithStatusAndOptionalCode;
      error.status = response.status;
      try {
        const errorData = await response.json();
        error.message = errorData.message || 'API request failed';
        error.code = errorData.code;
      } catch {
        error.message = response.statusText;
      }
      throw error;
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    const mappedError = mapZohoError(error);
    captureError(error as Error, {
      context: 'API Call',
      endpoint,
      method: options.method || 'GET',
      status: mappedError.status,
      code: mappedError.code
    });
    throw error;
  }
};

// Fetch item by SKU
export const fetchItemBySku = async (organizationId: string, sku: string): Promise<ItemInfo> => {
  try {
    const response = await apiCall<ZohoItemsApiResponse>(`/items?organization_id=${organizationId}&sku=${encodeURIComponent(sku)}`);
    
    if (!response.items || response.items.length === 0) {
      throw new Error(`Item with SKU ${sku} not found`);
    }

    const item = response.items[0];
    const isBatchTracked = item.is_batch_tracked === true;
    
    return {
      item_id: item.item_id,
      name: item.name,
      sku: item.sku,
      location_stock_on_hand: 0, // This will need to be fetched separately
      isBatchTracked,
      requiresExpiryDate: isBatchTracked && !!item.shelf_life_in_days,
      shelfLife: item.shelf_life_in_days
    };
  } catch (error) {
    captureError(error as Error, {
      context: 'Fetch Item',
      sku,
      organizationId
    });
    throw error;
  }
};

// Fetch locations
export const fetchLocations = async (organizationId: string): Promise<LocationInfo[]> => {
  try {
    const response = await apiCall<ZohoWarehousesApiResponse>(`/warehouses?organization_id=${organizationId}`);
    
    return response.warehouses.map(warehouse => ({
      location_id: warehouse.warehouse_id,
      location_name: warehouse.warehouse_name
    }));
  } catch (error) {
    captureError(error as Error, {
      context: 'Fetch Locations',
      organizationId
    });
    throw error;
  }
};

// Fetch custom fields
export const fetchItemCustomFields = async (organizationId: string): Promise<CustomFieldDefinition[]> => {
  try {
    const response = await apiCall<ZohoCustomFieldsApiResponse>(`/settings/customfields?organization_id=${organizationId}&module=items`);
    
    return response.customfields
      .filter(field => field.is_active)
      .map(field => ({
        customfield_id: field.customfield_id,
        label: field.label,
        data_type: field.data_type,
        is_active: field.is_active
      }));
  } catch (error) {
    captureError(error as Error, {
      context: 'Fetch Custom Fields',
      organizationId
    });
    throw error;
  }
};

// Fetch adjustment reasons
export const fetchAdjustmentReasons = async (organizationId: string): Promise<AdjustmentReason[]> => {
  try {
    const response = await apiCall<ZohoAdjustmentReasonsApiResponse>(`/settings/reasons?organization_id=${organizationId}&type=inventory_adjustment`);
    
    return response.reasons.map(reason => ({
      reason_id: reason.reason_id,
      reason_name: reason.name,
      reason_type: reason.type as ActionType
    }));
  } catch (error) {
    captureError(error as Error, {
      context: 'Fetch Adjustment Reasons',
      organizationId
    });
    throw error;
  }
};

// Create inventory adjustment
interface AdjustmentParams {
  organizationId: string;
  itemId: string;
  locationId: string;
  quantity: number;
  reason: string;
  batchNumber?: string;
}

export const createInventoryAdjustment = async (params: AdjustmentParams): Promise<{
  success: boolean;
  message: string;
  adjustmentId?: string;
  data?: ZohoCreateAdjustmentApiResponse;
  error?: Error;
}> => {
  try {
    const adjustmentData = {
      organization_id: params.organizationId,
      reason: params.reason,
      line_items: [{
        item_id: params.itemId,
        location_id: params.locationId,
        quantity_adjusted: params.quantity,
        ...(params.batchNumber && {
          custom_fields: [{
            label: 'Batch Number',
            value: params.batchNumber
          }]
        })
      }]
    };

    const response = await apiCall<ZohoCreateAdjustmentApiResponse>('/inventoryadjustments', {
      method: 'POST',
      body: JSON.stringify(adjustmentData)
    });

    return {
      success: response.code === 0,
      message: response.message,
      adjustmentId: response.inventory_adjustment?.inventory_adjustment_id,
      data: response
    };
  } catch (error) {
    captureError(error as Error, {
      context: 'Create Adjustment',
      params
    });
    return {
      success: false,
      message: (error as Error).message,
      error: error as Error
    };
  }
};

// Fetch current user
export const fetchCurrentUser = async (): Promise<UserInfo> => {
  try {
    const response = await fetch(`${ZOHO_PEOPLE_API}/forms/P_EmployeeView/records`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const data = await response.json();
    const userRecord = data[0]; // Assuming first record is the current user

    return {
      email: userRecord.Email,
      fullName: `${userRecord.First_Name} ${userRecord.Last_Name}`,
      role: userRecord.Role || 'user'
    };
  } catch (error) {
    captureError(error as Error, {
      context: 'Fetch Current User'
    });
    throw error;
  }
};