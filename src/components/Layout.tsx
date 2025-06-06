import { Outlet } from 'react-router-dom';
import { NetworkProvider } from '../context/NetworkContext';

const Layout = () => {
  return (
    <NetworkProvider>
      <div className="min-h-screen bg-gray-50">
        <Outlet />
      </div>
    </NetworkProvider>
  );
};

export default Layout; 