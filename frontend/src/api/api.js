import axios from 'axios';

// IMPORTANT: replace with your Render backend URL
const api = axios.create({
  baseURL: 'https://your-backend.onrender.com',
  withCredentials: true
});

export default api;