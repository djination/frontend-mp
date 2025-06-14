export default function TableAccountAddress({ data }) {
  return (
    <div className="overflow-x-auto bg-white rounded shadow">
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-blue-700 text-white">
            <th className="py-2 px-4 border border-gray-300">ID</th>
            <th className="py-2 px-4 border border-gray-300">Account Name</th>
            <th className="py-2 px-4 border border-gray-300">Address 1</th>
            <th className="py-2 px-4 border border-gray-300">Address 2</th>
            <th className="py-2 px-4 border border-gray-300">Sub District</th>
            <th className="py-2 px-4 border border-gray-300">District</th>
            <th className="py-2 px-4 border border-gray-300">City</th>
            <th className="py-2 px-4 border border-gray-300">Province</th>
            <th className="py-2 px-4 border border-gray-300">Postal Code</th>
            <th className="py-2 px-4 border border-gray-300">Country</th>
            <th className="py-2 px-4 border border-gray-300">Latitude</th>
            <th className="py-2 px-4 border border-gray-300">Longitude</th>
            <th className="py-2 px-4 border border-gray-300">Aktif</th>
          </tr>
        </thead>
        <tbody>
          {data.map(acc => (
            <tr key={acc.id} className="hover:bg-blue-50">
              <td className="py-2 px-4 border border-gray-300">{acc.id}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.acc_name}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.address1}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.address2}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.subdistrict}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.district}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.city}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.province}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.postalcode}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.country}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.latitude}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.longitude}</td>
              <td className="py-2 px-4 border border-gray-300">{acc.is_active ? "Ya" : "Tidak"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}