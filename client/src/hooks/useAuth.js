import { useSelector } from 'react-redux';
import { ROLES } from '../constants';

export const useAuth = () => {
  const { user, token, isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const isAdmin = user?.role === ROLES.ADMIN;
  const isPM = user?.role === ROLES.PROJECT_MANAGER;
  const isEmployee = user?.role === ROLES.EMPLOYEE;
  const isAdminOrPM = isAdmin || isPM;

  const hasRole = (...roles) => roles.includes(user?.role);

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    isAdmin,
    isPM,
    isEmployee,
    isAdminOrPM,
    hasRole,
  };
};
