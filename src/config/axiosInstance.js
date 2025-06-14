import axios from 'axios'
const baseURL = import.meta.env.VITE_BASE_URL;
const axiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 10000,
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
    return Promise.reject(error)
  }
)

export default axiosInstance