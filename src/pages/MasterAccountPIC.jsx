import MasterForm from "../components/form/FormAccountPIC";
import Table from "../components/table/TableAccountPIC";
import { useState } from "react";

export default function MasterAccountPIC() {
  const [data, setData] = useState([
    { id: 1, account_name: "PT. ABC", name: "Jono", position: "Manager", phone_no: "08123123213", email: "x@example.com", is_active: true },
    { id: 2, account_name: "PT. ABC", name: "Joko", position: "Manager", phone_no: "08123123213", email: "x@example.com", is_active: true },
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Master Account PIC</h1>
      <MasterForm label="Nama Account PIC" onAdd={item => setData([...data, item])} />
      <Table data={data} />
    </div>
  );
}