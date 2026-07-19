import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader } from 'lucide-react';

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-dark-950">
    <Loader size={40} className="animate-spin text-primary-500" />
  </div>
);

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but user data hasn't loaded yet
  if (!user || loading) {
    return <PageLoader />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
