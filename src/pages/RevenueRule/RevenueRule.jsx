import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Table,
  Space,
  Modal,
  Form,
  message,
  Tree,
  Spin,
  Tag,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { revenueRuleApi } from '../../api/revenueRuleApi';
import RevenueRuleForm from './components/RevenueRuleForm';

const RevenueRule = () => {
  const [form] = Form.useForm();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await revenueRuleApi.getAll();
      const rulesData = response.data || [];
      setRules(Array.isArray(rulesData) ? rulesData : []);
    } catch (error) {
      console.error('Error fetching rules:', error);
      message.error(error.response?.data?.message || 'Failed to fetch revenue rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleCreate = () => {
    setEditingRule(null);
    setSelectedCategory(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = async (rule) => {
    try {
      const response = await revenueRuleApi.getById(rule.id);
      const detailedRule = response.data;
      setEditingRule(detailedRule);
      setSelectedCategory(detailedRule.category);
      
      // Convert string numbers to actual numbers for form
      const formData = {
        ...detailedRule,
        value: detailedRule.value ? Number(detailedRule.value) : undefined,
        parentId: detailedRule.parentId ? Number(detailedRule.parentId) : undefined
      };
      
      form.setFieldsValue(formData);
      setModalVisible(true);
    } catch (error) {
      console.error('Error fetching rule details:', error);
      message.error(error.response?.data?.message || 'Failed to fetch rule details');
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await revenueRuleApi.delete(id);
      message.success('Revenue rule deleted successfully');
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      message.error(error.response?.data?.message || 'Failed to delete revenue rule');
    } finally {
      setLoading(false);
    }
  };

  const handleModalOk = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      
      // Clean up the values based on category
      const cleanedValues = { ...values };
      
      // Remove fields that are not relevant to the selected category
      if (values.category === 'CHARGING_METRIC') {
        ['billingRuleType', 'billingMethodType', 'paymentType', 'paymentPeriod', 'taxRuleType', 'topPeriod']
          .forEach(field => delete cleanedValues[field]);

        // Remove non-relevant charging metric fields based on type
        if (values.chargingType === 'DEDICATED') {
          ['nonDedicatedType', 'transactionFeeType', 'subscriptionPeriod']
            .forEach(field => delete cleanedValues[field]);

          if (values.dedicatedType !== 'NON_PACKAGE') {
            delete cleanedValues.nonPackageType;
          }
          if (values.dedicatedType !== 'ADD_ONS') {
            delete cleanedValues.addOnsType;
            delete cleanedValues.systemIntegrationType;
          } else if (values.addOnsType !== 'SYSTEM_INTEGRATION') {
            delete cleanedValues.systemIntegrationType;
          }
        } else if (values.chargingType === 'NON_DEDICATED') {
          ['dedicatedType', 'nonPackageType', 'addOnsType', 'systemIntegrationType']
            .forEach(field => delete cleanedValues[field]);

          if (values.nonDedicatedType !== 'TRANSACTION_FEE') {
            delete cleanedValues.transactionFeeType;
          }
          if (values.nonDedicatedType !== 'SUBSCRIPTION') {
            delete cleanedValues.subscriptionPeriod;
          }
        }
      } else if (values.category === 'BILLING_RULES') {
        ['chargingType', 'dedicatedType', 'nonPackageType', 'addOnsType', 'systemIntegrationType',
         'nonDedicatedType', 'transactionFeeType', 'subscriptionPeriod']
          .forEach(field => delete cleanedValues[field]);

        if (values.billingRuleType !== 'BILLING_METHOD') {
          ['billingMethodType', 'paymentType', 'paymentPeriod']
            .forEach(field => delete cleanedValues[field]);
        } else {
          if (!['AUTO_DEDUCT', 'POST_PAID'].includes(values.billingMethodType)) {
            delete cleanedValues.paymentType;
            delete cleanedValues.paymentPeriod;
          } else if (values.paymentType !== 'TRANSACTION') {
            delete cleanedValues.paymentPeriod;
          }
        }

        if (values.billingRuleType !== 'TAX_RULES') {
          delete cleanedValues.taxRuleType;
        }
        if (values.billingRuleType !== 'TERM_OF_PAYMENT') {
          delete cleanedValues.topPeriod;
        }
      }

      // Ensure numeric fields are numbers
      if (cleanedValues.value !== undefined && cleanedValues.value !== null) {
        cleanedValues.value = Number(cleanedValues.value);
      }
      if (cleanedValues.parentId !== undefined && cleanedValues.parentId !== null) {
        cleanedValues.parentId = Number(cleanedValues.parentId);
      }

      // Validate numeric fields
      if (isNaN(cleanedValues.value)) {
        throw new Error('Value must be a valid number');
      }
      if (cleanedValues.parentId !== undefined && isNaN(cleanedValues.parentId)) {
        throw new Error('Parent ID must be a valid number');
      }

      if (editingRule) {
        await revenueRuleApi.update(editingRule.id, cleanedValues);
        message.success('Revenue rule updated successfully');
      } else {
        await revenueRuleApi.create(cleanedValues);
        message.success('Revenue rule created successfully');
      }
      setModalVisible(false);
      fetchRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      if (error.response?.data?.error) {
        if (Array.isArray(error.response.data.error)) {
          error.response.data.error.forEach(errorMsg => {
            message.error(errorMsg);
          });
        } else {
          message.error(error.response.data.error);
        }
      } else if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error(error.message || 'Failed to save revenue rule');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (text) => text ? <Tag color="red">{text.replace(/_/g, ' ')}</Tag> : null,
    },
    {
      title: 'Type',
      key: 'type',
      render: (_, record) => {
        let type = null;
        let color = 'green';

        if (record.category === 'CHARGING_METRIC') {
          if (record.chargingType === 'DEDICATED') {
            type = record.dedicatedType || record.chargingType;
          } else if (record.chargingType === 'NON_DEDICATED') {
            type = record.nonDedicatedType || record.chargingType;
          }
        } else if (record.category === 'BILLING_RULES') {
          type = record.billingRuleType;
          color = 'orange';
        }

        return type ? <Tag color={color}>{type.replace(/_/g, ' ')}</Tag> : null;
      },
    },
    {
      title: 'Parent',
      key: 'parent',
      render: (_, record) => {
        const parent = rules.find(r => r.id === record.parentId);
        return parent ? (
          <Tag color="purple">
            {parent.name} ({parent.category.replace(/_/g, ' ')})
          </Tag>
        ) : null;
      },
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value) => value ? Number(value).toFixed(2) : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this rule?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const transformToTreeData = (data) => {
    return data.map(item => ({
      key: item.id,
      title: item.name,
      children: item.children ? transformToTreeData(item.children) : []
    }));
  };

  return (
    <Card title="Revenue Rules Management">
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleCreate}
        style={{ marginBottom: 16 }}
      >
        Add Revenue Rule
      </Button>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={rules}
          rowKey="id"
          style={{ marginBottom: 16 }}
        />

        {rules.length > 0 && (
          <Card title="Rule Hierarchy">
            <Tree
              treeData={transformToTreeData(rules)}
              defaultExpandAll
            />
          </Card>
        )}
      </Spin>

      <Modal
        title={editingRule ? 'Edit Revenue Rule' : 'Add Revenue Rule'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          form.resetFields();
          setModalVisible(false);
          setSelectedCategory(null);
        }}
        confirmLoading={submitting}
        destroyOnHidden
        width={800}
        maskClosable={false}
        forceRender
      >
        <Form 
          form={form} 
          layout="vertical"
          onValuesChange={() => {
            form.validateFields().catch(() => {});
          }}
        >
          <RevenueRuleForm
            form={form}
            selectedCategory={selectedCategory}
            onCategoryChange={(value) => setSelectedCategory(value)}
            availableParents={rules}
            editingRuleId={editingRule?.id}
          />
        </Form>
      </Modal>
    </Card>
  );
};

export default RevenueRule;