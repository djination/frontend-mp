import axios from 'axios'
const baseURL = import.meta.env.VITE_BASE_URL;
const axiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 10000,
})

axiosInstance.interceptors.request.use(
  config => {
    console.log('=== Axios Request Interceptor ===');
    console.log('Request URL:', config.baseURL + config.url);
    console.log('Request Method:', config.method);
    console.log('Request Data:', config.data);
    
    const accessToken = localStorage.getItem('token')
    console.log('Token from localStorage:', accessToken ? 'Present' : 'Not found');
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
      console.log('Authorization header set');
    } else {
      console.log('No token found, skipping Authorization header');
    }
    
    console.log('Final request headers:', config.headers);
    return config
  },
  error => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error)
  }
)

// Add response interceptor for debugging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('=== Axios Response Interceptor (Success) ===');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    return response;
  },
  async (error) => {
    console.error('=== Axios Response Interceptor (Error) ===');
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    console.error('Error config:', error.config);
    
    if (error.response?.status === 401) {
      console.log('401 detected, removing token...');
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// Temporary auto-login for testing
const autoLoginForTesting = async () => {
  try {
    if (!localStorage.getItem('token')) {
      const response = await axios.post('http://localhost:5000/auth/login', {
        username: 'superadmin',
        password: '@Dm1n123!!'
      });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        console.log('Auto-login successful for testing');
      }
    }
  } catch (error) {
    console.error('Auto-login failed:', error);
  }
};

// Execute auto-login immediately
autoLoginForTesting();

export default axiosInstance