export default function Table({ data }) {
  return (
    <div className="overflow-x-auto bg-white rounded shadow">
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-blue-700 text-white">
            <th className="py-2 px-4 border border-gray-300">ID</th>
            <th className="py-2 px-4 border border-gray-300">Name</th>
            <th className="py-2 px-4 border border-gray-300">Industry</th>
            <th className="py-2 px-4 border border-gray-300">Type of Business</th>
            <th className="py-2 px-4 border border-gray-300">Type of Business Desc</th>
            <th className="py-2 px-4 border border-gray-300">Account Type</th>
            <th className="py-2 px-4 border border-gray-300">Account Category</th>
            <th className="py-2 px-4 border border-gray-300">Parent Name</th>
            <th className="py-2 px-4 border border-gray-300">Aktif</th>
          </tr>
        </thead>
        <tbody>
          {data.map(acc => (
            <tr key={acc.id} className="hover:bg-blue-50">
              <td className="py-2 px-4 border border-gray-300">{acc.id}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.name}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.industry}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.type_of_business}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.type_of_business_desc}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.account_type}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.account_category}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.parent}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.is_active ? "Ya" : "Tidak"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}