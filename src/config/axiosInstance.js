import axios from 'axios'

// Fallback untuk production build
const getBaseURL = () => {
  // Priority: env var > production default > localhost
  const envURL = import.meta.env.VITE_API_BASE_URL;
  const prodURL = 'https://bc.merahputih-id.com';  // Backend production
  const devURL = 'http://localhost:5000';
  
  if (envURL) {
    console.log('🔍 Using env URL:', envURL);
    return envURL;
  }
  
  // Check if we're in production
  if (import.meta.env.PROD) {
    console.log('🔍 Using production URL:', prodURL);
    return prodURL;
  }
  
  console.log('🔍 Using development URL:', devURL);
  return devURL;
};

const baseURL = getBaseURL();

console.log('🔍 [DEBUG] Axios baseURL resolved:', baseURL);
console.log('🔍 [DEBUG] Environment info:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_BASE_URL: import.meta.env.VITE_BASE_URL,
  VITE_ENV: import.meta.env.VITE_ENV,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD
});

const axiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 10000,
})

axiosInstance.interceptors.request.use(
  config => {
    console.log('🔍 [DEBUG] Making request to:', config.url);
    console.log('🔍 [DEBUG] Full URL will be:', config.baseURL + config.url);
    
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