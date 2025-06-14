import { useState } from "react";

export default function FormAccount({ onAdd }) {
  const [accountNo, setAccountNo] = useState("");
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [typeOfBusiness, setTypeOfBusiness] = useState("");
  const [accountType, setAccountType] = useState("");
  const [accountCategory, setAccountCategory] = useState("");
  const [parent, setParent] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ id: Date.now(), name, type, is_active: isActive });
    setName("");
    setType("");
    setIsActive(true);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow flex gap-4 items-end">
      <div>
        <label className="block mb-1 font-semibold">Account No</label>
        <input
          type="text"
          className="border rounded px-3 py-2 w-48"
          value={accountNo}
          onChange={e => setAccountNo(e.target.value)}
          readOnly
          placeholder="Auto-generated"
        />
      </div>
      <div>
        <label className="block mb-1 font-semibold">Nama Account</label>
        <input
          type="text"
          className="border rounded px-3 py-2 w-48"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div> 
      <div>
        <label className="block mb-1 font-semibold">Industry</label>
        <input
          type="text"
          className="border rounded px-3 py-2 w-48"
          value={industry}
          onChange={e => setIndustry(e.target.value)}
          required
        />
      </div>     
      <div>
        <label className="block mb-1 font-semibold">Tipe of Business</label>
        <input
          type="text"
          className="border rounded px-3 py-2 w-32"
          value={typeOfBusiness}
          onChange={e => setTypeOfBusiness(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block mb-1 font-semibold">Account Type</label>
        <input
          type="text"
          className="border rounded px-3 py-2 w-48"
          value={accountType}
          onChange={e => setAccountType(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block mb-1 font-semibold">Account Category</label>
        <input
          type="text"
          className="border rounded px-3 py-2 w-48"
          value={accountCategory}
          onChange={e => setAccountCategory(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block mb-1 font-semibold">Parent Account</label>
        <input
          type="text"
          className="border rounded px-3 py-2 w-48"
          value={parent}
          onChange={e => setParent(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block mb-1 font-semibold">Aktif</label>
        <input
          type="checkbox"
          checked={isActive}
          onChange={e => setIsActive(e.target.checked)}
          className="w-5 h-5"
        />
      </div>
      <button type="submit" className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800">
        Simpan
      </button>
    </form>
  );
}