import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openParameter, setOpenParameter] = useState(false);
  const [openAccount, setOpenAccount] = useState(false); // State untuk menu Account
  
  // Auto-expand menus based on current path
  useEffect(() => {
    if (location.pathname.startsWith("/parameter")) {
      setOpenParameter(true);
    }
    if (location.pathname.startsWith("/account")) {
      setOpenAccount(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Function to determine active menu
  const isActive = (path) => {
    if (path === location.pathname) return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-blue-700 to-blue-900 text-white shadow-lg flex flex-col">
      <div className="p-6 font-bold text-2xl border-b border-blue-800">CustomerDB</div>
      <nav className="flex-1 p-4 space-y-2">
        <Link 
          to="/dashboard" 
          className={`block py-2 px-4 rounded hover:bg-blue-800 ${isActive('/dashboard') ? 'bg-blue-800' : ''}`}
        >
          Dashboard
        </Link>
        
        <Link 
          to="/account" 
          className={`block py-2 px-4 rounded hover:bg-blue-800 ${isActive('/account') ? 'bg-blue-800' : ''}`}
        >
          Account
        </Link>
        
        <Link 
          to="/services" 
          className={`block py-2 px-4 rounded hover:bg-blue-800 ${isActive('/services') ? 'bg-blue-800' : ''}`}
        >
          Services
        </Link>

        <Link 
          to="/settlement-methods" 
          className={`block py-2 px-4 rounded hover:bg-blue-800 ${isActive('/settlement-methods') ? 'bg-blue-800' : ''}`}
        >
          Settlement Methods
        </Link>

        {/* Account Menu Group */}

        {/* Parameter Menu Group */}
        <div>
          <button
            type="button"
            className={`w-full flex justify-between items-center py-2 px-4 rounded hover:bg-blue-800 focus:outline-none ${isActive('/parameter') ? 'bg-blue-800' : ''}`}
            onClick={() => setOpenParameter(!openParameter)}
          >
            <span>Master Parameter</span>
            <span>{openParameter ? "▲" : "▼"}</span>
          </button>
          {openParameter && (
            <div className="ml-4 mt-2 space-y-1">
              <Link 
                to="/parameter/industry" 
                className={`block py-2 px-4 rounded hover:bg-blue-800 ${isActive('/parameter/industry') ? 'bg-blue-700' : ''}`}
              >
                Industry
              </Link>
              <Link 
                to="/parameter/business-type" 
                className={`block py-2 px-4 rounded hover:bg-blue-800 ${isActive('/parameter/business-type') ? 'bg-blue-700' : ''}`}
              >
                Business Type
              </Link>
              <Link 
                to="/parameter/bank" 
                className={`block py-2 px-4 rounded hover:bg-blue-800 ${isActive('/parameter/bank') ? 'bg-blue-700' : ''}`}
              >
                Bank
              </Link>
              <Link 
                to="/parameter/bank-category" 
                className={`block py-2 px-4 rounded hover:bg-blue-800 ${isActive('/parameter/bank-category') ? 'bg-blue-700' : ''}`}
              >
                Bank Category
              </Link>
              <Link 
                to="/parameter/position" 
                className={`block py-2 px-4 rounded hover:bg-blue-800 ${isActive('/parameter/position') ? 'bg-blue-700' : ''}`}
              >
                Position
              </Link>
              <Link 
                to="/parameter/account-type" 
                className={`block py-2 px-4 rounded hover:bg-blue-800 ${isActive('/parameter/account-type') ? 'bg-blue-700' : ''}`}
              >
                Account Type
              </Link>
              <Link 
                to="/parameter/account-category" 
                className={`block py-2 px-4 rounded hover:bg-blue-800 ${isActive('/parameter/account-category') ? 'bg-blue-700' : ''}`}
              >
                Account Category
              </Link>
            </div>
          )}
        </div>
      </nav>
      <div className="p-4 border-t border-blue-800">
        <button
          className="w-full py-2 bg-red-600 rounded hover:bg-red-700"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}