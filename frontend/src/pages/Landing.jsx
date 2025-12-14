import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="relative w-full min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-2 left-0 right-0 text-center pointer-events-none">
        <h3 className="text-4xl md:text-5xl font-black text-white/5 tracking-widest">
          AI DESIGN ASSISTANT
        </h3>
      </div>
      <div className="absolute top-20 left-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-60 h-60 bg-pink-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="relative z-50 px-8 py-6">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <a href="#home" className="text-2xl font-bold text-white hover:text-purple-300 transition">
            GEN.AI
          </a>

          {/* Navigation Links */}
          <ul className="hidden md:flex items-center gap-8">
            <li>
              <a href="#features" className="text-gray-200 hover:text-white text-sm font-medium transition">
                Features
              </a>
            </li>
            <li>
              <a href="#pricing" className="text-gray-200 hover:text-white text-sm font-medium transition">
                Pricing
              </a>
            </li>
            <li>
              <a href="#demo" className="text-gray-200 hover:text-white text-sm font-medium transition">
                Demo
              </a>
            </li>
            <li>
              <a href="#about" className="text-gray-200 hover:text-white text-sm font-medium transition">
                About
              </a>
            </li>
          </ul>

          {/* Auth Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/signin')}
              className="text-gray-200 hover:text-white text-sm font-medium transition"
              aria-label="Sign In"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-purple-500/50"
              aria-label="Try Free"
            >
              Try Free
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-20 container mx-auto px-8 py-20 flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left Content - Text */}
        <article className="flex-1 max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-400/30 bg-purple-500/10 backdrop-blur-sm mb-8">
            <span className="inline-block w-2 h-2 rounded-full bg-purple-400" aria-hidden="true"></span>
            <span className="text-sm text-purple-200">AI-Powered Design Assistant</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
            Design. Faster.
            <br />
            Smarter. With
            <br />
            <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
              GEN.AI
            </span>
          </h1>

          {/* Description */}
          <p className="text-gray-200 text-lg md:text-xl leading-relaxed mb-8 max-w-xl">
            MuseAI is the next-generation AI design assistant that helps you create stunning layouts, color palettes, and prototypes in seconds — no design block, no wasted time.
          </p>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button
              onClick={() => navigate('/signup')}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-600/50"
              aria-label="Try GEN.AI Free"
            >
              <span aria-hidden="true">↗</span>
              Try GEN.AI Free
            </button>
            <button
              onClick={() => navigate('/signin')}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-transparent hover:bg-purple-500/10 text-white font-semibold rounded-xl border border-purple-400/30 transition-all duration-300"
              aria-label="Join the Waitlist"
            >
              Join the Waitlist
            </button>
          </div>

          {/* Supporting Text */}
          <p className="text-sm text-gray-300">
            No credit card required • Early access launching soon
          </p>
        </article>

        {/* Right Content - 3D Illustration */}
        <figure className="flex-1 relative h-96 lg:h-full flex items-center justify-center">
          {/* Gradient Background Circle */}
          <div 
            className="absolute w-96 h-96 rounded-full bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent blur-3xl" 
            aria-hidden="true"
          ></div>

          {/* 3D Ring Illustration */}
          <div className="relative w-64 h-64 md:w-80 md:h-80">
            <svg
              viewBox="0 0 300 300"
              className="w-full h-full drop-shadow-2xl animate-pulse"
              style={{
                filter: 'drop-shadow(0 0 60px rgba(168, 85, 247, 0.4))',
              }}
              role="img"
              aria-label="3D gradient rings illustration"
            >
              {/* SVG Definitions */}
              <defs>
                <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 0.8 }} />
                  <stop offset="25%" style={{ stopColor: '#60a5fa', stopOpacity: 0.8 }} />
                  <stop offset="50%" style={{ stopColor: '#a78bfa', stopOpacity: 0.8 }} />
                  <stop offset="75%" style={{ stopColor: '#fbbf24', stopOpacity: 0.8 }} />
                  <stop offset="100%" style={{ stopColor: '#60a5fa', stopOpacity: 0.8 }} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Outer Ring 1 */}
              <circle
                cx="150"
                cy="150"
                r="120"
                fill="none"
                stroke="url(#ringGradient)"
                strokeWidth="8"
                filter="url(#glow)"
                style={{
                  opacity: 0.9,
                  transform: 'skewY(-15deg)',
                  transformOrigin: '150px 150px',
                }}
              />

              {/* Middle Ring 2 */}
              <circle
                cx="150"
                cy="150"
                r="85"
                fill="none"
                stroke="url(#ringGradient)"
                strokeWidth="6"
                filter="url(#glow)"
                style={{
                  opacity: 0.7,
                  transform: 'skewY(-20deg)',
                  transformOrigin: '150px 150px',
                }}
              />

              {/* Inner Ring 3 */}
              <circle
                cx="150"
                cy="150"
                r="50"
                fill="none"
                stroke="url(#ringGradient)"
                strokeWidth="5"
                filter="url(#glow)"
                style={{
                  opacity: 0.5,
                  transform: 'skewY(-25deg)',
                  transformOrigin: '150px 150px',
                }}
              />
            </svg>
          </div>
          <figcaption className="sr-only">Animated 3D gradient rings with glow effect</figcaption>
        </figure>
      </section>
    </main>
  );
}
