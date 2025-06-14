import MasterForm from "../components/master/FormPosition";
import Table from "../components/table/TablePosition";
import { useState } from "react";

export default function MasterAccountPIC() {
  const [data, setData] = useState([
    { id: 1, name: "Direktur", is_active: true },
    { id: 2, name: "Manager", is_active: true },
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Master Account PIC</h1>
      <MasterForm label="Nama Account PIC" onAdd={item => setData([...data, item])} />
      <Table data={data} />
    </div>
  );
}