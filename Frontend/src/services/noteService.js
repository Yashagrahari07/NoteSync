import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${BASE_URL}/notes`;

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

export const togglePinNote = async (noteId) => {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("authToken="))
    ?.split("=")[1];

  const response = await axios.patch(`${API_URL}/${noteId}/pin`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};