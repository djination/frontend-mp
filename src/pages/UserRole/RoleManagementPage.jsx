import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, Space, message, Card, 
  Tabs, Tree, Checkbox, Row, Col, Collapse, Switch
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  ExclamationCircleOutlined, InfoCircleOutlined 
} from '@ant-design/icons';
import { getRoles, createRole, updateRole, deleteRole } from '../../api/roleApi';
import { getMenuTree } from '../../api/menuApi';
import { getPermissions, getPermissionsWithCache } from '../../api/permissionApi';

const { TabPane } = Tabs;
const { Panel } = Collapse;

const RoleManagementPage = () => {
  const [roles, setRoles] = useState([]);
  const [menuTree, setMenuTree] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedMenus, setSelectedMenus] = useState([]);
  const [checkedPermissions, setCheckedPermissions] = useState({});
  const [editForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');
  const [groupedPermissions, setGroupedPermissions] = useState({});

  const debugPermissionData = () => {
    console.log("Debugging Permission Data:");
    console.log("Total permissions loaded:", permissions.length);
    
    // Group by resource type
    const resourceCounts = {};
    permissions.forEach(p => {
      const resourceType = p.resourceType || 'unknown';
      resourceCounts[resourceType] = (resourceCounts[resourceType] || 0) + 1;
    });
    
    console.log("Resource type counts:", resourceCounts);
    console.log("Currently checked permissions:", Object.keys(checkedPermissions).length);
    
    // Sample of permissions
    if (permissions.length > 0) {
      console.log("Sample permission object:", permissions[0]);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchMenuTree();
    fetchPermissions();
  
    // Debug after permissions load
    setTimeout(debugPermissionData, 2000);
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await getRoles();
      setRoles(response.data);
    } catch (error) {
      message.error('Failed to fetch roles');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuTree = async () => {
    try {
      const response = await getMenuTree();
      // Extract the array from the response
      setMenuTree(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch menu tree:', error);
      setMenuTree([]); // Fallback to empty array on error
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await getPermissionsWithCache();
      console.log('API Response for permissions:', response);
      
      // Fix the data extraction - response is the actual API response object
      const permissionsData = response.data || [];
      console.log('Permissions data:', permissionsData);
      setPermissions(permissionsData);
      
      // Group permissions by resource type
      const grouped = permissionsData.reduce((acc, permission) => {
        const resourceType = permission.resourceType || 'other';
        if (!acc[resourceType]) {
          acc[resourceType] = [];
        }
        acc[resourceType].push(permission);
        return acc;
      }, {});
      
      setGroupedPermissions(grouped);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      setPermissions([]);
      setGroupedPermissions({});
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setSelectedMenus([]);
    setCheckedPermissions({});
    editForm.resetFields();
    setModalVisible(true);
    setActiveTab('1');
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    editForm.setFieldsValue({
      name: record.name,
      description: record.description,
      isActive: record.isActive
    });
    setSelectedMenus(record.menus.map(menu => menu.id));
    
    const permissionObj = {};
    record.permissions.forEach(perm => {
      permissionObj[perm.id] = true;
    });
    setCheckedPermissions(permissionObj);
    
    setModalVisible(true);
    setActiveTab('1');
  };

  const handleDelete = async (id) => {
    try {
      await deleteRole(id);
      message.success('Role deleted successfully');
      fetchRoles();
    } catch (error) {
      message.error('Failed to delete role');
      console.error(error);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      
      const selectedPermissionIds = Object.entries(checkedPermissions)
        .filter(([_, checked]) => checked)
        .map(([id]) => id);

      const roleData = {
        ...values,
        menuIds: selectedMenus,
        permissionIds: selectedPermissionIds,
      };

      if (editingRecord) {
        await updateRole(editingRecord.id, roleData);
        message.success('Role updated successfully');
      } else {
        await createRole(roleData);
        message.success('Role created successfully');
      }
      
      setModalVisible(false);
      fetchRoles();
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      message.error('Failed to save role');
      console.error(error);
    }
  };
  
  // Add this helper function to get a flat list of all menus with their paths
  const getFlatMenuList = (menuItems, parentPath = '') => {
    let flatList = [];
    
    for (const menu of menuItems) {
      const fullPath = parentPath ? `${parentPath}/${menu.path}` : menu.path;
      
      flatList.push({
        id: menu.id,
        name: menu.name,
        path: fullPath
      });
      
      if (menu.children && menu.children.length > 0) {
        flatList = [...flatList, ...getFlatMenuList(menu.children, fullPath)];
      }
    }
    
    return flatList;
  };

  const handleMenuCheck = (checkedKeys) => {
    setSelectedMenus(checkedKeys);

    // Debugging
    console.log("Selected menu keys:", checkedKeys);

    // Auto-select permissions based on selected menus
    const newCheckedPermissions = { ...checkedPermissions };
    
    // Create a mapping of menu paths to resource types
    // Dynamically map menu paths to resource types by extracting the last segment of the path
    const menuToResourceMap = {};
    const buildMenuToResourceMap = (menus) => {
      menus.forEach(menu => {
        if (menu.path) {
          const pathSegments = menu.path.split('/').filter(Boolean);
          if (pathSegments.length > 0) {
            const lastSegment = pathSegments[pathSegments.length - 1];
            // Use singular form if ends with 's'
            const resourceType = lastSegment.endsWith('s')
              ? lastSegment.slice(0, -1)
              : lastSegment;
            menuToResourceMap[menu.path] = resourceType;
            
            // Debug log
            console.log(`Mapping path ${menu.path} to resource type ${resourceType}`);
          }
        }
        if (menu.children && menu.children.length > 0) {
          buildMenuToResourceMap(menu.children);
        }
      });
    };

    buildMenuToResourceMap(menuTree);
    console.log("Menu to resource map:", menuToResourceMap);
  
    // Add hardcoded mappings for common menu paths
    const commonMenuMappings = {
      '/users': 'user',
      '/roles': 'role',
      '/menus': 'menu',
      '/permissions': 'permission',
      '/dashboard': 'dashboard',
      '/settings': 'setting'
    };

    // Find all selected menu objects
    const findSelectedMenuObjects = (menuItems, selectedKeys) => {
      let selected = [];
      
      for (const menuItem of menuItems) {
        if (selectedKeys.includes(menuItem.id)) {
          selected.push(menuItem);
        }
        
        if (menuItem.children && menuItem.children.length > 0) {
          selected = [...selected, ...findSelectedMenuObjects(menuItem.children, selectedKeys)];
        }
      }
      
      return selected;
    };
    
    const selectedMenuObjects = findSelectedMenuObjects(menuTree, checkedKeys);
    console.log("Selected menu objects:", selectedMenuObjects);
    
    // Determine which resource types should have permissions checked
    const resourceTypesToCheck = selectedMenuObjects.reduce((types, menu) => {
      // Extract resource type from menu path
      const path = menu.path;
      
      // Look for exact matches first
      if (menuToResourceMap[path]) {
        types.add(menuToResourceMap[path]);
      }
      
      // For nested paths like /settings/users, extract the last part
      const pathSegments = path.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        const lastSegment = pathSegments[pathSegments.length - 1];
        
        // Check for singular form (users -> user)
        const singularForm = lastSegment.endsWith('s') 
          ? lastSegment.substring(0, lastSegment.length - 1) 
          : lastSegment;
          
        types.add(singularForm);

        // Also add the plural form to be safe
        if (!lastSegment.endsWith('s')) {
          types.add(lastSegment + 's');
        }
        
        // Add lowercase and uppercase versions
        types.add(singularForm.toLowerCase());
        types.add(lastSegment.toLowerCase());
      }
      
      return types;
    }, new Set());
    
    // Add more debug logs
    console.log("Resource types to check:", Array.from(resourceTypesToCheck));
    console.log("Available permissions:", permissions.map(p => ({ 
      id: p.id.substring(0, 8), 
      name: p.name, 
      resourceType: p.resourceType,
      actionType: p.actionType
    })));
    
    // Update permissions based on selected menus
    let autoSelectedCount = 0;

    // Update permissions based on selected menus
    permissions.forEach(permission => {
      if (resourceTypesToCheck.has(permission.resourceType)) {
        newCheckedPermissions[permission.id] = true;
        autoSelectedCount++; // Increment counter properly
      }
    });
    
    console.log(`Auto-selected ${autoSelectedCount} permissions`);
    setCheckedPermissions({...newCheckedPermissions});
  
    // Switch to permissions tab to show the selections
    if (autoSelectedCount > 0) {
      setTimeout(() => {
        setActiveTab('3');
        message.info(`Selected ${autoSelectedCount} permissions based on menu choices`);
      }, 500);
    }
  };

  const handlePermissionCheck = (permissionId) => {
    setCheckedPermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId]
    }));
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active) => (
        <span style={{ color: active ? 'green' : 'red' }}>
          {active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Menus',
      key: 'menus',
      render: (_, record) => `${record.menus?.length || 0} menus assigned`,
    },
    {
      title: 'Permissions',
      key: 'permissions',
      render: (_, record) => `${record.permissions?.length || 0} permissions assigned`,
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
              title: 'Are you sure you want to delete this role?',
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

  return (
    <Card title="Role Management">
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
        >
          Add Role
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={roles} 
        rowKey="id" 
        loading={loading}
      />

      <Modal
        title={editingRecord ? 'Edit Role' : 'Add Role'}
        open={modalVisible}
        onOk={handleModalSubmit}
        onCancel={handleModalCancel}
        width={800}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Basic Info" key="1">
            <Form
              form={editForm}
              layout="vertical"
            >
              <Form.Item
                name="name"
                label="Role Name"
                rules={[{ required: true, message: 'Please enter role name' }]}
              >
                <Input />
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
          </TabPane>
          
          <TabPane tab="Menu Access" key="2">
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: '#888' }}>
                <InfoCircleOutlined style={{ marginRight: 8 }} />
                Selecting a menu will automatically grant the necessary permissions for that section
              </p>
            </div>
            <Tree
              checkable
              checkedKeys={selectedMenus}
              onCheck={handleMenuCheck}
              treeData={Array.isArray(menuTree) ? menuTree.map(menu => ({
                title: menu.name,
                key: menu.id,
                children: menu.children?.map(child => ({
                  title: child.name,
                  key: child.id,
                  children: child.children?.map(grandChild => ({
                    title: grandChild.name,
                    key: grandChild.id
                  }))
                }))
              })) : []}
            />
          </TabPane>
          
          <TabPane tab={`Permissions (${Object.values(checkedPermissions).filter(Boolean).length})`} key="3">
            {/* Tambahkan debug info di sini */}
            <div style={{ marginBottom: 10, padding: 10, background: '#f0f0f0', borderRadius: 4 }}>
              <p><strong>Debug:</strong> {Object.values(checkedPermissions).filter(Boolean).length} permissions selected</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.entries(checkedPermissions)
                  .filter(([_, checked]) => checked)
                  .slice(0, 5)
                  .map(([id]) => (
                    <span key={id} style={{ padding: '2px 6px', background: '#1890ff', color: 'white', borderRadius: 4 }}>
                      {id.substring(0, 8)}
                    </span>
                  ))}
                {Object.values(checkedPermissions).filter(Boolean).length > 5 && '...'}
              </div>
            </div>

            {Object.keys(groupedPermissions).length > 0 ? (
              <Collapse
                items={Object.entries(groupedPermissions).map(([resourceType, perms]) => {
                  // Check if any permissions for this resource type are checked
                  const allChecked = perms.every(p => !!checkedPermissions[p.id]);
                  const someChecked = perms.some(p => !!checkedPermissions[p.id]);
                  const checkedCount = perms.filter(p => !!checkedPermissions[p.id]).length;
                  
                  return {
                    key: resourceType,
                    label: (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span>
                          {resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} Permissions 
                          ({checkedCount}/{perms.length})
                        </span>
                        <Checkbox
                          checked={allChecked}
                          indeterminate={!allChecked && someChecked}
                          onChange={() => {
                            // Toggle all permissions in this group
                            const newCheckedPermissions = { ...checkedPermissions };
                            const newValue = !allChecked;
                            perms.forEach(p => {
                              newCheckedPermissions[p.id] = newValue;
                            });
                            setCheckedPermissions({...newCheckedPermissions});
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          Select All
                        </Checkbox>
                      </div>
                    ),
                    children: (
                      <Row gutter={[16, 16]}>
                        {perms.map(permission => (
                          <Col span={12} key={permission.id}>
                            <Checkbox
                              checked={!!checkedPermissions[permission.id]}
                              onChange={() => handlePermissionCheck(permission.id)}
                            >
                              <span style={{ 
                                fontWeight: checkedPermissions[permission.id] ? 'bold' : 'normal',
                                color: checkedPermissions[permission.id] ? '#1890ff' : 'inherit'
                              }}>
                                {permission.name} ({permission.actionType || 'access'})
                              </span>
                            </Checkbox>
                          </Col>
                        ))}
                      </Row>
                    )
                  };
                })}
              />
            ) : (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                Loading permissions...
              </div>
            )}
          </TabPane>
        </Tabs>
      </Modal>
    </Card>
  );
};

export default RoleManagementPage;