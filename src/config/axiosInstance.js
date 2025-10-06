import axios from 'axios'

// Fallback untuk production build
const getBaseURL = () => {
  // Priority: env var > production default > localhost
  const envURL = import.meta.env.VITE_API_BASE_URL;
  const prodURL = 'https://bc.merahputih-id.com';  // Backend production
  const devURL = 'http://localhost:5000';
  
  if (envURL) {
    return envURL;
  }
  
  // Check if we're in production
  if (import.meta.env.PROD) {
    return prodURL;
  }
  return devURL;
};

const baseURL = getBaseURL();

const axiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 120000, // Increased to 2 minutes for bulk operations and customer sync
})

axiosInstance.interceptors.request.use(
  config => {    
    const accessToken = localStorage.getItem('token')
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
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