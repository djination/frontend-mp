import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MasterAccount from "./pages/MasterAccount";
import Sidebar from "./components/Sidebar";
import { useAuth } from "./components/AuthContext";
import MasterAccountType from "./pages/MasterAccountType";
import MasterAccountCategory from "./pages/MasterAccountCategory";
import MasterIndustry from "./pages/MasterIndustry";
import MasterBusinessType from "./pages/MasterBusinessType";
import MasterBank from "./pages/MasterBank";
import MasterAccountBank from "./pages/MasterAccountBank";
import MasterAccountAddress from "./pages/MasterAccountAddress";
import ServicesPage from "./pages/Services/ServicesPage";
import SettlementMethodPage from "./pages/SettlementMethod/SettlementMethodPage";

function App() {
  // const isAuthenticated = !!localStorage.getItem("token"); // contoh sederhana
  const { isAuthenticated } = useAuth(); // Menggunakan AuthContext untuk mendapatkan status autentikasi

  return (
    <Router>
      {isAuthenticated && <Sidebar />}
      <div className={isAuthenticated ? "ml-64" : ""}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="account" element={isAuthenticated ? <MasterAccount /> : <Navigate to="/login" />} />
          <Route path="account-address" element={isAuthenticated ? <MasterAccountAddress /> : <Navigate to="/login" />} />
          <Route path="account-bank" element={isAuthenticated ? <MasterAccountBank /> : <Navigate to="/login" />} />
          {/* Group all master routes under /master */}
          <Route path="/parameter">
            <Route path="account-type" element={isAuthenticated ? <MasterAccountType /> : <Navigate to="/login" />} />
            <Route path="account-category" element={isAuthenticated ? <MasterAccountCategory /> : <Navigate to="/login" />} />
            <Route path="industry" element={isAuthenticated ? <MasterIndustry /> : <Navigate to="/login" />} />
            <Route path="business-type" element={isAuthenticated ? <MasterBusinessType /> : <Navigate to="/login" />} />
            <Route path="bank" element={isAuthenticated ? <MasterBank /> : <Navigate to="/login" />} />
          </Route>
          <Route path="/services" element={isAuthenticated ? <ServicesPage /> : <Navigate to="/login" />} />
          <Route path="/settlement-methods" element={isAuthenticated ? <SettlementMethodPage /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;