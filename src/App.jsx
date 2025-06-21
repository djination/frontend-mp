import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
// import MasterAccount from "./pages/MasterAccount";
import Sidebar from "./components/Sidebar";
import { useAuth } from "./components/AuthContext";
import ServicesPage from "./pages/Services/ServicesPage";
import AccountList from './pages/Account/AccountListPage';
import AddAccount from './pages/Account/AddAccountPage';
import EditAccount from './pages/Account/EditAccountPage';
import MasterIndustry from "./pages/Parameter/MasterIndustry";
import MasterBusinessType from "./pages/Parameter/MasterBusinessType";
import MasterBank from "./pages/Parameter/MasterBank";
import MasterBankCategory from "./pages/Parameter/MasterBankCategory";
import MasterPosition from "./pages/Parameter/MasterPosition";
import MasterAccountType from "./pages/Parameter/MasterAccountType";
import MasterAccountCategory from "./pages/Parameter/MasterAccountCategory";
import SettlementMethodPage from "./pages/SettlementMethod/SettlementMethodPage";
import RevenueRule from "./pages/RevenueRule/RevenueRule";

function App() {
  const { isAuthenticated } = useAuth(); // Menggunakan AuthContext untuk mendapatkan status autentikasi

  return (
    <Router>
      {isAuthenticated && <Sidebar />}
      <div className={isAuthenticated ? "ml-64" : ""}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/revenue-rules" element={<RevenueRule />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/account" element={isAuthenticated ? <AccountList /> : <Navigate to="/login" />} />
          <Route path="/account/add" element={isAuthenticated ? <AddAccount /> : <Navigate to="/login" />} />
          <Route path="/account/edit/:id" element={isAuthenticated ? <EditAccount /> : <Navigate to="/login" />} />
          {/* Group all master routes under /master */}
          <Route path="/parameter">
            <Route path="industry" element={isAuthenticated ? <MasterIndustry /> : <Navigate to="/login" />} />
            <Route path="business-type" element={isAuthenticated ? <MasterBusinessType /> : <Navigate to="/login" />} />
            <Route path="bank" element={isAuthenticated ? <MasterBank /> : <Navigate to="/login" />} />
            <Route path="bank-category" element={isAuthenticated ? <MasterBankCategory /> : <Navigate to="/login" />} />
            <Route path="position" element={isAuthenticated ? <MasterPosition /> : <Navigate to="/login" />} />
            <Route path="account-type" element={isAuthenticated ? <MasterAccountType /> : <Navigate to="/login" />} />
            <Route path="account-category" element={isAuthenticated ? <MasterAccountCategory /> : <Navigate to="/login" />} />
            <Route path="services" element={isAuthenticated ? <ServicesPage /> : <Navigate to="/login" />} />
            <Route path="settlement-methods" element={isAuthenticated ? <SettlementMethodPage /> : <Navigate to="/login" />} />
          </Route>
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;