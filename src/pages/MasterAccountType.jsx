import MasterForm from "../components/form/FormAccountType";
import Table from "../components/table/TableAccountType";
import { useState } from "react";

export default function MasterAccountType() {
  const [data, setData] = useState([
    { id: 1, name: "Customer", is_active: true },
    { id: 2, name: "Partner", is_active: true },
    { id: 3, name: "Referal", is_active: true },
    { id: 4, name: "Vendor", is_active: true },
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Master Account Type</h1>
      <MasterForm label="Nama Account Type" onAdd={item => setData([...data, item])} />
      <Table data={data} />
    </div>
  );
}