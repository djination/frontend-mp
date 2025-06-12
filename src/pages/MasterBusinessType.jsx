import MasterForm from "../components/form/FormBusinessType";
import Table from "../components/table/TableBusinessType";
import { useState } from "react";

export default function MasterBusinessType() {
  const [data, setData] = useState([
    { id: 1, name: "Corporate", details: "Public", is_active: true },
    { id: 2, name: "Corporate", details: "Pivate", is_active: true },
    { id: 3, name: "Corporate", details: "Others", is_active: true },
    { id: 4, name: "Personal", details: "", is_active: true },
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Master Business Type</h1>
      <MasterForm label="Nama Business Type" onAdd={item => setData([...data, item])} />
      <Table data={data} />
    </div>
  );
}