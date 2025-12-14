import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingColorBends() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const navItems = [
    { name: "Features", path: "./features" },
    { name: "Pricing", path: "/pricing" },
    { name: "Automation", path: "/automation" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: "auto", transition: { duration: 0.28 } },
    exit: { opacity: 0, height: 0, transition: { duration: 0.18 } },
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 ">
      

      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full bg-gray-200 shadow-sm relative overflow-hidden"
      >
        <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
          <div className="flex items-center max-w-screen-2xl justify-between pl-20 pr-20">

            {/* LOGO */}
            <div className="flex items-center justify-start pl-20px w-full">
              <motion.a
                whileHover={{ scale: 1.03 }}
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 cursor-pointer select-none"
              >
                <span className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Orvion
                </span>
              </motion.a>
            </div>

            {/* NAV */}
            <nav className="flex items-center justify-center w-full">
              <div className="hidden lg:flex items-center gap-10">
                {navItems.map((item, idx) => (
                  <motion.button
                    key={idx}
                    variants={itemVariants}
                    whileHover={{ y: -2, color: "#4f46e5" }}
                    onClick={() => navigate(item.path)}
                    className="text-base font-medium transition-colors cursor-pointer"
                  >
                    {item.name}
                  </motion.button>
                ))}
              </div>

              {/* MOBILE MENU */}
              <div className="lg:hidden flex items-center w-full justify-center">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setExpanded(!expanded)}
                  className="p-2 rounded-md"
                >
                  {expanded ? (
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path strokeWidth="2" strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path strokeWidth="1.6" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </motion.button>
              </div>
            </nav>

            {/* AUTH BUTTONS */}
            <div className="flex items-center justify-end w-full">
              <div className="hidden md:flex items-center gap-4 ml-auto">
                <motion.button
                  whileHover={{ y: -2 }}
                  onClick={() => navigate("/signin")}
                  className="text-base font-medium cursor-pointer text-gray-700 hover:text-gray-900 transition"
                >
                  Login
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/signup")}
                  className="px-5 py-2.5 bg-gray-900 text-white cursor-pointer rounded-xl font-semibold shadow-sm hover:bg-gray-800 transition"
                >
                  Sign up
                </motion.button>
              </div>
            </div>
          </div>

          {/* MOBILE NAV PANEL */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                variants={mobileMenuVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="lg:hidden mt-3 pb-4 w-full"
              >
                <div className="bg-white rounded-xl shadow px-5 py-5 flex flex-col items-center gap-4 w-full">
                  {navItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        navigate(item.path);
                        setExpanded(false);
                      }}
                      className="text-base font-medium text-gray-700 hover:text-gray-900 w-full text-center"
                    >
                      {item.name}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      navigate("/signin");
                      setExpanded(false);
                    }}
                    className="w-full max-w-xs py-2 border rounded-md text-gray-800"
                  >
                    Login
                  </button>

                  <button
                    onClick={() => {
                      navigate("/signup");
                      setExpanded(false);
                    }}
                    className="inline-flex items-center justify-center px-8 py-3 bg-gray-900 text-white rounded-xl font-semibold"
                  >
                    Sign up
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* HERO SECTION */}
      <main className="relative flex-1 grid grid-rows-12 w-full px-4 sm:px-6 lg:px-8 min-h-screen bg-white overflow-hidden">

        {/* 3D MODEL – FRONT, BOTTOM CENTER */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[450px] z-10 pointer-events-none flex justify-center">
          <iframe 
  src="https://my.spline.design/genkubgreetingrobot-fTOLWevCJx6fLmRqDxvDDNlG/"  
  frameBorder="0" 
  width="100%" 
  height="100%">
</iframe>

        </div>

        {/* HERO CONTENT */}
        <div className="relative z-20 row-start-2 row-end-6 flex flex-col justify-center items-center text-center pt-20">

          <motion.p
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            className="text-base sm:text-lg text-gray-600"
          >
            Empowering productivity with intelligent AI
          </motion.p>

          <motion.h1
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            className="mt-4 text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900"
          >
            <div>Transform your day</div>
            <div>
              with intelligent{" "}
              <motion.span
                style={{ display: "inline-block" }}
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] bg-clip-text text-transparent"
              >
                automation
              </motion.span>
            </div>
          </motion.h1>

          {/* CTA BUTTONS */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate("/signup")}
              className="px-8 py-3 border border-gray-500 cursor-pointer rounded-xl text-gray-900 font-medium hover:bg-gray-900 hover:text-white sm:w-auto transition"
            >
              Get Started
            </motion.button>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate("/signin")}
              className="px-8 py-3 border border-gray-500 cursor-pointer rounded-xl text-gray-900 font-medium hover:bg-gray-900 hover:text-white sm:w-auto transition"
            >
              Watch free demo
            </motion.button>
          </motion.div>
        </div>
      </main>

    </div>
    
    
    
  );
}
