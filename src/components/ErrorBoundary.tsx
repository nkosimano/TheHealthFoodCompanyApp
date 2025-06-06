import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import * as Sentry from '@sentry/react';

const FallbackComponent = ({ error }: { error?: Error }) => {
  const routeError = useRouteError();
  
  if (isRouteErrorResponse(routeError)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-600 mb-4">
              {routeError.status} {routeError.statusText}
            </h1>
            <p className="text-gray-600 mb-4">
              {routeError.data?.message || "Something went wrong. Please try again."}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-200"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-600 mb-4">
            {error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-200"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

const ErrorBoundary = Sentry.withErrorBoundary(FallbackComponent, {
  showDialog: true,
  dialogOptions: {
    title: "An Error Occurred",
    subtitle: "Our team has been notified.",
    subtitle2: "If you'd like to help, tell us what happened below."
  }
});

export default ErrorBoundary; 