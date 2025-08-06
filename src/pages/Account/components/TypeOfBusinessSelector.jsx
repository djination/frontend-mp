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
  const [displayName, setDisplayName] = useState(''); // Add explicit display name state
  const [formValueOverride, setFormValueOverride] = useState(null); // NUCLEAR OPTION - override form values

  console.log('🚀 COMPONENT RENDER - TypeOfBusinessSelector state:', {
    selectedChild,
    displayName,
    formValueOverride,
    initialized,
    parentTypesLength: parentTypes.length,
    childTypesLength: childTypes.length
  });

  // Load parent types on component mount
  useEffect(() => {
    console.log('🚀 MOUNT EFFECT - Fetching parent types');
    fetchParentTypes();
  }, []);

  // SUPER AGGRESSIVE INITIALIZATION - ALWAYS RUNS
  useEffect(() => {
    const formValue = form.getFieldValue('type_of_business_id');
    console.log('🚀 SUPER AGGRESSIVE INIT - Checking:', {
      formValue,
      hasFormValueOverride: !!formValueOverride,
      parentTypesLength: parentTypes.length,
      initialized
    });
    
    if (formValue && !formValueOverride) {
      console.log('🚀 SUPER AGGRESSIVE INIT - TRIGGERING IMMEDIATE FIX for:', formValue);
      
      // Immediately set a basic override to prevent UUID display
      setFormValueOverride({
        value: formValue,
        label: 'Loading...'
      });
      
      // Fetch the actual data
      const initAsync = async () => {
        try {
          console.log('🚀 SUPER AGGRESSIVE INIT - Fetching data for:', formValue);
          const response = await getBusinessTypeById(formValue);
          const typeData = response?.data;
          console.log('🚀 SUPER AGGRESSIVE INIT - Got data:', typeData);
          
          if (typeData) {
            setDisplayName(typeData.name);
            setFormValueOverride({
              value: formValue,
              label: typeData.name
            });
            console.log('🚀 SUPER AGGRESSIVE INIT - SET FINAL OVERRIDE:', typeData.name);
          }
        } catch (error) {
          console.error('🚀 SUPER AGGRESSIVE INIT - Error:', error);
        }
      };
      initAsync();
    }
  }); // NO DEPENDENCY ARRAY - RUNS ON EVERY RENDER!

  // BACKUP INITIALIZATION - More complete setup
  useEffect(() => {
    const currentTypeOfBusinessId = form.getFieldValue('type_of_business_id');
    const currentParentTypeId = form.getFieldValue('parent_type_of_business');
    
    console.log('🚀 BACKUP INIT - Checking conditions:', {
      currentTypeOfBusinessId,
      currentParentTypeId,
      parentTypesLength: parentTypes.length,
      initialized,
      hasFormValueOverride: !!formValueOverride
    });
    
    // Run if we have parent types, a business type ID, and haven't initialized yet
    if (parentTypes.length > 0 && currentTypeOfBusinessId && !initialized) {
      console.log('🚀 BACKUP INIT - CONDITIONS MET! Starting full initialization...');
      
      const initializeValues = async () => {
        try {
          let targetParentId = currentParentTypeId;
          
          // Get parent ID if not available
          if (!targetParentId) {
            console.log('🚀 BACKUP INIT - Getting parent ID for:', currentTypeOfBusinessId);
            const response = await getBusinessTypeById(currentTypeOfBusinessId);
            const typeOfBusiness = response?.data;
            if (typeOfBusiness?.parent_id) {
              targetParentId = typeOfBusiness.parent_id;
              form.setFieldValue('parent_type_of_business', targetParentId);
              console.log('🚀 BACKUP INIT - Set parent ID:', targetParentId);
            }
          }
          
          if (targetParentId) {
            console.log('🚀 BACKUP INIT - Setting parent and fetching children:', targetParentId);
            setSelectedParent(targetParentId);
            
            // Fetch child types
            setChildLoading(true);
            const childResponse = await getChildBusinessTypes(targetParentId);
            const childTypesData = childResponse?.data || [];
            console.log('🚀 BACKUP INIT - Got child types:', childTypesData.length);
            setChildTypes(childTypesData);
            setChildLoading(false);
            
            // Find and set child
            const childExists = childTypesData.find(child => child.id === currentTypeOfBusinessId);
            console.log('🚀 BACKUP INIT - Child found:', childExists);
            
            if (childExists) {
              setSelectedChild(currentTypeOfBusinessId);
              setSelectedChildData(childExists);
              setDisplayName(childExists.name);
              
              // FORCE OVERRIDE
              setFormValueOverride({
                value: currentTypeOfBusinessId,
                label: childExists.name
              });
              
              console.log('🚀 BACKUP INIT - COMPLETE SUCCESS! Name:', childExists.name);
            }
          }
          
        } catch (error) {
          console.error('🚀 BACKUP INIT - Error:', error);
        }
        
        setInitialized(true);
      };
      
      initializeValues();
    }
  }, [parentTypes, initialized]); // Run when parent types load or initialization state changes

  // Simple child types loading when parent changes
  useEffect(() => {
    if (selectedParent) {
      fetchChildTypes(selectedParent);
    } else {
      setChildTypes([]);
      setSelectedChild(null);
      setSelectedChildData(null);
    }
  }, [selectedParent]);

  // NUCLEAR UUID MONITORING - Every 25ms!
  useEffect(() => {
    if (selectedChild || form.getFieldValue('type_of_business_id')) {
      const checkValue = selectedChild || form.getFieldValue('type_of_business_id');
      console.log('🚀 NUCLEAR MONITORING - Starting for:', checkValue);
      
      let checkCount = 0;
      const intervalId = setInterval(() => {
        const selectElement = document.querySelector(`[id*="type_of_business_id"]`);
        const displayText = selectElement?.querySelector('.ant-select-selection-item')?.textContent;
        
        checkCount++;
        console.log(`🚀 NUCLEAR MONITORING - Check #${checkCount}:`, displayText);
        
        if (displayText && displayText.includes('-') && displayText.length > 20) {
          console.log('🚀🔥 NUCLEAR MONITORING - UUID DETECTED! ELIMINATING:', displayText);
          
          // Find correct child data
          const correctChild = childTypes.find(c => c.id === checkValue);
          if (correctChild) {
            console.log('🚀🔥 NUCLEAR MONITORING - Fixing with:', correctChild.name);
            setFormValueOverride({
              value: checkValue,
              label: correctChild.name
            });
            setDisplayName(correctChild.name);
          } else {
            // If childTypes not loaded, fetch the data directly
            console.log('🚀🔥 NUCLEAR MONITORING - Child not in types, fetching directly');
            getBusinessTypeById(checkValue).then(response => {
              const typeData = response?.data;
              if (typeData) {
                console.log('🚀🔥 NUCLEAR MONITORING - Direct fetch success:', typeData.name);
                setFormValueOverride({
                  value: checkValue,
                  label: typeData.name
                });
                setDisplayName(typeData.name);
              }
            }).catch(console.error);
          }
        }
      }, 25); // Check every 25ms - NUCLEAR SPEED
      
      // Clear after 5 seconds
      setTimeout(() => {
        console.log('🚀 NUCLEAR MONITORING - Stopping after 5 seconds');
        clearInterval(intervalId);
      }, 5000);
      
      return () => clearInterval(intervalId);
    }
  }, [selectedChild, childTypes, form.getFieldValue('type_of_business_id')]);

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
      setChildTypes(response?.data || []);
    } catch (error) {
      message.error('Failed to fetch child business types');
      setChildTypes([]);
    } finally {
      setChildLoading(false);
    }
  };

  const handleParentChange = (parentId) => {
    console.log('BULLETPROOF - Parent changed to:', parentId);
    setSelectedParent(parentId);
    setSelectedChild(null);
    setSelectedChildData(null);
    setDisplayName(''); // CLEAR DISPLAY NAME
    setFormValueOverride(null); // CLEAR FORM OVERRIDE
    
    // Update parent form field to sync with internal state
    form.setFieldValue('parent_type_of_business', parentId);
    
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
    console.log('BULLETPROOF - handleChildChange called with:', childId);
    setSelectedChild(childId);
    
    // Find the selected child data
    const childData = childTypes.find(child => child.id === childId);
    console.log('BULLETPROOF - Found child data:', childData);
    setSelectedChildData(childData);
    
    // SET EXPLICIT DISPLAY NAME AND FORM OVERRIDE
    if (childData) {
      setDisplayName(childData.name);
      setFormValueOverride({
        value: childId,
        label: childData.name
      });
      console.log('BULLETPROOF - Set displayName and formValueOverride:', childData.name);
    }

    // Set form values - store just the ID for the form field (for form submission)
    const formValues = {
      type_of_business_id: childId,
      type_of_business_detail: childData?.is_other ? (form.getFieldValue('type_of_business_detail') || '') : childData?.detail || null
    };
    
    console.log('BULLETPROOF - Setting form values:', formValues);
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

  // Helper function to get display value for selected child
  const getSelectedChildDisplay = () => {
    console.log('=== getSelectedChildDisplay called ===');
    console.log('selectedChild:', selectedChild);
    console.log('childTypes length:', childTypes.length);
    
    if (!selectedChild) {
      console.log('No selectedChild, returning undefined');
      return undefined;
    }
    
    if (!childTypes.length) {
      console.log('No childTypes loaded yet, returning selectedChild as string');
      return selectedChild;
    }
    
    const childObj = childTypes.find(child => child.id === selectedChild);
    console.log('getSelectedChildDisplay - found childObj:', childObj);
    
    if (childObj) {
      const displayValue = {
        value: selectedChild,
        label: childObj.name
      };
      console.log('Returning display value:', displayValue);
      return displayValue;
    } else {
      console.log('Child not found in childTypes, returning selectedChild as fallback');
      return selectedChild;
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
            onChange={handleParentChange}
            showSearch
            optionFilterProp="label"
            optionLabelProp="label"
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
            key={`child-select-${selectedParent}-${childTypes.length}-${selectedChild}-${displayName}`}
            placeholder={placeholder.child}
            allowClear
            loading={childLoading}
            disabled={disabled || !selectedParent}
            value={(() => {
              console.log('NUCLEAR VALUE CALC:', {
                selectedChild,
                displayName,
                formValueOverride,
                childTypesLength: childTypes.length
              });
              
              // NUCLEAR OPTION: Use formValueOverride if available
              if (formValueOverride) {
                console.log('NUCLEAR - Using formValueOverride:', formValueOverride);
                return formValueOverride;
              }
              
              // FALLBACK: Only show if we have both selectedChild and displayName
              if (selectedChild && displayName) {
                // Double check - NEVER show UUID-like strings
                if (displayName.includes('-') && displayName.length > 20) {
                  console.log('NUCLEAR - displayName looks like UUID, BLOCKING:', displayName);
                  return undefined;
                }
                
                const result = {
                  value: selectedChild,
                  label: displayName + (selectedChildData?.is_other ? ' (Custom)' : '')
                };
                console.log('NUCLEAR - Returning fallback value:', result);
                return result;
              }
              
              console.log('NUCLEAR - No valid value, returning undefined');
              return undefined;
            })()}
            onChange={(selected) => {
              const childId = selected?.value || selected;
              console.log('NUCLEAR - Select onChange:', selected, 'childId:', childId);
              handleChildChange(childId);
            }}
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) => {
              const label = option.label || '';
              return label.toString().toLowerCase().includes(input.toLowerCase());
            }}
            notFoundContent={childLoading ? 'Loading...' : 'No data'}
            labelInValue={true}
            dropdownRender={(menu) => {
              console.log('NUCLEAR Dropdown render:', {
                selectedChild,
                displayName,
                formValueOverride,
                childTypes: childTypes.map(c => ({ id: c.id, name: c.name }))
              });
              return menu;
            }}
          >
            {childTypes.map(child => {
              console.log('Rendering child option:', child.id, child.name);
              const optionLabel = `${child.name}${child.is_other ? ' (Custom)' : ''}`;
              return (
                <Option 
                  key={child.id} 
                  value={child.id}
                  label={optionLabel}
                >
                  {optionLabel}
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
