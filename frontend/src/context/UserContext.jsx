import axios from 'axios'
import React, { createContext, useEffect, useState } from 'react'
export const userDataContext = createContext()
function UserContext({ children }) {
  const serverUrl = import.meta.env.MODE === "production"
    ? "https://orvion.onrender.com"
    : "http://localhost:8000";
  const [userData, setUserData] = useState(null)
  const [frontendImage, setFrontendImage] = useState(null)
  const [backendImage, setBackendImage] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [loading, setLoading] = useState(true);

  const handleCurrentUser = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/user/current`, { withCredentials: true });
      setUserData(result.data);
      console.log(result.data);
    } catch (error) {
      // 401 Unauthorized is expected when user is not logged in
      if (error.response?.status === 401) {
        console.log('User not authenticated');
        setUserData(null);
      } else {
        console.error('Error fetching user data:', error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const getGeminiResponse = async (command) => {
    try {
      const result = await axios.post(`${serverUrl}/api/user/asktoassistant`, { command }, { withCredentials: true })
      return result.data
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      // Return error response instead of undefined
      return {
        success: false,
        response: error.response?.data?.message || 'Sorry, I encountered an error. Please try again.',
        error: error.message
      };
    }
  }

  useEffect(() => {
    handleCurrentUser()
  }, [])
  const value = {
    serverUrl, userData, setUserData, backendImage, setBackendImage, frontendImage, setFrontendImage, selectedImage, setSelectedImage, getGeminiResponse, loading
  }
  return (
    <div>
      <userDataContext.Provider value={value}>
        {children}
      </userDataContext.Provider>
    </div>
  )
}

export default UserContext
