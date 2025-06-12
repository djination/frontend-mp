import MasterForm from "../components/form/FormAccountCategory";
import Table from "../components/table/TableAccountCategory";
import { useState } from "react";

export default function MasterAccountCategory() {
  const [data, setData] = useState([
    { id: 1, name: "Parent", is_active: true },
    { id: 2, name: "Branch", is_active: false },
    { id: 3, name: "Sub-Branch", is_active: false },
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Master Account Category</h1>
      <MasterForm label="Nama Account Category" onAdd={item => setData([...data, item])} />
      <Table data={data} />
    </div>
  );
}