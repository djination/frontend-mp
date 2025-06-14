import React from 'react';

const ServiceTree = ({ services, onEdit, onDelete }) => {
  const renderServiceNode = (service) => (
    <li key={service.id} className="relative mb-4 last:mb-0 ml-6">
      {/* Vertical line for hierarchy */}
      <div className="absolute left-[-1.5rem] top-0 h-full w-0.5 bg-gray-300 rounded"></div>
      {/* Horizontal line connecting to parent */}
      <div className="absolute left-[-1.5rem] top-4 w-6 h-0.5 bg-gray-300"></div>

      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800 text-lg">{service.name}</span>
          {service.type && <span className="text-sm text-gray-500">Type: {service.type}</span>}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(service)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-1.5 px-3 rounded-md transition duration-200 ease-in-out"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(service.id)}
            className="bg-red-500 hover:bg-red-600 text-white text-sm py-1.5 px-3 rounded-md transition duration-200 ease-in-out"
          >
            Delete
          </button>
        </div>
      </div>
      {service.children && service.children.length > 0 && (
        <ul className="mt-4 pl-0 list-none">
          {service.children.map(renderServiceNode)}
        </ul>
      )}
    </li>
  );

  return (
    <ul className="list-none p-0">
      {services.map(renderServiceNode)}
    </ul>
  );
};

export default ServiceTree; 