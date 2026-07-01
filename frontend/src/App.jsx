import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { RequireAuth, RequireAdmin } from "./components/ProtectedRoute";

import AuthPage from "./pages/AuthPage";
import ShopDashboard from "./pages/ShopDashboard";
import AdminOverview from "./pages/AdminOverview";
import AdminShops from "./pages/AdminShops";
import AdminShopDetail from "./pages/AdminShopDetail";
import AdminAlerts from "./pages/AdminAlerts";
import AdminReports from "./pages/AdminReports";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<AuthPage />} />

          {/* Shop user routes */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <ShopDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/loans"
            element={
              <RequireAuth>
                <ShopDashboard />
              </RequireAuth>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminOverview />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/shops"
            element={
              <RequireAdmin>
                <AdminShops />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/shops/:shopId"
            element={
              <RequireAdmin>
                <AdminShopDetail />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/alerts"
            element={
              <RequireAdmin>
                <AdminAlerts />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <RequireAdmin>
                <AdminReports />
              </RequireAdmin>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}