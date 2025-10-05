import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiUser, FiMessageSquare, FiGrid, FiGlobe } from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';
import { IoMdCheckmarkCircleOutline } from 'react-icons/io';
import aiGif from '../assets/ai.gif';
import heroImage from '../assets/image4.png';
import featureImage1 from '../assets/image5.png';
import featureImage2 from '../assets/image6.jpeg';
import featureImage3 from '../assets/image7.jpeg';

const Landing = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#020817] text-white overflow-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#020817]/95 backdrop-blur-md py-4' : 'bg-transparent py-6'
        }`}
      >
        <div className="container mx-auto px-6 flex justify-between items-center">
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="relative">
              <img src={aiGif} alt="AI Assistant" className="w-10 h-10 rounded-full" />
              <motion.div 
                className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-75"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 0.9, 0.7] 
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              AI Assistant
            </span>
          </motion.div>
          <div className="flex items-center space-x-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/signin')}
              className="px-6 py-2 rounded-full border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
            >
              Sign In
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/signup')}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent"/>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-6"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="lg:w-1/2 space-y-8">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl lg:text-7xl font-bold leading-tight"
              >
                Your Smart
                <span className="block mt-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  AI Assistant
                </span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-300"
              >
                Experience the next generation of AI assistance with advanced natural language processing and personalized interactions.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center space-x-6"
              >
                <button 
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all text-lg flex items-center space-x-2"
                >
                  <span>Get Started Free</span>
                  <FiArrowRight className="w-5 h-5" />
                </button>
                <div className="hidden md:flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-[#020817]" />
                    ))}
                  </div>
                  <span className="text-gray-400">Trusted by 10K+ users</span>
                </div>
              </motion.div>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="lg:w-1/2 relative"
            >
              <div className="relative z-10">
                <img src={heroImage} alt="AI Assistant Demo" className="rounded-xl shadow-2xl" />
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-30" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-purple-900/10 to-transparent"/>
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Powerful Features for Your
              <span className="block mt-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Daily Tasks
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience a new level of productivity with our advanced AI features
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FiMessageSquare />}
              image={featureImage1}
              title="Natural Conversations"
              description="Advanced NLP for human-like interactions and contextual understanding."
              delay={0.2}
            />
            <FeatureCard 
              icon={<RiRobot2Line />}
              image={featureImage2}
              title="Personalized Assistant"
              description="Customize your AI companion's personality and appearance."
              delay={0.4}
            />
            <FeatureCard 
              icon={<FiGrid />}
              image={featureImage3}
              title="Multi-tasking"
              description="Handle multiple tasks efficiently with parallel processing."
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900/10 to-purple-900/10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { number: "99%", label: "User Satisfaction" },
              { number: "24/7", label: "Availability" },
              { number: "10K+", label: "Active Users" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center p-8 rounded-2xl bg-gradient-to-b from-blue-900/20 to-purple-900/20 border border-blue-900/30"
              >
                <h3 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </h3>
                <p className="text-gray-300">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="container mx-auto px-6 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Ready to Transform Your
            <span className="block mt-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Daily Productivity?
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Join thousands of satisfied users who have already upgraded their workflow with our AI assistant.
          </p>
          <motion.div 
            className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6"
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <button 
              onClick={() => navigate('/signup')}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all text-lg flex items-center space-x-2"
            >
              <span>Get Started Now</span>
              <FiArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/signin')}
              className="px-8 py-4 rounded-full border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition-all text-lg"
            >
              Learn More
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <img src={aiGif} alt="AI Assistant" className="w-8 h-8 rounded-full" />
                <span className="text-xl font-bold">AI Assistant</span>
              </div>
              <p className="text-gray-400">
                Next-generation AI assistant for your daily tasks.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Smart Conversations</li>
                <li>Customization</li>
                <li>Multi-tasking</li>
                <li>24/7 Availability</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Connect</h4>
              <div className="flex space-x-4 text-gray-400">
                <FiGlobe className="w-6 h-6" />
                <FiUser className="w-6 h-6" />
                <FiMessageSquare className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400">
              © 2025 AI Assistant. All rights reserved.
            </div>
            <div className="flex space-x-6 text-gray-400 mt-4 md:mt-0">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Cookie Policy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, image, title, description, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-blue-900/20 to-purple-900/20 p-8 hover:from-blue-900/30 hover:to-purple-900/30 transition-all duration-300"
  >
    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"/>
    <div className="relative z-10">
      <div className="text-3xl text-blue-400 mb-6">{icon}</div>
      <div className="relative rounded-xl overflow-hidden mb-6 transform group-hover:scale-105 transition-transform duration-300">
        <img src={image} alt={title} className="w-full h-48 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-transparent"/>
      </div>
      <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        {title}
      </h3>
      <p className="text-gray-300">{description}</p>
    </div>
  </motion.div>
);

export default Landing;