interface AuthConfig {
  sentry: {
    clientId: string;
    authUrl: string;
    tokenUrl: string;
  };
}

const requiredEnvVars = [
  'VITE_SENTRY_CLIENT_ID',
  'VITE_SENTRY_AUTH_URL',
  'VITE_SENTRY_TOKEN_URL',
] as const;

// Verify all required environment variables are present
for (const envVar of requiredEnvVars) {
  if (!import.meta.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const authConfig: AuthConfig = {
  sentry: {
    clientId: import.meta.env.VITE_SENTRY_CLIENT_ID,
    authUrl: import.meta.env.VITE_SENTRY_AUTH_URL,
    tokenUrl: import.meta.env.VITE_SENTRY_TOKEN_URL,
  },
} as const;

// Note: Client Secret should only be used in a secure backend environment, never in the frontend 