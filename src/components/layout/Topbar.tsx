import { useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";

const Topbar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await logout();

    if (error) {
      alert(error.message);
      return;
    }

    navigate("/login");
  };

  return (
    <header className="topbar">
      <div>
        <h1>Inventory Management</h1>
        <p>Manage stocks, products, suppliers, and reports.</p>
      </div>

      <button onClick={handleLogout}>Logout</button>
    </header>
  );
};

export default Topbar;