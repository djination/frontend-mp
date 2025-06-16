import React from 'react';
import { Card, Alert } from 'antd';
import AccountForm from './components/AccountForm';

const AddAccount = () => {
  console.log("Rendering AddAccount component");
  
  return (
    <div className="p-4">
      <Card title="Add New Account">
        {/* Fallback jika ada masalah dengan AccountForm */}
        {!AccountForm ? (
          <Alert
            message="Component Error"
            description="Could not load the Account Form component"
            type="error"
          />
        ) : (
          <AccountForm isEdit={false} />
        )}
      </Card>
    </div>
  );
};


export default AddAccount;