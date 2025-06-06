import * as Sentry from '@sentry/react';
import { browserTracingIntegration, replayIntegration } from '@sentry/react';
import { UserInfo } from '../types';

// Initialize Sentry
export const initSentry = (): void => {
  Sentry.init({
    dsn: "https://8a2a2e24f549f2cb7344bdb0e9dee125@o4509430518513664.ingest.de.sentry.io/4509430555410512",
    integrations: [
      browserTracingIntegration(),
      replayIntegration()
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
};

// Set user context after successful login
export const setUserContext = (user: UserInfo | null): void => {
  if (user) {
    Sentry.setUser({
      email: user.email,
      username: user.fullName,
      role: user.role
    });
  } else {
    Sentry.setUser(null);
  }
};

// Clear user context on logout
export const clearUserContext = (): void => {
  Sentry.setUser(null);
};

// Add breadcrumb for tracking user actions
export const addBreadcrumb = (
  category: string,
  message: string,
  level: Sentry.SeverityLevel = 'info'
): void => {
  Sentry.addBreadcrumb({
    category,
    message,
    level
  });
};

// Capture error with additional context
export const captureError = (error: Error, context?: Record<string, unknown>): void => {
  Sentry.captureException(error, {
    extra: context
  });
};

// Capture message with additional context
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>
): void => {
  Sentry.captureMessage(message, {
    level,
    extra: context
  });
};

// Set extra context data
export const setExtraContext = (key: string, value: unknown): void => {
  Sentry.setExtra(key, value);
};

// Clear all context data
export const clearContext = (): void => {
  const scope = new Sentry.Scope();
  scope.clear();
  Sentry.setUser(null);
  Sentry.setExtra('', null);
};

// Log an error with optional extra data
export const logError = (error: Error, extras?: Record<string, unknown>): void => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: extras
    });
  } else {
    console.error('Error:', error, extras);
  }
};

// Log a message with optional extra data
export const logMessage = (message: string, extras?: Record<string, unknown>): void => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(message, {
      extra: extras
    });
  } else {
    console.warn('Message:', message, extras);
  }
};