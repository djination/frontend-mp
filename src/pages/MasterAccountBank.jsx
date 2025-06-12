import MasterForm from "../components/form/FormAccountBank";
import Table from "../components/table/TableAccountBank";
import { useState } from "react";

export default function MasterAccountBank() {
  const [data, setData] = useState([
    { id: 1, account_name: "PT. ABC", bank_name: "BCA", bank_account_no: 500110101, bank_category_name: "Origin", is_active: true },
    { id: 2, account_name: "PT. ABC", bank_name: "CIMB", bank_account_no: 99900100, bank_category_name: "Destination", is_active: true },
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Master Account Bank</h1>
      <MasterForm label="Nama Account Bank" onAdd={item => setData([...data, item])} />
      <Table data={data} />
    </div>
  );
}