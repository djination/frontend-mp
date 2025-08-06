import React, { useState, useEffect } from 'react';
import { Select, Input, Form, Col, Row, message } from 'antd';
import { getParentBusinessTypes, getChildBusinessTypes, getBusinessTypeById } from '../../../api/businessTypeApi';

const { Option } = Select;
const { TextArea } = Input;

const TypeOfBusinessSelector = ({
  value = {},
  onChange,
  form,
  disabled = false,
  placeholder = {
    parent: "Select parent type of business",
    child: "Select specific type of business",
    detail: "Please specify the type of business"
  }
}) => {
  const [parentTypes, setParentTypes] = useState([]);
  const [childTypes, setChildTypes] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [selectedChildData, setSelectedChildData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [childLoading, setChildLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Debug logging for state changes
  useEffect(() => {
    console.log('=== TypeOfBusinessSelector State ===');
    console.log('selectedParent:', selectedParent);
    console.log('childTypes count:', childTypes?.length);
    console.log('childTypes:', childTypes);
    console.log('selectedChild:', selectedChild);
    console.log('childLoading:', childLoading);
  }, [selectedParent, childTypes, selectedChild, childLoading]);

  // Effect to ensure selected child is properly displayed when childTypes are loaded
  useEffect(() => {
    if (selectedChild && childTypes.length > 0) {
      const selectedChildObj = childTypes.find(child => child.id === selectedChild);
      console.log('Selected child object for display update:', selectedChildObj);
      
      if (selectedChildObj) {
        // Force form field update to ensure proper display
        form.setFieldValue('type_of_business_id', selectedChild);
        console.log('Forced form update with selectedChild:', selectedChild);
        console.log('Should display name:', selectedChildObj.name);
        
        // Additional force update to trigger re-render
        setTimeout(() => {
          form.setFieldsValue({ type_of_business_id: selectedChild });
          console.log('Secondary form update completed');
        }, 200);
      }
    }
  }, [selectedChild, childTypes, form]);

  // Additional effect to fix display issue
  useEffect(() => {
    const currentFormValue = form.getFieldValue('type_of_business_id');
    console.log('Current form value for type_of_business_id:', currentFormValue);
    console.log('Current selectedChild:', selectedChild);
    
    // If form value is UUID and we have child types loaded, fix the display
    if (currentFormValue && childTypes.length > 0) {
      const childObj = childTypes.find(child => child.id === currentFormValue);
      if (childObj && childObj.name) {
        console.log('Found child object for current form value:', childObj);
        // Force a re-render with proper value
        setTimeout(() => {
          form.setFieldValue('type_of_business_id', currentFormValue);
        }, 100);
      }
    }
  }, [childTypes, form]);

  // Load parent types on component mount
  useEffect(() => {
    fetchParentTypes();
  }, []);

  // Initialize values when editing
  useEffect(() => {
    const initializeValues = async () => {
      const typeOfBusinessId = form.getFieldValue('type_of_business_id');
      const parentTypeId = form.getFieldValue('parent_type_of_business');
      
      console.log('TypeOfBusinessSelector - initializing with:', {
        typeOfBusinessId,
        parentTypeId,
        initialized
      });
      
      if (!initialized && typeOfBusinessId) {
        try {
          // If we have parent_type_of_business from form, use it directly
          if (parentTypeId) {
            console.log('Setting parent:', parentTypeId);
            setSelectedParent(parentTypeId);
            
            // Fetch child types first
            const childResponse = await getChildBusinessTypes(parentTypeId);
            const childTypesData = childResponse?.data || [];
            console.log('Fetched child types:', childTypesData);
            setChildTypes(childTypesData);
            
            // Then set selected child after child types are available
            setTimeout(() => {
              console.log('Setting selectedChild after childTypes loaded:', typeOfBusinessId);
              setSelectedChild(typeOfBusinessId);
            }, 200);
            
            // Get child data
            const response = await getBusinessTypeById(typeOfBusinessId);
            const typeOfBusiness = response?.data;
            if (typeOfBusiness) {
              setSelectedChildData(typeOfBusiness);
              // Set display value menggunakan nama, bukan ID
              console.log('Setting child data:', typeOfBusiness);
            }
          } else {
            // Fallback: fetch type of business to get parent
            const response = await getBusinessTypeById(typeOfBusinessId);
            const typeOfBusiness = response?.data;
            
            if (typeOfBusiness) {
              if (typeOfBusiness.parent_id) {
                setSelectedParent(typeOfBusiness.parent_id);
                await fetchChildTypes(typeOfBusiness.parent_id);
                
                // Wait for childTypes to be set, then set selectedChild
                setTimeout(() => {
                  setSelectedChild(typeOfBusiness.id);
                }, 100);
                
                // Update form with parent type
                form.setFieldValue('parent_type_of_business', typeOfBusiness.parent_id);
              } else {
                // Direct child without parent structure
                setSelectedChild(typeOfBusiness.id);
              }
              setSelectedChildData(typeOfBusiness);
            }
          }
          setInitialized(true);
        } catch (error) {
          console.error('Error initializing type of business:', error);
        }
      }
    };
    
    if (parentTypes.length > 0) {
      initializeValues();
    }
  }, [parentTypes, form, initialized]);

  // Load child types when parent changes
  useEffect(() => {
    if (selectedParent && initialized) {
      fetchChildTypes(selectedParent);
    } else if (selectedParent && !initialized) {
      // This will be handled by the initialization effect
    } else {
      setChildTypes([]);
      setSelectedChild(null);
      setSelectedChildData(null);
    }
  }, [selectedParent, initialized]);

  const fetchParentTypes = async () => {
    try {
      setLoading(true);
      const response = await getParentBusinessTypes();
      setParentTypes(response?.data || []);
    } catch (error) {
      message.error('Failed to fetch parent business types');
      setParentTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildTypes = async (parentId) => {
    console.log('=== Fetching child types ===');
    console.log('Parent ID:', parentId);
    
    try {
      setChildLoading(true);
      const response = await getChildBusinessTypes(parentId);
      console.log('Child types response:', response);
      console.log('Child types data:', response?.data);
      
      const childTypesData = response?.data || [];
      setChildTypes(childTypesData);
      
      // Force re-render after setting data
      setTimeout(() => {
        console.log('Child types set, forcing re-render');
      }, 50);
      
    } catch (error) {
      console.error('Error fetching child business types:', error);
      message.error('Failed to fetch child business types');
      setChildTypes([]);
    } finally {
      setChildLoading(false);
    }
  };

  const handleParentChange = (parentId) => {
    console.log('=== Parent changed ===');
    console.log('Parent ID:', parentId);
    
    setSelectedParent(parentId);
    setSelectedChild(null);
    setSelectedChildData(null);
    
    // Reset child-related form fields
    form.setFieldsValue({
      type_of_business_id: null,
      type_of_business_detail: null
    });

    // Fetch child types
    if (parentId) {
      console.log('Fetching child types for parent:', parentId);
      fetchChildTypes(parentId);
    } else {
      setChildTypes([]);
    }

    // Notify parent component
    if (onChange) {
      onChange({
        parent_id: parentId,
        child_id: null,
        type_of_business_id: null,
        type_of_business_detail: null,
        is_other: false
      });
    }
  };

  const handleChildChange = (childId) => {
    setSelectedChild(childId);
    
    // Find the selected child data
    const childData = childTypes.find(child => child.id === childId);
    setSelectedChildData(childData);

    // Set form values
    const formValues = {
      type_of_business_id: childId,
      type_of_business_detail: childData?.is_other ? (form.getFieldValue('type_of_business_detail') || '') : childData?.detail || null
    };
    
    form.setFieldsValue(formValues);

    // Notify parent component
    if (onChange) {
      onChange({
        parent_id: selectedParent,
        child_id: childId,
        type_of_business_id: childId,
        type_of_business_detail: formValues.type_of_business_detail,
        is_other: childData?.is_other || false
      });
    }
  };

  const handleDetailChange = (e) => {
    const detail = e.target.value;
    form.setFieldsValue({ type_of_business_detail: detail });
    
    // Notify parent component
    if (onChange) {
      onChange({
        parent_id: selectedParent,
        child_id: selectedChild,
        type_of_business_id: selectedChild,
        type_of_business_detail: detail,
        is_other: selectedChildData?.is_other || false
      });
    }
  };

  const isOtherSelected = selectedChildData?.is_other || false;

  // Get display value for selected child
  const getSelectedChildDisplay = () => {
    if (selectedChild && childTypes.length > 0) {
      const childObj = childTypes.find(child => child.id === selectedChild);
      if (childObj) {
        return childObj.name;
      }
    }
    return selectedChild; // Fallback to ID if name not found
  };

  return (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="parent_type_of_business"
          label="Type of Business Category"
        >
          <Select
            placeholder={placeholder.parent}
            allowClear
            loading={loading}
            disabled={disabled}
            value={selectedParent}
            onChange={handleParentChange}
            showSearch
            optionFilterProp="label"
          >
            {parentTypes.map(parent => (
              <Option key={parent.id} value={parent.id} label={parent.name}>
                {parent.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      
      <Col span={12}>
        <Form.Item
          name="type_of_business_id"
          label="Specific Type of Business"
          rules={[
            { required: true, message: 'Please select a type of business' }
          ]}
        >
          <Select
            key={`child-select-${selectedParent}-${childTypes.length}-${selectedChild}-${Date.now()}`}
            placeholder={placeholder.child}
            allowClear
            loading={childLoading}
            disabled={disabled || !selectedParent}
            value={
              selectedChild && childTypes.length > 0 
                ? {
                    value: selectedChild,
                    label: childTypes.find(child => child.id === selectedChild)?.name || selectedChild
                  }
                : undefined
            }
            onChange={(value) => {
              console.log('Select onChange called with:', value);
              const childId = value ? (typeof value === 'object' ? value.value : value) : null;
              handleChildChange(childId);
            }}
            labelInValue
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) => {
              return (option?.label ?? '').toLowerCase().includes(input.toLowerCase());
            }}
            notFoundContent={childLoading ? 'Loading...' : 'No data'}
            onDropdownVisibleChange={(open) => {
              if (!open && selectedChild && childTypes.length > 0) {
                // Force refresh display when dropdown closes
                const childObj = childTypes.find(child => child.id === selectedChild);
                console.log('Dropdown closed, ensuring display for:', childObj?.name);
              }
            }}
          >
            {childTypes.map(child => {
              console.log('Rendering child option:', child);
              return (
                <Option key={child.id} value={child.id} label={child.name}>
                  {child.name}
                  {child.is_other && <span style={{ color: '#999' }}> (Custom)</span>}
                </Option>
              );
            })}
          </Select>
        </Form.Item>
      </Col>
      
      {isOtherSelected && (
        <Col span={24}>
          <Form.Item
            name="type_of_business_detail"
            label="Please specify the type of business"
            rules={[
              { required: true, message: 'Please specify the type of business' }
            ]}
          >
            <TextArea
              placeholder={placeholder.detail}
              rows={3}
              disabled={disabled}
              onChange={handleDetailChange}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Col>
      )}
      
      {!isOtherSelected && selectedChildData && (
        <Col span={24}>
          <Form.Item
            name="type_of_business_detail"
            label="Type of Business Detail"
          >
            <Input.TextArea
              value={selectedChildData.detail || ''}
              disabled
              rows={2}
              placeholder="Detail will be auto-filled based on your selection"
            />
          </Form.Item>
        </Col>
      )}
    </Row>
  );
};

export default TypeOfBusinessSelector;
