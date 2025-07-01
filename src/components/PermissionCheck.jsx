import React from 'react';
import { useAuth } from './AuthContext';

/**
 * Component to conditionally render children based on user permissions
 * @param {Object} props
 * @param {string|string[]} props.permissions - Permission code(s) required
 * @param {boolean} props.requireAll - If true, user must have all permissions. If false, any one is sufficient
 * @param {React.ReactNode} props.children - Children to render if permission check passes
 * @param {React.ReactNode} props.fallback - Optional component to render if check fails
 */
const PermissionCheck = ({ permissions, requireAll = false, children, fallback = null }) => {
  const { hasPermission } = useAuth();
  
  // Convert single permission to array
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
  
  // Check permissions
  const hasAccess = requireAll
    ? permissionArray.every(p => hasPermission(p))
    : permissionArray.some(p => hasPermission(p));
  
  return hasAccess ? children : fallback;
};

export default PermissionCheck;