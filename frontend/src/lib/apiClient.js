import axios from 'axios'

const normalizeBaseUrl = (value) => {
  const trimmed = value?.trim()
  if (!trimmed) {
    return 'http://localhost:8080/api'
  }

  return trimmed.endsWith('/api') ? trimmed : `${trimmed.replace(/\/$/, '')}/api`
}

const apiClient = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_URL),
  timeout: 15000,
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Request failed'

    return Promise.reject(new Error(message))
  },
)

export const fetchApplications = async (params = {}) => {
  const response = await apiClient.get('/applications', { params })
  return response.data
}

export const submitApplication = async (payload) => {
  const response = await apiClient.post('/applications', payload)
  return response.data
}

export const processApplication = async (applicationId, payload) => {
  const response = await apiClient.post(`/applications/${applicationId}/approve`, payload)
  return response.data
}

export default apiClient
