import React, { useState, useEffect } from "react";
import { Table, Button, Space, message, Dropdown, Menu, Spin, Card, Modal, Switch, Alert } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, DownOutlined, ExclamationCircleOutlined, ApiOutlined } from "@ant-design/icons";
import {
  getMachines,
  deleteMachine,
  getGatewayVendors,
  getPjpurVendors,
  getSupplierVendors,
  getMaintenanceVendors,
  getBranches
} from "../../api/machineApi";
import MachineModal from './MachineModal';

const MachineListPage = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  const [vendorFilters, setVendorFilters] = useState({
    gateway: [],
    pjpur: [],
    supplier: [],
    maintenance: []
  });
  
  const [branches, setBranches] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  
  // Backend-ext integration state
  const [useBackendExt, setUseBackendExt] = useState(false);
  const [backendExtConfigId, setBackendExtConfigId] = useState('');

  useEffect(() => {
    fetchMachines();
    fetchVendorsAndSetFilters();
    fetchBranches();
  }, []);

  // Re-fetch data when backend-ext toggle changes
  useEffect(() => {
    if (useBackendExt && backendExtConfigId) {
      machineApiWithBackendExt.setConfigId(backendExtConfigId);
    }
    
    // Re-fetch all data when switching between APIs
    fetchMachines();
    fetchVendorsAndSetFilters();
    fetchBranches();
  }, [useBackendExt, backendExtConfigId]);

  const fetchMachines = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      let response;
      
      if (useBackendExt) {
        console.log("🔄 Fetching machines via backend-ext...");
        response = await machineApiWithBackendExt.getMachines(page, pageSize);
      } else {
        console.log("🔄 Fetching machines via direct API...");
        response = await getMachines(page, pageSize);
      }
      
      console.log("Machine data received:", response);
      
      if (response && response.data) {
        setMachines(response.data);
        setPagination({
          current: page,
          pageSize,
          total: response.pagination?.total || response.total || 0,
        });
      } else {
        setMachines([]);
        setPagination({ current: 1, pageSize: 10, total: 0 });
      }
    } catch (error) {
      console.error("Failed to fetch machines:", error);
      message.error(`Failed to fetch machine data ${useBackendExt ? 'via backend-ext' : 'via direct API'}`);
      setMachines([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorsAndSetFilters = async () => {
    try {
      console.log("Fetching vendor data for filters...");
      
      let gatewayResult, pjpurResult, supplierResult, maintenanceResult;
      
      if (useBackendExt) {
        console.log("🔄 Fetching vendors via backend-ext...");
        [gatewayResult, pjpurResult, supplierResult, maintenanceResult] = await Promise.all([
          machineApiWithBackendExt.getGatewayVendors(),
          machineApiWithBackendExt.getPjpurVendors(),
          machineApiWithBackendExt.getSupplierVendors(),
          machineApiWithBackendExt.getMaintenanceVendors()
        ]);
      } else {
        console.log("🔄 Fetching vendors via direct API...");
        [gatewayResult, pjpurResult, supplierResult, maintenanceResult] = await Promise.all([
          getGatewayVendors(),
          getPjpurVendors(),
          getSupplierVendors(),
          getMaintenanceVendors()
        ]);
      }
      
      console.log("Vendor filter results:", {
        gateway: gatewayResult,
        pjpur: pjpurResult,
        supplier: supplierResult,
        maintenance: maintenanceResult
      });
      
      const processVendorData = (result, type) => {
        if (!result) return [];
        
        let vendors = [];
        if (Array.isArray(result)) {
          vendors = result;
        } else if (result.data && Array.isArray(result.data)) {
          vendors = result.data;
        } else {
          console.warn(`Invalid ${type} vendor data format:`, result);
          return [];
        }
        
        return vendors.map(vendor => ({
          text: vendor.name || vendor.vendor_name || `${type} ${vendor.id}`,
          value: vendor.id
        }));
      };

      setVendorFilters({
        gateway: processVendorData(gatewayResult, "gateway"),
        pjpur: processVendorData(pjpurResult, "pjpur"),
        supplier: processVendorData(supplierResult, "supplier"),
        maintenance: processVendorData(maintenanceResult, "maintenance")
      });
      
      console.log("Vendor filters set successfully");
    } catch (error) {
      console.error("Failed to fetch vendor data for filters:", error);
      message.warning("Failed to load vendor filter options");
    }
  };

  const fetchBranches = async () => {
    try {
      let response;
      
      if (useBackendExt) {
        console.log("🔄 Fetching branches via backend-ext...");
        response = await machineApiWithBackendExt.getBranches();
      } else {
        console.log("🔄 Fetching branches via direct API...");
        response = await getBranches();
      }
      
      console.log("Branch data received:", response);
      
      let branchList = [];
      if (Array.isArray(response)) {
        branchList = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        branchList = response.data;
      }
      
      setBranches(branchList);
      console.log("Branches set:", branchList.length);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      message.warning(`Failed to load branch data ${useBackendExt ? 'via backend-ext' : 'via direct API'}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      if (useBackendExt) {
        console.log("🗑️ Deleting machine via backend-ext...");
        await machineApiWithBackendExt.deleteMachine(id);
      } else {
        console.log("🗑️ Deleting machine via direct API...");
        await deleteMachine(id);
      }
      
      message.success("Machine deleted successfully");
      fetchMachines(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error("Failed to delete machine:", error);
      message.error("Failed to delete machine");
    }
  };

  const handleTableChange = (paginationInfo) => {
    fetchMachines(paginationInfo.current, paginationInfo.pageSize);
  };

  // Modal functions
  const handleModalSuccess = () => {
    fetchMachines(pagination.current, pagination.pageSize);
  };

  const handleEdit = (machine) => {
    setEditingMachine(machine);
    setModalVisible(true);
  };

  const handleDeleteConfirm = (machine) => {
    Modal.confirm({
      title: 'Delete Machine',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete machine "${machine.name}"?`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => handleDelete(machine.id),
    });
  };

  const columns = [
    {
      title: "Machine Code",
      dataIndex: "code",
      key: "code",
      width: 120,
    },
    {
      title: "Machine Name",
      dataIndex: "name",
      key: "name",
      width: 200,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Gateway Vendor",
      key: "gateway_vendor",
      width: 180,
      render: (_, record) => record.gateway?.name || '-',
      filters: vendorFilters.gateway,
      onFilter: (value, record) => record.gateway?.id === value,
    },
    {
      title: "PJPUR Vendor",
      key: "pjpur_vendor",
      width: 180,
      render: (_, record) => record.pjpur?.name || '-',
      filters: vendorFilters.pjpur,
      onFilter: (value, record) => record.pjpur?.id === value,
    },
    {
      title: "Supplier",
      key: "supplier_vendor",
      width: 180,
      render: (_, record) => record.supplier?.name || '-',
      filters: vendorFilters.supplier,
      onFilter: (value, record) => record.supplier?.id === value,
    },
    {
      title: "Branch",
      key: "branch",
      width: 180,
      render: (_, record) => record.branch?.name || '-',
    },
    {
      title: "Service Location",
      key: "service_location",
      width: 180,
      render: (_, record) => record.service_location?.name || '-',
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Edit"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteConfirm(record)}
            title="Delete"
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* Backend-Ext Integration Alert */}
      {useBackendExt && (
        <Alert
          message={
            <Space>
              <ApiOutlined />
              <span>Using Backend-Ext API Integration</span>
              {backendExtConfigId && <span style={{color: '#52c41a'}}>Config: {backendExtConfigId.substring(0, 8)}...</span>}
            </Space>
          }
          description="All API requests are going through backend-ext system with automatic logging"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Card>
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Machine Management</h2>
          
          <Space>
            {/* Backend-Ext Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>Backend-Ext:</span>
              <Switch 
                checked={useBackendExt}
                onChange={(checked) => {
                  setUseBackendExt(checked);
                  if (checked && !backendExtConfigId) {
                    // Prompt for config ID if not set
                    const configId = prompt('Enter Backend-Ext Config ID:', 'machine-api-config');
                    if (configId) {
                      setBackendExtConfigId(configId);
                    } else {
                      setUseBackendExt(false);
                    }
                  }
                }}
                size="small"
              />
            </div>
            
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingMachine(null);
                setModalVisible(true);
              }}
            >
              Add Machine
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={machines}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1500 }}
        />
      </Card>
      
      <MachineModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSuccess={handleModalSuccess}
        editingMachine={editingMachine}
        vendorFilters={vendorFilters}
        branches={branches}
        useBackendExt={useBackendExt}
      />
    </div>
  );
};

export default MachineListPage;
