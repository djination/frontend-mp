import React, { useState, useEffect, useCallback } from "react";
import { Modal, Input, Table, Button, message, Space } from "antd";
import { SearchOutlined, CheckOutlined } from "@ant-design/icons";
import { getIndustries } from "../../../api/industryApi";

const IndustrySearchModal = ({ visible, onCancel, onSelect, selectedIndustry }) => {
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredIndustries, setFilteredIndustries] = useState([]);

  useEffect(() => {
    if (visible) {
      fetchIndustries();
    }
  }, [visible]);

  useEffect(() => {
    if (!Array.isArray(industries)) {
      setFilteredIndustries([]);
      return;
    }
    
    if (searchText) {
      const filtered = industries.filter(industry =>
        industry.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        industry.code?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredIndustries(filtered);
    } else {
      setFilteredIndustries(industries);
    }
  }, [searchText, industries]);

  const fetchIndustries = async () => {
    setLoading(true);
    try {
      const response = await getIndustries();
      console.log('IndustrySearchModal - Full response:', response);
      console.log('IndustrySearchModal - Response data:', response?.data);
      console.log('IndustrySearchModal - Response data.data:', response?.data?.data);
      
      // Handle different response structures
      let industryList = [];
      if (response?.data?.data?.data && Array.isArray(response.data.data.data)) {
        // Structure: response.data.data.data = Array
        industryList = response.data.data.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        // Structure: response.data.data = Array
        industryList = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        // Structure: response.data = Array
        industryList = response.data;
      } else if (Array.isArray(response)) {
        // Structure: response = Array
        industryList = response;
      }
      
      console.log('IndustrySearchModal - Extracted industry list:', industryList);
      setIndustries(industryList);
      setFilteredIndustries(industryList);
    } catch (error) {
      console.error("Failed to fetch industries:", error);
      message.error("Failed to load industries");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = useCallback((industry) => {
    onSelect(industry);
    onCancel();
  }, [onSelect, onCancel]);

  const columns = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      width: 120,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<CheckOutlined />}
          onClick={() => handleSelect(record)}
          disabled={selectedIndustry?.id === record.id}
        >
          {selectedIndustry?.id === record.id ? "Selected" : "Select"}
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title="Select Industry"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Input
          placeholder="Search industries by name or code..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        
        <Table
          columns={columns}
          dataSource={Array.isArray(filteredIndustries) ? filteredIndustries : []}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} industries`,
          }}
          scroll={{ y: 400 }}
          size="small"
        />
      </Space>
    </Modal>
  );
};

export default IndustrySearchModal;
