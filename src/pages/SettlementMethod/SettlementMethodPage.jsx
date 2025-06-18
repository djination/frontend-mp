// src/pages/SettlementMethod/index.jsx
import React, { useState, useEffect } from 'react';
import { useSettlementMethods } from './hooks/useSettlementMethods';
import MethodTable from './components/MethodTable';
import MethodForm from './components/MethodForm';
import './styles.css';

const TAB_CONFIG = [
  { key: 'settlement', label: 'Settlement Methods', icon: '💰' },
  { key: 'cashDeposit', label: 'Cash Deposit', icon: '💳' },
  { key: 'nonCash', label: 'Non-Cash', icon: '💱' },
  { key: 'sendMoney', label: 'Send Money', icon: '💸' },
  { key: 'sendGoods', label: 'Send Goods', icon: '🚚' }
];

const SettlementMethodPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentMethod, setCurrentMethod] = useState(null);
  const { 
    methods, 
    loading, 
    error,
    fetchAllMethods, 
    createMethod, 
    updateMethod, 
    removeMethod 
  } = useSettlementMethods();

  useEffect(() => {
    fetchAllMethods();
  }, [fetchAllMethods]);

  const handleTabChange = (index) => {
    setActiveTab(index);
  };

  const handleOpenForm = (method = null) => {
    setCurrentMethod(method);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setCurrentMethod(null);
  };

  const handleSubmit = async (data) => {
    const type = TAB_CONFIG[activeTab].key;
    const isEdit = !!currentMethod;
    
    try {
      if (isEdit) {
        await updateMethod(type, currentMethod.id, data);
      } else {
        await createMethod(type, data);
      }
      handleCloseForm();
    } catch (error) {
      alert(error.message || 'An error occurred');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this method?')) {
      const type = TAB_CONFIG[activeTab].key;
      await removeMethod(type, id);
    }
  };

  const currentTab = TAB_CONFIG[activeTab]?.key;
  const currentMethods = methods[currentTab] || [];

  return (
    <div className="settlement-container">
      <div className="tabs">
        {TAB_CONFIG.map((tab, index) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === index ? 'active' : ''}`}
            onClick={() => handleTabChange(index)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="content">
        <div className="header">
          <h2>{TAB_CONFIG[activeTab]?.label}</h2>
          <button 
            className="add-button"
            onClick={() => handleOpenForm()}
          >
            + Add {TAB_CONFIG[activeTab]?.label}
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <MethodTable
            methods={currentMethods}
            onEdit={handleOpenForm}
            onDelete={handleDelete}
          />
        )}
      </div>

      {isFormOpen && (
        <MethodForm
          method={currentMethod}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default SettlementMethodPage;