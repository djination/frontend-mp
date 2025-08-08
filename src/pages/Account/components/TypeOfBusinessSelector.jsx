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
  const [stableValue, setStableValue] = useState(null); // Add stable value state

  // Load parent types on component mount
  useEffect(() => {
    fetchParentTypes();
  }, []);

  // Initialize values when editing
  useEffect(() => {
    const initializeValues = async () => {
      const typeOfBusinessId = form.getFieldValue('type_of_business_id');
      const parentTypeId = form.getFieldValue('parent_type_of_business');
      
      if (!initialized && typeOfBusinessId) {
        try {
          // If we have parent_type_of_business from form, use it directly
          if (parentTypeId) {
            setSelectedParent(parentTypeId);
            await fetchChildTypes(parentTypeId);
            setSelectedChild(typeOfBusinessId);
            
            // Get child data
            const response = await getBusinessTypeById(typeOfBusinessId);
            const typeOfBusiness = response?.data;
            if (typeOfBusiness) {
              setSelectedChildData(typeOfBusiness);
              setStableValue(typeOfBusiness.id); // Set stable value
            }
          } else {
            // Fallback: fetch type of business to get parent
            const response = await getBusinessTypeById(typeOfBusinessId);
            const typeOfBusiness = response?.data;
            
            if (typeOfBusiness) {
              if (typeOfBusiness.parent_id) {
                setSelectedParent(typeOfBusiness.parent_id);
                await fetchChildTypes(typeOfBusiness.parent_id);
                
                // Update form with parent type
                form.setFieldValue('parent_type_of_business', typeOfBusiness.parent_id);
              }
              setSelectedChild(typeOfBusiness.id);
              setSelectedChildData(typeOfBusiness);
              setStableValue(typeOfBusiness.id); // Set stable value
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

  // Monitor form changes that might affect this component
  useEffect(() => {
    const formTypeOfBusinessId = form.getFieldValue('type_of_business_id');
    const formParentTypeOfBusiness = form.getFieldValue('parent_type_of_business');
    
    // CRITICAL: Jika form value berbeda dengan state, dan kita sudah initialized, 
    // artinya ada external change yang harus kita sync
    if (initialized) {
      if (formTypeOfBusinessId !== selectedChild) {
        console.log('FORM SYNC: form type_of_business_id different from selectedChild, syncing...', {
          formValue: formTypeOfBusinessId,
          currentSelected: selectedChild
        });
        
        // Only sync if the form value is valid
        if (formTypeOfBusinessId && childTypes.length > 0) {
          const validChild = childTypes.find(c => c.id === formTypeOfBusinessId);
          if (validChild) {
            setSelectedChild(formTypeOfBusinessId);
            setStableValue(formTypeOfBusinessId);
            setSelectedChildData(validChild);
          } else {
            console.log('FORM SYNC: Invalid form value, clearing selection');
            setSelectedChild(null);
            setStableValue(null);
            setSelectedChildData(null);
          }
        }
      }
    }
  }, [form.getFieldValue('type_of_business_id'), form.getFieldValue('parent_type_of_business'), initialized, childTypes]);

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

  // BRUTAL VALIDATION: Force re-validate selection when childTypes changes
  useEffect(() => {
    if (childTypes.length > 0 && selectedChild) {
      const childData = childTypes.find(c => c.id === selectedChild);
      if (!childData) {
        setSelectedChild(null);
        setSelectedChildData(null);
        setStableValue(null);
      } else {
        setSelectedChildData(childData);
        setStableValue(childData.id);
      }
    }
  }, [childTypes, selectedChild]);

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
    try {
      setChildLoading(true);
      const response = await getChildBusinessTypes(parentId);
      const newChildTypes = response?.data || [];
      setChildTypes(newChildTypes);
      
      // BRUTAL FIX: Jika selectedChild ada tapi tidak ada di newChildTypes, reset
      if (selectedChild && newChildTypes.length > 0) {
        const childExists = newChildTypes.find(child => child.id === selectedChild);
        if (!childExists) {
          setSelectedChild(null);
          setSelectedChildData(null);
          setStableValue(null);
        } else {
          // Force update selectedChildData dari new data
          setSelectedChildData(childExists);
        }
      }
    } catch (error) {
      message.error('Failed to fetch child business types');
      setChildTypes([]);
    } finally {
      setChildLoading(false);
    }
  };

  const handleParentChange = (parentId) => {
    setSelectedParent(parentId);
    setSelectedChild(null);
    setSelectedChildData(null);
    setStableValue(null); // Clear stable value
    
    // Reset child-related form fields
    form.setFieldsValue({
      type_of_business_id: null,
      type_of_business_detail: null
    });

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
    setStableValue(childId); // Update stable value immediately
    
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
            key={`child-select-${childTypes.length}-${selectedChild}`}
            placeholder={placeholder.child}
            allowClear
            loading={childLoading}
            disabled={disabled || !selectedParent}
            value={selectedChild}
            onChange={handleChildChange}
            showSearch
            optionFilterProp="label"
          >
            {childTypes.map(child => (
              <Option key={child.id} value={child.id} label={child.name}>
                {child.name}
                {child.is_other && <span style={{ color: '#999' }}> (Custom)</span>}
              </Option>
            ))}
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
