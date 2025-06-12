import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext"; // Import useAuth untuk mendapatkan status autentikasi
import { useState } from "react";

export default function Sidebar() {
  const { logout } = useAuth(); // Menggunakan AuthContext untuk mendapatkan fungsi logout
  const navigate = useNavigate();
  const [openParameter, setOpenParameter] = useState(false)
  
  const handleLogout = () => {
    logout(); // Panggil fungsi logout dari AuthContext
    navigate("/login");
  };

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-blue-700 to-blue-900 text-white shadow-lg flex flex-col">
      <div className="p-6 font-bold text-2xl border-b border-blue-800">CustomerDB</div>
     <nav className="flex-1 p-4 space-y-2">
        <Link to="/dashboard" className="block py-2 px-4 rounded hover:bg-blue-800">Dashboard</Link>
        <Link to="/account" className="block py-2 px-4 rounded hover:bg-blue-800">Account</Link>
        <Link to="/account-address" className="block py-2 px-4 rounded hover:bg-blue-800">Account Address</Link>
        <Link to="/account-bank" className="block py-2 px-4 rounded hover:bg-blue-800">Account Bank</Link>
        {/* Parameter Menu Group */}
        <div>
          <button
            type="button"
            className="w-full flex justify-between items-center py-2 px-4 rounded hover:bg-blue-800 focus:outline-none"
            onClick={() => setOpenParameter(!openParameter)}
          >
            <span>Master Parameter</span>
            <span>{openParameter ? "▲" : "▼"}</span>
          </button>
          {openParameter && (
            <div className="ml-4 mt-2 space-y-1">
              
              <Link to="/parameter/account-type" className="block py-2 px-4 rounded hover:bg-blue-800">Account Type</Link>
              <Link to="/parameter/account-category" className="block py-2 px-4 rounded hover:bg-blue-800">Account Category</Link>
              <Link to="/parameter/industry" className="block py-2 px-4 rounded hover:bg-blue-800">Industry</Link>
              <Link to="/parameter/business-type" className="block py-2 px-4 rounded hover:bg-blue-800">Business Type</Link>
              <Link to="/parameter/bank" className="block py-2 px-4 rounded hover:bg-blue-800">Bank</Link>
              {/* Tambahkan sub-menu master lain jika ada */}
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