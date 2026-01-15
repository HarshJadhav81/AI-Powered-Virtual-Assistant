import React, { useContext, useRef } from 'react';
import { motion } from 'framer-motion';
import Card from '../components/Card';
import image1 from "../assets/image1.png";
import image2 from "../assets/image2.jpg";
import image3 from "../assets/authBg.png";
import image4 from "../assets/image4.png";
import image5 from "../assets/image5.png";
import image6 from "../assets/image6.jpeg";
import image7 from "../assets/image7.jpeg";
import { RiImageAddLine } from "react-icons/ri";
import { userDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { MdKeyboardBackspace } from "react-icons/md";

function Customize() {
  const {
    backendImage,
    setBackendImage,
    frontendImage,
    setFrontendImage,
    selectedImage,
    setSelectedImage
  } = useContext(userDataContext);

  const navigate = useNavigate();
  const inputImage = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];
    setBackendImage(file);
    setFrontendImage(URL.createObjectURL(file));
  };

  return (
    <div style={{
      width: "100%",
      minHeight: "100vh",
      background: "#073A4C",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      {/* Back Button */}
      <MdKeyboardBackspace
        size={28}
        onClick={() => navigate("/")}
        style={{
          position: 'absolute',
          top: '30px',
          left: '30px',
          cursor: 'pointer',
          color: '#FFFFFF'
        }}
      />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          width: '90%',
          maxWidth: '680px',
          maxHeight: '85vh',
          padding: '50px 40px',
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 10px 60px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflowY: 'auto'
        }}
      >
        {/* Heading */}
        <h1 style={{
          fontSize: '48px',
          fontWeight: 700,
          color: '#FFFFFF',
          marginBottom: '36px',
          textAlign: 'center',
          fontFamily: "'Anton', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.02em'
        }}>
          SELECT YOUR <span style={{ color: 'rgba(255,255,255,0.8)' }}>ASSISTANT</span>
        </h1>

        {/* Card Grid */}
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px'
        }}>
          <Card image={image1} />
          <Card image={image2} />
          <Card image={image3} />
          <Card image={image4} />
          <Card image={image5} />
          <Card image={image6} />
          <Card image={image7} />

          {/* Upload Card */}
          <motion.div
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            className={`w-[56px] h-[100px] lg:w-[120px] lg:h-[200px]
              rounded-2xl overflow-hidden cursor-pointer
              flex items-center justify-center
              transition-all duration-300
              ${selectedImage === "input" ? "border-4 border-white shadow-2xl" : "border-2 border-white/30"}
            `}
            style={{
              background: 'rgba(255, 255, 255, 0.1)'
            }}
            onClick={() => {
              inputImage.current.click();
              setSelectedImage("input");
            }}
          >
            {!frontendImage && (
              <RiImageAddLine className="text-white w-[24px] h-[24px]" />
            )}
            {frontendImage && (
              <img src={frontendImage} className="h-full w-full object-cover" alt="Custom" />
            )}
          </motion.div>

          <input
            type="file"
            accept="image/*"
            ref={inputImage}
            hidden
            onChange={handleImage}
          />
        </div>

        {/* Next Button */}
        {selectedImage && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/customize2")}
            style={{
              marginTop: '32px',
              minWidth: '280px',
              height: '52px',
              background: '#FFFFFF',
              color: '#073A4C',
              borderRadius: '50px',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '17px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 8px 30px rgba(255, 255, 255, 0.2)'
            }}
          >
            Next
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}

export default Customize;
