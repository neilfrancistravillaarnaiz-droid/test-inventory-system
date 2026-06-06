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
          <Route path="/inventory/add" element={<AddProduct />} />
          <Route path="/inventory/edit/:id" element={<EditProduct />} />

          <Route path="/categories" element={<Categories />} />
          <Route path="/suppliers" element={<Suppliers />} />

          <Route path="/stock-in" element={<StockIn />} />
          <Route path="/stock-out" element={<StockOut />} />
          <Route path="/stock-history" element={<StockHistory />} />

          <Route path="/reports" element={<Reports />} />
          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/audit-logs" element={<AuditLogs />} />

          <Route path="/qr-codes" element={<ProductQR />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/qr-search" element={<QRSearch />} />
          <Route path="/restock-predictor" element={<RestockPredictor />} />

        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;