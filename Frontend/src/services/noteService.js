import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = 'http://localhost:3000/notes';

export const getAllNotes = async () => {
  const token = Cookies.get('authToken');
  const response = await axios.get(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,
  });
  return response.data;
};

export const createNote = async () => {
  const token = Cookies.get('authToken');
  const response = await axios.post(API_URL, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,
  });
  return response.data;
};