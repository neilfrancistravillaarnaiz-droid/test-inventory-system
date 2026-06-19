import RestockPredictor from "../pages/restock/RestockPredictor";
import QRSearch from "../pages/qr/QRSearch";
import ProductDetails from "../pages/products/ProductDetails";
import ProductQR from "../pages/qr/ProductQR";
import AuditLogs from "../pages/audit/AuditLogs";
import Notifications from "../pages/notifications/Notifications";
import Settings from "../pages/settings/Settings";
import Users from "../pages/users/Users";
import Reports from "../pages/reports/Reports";
import StockIn from "../pages/stock/StockIn";
import StockOut from "../pages/stock/StockOut";
import StockHistory from "../pages/stock/StockHistory";
import Suppliers from "../pages/suppliers/Suppliers";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import Dashboard from "../pages/dashboard/Dashboard";
import Inventory from "../pages/inventory/Inventory";
import AddProduct from "../pages/inventory/AddProduct";
import NotFound from "../pages/NotFound";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";
import RequirePermission from "./RequirePermission";
import EditProduct from "../pages/inventory/EditProduct";
import Categories from "../pages/categories/Categories";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/inventory" element={<Inventory />} />
          <Route
            path="/inventory/add"
            element={
              <RequirePermission permission="inventory:create">
                <AddProduct />
              </RequirePermission>
            }
          />
          <Route
            path="/inventory/edit/:id"
            element={
              <RequirePermission permission="inventory:update">
                <EditProduct />
              </RequirePermission>
            }
          />

          <Route
            path="/categories"
            element={
              <RequirePermission permission="categories:manage">
                <Categories />
              </RequirePermission>
            }
          />
          <Route
            path="/suppliers"
            element={
              <RequirePermission permission="suppliers:manage">
                <Suppliers />
              </RequirePermission>
            }
          />

          <Route
            path="/stock-in"
            element={
              <RequirePermission permission="stock:move">
                <StockIn />
              </RequirePermission>
            }
          />
          <Route
            path="/stock-out"
            element={
              <RequirePermission permission="stock:move">
                <StockOut />
              </RequirePermission>
            }
          />
          <Route path="/stock-history" element={<StockHistory />} />

          <Route
            path="/reports"
            element={
              <RequirePermission permission="reports:view">
                <Reports />
              </RequirePermission>
            }
          />
          <Route
            path="/users"
            element={
              <RequirePermission permission="users:manage">
                <Users />
              </RequirePermission>
            }
          />
          <Route
            path="/settings"
            element={
              <RequirePermission permission="settings:manage">
                <Settings />
              </RequirePermission>
            }
          />
          <Route
            path="/notifications"
            element={
              <RequirePermission permission="alerts:view">
                <Notifications />
              </RequirePermission>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <RequirePermission permission="audit:view">
                <AuditLogs />
              </RequirePermission>
            }
          />

          <Route
            path="/qr-codes"
            element={
              <RequirePermission permission="qr:view">
                <ProductQR />
              </RequirePermission>
            }
          />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route
            path="/qr-search"
            element={
              <RequirePermission permission="qr:view">
                <QRSearch />
              </RequirePermission>
            }
          />
          <Route path="/restock-predictor" element={<RestockPredictor />} />

        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
