import React from 'react';
import { useApp } from '../context/appExports';
import { useAuth } from '../context/authExports';

const LocationSelector: React.FC = () => {
  const { locations } = useApp();
  const { auth, setLocationId } = useAuth();

  if (locations.length <= 1) return null;

  return (
    <div className="mb-6 mt-2 px-3 py-2 bg-gray-700 bg-opacity-50 rounded">
      <label htmlFor="location" className="block text-sm mb-1 text-gray-300">
        Select Location:
      </label>
      <select
        id="location"
        value={auth.current_location_id}
        onChange={(e) => setLocationId(e.target.value)}
        className="w-full bg-gray-900 border border-gray-700 text-green-400 px-3 py-2 rounded font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        {locations.map((location) => (
          <option key={location.location_id} value={location.location_id}>
            {location.location_name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LocationSelector;