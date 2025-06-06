import { useState } from 'react';
import * as Sentry from '@sentry/react';
import { captureMessage, captureError, addBreadcrumb } from '../services/sentryService';

const SentryTest = () => {
  const [count, setCount] = useState(0);

  const triggerError = () => {
    try {
      // Deliberately cause an error
      throw new Error('Test error from button click');
    } catch (error) {
      if (error instanceof Error) {
        captureError(error, { location: 'SentryTest component', action: 'triggerError' });
      }
    }
  };

  const triggerUnhandledError = () => {
    // This will trigger the error boundary
    throw new Error('Unhandled test error');
  };

  const triggerPromiseError = () => {
    // Trigger an unhandled promise rejection
    Promise.reject(new Error('Test promise rejection'));
  };

  const sendTestMessage = () => {
    setCount(prev => prev + 1);
    addBreadcrumb('user-action', `Button clicked ${count + 1} times`);
    captureMessage('Test message sent', 'info', {
      count: count + 1,
      timestamp: new Date().toISOString()
    });
  };

  const triggerConsoleError = () => {
    console.error('Test console error message');
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Sentry Test Panel</h2>
      <div className="space-y-2">
        <button
          onClick={sendTestMessage}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Send Test Message ({count})
        </button>
        <button
          onClick={triggerError}
          className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
        >
          Trigger Handled Error
        </button>
        <button
          onClick={triggerUnhandledError}
          className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Trigger Unhandled Error
        </button>
        <button
          onClick={triggerPromiseError}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
        >
          Trigger Promise Rejection
        </button>
        <button
          onClick={triggerConsoleError}
          className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
        >
          Trigger Console Error
        </button>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>Click the buttons above to test different error scenarios.</p>
        <p>Check your Sentry dashboard to see the results.</p>
      </div>
    </div>
  );
};

export default SentryTest; 