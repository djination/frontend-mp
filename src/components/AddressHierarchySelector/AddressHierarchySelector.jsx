import React, { useState, useEffect, useCallback } from 'react';
import { Select, Row, Col, Spin } from 'antd';
import { 
  getCountries, 
  getProvincesByCountry, 
  getCitiesByProvince, 
  getDistrictsByCity, 
  getSubDistrictsByDistrict, 
  getPostalCodes 
} from '../../api/accountAddressApi';

const { Option } = Select;

const AddressHierarchySelector = ({ 
  value = {}, 
  onChange, 
  disabled = false,
  required = false,
  style = {}
}) => {
  const [loading, setLoading] = useState({
    countries: false,
    provinces: false,
    cities: false,
    districts: false,
    subDistricts: false,
    postalCodes: false
  });

  const [options, setOptions] = useState({
    countries: [],
    provinces: [],
    cities: [],
    districts: [],
    subDistricts: [],
    postalCodes: []
  });

  const [selectedValues, setSelectedValues] = useState({
    country: value.country || '',
    province: value.province || '',
    city: value.city || '',
    district: value.district || '',
    subDistrict: value.sub_district || value.subDistrict || '',
    postalCode: value.postal_code || value.postalcode || ''
  });

  // Load countries on component mount
  useEffect(() => {
    loadCountries();
  }, []);

  // Update selected values when value prop changes
  useEffect(() => {
    setSelectedValues({
      country: value.country || '',
      province: value.province || '',
      city: value.city || '',
      district: value.district || '',
      subDistrict: value.sub_district || value.subDistrict || '',
      postalCode: value.postal_code || value.postalcode || ''
    });
  }, [value]);

  // Load data when dependencies change
  useEffect(() => {
    if (selectedValues.country) {
      loadProvinces(selectedValues.country);
    }
  }, [selectedValues.country]);

  useEffect(() => {
    if (selectedValues.country && selectedValues.province) {
      loadCities(selectedValues.province, selectedValues.country);
    }
  }, [selectedValues.country, selectedValues.province]);

  useEffect(() => {
    if (selectedValues.country && selectedValues.province && selectedValues.city) {
      loadDistricts(selectedValues.city, selectedValues.province, selectedValues.country);
    }
  }, [selectedValues.country, selectedValues.province, selectedValues.city]);

  useEffect(() => {
    if (selectedValues.country && selectedValues.province && selectedValues.city && selectedValues.district) {
      loadSubDistricts(selectedValues.district, selectedValues.city, selectedValues.province, selectedValues.country);
    }
  }, [selectedValues.country, selectedValues.province, selectedValues.city, selectedValues.district]);

  useEffect(() => {
    if (selectedValues.country && selectedValues.province && selectedValues.city && selectedValues.district && selectedValues.subDistrict) {
      loadPostalCodes(selectedValues.subDistrict, selectedValues.district, selectedValues.city, selectedValues.province, selectedValues.country);
    }
  }, [selectedValues.country, selectedValues.province, selectedValues.city, selectedValues.district, selectedValues.subDistrict]);

  const setLoadingState = (key, state) => {
    setLoading(prev => ({ ...prev, [key]: state }));
  };

  const setOptionsState = (key, data) => {
    setOptions(prev => ({ ...prev, [key]: data }));
  };

  const loadCountries = useCallback(async () => {
    try {
      setLoadingState('countries', true);
      const response = await getCountries();
      
      if (response && response.data) {
        const countries = Array.isArray(response.data) ? response.data : [];
        // Extract country names from objects
        const countryNames = countries.map(item => item.country || item);
        setOptionsState('countries', countryNames);
      }
    } catch (error) {
      console.error('Error loading countries:', error);
      setOptionsState('countries', []);
    } finally {
      setLoadingState('countries', false);
    }
  }, []);

  const loadProvinces = useCallback(async (country) => {
    if (!country) return;
    
    try {
      setLoadingState('provinces', true);
      const response = await getProvincesByCountry(country);
      
      if (response && response.data) {
        const provinces = Array.isArray(response.data) ? response.data : [];
        // Extract province names from objects
        const provinceNames = provinces.map(item => item.province || item);
        setOptionsState('provinces', provinceNames);
      }
    } catch (error) {
      console.error('Error loading provinces:', error);
      setOptionsState('provinces', []);
    } finally {
      setLoadingState('provinces', false);
    }
  }, []);

  const loadCities = useCallback(async (province, country) => {
    if (!province || !country) return;
    
    try {
      setLoadingState('cities', true);
      const response = await getCitiesByProvince(province, country);
      
      if (response && response.data) {
        const cities = Array.isArray(response.data) ? response.data : [];
        // Extract city names from objects
        const cityNames = cities.map(item => item.city || item);
        setOptionsState('cities', cityNames);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
      setOptionsState('cities', []);
    } finally {
      setLoadingState('cities', false);
    }
  }, []);

  const loadDistricts = useCallback(async (city, province, country) => {
    if (!city || !province || !country) return;
    
    try {
      setLoadingState('districts', true);
      const response = await getDistrictsByCity(city, province, country);
      
      if (response && response.data) {
        const districts = Array.isArray(response.data) ? response.data : [];
        // Extract district names from objects
        const districtNames = districts.map(item => item.district || item);
        setOptionsState('districts', districtNames);
      }
    } catch (error) {
      console.error('Error loading districts:', error);
      setOptionsState('districts', []);
    } finally {
      setLoadingState('districts', false);
    }
  }, []);

  const loadSubDistricts = useCallback(async (district, city, province, country) => {
    if (!district || !city || !province || !country) return;
    
    try {
      setLoadingState('subDistricts', true);
      const response = await getSubDistrictsByDistrict(district, city, province, country);
      
      if (response && response.data) {
        const subDistricts = Array.isArray(response.data) ? response.data : [];
        // Extract sub district names from objects
        const subDistrictNames = subDistricts.map(item => item.sub_district || item);
        setOptionsState('subDistricts', subDistrictNames);
      }
    } catch (error) {
      console.error('Error loading sub districts:', error);
      setOptionsState('subDistricts', []);
    } finally {
      setLoadingState('subDistricts', false);
    }
  }, []);

  const loadPostalCodes = useCallback(async (subDistrict, district, city, province, country) => {
    if (!subDistrict || !district || !city || !province || !country) return;
    
    try {
      setLoadingState('postalCodes', true);
      const response = await getPostalCodes(subDistrict, district, city, province, country);
      
      if (response && response.data) {
        const postalCodes = Array.isArray(response.data) ? response.data : [];
        // Extract postal codes from objects
        const postalCodeValues = postalCodes.map(item => item.postal_code || item);
        setOptionsState('postalCodes', postalCodeValues);
        
        // If only one postal code, auto select it
        if (postalCodeValues.length === 1) {
          const newValues = { ...selectedValues, postalCode: postalCodeValues[0] };
          setSelectedValues(newValues);
          
          if (onChange) {
            onChange({
              country: newValues.country,
              province: newValues.province,
              city: newValues.city,
              district: newValues.district,
              sub_district: newValues.subDistrict,
              postal_code: newValues.postalCode
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading postal codes:', error);
      setOptionsState('postalCodes', []);
    } finally {
      setLoadingState('postalCodes', false);
    }
  }, [selectedValues, onChange]);

  const handleChange = (field, value) => {
    const newValues = { ...selectedValues };
    
    // Clear dependent fields when parent changes
    if (field === 'country') {
      newValues.province = '';
      newValues.city = '';
      newValues.district = '';
      newValues.subDistrict = '';
      newValues.postalCode = '';
      setOptionsState('provinces', []);
      setOptionsState('cities', []);
      setOptionsState('districts', []);
      setOptionsState('subDistricts', []);
      setOptionsState('postalCodes', []);
    } else if (field === 'province') {
      newValues.city = '';
      newValues.district = '';
      newValues.subDistrict = '';
      newValues.postalCode = '';
      setOptionsState('cities', []);
      setOptionsState('districts', []);
      setOptionsState('subDistricts', []);
      setOptionsState('postalCodes', []);
    } else if (field === 'city') {
      newValues.district = '';
      newValues.subDistrict = '';
      newValues.postalCode = '';
      setOptionsState('districts', []);
      setOptionsState('subDistricts', []);
      setOptionsState('postalCodes', []);
    } else if (field === 'district') {
      newValues.subDistrict = '';
      newValues.postalCode = '';
      setOptionsState('subDistricts', []);
      setOptionsState('postalCodes', []);
    } else if (field === 'subDistrict') {
      newValues.postalCode = '';
      setOptionsState('postalCodes', []);
    }
    
    newValues[field] = value;
    setSelectedValues(newValues);
    
    // Notify parent component
    if (onChange) {
      onChange({
        country: newValues.country,
        province: newValues.province,
        city: newValues.city,
        district: newValues.district,
        sub_district: newValues.subDistrict,
        postal_code: newValues.postalCode
      });
    }
  };

  return (
    <div style={style}>
      <Row gutter={16}>
        <Col span={12}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Country {required && <span style={{ color: 'red' }}>*</span>}
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Select Country"
              value={selectedValues.country || undefined}
              onChange={(value) => handleChange('country', value)}
              disabled={disabled}
              loading={loading.countries}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {options.countries.map((country) => (
                <Option key={country} value={country}>
                  {country}
                </Option>
              ))}
            </Select>
          </div>
        </Col>
        
        <Col span={12}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Province {required && <span style={{ color: 'red' }}>*</span>}
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Select Province"
              value={selectedValues.province || undefined}
              onChange={(value) => handleChange('province', value)}
              disabled={disabled || !selectedValues.country}
              loading={loading.provinces}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {options.provinces.map((province) => (
                <Option key={province} value={province}>
                  {province}
                </Option>
              ))}
            </Select>
          </div>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              City {required && <span style={{ color: 'red' }}>*</span>}
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Select City"
              value={selectedValues.city || undefined}
              onChange={(value) => handleChange('city', value)}
              disabled={disabled || !selectedValues.province}
              loading={loading.cities}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {options.cities.map((city) => (
                <Option key={city} value={city}>
                  {city}
                </Option>
              ))}
            </Select>
          </div>
        </Col>

        <Col span={12}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              District {required && <span style={{ color: 'red' }}>*</span>}
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Select District"
              value={selectedValues.district || undefined}
              onChange={(value) => handleChange('district', value)}
              disabled={disabled || !selectedValues.city}
              loading={loading.districts}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {options.districts.map((district) => (
                <Option key={district} value={district}>
                  {district}
                </Option>
              ))}
            </Select>
          </div>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Sub District {required && <span style={{ color: 'red' }}>*</span>}
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Select Sub District"
              value={selectedValues.subDistrict || undefined}
              onChange={(value) => handleChange('subDistrict', value)}
              disabled={disabled || !selectedValues.district}
              loading={loading.subDistricts}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {options.subDistricts.map((subDistrict) => (
                <Option key={subDistrict} value={subDistrict}>
                  {subDistrict}
                </Option>
              ))}
            </Select>
          </div>
        </Col>

        <Col span={12}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Postal Code {required && <span style={{ color: 'red' }}>*</span>}
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Select Postal Code"
              value={selectedValues.postalCode || undefined}
              onChange={(value) => handleChange('postalCode', value)}
              disabled={disabled || !selectedValues.subDistrict}
              loading={loading.postalCodes}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {options.postalCodes.map((postalCode) => (
                <Option key={postalCode} value={postalCode}>
                  {postalCode}
                </Option>
              ))}
            </Select>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default AddressHierarchySelector;
