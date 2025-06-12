import MasterForm from "../components/form/FormBank";
import Table from "../components/table/TableBank";
import { useState } from "react";

export default function MasterBank() {
  const [data, setData] = useState([
    { id: 1, name: "BCA", description: "Bank Central Asia", is_active: true },
    { id: 2, name: "Mandiri", description: "Bank Mandiri", is_active: true },
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Master Bank</h1>
      <MasterForm label="Nama Bank" onAdd={item => setData([...data, item])} />
      <Table data={data} />
    </div>
  );
}