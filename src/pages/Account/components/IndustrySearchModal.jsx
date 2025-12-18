import React, { useState, useEffect, useCallback, useRef } from "react";
import { Modal, Input, Table, Button, message, Space } from "antd";
import { SearchOutlined, CheckOutlined } from "@ant-design/icons";
import { getIndustries } from "../../../api/industryApi";

const IndustrySearchModal = ({ visible, onCancel, onSelect, selectedIndustry }) => {
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const searchTimeoutRef = useRef(null);

  const fetchIndustries = useCallback(async (page = 1, limit = 10, search = "") => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
      };

      // Add search filters if searchText is provided
      // Backend supports name, code, and description filters
      // We'll use name filter for general search (backend does ILIKE search)
      if (search) {
        params.name = search;
      }

      const response = await getIndustries(params);
      
      // Backend returns: { data: Industry[], meta: { total, page, limit, totalPages } }
      let industryList = [];
      let meta = { total: 0, page: 1, limit: 10, totalPages: 0 };

      if (response?.data && Array.isArray(response.data)) {
        industryList = response.data;
        meta = response.meta || { total: industryList.length, page, limit, totalPages: 1 };
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        industryList = response.data.data;
        meta = response.data.meta || response.meta || { total: industryList.length, page, limit, totalPages: 1 };
      }
      
      setIndustries(industryList);
      setPagination({
        current: meta.page || page,
        pageSize: meta.limit || limit,
        total: meta.total || 0,
      });
    } catch (error) {
      console.error("Failed to fetch industries:", error);
      message.error("Failed to load industries");
      setIndustries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      // Reset state when modal opens
      setSearchText("");
      setPagination({ current: 1, pageSize: 10, total: 0 });
      fetchIndustries(1, 10, "");
    }
  }, [visible, fetchIndustries]);

  // Debounced search
  useEffect(() => {
    if (!visible) return;

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      fetchIndustries(1, pagination.pageSize, searchText);
      setPagination(prev => ({ ...prev, current: 1 }));
    }, 500); // 500ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchText, visible, pagination.pageSize, fetchIndustries]);

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
          dataSource={Array.isArray(industries) ? industries : []}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} industries`,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }));
              fetchIndustries(page, pageSize, searchText);
            },
            onShowSizeChange: (current, size) => {
              setPagination(prev => ({ ...prev, current: 1, pageSize: size }));
              fetchIndustries(1, size, searchText);
            },
          }}
          scroll={{ y: 400 }}
          size="small"
        />
      </Space>
    </Modal>
  );
};

export default IndustrySearchModal;
