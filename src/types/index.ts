export interface ZohoAuthState {
  client_id: string;
  organization_id: string;
  current_location_id: string;
  access_token: string;
  refresh_token: string;
  isLoggedIn: boolean;
  tokenExpiry: number;
}

export interface NetworkState {
  isOnline: boolean;
}

export interface LocationInfo {
  location_id: string;
  location_name: string;
}

export interface BatchInfo {
  batch_number: string;
  expiry_date?: string;
  manufacturing_date?: string;
  current_stock: number;
}

export interface ItemInfo {
  item_id: string;
  name: string;
  sku: string;
  location_stock_on_hand: number;
  isBatchTracked: boolean;
  requiresExpiryDate: boolean;
  shelfLife?: number; // in days
  batches?: BatchInfo[];
}

export interface CustomField {
  customfield_id: string;
  label: string;
  value: string;
}

export interface PendingOperation {
  client_operation_id: string;
  timestamp_initiated: string;
  organization_id_zoho: string;
  location_id_zoho: string;
  item_id_zoho: string;
  item_sku: string;
  item_name: string;
  action_type: ActionType;
  quantity: number;
  reason_selected: string;
  batch_serial_number_entered?: string | null;
  manufacturing_date?: string;
  expiry_date?: string;
  payload_for_zoho: ZohoAdjustmentPayload;
  retry_count: number;
  status: 'pending_sync' | 'syncing';
}

export interface ZohoAdjustmentPayload {
  adjustment_type: string;
  date: string;
  reason: string;
  description: string;
  line_items: Array<{
    item_id: string;
    location_id: string;
    quantity_adjusted: number;
    custom_fields?: Array<{
      customfield_id: string;
      value: string;
    }>;
  }>;
}

export interface SyncOperation {
  client_operation_id: string;
  timestamp_initiated: string;
  item_id: string;
  item_sku: string;
  item_name: string;
  quantity: number;
  action_type: ActionType;
  reason_selected: string;
  batch_serial_number_entered?: string;
  manufacturing_date?: string;
  expiry_date?: string;
  location_id_used: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed_retryable' | 'failed_permanent';
  zoho_inventory_adjustment_id?: string;
  last_sync_attempt_timestamp?: string;
  sync_error_code?: string;
  sync_error_message?: string;
  retry_count: number;
}

export interface CustomFieldDefinition {
  customfield_id: string;
  label: string;
  data_type: string;
  is_active: boolean;
}

export interface AdjustmentReason {
  reason_id?: string;
  reason_name: string;
  reason_type: ActionType | 'ALL';
  category?: 'GENERAL' | 'DAMAGE' | 'SPOILAGE' | 'PRODUCTION';
}

export enum ActionType {
  ADD = 'ADD_STOCK',
  REDUCE = 'REDUCE_STOCK'
}

export interface BatchValidationResult {
  isValid: boolean;
  message?: string;
  existingBatch?: BatchInfo;
}

export interface UserInfo {
  email: string;
  fullName: string;
  role: string;
}