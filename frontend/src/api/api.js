import axios from 'axios';

const api = axios.create({
  baseURL: 'https://team-task-manager-api-mvlu.onrender.com',
  withCredentials: true
});

export default api;