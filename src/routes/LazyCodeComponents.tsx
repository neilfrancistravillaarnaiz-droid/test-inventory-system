import { lazy } from "react";

export const Login = lazy(() => import("../pages/auth/Login"));
export const Register = lazy(() => import("../pages/auth/Register"));
export const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));

export const Dashboard = lazy(() => import("../pages/dashboard/Dashboard"));

export const Inventory = lazy(() => import("../pages/inventory/Inventory"));
export const AddProduct = lazy(() => import("../pages/inventory/AddProduct"));

export const Categories = lazy(() => import("../pages/categories/Categories"));
export const Suppliers = lazy(() => import("../pages/suppliers/Suppliers"));

export const StockIn = lazy(() => import("../pages/stock/StockIn"));
export const StockOut = lazy(() => import("../pages/stock/StockOut"));
export const StockHistory = lazy(() => import("../pages/stock/StockHistory"));

export const Reports = lazy(() => import("../pages/reports/Reports"));
export const Users = lazy(() => import("../pages/users/Users"));
export const Notifications = lazy(() => import("../pages/notifications/Notifications"));
export const AuditLogs = lazy(() => import("../pages/audit/AuditLogs"));
export const Settings = lazy(() => import("../pages/settings/Settings"));

export const NotFound = lazy(() => import("../pages/NotFound"));