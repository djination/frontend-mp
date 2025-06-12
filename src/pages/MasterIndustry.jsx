import MasterForm from "../components/MasterForm";
import Table from "../components/Table";
import { useState } from "react";

export default function MasterIndustry() {
  const [data, setData] = useState([
    { id: 1, name: "Industri Makanan", is_active: true },
    { id: 2, name: "Industri Otomotif", is_active: true },
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Master Industry</h1>
      <MasterForm label="Nama Industry" onAdd={item => setData([...data, item])} />
      <Table data={data} />
    </div>
  );
}