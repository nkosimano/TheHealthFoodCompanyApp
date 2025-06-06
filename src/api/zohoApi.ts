const API_BASE_URL = import.meta.env.VITE_AUTH_PROXY_URL?.replace('/api/auth', '/api/zoho') || 'http://localhost:3000/api/zoho';

let authToken: string | null = null;

export const setAuthTokenHeader = (token: string | null) => {
  authToken = token;
};

export const apiCall = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<T> => {
  if (!authToken) {
    console.error('No access token available for API call:', { endpoint });
    throw new Error('No authentication token available');
  }

  const headers: HeadersInit = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const config: RequestInit = {
    method,
    headers,
    credentials: 'include'
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  console.log('Making API request:', {
    endpoint,
    method,
    hasBody: !!body,
    url: `${API_BASE_URL}/${endpoint}`
  });

  const response = await fetch(`${API_BASE_URL}/${endpoint}`, config);

  if (!response.ok) {
    console.error('API error:', {
      status: response.status,
      statusText: response.statusText,
      endpoint,
      url: `${API_BASE_URL}/${endpoint}`
    });

    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    throw new Error(errorData.message || 'API request failed');
  }

  return response.json();
};

// API Endpoints
export const fetchCurrentUser = async () => {
  return apiCall<any>('users/current');
};

export const fetchLocations = async () => {
  return apiCall<any>('locations');
};

export const fetchSettings = async () => {
  return apiCall<any>('settings');
}; 