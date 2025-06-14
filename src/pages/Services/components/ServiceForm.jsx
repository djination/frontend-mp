import React, { useState, useEffect } from 'react';

const ServiceForm = ({ service, onSubmit, onCancel, allServices }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [parentId, setParentId] = useState('');

  useEffect(() => {
    if (service) {
      setName(service.name);
      setType(service.type || '');
      setParentId(service.parentId || '');
    } else {
      setName('');
      setType('');
      setParentId('');
    }
  }, [service]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, type, parentId: parentId || null });
  };

  const getAvailableParents = (services, currentServiceId) => {
    const filteredServices = services.filter(s => s.id !== currentServiceId);

    const removeChildren = (nodes, parentIdToRemove) => {
      return nodes.filter(node => {
        if (node.id === parentIdToRemove) {
          return false;
        }
        if (node.children && node.children.length > 0) {
          node.children = removeChildren(node.children, parentIdToRemove);
        }
        return true;
      });
    };

    if (currentServiceId) {
      // This recursive function now needs to be able to access the whole tree, not just a flat list.
      // For now, we will just filter out the current service itself to prevent self-parenting.
      // A more complex tree-aware filtering would be needed for children exclusion.
      return filteredServices;
    }
    return filteredServices;
  };

  // Flat list of services for the dropdown, to simplify parent selection logic for now
  // We will rely on the backend's tree structure for display, but form selection is flat.
  const flatServices = (services, level = 0) => {
    let list = [];
    services.forEach(s => {
      list.push({ ...s, level });
      if (s.children && s.children.length > 0) {
        list = list.concat(flatServices(s.children, level + 1));
      }
    });
    return list;
  };

  const availableParents = flatServices(allServices.filter(service => !service.parentId)); // Only top-level for now

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl mb-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">{service ? 'Edit Service' : 'Add New Service'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="name">
            Service Name:
          </label>
          <input
            type="text"
            id="name"
            className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Enter service name"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="type">
            Service Type:
          </label>
          <input
            type="text"
            id="type"
            className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="e.g., E-Wallet, Domestic"
          />
        </div>
      </div>
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="parentId">
          Parent Service:
        </label>
        <select
          id="parentId"
          className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out bg-white appearance-none pr-8"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
        >
          <option value="">-- No Parent --</option>
          {availableParents.map((s) => (
            <option key={s.id} value={s.id}>
              {'\u00A0\u00A0' .repeat(s.level)} {s.type}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition duration-200 ease-in-out"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 ease-in-out"
        >
          {service ? 'Update Service' : 'Add Service'}
        </button>
      </div>
    </form>
  );
};

export default ServiceForm; 