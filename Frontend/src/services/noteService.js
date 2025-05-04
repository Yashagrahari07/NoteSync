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

export const getNoteById = async (noteId) => {
  const token = Cookies.get('authToken');
  const response = await axios.get(`${API_URL}/${noteId}`, {
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

export const deleteNote = async (noteId) => {
  const token = Cookies.get('authToken');
  const response = await axios.delete(`${API_URL}/${noteId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,
  });
  return response.data;
};

export const addCollaborator = async (noteId, email) => {
  const token = Cookies.get('authToken');
  const response = await axios.post(`${API_URL}/${noteId}/collaborators`, { email }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,
  });
  return response.data;
};