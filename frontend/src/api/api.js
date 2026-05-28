import axios from 'axios';

// IMPORTANT: replace with your Render backend URL
const api = axios.create({
  baseURL: 'https://team-task-manager-api-mvlu.onrender.com',
  withCredentials: true
});

export default api;