import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, Space, 
  message, Select, Switch, Card, Tree, Tooltip 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import { getMenus, createMenu, updateMenu, deleteMenu, getMenuTree } from '../../api/menuApi';
import { refreshPermissionsCache } from '../../api/permissionApi';
import IconSelector from '../../components/IconSelector';

const MenuManagementPage = () => {
  const [menus, setMenus] = useState([]);
  const [menuTree, setMenuTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm] = Form.useForm();
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'tree'

  useEffect(() => {
    fetchMenus();
    fetchMenuTree();
  }, []);

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const response = await getMenus();
      // Extract the actual array from the response
      setMenus(response.data?.data || []);
    } catch (error) {
      message.error('Failed to fetch menus');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuTree = async () => {
    try {
      const response = await getMenuTree();
      // Extract the actual array from the response
      setMenuTree(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch menu tree:', error);
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    editForm.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    editForm.setFieldsValue({
      name: record.name,
      path: record.path,
      icon: record.icon,
      parentId: record.parentId,
      displayOrder: record.displayOrder,
      description: record.description,
      isActive: record.isActive
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteMenu(id);
      message.success('Menu deleted successfully');
      
      // Refresh permissions cache after menu deletion
      try {
        await refreshPermissionsCache();
      } catch (error) {
        console.log('Failed to refresh permissions cache, but menu was deleted successfully');
      }
      
      fetchMenus();
      fetchMenuTree();
    } catch (error) {
      message.error('Failed to delete menu');
      console.error(error);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      
      // Ensure proper types for all fields
      const formData = {
        name: values.name,
        path: values.path,
        icon: values.icon || null,
        description: values.description || null,
        parentId: values.parentId || null,
        displayOrder: values.displayOrder !== undefined ? Number(values.displayOrder) : 0,
        isActive: values.isActive !== undefined ? values.isActive : true
      };
      
      console.log('Submitting form data:', formData);
      
      if (editingRecord) {
        await updateMenu(editingRecord.id, formData);
        message.success('Menu updated successfully');
        
        // Refresh permissions cache after menu update
        try {
          await refreshPermissionsCache();
        } catch (error) {
          console.log('Failed to refresh permissions cache, but menu was updated successfully');
        }
      } else {
        await createMenu(formData);
        message.success('Menu created successfully');
        
        // Refresh permissions cache after menu creation
        try {
          await refreshPermissionsCache();
        } catch (error) {
          console.log('Failed to refresh permissions cache, but menu was created successfully');
        }
      }
      
      setModalVisible(false);
      editForm.resetFields();
      fetchMenus();
      fetchMenuTree();
    } catch (error) {
      console.error('Form submission error:', error);
      if (error.response?.data?.message) {
        // Show specific validation errors from backend
        message.error(Array.isArray(error.response.data.message) 
          ? error.response.data.message[0]
          : error.response.data.message);
      } else {
        message.error('Failed to save menu');
      }
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Path',
      dataIndex: 'path',
      key: 'path',
    },
    {
      title: 'Icon',
      dataIndex: 'icon',
      key: 'icon',
      render: (icon) => icon || '-',
    },
    {
      title: 'Parent',
      dataIndex: 'parentName',
      key: 'parentName',
      render: (_, record) => {
        const parent = menus.find(m => m.id === record.parentId);
        return parent ? parent.name : '-';
      },
    },
    {
      title: 'Order',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      sorter: (a, b) => a.displayOrder - b.displayOrder,
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active) => (
        <span style={{ color: active ? 'green' : 'red' }}>
          {active ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)} 
            size="small" 
          />
          <Button 
            icon={<DeleteOutlined />} 
            danger 
            onClick={() => Modal.confirm({
              title: 'Are you sure you want to delete this menu?',
              icon: <ExclamationCircleOutlined />,
              content: 'This action cannot be undone.',
              onOk: () => handleDelete(record.id),
            })} 
            size="small" 
          />
        </Space>
      ),
    },
  ];

  const renderTreeNodes = (data) => {
    return data.map((item) => {
      const title = (
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <span>{item.name} {!item.isActive && <span style={{ color: 'red' }}>(Inactive)</span>}</span>
          <Space>
            <Button 
              icon={<EditOutlined />} 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(item);
              }} 
            />
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                Modal.confirm({
                  title: 'Are you sure you want to delete this menu?',
                  icon: <ExclamationCircleOutlined />,
                  content: 'This action cannot be undone.',
                  onOk: () => handleDelete(item.id),
                });
              }} 
            />
          </Space>
        </div>
      );

      if (item.children && item.children.length > 0) {
        return {
          title,
          key: item.id,
          children: renderTreeNodes(item.children),
        };
      }

      return {
        title,
        key: item.id,
        isLeaf: true,
      };
    });
  };

  return (
    <Card title="Menu Management">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
        >
          Add Menu
        </Button>
        <Space>
          <Button 
            type={viewMode === 'table' ? 'primary' : 'default'} 
            onClick={() => setViewMode('table')}
          >
            Table View
          </Button>
          <Button 
            type={viewMode === 'tree' ? 'primary' : 'default'} 
            onClick={() => setViewMode('tree')}
          >
            Tree View
          </Button>
        </Space>
      </div>

      {viewMode === 'table' ? (
        <Table 
          columns={columns} 
          dataSource={menus} 
          rowKey="id" 
          loading={loading}
        />
      ) : (
        <Tree
          showLine={{ showLeafIcon: false }}
          treeData={renderTreeNodes(menuTree)}
        />
      )}

      <Modal
        title={editingRecord ? 'Edit Menu' : 'Add Menu'}
        open={modalVisible}
        onOk={handleModalSubmit}
        onCancel={handleModalCancel}
        width={700}
      >
        <Form
          form={editForm}
          layout="vertical"
          initialValues={{
          isActive: true,
          displayOrder: 0,
          ...editingRecord
        }}
        >
          <Form.Item
            name="name"
            label="Menu Name"
            rules={[{ required: true, message: 'Please enter menu name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="path"
            label="Path"
            rules={[{ required: true, message: 'Please enter path' }]}
          >
            <Input placeholder="/example-path" />
          </Form.Item>

          <Form.Item
            name="icon"
            label="Icon"
          >
            <IconSelector />
          </Form.Item>

          <Form.Item
            name="parentId"
            label="Parent Menu"
          >
            <Select
              allowClear
              placeholder="Select parent menu"
              showSearch
              optionFilterProp="children"
            >
              {menus.map(menu => (
                <Select.Option 
                  key={menu.id} 
                  value={menu.id}
                  disabled={editingRecord && editingRecord.id === menu.id}
                >
                  {menu.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="displayOrder"
            label="Display Order"
            rules={[{ pattern: /^[0-9]*$/, message: 'Please enter a valid number' }]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default MenuManagementPage;