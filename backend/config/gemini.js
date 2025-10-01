import axios from 'axios';

const geminiConfig = {
  baseURL: process.env.GEMINI_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  params: {
    key: process.env.GEMINI_API_KEY
  }
};

export const geminiAxios = axios.create(geminiConfig);