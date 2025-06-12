import MasterForm from "../components/MasterForm";
import Table from "../components/Table";
import { useState } from "react";

export default function MasterBankCategory() {
  const [data, setData] = useState([
    { id: 1, name: "Origin", is_active: true },
    { id: 2, name: "Destination", is_active: true },
    { id: 3, name: "Billing", is_active: true },
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Master Bank</h1>
      <MasterForm label="Category" onAdd={item => setData([...data, item])} />
      <Table data={data} />
    </div>
  );
}