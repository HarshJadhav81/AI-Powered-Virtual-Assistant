import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./LandingColorBends.css";
import herImage from "../assets/her.jpg";

export default function LandingColorBends() {
  const navigate = useNavigate();

  return (
    <div className="landing-wrapper">
      {/* Content Section */}
      <div className="content-section">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="hero-heading">
            ORVION
          </h1>
          <p className="hero-description">
            Your AI-powered virtual assistant that seamlessly executes tasks across apps and devices
          </p>
          <motion.button
            className="get-started-btn"
            onClick={() => navigate("/signin")}
            whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(255,255,255,0.3)" }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0, duration: 0.6 }}
          >
            Get Started
          </motion.button>
        </motion.div>
      </div>

      {/* Image Section */}
      <div className="image-container">
        <img src={herImage} alt="Hero" className="hero-img" />
      </div>
    </div>
  );
}
