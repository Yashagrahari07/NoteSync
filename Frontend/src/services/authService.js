import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = 'http://localhost:3000';

export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/users/login`, { email, password });
  const { token } = response.data;

  Cookies.set('authToken', token, { expires: 1 });

  return response.data;
};

export const signup = async (fullname, email, password) => {
  const response = await axios.post(`${API_URL}/users/register`, { fullname, email, password });
  return response.data;
};

export const logout = async () => {
  Cookies.remove('authToken');
  const response = await axios.get(`${API_URL}/users/logout`);
  return response.data;
};