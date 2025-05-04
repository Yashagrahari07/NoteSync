import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${BASE_URL}/users`;

export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/login`, { email, password });
  const { token } = response.data;

  Cookies.set('authToken', token, { expires: 1 });

  return response.data;
};

export const signup = async (fullname, email, password) => {
  const response = await axios.post(`${API_URL}/register`, { fullname, email, password });
  return response.data;
};

export const logout = async () => {
  const token = Cookies.get('authToken');
  Cookies.remove('authToken');

  const response = await axios.get(`${API_URL}/logout`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,
  });

  return response.data;
};