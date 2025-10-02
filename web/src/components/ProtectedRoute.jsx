import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRoles) {
    const hasRequiredRole = Array.isArray(requiredRoles)
      ? requiredRoles.includes(user.role)
      : user.role === requiredRoles;

    if (!hasRequiredRole) {
      // Redirect to appropriate dashboard based on user role
      const redirectPath = getRoleDashboard(user.role);
      return <Navigate to={redirectPath} replace />;
    }
  }

  return children;
};

// Helper function to get dashboard path based on role
const getRoleDashboard = (role) => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'support':
      return '/support';
    case 'packaging':
      return '/packaging';
    default:
      return '/login';
  }
};

export default ProtectedRoute;
