import React, { useState, useEffect } from 'react';
import {
  Table, message, Tag
} from 'antd';
import { getMasterMachines } from '../../../api/masterMachineApi';
import PropTypes from 'prop-types';

const AccountMachineForm = ({
  machines = [],
  onChange,
  accountId,
  isEdit,
  accountData = null
}) => {
  const [localMachines, setLocalMachines] = useState(machines || []);

  // Sync localMachines with props
  useEffect(() => {
    setLocalMachines(machines || []);
  }, [machines]);

  // Fetch machines from API when account has id
  useEffect(() => {
    if (isEdit && accountId) {
      fetchMachines();
    }
  }, [isEdit, accountId]);

  const fetchMachines = async () => {
    if (!accountId) return;

    try {
      const params = { account_id: accountId };
      
      const response = await getMasterMachines(params);
      const machinesData = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data || [];
      
      setLocalMachines(machinesData);
      onChange(machinesData);
    } catch (error) {
      console.error('Error fetching machines:', error);
      message.error('Failed to fetch machines');
    }
  };


  const columns = [
    {
      title: 'Machine Type',
      dataIndex: 'machine_type',
      key: 'machine_type',
      render: (type) => (
        <Tag color={type === 'dedicated' ? 'red' : 'green'}>
          {type === 'dedicated' ? 'Dedicated' : 'Non-Dedicated'}
        </Tag>
      ),
    },
    {
      title: 'Machine Code',
      dataIndex: ['data', 'code'],
      key: 'machine_code',
      render: (code) => code || 'N/A',
    },
    {
      title: 'Machine Name',
      dataIndex: ['data', 'name'],
      key: 'machine_name',
      render: (name) => name || 'N/A',
    },
    {
      title: 'Account',
      dataIndex: ['account', 'name'],
      key: 'account',
      render: (_, record) => record.account?.name || record.account_id || 'N/A',
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={localMachines}
        rowKey={record => record.id || record.tempId || Math.random()}
        pagination={false}
      />
    </div>
  );
};

AccountMachineForm.propTypes = {
  machines: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  accountId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isEdit: PropTypes.bool.isRequired,
  accountData: PropTypes.object,
};

export default AccountMachineForm;

