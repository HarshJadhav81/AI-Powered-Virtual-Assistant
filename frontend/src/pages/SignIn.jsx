import React, { useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { IoEye, IoEyeOff } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { userDataContext } from '../context/UserContext';
import axios from "axios";

function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const { serverUrl, setUserData } = useContext(userDataContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      let result = await axios.post(`${serverUrl}/api/auth/signin`, {
        email, password
      }, { withCredentials: true });
      setUserData(result.data);
      setLoading(false);
      navigate("/");
    } catch (error) {
      console.log(error);
      setUserData(null);
      setLoading(false);
      setErr(error.response.data.message);
    }
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: '#073A4C',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        onSubmit={handleSignIn}
        style={{
          width: '100%',
          maxWidth: '450px',
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '50px 40px',
          boxShadow: '0 10px 60px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 700,
            color: '#FFFFFF',
            marginBottom: '12px',
            fontFamily: "'Anton', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
          }}>
            SIGN IN
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: 400
          }}>
            Welcome back to <span style={{ color: '#FFFFFF', fontWeight: 600 }}>ORVION</span>
          </p>
        </div>

        {/* Email Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '8px'
          }}>
            Email
          </label>
          <input
            type="email"
            placeholder='Enter your email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              height: '52px',
              padding: '0 18px',
              fontSize: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              outline: 'none',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              transition: 'all 0.3s'
            }}
            onFocus={(e) => {
              e.target.style.border = '1px solid rgba(255, 255, 255, 0.4)';
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onBlur={(e) => {
              e.target.style.border = '1px solid rgba(255, 255, 255, 0.2)';
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          />
        </div>

        {/* Password Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '8px'
          }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder='Enter your password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                height: '52px',
                padding: '0 52px 0 18px',
                fontSize: '16px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                outline: 'none',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => {
                e.target.style.border = '1px solid rgba(255, 255, 255, 0.4)';
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {showPassword ?
                <IoEyeOff style={{ width: '22px', height: '22px', color: 'rgba(255, 255, 255, 0.6)' }} /> :
                <IoEye style={{ width: '22px', height: '22px', color: 'rgba(255, 255, 255, 0.6)' }} />
              }
            </button>
          </div>
        </div>

        {/* Error Message */}
        {err.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '14px 18px',
              background: 'rgba(255, 59, 48, 0.15)',
              border: '1px solid rgba(255, 59, 48, 0.3)',
              borderRadius: '12px',
              marginBottom: '24px'
            }}
          >
            <p style={{ fontSize: '14px', color: '#FF6B6B', fontWeight: 500, margin: 0 }}>
              {err}
            </p>
          </motion.div>
        )}

        {/* Sign In Button */}
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          style={{
            width: '100%',
            height: '52px',
            background: loading ? 'rgba(255, 255, 255, 0.4)' : '#FFFFFF',
            color: '#073A4C',
            fontSize: '17px',
            fontWeight: 700,
            border: 'none',
            borderRadius: '50px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '10px',
            transition: 'all 0.3s',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: '0 8px 30px rgba(255, 255, 255, 0.2)'
          }}
        >
          {loading ? "Signing In..." : "Sign In"}
        </motion.button>

        {/* Sign Up Link */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
            Don't have an account?{' '}
            <span
              onClick={() => navigate("/signup")}
              style={{
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Sign Up
            </span>
          </p>
        </div>
      </motion.form>
    </div>
  );
}

export default SignIn;