import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./authContext.js";

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoadingScreen />;

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <AuthLoadingScreen />;

  return isAuthenticated
    ? <Navigate to="/app" replace />
    : <Outlet />;
}

function AuthLoadingScreen() {
  return (
    <main
      className="auth-loading"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="auth-loading__brand" aria-hidden="true">
        <span className="auth-loading__logo">SP</span>
        <span className="auth-loading__pulse" />
      </div>

      <div className="auth-loading__content">
        <h1>Student Planner</h1>
        <p>Preparing your academic workspace…</p>
      </div>

      <div className="auth-loading__indicator" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </main>
  );
}
