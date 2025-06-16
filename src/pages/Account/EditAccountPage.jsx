import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Spin, message } from 'antd';
import AccountForm from './components/AccountForm';
import { getAccountById } from '../../api/accountApi';

const EditAccount = () => {
  const { id } = useParams();
  const [account, setAccount] = useState(null); // Removed TypeScript annotation
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchAccount();
    }
  }, [id]);

  const fetchAccount = async () => {
    try {
      setLoading(true);
      const response = await getAccountById(id);
      if (response && response.data) {
        setAccount(response.data);
      } else {
        message.error('No account data received');
      }
    } catch (error) {
      message.error('Failed to fetch account details');
      console.error('Error fetching account:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center p-4">
        <h2 className="text-xl text-red-500">Account not found</h2>
        <p>The requested account could not be loaded.</p>
      </div>
    );
  }

  return <AccountForm isEdit={true} initialValues={account} />;
};

export default EditAccount;