import AccountForm from "../components/AccountForm";
import Table from "../components/Table";
import { useState } from "react";

export default function MasterAccount() {
  const [accounts, setAccounts] = useState([
    // Contoh data dummy
    { id: 1, name: "PT. ABC", industry: "Distributor", type_of_business: "Corporate", type_of_business_desc: "Public", account_type: "Partner", account_category: "Parent", parent:"", is_active: true },
    { id: 1, name: "PT. XYZ", industry: "Produsen", type_of_business: "Corporate", type_of_business_desc: "Private", account_type: "Customer", account_category: "Parent", parent:"", is_active: true },
    { id: 1, name: "Grosir ABC", industry: "Distributor", type_of_business: "Personal", type_of_business_desc: "Public", account_type: "Partner", account_category: "Branch", parent:"PT. ABC", is_active: true },
    { id: 1, name: "Warung ABC", industry: "Distributor", type_of_business: "Personal", type_of_business_desc: "Public", account_type: "Partner", account_category: "Sub-Branch", parent:"Grosir ABC", is_active: true },
  ]);

  // Handler untuk toggle checkbox is_active
  const handleToggleActive = (id) => {
    setAccounts(accounts =>
      accounts.map(acc =>
        acc.id === id ? { ...acc, is_active: !acc.is_active } : acc
      )
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Master Account</h1>
      <div className="mb-8">
        <AccountForm onAdd={acc => setAccounts([...accounts, acc])} />
      </div>
      <Table data={accounts} />
    </div>
  );
}