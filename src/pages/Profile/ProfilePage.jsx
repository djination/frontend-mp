import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Input, Button, Spin, message, Tabs, Row, Col, Avatar, Divider 
} from 'antd';
import { UserOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons';
import { getUserProfile, updateUserProfile, changePassword } from '../../api/profileApi';
import { useAuth } from '../../components/AuthContext'; // Assuming you have an auth context

const { TabPane } = Tabs;

const ProfilePage = () => {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const { user } = useAuth(); // If you have user data in auth context

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await getUserProfile();
      if (response && response.data) {
        setProfileData(response.data);
        profileForm.setFieldsValue({
          username: response.data.username,
          email: response.data.email,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          phoneNumber: response.data.phoneNumber,
          position: response.data.position
        });
      }
    } catch (error) {
      message.error('Failed to fetch profile data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (values) => {
    setLoading(true);
    try {
      const updateData = {
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          phoneNumber: values.phoneNumber,
          position: values.position
      };
      const response = await updateUserProfile(updateData);
      message.success('Profile updated successfully');
      // Update profile data with response
      if (response) {
        setProfileData(response);
      } else {
        // If no response, refresh data from server
        fetchUserProfile();
      }
    } catch (error) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to update profile');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (error) {
      if (error.response?.status === 401) {
        message.error('Current password is incorrect');
      } else if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to change password');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card title="User Profile" loading={loading && !profileData}>
        <Spin spinning={loading && profileData !== null}>
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={8} md={6}>
              <div className="text-center">
                <Avatar 
                  size={120} 
                  icon={<UserOutlined />}
                />
                <h2 className="mt-4 mb-0">{profileData?.firstName} {profileData?.lastName}</h2>
                <p className="text-gray-500">{profileData?.position}</p>
              </div>
            </Col>
            <Col xs={24} sm={16} md={18}>
              <Tabs defaultActiveKey="1">
                <TabPane tab="Profile Information" key="1">
                  <Form
                    form={profileForm}
                    layout="vertical"
                    onFinish={handleProfileUpdate}
                  >
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="username"
                          label="Username"
                        >
                          <Input disabled />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="email"
                          label="Email"
                          rules={[
                            { type: 'email', message: 'Please enter valid email' }
                          ]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="firstName"
                          label="First Name"
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="lastName"
                          label="Last Name"
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="phoneNumber"
                      label="Phone Number"
                    >
                      <Input />
                    </Form.Item>

                    <Form.Item
                      name="position"
                      label="Position"
                    >
                      <Input />
                    </Form.Item>

                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        icon={<SaveOutlined />}
                      >
                        Update Profile
                      </Button>
                    </Form.Item>
                  </Form>
                </TabPane>
                <TabPane tab="Change Password" key="2">
                  <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handlePasswordChange}
                  >
                    <Form.Item
                      name="currentPassword"
                      label="Current Password"
                      rules={[{ required: true, message: 'Please input your current password' }]}
                    >
                      <Input.Password 
                        prefix={<LockOutlined />} 
                        placeholder="Current Password" 
                      />
                    </Form.Item>

                    <Form.Item
                      name="newPassword"
                      label="New Password"
                      rules={[
                        { required: true, message: 'Please input your new password' },
                        { min: 6, message: 'Password must be at least 6 characters' }
                      ]}
                    >
                      <Input.Password 
                        prefix={<LockOutlined />} 
                        placeholder="New Password" 
                      />
                    </Form.Item>

                    <Form.Item
                      name="confirmPassword"
                      label="Confirm New Password"
                      rules={[
                        { required: true, message: 'Please confirm your new password' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('The two passwords do not match'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password 
                        prefix={<LockOutlined />} 
                        placeholder="Confirm New Password" 
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        icon={<SaveOutlined />}
                      >
                        Change Password
                      </Button>
                    </Form.Item>
                  </Form>
                </TabPane>
              </Tabs>
            </Col>
          </Row>
        </Spin>
      </Card>
    </div>
  );
};

export default ProfilePage;