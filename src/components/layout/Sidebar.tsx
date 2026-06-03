import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <h2 className="logo">StockFlow</h2>

      <nav>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/inventory">Inventory</NavLink>
        <NavLink to="/categories">Categories</NavLink>
        <NavLink to="/suppliers">Suppliers</NavLink>
        <NavLink to="/stock-in">Stock In</NavLink>
        <NavLink to="/stock-out">Stock Out</NavLink>
        <NavLink to="/stock-history">Stock History</NavLink>
        <NavLink to="/reports">Reports</NavLink>
        <NavLink to="/users">Users</NavLink>
        <NavLink to="/notifications">Notifications</NavLink>
        <NavLink to="/audit-logs">Audit Logs</NavLink>
        <NavLink to="/settings">Settings</NavLink>
        <NavLink to="/qr-codes">QR Codes</NavLink>
        <NavLink to="/qr-search">QR Search</NavLink>
        
      </nav>
    </aside>
  );
};

export default Sidebar;