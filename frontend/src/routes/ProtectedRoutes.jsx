// src/routes/ProtectedRoutes.jsx
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoutes({ children, redirectTo, allowedRoles }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const location = useLocation();

  // If not logged in → redirect
  if (!token) return <Navigate to={redirectTo} state={{ from: location }} replace />;

  // If logged in but not allowed to access this section → redirect to landing
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
