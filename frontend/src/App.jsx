import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Customize from './pages/Customize'
import { userDataContext } from './context/UserContext'
import Home from './pages/Home'
import Customize2 from './pages/Customize2'
import Landing from './pages/Landing'
import LandingFromFramer from './pages/LandingFromFramer'
import Settings from './pages/Settings'
import { Toaster } from 'react-hot-toast';
import { PopupProvider } from './context/PopupContext'
import PopupContainer from './components/Popup/Popup'

function App() {
  const {userData,setUserData}=useContext(userDataContext)
  return (
    <PopupProvider>
      <Toaster position="top-center" />
      <PopupContainer />
   <Routes>
      <Route path='/' element={!userData ? <Landing /> : (userData?.assistantImage && userData?.assistantName) ? <Home /> : <Navigate to="/customize" />} />
      <Route path='/framer' element={<LandingFromFramer />} />
      <Route path='/signup' element={!userData ? <SignUp /> : <Navigate to="/" />} />
      <Route path='/signin' element={!userData ? <SignIn /> : <Navigate to="/" />} />
      <Route path='/customize' element={userData ? <Customize /> : <Navigate to="/signup" />} />
      <Route path='/customize2' element={userData ? <Customize2 /> : <Navigate to="/signup" />} />
      <Route path='/settings' element={userData ? <Settings /> : <Navigate to="/signup" />} />
      <Route path='/home' element={userData ? <Home /> : <Navigate to="/signup" />} />
   </Routes>
   </PopupProvider>
  )
}

export default App
