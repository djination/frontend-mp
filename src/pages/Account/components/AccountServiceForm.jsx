import { useState, useEffect } from 'react';
import { Tree, Empty, Spin, Alert } from 'antd';
import { getServices } from '../../../api/serviceApi';
import PropTypes from 'prop-types';

const AccountServiceForm = ({
  accountServices = [],
  onChange,
  accountId,
  isEdit
}) => {
  const [serviceTree, setServiceTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkedKeys, setCheckedKeys] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  
  // Fetch services saat komponen dimount
  useEffect(() => {
    fetchServices();
  }, []);

  // Update checkedKeys saat accountServices berubah
  useEffect(() => {
    try {
      
      
      // Defensive check
      if (!Array.isArray(accountServices)) {
        console.warn("accountServices is not an array:", accountServices);
        setCheckedKeys([]);
        return;
      }

      const ids = accountServices
        .filter(s => s && (s.service_id || (s.service && s.service.id)))
        .map(s => s.service_id || (s.service && s.service.id));
      
      
      setCheckedKeys(ids);
    } catch (err) {
      console.error("Error processing accountServices:", err);
      setError("Error processing services data");
      setCheckedKeys([]);
    }
  }, [accountServices]);

  // Ambil data services dari API
  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getServices();
      
      
      let servicesData = [];
      if (Array.isArray(response?.data)) {
        servicesData = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        servicesData = response.data.data;
      } else {
        console.warn("Unexpected services response format:", response);
        servicesData = [];
      }
      
      // Konversi ke format Tree Ant Design
      const treeData = buildTreeData(servicesData);
      setServiceTree(treeData);
      
      // Expand keys
      const allKeys = getAllExpandableKeys(servicesData);
      setExpandedKeys(allKeys);
    } catch (err) {
      console.error('Failed to fetch services:', err);
      setError("Failed to load services. Please try again.");
      setServiceTree([]);
    } finally {
      setLoading(false);
    }
  };

  // Get all keys for expansion
  const getAllExpandableKeys = (services) => {
    if (!Array.isArray(services)) return [];
    
    let keys = [];
    const collect = (items) => {
      items.forEach(item => {
        if (item.id) keys.push(item.id);
        if (item.children && item.children.length > 0) {
          collect(item.children);
        }
      });
    };
    
    collect(services);
    return keys;
  };

  // Recursive function untuk build tree data
  const buildTreeData = (services) => {
    if (!services || !Array.isArray(services)) return [];
    
    return services.map(s => ({
      title: s.name,
      key: s.id,
      children: s.children && s.children.length > 0 
        ? buildTreeData(s.children) 
        : undefined,
    }));
  };

  // Flatten tree untuk pencarian service by id
  const flattenServiceTree = (services) => {
    if (!Array.isArray(services)) return [];
    
    let result = [];
    const flatten = (items) => {
      items.forEach(service => {
        result.push(service);
        if (service.children && service.children.length > 0) {
          flatten(service.children);
        }
      });
    };
    
    flatten(services);
    return result;
  };

  // Handle saat checkbox diubah
  const onCheck = (checked) => {
    try {
      
      setCheckedKeys(checked);

      // Konversi original services ke map untuk lookup cepat
      const originalServicesMap = {};
      if (Array.isArray(accountServices)) {
        accountServices.forEach(svc => {
          const serviceId = svc.service_id || (svc.service && svc.service.id);
          if (serviceId) {
            originalServicesMap[serviceId] = svc;
          }
        });
      }
      
      // Flatten services untuk mencari data service
      const allServices = [];
      const traverseTree = (nodes) => {
        nodes.forEach(node => {
          allServices.push({
            id: node.key,
            name: node.title
          });
          if (node.children && node.children.length > 0) {
            traverseTree(node.children);
          }
        });
      };
      
      traverseTree(serviceTree);
      
      // Buat accountServices baru berdasarkan ID yang dipilih
      const newAccountServices = checked.map(serviceId => {
        // Cek jika service ini sudah ada sebelumnya
        if (originalServicesMap[serviceId]) {
          return originalServicesMap[serviceId];
        }
        
        // Jika baru, cari datanya dari tree
        const serviceData = allServices.find(s => s.id === serviceId) || { id: serviceId, name: `Service ${serviceId.substring(0, 8)}` };
        
        return {
          tempId: `temp-${serviceId}-${Date.now()}`,
          service_id: serviceId,
          service: { 
            id: serviceId,
            name: serviceData.name
          },
          account_id: accountId,
          is_active: true
        };
      });
      
      // Update parent component
      onChange(newAccountServices);
    } catch (err) {
      console.error("Error handling check event:", err);
      setError("Error updating selected services");
    }
  };
  
  if (error) {
    return <Alert type="error" message="Error" description={error} />;
  }
  
  if (loading) {
    return <Spin tip="Loading services..." />;
  }

  if (!serviceTree.length) {
    return <Empty description="No services available" />;
  }

  return (
    <div className="service-tree-container">
      <Tree
        checkable
        treeData={serviceTree}
        checkedKeys={checkedKeys}
        expandedKeys={expandedKeys}
        onCheck={onCheck}
        onExpand={setExpandedKeys}
        defaultExpandAll
      />
    </div>
  );
};

AccountServiceForm.propTypes = {
  accountServices: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  accountId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isEdit: PropTypes.bool.isRequired,
};

export default AccountServiceForm;