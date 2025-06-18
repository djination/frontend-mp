// src/pages/SettlementMethod/components/MethodTable.jsx
import React from 'react';

const MethodTable = ({ methods = [], onEdit, onDelete }) => {
  if (!methods.length) {
    return <div className="no-data">No methods found.</div>;
  }

  return (
    <table className="method-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Type</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {methods.map((method) => (
          <tr key={method.id}>
            <td>{method.name}</td>
            <td>{method.description || '-'}</td>
            <td>{method.type || '-'}</td>
            <td className="actions">
              <button 
                className="icon-button edit"
                onClick={() => onEdit(method)}
                title="Edit"
              >
                ✏️
              </button>
              <button
                className="icon-button delete"
                onClick={() => onDelete(method.id)}
                title="Delete"
              >
                🗑️
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default MethodTable;