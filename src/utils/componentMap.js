// Import your page components
import DashboardPage from '../pages/Dashboard';
import AccountListPage from '../pages/Account/AccountListPage';
import AddAccountPage from '../pages/Account/AddAccountPage';
import EditAccountPage from '../pages/Account/EditAccountPage';
import MasterIndustryPage from '../pages/Parameter/MasterIndustry';
import MasterBusinessTypePage from '../pages/Parameter/MasterBusinessType';
import MasterBankPage from '../pages/Parameter/MasterBank';
import MasterBankCategoryPage from '../pages/Parameter/MasterBankCategory';
import MasterPositionPage from '../pages/Parameter/MasterPosition';
import MasterAccountTypePage from '../pages/Parameter/MasterAccountType';
import MasterAccountCategoryPage from '../pages/Parameter/MasterAccountCategory';
import MasterDocumentTypePage from '../pages/Parameter/MasterDocumentType';
import ServicesPage from '../pages/Services/ServicesPage';
// Import more page components as needed

// This maps route paths to component functions
export const componentMap = {
  '/dashboard': DashboardPage,
  '/account': AccountListPage,
  '/account/add': AddAccountPage,
  '/account/edit/:id': EditAccountPage,
  '/parameter/industry': MasterIndustryPage,
  '/parameter/business-type': MasterBusinessTypePage,
  '/parameter/bank': MasterBankPage,
  '/parameter/bank-category': MasterBankCategoryPage,
  '/parameter/position': MasterPositionPage,
  '/parameter/account-type': MasterAccountTypePage,
  '/parameter/account-category': MasterAccountCategoryPage,
  '/parameter/document-type': MasterDocumentTypePage,
  '/parameter/services': ServicesPage,
  // Add more routes as needed
};