import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Form,
  Input,
  Select,
  Space,
  Card,
  DatePicker,
  message,
  Row,
  Col,
} from 'antd';
import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getTransactionDeposits, syncFromExternalApi } from '../../api/transactionDepositApi';
import { getMachines } from '../../api/machineApi';

const { RangePicker } = DatePicker;

const TransactionDepositReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [machines, setMachines] = useState([]);
  const [form] = Form.useForm();
  
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Fetch machines for dropdown
  useEffect(() => {
    fetchMachines();
  }, []);

  // Fetch transactions on mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchMachines = async () => {
    try {
      // Fetch all machines for dropdown
      const response = await getMachines(1, 1000);
      if (response?.data) {
        setMachines(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch machines:', error);
      message.warning('Failed to load machines list');
    }
  };

  const fetchTransactions = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: params.page || pagination.current,
        limit: params.limit || pagination.pageSize,
        ...params,
      };

      // Remove undefined/null values
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined || queryParams[key] === null || queryParams[key] === '') {
          delete queryParams[key];
        }
      });

      const response = await getTransactionDeposits(queryParams);

      // Handle response structure from backend
      // Backend returns: { success: true, data: { data: [...], meta: {...} } }
      let transactionsData = [];
      let metaData = null;

      if (response) {
        // Response from API is already unwrapped by axiosInstance (response.data)
        // So response is: { success: true, data: { data: [...], meta: {...} } }
        
        if (response.success && response.data) {
          // Standard backend response structure
          if (Array.isArray(response.data.data)) {
            transactionsData = response.data.data;
            metaData = response.data.meta;
          } else if (Array.isArray(response.data)) {
            // Fallback: direct array in data
            transactionsData = response.data;
          }
        } else if (response.data && Array.isArray(response.data)) {
          // Direct array response (if interceptor is bypassed)
          transactionsData = response.data;
          metaData = response.meta;
        } else if (Array.isArray(response)) {
          // Direct array response
          transactionsData = response;
        }
      }

      // Ensure transactionsData is always an array
      const safeTransactions = Array.isArray(transactionsData) ? transactionsData : [];
      setTransactions(safeTransactions);
      
      if (metaData) {
        setPagination(prev => ({
          ...prev,
          total: metaData.total || 0,
          current: metaData.page || prev.current,
          pageSize: metaData.limit || prev.pageSize,
        }));
      } else {
        // Update total based on array length if no meta
        setPagination(prev => ({
          ...prev,
          total: safeTransactions.length,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      message.error('Failed to fetch transaction data');
      setTransactions([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    const searchParams = {};

    // Machine filter
    if (values.machine_id) {
      searchParams.machine_id = values.machine_id;
    }

    // Date range filter
    if (values.date_range && values.date_range.length === 2) {
      searchParams.start_date = values.date_range[0].format('YYYY-MM-DD');
      searchParams.end_date = values.date_range[1].format('YYYY-MM-DD');
    }

    // Status filter
    if (values.transaction_status) {
      searchParams.transaction_status = values.transaction_status;
    }

    // Reset to first page
    setPagination(prev => ({ ...prev, current: 1 }));
    
    // Fetch with search params
    fetchTransactions(searchParams);
  };

  const handleReset = () => {
    form.resetFields();
    setPagination({ current: 1, pageSize: 10, total: 0 });
    fetchTransactions();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      message.loading({ content: 'Syncing from external API...', key: 'sync', duration: 0 });
      
      const result = await syncFromExternalApi();
      
      if (result.success) {
        message.success({
          content: `Sync completed! ${result.summary.created} created, ${result.summary.updated} updated, ${result.summary.errors} errors`,
          key: 'sync',
          duration: 5,
        });
        
        // Refresh data after sync
        fetchTransactions();
      } else {
        message.error({ content: 'Sync failed', key: 'sync' });
      }
    } catch (error) {
      console.error('Sync error:', error);
      message.error({
        content: error.response?.data?.message || 'Failed to sync from external API',
        key: 'sync',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleTableChange = (newPagination) => {
    const searchValues = form.getFieldsValue();
    const searchParams = {};

    if (searchValues.machine_id) {
      searchParams.machine_id = searchValues.machine_id;
    }

    if (searchValues.date_range && searchValues.date_range.length === 2) {
      searchParams.start_date = searchValues.date_range[0].format('YYYY-MM-DD');
      searchParams.end_date = searchValues.date_range[1].format('YYYY-MM-DD');
    }

    if (searchValues.transaction_status) {
      searchParams.transaction_status = searchValues.transaction_status;
    }

    setPagination({
      ...newPagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });

    fetchTransactions({
      ...searchParams,
      page: newPagination.current,
      limit: newPagination.pageSize,
    });
  };

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 150,
    },
    {
      title: 'CDM Trx No',
      dataIndex: 'cdm_trx_no',
      key: 'cdm_trx_no',
      width: 180,
    },
    {
      title: 'Machine',
      key: 'machine',
      width: 150,
      render: (_, record) => {
        if (record.machine && typeof record.machine === 'object') {
          return record.machine.name || record.machine.code || '-';
        }
        return record.machine_info || '-';
      },
    },
    {
      title: 'Customer',
      key: 'customer',
      width: 150,
      render: (_, record) => {
        if (record.customer && typeof record.customer === 'object') {
          return record.customer.name || '-';
        }
        return '-';
      },
    },
    {
      title: 'Total Deposit',
      dataIndex: 'total_deposit',
      key: 'total_deposit',
      width: 120,
      align: 'right',
      render: (value) => {
        return value ? new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(value) : '-';
      },
    },
    {
      title: 'Charging Fee',
      dataIndex: 'charging_fee',
      key: 'charging_fee',
      width: 120,
      align: 'right',
      render: (value) => {
        return value ? new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(value) : '-';
      },
    },
    {
      title: 'Total Transfer',
      dataIndex: 'total_transfer',
      key: 'total_transfer',
      width: 120,
      align: 'right',
      render: (value) => {
        return value ? new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(value) : '-';
      },
    },
    {
      title: 'Status',
      dataIndex: 'transaction_status',
      key: 'transaction_status',
      width: 100,
      render: (status) => {
        const colorMap = {
          SUCCESS: 'green',
          FAILED: 'red',
          PENDING: 'orange',
        };
        return (
          <span style={{ color: colorMap[status] || 'default' }}>
            {status || '-'}
          </span>
        );
      },
    },
    {
      title: 'Transaction Date',
      dataIndex: 'cdm_trx_date',
      key: 'cdm_trx_date',
      width: 120,
      render: (date) => {
        return date ? dayjs(date).format('YYYY-MM-DD') : '-';
      },
    },
    {
      title: 'Transaction Time',
      dataIndex: 'cdm_trx_time',
      key: 'cdm_trx_time',
      width: 100,
    },
  ];

  return (
    <div>
      <Card title="Report Transaksi Masin">
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleSearch}
          style={{ marginBottom: 20 }}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="machine_id" label="Nama Mesin">
                <Select
                  placeholder="Pilih mesin"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {machines.map(machine => (
                    <Select.Option key={machine.id} value={machine.id} label={machine.name}>
                      {machine.name} ({machine.code})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item name="date_range" label="Tanggal Transaksi">
                <RangePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>

            <Col span={4}>
              <Form.Item name="transaction_status" label="Status">
                <Select placeholder="Pilih status" allowClear>
                  <Select.Option value="SUCCESS">SUCCESS</Select.Option>
                  <Select.Option value="FAILED">FAILED</Select.Option>
                  <Select.Option value="PENDING">PENDING</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    htmlType="submit"
                  >
                    Search
                  </Button>
                  <Button onClick={handleReset}>Reset</Button>
                  <Button
                    type="default"
                    icon={<SyncOutlined />}
                    onClick={handleSync}
                    loading={syncing}
                  >
                    Sync dari External API
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Table
          columns={columns}
          dataSource={Array.isArray(transactions) ? transactions : []}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default TransactionDepositReportPage;

