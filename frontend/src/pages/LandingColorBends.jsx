import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingColorBends.css";
import ai from "../assets/ai.gif";

export default function LandingColorBends() {
  const navigate = useNavigate();
  const pageRef = useRef(null);

  useEffect(() => {
    const elements = pageRef.current.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add("reveal-visible");
        });
      },
      { threshold: 0.15 }
    );
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={pageRef} className="landing-wrapper">

      {/* ================= HERO ================= */}
      <section className="hero reveal">
        <div className="hero-content">
          <h1 className="hero-title">Orvion</h1>
          <p className="hero-sub">
            AI-powered virtual assistant that executes tasks across apps and devices
          </p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={() => navigate("/signin")}>Try Now</button>
            <a href="https://github.com/HarshJadhav81/AI-Powered-Virtual-Assistant" target="_blank" rel="noreferrer" className="secondary-btn">View Source Code</a>
          </div>
        </div>
        <div className="hero-image reveal">
          <img src={ai} alt="AI Illustration" />
        </div>
      </section>
      {/* ================= FOOTER ================= */}
      <footer className="footer reveal">
        <p>Developed by Harshal Jadhav</p>
        <p>© {new Date().getFullYear()} Orvion</p>
      </footer>
    </div>
  );
}

const FeatureCard = ({ icon, title, desc, img }) => (
  <div className="card reveal">
    <img src={img} alt={title} className="card-img" />
    <div className="card-content">
      <div className="card-icon">{icon}</div>
      <h3 className="card-title">{title}</h3>
      <p className="card-desc">{desc}</p>
    </div>
  </div>
);

const StepCard = ({ step, title, desc }) => (
  <div className="card step-card reveal">
    <span className="step">{step}</span>
    <h3 className="card-title">{title}</h3>
    <p className="card-desc">{desc}</p>
  </div>
);

const PersonaCard = ({ title, bullets }) => (
  <div className="card persona-card reveal">
    <h3 className="card-title">{title}</h3>
    <ul className="persona-bullets">
      {bullets.map(b => <li key={b}>• {b}</li>)}
    </ul>
  </div>
);

const CTA = ({ title, action, href }) => (
  <div className="card cta-card reveal" onClick={action}>
    {href ? <a href={href} target="_blank" rel="noreferrer">{title}</a> : title}
  </div>
);
