import MasterForm from "../components/form/FormAccountAddress";
import Table from "../components/table/TableAccountAddress";
import { useState } from "react";

export default function MasterAccountAddress() {
  const [data, setData] = useState([
    { id: 1, acc_name: "PT. ABC", address1: "Gedung A", address2: "Jl. ABC no xx", subdistrict: "Cipedak", district: "Jagakarsa", city: "Jakarta Selatan", province: "DKI Jakarta", postalcode: "12630", country:"Indonesia", latitude: "", longitude: "", is_active: true },
    { id: 2, acc_name: "PT. XYZ", address1: "Gedung A", address2: "Jl. ABC no xx", subdistrict: "Cipedak", district: "Jagakarsa", city: "Jakarta Selatan", province: "DKI Jakarta", postalcode: "12630", country:"Indonesia", latitude: "", longitude: "", is_active: true },
    { id: 3, acc_name: "Grosir ABC", address1: "Gedung A", address2: "Jl. ABC no xx", subdistrict: "Cipedak", district: "Jagakarsa", city: "Jakarta Selatan", province: "DKI Jakarta", postalcode: "12630", country:"Indonesia", latitude: "", longitude: "", is_active: true },
    { id: 4, acc_name: "Warung ABC", address1: "Gedung A", address2: "Jl. ABC no xx", subdistrict: "Cipedak", district: "Jagakarsa", city: "Jakarta Selatan", province: "DKI Jakarta", postalcode: "12630", country:"Indonesia", latitude: "", longitude: "", is_active: true },
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Master Account Bank</h1>
      <MasterForm label="Nama Account Address" onAdd={item => setData([...data, item])} />
      <Table data={data} />
    </div>
  );
}