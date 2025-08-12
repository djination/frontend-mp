import axios from 'axios'
const baseURL = import.meta.env.VITE_API_BASE_URL;
const axiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 10000,
})

axiosInstance.interceptors.request.use(
  config => {
    const accessToken = localStorage.getItem('token')
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    } else {
      console.log('No token found, skipping Authorization header');
    }
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
    return response;
  },
  async (error) => {
    console.error('=== Axios Response Interceptor (Error) ===');
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    console.error('Error config:', error.config);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance