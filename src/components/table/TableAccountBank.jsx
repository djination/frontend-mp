export default function TableAccountBank({ data }) {
  return (
    <div className="overflow-x-auto bg-white rounded shadow">
      <table className="min-w-full">
        <thead>
          <tr className="bg-blue-700 text-white">
            <th className="py-2 px-4 border border-gray-300">ID</th>
            <th className="py-2 px-4 border border-gray-300">Account Name</th>
            <th className="py-2 px-4 border border-gray-300">Bank Name</th>
            <th className="py-2 px-4 border border-gray-300">Bank Account No</th>
            <th className="py-2 px-4 border border-gray-300">Bank Category Name</th>
            <th className="py-2 px-4 border border-gray-300">Aktif</th>
          </tr>
        </thead>
        <tbody>
          {data.map(acc => (
            <tr key={acc.id} className="border-b hover:bg-blue-50">
              <td className="py-2 px-4 border border-gray-300">{acc.id}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.account_name}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.bank_name}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.bank_account_no}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.bank_category_name}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.is_active ? "Ya" : "Tidak"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}