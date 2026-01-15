import React, { useContext, Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { userDataContext } from "./context/UserContext";
import { Toaster } from "react-hot-toast";
import { PopupProvider } from "./context/PopupContext";
import { ChatProvider } from "./context/ChatContext";
import PopupContainer from "./components/Popup/Popup";
import GlobalCommandHandler from "./components/GlobalCommandHandler";
import Features from "./components/Features";
import DevicePairingModal from './components/DevicePairing/DevicePairingModal';
import BluetoothButton from './components/BluetoothButton';

/* Lazy Pages */
const SignUp = lazy(() => import("./pages/SignUp"));
const SignIn = lazy(() => import("./pages/SignIn"));
const Customize = lazy(() => import("./pages/Customize"));
const Customize2 = lazy(() => import("./pages/Customize2"));
const GeminiChat = lazy(() => import("./pages/GeminiChat"));
const LandingColorBends = lazy(() => import("./pages/LandingColorBends"));
const LandingFromFramer = lazy(() => import("./pages/LandingFromFramer"));
const Settings = lazy(() => import("./pages/Settings"));
const Home = lazy(() => import("./pages/Home"));

function App() {
  const { userData, loading } = useContext(userDataContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <ChatProvider>
      <PopupProvider>
        <GlobalCommandHandler />

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              borderRadius: "12px",
              fontSize: "14px",
            },
          }}
        />

        <PopupContainer />

        {/* Device Pairing Modal - Voice Activated */}
        <DevicePairingModal />

        {/* Bluetooth Quick Access Button - Only show when logged in */}
        {userData && <BluetoothButton />}

        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
            </div>
          }
        >
          <Routes>
            <Route
              path="/"
              element={
                !userData ? (
                  <LandingColorBends />
                ) : userData?.assistantImage && userData?.assistantName ? (
                  <Home />
                ) : (
                  <Navigate to="/customize" />
                )
              }
            />

            <Route path="/signup" element={!userData ? <SignUp /> : <Navigate to="/" />} />
            <Route path="/signin" element={!userData ? <SignIn /> : <Navigate to="/" />} />

            <Route path="/customize" element={userData ? <Customize /> : <Navigate to="/signup" />} />
            <Route path="/customize2" element={userData ? <Customize2 /> : <Navigate to="/signup" />} />

            <Route path="/chat" element={userData ? <GeminiChat /> : <Navigate to="/signin" />} />
            <Route path="/home" element={userData ? <Home /> : <Navigate to="/signin" />} />
            <Route path="/settings" element={userData ? <Settings /> : <Navigate to="/signin" />} />

            <Route path="/framer" element={<LandingFromFramer />} />
            <Route path="/features" element={<Features />} />
          </Routes>
        </Suspense>
      </PopupProvider>
    </ChatProvider>
  );
}

export default App;
