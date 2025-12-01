import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Customize from './pages/Customize'
import { userDataContext } from './context/UserContext'
import Home from './pages/Home'
import GeminiChat from './pages/GeminiChat'
import Customize2 from './pages/Customize2'
import Landing from './pages/Landing'
import LandingFromFramer from './pages/LandingFromFramer'
import Settings from './pages/Settings'
import { Toaster } from 'react-hot-toast';
import { PopupProvider } from './context/PopupContext'
import { ChatProvider } from './context/ChatContext'
import PopupContainer from './components/Popup/Popup'

function App() {
  const { userData, setUserData, loading } = useContext(userDataContext)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <ChatProvider>
      <PopupProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
          containerStyle={{
            top: 20,
            right: 20,
          }}
          limit={1}
        />
        <PopupContainer />
        <Routes>
          <Route path='/' element={!userData ? <Landing /> : (userData?.assistantImage && userData?.assistantName) ? <GeminiChat /> : <Navigate to="/customize" />} />
          <Route path='/framer' element={<LandingFromFramer />} />
          <Route path='/signup' element={!userData ? <SignUp /> : <Navigate to="/" />} />
          <Route path='/signin' element={!userData ? <SignIn /> : <Navigate to="/" />} />
          <Route path='/customize' element={userData ? <Customize /> : <Navigate to="/signup" />} />
          <Route path='/customize2' element={userData ? <Customize2 /> : <Navigate to="/signup" />} />
          <Route path='/settings' element={userData ? <Settings /> : <Navigate to="/signup" />} />
          <Route path='/chat' element={userData ? <GeminiChat /> : <Navigate to="/signup" />} />
          <Route path='/home' element={userData ? <Home /> : <Navigate to="/signup" />} />
        </Routes>
      </PopupProvider>
    </ChatProvider>
  )
}

export default App
