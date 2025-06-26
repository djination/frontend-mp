import { useState, useEffect, useRef, useCallback } from 'react';
import { App, Tooltip, Button, Badge } from 'antd';
import { Tree, Empty, Spin, Alert } from 'antd';
import { SettingOutlined, CheckCircleTwoTone } from '@ant-design/icons';
import { getServices } from '../../../api/serviceApi';
import { getAccountServicesByAccount } from '../../../api/accountServiceApi';
import PropTypes from 'prop-types';
import RevenueRuleModal from './AccountRevenueRule/AccountRevenueRuleModal';

const getAllExpandableKeys = (services) => {
  if (!Array.isArray(services)) return [];
  const keys = [];
  const collect = (items) => {
    items.forEach(item => {
      if (item.id) keys.push(item.id);
      if (item.children?.length) collect(item.children);
    });
  };
  collect(services);
  return keys;
};

const buildTreeData = (services) => {
  if (!Array.isArray(services)) return [];
  return services.map(s => ({
    title: s.name,
    key: s.id,
    name: s.name,
    id: s.id,
    serviceData: s,
    children: s.children?.length ? buildTreeData(s.children) : undefined,
  }));
};

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
  const [revenueRuleModalVisible, setRevenueRuleModalVisible] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [accountServiceMap, setAccountServiceMap] = useState({});
  const serviceIdMapRef = useRef({});
  const { message } = App.useApp();

  const [revenueRules, setRevenueRules] = useState(() => {
    if (accountId) {
      try {
        const savedRules = localStorage.getItem(`revenueRules_${accountId}`);
        return savedRules ? JSON.parse(savedRules) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  useEffect(() => {
    if (accountId && Object.keys(revenueRules).length > 0) {
      try {
        localStorage.setItem(`revenueRules_${accountId}`, JSON.stringify(revenueRules));
      } catch {}
    }
  }, [revenueRules, accountId]);

  const fetchAccountServices = useCallback(async () => {
    try {
      const response = await getAccountServicesByAccount(accountId);
      const mapping = {};
      if (response?.data) {
        let accountServicesData = [];
        if (Array.isArray(response.data)) {
          accountServicesData = response.data;
        } else if (Array.isArray(response.data.data)) {
          accountServicesData = response.data.data;
        } else if (typeof response.data.data === 'object' && response.data.data !== null) {
          accountServicesData = [response.data.data];
        }
        accountServicesData.forEach(accountService => {
          if (accountService.data.length > 0) {
            mapping[accountService.data[0].service.id] = accountService;
          }
        });
      }
      setAccountServiceMap(mapping);
    } catch (error) {
      console.error('Error fetching account services:', error);
    }
  }, [accountId]);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getServices();
      let servicesData = [];
      if (Array.isArray(response?.data)) {
        servicesData = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        servicesData = response.data.data;
      }
      setServiceTree(buildTreeData(servicesData));
      setExpandedKeys(getAllExpandableKeys(servicesData));
    } catch {
      setError("Failed to load services. Please try again.");
      setServiceTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
    if (accountId) fetchAccountServices();
  }, [accountId, fetchServices, fetchAccountServices]);

  useEffect(() => {
    if (!Array.isArray(accountServices)) {
      setCheckedKeys([]);
      return;
    }
    const ids = accountServices
      .filter(s => s && (s.service_id || (s.service && s.service.id)))
      .map(s => s.service_id || (s.service && s.service.id));
    setCheckedKeys(ids);

    const rulesMap = {};
    accountServices.forEach(service => {
      const serviceId = service.service_id || (service.service && service.service.id);
      if (serviceId && service.revenue_rules) {
        rulesMap[serviceId] = service.revenue_rules;
      }
    });
    if (Object.keys(rulesMap).length > 0) setRevenueRules(rulesMap);
  }, [accountServices]);

  const handleRevenueRuleClick = (nodeData, e) => {
    e.stopPropagation();
    try {
      const serviceId = nodeData.key || nodeData.id;
      if (!serviceId) {
        message.error('Service ID not found');
        return;
      }
      const accountServiceId = accountServiceMap[serviceId].data[0].id;
      setCurrentService({
        ...nodeData,
        accountService: {
          id: accountServiceId,
          account_id: accountId,
          service_id: serviceId,
          service: nodeData
        }
      });
      setRevenueRuleModalVisible(true);
    } catch (error) {
      console.error("Error opening revenue rule modal:", error);
      message.error("Could not open revenue rules. Please try again.");
    }
  };

  const handleModalClose = () => {
    setRevenueRuleModalVisible(false);
    setCurrentService(null);
  };

  const handleSaveRevenueRule = (serviceId, rules) => {
    const id = serviceId || (currentService && (currentService.key || currentService.id));
    if (!id) return;
    setRevenueRules(prev => ({ ...prev, [serviceId]: rules }));
    
    // Simpan account_service_id jika tersedia
    const accountServiceId = currentService?.accountService?.id;
    if (accountServiceId) {
      // Simpan account_service_id bersama rules
    }
    
    const updatedServices = (accountServices || []).map(service => {
      const sid = service.service_id || (service.service && service.service.id);
      if (sid === id) return { ...service, revenue_rules: rules };
      return service;
    });
    
    onChange(updatedServices);
    handleModalClose();
  };

  const onCheck = (checked) => {
    setCheckedKeys(checked);
    const originalServicesMap = {};
    if (Array.isArray(accountServices)) {
      accountServices.forEach(svc => {
        const serviceId = svc.service_id || (svc.service && svc.service.id);
        if (serviceId) originalServicesMap[serviceId] = svc;
      });
    }
    const findServiceInTree = (nodes, serviceId) => {
      for (const node of nodes) {
        if (node.key === serviceId) return { name: node.name || node.title, id: node.id };
        if (node.children?.length) {
          const found = findServiceInTree(node.children, serviceId);
          if (found) return found;
        }
      }
      return null;
    };
    const newAccountServices = checked.map(serviceId => {
      if (originalServicesMap[serviceId]) return originalServicesMap[serviceId];
      const serviceData = findServiceInTree(serviceTree, serviceId);
      const newService = {
        service_id: serviceId,
        service: serviceData || { id: serviceId },
        account_id: accountId,
        is_active: true
      };
      if (revenueRules[serviceId]) {
        serviceIdMapRef.current[serviceId] = serviceId;
        newService.revenue_rules = revenueRules[serviceId];
      }
      return newService;
    });
    onChange(newAccountServices);
  };

  if (error) return <Alert type="error" message="Error" description={error} />;
  if (loading) return <Spin size="large"><div style={{ height: 200 }}>Loading services...</div></Spin>;
  if (!serviceTree.length) return <Empty description="No services available" />;

  return (
    <div className="service-tree-container" style={{ padding: 16 }}>
      <Tree
        checkable
        treeData={serviceTree}
        checkedKeys={checkedKeys}
        expandedKeys={expandedKeys}
        onCheck={onCheck}
        onExpand={setExpandedKeys}
        defaultExpandAll
        titleRender={nodeData => {
          const isChecked = checkedKeys.includes(nodeData.key);
          const isLeafNode = !nodeData.children || nodeData.children.length === 0;
          const hasRevenueRules = !!revenueRules[nodeData.key];
          return (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                background: isChecked ? '#f6ffed' : undefined,
                borderRadius: 6,
                padding: '2px 8px',
                transition: 'background 0.2s'
              }}
            >
              <span style={{ fontWeight: isChecked ? 600 : 400 }}>
                {nodeData.name || nodeData.title}
              </span>
              {isLeafNode && isChecked && (
                <Tooltip title={hasRevenueRules ? 'Edit Revenue Rules' : 'Set Revenue Rules'}>
                  <Button
                    type={hasRevenueRules ? 'default' : 'primary'}
                    size="small"
                    icon={
                      hasRevenueRules
                        ? <CheckCircleTwoTone twoToneColor="#52c41a" />
                        : <SettingOutlined />
                    }
                    onClick={e => handleRevenueRuleClick(nodeData, e)}
                    disabled={!accountId}
                    style={{
                      marginLeft: 8,
                      borderColor: hasRevenueRules ? '#52c41a' : undefined,
                      color: hasRevenueRules ? '#52c41a' : undefined,
                      background: hasRevenueRules ? '#f6ffed' : undefined,
                      fontWeight: 500
                    }}
                  >
                  </Button>
                </Tooltip>
              )}
            </div>
          );
        }}
      />
      {revenueRuleModalVisible && currentService && (
        <RevenueRuleModal
          key={`modal-${currentService.id}-${Date.now()}`}
          visible={revenueRuleModalVisible}
          onCancel={handleModalClose}
          accountId={accountId}
          accountService={currentService.accountService}
          onSave={rules => handleSaveRevenueRule(currentService.id, rules)}
          initialRules={revenueRules[currentService.id] || []}
        />
      )}
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
