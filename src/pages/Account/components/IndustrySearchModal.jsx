import React, { useState, useEffect } from "react";
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
      const industryList = response?.data || response || [];
      setIndustries(industryList);
      setFilteredIndustries(industryList);
    } catch (error) {
      console.error("Failed to fetch industries:", error);
      message.error("Failed to load industries");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (industry) => {
    onSelect(industry);
    onCancel();
  };

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
          dataSource={filteredIndustries}
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
