import axios from 'axios';

// La URL base asume que el server Django corre en 8000.
const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchCompanies = async () => {
  const response = await apiClient.get('companies/');
  return response.data;
};

export const fetchMetrics = async (empresaId?: string) => {
  const url = empresaId ? `metrics/?empresa=${empresaId}` : 'metrics/';
  const response = await apiClient.get(url);
  return response.data;
};

export default apiClient;
